import { notificationIsCurrent, buildNotificationEmail, serializeEmailPayload } from './notification-email.mjs'
import { emailDeliveryEnabled } from './booking-safety.mjs'

// Dependencies are injected so tests cannot accidentally mail a real customer.
export function createNotificationWorker({ store, env, fetcher = fetch, now = Date.now, pause = (ms) => new Promise(resolve => setTimeout(resolve, ms)) }) {
  return async function process({ appointmentId = null, limit = 10 } = {}) {
    const stats = { accepted: 0, failed: 0, skipped: 0, processed: 0 }
    if (!emailDeliveryEnabled(env)) return { ...stats, disabled: true }
    const deadline = now() + 23000
    for (let index = 0; index < Math.min(10, Math.max(1, limit)); index++) {
      if (now() >= deadline) break
      const row = await store.claim(appointmentId, env.EMAIL_REMINDERS_ENABLED === 'true' && String(env.CRON_SECRET || '').length >= 32)
      if (!row) break
      stats.processed++
      try {
        const appointment = await store.appointment(row.appointment_id)
        if (!notificationIsCurrent(row, appointment, now())) {
          await store.finish(row, { status: 'skipped', last_error: 'BOOKING_CHANGED_OR_EXPIRED' })
          stats.skipped++
          continue
        }
        let payload = row.payload
        if (!payload) {
          payload = buildNotificationEmail(row, appointment, { origin: env.NEXT_PUBLIC_APP_URL || 'https://www.gorez.co', from: env.EMAIL_FROM })
          // Freeze the exact request before sending. Provider retries must use
          // the same content, even when other business details are later edited.
          if (!await store.prepare(row, payload)) { stats.skipped++; continue }
        }
        if (!await store.current(row)) { stats.skipped++; continue }
        const response = await fetcher('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `gorez/${row.id}` },
          body: serializeEmailPayload(payload), signal: AbortSignal.timeout(5000),
        })
        if (response.ok) {
          const result = await response.json()
          if (!result?.id) throw new Error('INVALID_PROVIDER_RESPONSE')
          await store.finish(row, { status: 'sent', provider_message_id: result.id, sent_at: new Date(now()).toISOString(), last_error: null })
          stats.accepted++
        } else {
          // Do not retain response bodies: providers can echo private contents.
          const retryable = response.status === 429 || response.status >= 500 || response.status === 409
          await store.finish(row, { status: 'failed', last_error: `PROVIDER_HTTP_${response.status}`, ...(!retryable ? { attempts: 3 } : {}), scheduled_for: new Date(now() + row.attempts * 5 * 60000).toISOString() })
          stats.failed++
        }
      } catch {
        // An accepted request with a failed DB write is safe to retry with the
        // frozen payload/key, but only within the provider's idempotency window.
        await store.finish(row, { status: 'failed', last_error: 'DELIVERY_UNCONFIRMED', scheduled_for: new Date(now() + row.attempts * 5 * 60000).toISOString() })
        stats.failed++
      }
      if (index + 1 < limit) await pause(600)
    }
    return stats
  }
}
