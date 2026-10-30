import { requireUser, isPlatformAdmin } from '../../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../../lib/rate-limit'
import { createContentHandler } from '../../../../../../lib/business-content.mjs'
import { scheduleRows } from '../../../../../../lib/business-schedule.mjs'

const handler = createContentHandler({
  authenticate: requireUser, isAdmin: isPlatformAdmin,
  allowAttempt: (request, id) => consumeRateLimit(request, { scope: `business-content:${id}`, limit: 60, windowSeconds: 3600, includeUserAgent: false }),
  save: async ({ businessId, actorId, revision, section, payload, reason }) => {
    const { error } = await getSupabaseAdmin().rpc('edit_business_content', { p_business: businessId, p_actor: actorId, p_revision: revision, p_section: section, p_payload: section === 'hours' ? { staffId: payload.staffId, hours: scheduleRows(payload.days) } : payload, p_reason: reason })
    if (error) throw error
  },
})
export async function PATCH(request, context) { return handler(request, (await context.params).id) }
