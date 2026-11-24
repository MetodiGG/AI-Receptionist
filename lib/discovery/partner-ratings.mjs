import { z } from 'zod'
import { discoveryHeaders, readBoundedJson, sameSiteRequest } from './http.mjs'
import { placeIdSchema } from './google-places.mjs'
import { isSofiaDiscoveryBusiness, noPublicVisit } from '../sofia-location-scope.mjs'

const slugSchema = z.string().min(2).max(64).regex(/^[a-z0-9-]+$/)
const requestSchema = z.object({ locale: z.enum(['bg', 'en']) }).strict()

// A published GoRez profile and an administrator-reviewed identity link are
// required. Never infer identity from a name, address, Google rating or query.
export function verifiedPartnerPlaceLink(row, businessId) {
  return row?.business_id === businessId && z.string().uuid().safeParse(row.verified_by).success
    && Number.isFinite(Date.parse(row.verified_at)) && placeIdSchema.safeParse(row.place_id).success
    ? row.place_id : null
}

export const publicSofiaPlaceLinkFields = 'business_id,place_id,verified_by,verified_at,location_revision,business:businesses!inner(id,active,platform_status,location_revision,city_ekatte,city,address,location_kind:public_profile->>location_kind)'

// Public consumers must never bind a changed branch to an old provider
// identifier. Legacy associations remain available for admin re-review.
export function currentPublicSofiaPlaceLink(row, businessId = row?.business_id, now = Date.now()) {
  const business = row?.business
  return business?.id === businessId && business.active === true && business.platform_status === 'enabled'
    && row?.location_revision != null && business.location_revision != null
    && String(row.location_revision) === String(business.location_revision)
    && isSofiaDiscoveryBusiness(business) && !noPublicVisit(business)
    && Date.parse(row.verified_at) <= now && verifiedPartnerPlaceLink(row, businessId) ? row : null
}

export function createPartnerRatingHandler({ config, allowAttempt, readBusiness, readLink, claimBudget }) {
  const reply = (body, status = 200) => Response.json(body, { status, headers: discoveryHeaders })
  return async (request, slug) => {
    try {
      if (!sameSiteRequest(request, { development: config.environment === 'development' })) return reply({ error: { code: 'FORBIDDEN' } }, 403)
      if (!slugSchema.safeParse(slug).success) return reply({ error: { code: 'NOT_FOUND' } }, 404)
      const { locale } = requestSchema.parse(await readBoundedJson(request, 256))
      // Separate opt-in: implementing ratings must not activate billable calls.
      if (!config.enabled || !config.uiKitEnabled || !config.partnerRatingsEnabled || !config.browserKey || config.devMock) return reply({ plan: null })
      if (!await allowAttempt(request)) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
      const business = await readBusiness(slug)
      if (!business || business.active !== true || business.platform_status !== 'enabled') return reply({ plan: null })
      const placeId = verifiedPartnerPlaceLink(await readLink(business.id), business.id)
      if (!placeId) return reply({ plan: null })
      // Same durable count/cost buckets as discovery, no new quota or key.
      if (!await claimBudget('google', 'ui_rating')) return reply({ plan: null })
      return reply({ plan: { mode: 'ui_kit_rating', placeId, browserKey: config.browserKey, locale } })
    } catch (error) {
      if (error instanceof SyntaxError || error?.name === 'ZodError') return reply({ error: { code: 'VALIDATION_ERROR' } }, 422)
      // Failure must never replace an absent rating with a fabricated score.
      return reply({ plan: null })
    }
  }
}
