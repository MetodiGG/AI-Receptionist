import { z } from 'zod'
import { requireUser, isPlatformAdmin } from '../../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../../lib/rate-limit'
import { placeIdSchema } from '../../../../../../lib/discovery/google-places.mjs'
import { discoveryHeaders, readBoundedJson, sameSiteRequest } from '../../../../../../lib/discovery/http.mjs'

const linkSchema = z.object({ placeId: placeIdSchema.nullable(), identityChecked: z.literal(true) }).strict()
export async function PUT(request, context) {
  const reply = (body, status) => Response.json(body, { status, headers: discoveryHeaders })
  if (!sameSiteRequest(request)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
  try {
    const user = await requireUser(request)
    if (!user) return reply({ error: { code: 'UNAUTHORIZED' } }, 401)
    if (!isPlatformAdmin(user)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
    if (!await consumeRateLimit(request, { scope: 'discovery-link', limit: 10, windowSeconds: 600, includeUserAgent: false })) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
    const id = z.string().uuid().parse((await context.params).id), input = linkSchema.parse(await readBoundedJson(request))
    const db = getSupabaseAdmin(), business = await db.from('businesses').select('id').eq('id', id).maybeSingle()
    if (business.error) throw business.error
    if (!business.data) return reply({ error: { code: 'NOT_FOUND' } }, 404)
    const result = input.placeId ? await db.from('business_place_links').upsert({ business_id: id, place_id: input.placeId, verified_by: user.id, verified_at: new Date().toISOString() }, { onConflict: 'business_id' }) : await db.from('business_place_links').delete().eq('business_id', id)
    if (result.error?.code === '23505') return reply({ error: { code: 'PLACE_ALREADY_LINKED' } }, 409)
    if (result.error) throw result.error
    return reply({ ok: true }, 200)
  } catch (error) { return reply({ error: { code: error?.name === 'ZodError' || error instanceof SyntaxError ? 'VALIDATION_ERROR' : 'SERVICE_UNAVAILABLE' } }, error?.name === 'ZodError' || error instanceof SyntaxError ? 422 : 503) }
}
