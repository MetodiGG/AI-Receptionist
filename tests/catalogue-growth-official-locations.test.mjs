import test from 'node:test'
import assert from 'node:assert/strict'
import original from '../public/catalogue-official-address-points-20261113.json' with { type: 'json' }
import growth from '../public/catalogue-official-address-growth-subset-20261113.json' with { type: 'json' }
import combined from '../public/catalogue-official-address-points-growth-20261113.json' with { type: 'json' }
import { NEIGHBORHOOD_20261113_RECORDS as additions } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { applyOfficialCatalogueLocations } from '../lib/discovery/catalogue-official-locations.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueRegistrationPoint } from '../lib/business-registration-location.mjs'
import { OFFICIAL_SOFIA_PROCESSED_DATA_URL } from '../lib/discovery/catalogue-attribution.mjs'

test('growth postal matches are disjoint, attributed and linked without modifying the original subset', () => {
  assert.equal(original.pointCount, 366)
  assert.equal(growth.pointCount, 135)
  assert.deepEqual(combined.points, [...original.points, ...growth.points])
  assert.equal(combined.pointCount, combined.points.length)
  assert.equal(new Set(combined.points.map(row => row.id)).size, combined.pointCount)
  assert.equal(OFFICIAL_SOFIA_PROCESSED_DATA_URL, '/catalogue-official-address-points-2000-20261113.json')
  assert.equal(growth.sourceSha256, original.sourceSha256)
  for (const point of growth.points) {
    const intake = additions.find(row => row.id === point.id)
    const published = SOFIA_CATALOGUE.find(row => row.id === point.id)
    assert.ok(intake && published, point.id)
    assert.equal(intake.coordinates, null, 'never overwrite an owner point')
    assert.deepEqual(published, { ...intake, coordinates: point.coordinates })
    assert.equal(catalogueBoundCoordinates(published), published.coordinates)
    assert.equal(catalogueRegistrationPoint(published.coordinates), null, 'no unattributed partner-pin import')
    assert.equal(point.review.decision, 'unique_exact_postal_address')
    assert.equal(point.coordinates.licence, 'CC-BY-4.0')
    assert.ok(point.review.sourceUrls.includes(intake.verification.contact))
    assert.equal(point.coordinates.addressId, point.officialAddress.rn)
  }
})

test('all growth matches reject changed source identities and do not overwrite newer owner coordinates', () => {
  for (const point of growth.points) {
    const intake = additions.find(row => row.id === point.id)
    assert.deepEqual(applyOfficialCatalogueLocations([intake])[0].coordinates, point.coordinates)
    for (const patch of [
      { address: intake.address + 'А' }, { neighborhood: 'Друг квартал' }, { cityCode: '56784' },
      { website: 'https://example.org/changed' }, { locationKind: 'service_area' },
      { coordinates: { latitude: 42.7, longitude: 23.3, method: 'first_party_coordinates', source: intake.website } },
    ]) {
      const changed = { ...intake, ...patch }
      assert.equal(applyOfficialCatalogueLocations([changed])[0], changed, point.id)
    }
  }
})
