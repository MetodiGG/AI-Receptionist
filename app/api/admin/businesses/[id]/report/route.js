import { requireUser, isPlatformAdmin } from '../../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../../lib/rate-limit'
import { createAdminBusinessReportHandler } from '../../../../../../lib/admin-business-report.mjs'

const checked = ({ data, error }) => { if (error) throw error; return data }
const handler = createAdminBusinessReportHandler({
  authenticate: requireUser, isAdmin: isPlatformAdmin,
  allowAttempt: (request, id) => consumeRateLimit(request, { scope: `admin-business-report:${id}`, limit: 60, windowSeconds: 60, includeUserAgent: false }),
  readBusiness: async id => checked(await getSupabaseAdmin().from('businesses').select('id,name,timezone,booking_mode').eq('id', id).maybeSingle()),
  load: async input => checked(await getSupabaseAdmin().rpc('admin_business_report', { p_business: input.businessId, p_from: input.startAt, p_until: input.endAtExclusive, p_basis: input.basis, p_status: input.status, p_view: input.view, p_page: input.page, p_page_size: input.limit })),
})
export const runtime = 'nodejs'
export const maxDuration = 15
export async function GET(request, context) { return handler(request, (await context.params).id) }
