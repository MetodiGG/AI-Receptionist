import test from 'node:test'
import assert from 'node:assert/strict'
import { buildNotificationEmail, notificationIsCurrent, serializeEmailPayload } from '../lib/notification-email.mjs'
import { notificationAvailability, notificationNotice } from '../lib/notification-copy.mjs'
import { createNotificationWorker } from '../lib/notification-worker.mjs'
import { createNotificationCron } from '../lib/notification-cron.mjs'
import { createEmailSelfTest } from '../lib/notification-self-test.mjs'

const now = Date.parse('2026-10-15T18:00:00Z')
const env = { EMAIL_NOTIFICATIONS_ENABLED: 'true', EMAIL_REMINDERS_ENABLED: 'true', RESEND_API_KEY: 'offline-test-only', EMAIL_FROM: 'GoRez <info@gorez.co>', NEXT_PUBLIC_APP_URL: 'https://www.gorez.co', CRON_SECRET: 'offline-test-only-secret-not-a-real-credential' }
const appointment = { id: 'appointment', business_id: 'business', starts_at: '2026-10-16T09:00:00Z', ends_at: '2026-10-16T09:45:00Z', status: 'confirmed', cancellation_token: 'offline-token', notification_revision: 2, email_notifications_requested: true, email_reminders_requested: true,
  business: { name: 'Test business', active: true, email_notifications_enabled: true, contact_email: 'owner@example.com', timezone: 'Europe/Sofia', address: 'Sofia', slug: 'offline-business' }, customer: { name: 'Test customer', email: 'customer@example.com', phone: '0000000000' }, service: { name: 'Haircut' }, staff: { name: 'Alex' } }
const row = { id: 'message', appointment_id: 'appointment', business_id: 'business', appointment_revision: 2, recipient: 'customer@example.com', locale: 'en', kind: 'booking_reminder', created_at: new Date(now).toISOString(), first_attempt_at: new Date(now).toISOString(), attempts: 1, claim_token: 'offline-claim' }

test('notification gates fail closed and reminders require both scheduler and explicit opt-in', () => {
  assert.deepEqual(notificationAvailability({}, appointment.business), { email: false, reminders: false })
  assert.deepEqual(notificationAvailability({ ...env, EMAIL_NOTIFICATIONS_ENABLED: 'false' }, appointment.business), { email: false, reminders: false })
  assert.deepEqual(notificationAvailability({ ...env, EMAIL_REMINDERS_ENABLED: 'false' }, appointment.business), { email: true, reminders: false })
  assert.deepEqual(notificationAvailability({ ...env, CRON_SECRET: '' }, appointment.business), { email: true, reminders: false })
  assert.deepEqual(notificationAvailability(env, appointment.business), { email: true, reminders: true })
  assert.deepEqual(notificationAvailability(env, { email_notifications_enabled: false }), { email: false, reminders: false })
})

test('both languages distinguish disabled email, confirmation attempts and optional reminders', () => {
  assert.match(notificationNotice({}, 'en'), /not enabled/)
  assert.match(notificationNotice({ email: true }, 'en'), /attempt/)
  assert.doesNotMatch(notificationNotice({ email: true }, 'en'), /24 hours/)
  assert.match(notificationNotice({ email: true, reminders: true }, 'en'), /24 hours/)
  assert.match(notificationNotice({}, 'bg'), /не са включени/)
  assert.match(notificationNotice({ email: true }, 'bg'), /опитаме/)
})

test('all five email types render BG/EN, Sofia times, a plain-text alternative and language-preserving new-domain links', () => {
  for (const locale of ['bg', 'en']) for (const kind of ['booking_confirmation', 'booking_reminder', 'booking_cancelled', 'booking_rescheduled', 'owner_new_booking']) {
    const message = buildNotificationEmail({ ...row, locale, kind }, appointment, { origin: env.NEXT_PUBLIC_APP_URL, from: env.EMAIL_FROM })
    assert.match(message.html, new RegExp(`<html lang="${locale}">`))
    assert.match(message.text, /12:00–12:45 \(Europe\/Sofia\)/)
    assert.match(message.text, new RegExp(`https://www.gorez.co/${kind === 'owner_new_booking' ? 'dashboard/appointments' : 'booking/offline-token'}\\?lang=${locale}`))
    assert.equal(message.from, env.EMAIL_FROM)
    assert.equal(message.reply_to, appointment.business.contact_email)
    assert.equal(message.html.includes('ai-receptionist-beta-six'), false)
    if (locale === 'en') assert.doesNotMatch(message.html, /[А-Яа-я]/)
    if (kind === 'owner_new_booking') assert.equal(message.html.includes('offline-token'), false)
  }
})

test('email escapes customer controlled markup, header newlines and private notes', () => {
  const message = buildNotificationEmail({ ...row, kind: 'owner_new_booking' }, { ...appointment, notes: 'CRM SECRET', business: { ...appointment.business, name: '<img onerror=alert(1)>\r\nBcc: attacker@example.com' }, service: { name: '<script>bad()</script>' } }, { origin: env.NEXT_PUBLIC_APP_URL, from: env.EMAIL_FROM })
  assert.equal(message.html.includes('<script>'), false)
  assert.equal(message.html.includes('<img'), false)
  assert.equal(message.html.includes('CRM SECRET'), false)
  assert.doesNotMatch(message.subject, /[\r\n]/)
  assert.throws(() => buildNotificationEmail(row, appointment, { origin: 'javascript:alert(1)', from: env.EMAIL_FROM }))
})

test('delivery revalidation rejects stale, cancelled, past, anonymized, cross-business and disabled appointments', () => {
  assert.equal(notificationIsCurrent(row, appointment, now), true)
  for (const patch of [{ notification_revision: 3 }, { status: 'cancelled' }, { status: 'done' }, { status: 'no_show' }, { starts_at: '2026-10-15T17:00:00Z' }, { business_id: 'other' }, { email_notifications_requested: false }, { email_reminders_requested: false }, { customer: { email: null } }, { business: { ...appointment.business, active: false } }, { business: { ...appointment.business, email_notifications_enabled: false } }]) {
    assert.equal(notificationIsCurrent(row, { ...appointment, ...patch }, now), false, JSON.stringify(patch))
  }
  assert.equal(notificationIsCurrent(row, null, now), false)
  assert.equal(notificationIsCurrent({ ...row, first_attempt_at: new Date(now - 24 * 3600000).toISOString() }, appointment, now), false)
  assert.equal(notificationIsCurrent({ ...row, kind: 'booking_confirmation', created_at: new Date(now - 7 * 3600000).toISOString() }, appointment, now), false)
  assert.equal(notificationIsCurrent({ ...row, kind: 'booking_cancelled' }, { ...appointment, status: 'cancelled' }, now), true)
  assert.equal(notificationIsCurrent({ ...row, kind: 'owner_new_booking', recipient: 'owner@example.com' }, appointment, now), true)
})

function harness({ rows = [structuredClone(row)], current = appointment, response, prepare = true, validClaim = true, failedFinish = false, overrides = {} } = {}) {
  const sent = [], writes = [], claims = []
  const store = {
    async claim(id, reminders) { claims.push({ id, reminders }); return rows.shift() || null },
    async appointment() { return current },
    async prepare(value, payload) { writes.push({ prepared: structuredClone(payload) }); return prepare },
    async current() { return validClaim },
    async finish(value, patch) { writes.push(patch); if (failedFinish && patch.status === 'sent') throw new Error('private DB error') },
  }
  const run = createNotificationWorker({ store, env: { ...env, ...overrides }, now: () => now, pause: async () => {}, fetcher: async (url, request) => { sent.push({ url, request }); if (response instanceof Error) throw response; return response || Response.json({ id: 'offline-provider-id' }) } })
  return { run, sent, writes, claims }
}

test('disabled worker never touches queue or provider; reminder processing is separately gated', async () => {
  const h = harness({ overrides: { EMAIL_NOTIFICATIONS_ENABLED: 'false' } })
  assert.equal((await h.run()).disabled, true)
  assert.equal(h.sent.length, 0); assert.equal(h.claims.length, 0)
  const off = harness({ rows: [], overrides: { EMAIL_REMINDERS_ENABLED: 'false' } })
  await off.run(); assert.equal(off.claims[0].reminders, false)
})

test('worker freezes payload, uses provider idempotency and records acceptance only after success', async () => {
  const h = harness()
  assert.deepEqual(await h.run({ appointmentId: 'appointment' }), { processed: 1, accepted: 1, failed: 0, skipped: 0 })
  assert.equal(h.sent[0].request.headers['Idempotency-Key'], 'gorez/message')
  assert.equal(h.sent[0].url, 'https://api.resend.com/emails')
  assert.deepEqual(JSON.parse(h.sent[0].request.body), h.writes[0].prepared)
  assert.equal(h.writes[1].provider_message_id, 'offline-provider-id')
})

test('worker skips stale snapshots and invalidated claims without sending', async () => {
  for (const options of [{ current: { ...appointment, notification_revision: 9 } }, { prepare: false }, { validClaim: false }]) {
    const h = harness(options); await h.run(); assert.equal(h.sent.length, 0)
  }
})

test('retry uses the identical persisted payload and stable provider key', async () => {
  const payload = { from: env.EMAIL_FROM, to: [row.recipient], subject: 'Frozen', html: '<p>Frozen</p>', text: 'Frozen' }
  const h = harness({ rows: [{ ...row, payload, attempts: 2 }] })
  await h.run()
  assert.equal(h.writes.some(p => p.prepared), false)
  assert.deepEqual(JSON.parse(h.sent[0].request.body), payload)
  assert.equal(h.sent[0].request.headers['Idempotency-Key'], 'gorez/message')
  const jsonbOrder = Object.fromEntries(Object.entries(payload).reverse())
  assert.equal(serializeEmailPayload(jsonbOrder), serializeEmailPayload(payload))
})

test('429 and network errors retry with backoff; permanent failures stop and private errors are not retained', async () => {
  for (const response of [new Error('private token secret'), new Response('private provider body', { status: 429 }), new Response('private provider body', { status: 503 })]) {
    const h = harness({ response }); const result = await h.run()
    assert.equal(result.failed, 1)
    assert.equal(h.writes.at(-1).scheduled_for, new Date(now + 5 * 60000).toISOString())
    assert.doesNotMatch(JSON.stringify(h.writes), /private provider body|private token secret/)
  }
  const permanent = harness({ response: new Response('private', { status: 401 }) })
  await permanent.run(); assert.equal(permanent.writes.at(-1).attempts, 3)
  const ambiguous = harness({ failedFinish: true }); assert.equal((await ambiguous.run()).failed, 1)
  assert.equal(ambiguous.writes.at(-1).last_error, 'DELIVERY_UNCONFIRMED')
})

test('cron requires a strong exact bearer secret, never leaks errors and disables caching', async () => {
  let called = 0
  const handler = createNotificationCron({ env, process: async () => { called++; return { accepted: 0 } } })
  for (const authorization of ['', 'Bearer invalid', `Bearer ${env.CRON_SECRET}extra`]) {
    assert.equal((await handler(new Request('https://www.gorez.co/api/cron/notifications', { headers: { authorization } }))).status, 401)
  }
  assert.equal(called, 0)
  const response = await handler(new Request('https://www.gorez.co/api/cron/notifications', { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }))
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/)
  const failing = createNotificationCron({ env, process: async () => { throw new Error('private database details') } })
  const failure = await failing(new Request('https://www.gorez.co/api/cron/notifications', { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }))
  assert.equal(failure.status, 503); assert.equal((await failure.text()).includes('private'), false)
})

test('operator self-test needs scheduler authentication and cannot target arbitrary recipients or real bookings', async () => {
  const sent = []
  let allowed = 0
  const handler = createEmailSelfTest({ env: { ...env, EMAIL_NOTIFICATIONS_ENABLED: 'false' }, now: () => now,
    allowAttempt: async () => { allowed++; return true }, fetcher: async (_url, options) => { sent.push(options); return Response.json({ id: 'offline-test-id' }) } })
  const request = (body, authenticated = true) => new Request('https://www.gorez.co/api/cron/notifications/test', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: `Bearer ${env.CRON_SECRET}` } : {}) }, body: JSON.stringify(body) })
  assert.equal((await handler(request({ kind: 'booking_confirmation', locale: 'en' }, false))).status, 401)
  assert.equal((await handler(request({ kind: 'booking_confirmation', locale: 'en', recipient: 'attacker@example.com' }))).status, 422)
  assert.equal((await handler(request({ kind: 'booking_confirmation', locale: 'en', appointmentId: 'real-booking' }))).status, 422)
  assert.equal(sent.length, 0); assert.equal(allowed, 0)
  const result = await handler(request({ kind: 'booking_confirmation', locale: 'en' }))
  assert.equal(result.status, 202)
  const payload = JSON.parse(sent[0].body)
  assert.deepEqual(payload.to, ['info@gorez.co'])
  assert.match(payload.subject, /^\[TEST\]/)
  assert.match(payload.text, /No real appointment was created/)
  assert.equal(payload.html.includes('/booking/test-only'), false)
  assert.match(sent[0].headers['Idempotency-Key'], /2026-10-15\/booking_confirmation\/en$/)
  const blocked = createEmailSelfTest({ env, allowAttempt: async () => false, fetcher: async () => { throw new Error('Should not send') } })
  assert.equal((await blocked(request({ kind: 'booking_reminder', locale: 'bg' }))).status, 429)
})
