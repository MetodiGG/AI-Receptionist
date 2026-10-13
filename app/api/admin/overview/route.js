import { apiError, getSafeError } from '../../../../lib/api-response'
import { isPlatformAdmin, requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET(request) {
  try {
    const user = await requireUser(request)
    if (!isPlatformAdmin(user)) return apiError('Достъпът е отказан.', 403, 'FORBIDDEN')
    const supabase = getSupabaseAdmin()
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const [businessesResult, appointmentsResult, notificationsResult] = await Promise.all([
      supabase.from('businesses').select('id,name,slug,industry,active,created_at,contact_email').order('created_at', { ascending: false }),
      supabase.from('appointments').select('id,business_id,status,source,created_at').gte('created_at', since),
      supabase.from('notification_outbox').select('id,business_id,status,kind,created_at').gte('created_at', since),
    ])
    const error = businessesResult.error || appointmentsResult.error || notificationsResult.error
    if (error) throw error
    const appointments = appointmentsResult.data || []
    const notifications = notificationsResult.data || []
    const businesses = (businessesResult.data || []).map((business) => ({
      ...business,
      bookings30d: appointments.filter((item) => item.business_id === business.id).length,
      failedNotifications30d: notifications.filter((item) => item.business_id === business.id && item.status === 'failed').length,
    }))
    return Response.json({ businesses, totals: { businesses: businesses.length, active: businesses.filter((item) => item.active).length, bookings30d: appointments.length, failedNotifications30d: notifications.filter((item) => item.status === 'failed').length } })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}

