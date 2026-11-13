import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ownerBusinessSettingsSchema, createOwnerBusinessSettingsHandler, saveOwnerBusinessSettings } from '../lib/owner-business-settings.mjs'

const id = '10000000-0000-4000-8000-000000000001', owner = '20000000-0000-4000-8000-000000000001'
const user = { id: owner, email_confirmed_at: '2026-01-01' }
const url = 'https://local.example/api/owner/business-settings'
const profile = { name: 'Offline owner studio', phone: '+359888000000', address: 'ул. Пирин 42', timezone: 'Europe/Sofia', welcome_message: 'Welcome', bot_instructions: 'Retain instructions', booking_window_days: '60', minimum_notice_minutes: '0', cancellation_notice_hours: '12', industry: 'beauty', contact_email: 'owner@example.com', website_url: 'https://studio.example.com/', privacy_contact_email: '', booking_terms: 'Retain booking qualifications', email_notifications_enabled: false, notification_locale: 'en', city_ekatte: '68134', neighborhood: 'Манастирски ливади', default_duration_min: '45', booking_slot_minutes: '15' }
const publicProfile = { description: { bg: 'Описанието остава', en: 'Retained' }, payments: ['card'], brands: ['Brand'], latitude: 42.6650291, longitude: 23.2825296 }
const current = { id, owner_id: owner, platform_status: 'enabled', city_ekatte: profile.city_ekatte, neighborhood: profile.neighborhood, address: profile.address, timezone: profile.timezone, public_profile: publicProfile, content_revision: 4 }
const body = patch => ({ businessId: id, revision: 4, profile: { ...profile, ...patch } })
const request = (input, headers = {}) => new Request(url, { method: 'PATCH', headers: { origin: 'https://local.example', 'content-type': 'application/json', ...headers }, body: typeof input === 'string' ? input : JSON.stringify(input) })
function fixture(overrides = {}) {
  const calls = { reads: [], saves: [], upcoming: [] }
  const deps = { authenticate: async () => user, allowAttempt: async () => true,
    readBusiness: async (...args) => { calls.reads.push(args); return current },
    hasUpcomingBookings: async businessId => { calls.upcoming.push(businessId); return false },
    save: async input => calls.saves.push(input), ...overrides }
  return { calls, handler: createOwnerBusinessSettingsHandler(deps) }
}

test('the owner settings schema preserves every existing settings value and forbids coordinate/identity/publication/booking-mode injection', () => {
  const parsed = ownerBusinessSettingsSchema.parse(body({}))
  assert.deepEqual(parsed.profile, { ...profile, city: 'София', default_duration_min: 45, booking_slot_minutes: 15, booking_window_days: 60, minimum_notice_minutes: 0, cancellation_notice_hours: 12, privacy_contact_email: null })
  for (const extra of [{ public_profile: publicProfile }, { owner_id: owner }, { active: false }, { platform_status: 'enabled' }, { booking_mode: 'phone' }, { external_booking_url: 'https://booking.example.com' }, { slug: 'different-slug' }, { review_requests_enabled: false }, { city: 'Injected city' }]) {
    assert.equal(ownerBusinessSettingsSchema.safeParse(body(extra)).success, false)
  }
  assert.equal(ownerBusinessSettingsSchema.safeParse({ ...body({}), revision: -1 }).success, false)
  for (const minutes of [5, 10, 15, 20, 30, 45, 60, 90, 120]) assert.equal(ownerBusinessSettingsSchema.parse(body({ booking_slot_minutes: String(minutes) })).profile.booking_slot_minutes, minutes)
})

test('real address/city/quarter owner changes clear the server-held pin in the same update while all settings and profile metadata survive', async () => {
  for (const change of [{ address: 'ул. Пирин 43' }, { city_ekatte: '56784' }, { neighborhood: 'Борово' }]) {
    const f = fixture(), response = await f.handler(request(body(change)))
    assert.equal(response.status, 200)
    assert.match(response.headers.get('cache-control'), /no-store/)
    assert.deepEqual(f.calls.reads, [[id, owner]])
    const saved = f.calls.saves[0]
    assert.equal(saved.businessId, id); assert.equal(saved.ownerId, owner); assert.equal(saved.revision, 4)
    assert.deepEqual(saved.patch.public_profile, { ...publicProfile, latitude: null, longitude: null })
    assert.equal(saved.patch.booking_terms, profile.booking_terms)
    assert.equal(saved.patch.email_notifications_enabled, false)
    assert.equal(saved.patch.notification_locale, 'en')
    assert.equal(Object.hasOwn(saved.patch, 'owner_id'), false)
    assert.equal(Object.hasOwn(saved.patch, 'booking_mode'), false)
  }
})

test('format-only and non-location owner settings edits keep stored source-address spelling and pin; no-coordinate profiles remain valid', async () => {
  for (const change of [{ address: ' УЛИЦА „ПИРИН“, 42 ' }, { neighborhood: 'ж.к. Манастирски ливади' }, { welcome_message: 'Changed welcome only' }]) {
    const f = fixture()
    assert.equal((await f.handler(request(body(change)))).status, 200)
    assert.equal(f.calls.saves[0].patch.address, current.address)
    assert.equal(f.calls.saves[0].patch.neighborhood, current.neighborhood)
    assert.deepEqual(f.calls.saves[0].patch.public_profile, publicProfile)
    assert.deepEqual(f.calls.upcoming, [])
  }
  const f = fixture({ readBusiness: async () => ({ ...current, public_profile: { ...publicProfile, latitude: null, longitude: null } }) })
  assert.equal((await f.handler(request(body({})))).status, 200)
  assert.deepEqual(f.calls.saves[0].patch.public_profile, { ...publicProfile, latitude: null, longitude: null })
})

test('verified owner, CSRF, quota and strict body validation are required before any business read or mutation', async () => {
  for (const [overrides, headers, input, status] of [
    [{ authenticate: async () => null }, {}, body({}), 401],
    [{ authenticate: async () => ({ ...user, email_confirmed_at: null }) }, {}, body({}), 401],
    [{ authenticate: async () => ({ ...user, is_anonymous: true }) }, {}, body({}), 401],
    [{}, { origin: 'https://bad.example' }, body({}), 403],
    [{}, { 'sec-fetch-site': 'cross-site' }, body({}), 403],
    [{ allowAttempt: async () => false }, {}, body({}), 429],
    [{}, { 'content-type': 'text/plain' }, body({}), 422],
    [{}, { 'content-length': '100001' }, body({}), 422],
    [{}, {}, 'not json', 422],
    [{}, {}, 'x'.repeat(100001), 422],
    [{}, {}, body({ public_profile: { latitude: 0, longitude: 0 } }), 422],
    [{}, {}, { ...body({}), businessId: 'not-uuid' }, 422],
  ]) {
    const f = fixture(overrides)
    assert.equal((await f.handler(request(input, headers))).status, status)
    assert.deepEqual(f.calls.reads, []); assert.deepEqual(f.calls.saves, [])
  }
})

test('foreign/missing/archived businesses, stale/incomplete revision and read failures never write', async () => {
  for (const [readBusiness, status] of [[async () => null, 403], [async () => ({ ...current, owner_id: 'another-owner' }), 403], [async () => ({ ...current, platform_status: 'archived' }), 409], [async () => ({ ...current, content_revision: 5 }), 409], [async () => ({ ...current, content_revision: null }), 409], [async () => { throw Error('read unavailable') }, 503]]) {
    const f = fixture({ readBusiness })
    assert.equal((await f.handler(request(body({})))).status, status)
    assert.deepEqual(f.calls.saves, [])
  }
})

test('existing future-booking timezone protection and safe save errors survive the owner settings path', async () => {
  const blocked = fixture({ hasUpcomingBookings: async () => true })
  const response = await blocked.handler(request(body({ timezone: 'Europe/London' })))
  assert.equal(response.status, 409); assert.equal((await response.json()).error.code, 'TIMEZONE_BOOKINGS')
  assert.deepEqual(blocked.calls.saves, [])
  for (const code of ['CONTENT_CHANGED', 'TIMEZONE_BOOKINGS', 'SCHEDULE_CONFLICT', 'UPCOMING_BOOKINGS']) {
    const f = fixture({ save: async () => { throw Error(code) } }), response = await f.handler(request(body({})))
    assert.equal(response.status, 409); assert.equal((await response.json()).error.code, code)
  }
})

test('the real persistence adapter uses exactly one atomic update with owner and optimistic revision predicates', async () => {
  const calls = [], patch = { address: 'New street 2', public_profile: { ...publicProfile, latitude: null, longitude: null } }
  const db = result => ({ from(table) {
    calls.push(['from', table])
    const chain = { update(value) { calls.push(['update', value]); return chain }, eq(...args) { calls.push(['eq', ...args]); return chain }, select(value) { calls.push(['select', value]); return chain }, async maybeSingle() { return result } }
    return chain
  } })
  const input = { businessId: id, ownerId: owner, revision: 4, patch }
  await saveOwnerBusinessSettings(db({ data: { id }, error: null }), input)
  assert.deepEqual(calls, [['from', 'businesses'], ['update', patch], ['eq', 'id', id], ['eq', 'owner_id', owner], ['eq', 'content_revision', 4], ['select', 'id,content_revision']])
  await assert.rejects(saveOwnerBusinessSettings(db({ data: null, error: null }), input), /CONTENT_CHANGED/)
  await assert.rejects(saveOwnerBusinessSettings(db({ data: null, error: Error('database unavailable') }), input), /database unavailable/)
})

test('the real dashboard no longer mutates business settings directly and sends authenticated revision-bound settings only', async () => {
  const page = await readFile(new URL('../app/dashboard/settings/page.js', import.meta.url), 'utf8')
  const route = await readFile(new URL('../app/api/owner/business-settings/route.js', import.meta.url), 'utf8')
  assert.doesNotMatch(page, /supabase\.from\('businesses'\)\.update/)
  assert.match(page, /fetch\('\/api\/owner\/business-settings'/)
  assert.match(page, /useState\(\(\) => \(\{ businessId: business\.id, revision: business\.content_revision \}\)\)/)
  assert.match(page, /JSON\.stringify\(\{ \.\.\.profileVersion, profile \}\)/)
  assert.match(page, /Authorization: `Bearer \$\{data\.session\.access_token\}`/)
  assert.match(route, /\.eq\('owner_id', ownerId\)/)
  assert.match(route, /saveOwnerBusinessSettings/)
  assert.doesNotMatch(route, /\.delete\(|\.rpc\(/)
})
