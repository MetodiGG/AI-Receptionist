import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { interpretDiscoveryIntent } from '../lib/discovery/ai-intent.mjs'
import { DISCOVERY_CATEGORIES } from '../lib/discovery/categories.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'
import { normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'

const origin = { latitude: 42.6627, longitude: 23.2849, consent: true }
const input = patch => discoveryRequestSchema.parse({ query: '', browse: true, ...patch })
const business = (id, industry, service, patch = {}) => ({ id, name: service, slug: `demo-${id}`, city: 'София', city_ekatte: '68134', industry, platform_status: 'enabled', active: true, services: [{ id: `s-${id}`, name: service, active: true, duration_min: 30 }], ...patch })
function deps(patch = {}) {
  const calls = { fetch: [], budget: [] }
  return { calls, config: { ...discoveryConfig({}), enabled: true, uiKitEnabled: true, googleKey: 'fake-server-key', browserKey: 'fake-restricted-browser-key', searchV2Enabled: true, aiEnabled: true, aiKey: 'fake-ai-key' },
    claimBudget: async (...args) => { calls.budget.push(args); return true },
    fetcher: async (url, init) => { calls.fetch.push({ url, init }); return Response.json({ places: [{ id: 'DEMO_PLACE', location: origin }] }) },
    allowAttempt: async () => true, readInternal: async () => [], readLinks: async () => [],
    getBusiness: () => assert.fail('browse must not check or claim appointment availability'), getSlots: () => assert.fail('browse must not check slots'),
    ...patch,
  }
}

test('empty-query browse is explicit; ordinary empty/short queries and injected billing/types remain invalid', () => {
  assert.equal(input().browse, true)
  for (const patch of [{ browse: false }, { browse: undefined }, { query: 'x' }, { query: 'маникюр' }, { includedTypes: ['restaurant'] }, { fieldMask: '*' }, { apiKey: 'attack' }, { radiusKm: 1000 }, { cityCode: '00000' }, { coordinates: { ...origin, consent: false } }]) {
    assert.equal(discoveryRequestSchema.safeParse({ query: '', browse: true, ...patch }).success, false, JSON.stringify(patch))
  }
  assert.equal(discoveryRequestSchema.safeParse({ query: 'маникюр' }).success, true)
})
test('automatic browsing defaults to Sofia without forging coordinates, category, date or availability', () => {
  for (const v2 of [false, true]) {
    const intent = parseIntent(input(), undefined, { v2 })
    assert.equal(intent.cityCode, '68134'); assert.equal(intent.city, 'София'); assert.equal(intent.coordinates, null)
    assert.equal(intent.category, null); assert.equal(intent.service, null); assert.equal(intent.date, null)
    assert.equal(intent.clarification, null); assert.equal(intent.radiusKm, 2)
  }
  const selected = parseIntent(input({ cityCode: '56784' }))
  assert.equal(selected.city, 'Пловдив')
  const nearby = parseIntent(input({ cityCode: '68134', coordinates: origin }))
  assert.equal(nearby.cityCode, null); assert.equal(nearby.city, null)
  assert.deepEqual(nearby.coordinates, { latitude: origin.latitude, longitude: origin.longitude })
})
test('empty browsing never calls the AI model or reserves an AI budget even when AI is configured', async () => {
  const result = await interpretDiscoveryIntent(input(), { config: { aiEnabled: true, aiKey: 'fake' }, claimBudget: () => assert.fail('no AI budget'), fetcher: () => assert.fail('no AI request') })
  assert.equal(result.mode, 'browse'); assert.equal(result.intent.browse, true)
})
test('nearby browse sends one multi-category distance request, while city browse sends one IDs-only text request', async () => {
  const near = googleSearchRequest(parseIntent(input({ coordinates: origin })))
  assert.equal(near.method, 'nearby'); assert.equal(near.body.rankPreference, 'DISTANCE')
  assert.equal(near.body.locationRestriction.circle.radius, 2000)
  assert.deepEqual(near.body.includedTypes, [...new Set(DISCOVERY_CATEGORIES.flatMap(item => item.types))])
  assert.ok(near.body.includedTypes.includes('car_repair')); assert.ok(near.body.includedTypes.includes('sports_coaching')); assert.ok(near.body.includedTypes.includes('consultant'))
  assert.ok(near.body.includedTypes.length <= 50); assert.equal(near.body.maxResultCount, 12)
  const d = deps(), result = await discoverBusinesses(input(), d)
  assert.equal(d.calls.fetch.length, 1); assert.equal(result.externalStatus, 'ui_kit')
  assert.deepEqual(d.calls.budget, [['google', 'ids'], ['google', 'ui_list']])
  const request = d.calls.fetch[0]
  assert.equal(request.init.headers['X-Goog-FieldMask'], 'places.id')
  assert.match(JSON.parse(request.init.body).textQuery, /услуги с предварително записване, София, България/)
  assert.doesNotMatch(JSON.stringify(result), /fake-server-key|fake-ai-key|appointment.*verified/)
})
test('all-category browsing includes active services from different industries, preserving city, publication and radius gates', () => {
  const rows = [business('hair', 'beauty', 'Подстригване'), business('auto', 'auto', 'Смяна на масло'), business('sports', 'fitness', 'Пилатес'), business('tutor', 'education', 'Математика'),
    business('off', 'beauty', 'Маникюр', { active: false }), business('hidden', 'beauty', 'Маникюр', { platform_status: 'disabled' }), business('other-city', 'auto', 'Ремонт', { city_ekatte: '56784' }), business('empty', 'auto', 'Ремонт', { services: [] })]
  const intent = { ...parseIntent(input()), searchV2: true }
  assert.deepEqual(normalizeInternalBusinesses(rows, intent).map(row => row.id), ['hair', 'auto', 'sports', 'tutor'])
  const located = rows.slice(0, 2).map(row => ({ ...row, public_profile: { latitude: origin.latitude, longitude: origin.longitude } }))
  assert.equal(normalizeInternalBusinesses([...located, rows[2]], { ...parseIntent(input({ coordinates: origin })), searchV2: true }).length, 2)
})
test('a browse category still requires actual service evidence and does not become an all-category search', () => {
  const intent = { ...parseIntent(input({ category: 'auto_repair' })), searchV2: true }
  const rows = normalizeInternalBusinesses([business('hair', 'beauty', 'Подстригване'), business('auto', 'auto', 'Ремонт на кола')], intent)
  assert.deepEqual(rows.map(row => row.id), ['auto'])
  assert.equal(googleSearchRequest(intent).body.includedType, 'car_repair')
})
test('zero or several registered businesses work with one bounded browse and never query appointment slots', async () => {
  for (const rows of [[], [business('auto', 'auto', 'Ремонт'), business('hair', 'beauty', 'Подстригване')]]) {
    const d = deps({ readInternal: async () => rows }), result = await discoverBusinesses(input(), d)
    assert.equal(result.results.length, rows.length); assert.deepEqual(result.external.placeIds, ['DEMO_PLACE'])
    assert.ok(result.results.every(row => row.availability.status === 'unknown'))
    assert.equal(d.calls.fetch.length, 1)
  }
})
test('nearby automatic browse is consented, budgeted, distance-bounded and does not fan out per category', async () => {
  const d = deps(), result = await discoverBusinesses(input({ coordinates: origin, expandNearby: true }), d)
  assert.equal(d.calls.fetch.length, 1); assert.deepEqual(d.calls.budget, [['google', 'nearby'], ['google', 'ui_list']])
  assert.equal(d.calls.fetch[0].init.headers['X-Goog-FieldMask'], 'places.id,places.location')
  assert.equal(JSON.parse(d.calls.fetch[0].init.body).locationRestriction.circle.radius, 5000)
  assert.deepEqual(result.nearbyExpansion, { primaryRadiusKm: 2, outerRadiusKm: 5 })
  assert.doesNotMatch(JSON.stringify(result.external), /latitude|longitude/)
})
test('quota exhaustion, missing key and Google failure leave real partner browse available without retries', async () => {
  for (const [patch, expected] of [[{ claimBudget: async () => false, fetcher: () => assert.fail('quota') }, 'quota'], [{ config: { ...deps().config, browserKey: '' }, fetcher: () => assert.fail('key') }, 'not_configured'], [{ fetcher: async () => { throw new Error('provider unavailable') } }, 'unavailable']]) {
    const result = await discoverBusinesses(input(), deps({ readInternal: async () => [business('auto', 'auto', 'Ремонт')], ...patch }))
    assert.equal(result.results.length, 1); assert.equal(result.externalStatus, expected); assert.equal(result.external, null)
  }
})
test('automatic browse uses the same same-site and rate-limit checks as manual search', async () => {
  const request = headers => new Request('https://www.gorez.co/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(input()) })
  const d = deps({ allowAttempt: async () => false, fetcher: () => assert.fail('no provider on rejected attempt') })
  assert.equal((await createDiscoveryHandler(d)(request({ Origin: 'https://attacker.example' }))).status, 403)
  assert.equal((await createDiscoveryHandler(d)(request({ Origin: 'https://www.gorez.co' }))).status, 429)
})
test('frontend defers a single initial browse until location resolves and does not auto-scroll away from the homepage', async () => {
  const source = await readFile(new URL('../components/discovery-search.js', import.meta.url), 'utf8')
  assert.match(source, /await locate\(\{ automatic: true, searchAfter: false \}\)/)
  assert.match(source, /search\(input, \{ navigate: Boolean\(initial\) \}\)/)
  assert.match(source, /browse: home && !next.query.trim\(\)/)
  assert.match(source, /!scrollAfterSearch.current/)
  assert.match(source, /if \(inFlight.current\) return/)
  assert.doesNotMatch(source, /setInterval|watchPosition|localStorage|sessionStorage/)
  const empty = discoverySearchInput({ browse: true, coordinates: null })
  assert.equal(empty.browse, true); assert.equal(empty.cityCode, '68134'); assert.equal(empty.coordinates, undefined)
  const typed = discoverySearchInput({ browse: true, query: 'маникюр', coordinates: origin, expandNearby: true })
  assert.equal(typed.browse, undefined); assert.deepEqual(typed.coordinates, origin)
})
