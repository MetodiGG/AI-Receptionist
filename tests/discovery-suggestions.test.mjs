import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { discoverySuggestions, createDiscoverySuggestionsHandler, parseDiscoverySuggestionInput } from '../lib/discovery/suggestions.mjs'
import { createSuggestionInteractionCache, validSuggestionResponse } from '../lib/discovery/suggestions-ui.mjs'
import { PUBLIC_SEARCH_INDEX_FIELDS, completeSearchServices, readPublishedSearchInventory, readPublishedSearchCandidates } from '../lib/discovery/public-search-inventory.mjs'

const now = () => Date.parse('2026-11-14T12:00:00Z')
const partner = (patch = {}) => ({ id: '11111111-1111-4111-8111-111111111111', active: true, platform_status: 'enabled', slug: 'qa-real-public-identity', name: 'QA Public Nail Studio', city_ekatte: '68134', city: 'София', neighborhood: 'Манастирски ливади', industry: 'beauty', booking_mode: 'external', services: [{ id: 's1', name: 'Маникюр', category: 'nails', active: true, price: 30, currency: 'EUR' }], ...patch })
const flattened = result => result.groups.flatMap(group => group.items)
const query = (value, data = {}, patch = {}) => discoverySuggestions({ catalogue: SOFIA_CATALOGUE, ...data }, { query: value, ...patch }, { now: now() })

test('suggestions start at two characters, expose three labelled real groups and never exceed eight', () => {
  assert.throws(() => parseDiscoverySuggestionInput({ query: 'м' }))
  const result = query('ма', { partners: [partner()] })
  assert.ok(result.total > 0 && result.total <= 8)
  assert.deepEqual(result.groups.map(group => group.label), ['Услуги', 'Бизнеси', 'Категории'])
  assert.ok(validSuggestionResponse(result))
  for (const item of flattened(result)) {
    assert.equal(item.rating, undefined); assert.equal(item.availableSlots, undefined); assert.equal(item.popularityScore, undefined)
    if (item.source === 'catalogue') assert.ok(approvedCatalogueRecord(SOFIA_CATALOGUE.find(row => row.id === item.id), now()))
  }
})

test('BG, English, Latin spelling and reasonable typos reuse maintained service evidence', () => {
  for (const text of ['маникюр', 'manicure', 'manikiur', 'manikur', 'маникур']) {
    const items = flattened(query(text))
    assert.ok(items.some(item => item.kind === 'service' && /маникюр/iu.test(item.query)), text)
  }
  for (const text of ['frizior', 'barber', 'avtoserviz', 'гуми']) assert.ok(query(text).total > 0, text)
  const haircut = flattened(query('искам да се подстрижа')).filter(item => item.kind === 'service')
  assert.ok(haircut.some(item => item.query === 'подстригване'))
  assert.equal(haircut.some(item => /куче|гризач|груминг|котк/iu.test(item.label)), false)
})

test('service plus a typed neighborhood keeps the actual neighborhood restriction including capital letters', () => {
  const result = query('маникюр в Манастирски ливади')
  assert.ok(result.total > 0)
  assert.ok(flattened(result).filter(item => item.kind === 'service').every(item => item.neighborhood === 'Манастирски ливади'))
  for (const item of flattened(result).filter(item => item.kind === 'business')) assert.match(item.detail, /^Манастирски ливади/)
})

test('real business suggestions have canonical profiles and only native public partners carry the badge', () => {
  const native = partner({ name: 'QA Authentic Brand' })
  const found = flattened(query('QA Authentic', { partners: [native] })).find(item => item.id === native.id)
  assert.equal(found.partner, true)
  assert.equal(found.href, '/book/qa-real-public-identity?lang=bg')
  const kerelski = flattened(query('Kerelski')).find(item => item.kind === 'business')
  assert.equal(kerelski.source, 'catalogue'); assert.equal(kerelski.partner, false)
  assert.match(kerelski.href, /^\/businesses\/catalogue\/sofia-kerelski.*\?lang=bg$/)
  const twoLetters = flattened(query('IN')).filter(item => item.kind === 'business')
  assert.ok(twoLetters.some(item => item.label.startsWith('IN Beauty')))
})

test('inactive, pending, missing-publication and out-of-city partner rows never enter suggestions', () => {
  const rows = [partner({ active: false }), partner({ platform_status: 'pending' }), partner({ platform_status: undefined }), partner({ city_ekatte: '56784' })]
  const result = discoverySuggestions({ catalogue: [], partners: rows }, { query: 'QA' }, { now: now() })
  assert.equal(result.total, 0)
  const unknown = query('zzz непозната търсачка zzz')
  assert.equal(unknown.total, 0)
  assert.ok(unknown.alternatives.length > 0 && unknown.alternatives.every(item => item.kind === 'category'))
  assert.equal(query('невролог').groups.some(group => group.items.some(item => item.kind === 'business')), false)
})

test('published name-only businesses remain discoverable without invented services or booking availability', () => {
  const native = partner({ name: 'Distinct Empty Menu Brand', services: [] })
  const result = discoverySuggestions({ catalogue: [], partners: [native] }, { query: 'Distinct Empty' }, { now: now() })
  assert.equal(result.total, 1)
  assert.deepEqual(result.groups.map(group => group.kind), ['business'])
  assert.equal(flattened(result)[0].id, native.id)
  assert.equal(flattened(result)[0].availableSlots, undefined)
})

test('catalogue duplicates use independently matching public identity rather than similar names alone', () => {
  const record = SOFIA_CATALOGUE.find(row => row.id === 'sofia-kerelski-manastirski-livadi')
  const native = partner({ name: record.name, phone: record.phone, address: record.address })
  const result = discoverySuggestions({ catalogue: [record], partners: [native] }, { query: 'Kerelski' }, { now: now() })
  assert.deepEqual(flattened(result).filter(item => item.kind === 'business').map(item => item.source), ['gorez'])
  const unrelated = discoverySuggestions({ catalogue: [record], partners: [partner({ name: record.name })] }, { query: 'Kerelski' }, { now: now() })
  assert.equal(flattened(unrelated).filter(item => item.kind === 'business').length, 2)
})

function request(body, headers = {}) { return new Request('https://gorez.example/api/public/discovery/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }) }
test('suggestion HTTP boundary validates before DB work and rejects GPS, duplicate unknown fields and cross-site requests', async () => {
  let reads = 0
  const handler = createDiscoverySuggestionsHandler({ config: { enabled: true }, catalogue: SOFIA_CATALOGUE, allowAttempt: async () => true, readInventory: async () => { reads++; return [] }, revalidatePartners: async () => [], now })
  for (const body of [{ query: 'м' }, { query: 'ма', coordinates: { latitude: 42.7, longitude: 23.3 } }, { query: 'ма', cityCode: 'not-city' }]) assert.equal((await handler(request(body))).status, 422)
  assert.equal(reads, 0)
  assert.equal((await handler(request({ query: 'ма' }, { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' }))).status, 403)
  assert.equal(reads, 0)
})

test('stale partner metadata is revalidated and revoked profiles/services cannot provide business or service/category suggestions', async () => {
  const stale = partner({ name: 'Unique Old Brand', services: [{ id: 's1', name: 'Уникална услуга', category: 'nails', active: true }] })
  let ids
  const handler = createDiscoverySuggestionsHandler({ config: { enabled: true }, catalogue: [], allowAttempt: async () => true, readInventory: async () => [stale], revalidatePartners: async requested => { ids = requested; return [] }, now })
  const response = await handler(request({ query: 'Unique Old' })), body = await response.json()
  assert.equal(response.status, 200); assert.deepEqual(ids, [stale.id]); assert.equal(body.total, 0)
})

test('emitted business finalists survive bounded fresh revalidation ahead of broad service evidence from forty partners', async () => {
  const partners = Array.from({ length: 40 }, (_, index) => partner({ id: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`, slug: `qa-public-brand-${index}`, name: index === 39 ? 'А Маникюр · точен публичен финалист' : `Я Маникюр · салон ${String((index * 17) % 40).padStart(2, '0')}` }))
  const finalist = partners.at(-1), requested = []
  const handler = createDiscoverySuggestionsHandler({ config: { enabled: true }, catalogue: [], allowAttempt: async () => true, readInventory: async () => partners,
    revalidatePartners: async ids => { requested.push(...ids); return partners.filter(row => ids.includes(row.id)) }, now })
  const response = await handler(request({ query: 'маникюр' })), body = await response.json()
  assert.equal(response.status, 200); assert.equal(requested.length, 24)
  assert.equal(requested[0], finalist.id, 'alphabetically emitted names reserve their fresh-validation place before broad service matches')
  assert.ok(flattened(body).some(item => item.kind === 'business' && item.id === finalist.id))
})

test('prioritized revalidation never retains a revoked finalist or its unique service evidence', async () => {
  const stale = partner({ name: 'А Маникюр · оттеглен финалист', services: [{ id: 'unique-service', name: 'Маникюр с уникална оттеглена техника', category: 'nails', active: true }] })
  const handler = createDiscoverySuggestionsHandler({ config: { enabled: true }, catalogue: [], allowAttempt: async () => true, readInventory: async () => [stale], revalidatePartners: async () => [partner({ services: [] })], now })
  const body = await (await handler(request({ query: 'маникюр' }))).json()
  assert.equal(flattened(body).some(item => item.kind === 'service' || item.kind === 'category'), false)
  assert.equal(flattened(body).some(item => item.label.includes('оттеглен')), false)
})

test('partner DB failure degrades to genuine catalogue suggestions without provider calls or invented availability', async () => {
  const handler = createDiscoverySuggestionsHandler({ config: { enabled: true }, catalogue: SOFIA_CATALOGUE, allowAttempt: async () => true, readInventory: async () => { throw Error('offline') }, revalidatePartners: () => assert.fail('no partner read needed'), now })
  const response = await handler(request({ query: 'маникюр' })), body = await response.json()
  assert.equal(response.status, 200); assert.equal(body.partial, true); assert.ok(body.total > 0)
  assert.ok(flattened(body).every(item => item.source !== 'gorez'))
  const disabled = createDiscoverySuggestionsHandler({ config: { enabled: false }, readInventory: () => assert.fail('disabled must not query'), allowAttempt: () => assert.fail('disabled must not query') })
  assert.equal((await disabled(request({ query: 'ма' }))).status, 404)
})

test('shared public index uses narrow keyset pages and a bounded short city cache rather than rich per-keystroke reads', async () => {
  let calls = 0, time = 0
  const rows = Array.from({ length: 500 }, (_, index) => partner({ id: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}` }))
  const seen = []
  const db = createClient('https://fixture.supabase.invalid', 'test-public-placeholder', { global: { fetch: async url => {
    calls++; const params = new URL(url).searchParams; seen.push(params)
    return Response.json(params.has('id') ? [] : rows)
  } } })
  const values = await Promise.all([readPublishedSearchInventory(db, { cityCode: '68134', now: () => time }), readPublishedSearchInventory(db, { cityCode: '68134', now: () => time })])
  assert.equal(values[0].length, 500); assert.equal(calls, 2, 'two pages shared by simultaneous callers')
  assert.equal(seen[0].get('active'), 'eq.true'); assert.equal(seen[0].get('platform_status'), 'eq.enabled')
  assert.equal(seen[0].get('city_ekatte'), 'eq.68134'); assert.match(seen[1].get('id'), /^gt\./)
  assert.equal(seen[0].get('select'), PUBLIC_SEARCH_INDEX_FIELDS)
  assert.doesNotMatch(PUBLIC_SEARCH_INDEX_FIELDS, /owner_id|contact_email|staff|workingHours|business_media|customers|appointments|token/)
  assert.doesNotMatch(PUBLIC_SEARCH_INDEX_FIELDS.replace(/\w+:public_profile->\w+/g, ''), /public_profile/)
  await readPublishedSearchInventory(db, { cityCode: '68134', now: () => time }); assert.equal(calls, 2)
  time = 30001; await readPublishedSearchInventory(db, { cityCode: '68134', now: () => time }); assert.equal(calls, 4)
})

test('candidate revalidation accepts only bounded public UUIDs, never raw query/filter expressions', async () => {
  const seen = []
  const db = createClient('https://fixture.supabase.invalid', 'test-public-placeholder', { global: { fetch: async url => { seen.push(new URL(url)); return Response.json([partner(), partner({ id: '22222222-2222-4222-8222-222222222222', active: false })]) } } })
  assert.deepEqual(await readPublishedSearchCandidates(db, ["');DROP TABLE businesses;--"]), [])
  assert.equal(seen.length, 0)
  const rows = await readPublishedSearchCandidates(db, [partner().id])
  assert.deepEqual(rows.map(row => row.id), [partner().id])
  assert.equal(seen[0].searchParams.get('platform_status'), 'eq.enabled')
})

test('menus at the embed limit are completed with active keyset pages; ordinary menus make no extra request', async () => {
  const seen = [], services = Array.from({ length: 500 }, (_, index) => ({ id: `service-${String(index).padStart(5, '0')}`, name: `Actual service ${index}`, active: true }))
  const last = { id: 'service-00500', name: 'Unique actual service beyond first500', active: true }
  const db = createClient('https://fixture.supabase.invalid', 'test-public-placeholder', { global: { fetch: async url => {
    const value = new URL(url); seen.push(value)
    assert.match(value.pathname, /\/services$/)
    return Response.json(value.searchParams.has('id') ? [last] : services)
  } } })
  const original = partner(), ordinary = await completeSearchServices(db, [original])
  assert.equal(ordinary[0], original); assert.equal(seen.length, 0)
  const completed = await completeSearchServices(db, [partner({ services })])
  assert.equal(completed[0].services.length, 501); assert.deepEqual(completed[0].services.at(-1), last)
  assert.equal(seen.length, 2)
  assert.equal(seen[0].searchParams.get('business_id'), `eq.${partner().id}`)
  assert.equal(seen[0].searchParams.get('active'), 'eq.true')
  assert.equal(seen[1].searchParams.get('id'), 'gt.service-00499')
})

test('interaction cache expires, remains bounded, and rejects unsafe suggestion destinations', () => {
  let time = 0
  const cache = createSuggestionInteractionCache({ now: () => time, ttlMs: 20, maxKeys: 2 })
  cache.set('a', 1); cache.set('b', 2); cache.set('c', 3)
  assert.equal(cache.get('a'), null); assert.equal(cache.get('b'), 2)
  time = 21; assert.equal(cache.get('b'), null)
  const result = query('Kerelski')
  assert.equal(validSuggestionResponse(result), true)
  result.groups[0].items[0].href = 'https://evil.example'
  assert.equal(validSuggestionResponse(result), false)
})
