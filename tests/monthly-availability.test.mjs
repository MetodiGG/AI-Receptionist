import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { getSafeError } from '../lib/api-response.js'
import { buildAvailableSlots } from '../lib/availability.mjs'
import { buildMonthlyAvailability, createMonthlyAvailabilityHandler, readMonthlyAvailableSlots } from '../lib/monthly-availability.mjs'
import { readBookableBusiness } from '../lib/public-business-query.mjs'

const BUSINESS = '10000000-0000-4000-8000-000000000001'
const SERVICE = '20000000-0000-4000-8000-000000000001'
const OTHER_SERVICE = '20000000-0000-4000-8000-000000000002'
const STAFF = '30000000-0000-4000-8000-000000000001'
const OTHER_STAFF = '30000000-0000-4000-8000-000000000002'
const NOW = '2026-10-18T08:00:00.000Z'

function business(overrides = {}) {
  return {
    id: BUSINESS, slug: 'real-salon', booking_mode: 'gorez', timezone: 'Europe/Sofia',
    booking_window_days: 60, minimum_notice_minutes: 0, booking_slot_minutes: 30,
    services: [{ id: SERVICE, name: 'Подстригване', duration_min: 30 }],
    staff: [{ id: STAFF, name: 'Мая' }], staffServices: [],
    workingHours: Array.from({ length: 7 }, (_, index) => ({
      staff_id: STAFF, weekday: index + 1, open_time: '09:00:00', close_time: '12:00:00',
    })),
    ...overrides,
  }
}

function selection(overrides = {}) {
  return { business: business(), serviceId: SERVICE, month: '2026-10', now: NOW, ...overrides }
}

function day(result, date = '2026-10-19') {
  return result.days.find((item) => item.date === date)
}

function range(date, open, close, overrides = {}) {
  const utc = (time) => DateTime.fromISO(`${date}T${time}`, { zone: 'Europe/Sofia' }).toUTC().toISO()
  return { business_id: BUSINESS, staff_id: STAFF, status: 'booked', starts_at: utc(open), ends_at: utc(close), ...overrides }
}

// An in-memory, thenable query builder: no credentials, HTTP, or real database.
function database({ profile = business(), appointments = [], time_off = [], errors = {}, counts = {} } = {}) {
  const queries = []
  return {
    queries,
    client: {
      from(table) {
        const query = { table, operations: [] }
        queries.push(query)
        function result() {
          if (errors[table]) return { data: null, error: errors[table] }
          if (table === 'businesses') return { data: profile, error: null }
          let rows = table === 'appointments' ? appointments : time_off
          for (const [method, column, value] of query.operations) {
            if (method === 'eq') rows = rows.filter((row) => row[column] === value)
            if (method === 'in') rows = rows.filter((row) => value.includes(row[column]))
            if (method === 'lt') rows = rows.filter((row) => row[column] < value)
            if (method === 'gt') rows = rows.filter((row) => row[column] > value)
            if (method === 'or') {
              const ids = column.match(/staff_id\.in\.\(([^)]*)\)/)[1].split(',')
              rows = rows.filter((row) => row.staff_id === null || ids.includes(row.staff_id))
            }
          }
          return { data: rows, error: null, count: Object.hasOwn(counts, table) ? counts[table] : rows.length }
        }
        const builder = {
          then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject) },
          maybeSingle() { return Promise.resolve(result()) },
        }
        for (const method of ['select', 'eq', 'in', 'or', 'lt', 'gt', 'order']) {
          builder[method] = (...args) => { query.operations.push([method, ...args]); return builder }
        }
        return builder
      },
    },
  }
}

function request(query = `service_id=${SERVICE}&month=2026-10`) {
  return new Request(`https://gorez.test/api/public/real-salon/availability/month?${query}`)
}

function handlerDependencies(overrides = {}) {
  return {
    consumeRateLimit: async () => true,
    getPublicBusiness: async () => business(),
    getMonthlyAvailableSlots: (input) => buildMonthlyAvailability({ ...input, now: NOW }),
    getSafeError,
    ...overrides,
  }
}

const context = { params: Promise.resolve({ slug: 'real-salon' }) }

test('returns every real calendar date, including leap years and a December/January horizon', () => {
  for (const [month, now, length] of [
    ['2027-02', '2027-02-01T06:00:00Z', 28],
    ['2028-02', '2028-02-01T06:00:00Z', 29],
    ['2026-12', '2026-12-18T06:00:00Z', 31],
    ['2027-01', '2026-12-18T06:00:00Z', 31],
  ]) {
    const result = buildMonthlyAvailability(selection({ month, now }))
    assert.equal(result.days.length, length)
    assert.equal(result.days[0].date, `${month}-01`)
    assert.equal(result.days.at(-1).date, `${month}-${length}`)
    assert.equal(new Set(result.days.map((item) => item.date)).size, length)
  }
})

test('uses the server horizon inclusively, not a fourteen-day cap, and empties dates outside it', () => {
  const result = buildMonthlyAvailability(selection({ business: business({ booking_window_days: 20 }) }))
  assert.equal(result.today, '2026-10-18')
  assert.equal(result.firstBookableDate, '2026-10-18')
  assert.equal(result.lastBookableDate, '2026-11-07')
  assert.deepEqual(day(result, '2026-10-17').slots, [])
  assert.ok(day(result, '2026-10-31').slots.length)
  const november = buildMonthlyAvailability(selection({ business: business({ booking_window_days: 20 }), month: '2026-11' }))
  assert.ok(day(november, '2026-11-07').slots.length)
  assert.deepEqual(day(november, '2026-11-08').slots, [])
})

test('defaults to sixty days and Europe/Sofia, including a business-local midnight', () => {
  const result = buildMonthlyAvailability(selection({
    business: business({ timezone: null, booking_window_days: null }), now: '2026-10-18T22:30:00Z',
  }))
  assert.equal(result.timezone, 'Europe/Sofia')
  assert.equal(result.today, '2026-10-19')
  assert.equal(result.lastBookableDate, '2026-12-18')
  assert.equal(result.generatedAt, '2026-10-18T22:30:00.000Z')
})

test('reuses the exact authoritative daily slots for each day with breaks and busy ranges', () => {
  const profile = business({ workingHours: business().workingHours.map((period) => ({ ...period, break_start: '10:00:00', break_end: '10:30:00' })) })
  const appointments = [range('2026-10-19', '09:15', '09:45')]
  const timeOff = [range('2026-10-20', '11:00', '11:30', { staff_id: null })]
  const result = buildMonthlyAvailability(selection({ business: profile, appointments, timeOff }))
  for (const item of result.days) {
    const expected = buildAvailableSlots({
      date: item.date, zone: profile.timezone, durationMinutes: 30, slotMinutes: 30,
      minimumNoticeMinutes: 0, now: NOW, staff: profile.staff,
      workingHours: profile.workingHours, appointments, timeOff,
    })
    assert.deepEqual(item.slots, expected)
  }
  assert.deepEqual(day(result).slots.map((slot) => slot.localTime), ['10:30', '11:00', '11:30'])
})

test('applies exact current time and minimum notice once across the month, with no stale snapshot', () => {
  const profile = business({ minimum_notice_minutes: 60 })
  const early = buildMonthlyAvailability(selection({ business: profile, now: '2026-10-19T06:30:00Z' }))
  assert.deepEqual(day(early).slots.map((slot) => slot.localTime), ['10:30', '11:00', '11:30'])
  const later = buildMonthlyAvailability(selection({ business: profile, now: '2026-10-19T08:01:00Z' }))
  assert.deepEqual(day(later).slots, [])
  assert.notEqual(early.generatedAt, later.generatedAt)
})

test('closed days and partial gaps shorter than the selected service never become available', () => {
  const profile = business({
    services: [{ id: SERVICE, duration_min: 60 }], booking_slot_minutes: 15,
    workingHours: [{ staff_id: STAFF, weekday: 1, open_time: '09:00:00', close_time: '12:00:00' }],
  })
  const appointments = [range('2026-10-19', '09:00', '09:45'), range('2026-10-19', '10:15', '11:00'), range('2026-10-19', '11:30', '12:00')]
  const result = buildMonthlyAvailability(selection({ business: profile, appointments }))
  assert.deepEqual(day(result).slots, [])
  assert.deepEqual(day(result, '2026-10-20').slots, [])
})

test('breaks and staff-specific or business-wide time off remove overlapping complete slots', () => {
  const profile = business({ workingHours: business().workingHours.map((period) => ({ ...period, break_start: '10:00:00', break_end: '10:30:00' })) })
  const timeOff = [range('2026-10-19', '11:00', '11:30', { staff_id: null }), range('2026-10-19', '09:00', '09:30')]
  const result = buildMonthlyAvailability(selection({ business: profile, timeOff }))
  assert.deepEqual(day(result).slots.map((slot) => slot.localTime), ['09:30', '10:30', '11:30'])
})

test('day prefiltering keeps cross-midnight appointments and business-wide absences on both dates', () => {
  const appointments = [{ staff_id: STAFF, starts_at: '2026-10-18T20:30:00Z', ends_at: '2026-10-19T06:30:00Z' }]
  const timeOff = [{ staff_id: null, starts_at: '2026-10-19T08:00:00Z', ends_at: '2026-10-20T06:30:00Z' }]
  const result = buildMonthlyAvailability(selection({ appointments, timeOff }))
  assert.deepEqual(day(result).slots.map((slot) => slot.localTime), ['09:30', '10:00', '10:30'])
  assert.deepEqual(day(result, '2026-10-20').slots.map((slot) => slot.localTime), ['09:30', '10:00', '10:30', '11:00', '11:30'])
})

test('staff mappings are authoritative; no mappings means all active business staff', () => {
  const profile = business({
    staff: [...business().staff, { id: OTHER_STAFF, name: 'Зара' }],
    workingHours: [...business().workingHours, ...business().workingHours.map((period) => ({ ...period, staff_id: OTHER_STAFF }))],
  })
  const all = buildMonthlyAvailability(selection({ business: profile }))
  assert.deepEqual(new Set(day(all).slots.map((slot) => slot.staffId)), new Set([STAFF, OTHER_STAFF]))
  const mapped = { ...profile, staffServices: [{ service_id: SERVICE, staff_id: STAFF }] }
  assert.deepEqual(new Set(day(buildMonthlyAvailability(selection({ business: mapped }))).slots.map((slot) => slot.staffId)), new Set([STAFF]))
  assert.throws(() => buildMonthlyAvailability(selection({ business: mapped, staffId: OTHER_STAFF })), { code: 'VALIDATION_ERROR' })
  const selected = buildMonthlyAvailability(selection({ business: profile, staffId: OTHER_STAFF }))
  assert.deepEqual(new Set(day(selected).slots.map((slot) => slot.staffId)), new Set([OTHER_STAFF]))
})

test('queries one business and exactly two monthly busy tables, scoped by business, staff and active booking status', async () => {
  const db = database({ appointments: [
    range('2026-10-19', '09:00', '09:30'),
    range('2026-10-19', '09:30', '10:00', { status: 'confirmed' }),
    range('2026-10-19', '10:00', '10:30', { status: 'cancelled' }),
    range('2026-10-19', '10:30', '11:00', { business_id: 'another-business' }),
    range('2026-10-19', '11:00', '11:30', { staff_id: OTHER_STAFF }),
  ], time_off: [
    range('2026-10-19', '11:00', '11:30', { staff_id: null }),
    range('2026-10-19', '11:30', '12:00', { staff_id: OTHER_STAFF }),
    range('2026-10-19', '10:00', '10:30', { staff_id: null, business_id: 'another-business' }),
  ] })
  const handler = createMonthlyAvailabilityHandler(handlerDependencies({
    getPublicBusiness: (slug) => readBookableBusiness(db.client, slug),
    getMonthlyAvailableSlots: (input) => readMonthlyAvailableSlots({ ...input, supabase: db.client, now: NOW }),
  }))
  const response = await handler(request(), context)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control'), /private, no-store/)
  assert.match(response.headers.get('server-timing'), /rate_limit;.*business;.*availability;/)
  const result = await response.json()
  assert.equal(result.days.length, 31)
  assert.deepEqual(day(result).slots.map((slot) => slot.localTime), ['10:00', '10:30', '11:30'])
  assert.deepEqual(db.queries.map((query) => query.table), ['businesses', 'appointments', 'time_off'])
  const appointments = db.queries[1].operations
  assert.ok(appointments.some((op) => JSON.stringify(op) === JSON.stringify(['eq', 'business_id', BUSINESS])))
  assert.ok(appointments.some((op) => JSON.stringify(op) === JSON.stringify(['in', 'staff_id', [STAFF]])))
  assert.ok(appointments.some((op) => JSON.stringify(op) === JSON.stringify(['in', 'status', ['booked', 'confirmed']])))
  assert.ok(db.queries[2].operations.some((op) => op[0] === 'or' && op[1] === `staff_id.is.null,staff_id.in.(${STAFF})`))
  assert.ok(db.queries[2].operations.some((op) => op[0] === 'eq' && op[1] === 'business_id' && op[2] === BUSINESS))
  assert.deepEqual(Object.keys(day(result).slots[0]), ['startsAt', 'endsAt', 'localTime', 'localEndTime', 'staffId', 'staffName'])
})

test('monthly UTC range and slots follow both Europe/Sofia daylight-saving transitions', async () => {
  for (const [month, now, start, end, before, after] of [
    ['2026-03', '2026-03-01T06:00:00Z', '2026-02-28T22:00:00.000Z', '2026-03-31T21:00:00.000Z', '2026-03-28', '2026-03-29'],
    ['2026-10', '2026-10-01T06:00:00Z', '2026-09-30T21:00:00.000Z', '2026-10-31T22:00:00.000Z', '2026-10-24', '2026-10-25'],
  ]) {
    const db = database()
    const result = await readMonthlyAvailableSlots(selection({ supabase: db.client, month, now }))
    for (const query of db.queries) {
      assert.ok(query.operations.some((op) => op[0] === 'gt' && op[1] === 'ends_at' && op[2] === start))
      assert.ok(query.operations.some((op) => op[0] === 'lt' && op[1] === 'starts_at' && op[2] === end))
    }
    const beforeSlot = day(result, before).slots[0]
    const afterSlot = day(result, after).slots[0]
    assert.equal(beforeSlot.localTime, '09:00')
    assert.equal(afterSlot.localTime, '09:00')
    assert.notEqual(beforeSlot.startsAt.slice(11, 16), afterSlot.startsAt.slice(11, 16))
  }
})

test('rejects malformed selections before business or busy queries', async () => {
  let calls = 0
  const handler = createMonthlyAvailabilityHandler(handlerDependencies({
    consumeRateLimit: async () => { calls++; return true },
    getPublicBusiness: async () => { calls++; return business() },
  }))
  for (const query of [
    `month=2026-10`, `service_id=${SERVICE}`, `service_id=not-a-uuid&month=2026-10`,
    `service_id=${SERVICE}&month=2026-13`, `service_id=${SERVICE}&month=2026-1`,
    `service_id=${SERVICE}&month=2026-10-01`, `service_id=${SERVICE}&month=2026-10&staff_id=`,
    `service_id=${SERVICE}&month=2026-10&staff_id=not-a-uuid`,
  ]) {
    const response = await handler(request(query), context)
    assert.equal(response.status, 422)
    assert.equal((await response.json()).error.code, 'VALIDATION_ERROR')
  }
  assert.equal((await handler(request(), { params: Promise.resolve({ slug: '../../invalid' }) })).status, 422)
  assert.equal(calls, 0)
})

test('rejects past/out-of-horizon months, unknown selections and mismatched staff before busy queries', async () => {
  const db = database()
  const profile = business({
    staff: [...business().staff, { id: OTHER_STAFF, name: 'Зара' }],
    staffServices: [{ service_id: SERVICE, staff_id: STAFF }],
  })
  for (const input of [
    { month: '2026-09' }, { month: '2027-01' }, { serviceId: OTHER_SERVICE },
    { staffId: '30000000-0000-4000-8000-000000000099' }, { staffId: OTHER_STAFF },
  ]) {
    await assert.rejects(readMonthlyAvailableSlots(selection({ supabase: db.client, business: profile, ...input })), { code: 'VALIDATION_ERROR' })
  }
  assert.equal(db.queries.length, 0)
})

test('external booking businesses are rejected before any calendar queries', async () => {
  const db = database()
  const profile = business({ booking_mode: 'external' })
  await assert.rejects(readMonthlyAvailableSlots(selection({ business: profile, supabase: db.client })), { code: 'EXTERNAL_BOOKING' })
  assert.equal(db.queries.length, 0)
  let availabilityCalls = 0
  const handler = createMonthlyAvailabilityHandler(handlerDependencies({
    getPublicBusiness: async () => profile,
    getMonthlyAvailableSlots: async () => { availabilityCalls++ },
  }))
  const response = await handler(request(), context)
  assert.equal(response.status, 409)
  assert.equal((await response.json()).error.code, 'EXTERNAL_BOOKING')
  assert.equal(availabilityCalls, 0)
})

test('rate limits before a business lookup and returns non-cacheable errors', async () => {
  const events = []
  const handler = createMonthlyAvailabilityHandler(handlerDependencies({
    consumeRateLimit: async (_request, options) => { events.push('rate'); assert.equal(options.scope, 'availability-month:real-salon'); return false },
    getPublicBusiness: async () => { events.push('business'); return business() },
  }))
  const response = await handler(request(), context)
  assert.equal(response.status, 429)
  assert.equal((await response.json()).error.code, 'RATE_LIMITED')
  assert.match(response.headers.get('cache-control'), /no-store/)
  assert.deepEqual(events, ['rate'])
})

test('missing businesses return 404, while database failures never expose private details', async () => {
  const missing = createMonthlyAvailabilityHandler(handlerDependencies({ getPublicBusiness: async () => null }))
  assert.equal((await missing(request(), context)).status, 404)
  const failure = createMonthlyAvailabilityHandler(handlerDependencies({
    getMonthlyAvailableSlots: async () => { throw new Error('postgres password=private table=appointments') },
  }))
  const response = await failure(request(), context)
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: { code: 'INTERNAL_ERROR', message: 'Възникна неочаквана грешка. Опитай отново.' } })
  assert.match(response.headers.get('cache-control'), /no-store/)
})

test('database errors and truncated busy data fail closed rather than fabricating free slots', async () => {
  for (const options of [
    { errors: { appointments: new Error('private') } },
    { errors: { time_off: new Error('private') } },
    { counts: { appointments: 1001 } },
    { counts: { time_off: 1001 } },
  ]) {
    const db = database(options)
    await assert.rejects(readMonthlyAvailableSlots(selection({ supabase: db.client })))
    assert.equal(db.queries.length, 2)
  }
})

test('exact busy counts must be present, safe integers and match every returned row; zero is valid', async () => {
  for (const table of ['appointments', 'time_off']) {
    for (const count of [null, undefined, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '0']) {
      const db = database({ counts: { [table]: count } })
      await assert.rejects(readMonthlyAvailableSlots(selection({ supabase: db.client })), /Incomplete monthly availability data/)
    }
    const db = database({ [table]: [range('2026-10-19', '09:00', '09:30')], counts: { [table]: 0 } })
    await assert.rejects(readMonthlyAvailableSlots(selection({ supabase: db.client })), /Incomplete monthly availability data/)
  }
  const empty = database({ counts: { appointments: 0, time_off: 0 } })
  const result = await readMonthlyAvailableSlots(selection({ supabase: empty.client }))
  assert.ok(day(result).slots.length)
  assert.equal(empty.queries.length, 2)
})

test('no eligible staff produces empty dates without querying busy tables', async () => {
  const db = database()
  const result = await readMonthlyAvailableSlots(selection({ supabase: db.client, business: business({ staff: [] }) }))
  assert.equal(result.days.length, 31)
  assert.ok(result.days.every((item) => item.slots.length === 0))
  assert.equal(db.queries.length, 0)
})
