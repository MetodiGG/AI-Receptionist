import 'server-only'

import { z } from 'zod'
import { requireUser, isPlatformAdmin } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { discoveryHeaders, sameSiteRequest } from '../../../../lib/discovery/http.mjs'
import { nativeLocationReviewPage } from '../../../../lib/native-location-review.mjs'

const SIZE = 40
const fields = 'id,name,slug,address,city,city_ekatte,neighborhood,active,platform_status,location_revision,public_profile,location_source:registration_location_sources(latitude,longitude,source_url,licence,attribution,match_version,location_revision),place_link:business_place_links(location_revision)'

export async function GET(request) {
  const reply = (body, status = 200) => Response.json(body, { status, headers: discoveryHeaders })
  if (!sameSiteRequest(request)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
  try {
    const user = await requireUser(request)
    if (!user) return reply({ error: { code: 'UNAUTHORIZED' } }, 401)
    if (!isPlatformAdmin(user)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
    if (!await consumeRateLimit(request, { scope: 'admin-location-review', limit: 30, windowSeconds: 60, includeUserAgent: false })) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
    const cursor = z.string().uuid().nullable().parse(new URL(request.url).searchParams.get('after'))
    let query = getSupabaseAdmin().from('businesses').select(fields).order('id').limit(SIZE + 1)
    if (cursor) query = query.gt('id', cursor)
    const { data, error } = await query
    if (error) throw error
    return reply(nativeLocationReviewPage(data || [], SIZE))
  } catch (error) {
    return reply({ error: { code: error?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'SERVICE_UNAVAILABLE' } }, error?.name === 'ZodError' ? 422 : 503)
  }
}
