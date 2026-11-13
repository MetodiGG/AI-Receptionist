import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { businessOrStaffTimeOffFilter, reviewAdminCursorFilter, reviewAdminListSchema } from '../lib/postgrest-filter-safety.mjs'
import { createProfileUpdateHandler, createReviewAdminHandlers } from '../lib/profile-management.mjs'
import { readMonthlyAvailableSlots } from '../lib/monthly-availability.mjs'

const BUSINESS = '10000000-0000-4000-8000-000000000001'
const OWNER = '20000000-0000-4000-8000-000000000001'
const STAFF = '30000000-0000-4000-8000-000000000001'
const SERVICE = '40000000-0000-4000-8000-000000000001'
const user = { id: OWNER, email_confirmed_at: '2026-11-01T10:00:00Z', is_anonymous: false }
const hostileText = [
  "Салон O'Connor — подстригване",
  "'); DROP TABLE businesses; --",
  'x,or(owner_id.not.is.null),name.eq.y',
  'name.eq."x"),and(owner_id.neq.null)',
  '100%_точно \\ "цена"\nнов ред',
]

// Exercise the real Supabase serializer, but replace transport completely.
// No credentials, auth sessions, provider requests, or production mutations.
function offlineDatabase(data = []) {
  const calls = []
  const client = createClient('https://offline.invalid', 'offline-test-placeholder', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init = {}) => {
      calls.push({ url: new URL(input), method: init.method, body: init.body ? JSON.parse(init.body) : null })
      return Response.json(data, { headers: { 'content-range': `0-${Math.max(0, data.length - 1)}/${data.length}` } })
    } },
  })
  return { client, calls }
}
const jsonRequest = (body, path = '/api/owner/public-profile', method = 'PATCH') => new Request(`https://gorez.test${path}`, {
  method, headers: { 'content-type': 'application/json', origin: 'https://gorez.test' }, body: JSON.stringify(body),
})

test('review raw filters accept only paired typed cursors and preserve microsecond precision / offsets', () => {
  for (const before of ['2026-11-12T10:15:30.123456Z', '2026-11-12T12:15:30.123456+02:00']) {
    assert.equal(reviewAdminCursorFilter({ before, id: BUSINESS }), `created_at.lt.${before},and(created_at.eq.${before},id.lt.${BUSINESS})`)
    assert.equal(reviewAdminListSchema.safeParse({ status: 'published', before, id: BUSINESS }).success, true)
  }
  assert.equal(reviewAdminCursorFilter({}), null)
  for (const text of hostileText) {
    assert.throws(() => reviewAdminCursorFilter({ before: text, id: BUSINESS }))
    assert.throws(() => reviewAdminCursorFilter({ before: '2026-11-12T10:00:00Z', id: text }))
  }
  for (const before of ['2026-11-12T10:00:00Z,or(id.not.is.null)', '2026-11-12T10:00:00Z)', `2026-11-12T10:00:00.${'1'.repeat(100)}Z`]) {
    assert.throws(() => reviewAdminCursorFilter({ before, id: BUSINESS }))
  }
  assert.throws(() => reviewAdminCursorFilter({ id: BUSINESS }))
  assert.throws(() => reviewAdminCursorFilter({ before: '2026-11-12T10:00:00Z' }))
})

test('time-off raw filters have fixed operators/columns and reject grammar in any staff ID', () => {
  assert.equal(businessOrStaffTimeOffFilter([OWNER, STAFF]), `staff_id.is.null,staff_id.in.(${OWNER},${STAFF})`)
  for (const text of [...hostileText, `${STAFF}),business_id.not.is.null`, `${STAFF},${OWNER}`, '', null]) {
    assert.throws(() => businessOrStaffTimeOffFilter([STAFF, text]))
  }
  for (const ids of [[], null, STAFF]) assert.throws(() => businessOrStaffTimeOffFilter(ids))
})

test('malformed monthly database staff IDs fail before any availability transport, not as extra filter expressions', async () => {
  const db = offlineDatabase()
  await assert.rejects(readMonthlyAvailableSlots({
    supabase: db.client, serviceId: SERVICE, month: '2026-11', now: '2026-11-12T08:00:00Z',
    business: {
      id: BUSINESS, booking_mode: 'gorez', timezone: 'Europe/Sofia',
      services: [{ id: SERVICE, duration_min: 30 }], staff: [{ id: `${STAFF}),business_id.not.is.null` }],
      staffServices: [], workingHours: [],
    },
  }))
  assert.equal(db.calls.length, 0)
})

test('monthly queries keep the business constraint outside the validated null-or-staff expression', async () => {
  const db = offlineDatabase()
  await readMonthlyAvailableSlots({
    supabase: db.client, serviceId: SERVICE, month: '2026-11', now: '2026-11-12T08:00:00Z',
    business: {
      id: BUSINESS, booking_mode: 'gorez', timezone: 'Europe/Sofia',
      services: [{ id: SERVICE, duration_min: 30 }], staff: [{ id: STAFF }],
      staffServices: [], workingHours: [],
    },
  })
  assert.equal(db.calls.length, 2)
  for (const { url } of db.calls) assert.equal(url.searchParams.get('business_id'), `eq.${BUSINESS}`)
  const timeOff = db.calls.find(({ url }) => url.pathname.endsWith('/time_off')).url
  assert.equal(timeOff.searchParams.get('or'), `(staff_id.is.null,staff_id.in.(${STAFF}))`)
  assert.equal(timeOff.searchParams.getAll('or').length, 1)
  assert.ok(timeOff.searchParams.has('starts_at')); assert.ok(timeOff.searchParams.has('ends_at'))
})

test('admin request cursor attacks are rejected before listing; permissions and status allowlist are unchanged', async () => {
  const calls = []
  const dependencies = {
    authenticate: async () => user, isAdmin: () => true, allowAttempt: async () => true,
    list: async value => { calls.push(value); return { items: [], next: null } }, moderate: async () => {},
  }
  for (const text of hostileText) {
    for (const field of ['before', 'id', 'status']) {
      const query = new URLSearchParams({ status: 'all', before: '2026-11-12T10:00:00Z', id: BUSINESS, [field]: text })
      const response = await createReviewAdminHandlers(dependencies).GET(new Request(`https://gorez.test/api/admin/reviews?${query}`))
      assert.equal(response.status, 422)
    }
  }
  for (const patch of [{ authenticate: async () => null }, { isAdmin: () => false }]) {
    const response = await createReviewAdminHandlers({ ...dependencies, ...patch }).GET(new Request('https://gorez.test/api/admin/reviews'))
    assert.ok([401, 403].includes(response.status))
  }
  assert.equal(calls.length, 0)
})

test('Supabase equality filters serialize Bulgarian, apostrophes and SQL-looking search strings as one literal value', async () => {
  const db = offlineDatabase()
  for (const text of hostileText) {
    await db.client.from('businesses').select('id').eq('name', text).eq('owner_id', OWNER)
    const { url } = db.calls.at(-1)
    assert.equal(url.pathname, '/rest/v1/businesses')
    assert.equal(url.searchParams.get('name'), `eq.${text}`)
    assert.equal(url.searchParams.get('owner_id'), `eq.${OWNER}`)
    assert.deepEqual([...url.searchParams.keys()].sort(), ['name', 'owner_id', 'select'])
  }
})

test('ordinary profile text stays in a JSON update payload, with server-derived ownership filters', async () => {
  const db = offlineDatabase([{ id: BUSINESS }]), ownership = []
  const handler = createProfileUpdateHandler({
    authenticate: async () => user, allowAttempt: async () => true,
    ownsBusiness: async (...values) => { ownership.push(values); return true },
    update: async (id, owner, patch, revision) => {
      const result = await db.client.from('businesses').update(patch).eq('id', id).eq('owner_id', owner).eq('content_revision', revision).select('id').maybeSingle()
      if (result.error) throw result.error
    },
  })
  for (const text of hostileText) {
    const response = await handler(jsonRequest({ businessId: BUSINESS, revision: 0, profile: { description: { bg: text, en: text } }, reviewRequestsEnabled: true }))
    assert.equal(response.status, 200)
    const { url, method, body } = db.calls.at(-1)
    assert.equal(method, 'PATCH')
    assert.equal(body.public_profile.description.bg, text)
    assert.equal(body.public_profile.description.en, text)
    assert.equal(url.searchParams.get('id'), `eq.${BUSINESS}`)
    assert.equal(url.searchParams.get('owner_id'), `eq.${OWNER}`)
    assert.equal(url.searchParams.get('content_revision'), 'eq.0')
    assert.equal(url.searchParams.has('or'), false)
    assert.deepEqual(ownership.at(-1), [BUSINESS, OWNER])
  }
  const denied = createProfileUpdateHandler({ authenticate: async () => user, allowAttempt: async () => true, ownsBusiness: async () => false, update: async () => assert.fail('must not write') })
  assert.equal((await denied(jsonRequest({ businessId: BUSINESS, revision: 0, profile: {}, reviewRequestsEnabled: true }))).status, 403)
})

test('RPC text stays in JSON named arguments, not in endpoint names or PostgREST logic', async () => {
  const db = offlineDatabase()
  for (const text of hostileText) {
    await db.client.rpc('moderate_booking_review', { p_id: BUSINESS, p_actor: OWNER, p_status: 'hidden', p_revision: 0, p_reason: text })
    const { url, method, body } = db.calls.at(-1)
    assert.equal(url.pathname, '/rest/v1/rpc/moderate_booking_review')
    assert.equal(url.search, '')
    assert.equal(method, 'POST')
    assert.equal(body.p_reason, text)
    assert.equal(body.p_actor, OWNER)
  }
})

test('production review/profile adapters retain fixed RPC and tenancy query boundaries', async () => {
  const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  const reviews = await read('app/api/admin/reviews/route.js')
  const profile = await read('app/api/owner/public-profile/route.js')
  assert.match(reviews, /reviewAdminCursorFilter\(\{ before, id \}\)/)
  assert.match(reviews, /\.rpc\('moderate_booking_review', \{ p_id: body\.id, p_actor: actor, p_status: body\.status, p_revision: body\.revision, p_reason: body\.reason \}\)/)
  assert.match(profile, /\.update\(patch\)\.eq\('id', id\)\.eq\('owner_id', owner\)/)
  assert.match(profile, /\.select\('id'\)\.eq\('id', id\)\.eq\('owner_id', owner\)/)
})
