import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueStreetAddress, matchCatalogueGeocode } from '../lib/discovery/catalogue-geocoding.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { discoveryDistanceOrigin, distanceBadge } from '../lib/discovery/distance-origin.mjs'
import { reviewCatalogueLocation } from '../lib/discovery/catalogue-location-review.mjs'

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))
const clock = Date.parse('2026-11-10T10:00:00Z')

test('the supplemental review stays within 25 public-address requests and its explicit existing-record allowlist', async () => {
  const ids = await json('../docs/catalogue-geocoding/approved-targets-20261106-supplement.json')
  const namedIds = await json('../docs/catalogue-geocoding/approved-targets-20261106-named-review.json')
  const structured = await json('../docs/catalogue-geocoding/nominatim-structured-cache-20261106.json')
  const named = await json('../docs/catalogue-geocoding/nominatim-named-cache-20261106.json')
  assert.equal(ids.length, 20)
  assert.equal(Object.keys(structured).length + Object.keys(named).length, 25)
  assert.ok(namedIds.every(id => ids.includes(id)))
  assert.ok(ids.every(id => SOFIA_CATALOGUE.some(row => row.id === id)))
  for (const key of Object.keys(structured)) assert.deepEqual(Object.keys(JSON.parse(key)).sort(), ['city', 'country', 'street'])
  for (const key of Object.keys(named)) assert.match(key, /София, България$/)
})

test('six accepted points reproduce from exact structured addresses; a supermarket is not the ZONA WASH entrance', async () => {
  const cache = await json('../docs/catalogue-geocoding/nominatim-structured-cache-20261106.json')
  const updates = await json('../lib/discovery/catalogue-data/geocodes-v4.json')
  for (const update of updates.filter(row => row.id !== 'sofia-bruno-bastos-bjj')) {
    const row = { ...SOFIA_CATALOGUE.find(row => row.id === update.id), coordinates: null }
    const address = catalogueStreetAddress(row)
    const key = JSON.stringify({ street: `${address.house} ${address.road}`, city: 'София', country: 'България' })
    assert.deepEqual(matchCatalogueGeocode(row, cache[key], '2026-11-06'), update)
  }
  assert.equal(updates.length, 7)
  const zona = SOFIA_CATALOGUE.find(row => row.id === 'sofia-zona-wash')
  assert.equal(zona.coordinates.method, 'verified_official_address')
  assert.equal(zona.coordinates.addressId, '94909')
  assert.equal(zona.coordinates.sourceAddress, zona.address)
  assert.ok(!updates.some(row => row.id === 'sofia-zona-wash'))
  const zonaCandidates = cache[JSON.stringify({ street: '3 Филип Аврамов', city: 'София', country: 'България' })]
  assert.ok(zonaCandidates.some(row => row.type === 'supermarket'))
  // Historical address-only parsing could produce this shop's postal point;
  // it was manually omitted from the accepted batch, never a venue pin.
  const supermarket = zonaCandidates.find(row => row.type === 'supermarket')
  const conservative = reviewCatalogueLocation(zona, [supermarket], '2026-11-13')
  assert.equal(conservative.status, 'unresolved')
  assert.equal(conservative.matched, null)
  assert.ok(conservative.rejectedCandidates.some(row => row.reason === 'unrelated_or_unnamed_poi_at_same_address'))
  assert.ok(Math.abs(zona.coordinates.latitude - Number(supermarket.lat)) > .000001 || Math.abs(zona.coordinates.longitude - Number(supermarket.lon)) > .000001)
  for (const id of ['sofia-shun-dojo-nsa', 'sofia-beauty-studio-marry-kuklata', 'sofia-beauty-studio-marry-moskovska']) {
    assert.equal(SOFIA_CATALOGUE.find(row => row.id === id).coordinates, null, id)
  }
})

test('manual BJJ disambiguation keeps the exact-address commercial building, not a different shop or nearby street', async () => {
  const cache = await json('../docs/catalogue-geocoding/nominatim-address-cache-20261106.json')
  const updates = await json('../lib/discovery/catalogue-data/geocodes-v4.json')
  const row = { ...SOFIA_CATALOGUE.find(row => row.id === 'sofia-bruno-bastos-bjj'), coordinates: null }
  const candidates = cache[catalogueStreetAddress(row).query]
  assert.equal(matchCatalogueGeocode(row, candidates, '2026-11-06'), null)
  const building = candidates.filter(row => row.osm_type === 'way' && row.osm_id === 166213044 && row.category === 'building' && row.type === 'commercial')
  assert.deepEqual(matchCatalogueGeocode(row, building, '2026-11-06'), updates.find(update => update.id === row.id))
})

test('reviewed points support local radius filtering and real kilometres without a runtime provider request', async () => {
  const updates = await json('../lib/discovery/catalogue-data/geocodes-v4.json')
  for (const update of updates) {
    const row = SOFIA_CATALOGUE.find(row => row.id === update.id)
    const intent = { cityCode: '68134', browse: true, coordinates: { latitude: row.coordinates.latitude, longitude: row.coordinates.longitude, consent: true }, radiusKm: 2, requirements: [] }
    const found = normalizeCatalogueBusinesses([row], intent, { now: clock })
    assert.equal(found.length, 1, row.id)
    assert.equal(rankCatalogueBusinesses([], found, intent)[0].distanceKm, 0)
    const centre = distanceBadge(discoveryDistanceOrigin({ cityCode: '68134' }), row.coordinates)
    assert.match(centre.value, /\d.*km/)
  }
})

test('targeted maintenance refuses unbounded requests and does not need credentials', () => {
  const script = new URL('../scripts/geocode-catalogue-once.mjs', import.meta.url)
  const result = spawnSync(process.execPath, [script.pathname, '--approved-one-time', '--structured', '--max-requests', '26', '--cache', '/tmp/unused-cache.json', '--output', '/tmp/unused-output.json'], { encoding: 'utf8' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /explicit allowlist and at most 25 requests/)
})
