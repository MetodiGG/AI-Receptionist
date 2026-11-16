import test from 'node:test'
import assert from 'node:assert/strict'
import approved from '../public/catalogue-official-address-points-20261113.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { applyOfficialCatalogueLocations } from '../lib/discovery/catalogue-official-locations.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueRecordSchema } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueRegistrationPoint } from '../lib/business-registration-location.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { verifyOfficialSubset } from '../scripts/verify-official-sofia-address-subset.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_DATA_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'

test('frozen municipal subset adds 359 postal points and corrects seven reviewed bad pairs without changing service facts', () => {
  assert.equal(approved.pointCount, 366)
  assert.equal(approved.sourceSha256, OFFICIAL_SOFIA_DATA_SHA256)
  assert.equal(approved.source, OFFICIAL_SOFIA_SOURCE_URL)
  assert.equal(new Set(approved.points.map(row => row.id)).size, 366)
  assert.equal(approved.points.filter(row => row.review.decision === 'unique_exact_postal_address').length, 359)
  assert.equal(approved.points.filter(row => row.review.decision === 'manual_duplicate_disambiguation').length, 1)
  // A later owner-verified quarter rebind is not a rewrite of the frozen
  // municipal batch. Keep this explicit cohort narrow; all other points must
  // still match their original metadata byte-for-field.
  const reboundQuarters = new Map([['sofia-lazarov-athletics', 'Център']])
  for (const reviewed of approved.points) {
    const row = SOFIA_CATALOGUE.find(row => row.id === reviewed.id)
    assert.ok(row, reviewed.id)
    const reboundQuarter = reboundQuarters.get(row.id)
    const currentPoint = reboundQuarter ? { ...reviewed.coordinates, sourceNeighborhood: reboundQuarter } : reviewed.coordinates
    if (reboundQuarter) {
      assert.equal(row.neighborhood, reboundQuarter)
      assert.equal(reviewed.coordinates.sourceNeighborhood, null)
      assert.equal(row.coordinates.checkedOn, '2026-11-13', 'Quarter evidence is not a new municipal-point review')
    }
    assert.deepEqual(row.coordinates, currentPoint, reviewed.id)
    assert.ok(catalogueRecordSchema.safeParse(row).success, reviewed.id)
    assert.equal(catalogueBoundCoordinates(row), row.coordinates)
    assert.equal(row.coordinates.addressId, reviewed.officialAddress.rn)
    // Do not strip attributed points into the partner model's two-number pin.
    assert.equal(catalogueRegistrationPoint(row.coordinates), null)
    // Replay the historical batch against its historical identity, not the
    // current owner-verified quarter. Its original null-quarter receipt must
    // remain incapable of attaching itself to a changed current identity.
    const original = { ...row, neighborhood: reviewed.coordinates.sourceNeighborhood, coordinates: reviewed.previousCoordinates }
    const [updated] = applyOfficialCatalogueLocations([original])
    assert.equal(updated.services, original.services)
    assert.equal(updated.booking, original.booking)
    assert.equal(updated.address, original.address)
    assert.deepEqual(updated.coordinates, reviewed.coordinates)
  }
})

test('the frozen null-quarter municipal receipt cannot overwrite or supply the later explicitly rebound Lazarov point', () => {
  const current = SOFIA_CATALOGUE.find(row => row.id === 'sofia-lazarov-athletics')
  const frozen = approved.points.find(row => row.id === current.id)
  assert.equal(frozen.coordinates.sourceNeighborhood, null)
  assert.equal(current.neighborhood, 'Център')
  assert.equal(applyOfficialCatalogueLocations([current])[0], current)
  const withoutPoint = { ...current, coordinates: null }
  assert.equal(applyOfficialCatalogueLocations([withoutPoint])[0], withoutPoint)
  assert.equal(catalogueBoundCoordinates({ ...current, coordinates: frozen.coordinates }), null)
  assert.deepEqual({ ...current.coordinates, sourceNeighborhood: null }, frozen.coordinates)
})

test('municipal import is bound to the reviewed identity and never overwrites a newer owner point', () => {
  const reviewed = approved.points.find(row => row.previousCoordinates === null)
  const current = SOFIA_CATALOGUE.find(row => row.id === reviewed.id)
  const original = { ...current, coordinates: null }
  for (const patch of [
    { id: 'sofia-unapproved-future-business' }, { address: current.address + 'А' }, { cityCode: '56784' },
    { neighborhood: 'Друг квартал' }, { website: 'https://example.org/new-owner' }, { locationKind: 'service_area' },
    { coordinates: { latitude: 42.7, longitude: 23.3, method: 'first_party_coordinates', source: current.website, sourceAddress: current.address } },
  ]) {
    const changed = { ...original, ...patch }
    assert.equal(applyOfficialCatalogueLocations([changed])[0], changed)
  }
})

test('manually disambiguated IN Beauty uses the northern municipal address, never the bad JSON-LD or southern duplicate', () => {
  const row = SOFIA_CATALOGUE.find(row => row.id === 'sofia-in-beauty')
  assert.equal(row.coordinates.addressId, '113534')
  assert.deepEqual([row.coordinates.latitude, row.coordinates.longitude], [42.65564914279809, 23.31449726584672])
  const destination = new URL(businessMapsDirectionsUrl({ ...row, source: 'catalogue' })).searchParams.get('destination')
  assert.equal(destination, `${row.coordinates.latitude},${row.coordinates.longitude}`)
})

test('offline source verifier rejects changed or unrelated snapshots before indexing', () => {
  assert.throws(() => verifyOfficialSubset(Buffer.from('{"type":"FeatureCollection","features":[]}')), /hash mismatch/)
})
