import test from 'node:test'
import assert from 'node:assert/strict'
import { bookingSlotKey, bookingStatusLabel, emailDeliveryEnabled, PRIVATE_RESPONSE_HEADERS, sameCustomerContact, toPublicBooking } from '../lib/booking-safety.mjs'
import { bookingCalendarFile } from '../lib/booking-confirmation.mjs'
import { eraseCustomerData } from '../lib/customer-erasure.mjs'
import { localizedApiMessage } from '../lib/localized-api-message.mjs'
import { groupSlotsByPeriod } from '../lib/booking-window.mjs'

test('public booking excludes CRM contact, internal notes and unrelated appointment fields', () => {
  const result = toPublicBooking({ appointment: { id: 'a', starts_at: 'start', ends_at: 'end', status: 'booked', cancellation_token: 'token', notes: 'private note', business_id: 'b' }, customer: { phone: 'private', email: 'private', notes: 'CRM secret', external_id: 'secret' }, service: { name: 'Haircut' }, staff: { name: 'Alex' } })
  assert.deepEqual(Object.keys(result).sort(), ['appointment', 'service', 'staff'])
  assert.equal(JSON.stringify(result).includes('private'), false)
  assert.equal(JSON.stringify(result).includes('secret'), false)
})

test('public contact reuse requires the entire submitted identity, not just a known phone', () => {
  const saved = { name: 'Alex', phone: '123456789', email: 'alex@example.com', notes: 'internal' }
  assert.equal(sameCustomerContact(saved, saved), true)
  assert.equal(sameCustomerContact(saved, { ...saved, name: 'Someone else' }), false)
  assert.equal(sameCustomerContact(saved, { ...saved, email: 'other@example.com' }), false)
  assert.equal(sameCustomerContact({ ...saved, email: null }, { ...saved, email: '' }), true)
})

test('owner slot selection distinguishes simultaneous appointments with different staff', () => {
  const a = { staffId: 'alex', startsAt: '2026-10-16T07:00:00Z' }
  const b = { ...a, staffId: 'sam' }
  assert.notEqual(bookingSlotKey(a), bookingSlotKey(b))
  assert.equal([a, b].find(slot => bookingSlotKey(slot) === bookingSlotKey(b)), b)
})

test('email is fail-closed even if provider credentials happen to exist', () => {
  const credentials = { RESEND_API_KEY: 'test', EMAIL_FROM: 'test@example.com' }
  assert.equal(emailDeliveryEnabled(credentials), false)
  assert.equal(emailDeliveryEnabled({ ...credentials, EMAIL_NOTIFICATIONS_ENABLED: 'false' }), false)
  assert.equal(emailDeliveryEnabled({ EMAIL_NOTIFICATIONS_ENABLED: 'true' }), false)
  assert.equal(emailDeliveryEnabled({ ...credentials, EMAIL_NOTIFICATIONS_ENABLED: 'true' }), true)
})

test('completed and no-show bookings are not described as active', () => {
  assert.equal(bookingStatusLabel('done', 'en'), 'Appointment completed')
  assert.equal(bookingStatusLabel('no_show', 'bg'), 'Отбелязано неявяване')
  assert.equal(bookingStatusLabel('cancelled', 'en'), 'Booking cancelled')
  assert.match(PRIVATE_RESPONSE_HEADERS['Cache-Control'], /no-store/)
  assert.equal(PRIVATE_RESPONSE_HEADERS['Referrer-Policy'], 'no-referrer')
})

test('EN time groups and API errors do not fall back to Bulgarian', () => {
  assert.deepEqual(groupSlotsByPeriod([{ localTime: '09:00' }, { localTime: '15:00' }, { localTime: '18:00' }], 'en').map(p => p.label), ['Morning', 'Afternoon', 'Evening'])
  assert.equal(localizedApiMessage({ code: 'SLOT_UNAVAILABLE', message: 'Този час е зает.' }, 'en').includes('Choose'), true)
  assert.equal(localizedApiMessage({ code: 'NOT_FOUND', message: 'Не е намерено' }, 'bg'), 'Не е намерено')
})

test('downloaded appointment uses UTC, escapes injection and excludes private management token', () => {
  const body = bookingCalendarFile({ appointment: { id: '123', starts_at: '2026-10-16T09:30:00+03:00', ends_at: '2026-10-16T10:00:00+03:00', cancellation_token: 'SECRET' }, businessName: 'Test; Business', serviceName: 'Service\r\nEND:VEVENT', staffName: 'Alex', address: 'Street, 1', locale: 'en', now: '2026-10-14T18:00:00Z' })
  assert.match(body, /DTSTART:20261016T063000Z/)
  assert.match(body, /DTEND:20261016T070000Z/)
  assert.match(body, /Service\\nEND:VEVENT/)
  assert.equal(body.includes('SECRET'), false)
  assert.equal(body.split('\r\n').filter(line=>line === 'END:VEVENT').length, 1)
  assert.match(body, /does not sync/)
  assert.match(body, /LOCATION:Street\\, 1/)
})

test('BG calendar lines fold by UTF-8 byte count and reject invalid dates', () => {
  const input = { appointment: { id: 'a', starts_at: '2026-10-16T09:00:00Z', ends_at: '2026-10-16T09:30:00Z' }, businessName: 'Бизнес '.repeat(30), serviceName: 'Подстригване', staffName: 'Александър', locale: 'bg' }
  for (const line of bookingCalendarFile(input).split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75)
  assert.throws(() => bookingCalendarFile({ ...input, appointment: { ...input.appointment, starts_at: 'invalid' } }))
})

function erasureDb({ failure, appointmentCount = 1 } = {}) {
  const operations = []
  const db = { from(table) {
    const op = { table, filters: [] }; operations.push(op)
    const query = {
      delete() { op.action = 'delete'; return this }, update(value) { op.action = 'update'; op.value = value; return this },
      select() { op.action ||= 'select'; return this }, eq(key, value) { op.filters.push([key, value]); return this },
      in(key, value) { op.filters.push([key, value]); return this }, order() { return this }, range(from, to) { op.range = [from, to]; return this }, maybeSingle() { op.single = true; return this },
      then(resolve, reject) {
        let data = null
        if (table === 'appointments' && op.action === 'select') data = Array.from({ length: appointmentCount }, (_, id) => ({ id: String(id) })).slice(op.range[0], op.range[1] + 1)
        if (table === 'customers' && op.action === 'update') data = { id: 'client' }
        return Promise.resolve({ data, error: table === failure ? new Error('Test failure') : null }).then(resolve, reject)
      },
    }; return query
  } }
  return { db, operations }
}

test('client erasure clears appointment intake, contact data, chat and outbox within the tenant', async () => {
  const { db, operations } = erasureDb()
  await eraseCustomerData(db, 'business-a', 'client')
  assert.ok(operations.every(op=>op.filters.some(([key,val])=>key === 'business_id' && val === 'business-a')))
  assert.ok(operations.some(op=>op.table === 'notification_outbox' && op.action === 'delete'))
  assert.ok(operations.some(op=>op.table === 'conversations' && op.action === 'delete'))
  assert.equal(operations.find(op=>op.table === 'appointments' && op.action === 'update').value.notes, null)
  assert.deepEqual(operations.find(op=>op.table === 'customers').value, { name: 'Изтрит клиент', phone: null, email: null, notes: null, external_id: null, last_seen_at: null })
})

test('client erasure paginates outbox cleanup and never reports success after a partial failure', async () => {
  const { db, operations } = erasureDb({ appointmentCount: 1201 })
  await eraseCustomerData(db, 'business-a', 'client')
  assert.equal(operations.filter(op=>op.table === 'notification_outbox').length, 3)
  const failing = erasureDb({ failure: 'notification_outbox' })
  await assert.rejects(eraseCustomerData(failing.db, 'business-a', 'client'))
  assert.equal(failing.operations.some(op=>op.table === 'customers'), false)
})
