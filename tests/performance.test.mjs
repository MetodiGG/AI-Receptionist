import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { createReadCache } from '../lib/read-cache.mjs'
import { readBookableBusiness } from '../lib/public-business-query.mjs'
import { createOwnerState } from '../lib/owner-state.mjs'
import { createServerTiming } from '../lib/server-timing.mjs'

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('public catalogue reuses fresh data, deduplicates concurrent reads and expires after 30 seconds', async () => {
  let time = 1000, reads = 0
  const cache = createReadCache({ now: () => time })
  const pending = deferred(), load = () => { reads++; return pending.promise }
  const a = cache.read(load), b = cache.read(load)
  assert.equal(a, b)
  await Promise.resolve(); assert.equal(reads, 1)
  pending.resolve([]); await a
  assert.deepEqual(cache.peek(), [])
  assert.deepEqual(await cache.read(() => assert.fail('fresh cache fetched again')), [])
  time += 30000; assert.equal(cache.peek(), undefined)
  assert.deepEqual(await cache.read(() => ['fresh']), ['fresh'])
  assert.deepEqual(await cache.read(() => ['forced'], { force: true }), ['forced'])
})

test('public cache retries failures and cleared in-flight results cannot repopulate it', async () => {
  const cache = createReadCache()
  await assert.rejects(cache.read(() => { throw Error('offline') }))
  assert.equal(cache.peek(), undefined)
  const pending = deferred(), old = cache.read(() => pending.promise)
  await Promise.resolve(); cache.clear()
  assert.deepEqual(await cache.read(() => ['new']), ['new'])
  pending.resolve(['outdated']); await old
  assert.deepEqual(cache.peek(), ['new'])
})

function publicClient(respond) {
  const requests = []
  const client = createClient('https://database.example', 'test-only-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      requests.push({ url: new URL(input), init })
      return respond(requests.length)
    } },
  })
  return { client, requests }
}

test('bookable profile uses one joined request, exact public/active filters and stable embedded ordering', async () => {
  const business = { id: 'published', services: [], staff: [], workingHours: [], staffServices: [] }
  const { client, requests } = publicClient(() => Response.json([business]))
  assert.deepEqual(await readBookableBusiness(client, 'real-salon'), business)
  assert.equal(requests.length, 1)
  const params = requests[0].url.searchParams
  assert.equal(params.get('slug'), 'eq.real-salon')
  assert.equal(params.get('active'), 'eq.true')
  assert.equal(params.get('platform_status'), 'eq.enabled')
  assert.equal(params.get('services.active'), 'eq.true'); assert.equal(params.get('staff.active'), 'eq.true')
  assert.equal(params.get('services.order'), 'sort_order.asc,name.asc')
  assert.equal(params.get('staff.order'), 'sort_order.asc,name.asc')
  assert.equal(params.get('workingHours.order'), 'weekday.asc')
  const selection = params.get('select')
  for (const join of ['services(', 'staff(', 'workingHours:working_hours(', 'staffServices:staff_services(']) assert.ok(selection.includes(join))
  assert.doesNotMatch(selection, /owner_id|customers\(|appointments\(|notes|cancellation_token/)
})

test('public profile is never cached across availability requests and propagates database errors', async () => {
  const { client, requests } = publicClient(call => Response.json(call === 1 ? [{ id: 'published', services: [], staff: [], workingHours: [], staffServices: [] }] : []))
  assert.equal((await readBookableBusiness(client, 'real-salon')).id, 'published')
  assert.equal(await readBookableBusiness(client, 'real-salon'), null)
  assert.equal(requests.length, 2)
  const unavailable = publicClient(() => Response.json({ code: 'ERROR', message: 'Unavailable' }, { status: 503 }))
  await assert.rejects(readBookableBusiness(unavailable.client, 'real-salon'))
})

function ownerHarness() {
  let session = { user: { id: 'owner-a' }, access_token: 'local-test-a' }, response = { data: { id: 'business-a' }, error: null }, time = 1000
  const states = [], queries = [], redirects = []
  const client = { auth: { getSession: async () => ({ data: { session }, error: null }) }, from(table) {
    const query = { table, filters: [] }; queries.push(query)
    return { select() { return this }, eq(key, value) { query.filters.push([key, value]); return this }, order() { return this }, limit() { return this }, maybeSingle() { return Promise.resolve(response) } }
  } }
  const owner = createOwnerState({ client, now: () => time, onChange: state => states.push(state), onSignedOut: () => redirects.push('/') })
  return { owner, states, queries, redirects, session: value => { session = value }, response: value => { response = value }, time: value => { time = value } }
}

test('shared owner state loads only the authenticated owner and token refresh does not reload the profile', async () => {
  const h = ownerHarness()
  assert.equal(h.owner.isStale(), true)
  await h.owner.load()
  assert.equal(h.queries.length, 1); assert.deepEqual(h.queries[0].filters, [['owner_id', 'owner-a']])
  assert.equal(h.states.at(-1).status, 'ready')
  assert.equal(h.owner.isStale(), false)
  const refreshed = { user: { id: 'owner-a' }, access_token: 'local-test-refreshed' }
  assert.equal(h.owner.changeSession(refreshed), false)
  assert.equal(h.queries.length, 1); assert.equal(h.states.at(-1).session, refreshed)
  h.time(61000); assert.equal(h.owner.isStale(), true)
})

test('sign-out and account switching clear the previous private profile before another request finishes', async () => {
  const h = ownerHarness(); await h.owner.load()
  const pending = deferred(); h.response(pending.promise)
  const oldRead = h.owner.load(); await Promise.resolve()
  assert.equal(h.owner.changeSession(null), false)
  assert.equal(h.states.at(-1).business, null); assert.equal(h.states.at(-1).session, null)
  pending.resolve({ data: { id: 'old-private-business' } }); await oldRead
  assert.equal(h.states.at(-1).business, null); assert.deepEqual(h.redirects, ['/'])
  const next = { user: { id: 'owner-b' }, access_token: 'local-test-b' }
  h.session(next); assert.equal(h.owner.changeSession(next), true)
  h.response({ data: { id: 'business-b' }, error: null }); await h.owner.load()
  assert.equal(h.states.at(-1).business.id, 'business-b')
  assert.deepEqual(h.queries.at(-1).filters, [['owner_id', 'owner-b']])
})

test('a late profile response cannot replace a newer same-user Auth session', async () => {
  const h = ownerHarness(), pending = deferred()
  h.response(pending.promise)
  const loading = h.owner.load(); await Promise.resolve()
  const refreshed = { user: { id: 'owner-a' }, access_token: 'local-test-newest' }
  assert.equal(h.owner.changeSession(refreshed), false)
  pending.resolve({ data: { id: 'business-a' } }); await loading
  assert.equal(h.states.at(-1).session, refreshed)
  assert.equal(h.states.at(-1).status, 'ready')
  const latest = { user: { id: 'owner-a' }, access_token: 'local-test-get-session' }
  h.session(latest); h.response({ data: { id: 'business-a' } }); await h.owner.load()
  assert.equal(h.states.at(-1).session, latest)
})

test('owner refresh sees saved settings, errors never restore stale data and unmounted reads are ignored', async () => {
  const h = ownerHarness(); await h.owner.load()
  h.response({ data: { id: 'business-a', name: 'Updated' }, error: null }); await h.owner.load()
  assert.equal(h.states.at(-1).business.name, 'Updated')
  h.response({ error: Error('Access denied') }); await h.owner.load()
  assert.equal(h.states.at(-1).status, 'error'); assert.equal(h.states.at(-1).business, null)
  const pending = deferred(); h.response(pending.promise)
  const running = h.owner.load(); await Promise.resolve()
  h.owner.dispose(); const count = h.states.length
  pending.resolve({ data: { id: 'late' } }); await running
  assert.equal(h.states.length, count)
})

test('signed-out owner cannot query businesses; new owner without a business keeps setup access', async () => {
  const h = ownerHarness(); h.session(null); await h.owner.load()
  assert.equal(h.queries.length, 0); assert.deepEqual(h.redirects, ['/'])
  h.session({ user: { id: 'new-owner' } }); h.response({ data: null, error: null }); await h.owner.load()
  assert.equal(h.states.at(-1).status, 'setup'); assert.equal(h.states.at(-1).business, null)
})

test('request timings measure awaited database work without identifiers or response content', async () => {
  let time = 0
  const timing = createServerTiming(() => time)
  const result = await timing.measure('business', async () => { time = 12.5; return 'private value' })
  assert.equal(result, 'private value')
  assert.deepEqual(timing.headers(), { 'Server-Timing': 'business;dur=12.5' })
})

test('production pins Frankfurt, shares the dashboard layout and keeps booking availability uncached', async () => {
  const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8')
  assert.deepEqual(JSON.parse(await read('vercel.json')).regions, ['fra1'])
  assert.match(await read('app/dashboard/layout.js'), /<OwnerProvider>/)
  assert.match(await read('components/owner-context.js'), /<DashboardShell/)
  for (const name of ['components/owner-page.js', 'app/dashboard/page.js']) assert.doesNotMatch(await read(name), /auth\.getSession|from\('businesses'\)|<DashboardShell/)
  const availability = await read('app/api/public/[slug]/availability/route.js')
  assert.match(availability, /private, no-store/); assert.match(availability, /consumeRateLimit/); assert.match(availability, /getAvailableSlots/)
  assert.doesNotMatch(availability, /createReadCache|unstable_cache|use cache/)
  assert.match(await read('lib/public-booking.js'), /SLOT_UNAVAILABLE/)
})
