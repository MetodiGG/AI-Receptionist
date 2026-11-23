import assert from 'node:assert/strict'
import test from 'node:test'
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueRegistrationPoint } from '../lib/business-registration-location.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { applyReviewedQuickFitLocation20261123 } from '../lib/discovery/catalogue-data/quickfit-verified-location-20261123.mjs'
import { applyAgronVerifiedLocation20261123 } from '../lib/discovery/catalogue-data/agron-verified-location-20261123.mjs'
import { applyReviewedRisuvamLocation20261123 } from '../lib/discovery/catalogue-data/risuvam-verified-location-20261123.mjs'
import { postalPrecisionPriorCatalogue } from './catalogue-postal-precision-20261123-scope.mjs'
import { lowCoveragePriorCatalogue } from './catalogue-low-coverage-20261123-scope.mjs'
import quickfit from '../docs/catalogue-coverage/quickfit-verified-location-20261123.json' with { type: 'json' }
import agron from '../docs/catalogue-coverage/agron-verified-location-20261123.json' with { type: 'json' }
import risuvam from '../docs/catalogue-coverage/risuvam-verified-location-20261123.json' with { type: 'json' }
import batch from '../docs/catalogue-coverage/postal-precision-20261123.json' with { type: 'json' }

const now = Date.parse(batch.checkedAt)
const SOFIA_CATALOGUE = lowCoveragePriorCatalogue(currentCatalogue)
const originalRows = postalPrecisionPriorCatalogue(SOFIA_CATALOGUE)
const original = new Map(originalRows.map(row => [row.id, row]))
const rows = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const handler = createPublicBusinessDetailsHandler({
  config: { enabled: true }, now: () => now, allowAttempt: () => true,
  findCatalogue: id => rows.get(id), readCataloguePhotos: async () => [],
  readPartner: () => assert.fail('Public catalogue should not query partner records here'),
})
const cases = [
  { evidence: quickfit, apply: applyReviewedQuickFitLocation20261123,
    booking: { kind: 'phone', href: 'tel:+359887805935' }, prices: [36], photo: '/service-photos/sx-mat-pilates-individual-v1.webp' },
  { evidence: agron, apply: applyAgronVerifiedLocation20261123,
    booking: { kind: 'form', href: agron.ownerBooking }, prices: [null, null, null, null], photo: '/service-photos/sx-auto-brake-system-repair-v1.webp' },
  { evidence: { id: risuvam.business.id, selectedPoint: {
    addressId: risuvam.coordinateReview.sameNumberCandidates[0].rn, ...risuvam.coordinateReview.sameNumberCandidates[0],
  }, pricingIdentity: risuvam.identities.unchangedPricingIdentitySha256 }, apply: applyReviewedRisuvamLocation20261123,
    booking: { kind: 'phone', href: 'tel:+359876444281' }, prices: [30, 45, 55], photo: '/service-photos/sx-teen-art-group-v1.webp' },
]

for (const { evidence, apply, booking, prices, photo } of cases) {
  test(evidence.id + ' changes only the postal point and matches the correct radius, not the duplicate address', async () => {
    const business = rows.get(evidence.id), previous = original.get(evidence.id)
    const point = catalogueBoundCoordinates(business), selected = evidence.municipal ?? evidence.selectedPoint
    const rejection = batch.affected.find(row => row.id === evidence.id).rejectedCoordinates
    assert.equal(previous.coordinates, null)
    assert.deepEqual({ ...business, coordinates: null }, previous)
    assert.equal(PUBLIC_CATALOGUE.filter(row => row.id === evidence.id).length, 1)
    assert.deepEqual([point.addressId, point.latitude, point.longitude],
      [selected.addressId, selected.latitude, selected.longitude])
    assert.equal(catalogueRegistrationPoint(point), null, 'municipal attribution must stay attached')
    for (const candidate of [{ ...previous, cityCode: '56784' }, { ...previous, address: previous.address + 'А' },
      { ...previous, neighborhood: 'Люлин 1' }, { ...previous, website: 'https://elsewhere.example/' },
      { ...previous, locationKind: 'service_area' }, { ...previous, booking: { kind: 'form', url: 'https://elsewhere.example/' } }, business]) {
      assert.equal(apply([candidate])[0], candidate, 'review must not be reused after a changed premise or booking destination')
    }
    assert.deepEqual(apply([previous]), [business])
    assert.equal(pricingIdentity(previous), evidence.pricingIdentity ?? evidence.pricingIdentityUnchanged)
    assert.equal(pricingIdentity(business), pricingIdentity(previous))
    const intent = { cityCode: business.cityCode, neighborhood: business.neighborhood, browse: true, searchV2: true,
      category: business.category, radiusKm: 0.05, coordinates: { latitude: point.latitude, longitude: point.longitude } }
    assert.deepEqual(normalizeCatalogueBusinesses([previous], intent, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([business], { ...intent,
      coordinates: { latitude: rejection[0], longitude: rejection[1] } }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([business], { ...intent, neighborhood: 'Люлин 1' }, { now }), [])
    const [result] = normalizeCatalogueBusinesses([business], intent, { now })
    assert.equal(result.id, business.id)
    assert.deepEqual(result.coordinateAttribution, { label: point.attribution, url: point.source })
    assert.deepEqual(railExternalAction(result, now), booking)
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + business.id), business.id)
    assert.equal(response.status, 200)
    const { business: { details } } = await response.json()
    assert.deepEqual(details.services.map(service => service.price), prices)
    assert.ok(details.services.some(service => serviceThumbnail(service, { business }).src === photo))
  })
}

test('each of the three previously empty nearby cells gains one point, without adding any business or changing the target', () => {
  assert.deepEqual(SOFIA_CATALOGUE.map(row => row.id), originalRows.map(row => row.id))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => original.get(row.id) !== row).map(row => row.id).sort(),
    batch.affected.map(row => row.id).sort())
  const reports = [originalRows, SOFIA_CATALOGUE].map(input => catalogueCoverageReport(input, { now, target: 30 }))
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), batch.approvedBusinesses)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  const pickerCells = reports.map(report => report.neighborhoods.flatMap(area => area.cells))
  assert.deepEqual(pickerCells.map(entries => entries.filter(cell => cell.locatedCount === 0).length), batch.emptyLocatedPickerCells)
  const cells = reports.map(report => new Map([...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area =>
    area.cells.map(cell => [area.name + ':' + cell.categoryId, cell]))))
  assert.deepEqual(cells.map(map => [...map.values()].filter(cell => cell.locatedCount === 0).length), batch.emptyLocatedCells)
  assert.deepEqual([...cells[1]].filter(([key, cell]) => cell.locatedCount !== cells[0].get(key).locatedCount).map(([key]) => key).sort(),
    batch.affected.map(area => area.neighborhood + ':' + area.category).sort())
  for (const area of batch.affected) {
    const pair = cells.map(map => map.get(area.neighborhood + ':' + area.category))
    assert.deepEqual(pair.map(cell => cell.count), area.physical)
    assert.deepEqual(pair.map(cell => cell.locatedCount), area.located)
  }
})
