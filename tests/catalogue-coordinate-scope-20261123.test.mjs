import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { applyReviewedCoordinateScopeRecovery20261123 } from '../lib/discovery/catalogue-data/coordinate-scope-recovery-20261123.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import receipt from '../docs/catalogue-coverage/coordinate-scope-recovery-20261123.json' with { type: 'json' }
import { northernEastPriorCatalogue } from './catalogue-northern-east-20261123-scope.mjs'
import { priorityPriorCatalogue } from './catalogue-quarter-priority-20261123-scope.mjs'

const now = Date.parse('2026-11-23T12:00:00Z')
const SOFIA_CATALOGUE = priorityPriorCatalogue(currentCatalogue)
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const rows = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const stored = new Map(RAW_SOFIA_CATALOGUE.map(row => [row.id, row]))

test('the four reviewed recoveries preserve exact booking, services, prices and original point approval dates', () => {
  for (const evidence of receipt.recovered) {
    const row = rows.get(evidence.id)
    const [prior] = northernEastPriorCatalogue([row])
    assert.equal(PUBLIC_CATALOGUE.filter(item => item.id === evidence.id).length, 1)
    assert.equal(row, stored.get(evidence.id), 'public reader does not retire this point')
    assert.equal(digest(row), evidence.reviewedRowSha256)
    assert.equal(digest(prior), evidence.previousRowSha256)
    assert.equal(pricingIdentity(prior), evidence.pricingIdentity)
    assert.equal(pricingIdentity(row), pricingIdentity(prior))
    assert.deepEqual({ ...row, neighborhood: prior.neighborhood, coordinates: prior.coordinates }, prior)
    assert.deepEqual(applyReviewedCoordinateScopeRecovery20261123([prior]), [row])
    for (const patch of [{ address: prior.address + 'А' }, { website: 'https://other.test/' },
      { booking: { kind: 'phone', phone: '+359808000000' } }, { locationKind: 'service_area' }]) {
      const notReviewed = { ...prior, ...patch }
      assert.equal(applyReviewedCoordinateScopeRecovery20261123([notReviewed])[0], notReviewed)
    }
    const bound = catalogueBoundCoordinates(row)
    if (evidence.ownerPoint) {
      assert.deepEqual(bound, { ...evidence.ownerPoint, method: 'first_party_coordinates', sourceAddress: row.address })
    } else {
      assert.deepEqual([bound.addressId, bound.latitude, bound.longitude],
        [evidence.postal.rn, evidence.postal.latitude, evidence.postal.longitude])
    }
    if (prior.coordinates) {
      assert.deepEqual(bound, { ...prior.coordinates, sourceNeighborhood: row.neighborhood })
      assert.equal(catalogueBoundCoordinates({ ...row, neighborhood: prior.neighborhood }), null)
    }
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
  }
})

test('in a small local radius the recovered venue appears only under its correct quarter and retains its external action', () => {
  for (const evidence of receipt.recovered) {
    const row = rows.get(evidence.id), [prior] = northernEastPriorCatalogue([row])
    const { latitude, longitude } = row.coordinates
    const intent = { browse: true, searchV2: true, cityCode: '68134', neighborhood: row.neighborhood,
      category: row.category, radiusKm: 0.15, coordinates: { latitude, longitude } }
    const [found] = rankCatalogueBusinesses([], normalizeCatalogueBusinesses([row], intent, { now }), intent)
    assert.equal(found.id, row.id)
    assert.equal(found.distanceKm, 0)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    const { kind, phone, url } = prior.booking
    assert.deepEqual(railExternalAction(found, now), { kind, href: kind === 'phone' ? 'tel:' + phone : url })
    assert.deepEqual(normalizeCatalogueBusinesses([prior], intent, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Люлин 4' }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, coordinates: { latitude: latitude + 0.03, longitude } }, { now }), [])
  }
  assert.equal(catalogueBoundCoordinates(rows.get('sofia-katerene-europe-private')), null)
})

test('the location recovery advances four formerly empty cells without counting any new business or duplicate', () => {
  const after = receipt.recovered.map(item => rows.get(item.id))
  const baseline = northernEastPriorCatalogue(SOFIA_CATALOGUE)
  const changes = new Map(after.map(row => [row.id, row]))
  const updated = baseline.map(row => changes.get(row.id) ?? row)
  const reports = [baseline, updated].map(list => catalogueCoverageReport(list, { now, target: receipt.targetPerQuarterCategory }))
  const cells = reports.map(report => new Map([...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area =>
    area.cells.map(cell => [area.name + ':' + cell.categoryId, cell]))))
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), receipt.impactInIsolation.approvedBusinesses)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), receipt.impactInIsolation.usablePostalOrOwnerPoints)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), receipt.impactInIsolation.cellsAtLocatedTarget)
  assert.deepEqual(cells.map(map => [...map.values()].filter(cell => !cell.locatedCount).length), receipt.impactInIsolation.emptyLocatedQuarterCategoryCells)
  for (const evidence of receipt.recovered) {
    const pair = cells.map(map => map.get(evidence.neighborhood[1] + ':' + evidence.category))
    assert.deepEqual(pair.map(cell => cell.count), evidence.coverage.physical)
    assert.deepEqual(pair.map(cell => cell.locatedCount), evidence.coverage.located)
  }
})
