import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { discoveryRequestSchema, neighborhoodChoices, parseIntent } from '../lib/discovery/intent.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { displayDistanceKm, distanceKm, matchesNeighborhood, normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { rankDiscoveryResults, RANKING_VERSION } from '../lib/discovery/ranking.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'

const now = DateTime.fromISO('2026-10-30T09:00:00Z')
const origin = { latitude: 42.7, longitude: 23.3, consent: true } // Synthetic test point, never a user's location.
const atKm = km => ({ latitude: origin.latitude + km / 6371 * 180 / Math.PI, longitude: origin.longitude })
const parse = (query = 'барбершоп във Връбница', patch = {}) => parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query, ...patch })), now)
const business = (patch = {}) => ({ id: '10000000-0000-4000-8000-000000000001', slug: 'offline-local-barber', name: 'Offline local barber', active: true, platform_status: 'enabled', industry: 'beauty', city_ekatte: '68134', city: 'София', neighborhood: 'Връбница 1', address: 'Offline test address', services: [{ id: 'service', name: 'Мъжко подстригване', active: true, price: 20, currency: 'EUR', duration_min: 30 }], staff: [], workingHours: [], ...patch })
const external = (patch = {}) => ({ id: 'google:EXTERNAL_TEST', placeId: 'EXTERNAL_TEST', source: 'google', name: 'Offline external example', address: 'Offline external address', category: 'barber', coordinates: null, services: [], availability: { status: 'unknown', slots: [] }, ...patch })
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('Vrabnitsa is recognised as a whole district in BG/EN as well as its numbered parts', () => {
  assert.ok(neighborhoodChoices('68134').includes('Връбница'))
  assert.ok(neighborhoodChoices('68134').includes('Обеля'))
  for (const query of ['барбершоп във Връбница', 'barber in Vrabnitsa, Sofia']) {
    const intent = parse(query)
    assert.equal(intent.neighborhood, 'Връбница'); assert.equal(intent.cityCode, '68134'); assert.equal(intent.clarification, null)
    assert.match(googleSearchRequest(intent).body.textQuery, /Връбница/)
  }
  assert.equal(parse('барбершоп във Връбница 2').neighborhood, 'Връбница 2')
  const nearby = parse('барбершоп във Връбница', { coordinates: origin })
  assert.equal(nearby.cityCode, null); assert.equal(nearby.neighborhood, 'Връбница')
})

test('a Vrabnitsa search never widens to a Manastirski Livadi partner, even when there are no local partners', () => {
  const intent = parse(), far = business({ id: 'far', neighborhood: 'Манастирски ливади' })
  assert.deepEqual(normalizeInternalBusinesses([far], intent), [])
  const local = business(), partTwo = business({ id: 'two', neighborhood: 'Връбница 2' })
  assert.deepEqual(normalizeInternalBusinesses([far, local, partTwo], intent).map(row => row.id), [local.id, 'two'])
  const cityScope = parse('барбершоп в София'), notYetFiltered = normalizeInternalBusinesses([far], cityScope)
  assert.deepEqual(rankDiscoveryResults(notYetFiltered, [external()], intent).map(row => row.source), ['google'])
})

test('quarter matches tolerate registry prefixes/transliteration but never replace one numbered part with another', () => {
  assert.equal(matchesNeighborhood('ж.к. Връбница 1', 'Връбница'), true)
  assert.equal(matchesNeighborhood('Връбница 2', 'Vrabnitsa'), true)
  assert.equal(matchesNeighborhood('Връбница 2', 'Връбница 1'), false)
  assert.equal(matchesNeighborhood('Младост 10', 'Младост 1'), false)
  assert.equal(matchesNeighborhood('', 'Връбница'), false)
  assert.equal(matchesNeighborhood('Манастирски ливади', 'Връбница'), false)
})

test('eligible partners always precede a higher-scoring external business, including at the display cap', () => {
  const intent = parse('барбершоп', { coordinates: origin }), rows = normalizeInternalBusinesses([business({ public_profile: atKm(1.8) })], intent)
  const result = rankDiscoveryResults(rows, [external({ coordinates: atKm(0) })], intent)
  assert.equal(result[0].source, 'gorez'); assert.equal(result[1].source, 'google')
  assert.ok(result[1].ranking.score > result[0].ranking.score, 'partner tier must not depend on an inflated score')
  assert.equal(result[0].ranking.group, 'partner'); assert.equal(RANKING_VERSION, 'local-partners-reputation-v4')
  assert.deepEqual(rankDiscoveryResults(rows, [external({ coordinates: atKm(0) })], intent, { maxResults: 1 }).map(row => row.source), ['gorez'])
})

test('radius eligibility uses unrounded distance; missing, stale or invalid distances cannot bypass it', () => {
  for (const radiusKm of [1, 2]) {
    const intent = parse('барбершоп', { coordinates: origin, radiusKm }), justOutside = atKm(radiusKm + .04)
    assert.equal(displayDistanceKm(distanceKm(origin, justOutside)), radiusKm)
    assert.deepEqual(normalizeInternalBusinesses([business({ public_profile: justOutside })], intent), [])
    assert.equal(normalizeInternalBusinesses([business({ public_profile: atKm(radiusKm - .01) })], intent).length, 1)
    for (const coordinates of [null, justOutside, { latitude: NaN, longitude: 23.3 }]) assert.deepEqual(rankDiscoveryResults([], [external({ coordinates, distanceKm: 0 })], intent), [])
  }
})

test('a partner name cannot substitute for real service, publication, city or budget eligibility', () => {
  const intent = parse('барбершоп във Връбница до 25 евро')
  for (const patch of [{ services: [{ id: 'wrong', name: 'Маникюр', active: true, price: 20 }] }, { active: false }, { platform_status: 'pending' }, { platform_status: 'suspended' }, { city_ekatte: '10135' }, { services: [{ ...business().services[0], price: 30 }] }, { services: [{ ...business().services[0], active: false }] }]) {
    assert.deepEqual(normalizeInternalBusinesses([business({ name: 'Barbershop partner', ...patch })], intent), [])
  }
})

test('known unavailable partners are not promoted; unknown times stay explicitly unknown, never invented', () => {
  const intent = parse('барбершоп във Връбница утре след 17:00'), [row] = normalizeInternalBusinesses([business()], intent)
  const unavailable = { ...row, availability: { status: 'none', slots: [] } }
  assert.deepEqual(rankDiscoveryResults([unavailable], [external()], intent).map(row => row.source), ['google'])
  const unknown = rankDiscoveryResults([row], [external()], intent)[0]
  assert.equal(unknown.availability.status, 'unknown'); assert.deepEqual(unknown.availability.slots, [])
})

test('an excluded partner does not suppress a Google result through a verified Place ID link', () => {
  const [wrongArea] = normalizeInternalBusinesses([business({ neighborhood: 'Манастирски ливади' })], parse('барбершоп София'))
  const result = rankDiscoveryResults([wrongArea], [external()], parse(), { links: [{ business_id: wrongArea.id, place_id: 'EXTERNAL_TEST' }] })
  assert.deepEqual(result.map(row => row.source), ['google'])
})

test('EEA UI Kit keeps provider order and restores linked IDs when a partner is excluded after availability checking', async () => {
  const config = discoveryConfig({ DISCOVERY_ENABLED: 'true', GOOGLE_PLACES_UI_KIT_ENABLED: 'true', GOOGLE_PLACES_UI_KIT_APPROVED: 'true', GOOGLE_MAPS_BROWSER_KEY: 'fake-browser-test-only', GOOGLE_PLACES_API_KEY: 'fake-server-test-only' })
  const result = await discoverBusinesses(discoveryRequestSchema.parse(discoverySearchInput({ query: 'барбершоп във Връбница утре след 17:00' })), {
    now, config, claimBudget: async () => true, readInternal: async () => [business()],
    fetcher: async () => Response.json({ places: [{ id: 'EXTERNAL_FIRST' }, { id: 'EXTERNAL_TEST' }, { id: 'EXTERNAL_LAST' }] }),
    readLinks: async () => [{ business_id: business().id, place_id: 'EXTERNAL_TEST' }],
    getBusiness: async () => ({ timezone: 'Europe/Sofia', services: [{ id: 'service' }] }), getSlots: async () => [],
  })
  assert.deepEqual(result.results, [])
  assert.deepEqual(result.external.placeIds, ['EXTERNAL_FIRST', 'EXTERNAL_TEST', 'EXTERNAL_LAST'])
  assert.doesNotMatch(JSON.stringify(result), /fake-server-test-only/)
})

test('city-only searches do not fabricate a nearby distance and do not request location permission', () => {
  const intent = parse('барбершоп в София'), [row] = normalizeInternalBusinesses([business()], intent)
  const result = rankDiscoveryResults([row], [external()], intent)
  assert.equal(result[0].source, 'gorez'); assert.equal(result[0].distanceKm, null); assert.equal(intent.coordinates, null)
})

test('eligible partners lead the unified rail and only genuine partners carry the logo badge', async () => {
  const ui = await read('components/discovery-business-card.js'), rail = await read('components/discovery-home-browse.js'), css = await read('app/discovery-home.css')
  assert.ok(rail.indexOf('{nearRows.map(card)}') < rail.indexOf("google(result?.external, 'near-google')"))
  assert.match(ui, /internal && <span className="home-business-partner"/)
  assert.match(ui, /<BrandMark size=\{20\}/)
  assert.match(css, /\.home-business-partner[^}]*color: #8b421c/)
  assert.match(css, /\.home-business-partner[^}]*font-size: 16px/)
  for (const locale of ['bg', 'en']) {
    assert.ok(DISCOVERY_COPY[locale].partnerResults.includes('GoRez'))
    assert.doesNotMatch(DISCOVERY_COPY[locale].rankingHint, /small convenience bonus|малък бонус|No paid ranking|Без платено подреждане/)
  }
})
