import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { businessReportPeriod, createAdminBusinessReportHandler, parseBusinessReportQuery, REPORT_STATUSES, safeBusinessReport } from '../lib/admin-business-report.mjs'
import { platformAdminIdentity } from '../lib/business-application.mjs'

// All identities, business IDs, contacts and reservations below are fictional.
// These tests only call injected local functions: no database, email or network.
const businessId = '10000000-0000-4000-8000-000000000001'
const customerId = '20000000-0000-4000-8000-000000000001'
const admin = { id: '90000000-0000-4000-8000-000000000001', email: 'admin@example.invalid', email_confirmed_at: '2026-01-01T00:00:00Z' }
const zeroStatuses = () => Object.fromEntries(REPORT_STATUSES.map(status => [status, 0]))
const emptyReport = (patch = {}) => ({ summary: { bookings: 0, customers: 0, statuses: zeroStatuses() }, filtered: { bookings: 0, customers: 0 }, view: 'bookings', page: 1, pageSize: 25, totalRows: 0, totalPages: 0, rows: [], ...patch })
const request = (query = '', headers = {}) => new Request(`https://gorez.example/api/admin/businesses/${businessId}/report${query ? `?${query}` : ''}`, { headers })
const query = value => parseBusinessReportQuery(new URLSearchParams(value))
function harness(options = {}) {
  const operations = []
  const handler = createAdminBusinessReportHandler({
    authenticate: async () => { operations.push('authenticate'); if (options.authFailure) throw Error(options.authFailure); return Object.hasOwn(options, 'user') ? options.user : admin },
    isAdmin: user => platformAdminIdentity(user, 'admin@example.invalid'),
    allowAttempt: async (_request, userId) => { operations.push(['quota', userId]); return options.allowed !== false },
    readBusiness: async id => { operations.push(['business', id]); if (options.readFailure) throw Error(options.readFailure); return options.missing ? null : { id, name: 'Offline test business', timezone: 'Europe/Sofia', booking_mode: 'gorez', ...options.business } },
    load: async input => { operations.push(['load', input]); if (options.loadFailure) throw Error(options.loadFailure); return options.report || emptyReport() },
    now: () => Date.parse(options.now || '2026-11-12T10:00:00Z'),
  })
  return { handler, operations }
}
function assertPrivate(response) {
  assert.match(response.headers.get('cache-control'), /private.*no-store/)
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
  assert.equal(response.headers.get('vary'), 'Authorization')
}

test('only verified platform administrators can read reports; identity is checked before IDs, queries or data', async () => {
  const denied = [null, { ...admin, email: 'owner@example.invalid', user_metadata: { admin: true } }, { ...admin, email_confirmed_at: null }, { ...admin, is_anonymous: true }, { ...admin, app_metadata: { gorez_business_application: true } }]
  for (const user of denied) {
    const h = harness({ user }), response = await h.handler(request('status=injected'), 'not-a-uuid')
    assert.equal(response.status, user ? 403 : 401)
    assert.deepEqual(h.operations, ['authenticate'])
    assertPrivate(response)
  }
})

test('cross-origin and cross-site requests never read business or customer information', async () => {
  for (const headers of [{ origin: 'https://attacker.invalid' }, { 'sec-fetch-site': 'cross-site' }]) {
    const h = harness(), response = await h.handler(request('', headers), businessId)
    assert.equal(response.status, 403)
    assert.deepEqual(h.operations, ['authenticate'])
    assertPrivate(response)
  }
})

test('strict query validation rejects duplicates, unknown keys, injected filters and unbounded pagination', async () => {
  for (const value of ['status=all&status=done', 'from=2026-11-01&from=2026-11-02&to=2026-11-03', 'customer=private@example.invalid', "basis=starts_at%27%20OR%20true--", "status=all%27%3BDROP%20TABLE%20customers--", 'view=table', 'page=1.5', 'page=0', 'page=100001', 'limit=51', 'limit=0', 'from=2026-11-01', 'to=2026-11-01']) {
    assert.throws(() => query(value))
    const h = harness(), response = await h.handler(request(value), businessId)
    assert.equal(response.status, 422, value)
    assert.deepEqual(h.operations, ['authenticate'])
    assertPrivate(response)
  }
  const h = harness(), invalidId = await h.handler(request(), "' OR true--")
  assert.equal(invalidId.status, 422)
  assert.deepEqual(h.operations, ['authenticate'])
})

test('quota is checked before reading a valid business or loading any client records', async () => {
  const h = harness({ allowed: false }), response = await h.handler(request(), businessId)
  assert.equal(response.status, 429)
  assert.deepEqual(h.operations, ['authenticate', ['quota', admin.id]])
  assertPrivate(response)
})

test('valid admin reports use business-local dates and only validated parameters reach the loader', async () => {
  const h = harness(), response = await h.handler(request('from=2026-10-25&to=2026-10-25&basis=created&status=done'), businessId)
  assert.equal(response.status, 200)
  assertPrivate(response)
  const input = h.operations.find(operation => operation[0] === 'load')[1]
  assert.deepEqual(input, { businessId, from: '2026-10-25', to: '2026-10-25', basis: 'created', status: 'done', view: 'bookings', page: 1, limit: 25, startAt: '2026-10-24T21:00:00.000Z', endAtExclusive: '2026-10-25T22:00:00.000Z' })
  const body = await response.json()
  assert.equal(body.period.timezone, 'Europe/Sofia')
  assert.equal(body.business.id, businessId)
})

test('archived, suspended, unpublished and external-mode businesses retain truthful historical reports', async () => {
  for (const business of [{ active: false, platform_status: 'archived' }, { active: false, platform_status: 'suspended' }, { active: false, platform_status: 'enabled' }, { booking_mode: 'external' }, { booking_mode: 'phone' }]) {
    const h = harness({ business }), response = await h.handler(request(), businessId)
    assert.equal(response.status, 200)
    assert.equal(h.operations.filter(operation => operation[0] === 'load').length, 1)
    const body = await response.json()
    assert.ok(!Object.hasOwn(body.business, 'platform_status'))
    assert.ok(!Object.hasOwn(body.business, 'active'))
  }
})

test('missing businesses, technical failures and malformed SQL output never leak internal details or private data', async () => {
  for (const [options, status, code] of [
    [{ missing: true }, 404, 'BUSINESS_NOT_FOUND'],
    [{ readFailure: 'PRIVATE_DATABASE_PASSWORD' }, 503, 'REPORT_UNAVAILABLE'],
    [{ loadFailure: 'PRIVATE_CUSTOMER_NAME PRIVATE_SQL_DETAIL' }, 503, 'REPORT_UNAVAILABLE'],
    [{ loadFailure: 'BUSINESS_NOT_FOUND' }, 404, 'BUSINESS_NOT_FOUND'],
    [{ business: { timezone: 'Invalid/Timezone' } }, 503, 'REPORT_UNAVAILABLE'],
    [{ report: { rows: [{ notes: 'PRIVATE_NOTE' }] } }, 503, 'REPORT_UNAVAILABLE'],
    [{ authFailure: 'PRIVATE_AUTH_DETAIL' }, 503, 'REPORT_UNAVAILABLE'],
  ]) {
    const h = harness(options), response = await h.handler(request(), businessId)
    assert.equal(response.status, status)
    assert.deepEqual(await response.json(), { error: { code } })
    assertPrivate(response)
    if (options.missing || options.business?.timezone) assert.ok(!h.operations.some(operation => operation[0] === 'load'))
  }
})

test('period defaults use the selected business timezone rather than browser or UTC dates', () => {
  const now = Date.parse('2026-11-12T00:30:00Z')
  assert.deepEqual([businessReportPeriod(query(''), 'Europe/Sofia', now).from, businessReportPeriod(query(''), 'Europe/Sofia', now).to], ['2026-10-14', '2026-11-12'])
  assert.deepEqual([businessReportPeriod(query(''), 'America/Los_Angeles', now).from, businessReportPeriod(query(''), 'America/Los_Angeles', now).to], ['2026-10-13', '2026-11-11'])
})

test('inclusive local periods correctly handle Sofia/London DST and leap-year February', () => {
  for (const [day, zone, hours] of [['2026-03-29', 'Europe/Sofia', 23], ['2026-10-25', 'Europe/Sofia', 25], ['2026-03-29', 'Europe/London', 23], ['2024-02-29', 'Europe/Sofia', 24]]) {
    const value = businessReportPeriod(query(`from=${day}&to=${day}`), zone)
    assert.equal((Date.parse(value.endAtExclusive) - Date.parse(value.startAt)) / 3600000, hours)
    assert.equal(DateTime.fromISO(value.startAt).setZone(zone).toISODate(), day)
    assert.equal(DateTime.fromISO(value.endAtExclusive).setZone(zone).minus({ days: 1 }).toISODate(), day)
  }
  assert.equal(businessReportPeriod(query('from=2024-01-01&to=2024-12-31'), 'Europe/Sofia').to, '2024-12-31')
  assert.equal(businessReportPeriod(query('from=2025-01-01&to=2026-01-01'), 'Europe/Sofia').to, '2026-01-01')
})

test('invalid, reversed and over-366-local-day periods fail without loading appointment data', async () => {
  for (const value of ['from=2026-02-30&to=2026-02-30', 'from=2023-02-29&to=2023-02-29', 'from=2026-11-12&to=2026-11-11', 'from=2025-01-01&to=2026-01-02', 'from=0000-01-01&to=0000-01-01', 'from=9999-01-01&to=9999-01-01']) {
    assert.throws(() => businessReportPeriod(query(value), 'Europe/Sofia'), /VALIDATION_ERROR/)
    const h = harness(), response = await h.handler(request(value), businessId)
    assert.equal(response.status, 422, value)
    assert.ok(!h.operations.some(operation => operation[0] === 'load'))
    assertPrivate(response)
  }
})

function bookingReport() {
  return emptyReport({ summary: { bookings: 1, customers: 1, statuses: { ...zeroStatuses(), booked: 1 } }, filtered: { bookings: 1, customers: 1 }, totalRows: 1, totalPages: 1, rows: [{ id: '30000000-0000-4000-8000-000000000001', startsAt: '2026-11-12T10:00:00Z', endsAt: '2026-11-12T11:00:00Z', createdAt: '2026-11-10T10:00:00Z', status: 'booked', source: 'legacy-source', customer: { id: customerId, name: 'Изтрит клиент', phone: null, email: null }, service: { id: '40000000-0000-4000-8000-000000000001', name: 'Historical service' }, staff: null }] })
}

test('output allowlist preserves erased contacts and real source/status while stripping notes, tokens and intake at every level', () => {
  const value = bookingReport()
  value.privateNotes = 'PRIVATE_BUSINESS_NOTE'
  Object.assign(value.rows[0], { notes: 'PRIVATE_BOOKING_NOTE', cancellation_token: 'PRIVATE_TOKEN', intake_answers: { answer: 'PRIVATE_INTAKE' } })
  Object.assign(value.rows[0].customer, { notes: 'PRIVATE_CUSTOMER_NOTE', external_id: 'PRIVATE_EXTERNAL_ID' })
  value.rows[0].service.private_notes = 'PRIVATE_SERVICE_NOTE'
  const safe = safeBusinessReport(value, query(''))
  assert.doesNotMatch(JSON.stringify(safe), /PRIVATE_|cancellation_token|intake_answers|external_id|notes/)
  assert.deepEqual(safe.rows[0].customer, { id: customerId, name: 'Изтрит клиент', phone: null, email: null })
  assert.equal(safe.rows[0].source, 'legacy-source')
  assert.equal(safe.rows[0].status, 'booked')
  const absent = bookingReport()
  absent.rows[0].customer = null; absent.rows[0].service = null; absent.rows[0].staff = null
  assert.equal(safeBusinessReport(absent, query('')).rows[0].customer, null)
})

test('output validation rejects inconsistent totals, wrong report context and invalid actual row states', () => {
  for (const patch of [{ totalRows: 2 }, { totalPages: 2 }, { page: 2 }, { view: 'customers' }, { pageSize: 50 }, { summary: { bookings: 2, customers: 1, statuses: { ...zeroStatuses(), booked: 1 } } }, { filtered: { bookings: 2, customers: 1 } }]) assert.throws(() => safeBusinessReport({ ...bookingReport(), ...patch }, query('')))
  for (const patch of [{ status: 'completed' }, { startsAt: 'not-a-date' }, { customer: { id: null, name: null, phone: null, email: null } }]) {
    const value = bookingReport(); value.rows[0] = { ...value.rows[0], ...patch }
    assert.throws(() => safeBusinessReport(value, query('')))
  }
})

test('customer reports expose only booked customer records and bounded status counts, not CRM or Auth signup metadata', () => {
  const value = emptyReport({ view: 'customers', summary: { bookings: 1, customers: 1, statuses: { ...zeroStatuses(), done: 1 } }, filtered: { bookings: 1, customers: 1 }, totalRows: 1, totalPages: 1, rows: [{ id: customerId, name: 'Offline customer', phone: null, email: 'offline@example.invalid', bookings: 1, statuses: { ...zeroStatuses(), done: 1 }, firstVisitAt: '2026-11-12T10:00:00Z', lastVisitAt: '2026-11-12T10:00:00Z', auth_user_id: 'PRIVATE_AUTH_ID', notes: 'PRIVATE_CRM_NOTE' }] })
  const safe = safeBusinessReport(value, query('view=customers'))
  assert.equal(safe.rows[0].statuses.done, 1)
  assert.doesNotMatch(JSON.stringify(safe), /PRIVATE_|auth_user_id|notes/)
})

test('route uses existing server-only verified-admin authentication and passes only allowlisted RPC parameters', async () => {
  const route = await readFile(new URL('../app/api/admin/businesses/[id]/report/route.js', import.meta.url), 'utf8')
  assert.match(route, /authenticate: requireUser, isAdmin: isPlatformAdmin/)
  assert.match(route, /consumeRateLimit/)
  assert.match(route, /\.select\('id,name,timezone,booking_mode'\)/)
  assert.match(route, /rpc\('admin_business_report'/)
  assert.doesNotMatch(route, /\.eq\('(active|platform_status|owner_id)'|console\.|process\.env.*KEY|customer.*searchParams/)
})
