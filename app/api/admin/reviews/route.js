import { requireUser, isPlatformAdmin } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createReviewAdminHandlers } from '../../../../lib/profile-management.mjs'
import { reviewAdminCursorFilter } from '../../../../lib/postgrest-filter-safety.mjs'

const checked = result => { if (result.error) throw result.error; return result.data }
const handlers = createReviewAdminHandlers({
  authenticate: requireUser, isAdmin: isPlatformAdmin,
  allowAttempt: (request, id) => consumeRateLimit(request, { scope: `review-admin:${id}`, limit: 60, windowSeconds: 60 }),
  list: async ({ status, before, id }) => {
    let query = getSupabaseAdmin().from('booking_reviews').select('id,rating,display_name,comment,status,revision,moderation_reason,created_at,business:businesses(name,slug)').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(51)
    if (status !== 'all') query = query.eq('status', status)
    const cursor = reviewAdminCursorFilter({ before, id })
    if (cursor) query = query.or(cursor)
    const rows = checked(await query) || [], items = rows.slice(0, 50), last = items.at(-1)
    return { items, next: rows.length > 50 ? { before: last.created_at, id: last.id } : null }
  },
  moderate: (body, actor) => getSupabaseAdmin().rpc('moderate_booking_review', { p_id: body.id, p_actor: actor, p_status: body.status, p_revision: body.revision, p_reason: body.reason }).then(checked),
})
export const GET = handlers.GET
export const PATCH = handlers.PATCH
