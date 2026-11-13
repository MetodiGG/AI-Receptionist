import test from 'node:test'
import assert from 'node:assert/strict'
import { SOFIA_CATALOGUE, RAW_SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates, applyCatalogueCoordinateBindings } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { distanceBadge, discoveryDistanceOrigin } from '../lib/discovery/distance-origin.mjs'
import { directoryCoordinates } from '../lib/public-directory.mjs'
import { displayDistanceKm } from '../lib/discovery/distance.mjs'
import { searchFreeCatalogue } from '../lib/discovery/catalogue-search.mjs'
import { businessNameMatches } from '../lib/discovery/business-name.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { DateTime } from 'luxon'

const clock = Date.parse('2026-11-13T10:00:00Z')
const intent = { cityCode: '68134', browse: true, requirements: [] }

test('IN Beauty uses the manually resolved northern official address, never its old JSON-LD pin or an unattributed partner import', () => {
  const row = SOFIA_CATALOGUE.find(row => row.id === 'sofia-in-beauty')
  assert.equal(row.address, 'София, ул. Генерал Иван Колев 2')
  assert.equal(row.neighborhood, 'Кръстова вада')
  assert.equal(row.coordinates.method, 'verified_official_address')
  assert.equal(row.coordinates.addressId, '113534')
  assert.equal(row.coordinates.latitude, 42.65564914279809)
  assert.equal(row.coordinates.longitude, 23.31449726584672)
  const normalized = normalizeCatalogueBusinesses([row], intent, { now: clock })[0]
  assert.deepEqual(normalized.coordinates, { latitude: 42.65564914279809, longitude: 23.31449726584672 })
  assert.ok(distanceBadge(discoveryDistanceOrigin({ cityCode: '68134' }), normalized.coordinates))
  assert.equal(catalogueOnboardingDetail([row], row.id, { now: clock }).business.coordinates, undefined)
  assert.equal(new URL(businessMapsDirectionsUrl(normalized)).searchParams.get('destination'), '42.65564914279809,23.31449726584672', 'directions must use the reviewed northern point, never the old JSON-LD pair')
  assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, coordinates: { latitude: 42.70, longitude: 23.33, consent: true }, radiusKm: 1 }, { now: clock }), [])
  assert.equal(catalogueBoundCoordinates({ ...row, coordinates: {
    latitude: 42.6852, longitude: 23.3245, method: 'first_party_coordinates', source: 'https://inbeauty.bg/kontakti', sourceAddress: row.address,
  } }), null, 'binding metadata cannot rehabilitate a confirmed wrong source point')
})

test('legacy owner points are bound to the original physical address, city, quarter, source and coordinate pair', () => {
  const row = SOFIA_CATALOGUE.find(row => row.coordinates?.method === 'first_party_coordinates')
  assert.ok(row)
  assert.equal(catalogueBoundCoordinates(row), row.coordinates)
  for (const patch of [
    { address: `${row.address} — друго място` }, { neighborhood: 'Друг квартал' }, { cityCode: '56784' },
    { coordinates: { ...row.coordinates, latitude: row.coordinates.latitude + 0.01 } },
    { coordinates: { ...row.coordinates, source: 'https://example.org/unreviewed' } },
  ]) assert.equal(catalogueBoundCoordinates({ ...row, ...patch }), null)
  assert.equal(catalogueBoundCoordinates({ ...row, name: 'New display name, same premises' }), row.coordinates)
})

test('new points require an exact reviewed source address and all catalogue readers receive the same sanitized point', () => {
  const original = SOFIA_CATALOGUE.find(row => row.coordinates?.method === 'first_party_coordinates')
  const row = { ...original, id: 'sofia-future-location-fixture' }
  assert.equal(catalogueBoundCoordinates(row), null)
  const reviewed = { ...row, coordinates: { ...row.coordinates, sourceAddress: row.address } }
  assert.equal(catalogueBoundCoordinates(reviewed), reviewed.coordinates)
  assert.equal(catalogueBoundCoordinates({ ...reviewed, address: 'София, друга улица 1' }), null)
  assert.equal(catalogueBoundCoordinates({ ...reviewed, locationKind: 'service_area' }), null)
  const geocoded = SOFIA_CATALOGUE.find(row => row.coordinates?.method === 'verified_address_geocode')
  assert.equal(catalogueBoundCoordinates(geocoded), geocoded.coordinates)
  assert.equal(catalogueBoundCoordinates({ ...geocoded, address: `${geocoded.address}A` }), null)
  assert.deepEqual(applyCatalogueCoordinateBindings(RAW_SOFIA_CATALOGUE), SOFIA_CATALOGUE)
  assert.ok(Object.isFrozen(SOFIA_CATALOGUE))
  for (const [index, record] of SOFIA_CATALOGUE.entries()) {
    assert.deepEqual(record.coordinates, catalogueBoundCoordinates(record), record.id)
    assert.ok(Object.isFrozen(record))
    if (record.coordinates === RAW_SOFIA_CATALOGUE[index].coordinates) assert.equal(record, RAW_SOFIA_CATALOGUE[index], 'do not reparse unchanged service inventories at cold start')
  }
})

test('unusable public-directory points never become plausible distance badges', () => {
  const origin = discoveryDistanceOrigin({ cityCode: '68134' })
  for (const point of [null, { latitude: 0, longitude: 0 }, { latitude: 90, longitude: 23.3 }, { latitude: 42.7, longitude: null }, { latitude: '42.7', longitude: '23.3' }, { latitude: NaN, longitude: 23.3 }]) {
    assert.equal(distanceBadge(origin, point), null)
    if (point) assert.equal(directoryCoordinates(point), null)
  }
  assert.deepEqual(directoryCoordinates({ latitude: 42.7, longitude: 23.3 }), { latitude: 42.7, longitude: 23.3 })
  for (const value of [null, undefined, NaN, Infinity, -1, '0.7']) assert.equal(displayDistanceKm(value), null)
})

test('very close nonzero distances are not rounded into a misleading exact zero', () => {
  const origin = { kind: 'device', latitude: 42.7, longitude: 23.3 }
  const point = { latitude: 42.7001, longitude: 23.3 }
  assert.equal(distanceBadge(origin, point).value, '<0,1 km')
  assert.equal(distanceBadge(origin, point, 'en').value, '<0.1 km')
  assert.match(distanceBadge(origin, point).title, /по права линия/)
})

test('the exact short brand IN Beauty remains searchable when its incorrect point is retired', async () => {
  const input = discoveryRequestSchema.parse({ query: 'IN Beauty', cityCode: '68134' })
  const now = DateTime.fromMillis(clock)
  const result = await searchFreeCatalogue(input, { intent: parseIntent(input, now, { v2: true }), mode: 'deterministic' }, {
    now, config: { maxResults: 15 }, readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE,
    getBusiness: async () => null, getSlots: async () => [],
  })
  assert.equal(result.results.length, 1)
  assert.equal(result.results[0].id, 'sofia-in-beauty')
  assert.deepEqual(result.results[0].coordinates, { latitude: 42.65564914279809, longitude: 23.31449726584672 })
  assert.equal(businessNameMatches('IN Beauty', 'IN'), false)
  assert.equal(businessNameMatches('IN Beauty', 'Beauty'), false)
  assert.equal(businessNameMatches('Different Beauty', 'IN Beauty'), false)
})
