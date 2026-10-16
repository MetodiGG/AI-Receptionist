import 'server-only'

import { getSupabaseAdmin } from './supabase-admin'
import { createNotificationWorker } from './notification-worker.mjs'
import { businessAddress } from './business-location.mjs'

function notificationStore() {
  const db = getSupabaseAdmin()
  const checked = ({ data, error }) => { if (error) throw error; return data }
  return {
    async claim(appointmentId, reminders) {
      const rows = checked(await db.rpc('claim_booking_email', { p_appointment_id: appointmentId, p_reminders: reminders }))
      return rows?.[0] || null
    },
    async appointment(id) {
      const data = checked(await db.from('appointments').select('id,business_id,starts_at,ends_at,status,cancellation_token,notification_revision,email_notifications_requested,email_reminders_requested,business:businesses(name,slug,active,platform_status,address,city_ekatte,city,neighborhood,timezone,contact_email,email_notifications_enabled),service:services(name),staff:staff(name),customer:customers(name,email,phone)').eq('id', id).maybeSingle())
      if (data?.business) data.business.address = businessAddress(data.business)
      return data
    },
    async prepare(row, payload) {
      return Boolean(checked(await db.from('notification_outbox').update({ payload }).eq('id', row.id).eq('claim_token', row.claim_token).eq('status', 'processing').select('id').maybeSingle()))
    },
    async current(row) {
      return Boolean(checked(await db.from('notification_outbox').select('id').eq('id', row.id).eq('claim_token', row.claim_token).eq('status', 'processing').maybeSingle()))
    },
    async finish(row, value) {
      checked(await db.from('notification_outbox').update({ ...value, locked_until: null, claim_token: null }).eq('id', row.id).eq('claim_token', row.claim_token).eq('status', 'processing'))
    },
  }
}

export async function processPendingNotifications(options) {
  return createNotificationWorker({ store: notificationStore(), env: process.env })(options)
}
