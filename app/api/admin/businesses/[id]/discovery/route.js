import { z } from 'zod'
import { requireUser, isPlatformAdmin } from '../../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../../lib/rate-limit'
import { placeIdSchema } from '../../../../../../lib/discovery/google-places.mjs'
import { discoveryHeaders, readBoundedJson, sameSiteRequest } from '../../../../../../lib/discovery/http.mjs'
import { isSofiaDiscoveryBusiness, noPublicVisit } from '../../../../../../lib/sofia-location-scope.mjs'

const linkSchema = z.object({ placeId: placeIdSchema.nullable(), identityChecked: z.literal(true),
  locationRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) }).strict()
export async function GET(request, context) {
  const reply = (body, status = 200) => Response.json(body, { status, headers: discoveryHeaders })
  if (!sameSiteRequest(request)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
  try {
    const user = await requireUser(request)
    if (!user) return reply({ error: { code: 'UNAUTHORIZED' } }, 401)
    if (!isPlatformAdmin(user)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
    if (!await consumeRateLimit(request, { scope: 'discovery-link-read', limit: 30, windowSeconds: 60, includeUserAgent: false })) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
    const id = z.string().uuid().parse((await context.params).id), db = getSupabaseAdmin()
    const result = await db.from('businesses').select('address,city,city_ekatte,location_kind:public_profile->>location_kind,location_revision,place_link:business_place_links(place_id,verified_at,verified_by,location_revision)').eq('id', id).maybeSingle()
    if (result.error) throw result.error
    const business = result.data
    if (!business) return reply({ error: { code: 'NOT_FOUND' } }, 404)
    const data = Array.isArray(business.place_link) ? business.place_link[0] : business.place_link
    const locationRevision = Number(business.location_revision)
    const verified = Boolean(data?.verified_by && data.location_revision != null && Number(data.location_revision) === locationRevision)
    return reply({ locationRevision, address: business.address, inServiceArea: isSofiaDiscoveryBusiness(business) && !noPublicVisit(business),
      link: data ? { placeId: data.place_id, verifiedAt: data.verified_at, verified } : null })
  } catch (error) { return reply({ error: { code: error?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'SERVICE_UNAVAILABLE' } }, error?.name === 'ZodError' ? 422 : 503) }
}

export async function PUT(request, context) {
  const reply = (body, status) => Response.json(body, { status, headers: discoveryHeaders })
  if (!sameSiteRequest(request)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
  try {
    const user = await requireUser(request)
    if (!user) return reply({ error: { code: 'UNAUTHORIZED' } }, 401)
    if (!isPlatformAdmin(user)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
    if (!await consumeRateLimit(request, { scope: 'discovery-link', limit: 10, windowSeconds: 600, includeUserAgent: false })) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
    const id = z.string().uuid().parse((await context.params).id), input = linkSchema.parse(await readBoundedJson(request))
    const result = await getSupabaseAdmin().rpc('save_branch_place_link', { p_business: id, p_actor: user.id,
      p_location_revision: input.locationRevision, p_place_id: input.placeId })
    if (result.error?.code === '23505') return reply({ error: { code: 'PLACE_ALREADY_LINKED' } }, 409)
    if (result.error?.message?.includes('LOCATION_CHANGED')) return reply({ error: { code: 'LOCATION_CHANGED' } }, 409)
    if (result.error?.message?.includes('BUSINESS_NOT_FOUND')) return reply({ error: { code: 'NOT_FOUND' } }, 404)
    if (result.error?.message?.includes('OUTSIDE_SERVICE_AREA')) return reply({ error: { code: 'OUTSIDE_SERVICE_AREA' } }, 422)
    if (result.error?.message?.includes('NO_PUBLIC_VISIT_LOCATION')) return reply({ error: { code: 'OUTSIDE_SERVICE_AREA' } }, 422)
    if (result.error) throw result.error
    return reply({ ok: true }, 200)
  } catch (error) { return reply({ error: { code: error?.name === 'ZodError' || error instanceof SyntaxError ? 'VALIDATION_ERROR' : 'SERVICE_UNAVAILABLE' } }, error?.name === 'ZodError' || error instanceof SyntaxError ? 422 : 503) }
}
