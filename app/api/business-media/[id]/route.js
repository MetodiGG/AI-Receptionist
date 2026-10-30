import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { requireUser, isPlatformAdmin } from '../../../../lib/server-auth'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { MEDIA_BUCKET } from '../../../../lib/business-media.mjs'
import { createMediaImageHandler } from '../../../../lib/media-handlers.mjs'
import { getCuratedBusinessPhoto } from '../../../../lib/business-photos.mjs'

export const runtime = 'nodejs'
const handler = createMediaImageHandler({
  authenticate: requireUser, isAdmin: isPlatformAdmin,
  allowAttempt: request => consumeRateLimit(request, { scope: 'business-media-view', limit: 240, windowSeconds: 60, includeUserAgent: false }),
  read: async id => {
    const db = getSupabaseAdmin()
    const result = await db.from('business_media').select('business_id,staff_id,object_key,active,curated_src').eq('id', id).maybeSingle()
    if (result.error || !result.data) return null
    const m = result.data, b = await db.from('businesses').select('id,owner_id,active,platform_status').eq('id', m.business_id).maybeSingle()
    if (b.error || !b.data) return null
    const person = m.staff_id ? await db.from('staff').select('active').eq('id', m.staff_id).eq('business_id', m.business_id).maybeSingle() : null
    return { media: m, business: b.data, staffActive: Boolean(person && !person.error && person.data?.active) }
  },
  resolveCurated: (businessId, source) => getCuratedBusinessPhoto(businessId, source)?.src,
  download: async key => { const { data, error } = await getSupabaseAdmin().storage.from(MEDIA_BUCKET).download(key); return error ? null : data },
})
export async function GET(request, context) { return handler(request, (await context.params).id) }
