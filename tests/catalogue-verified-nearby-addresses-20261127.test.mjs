import assert from 'node:assert/strict'
import test from 'node:test'
import report from '../docs/catalogue-coverage/verified-nearby-addresses-20261127.json' with { type: 'json' }
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { applySofiaAddressPointsNov27 } from '../lib/discovery/catalogue-data/sofia-address-points-nov27.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railDirections, railExternalAction } from '../lib/discovery/rail.mjs'
import { distanceKm } from '../lib/discovery/distance.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { OFFICIAL_SOFIA_CSV_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { appointmentGrowthPriorCatalogue } from './catalogue-verified-sofia-appointment-growth-20261127-scope.mjs'
import { nearbyAddressReviewPriorCatalogue } from './catalogue-verified-nearby-addresses-20261127-scope.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const reviewedSnapshot = appointmentGrowthPriorCatalogue(SOFIA_CATALOGUE)
const previous = nearbyAddressReviewPriorCatalogue(reviewedSnapshot)
const entry = id => SOFIA_CATALOGUE.find(row => row.id === id)
const oldEntry = id => previous.find(row => row.id === id)

test('verified points improve located coverage without adding businesses or changing reviewed services and bookings', () => {
  const { coverage } = report
  const inspect = rows => catalogueCoverageReport(rows, { now, target: coverage.targetPerQuarterCategory })
  const earlier = inspect(previous), current = inspect(reviewedSnapshot)
  const both = f => [f(earlier), f(current)]
  assert.equal(report.newDistinctBusinesses, 0)
  assert.equal(report.municipalSource.csvSha256, OFFICIAL_SOFIA_CSV_SHA256)
  assert.equal(current.counts.totalTargetCells, coverage.checkedCells)
  assert.deepEqual(both(audit => audit.counts.approvedBusinesses), coverage.approvedSofiaBusinesses)
  assert.deepEqual(both(audit => audit.counts.premisesWithBoundCoordinates), coverage.premisesWithBoundPoint)
  assert.deepEqual(both(audit => audit.counts.zeroCells), coverage.emptyPhysicalCells)
  assert.deepEqual(both(audit => [...audit.neighborhoods, ...audit.additionalNamedAreas].flatMap(row => row.cells).filter(c => !c.locatedCount).length), coverage.emptyLocatedCells)
  for (const [name, category, before, after] of coverage.locatedDeltas) {
    assert.deepEqual(both(audit => audit.neighborhoods.find(row => row.name === name).cells.find(cell => cell.categoryId === category).locatedCount), [before, after])
  }
  for (const { id, method, address, neighborhood, point } of report.verified) {
    const row = entry(id), old = oldEntry(id), bound = catalogueBoundCoordinates(row)
    assert.deepEqual(applySofiaAddressPointsNov27([old]), [row], id)
    assert.equal(applySofiaAddressPointsNov27([row])[0], row, id)
    assert.deepEqual(row.services, old.services, id)
    assert.deepEqual(row.booking, old.booking, id)
    assert.deepEqual(row.verification, old.verification, id)
    assert.equal(pricingIdentity(row), pricingIdentity(old), id)
    assert.equal(row.address, address, id)
    assert.equal(row.neighborhood, neighborhood, id)
    assert.equal(bound.method, method, id)
    assert.deepEqual([bound.latitude, bound.longitude, bound.addressId], [point.latitude, point.longitude, point.addressId], id)
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'Б' }), null, id)
    for (const patch of [{ address: old.address + 'Б' }, { neighborhood: 'Несъвпадащ квартал' }, { cityCode: '56784' },
      { coordinates: { latitude: 42.7, longitude: 23.3 } }, { verification: { ...old.verification, status: 'pending' } },
      { booking: { kind: 'form', url: 'https://example.com/' } }]) {
      const unexpected = { ...old, ...patch }
      assert.equal(applySofiaAddressPointsNov27([unexpected])[0], unexpected, id)
    }
  }
})

test('nearby results, public details, profile and map use the same verified branch point', async () => {
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true, environment: 'development' },
    now: () => now, allowAttempt: async () => true, findCatalogue: entry })
  for (const { id, point, neighborhood } of report.verified) {
    const row = entry(id), before = oldEntry(id)
    const center = { latitude: point.latitude, longitude: point.longitude }
    const intent = { cityCode: '68134', sofiaOnly: true, category: row.category, categoryFilter: true, browse: true, neighborhood }
    const normalize = (source, extra = {}) => normalizeCatalogueBusinesses([source], { ...intent, ...extra }, { now })
    const [card] = normalize(row, { coordinates: center, radiusKm: 1 })
    assert.equal(card.id, id)
    assert.equal(card.locationStatus, 'verified_sofia', id)
    assert.equal(distanceKm(center, card.coordinates), 0, id)
    assert.deepEqual(normalize(before, { coordinates: center, radiusKm: 1 }), [], id)
    assert.deepEqual(normalize(row, { coordinates: { latitude: 42.55, longitude: 23.57 }, radiusKm: 1 }), [], id)
    assert.deepEqual(normalize(row, { neighborhood: 'Младост 5' }), [], id)
    assert.deepEqual(card.availability, { status: 'external', slots: [] }, id)
    const [oldCard] = normalize(before, { neighborhood: '' })
    assert.deepEqual(railExternalAction(card, now), railExternalAction(oldCard, now), id)
    const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + id,
      { headers: { Origin: 'https://gorez.test' } }), id)
    assert.equal(response.status, 200, id)
    const { business } = await response.json()
    const expected = point.latitude + ',' + point.longitude
    const directions = new URL(railDirections(card))
    assert.equal(directions.searchParams.get('api'), '1', id)
    assert.equal(directions.searchParams.get('destination'), expected, id)
    assert.equal(directions.searchParams.has('destination_place_id'), false, id)
    assert.equal(businessDirectionsUrl(business), directions.href, id)
    assert.equal(businessDirectionsUrl(catalogueProfileView(row, { now })), directions.href, id)
    assert.equal(new URL(businessMapUrl(business)).searchParams.get('marker'), expected, id)
  }
})
