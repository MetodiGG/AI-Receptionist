import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { DateTime } from 'luxon'
import * as bookingSafety from '../lib/booking-safety.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()

async function compile(path) {
  const { code } = await transform(await readFile(new URL(path, import.meta.url), 'utf8'), {
    filename: path,
    jsc: { parser: { syntax: 'ecmascript' } },
    module: { type: 'commonjs' },
  })
  return code
}

// Keep the real schemas, time-zone arithmetic, daily/monthly slot engine and
// public response projection. Only external boundaries are replaced below.
const realDependencies = Object.fromEntries(await Promise.all([
  'availability', 'notification-copy', 'booking-intake', 'booking-safety',
  'business-location', 'booking-contact', 'public-business-query',
  'business-photos', 'business-profile', 'booking-mode', 'monthly-availability',
  'public-service-eligibility',
].map(async name => [`./${name}.mjs`, await import(`../lib/${name}.mjs`)])))
const [bookingCode, apiResponseCode, routeCode] = await Promise.all([
  compile('../lib/public-booking.js'),
  compile('../lib/api-response.js'),
  compile('../app/api/public/[slug]/bookings/route.js'),
])

function evaluate(code, dependencies, env = {}) {
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'process', code)(name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name]
    if (name === 'luxon' || name === 'zod') return require(name)
    throw new Error(`Unexpected dependency in offline booking test: ${name}`)
  }, module, module.exports, { env })
  return module.exports
}

const ids = {
  business: '10000000-0000-4000-8000-000000000001',
  service: '20000000-0000-4000-8000-000000000001',
  staff: '30000000-0000-4000-8000-000000000001',
}
const nextId = number => `40000000-0000-4000-8000-${String(number).padStart(12, '0')}`
const apiResponses = evaluate(apiResponseCode, {})

function businessFixture(patch = {}) {
  return {
    id: ids.business, slug: 'offline-native-month', name: 'Offline native-month studio',
    active: true, platform_status: 'enabled', booking_mode: 'gorez', industry: 'beauty',
    timezone: 'Europe/Sofia', booking_window_days: 60, booking_slot_minutes: 15,
    minimum_notice_minutes: 0, email_notifications_enabled: false,
    services: [{ id: ids.service, name: 'Actual service', duration_min: 30, price: 25, currency: 'EUR', active: true }],
    staff: [{ id: ids.staff, name: 'Actual specialist', active: true }],
    staffServices: [{ service_id: ids.service, staff_id: ids.staff }],
    workingHours: Array.from({ length: 7 }, (_, index) => ({
      staff_id: ids.staff, weekday: index + 1, open_time: '08:00:00', close_time: '18:00:00',
      break_start: null, break_end: null,
    })),
    ...patch,
  }
}

function createHarness({ businessPatch, env = {}, simultaneousInserts = 0 } = {}) {
  const business = businessFixture(businessPatch)
  const state = { appointments: [], customers: [], time_off: [], reads: [], writes: [], notifications: [], events: [] }
  let sequence = 0, waitingInserts = 0, releaseInserts
  const insertBarrier = simultaneousInserts ? new Promise(resolve => { releaseInserts = resolve }) : null
  const matches = (row, filters) => filters.every(([operator, field, value]) => {
    // These relation predicates are issued by the real public business reader.
    if (field === 'services.active' || field === 'staff.active') return true
    if (operator === 'eq' || operator === 'is') return row[field] === value
    if (operator === 'in') return value.includes(row[field])
    if (operator === 'lt') return Date.parse(row[field]) < Date.parse(value)
    if (operator === 'gt') return Date.parse(row[field]) > Date.parse(value)
    throw new Error(`Unexpected query operator: ${operator}`)
  })
  const overlaps = (a, b) => a.staff_id === b.staff_id
    && ['booked', 'confirmed'].includes(a.status)
    && Date.parse(a.starts_at) < Date.parse(b.ends_at)
    && Date.parse(a.ends_at) > Date.parse(b.starts_at)

  class Query {
    constructor(table) { this.table = table; this.operation = 'read'; this.filters = [] }
    select() { return this }
    order() { return this }
    limit() { return this }
    eq(field, value) { this.filters.push(['eq', field, value]); return this }
    is(field, value) { this.filters.push(['is', field, value]); return this }
    in(field, value) { this.filters.push(['in', field, value]); return this }
    lt(field, value) { this.filters.push(['lt', field, value]); return this }
    gt(field, value) { this.filters.push(['gt', field, value]); return this }
    or(value) {
      assert.match(value, /^staff_id\.is\.null,staff_id\.in\.\(/)
      return this
    }
    insert(payload) { this.operation = 'insert'; this.payload = payload; return this }
    update(payload) { this.operation = 'update'; this.payload = payload; return this }
    delete() { this.operation = 'delete'; return this }
    maybeSingle() { return this.execute(true) }
    single() { return this.execute(true) }
    then(resolve, reject) { return this.execute(false).then(resolve, reject) }
    async execute(single) {
      if (this.operation === 'read') {
        state.reads.push({ table: this.table, filters: this.filters })
        const rows = (this.table === 'businesses' ? [business] : state[this.table]).filter(row => matches(row, this.filters))
        return { data: single ? rows[0] || null : rows.map(row => ({ ...row })), count: rows.length, error: null }
      }
      state.writes.push({ table: this.table, operation: this.operation, payload: structuredClone(this.payload), filters: this.filters })
      if (this.operation === 'delete') {
        assert.equal(this.table, 'customers')
        state.customers = state.customers.filter(row => !matches(row, this.filters))
        return { data: null, error: null }
      }
      if (this.operation === 'update') {
        const row = state[this.table].find(item => matches(item, this.filters))
        Object.assign(row, this.payload)
        return { data: { ...row }, error: null }
      }
      assert.ok(['customers', 'appointments'].includes(this.table))
      if (this.table === 'appointments') {
        if (insertBarrier) {
          waitingInserts += 1
          if (waitingInserts === simultaneousInserts) releaseInserts()
          await insertBarrier
        }
        // A deterministic atomic fake models the database's 23P01 response.
        // This checks application error mapping, NOT PostgreSQL exclusion itself.
        if (state.appointments.some(row => overlaps(row, this.payload))) {
          return { data: null, error: { code: '23P01', message: 'offline simulated exclusion conflict' } }
        }
      }
      const row = { id: nextId(++sequence), ...this.payload }
      if (this.table === 'appointments') Object.assign(row, { status: 'booked', cancellation_token: nextId(++sequence) })
      state[this.table].push(row)
      return { data: { ...row }, error: null }
    }
  }

  const supabase = { from: table => {
    assert.ok(['businesses', 'appointments', 'customers', 'time_off'].includes(table), table)
    return new Query(table)
  } }
  const booking = evaluate(bookingCode, {
    ...realDependencies,
    'server-only': {},
    './analytics': { trackEvent: async value => { state.events.push(value) } },
    './notifications': { processPendingNotifications: async value => { state.notifications.push(value) } },
    './supabase-admin': { getSupabaseAdmin: () => supabase },
  }, env)
  const route = evaluate(routeCode, {
    '../../../../../lib/api-response': apiResponses,
    '../../../../../lib/public-booking': booking,
    '../../../../../lib/rate-limit': { consumeRateLimit: async () => true },
    '../../../../../lib/booking-safety.mjs': bookingSafety,
    '../../../../../lib/server-auth': { requireUser: () => assert.fail('guest booking must not require an account') },
    '../../../../../lib/supabase-admin': { getSupabaseAdmin: () => supabase },
  })
  const date = DateTime.now().setZone(business.timezone).plus({ days: 1 }).toISODate()
  const inputFor = slot => ({
    serviceId: ids.service, staffId: ids.staff,
    startsAt: DateTime.fromISO(slot.startsAt).setZone(business.timezone).toISO(),
    customer: { name: '  Offline Guest  ', phone: '+359  888 123456', email: 'guest@example.com' },
    notes: 'PRIVATE_APPOINTMENT_NOTE', intake: {}, locale: 'en', consent: true,
  })
  const monthSlot = async () => {
    const month = await booking.getMonthlyAvailableSlots({ business, serviceId: ids.service, staffId: ids.staff, month: date.slice(0, 7) })
    assert.equal(month.timezone, business.timezone)
    const slot = month.days.find(day => day.date === date)?.slots.find(item => item.localTime === '10:00')
    assert.ok(slot, 'real monthly engine must offer tomorrow at 10:00 in the business time zone')
    assert.equal(DateTime.fromISO(slot.startsAt).setZone(business.timezone).toISODate(), date)
    return slot
  }
  const post = input => route.POST(new Request(`https://gorez.test/api/public/${business.slug}/bookings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }), { params: Promise.resolve({ slug: business.slug }) })
  return { business, state, booking, date, inputFor, monthSlot, post }
}

test('month-selected guest booking uses the real schema, schedule and final daily revalidation', async () => {
  const h = createHarness(), slot = await h.monthSlot(), input = h.inputFor(slot)
  assert.equal(h.booking.bookingRequestSchema.safeParse(input).success, true)
  const result = await h.booking.createPublicBooking({ business: h.business, input })
  assert.equal(result.appointment.starts_at, slot.startsAt)
  assert.equal(result.appointment.ends_at, slot.endsAt)
  assert.equal(result.appointment.status, 'booked')
  assert.equal(result.customer.name, 'Offline Guest')
  assert.equal(result.customer.phone, '+359 888 123456')
  assert.equal(h.state.appointments.length, 1)
  assert.equal(h.state.customers.length, 1)
  const saved = h.state.appointments[0]
  assert.equal(saved.business_id, ids.business)
  assert.equal(saved.staff_id, ids.staff)
  assert.equal(saved.service_id, ids.service)
  assert.equal(saved.customer_id, result.customer.id)
  assert.equal(saved.source, 'web')
  assert.equal(saved.consent_version, '2026-10-13')
  assert.ok(DateTime.fromISO(saved.consent_at).isValid)
  assert.equal(saved.notification_locale, 'en')
  assert.equal(saved.email_notifications_requested, false)
  assert.equal(saved.email_reminders_requested, false)
  assert.equal(h.state.events.length, 1)
  assert.equal(h.state.events[0].eventType, 'booking_created')
  assert.equal(h.state.notifications.length, 0)
  assert.ok(h.state.reads.filter(query => query.table === 'appointments').length >= 2, 'monthly display is revalidated by the daily engine before insert')
})

test('real public booking route returns 201 without CRM contacts/notes or an account', async () => {
  const h = createHarness(), slot = await h.monthSlot()
  // A guest cannot spoof a different source; the real route forces web.
  const response = await h.post({ ...h.inputFor(slot), source: 'bot' })
  assert.equal(response.status, 201)
  const body = await response.json()
  assert.deepEqual(Object.keys(body.booking).sort(), ['appointment', 'service', 'staff'])
  assert.equal(body.booking.appointment.starts_at, slot.startsAt)
  assert.ok(body.booking.appointment.cancellation_token)
  assert.doesNotMatch(JSON.stringify(body), /Offline Guest|guest@example\.com|888 123456|PRIVATE_APPOINTMENT_NOTE|customer_id|consent_at/)
  assert.match(response.headers.get('cache-control'), /private, no-store/)
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
  assert.equal(h.state.appointments[0].source, 'web')
  assert.equal(h.state.notifications.length, 0)
})

test('a slot occupied after month display is rejected before customer or appointment writes', async () => {
  const h = createHarness(), slot = await h.monthSlot()
  h.state.appointments.push({ id: nextId(90), business_id: ids.business, staff_id: ids.staff, starts_at: slot.startsAt, ends_at: slot.endsAt, status: 'confirmed' })
  await assert.rejects(h.booking.createPublicBooking({ business: h.business, input: h.inputFor(slot) }), error => error.code === 'SLOT_UNAVAILABLE')
  assert.equal(h.state.writes.length, 0)
  assert.equal(h.state.customers.length, 0)
  assert.equal(h.state.events.length, 0)
  assert.equal(h.state.notifications.length, 0)
  const response = await h.post(h.inputFor(slot))
  assert.equal(response.status, 409)
  assert.equal((await response.json()).error.code, 'SLOT_UNAVAILABLE')
  assert.equal(h.state.writes.length, 0)
})

test('two simultaneous confirmations map the atomic-store 23P01 loser to SLOT_UNAVAILABLE and clean only its new customer', { timeout: 10000 }, async () => {
  const h = createHarness({ simultaneousInserts: 2 }), slot = await h.monthSlot()
  const results = await Promise.allSettled([
    h.booking.createPublicBooking({ business: h.business, input: h.inputFor(slot) }),
    h.booking.createPublicBooking({ business: h.business, input: { ...h.inputFor(slot), customer: { name: 'Second Offline Guest', phone: '+359888654321', email: 'second@example.com' } } }),
  ])
  const winner = results.find(result => result.status === 'fulfilled')
  const loser = results.find(result => result.status === 'rejected')
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(results.filter(result => result.status === 'rejected').length, 1)
  assert.equal(loser.reason.code, 'SLOT_UNAVAILABLE')
  assert.equal(h.state.writes.filter(write => write.table === 'appointments' && write.operation === 'insert').length, 2)
  assert.equal(h.state.appointments.length, 1)
  assert.equal(h.state.customers.length, 1)
  assert.equal(h.state.customers[0].id, winner.value.customer.id)
  assert.equal(h.state.appointments[0].customer_id, winner.value.customer.id)
  const cleanup = h.state.writes.filter(write => write.operation === 'delete')
  assert.equal(cleanup.length, 1)
  assert.deepEqual(cleanup[0].filters.find(filter => filter[1] === 'business_id'), ['eq', 'business_id', ids.business])
  assert.notEqual(cleanup[0].filters.find(filter => filter[1] === 'id')[2], winner.value.customer.id)
  assert.equal(h.state.events.length, 1)
  assert.equal(h.state.notifications.length, 0)
})

test('invalid guest details and absent/false consent fail the real schema before any database read or write', async () => {
  const h = createHarness()
  const startsAt = DateTime.fromISO(`${h.date}T10:00`, { zone: h.business.timezone }).toISO()
  const valid = { ...h.inputFor({ startsAt }), startsAt }
  const invalidInputs = [
    ...[{ name: '' }, { name: 'x' }, { phone: 'not-a-phone' }, { phone: '123' }, { email: '' }, { email: 'invalid' }, { email: undefined }].map(patch => ({ ...valid, customer: { ...valid.customer, ...patch } })),
    { ...valid, consent: false }, { ...valid, consent: undefined },
    { ...valid, serviceId: 'not-a-uuid' }, { ...valid, staffId: 'not-a-uuid' },
    { ...valid, startsAt: `${h.date}T10:00:00` },
  ]
  for (const input of invalidInputs) {
    assert.equal(h.booking.bookingRequestSchema.safeParse(input).success, false)
    await assert.rejects(h.booking.createPublicBooking({ business: h.business, input }), error => error.name === 'ZodError')
  }
  assert.equal(h.state.reads.length, 0)
  assert.equal(h.state.writes.length, 0)
  assert.equal(h.state.events.length, 0)
  assert.equal(h.state.notifications.length, 0)
})

test('public route maps missing consent to 422 without any customer or appointment write', async () => {
  const h = createHarness(), slot = await h.monthSlot()
  const response = await h.post({ ...h.inputFor(slot), consent: false })
  assert.equal(response.status, 422)
  assert.equal((await response.json()).error.code, 'VALIDATION_ERROR')
  assert.equal(h.state.writes.length, 0)
  assert.equal(h.state.notifications.length, 0)
})

test('disabled global or business email settings never invoke the notification boundary', async () => {
  for (const configuration of [
    { env: {}, businessPatch: { email_notifications_enabled: true } },
    { env: { EMAIL_NOTIFICATIONS_ENABLED: 'true', RESEND_API_KEY: 'OFFLINE_ONLY', EMAIL_FROM: 'offline@example.com', EMAIL_REMINDERS_ENABLED: 'true', CRON_SECRET: 'x'.repeat(32) }, businessPatch: { email_notifications_enabled: false } },
  ]) {
    const h = createHarness(configuration), slot = await h.monthSlot()
    await h.booking.createPublicBooking({ business: h.business, input: h.inputFor(slot) })
    assert.equal(h.state.appointments[0].email_notifications_requested, false)
    assert.equal(h.state.appointments[0].email_reminders_requested, false)
    assert.equal(h.state.notifications.length, 0)
  }
})
