import { discoveryHeaders, sameSiteRequest } from './http.mjs'
import { normalizeInternalBusinesses } from './internal-search.mjs'
import { catalogueBusinessDetails } from './business-details.mjs'
import { approvedCatalogueRecord } from './catalogue-policy.mjs'
import { catalogueIdPattern, attachCataloguePhotos } from '../catalogue-photo-view.mjs'
import { safeBookingUrl } from '../booking-mode.mjs'
import { railPhone } from './rail.mjs'

const businessIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const PUBLIC_DETAILS_FIELDS = 'id,name,slug,active,platform_status,booking_mode,opening_hours,address,phone,city_ekatte,city,neighborhood,industry,public_profile,website_url,media_gallery_managed,media:business_media(id,staff_id,width,height,alt_text,sort_order,active,curated_src),services(id,name,description,category,price,currency,duration_min,active),staff(id),workingHours:working_hours(staff_id,weekday,open_time,close_time,break_start,break_end)'

export async function readPublishedPartnerDetails(db, id) {
  const { data, error } = await db.from('businesses').select(PUBLIC_DETAILS_FIELDS)
    .eq('id', id).eq('active', true).eq('platform_status', 'enabled').eq('services.active', true).eq('staff.active', true)
    .limit(500, { referencedTable: 'services' }).limit(40, { referencedTable: 'staff' }).limit(280, { referencedTable: 'workingHours' }).maybeSingle()
  if (error) throw error
  return data
}

function publicPartner(raw, id) {
  // Recheck publication even if an adapter unexpectedly returns an unfiltered
  // row. Test/suspended accounts and inactive menus/photos never become public.
  if (!raw || raw.id !== id || raw.active !== true || raw.platform_status !== 'enabled') return null
  const normalized = normalizeInternalBusinesses([raw], { browse: true, searchV2: true, requirements: [] }, { detailLimit: 500 })[0]
  if (!normalized) return null
  const { id: businessId, source, name, businessCategory, industry, address, photos, hours, details } = normalized
  return { id: businessId, source, name, businessCategory, industry, address, photos, hours,
    details: { ...details, sourceUrl: safeBookingUrl(raw.website_url), phone: railPhone(raw.phone) ? raw.phone : null } }
}

export function createPublicBusinessDetailsHandler(deps) {
  const reply = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { ...discoveryHeaders, ...extra } })
  return async (request, id) => {
    if (!deps.config.enabled || (!catalogueIdPattern.test(id || '') && !businessIdPattern.test(id || ''))) return reply({ error: { code: 'NOT_FOUND' } }, 404)
    if (!sameSiteRequest(request, { development: deps.config.environment === 'development' })) return reply({ error: { code: 'FORBIDDEN' } }, 403)
    try {
      if (!await deps.allowAttempt(request)) return reply({ error: { code: 'RATE_LIMITED' } }, 429, { 'Retry-After': '60' })
      let business
      if (catalogueIdPattern.test(id)) {
        const entry = approvedCatalogueRecord(await deps.findCatalogue(id), deps.now?.() ?? Date.now())
        if (!entry) return reply({ error: { code: 'NOT_FOUND' } }, 404)
        const row = { id: entry.id, source: 'catalogue', name: entry.name, category: entry.category, businessCategory: entry.category,
          address: entry.address, website: entry.website, photo: entry.photo ? { src: entry.photo.src, alt: entry.photo.alt } : null,
          details: { ...catalogueBusinessDetails(entry, deps.now?.() ?? Date.now()), phone: entry.phone } }
        // One batched photo metadata read, once on open. Storage failure must
        // not make an otherwise verified service menu unavailable.
        let photos = []
        try { photos = await deps.readCataloguePhotos?.([id]) || [] } catch { /* rights-checked static fallback only */ }
        business = attachCataloguePhotos([row], photos)[0]
      } else business = publicPartner(await deps.readPartner(id), id)
      return business ? reply({ business }) : reply({ error: { code: 'NOT_FOUND' } }, 404)
    } catch { return reply({ error: { code: 'DETAILS_UNAVAILABLE' } }, 503) }
  }
}
