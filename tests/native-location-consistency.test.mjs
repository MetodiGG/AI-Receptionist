import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { businessContentSchema, businessLocationUpdatePayload, createContentHandler } from '../lib/business-content.mjs'
import { profileWriteDetailsSchema, profileDetailsSchema, publicProfileDetails, businessMapUrl } from '../lib/business-profile.mjs'
import { createProfileUpdateHandler, profileUpdateSchema } from '../lib/profile-management.mjs'

const id = '10000000-0000-4000-8000-000000000001'
const user = { id: '20000000-0000-4000-8000-000000000001', email_confirmed_at: '2026-01-01' }
const url = 'https://local.example/api/admin/businesses/content'
const point = { latitude: 42.6650291, longitude: 23.2825296 }
const profile = { description: { bg: 'Запазено описание', en: 'Retained description' }, payments: ['card'], brands: ['Brand'], ...point }
const raw = { name: 'Offline native location QA', slug: 'offline-native-location', phone: '', contact_email: '', address: 'ул. „Пирин“ 42', city_ekatte: '68134', neighborhood: 'Манастирски ливади', industry: 'beauty', timezone: 'Europe/Sofia', website_url: '', privacy_contact_email: '', booking_terms: 'Retained terms', default_duration_min: 45, booking_slot_minutes: 15, booking_window_days: 60, minimum_notice_minutes: 60, cancellation_notice_hours: 12, email_notifications_enabled: true, notification_locale: 'bg', review_requests_enabled: true, public_profile: profile, welcome_message: '', bot_instructions: '' }
const current = { ...businessContentSchema.parse(raw), content_revision: 7 }
const payload = patch => businessContentSchema.parse({ ...raw, ...patch })
const request = body => new Request(url, { method: 'PATCH', headers: { 'content-type': 'application/json', origin: 'https://local.example' }, body: JSON.stringify(body) })
const envelope = patch => ({ revision: 7, section: 'business', payload: { ...raw, ...patch }, reason: 'Verified offline location correction' })

test('authoritative native write schemas reject unusable pairs while preserving all Bulgarian pins and absent coordinates', () => {
  for (const candidate of [point, { latitude: 41, longitude: 22 }, { latitude: 44.5, longitude: 29 }, { latitude: null, longitude: null }, {}]) {
    assert.ok(profileWriteDetailsSchema.safeParse(candidate).success)
    assert.ok(profileUpdateSchema.safeParse({ businessId: id, revision: 7, profile: candidate, reviewRequestsEnabled: true }).success)
    assert.ok(businessContentSchema.safeParse({ ...raw, public_profile: candidate }).success)
  }
  for (const candidate of [{ latitude: 0, longitude: 0 }, { latitude: 51.5, longitude: -.1 }, { latitude: 42, longitude: 0 }, { latitude: 40.999, longitude: 23 }, { latitude: 42, longitude: 29.001 }, { latitude: 42, longitude: null }, { latitude: '42.665', longitude: 23.28 }, { latitude: NaN, longitude: 23 }, { latitude: Infinity, longitude: 23 }]) {
    assert.equal(profileWriteDetailsSchema.safeParse(candidate).success, false)
    assert.equal(profileUpdateSchema.safeParse({ businessId: id, revision: 7, profile: candidate, reviewRequestsEnabled: true }).success, false)
    assert.equal(businessContentSchema.safeParse({ ...raw, public_profile: candidate }).success, false)
  }
  // Raw parsing remains backward-compatible; public reads separately sanitize.
  assert.ok(profileDetailsSchema.safeParse({ latitude: 0, longitude: 0 }).success)
})

test('public reads null unusable legacy pairs without losing description, payments or brands', () => {
  for (const candidate of [{ latitude: 0, longitude: 0 }, { latitude: 51.5, longitude: -.1 }, { latitude: 91, longitude: 23 }, { latitude: 42, longitude: null }, { latitude: '42.665', longitude: 23.28 }, { latitude: NaN, longitude: 23 }, { latitude: Infinity, longitude: 23 }]) {
    const business = { public_profile: { ...profile, ...candidate } }
    assert.deepEqual(publicProfileDetails(business), { ...profile, latitude: null, longitude: null })
    assert.equal(businessMapUrl(business), null)
  }
  assert.deepEqual(publicProfileDetails({ public_profile: profile }), profile)
  assert.deepEqual(publicProfileDetails({ public_profile: { ...profile, latitude: null, longitude: null } }), { ...profile, latitude: null, longitude: null })
})

test('physical street, city or quarter changes clear an unchanged old pin without disturbing other profile/business fields', () => {
  for (const change of [{ address: 'ул. Пирин 43' }, { address: 'ул. Казбек 42' }, { city_ekatte: '56784' }, { neighborhood: 'Борово' }, { neighborhood: '' }]) {
    const next = payload(change), result = businessLocationUpdatePayload(current, next)
    assert.deepEqual(result, { ...next, public_profile: { ...next.public_profile, latitude: null, longitude: null } })
    assert.deepEqual(current.public_profile, profile)
  }
})

test('unchanged and format-only locations retain the proven pin and stored raw source-address spelling', () => {
  for (const change of [{}, { address: '  УЛИЦА Пирин, 42  ' }, { address: 'София, ул. Пирин 42' }, { address: 'гр. София, ул. Пирин 42' }, { neighborhood: '  ж.к. МАНАСТИРСКИ ЛИВАДИ ' }, { neighborhood: 'квартал Манастирски ливади' }]) {
    const result = businessLocationUpdatePayload(current, payload(change))
    assert.equal(result.address, current.address)
    assert.equal(result.neighborhood, current.neighborhood)
    assert.deepEqual(result.public_profile, profile)
  }
  const blankQuarter = { ...current, neighborhood: null }
  assert.deepEqual(businessLocationUpdatePayload(blankQuarter, payload({ neighborhood: '' })).public_profile, profile)
})

test('an explicitly changed validated pin survives a real move; null pins and non-location edits remain usable', () => {
  const movedProfile = { ...profile, latitude: 42.15, longitude: 24.75 }
  const next = payload({ city_ekatte: '56784', address: 'ул. Нова 3', neighborhood: 'Център', public_profile: movedProfile })
  assert.deepEqual(businessLocationUpdatePayload(current, next), next)
  const noPin = payload({ address: 'ул. Нова 3', public_profile: { ...profile, latitude: null, longitude: null } })
  assert.deepEqual(businessLocationUpdatePayload(current, noPin), noPin)
  const otherEdit = payload({ phone: '+359888000000', booking_terms: 'Updated terms', public_profile: { ...profile, brands: ['Different brand'] } })
  assert.deepEqual(businessLocationUpdatePayload(current, otherEdit), otherEdit)
})

test('admin API reads current revision only after authentication and validation and persists the cleared pair in the same content RPC payload', async () => {
  const reads = [], saves = []
  const deps = { authenticate: async () => user, isAdmin: () => true, allowAttempt: async () => true,
    readBusiness: async businessId => { reads.push(businessId); return current }, save: async input => saves.push(input) }
  const handler = createContentHandler(deps)
  assert.equal((await handler(request(envelope({ address: 'ул. Пирин 43' })), id)).status, 200)
  assert.deepEqual(reads, [id])
  assert.equal(saves.length, 1)
  assert.deepEqual(saves[0].payload.public_profile, { ...profile, latitude: null, longitude: null })
  assert.equal(saves[0].revision, 7)
  assert.equal(saves[0].reason, 'Verified offline location correction')
  const before = reads.length
  assert.equal((await handler(request(envelope({ public_profile: { latitude: 0, longitude: 0 } })), id)).status, 422)
  assert.equal(reads.length, before)
  assert.equal((await createContentHandler({ ...deps, authenticate: async () => null })(request(envelope({})), id)).status, 401)
  assert.equal(reads.length, before)
})

test('missing/current-revision/read failures fail closed, while RPC revision races and booking conflicts keep their existing errors', async () => {
  let saves = 0
  const deps = { authenticate: async () => user, isAdmin: () => true, allowAttempt: async () => true,
    readBusiness: async () => current, save: async () => { saves++ } }
  for (const [readBusiness, status] of [[async () => null, 404], [async () => ({ ...current, content_revision: 8 }), 409], [async () => ({ ...current, content_revision: null }), 409], [async () => ({ ...current, content_revision: undefined }), 409], [async () => { throw Error('read unavailable') }, 503]]) {
    assert.equal((await createContentHandler({ ...deps, readBusiness })(request(envelope({})), id)).status, status)
  }
  assert.equal(saves, 0)
  for (const code of ['CONTENT_CHANGED', 'TIMEZONE_BOOKINGS', 'SCHEDULE_CONFLICT', 'UPCOMING_BOOKINGS']) {
    const response = await createContentHandler({ ...deps, save: async () => { throw Error(code) } })(request(envelope({})), id)
    assert.equal(response.status, 409)
    assert.equal((await response.json()).error.code, code)
  }
})

test('owner profile API rejects 0,0 before any authorization lookup/write and still accepts no-coordinate profile edits', async () => {
  let lookups = 0, writes = 0
  const deps = { authenticate: async () => user, allowAttempt: async () => true,
    ownsBusiness: async () => { lookups++; return true }, update: async (_id, _owner, patch) => { writes++; assert.equal(patch.public_profile.latitude, null); assert.equal(patch.public_profile.description.bg, 'Запазено описание') } }
  const handler = createProfileUpdateHandler(deps)
  const ownerBody = profile => request({ businessId: id, revision: 7, profile, reviewRequestsEnabled: true })
  assert.equal((await handler(ownerBody({ ...profile, latitude: 0, longitude: 0 }))).status, 422)
  assert.equal(lookups, 0); assert.equal(writes, 0)
  assert.equal((await handler(ownerBody({ ...profile, latitude: null, longitude: null }))).status, 200)
  assert.equal(lookups, 1); assert.equal(writes, 1)
})

test('admin route retains one existing transactional RPC and no source deletion or booking mutation outside it', async () => {
  const route = await readFile(new URL('../app/api/admin/businesses/[id]/content/route.js', import.meta.url), 'utf8')
  assert.match(route, /readBusiness:/)
  assert.match(route, /city_ekatte,neighborhood,address,public_profile,content_revision/)
  assert.equal((route.match(/\.rpc\('edit_business_content'/g) || []).length, 1)
  assert.doesNotMatch(route, /registration_location_sources|\.delete\(|\.update\(/)
})
