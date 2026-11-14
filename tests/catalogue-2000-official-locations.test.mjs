import test from 'node:test'
import assert from 'node:assert/strict'
import previous from '../public/catalogue-official-address-points-growth-20261113.json' with { type: 'json' }
import csv from '../public/catalogue-official-address-2000-subset-20261113.json' with { type: 'json' }
import combined from '../public/catalogue-official-address-points-2000-20261113.json' with { type: 'json' }
import { OFFICIAL_SOFIA_CSV_SHA256, OFFICIAL_SOFIA_DATA_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'
import { OFFICIAL_SOFIA_PROCESSED_DATA_URL } from '../lib/discovery/catalogue-attribution.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_RECORDS as additions } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { applyOfficialCatalogueLocations } from '../lib/discovery/catalogue-official-locations.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueRegistrationPoint } from '../lib/business-registration-location.mjs'
import { businessMapsDirectionsUrl, businessDirectionsAddress } from '../lib/business-directions.mjs'
import { reviewedBusinessDestination } from '../lib/business-directions-reviewed.mjs'

test('new CSV subset preserves all prior full-precision points and distinguishes both source snapshots', () => {
  assert.equal(previous.pointCount, 501)
  assert.equal(csv.sourceSha256, OFFICIAL_SOFIA_CSV_SHA256)
  assert.equal(csv.sourceFeatureCount, 125245)
  assert.equal(csv.coordinatePrecisionDecimalPlaces, 6)
  assert.equal(csv.pointCount, csv.points.length)
  assert.ok(csv.pointCount > 0)
  assert.equal(csv.sourceDataDate, null, 'no as-of date invented from the CSV')
  assert.deepEqual(combined.points, [...previous.points, ...csv.points])
  assert.equal(combined.pointCount, combined.points.length)
  assert.equal(new Set(combined.points.map(x => x.id)).size, combined.pointCount)
  assert.deepEqual(combined.sourceSnapshots.map(x => x.sha256), [OFFICIAL_SOFIA_DATA_SHA256, OFFICIAL_SOFIA_CSV_SHA256])
  assert.equal(OFFICIAL_SOFIA_PROCESSED_DATA_URL, '/catalogue-official-address-points-2000-20261113.json')
})

test('new manually reviewed postal matches retain identity, directions, attribution and real service facts', () => {
  for (const reviewed of csv.points) {
    const intake = additions.find(row => row.id === reviewed.id)
    const published = SOFIA_CATALOGUE.find(row => row.id === reviewed.id)
    assert.ok(intake && published, reviewed.id)
    assert.equal(intake.coordinates, null, 'no owner pin overwritten')
    assert.deepEqual(published, { ...intake, coordinates: reviewed.coordinates })
    assert.equal(reviewed.review.decision, 'unique_exact_postal_address')
    assert.ok(reviewed.review.sourceUrls.includes(intake.verification.contact))
    assert.equal(reviewed.coordinates.addressId, reviewed.officialAddress.rn)
    assert.equal(reviewed.coordinates.licence, 'CC-BY-4.0')
    assert.equal(catalogueBoundCoordinates(published), published.coordinates)
    assert.equal(catalogueRegistrationPoint(published.coordinates), null, 'do not strip attributed source into native two-number pin')
    assert.equal(Number(reviewed.coordinates.latitude.toFixed(6)), reviewed.coordinates.latitude)
    assert.equal(Number(reviewed.coordinates.longitude.toFixed(6)), reviewed.coordinates.longitude)
    const destination = new URL(businessMapsDirectionsUrl({ ...published, source: 'catalogue' })).searchParams.get('destination')
    const explicit = reviewedBusinessDestination({ ...published, source: 'catalogue' })
    assert.equal(destination, explicit ? `${explicit.latitude},${explicit.longitude}` : businessDirectionsAddress(published))
  }
})

test('CSV bindings fail closed after changed address/city/quarter/website or a newer owner point', () => {
  for (const reviewed of csv.points) {
    const original = additions.find(row => row.id === reviewed.id)
    for (const patch of [{ address: original.address + 'А' }, { cityCode: '56784' }, { neighborhood: 'Друг квартал' },
      { website: 'https://example.org/another-owner' }, { locationKind: 'service_area' },
      { coordinates: { latitude: 42.7, longitude: 23.3, method: 'first_party_coordinates', source: original.website, sourceAddress: original.address } }]) {
      const changed = { ...original, ...patch }
      assert.equal(applyOfficialCatalogueLocations([changed])[0], changed, original.id)
    }
  }
})
