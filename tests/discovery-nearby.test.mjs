import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { nearbySearchScope, partitionNearbyPlaceIds } from '../lib/discovery/nearby.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'
import { fictionalDiscoveryBusinesses, fictionalGoogleResponse } from '../lib/discovery/mock.mjs'
import { rankDiscoveryResults } from '../lib/discovery/ranking.mjs'
import { normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'

const now = DateTime.fromISO('2026-11-02T09:00:00Z')
const coordinates = { latitude: 42.6977, longitude: 23.3219, consent: true }
const request = (patch = {}) => discoveryRequestSchema.parse(discoverySearchInput({ query: 'маникюр', coordinates, expandNearby: true, ...patch }))
const parse = input => ({ ...parseIntent(input, now, { v2: true }), searchV2: true })
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
function dependencies(patch = {}) {
  const calls = { fetch: [], budget: [] }
  const config = { ...discoveryConfig({ DISCOVERY_PROVIDER_MODE: 'google', DISCOVERY_ENABLED: 'true' }), searchV2Enabled: true, uiKitEnabled: true, browserKey: 'test-only-browser', googleKey: 'test-only-server' }
  return { now, config, calls, readInternal: async intent => fictionalDiscoveryBusinesses(intent), readLinks: async () => [],
    claimBudget: async (...args) => { calls.budget.push(args); return true },
    fetcher: async (url, init) => { calls.fetch.push({ url, init }); return Response.json(fictionalGoogleResponse(JSON.parse(init.body))) },
    getBusiness: async () => assert.fail('no availability without a date'), getSlots: async () => assert.fail('no slots without a date'), ...patch,
  }
}

test('single nearby UI mode retains a 2 km primary radius and bounds its additional batch at 5 km', () => {
  const input = request(), scope = nearbySearchScope(input, parse(input))
  assert.equal(scope.primaryRadiusKm, 2); assert.equal(scope.outerRadiusKm, 5)
  assert.equal(scope.searchIntent.radiusKm, 5); assert.equal(scope.searchIntent.primaryRadiusKm, 2)
  assert.equal(parse(input).radiusKm, 2)
  for (const patch of [{ coordinates: null }, { expandNearby: false }, { radiusKm: 1 }, { radiusKm: 3 }, { radiusKm: 25 }, { query: 'маникюр до 2 км' }, { query: 'nails within 2 km' }, { query: 'маникюр София' }, { query: 'маникюр във Връбница' }]) {
    const value = request(patch), plan = nearbySearchScope(value, parse(value))
    assert.equal(plan.expanded, false, JSON.stringify(patch))
  }
  assert.equal(discoveryRequestSchema.safeParse({ query: 'маникюр', expandNearby: true }).success, false)
})

test('independently verified booking links prioritize only their own radius band without extra Google requests', async () => {
  const deps = dependencies({ readBookablePlaces: async ids => {
    assert.ok(ids.includes('QA_FICTIONAL_PLACE_1'))
    return [{ place_id: 'QA_FICTIONAL_PLACE_1', booking_url: 'https://example.com/book', verification_status: 'approved', verified_by: 'admin', verified_at: new Date().toISOString(), last_checked_at: new Date().toISOString() }]
  } })
  const result = await discoverBusinesses(request(), deps)
  assert.deepEqual(result.external.placeIds, ['QA_FICTIONAL_PLACE_1', 'QA_FICTIONAL_PLACE_0'])
  assert.deepEqual(result.furtherExternal.placeIds, ['QA_FICTIONAL_PLACE_2'])
  assert.equal(deps.calls.fetch.length, 1)
  assert.equal(deps.calls.budget.filter(call => call[1] === 'ui_list').length, 2)
})

test('an unavailable booking register retains provider order and never fabricates bookability', async () => {
  const deps = dependencies({ readBookablePlaces: async () => { throw new Error('unavailable') } })
  const result = await discoverBusinesses(request(), deps)
  assert.deepEqual(result.external.placeIds, ['QA_FICTIONAL_PLACE_0', 'QA_FICTIONAL_PLACE_1'])
  assert.equal(deps.calls.fetch.length, 1)
  assert.equal(result.external.booking, undefined)
})

test('both Nearby and free-text location searches request distance order without increasing fields', () => {
  for (const query of ['маникюр', 'педикюр', 'тенис']) {
    const input = request({ query }), scope = nearbySearchScope(input, parse(input)), search = googleSearchRequest(scope.searchIntent)
    assert.equal(search.body.rankPreference, 'DISTANCE')
    assert.equal((search.body.locationRestriction || search.body.locationBias).circle.radius, 5000)
  }
})

test('the EEA batch uses one provider search, separates bands, exposes IDs only and reserves every widget', async () => {
  const deps = dependencies(), result = await discoverBusinesses(request(), deps)
  assert.equal(deps.calls.fetch.length, 1)
  assert.equal(deps.calls.fetch[0].init.headers['X-Goog-FieldMask'], 'places.id,places.location')
  assert.deepEqual(result.external.placeIds, ['QA_FICTIONAL_PLACE_0', 'QA_FICTIONAL_PLACE_1'])
  assert.deepEqual(result.furtherExternal.placeIds, ['QA_FICTIONAL_PLACE_2'])
  assert.deepEqual(result.nearbyExpansion, { primaryRadiusKm: 2, outerRadiusKm: 5 })
  assert.deepEqual(result.results.map(row => [row.distanceKm, row.proximityBand]), [[.7, 'nearby'], [1.8, 'nearby'], [4.2, 'further']])
  assert.deepEqual(deps.calls.budget, [['google', 'nearby'], ['google', 'ui_list'], ['google', 'ui_list']])
  assert.doesNotMatch(JSON.stringify([result.external, result.furtherExternal]), /latitude|longitude|displayName|test-only-server|5\.04/)
})

test('zero GoRez partners still produce distinct useful Google distance bands', async () => {
  const result = await discoverBusinesses(request(), dependencies({ readInternal: async () => [] }))
  assert.equal(result.results.length, 0); assert.equal(result.external.placeIds.length, 2); assert.equal(result.furtherExternal.placeIds.length, 1)
})

test('farther partners cannot consume the result cap before closer external places', async () => {
  const deps = dependencies({ config: { ...dependencies().config, maxResults: 2 } })
  const result = await discoverBusinesses(request(), deps)
  assert.deepEqual(result.results.map(row => row.distanceKm), [.7, 1.8])
  assert.equal(result.furtherExternal, null)
  const onlyFar = dependencies({ config: { ...dependencies().config, maxResults: 2 }, readInternal: async intent => fictionalDiscoveryBusinesses(intent).filter(row => row.name.includes('4.2')) })
  const other = await discoverBusinesses(request(), onlyFar)
  assert.equal(other.results.length, 0); assert.equal(other.external.placeIds.length, 2); assert.equal(other.furtherExternal, null)
})

test('UI list quota exhaustion never mounts an unbudgeted farther widget or removes owned results', async () => {
  const deps = dependencies()
  let widgets = 0
  deps.claimBudget = async (_provider, method) => method !== 'ui_list' || ++widgets === 1
  const result = await discoverBusinesses(request(), deps)
  assert.ok(result.external); assert.equal(result.furtherExternal, null); assert.ok(result.warnings.includes('expansion_quota'))
  assert.equal(result.results.length, 3)
})

test('distance ordering inside the partner group wins over availability/completeness signals', () => {
  const input = request(), scope = nearbySearchScope(input, parse(input))
  const rows = normalizeInternalBusinesses(fictionalDiscoveryBusinesses(scope.searchIntent), scope.searchIntent)
  const ranked = rankDiscoveryResults(rows.map(row => row.distanceKm === 1.8 ? { ...row, availability: { status: 'verified', slots: [] } } : row), [], scope.searchIntent)
  assert.deepEqual(ranked.map(row => row.distanceKm), [.7, 1.8, 4.2])
})

test('an inconsistent farther partner link never suppresses a more convenient Google result', async () => {
  const deps = dependencies({ readLinks: async () => [{ business_id: '00000000-0000-4000-8000-000000000003', place_id: 'QA_FICTIONAL_PLACE_0' }] })
  const result = await discoverBusinesses(request(), deps)
  assert.ok(result.external.placeIds.includes('QA_FICTIONAL_PLACE_0'))
  assert.equal(result.results.some(row => row.distanceKm === 4.2), false)
})

test('one rail retains widget plans and has no source toggles that could cause re-instantiation', async () => {
  const source = await read('components/discovery-home-browse.js'), search = await read('components/discovery-search.js')
  assert.match(source, /google\(result\?\.external, 'near-google'\)/)
  assert.match(source, /google\(result\?\.furtherExternal, 'far-google'\)/)
  assert.match(source, /showFurther &&/)
  assert.match(source, /const showFurther = catalogueMode \|\| expanded/)
  assert.doesNotMatch(search, /setSource|discovery-source-tabs/)
  const widget = await read('components/google-discovery-list.js')
  assert.match(widget, /\}, \[plan, rail, vertical, nearby\]\)/)
  assert.match(source, /<GoogleDiscoveryList plan=\{plan\} locale=\{locale\} rail vertical/)
  assert.match(widget, /if \(rail && !vertical\) list.setAttribute\('orientation', 'horizontal'\)/)
  assert.match(widget, /rail \? 'open-directions' : 'open-map'/)
  assert.match(widget, /rail \? <GoogleBookingSelection/)
})

test('unknown distances and full-precision boundary violations never leak into the 2 km band', () => {
  const scope = { expanded: true, primaryRadiusKm: 2, outerRadiusKm: 5 }
  const groups = partitionNearbyPlaceIds({ placeIds: ['A', 'B', 'C', 'D', 'E'], placeDistances: { A: 1.9999, B: 2.0001, C: 5.0001, D: null } }, scope)
  assert.deepEqual(groups, { nearby: ['A'], further: ['B'] })
})

test('one location label, explicit on/off consent and visible partner entry are retained', async () => {
  const ui = await read('components/discovery-search.js')
  assert.equal(DISCOVERY_COPY.bg.nearby, 'Около мен'); assert.doesNotMatch(DISCOVERY_COPY.bg.changeCity, /наблизо|около мен/iu)
  assert.match(ui, /if \(!automatic && locationEnabled\) \{[\s\S]*?setCoordinates\(null\)/)
  assert.ok(ui.indexOf('if (!automatic && locationEnabled) {') < ui.indexOf('await locationProvider('))
  assert.match(ui, /aria-pressed=\{locationEnabled\}/)
  assert.doesNotMatch(ui, /copy\.locationSet|copy\.clearLocation/)
  assert.match(ui, /className="discovery-partner-entry"><Link href=\{`\/partners\?lang=/)
  const more = await read('components/discovery-nearby-more.js')
  assert.match(more, /visible && scrolled/); assert.match(more, /window.scrollY > startY \+ 120/)
  assert.doesNotMatch(more, /fetch\(|getCurrentPosition|watchPosition|localStorage|sessionStorage/)
  const route = await read('app/dev/nearby/page.js')
  assert.match(route, /if \(!discoveryConfig\(process\.env\)\.devMock\) notFound\(\)/)
})
