import { z } from 'zod'
import { authorizedNotificationCron } from './notification-cron.mjs'
import { buildNotificationEmail } from './notification-email.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'

const schema = z.object({ kind: z.enum(['booking_confirmation', 'owner_new_booking', 'booking_reminder', 'booking_rescheduled', 'booking_cancelled']), locale: z.enum(['bg', 'en']) }).strict()

// Operator-only diagnostics, deliberately independent of the booking enable
// switch. The recipient is ALWAYS the configured platform sender, never input.
export function createEmailSelfTest({ env, allowAttempt, fetcher = fetch, now = Date.now }) {
  return async (request) => {
    const reply = (body, status) => Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS })
    if (!authorizedNotificationCron(request, env)) return reply({ error: { code: 'UNAUTHORIZED' } }, 401)
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return reply({ error: { code: 'VALIDATION_ERROR' } }, 422)
    const recipient = String(env.EMAIL_FROM || '').match(/<([^<>]+)>$/)?.[1] || env.EMAIL_FROM
    if (!env.RESEND_API_KEY || !z.email().safeParse(recipient).success) return reply({ error: { code: 'EMAIL_NOT_CONFIGURED' } }, 503)
    try {
      if (!await allowAttempt(request)) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
      const starts = new Date(now() + 48 * 3600000).toISOString()
      const appointment = { starts_at: starts, ends_at: new Date(Date.parse(starts) + 45 * 60000).toISOString(), cancellation_token: 'test-only', business: { name: 'GoRez EMAIL TEST', timezone: 'Europe/Sofia' }, customer: { name: 'TEST', phone: '0000000000' }, service: { name: parsed.data.locale === 'en' ? 'Test service' : 'Тестова услуга' }, staff: { name: 'TEST' } }
      const payload = buildNotificationEmail({ ...parsed.data, recipient }, appointment, { from: env.EMAIL_FROM, origin: env.NEXT_PUBLIC_APP_URL || 'https://www.gorez.co', test: true })
      const response = await fetcher('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `gorez-self-test/${new Date(now()).toISOString().slice(0, 10)}/${parsed.data.kind}/${parsed.data.locale}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(5000) })
      if (!response.ok) return reply({ error: { code: 'EMAIL_TEST_FAILED' } }, 502)
      const result = await response.json()
      if (!result.id) throw new Error('Unconfirmed')
      return reply({ accepted: true, providerId: result.id }, 202)
    } catch { return reply({ error: { code: 'EMAIL_TEST_UNCONFIRMED' } }, 503) }
  }
}
