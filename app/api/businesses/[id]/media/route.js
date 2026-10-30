import { requireUser, isPlatformAdmin } from '../../../../../lib/server-auth'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { createMediaHandlers } from '../../../../../lib/media-handlers.mjs'
import { normalizeBusinessImage } from '../../../../../lib/image-normalization.mjs'
import { mediaAccess, mediaList, uploadBusinessMedia, mutateBusinessMedia, checked } from '../../../../../lib/business-media-server'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'

export const runtime = 'nodejs'
const handlers = createMediaHandlers({
  authenticate: requireUser, isAdmin: isPlatformAdmin, readAccess: mediaAccess, list: mediaList,
  ownsStaff: async (businessId,id) => Boolean(checked(await getSupabaseAdmin().from('staff').select('id').eq('id',id).eq('business_id',businessId).maybeSingle())),
  normalize: normalizeBusinessImage, upload: uploadBusinessMedia, mutate: mutateBusinessMedia,
  allowAttempt: (request, id, writing) => consumeRateLimit(request, { scope: `business-media:${id}:${writing ? 'write' : 'read'}`, limit: writing ? 30 : 120, windowSeconds: 3600, includeUserAgent: false }),
})
export async function GET(request, context) { return handlers.GET(request, (await context.params).id) }
export async function POST(request, context) { return handlers.POST(request, (await context.params).id) }
export async function PATCH(request, context) { return handlers.PATCH(request, (await context.params).id) }
