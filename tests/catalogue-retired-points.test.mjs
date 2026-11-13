import test from 'node:test'
import assert from 'node:assert/strict'
import { RETIRED_CATALOGUE_POINTS_20261113, isRetiredCataloguePoint } from '../lib/discovery/catalogue-retired-points-20261113.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

const expected = [
  ['sofia-in-beauty', 42.6852, 23.3245],
  ['sofia-san-krasi-barber', 42.7131329, 23.2480611],
  ['sofia-carbox-studio', 42.6272014, 23.3310508],
  ['sofia-xzona-sport', 42.6691113, 23.2545085],
  ['sofia-rhythm-academy', 42.6351614, 23.3065149],
  ['sofia-classy-barbershop', 42.6673803, 23.3493594],
  ['sofia-inergy-borovo-reserved-kickboxing', 42.668698, 23.285587],
]
const fixture = (id, point, method, address = 'София, ул. Тестова 2') => {
  const row = { id, address, cityCode: '68134', neighborhood: 'Тестов квартал', website: 'https://example.com/', locationKind: 'premises' }
  const provenance = method === 'verified_official_address' ? { source: OFFICIAL_SOFIA_SOURCE_URL, sourceCityCode: row.cityCode, sourceNeighborhood: row.neighborhood, sourceWebsite: row.website,
    checkedOn: '2026-11-13', addressId: '12345', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION }
    : method === 'verified_address_geocode' ? { source: 'https://www.openstreetmap.org/node/12345', checkedOn: '2026-11-13', licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' }
      : { source: row.website }
  return { ...row, coordinates: { latitude: point.latitude, longitude: point.longitude, method, sourceAddress: address, ...provenance } }
}

test('the dated retired manifest pins the seven original wrong pairs and is deeply frozen', () => {
  assert.deepEqual(RETIRED_CATALOGUE_POINTS_20261113.map(point => [point.id, point.latitude, point.longitude]), expected)
  assert.ok(Object.isFrozen(RETIRED_CATALOGUE_POINTS_20261113))
  assert.ok(RETIRED_CATALOGUE_POINTS_20261113.every(Object.isFrozen))
})

test('new source, method, reviewed address, quarter and website metadata cannot revive any retired pair', () => {
  for (const point of RETIRED_CATALOGUE_POINTS_20261113) {
    assert.equal(isRetiredCataloguePoint(point.id, point), true, point.id)
    for (const method of ['first_party_coordinates', 'verified_address_geocode', 'verified_official_address']) {
      for (const address of ['София, ул. Тестова 2', 'София, ул. Съвсем друг адрес 300']) {
        const row = fixture(point.id, point, method, address)
        assert.equal(catalogueBoundCoordinates(row), null, `${point.id} ${method} ${address}`)
      }
    }
  }
})

test('small rounding changes do not weaken the original IN retirement guard; genuinely different points stay eligible', () => {
  for (const point of RETIRED_CATALOGUE_POINTS_20261113) {
    assert.equal(isRetiredCataloguePoint(point.id, { latitude: point.latitude + .000001, longitude: point.longitude - .000001 }), true)
    const fresh = { latitude: point.latitude + .001, longitude: point.longitude + .001 }
    assert.equal(isRetiredCataloguePoint(point.id, fresh), false)
    for (const method of ['first_party_coordinates', 'verified_address_geocode', 'verified_official_address']) {
      const row = fixture(point.id, fresh, method)
      assert.equal(catalogueBoundCoordinates(row), row.coordinates)
    }
    assert.equal(isRetiredCataloguePoint('sofia-different-venue', point), false, 'retirement is not a location-wide exclusion')
  }
  const north = { latitude: 42.65564914279809, longitude: 23.31449726584672 }
  const corrected = fixture('sofia-in-beauty', north, 'verified_official_address', 'София, ул. Генерал Иван Колев 2')
  corrected.coordinates.addressId = '113534'
  assert.equal(catalogueBoundCoordinates(corrected), corrected.coordinates)
})

test('malformed point values cannot match by coercion', () => {
  const first = RETIRED_CATALOGUE_POINTS_20261113[0]
  for (const point of [null, {}, { latitude: String(first.latitude), longitude: first.longitude }, { latitude: first.latitude, longitude: NaN }]) assert.equal(isRetiredCataloguePoint(first.id, point), false)
})
