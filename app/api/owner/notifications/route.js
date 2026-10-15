import { requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { notificationAvailability } from '../../../../lib/notification-copy.mjs'
import { PRIVATE_RESPONSE_HEADERS } from '../../../../lib/booking-safety.mjs'

export async function GET(request) {
  const user = await requireUser(request)
  if (!user) return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401, headers: PRIVATE_RESPONSE_HEADERS })
  const businessId = new URL(request.url).searchParams.get('business_id')
  const { data, error } = await getSupabaseAdmin().from('businesses').select('id,email_notifications_enabled').eq('owner_id', user.id).eq('id', businessId).maybeSingle()
  if (error || !data) return Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404, headers: PRIVATE_RESPONSE_HEADERS })
  return Response.json({ notifications: notificationAvailability(process.env, data) }, { headers: PRIVATE_RESPONSE_HEADERS })
}
