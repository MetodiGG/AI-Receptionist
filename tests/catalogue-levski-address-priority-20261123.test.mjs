import assert from 'node:assert/strict'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/levski-address-priority-20261123.json' with { type: 'json' }
import dcaEvidence from '../docs/catalogue-coverage/dca-levski-intake-20261123.json' with { type: 'json' }
import alkomEvidence from '../docs/catalogue-coverage/alkom-postal-recovery-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyAlkomPostalRecovery20261123 } from '../lib/discovery/catalogue-data/alkom-postal-recovery-20261123.mjs'
import { applyNamedRoadAliasRecovery20261123 } from '../lib/discovery/catalogue-data/named-road-alias-recovery-20261123.mjs'
import { applyNorthWestEntranceRecovery20261123 } from '../lib/discovery/catalogue-data/north-west-entrance-recovery-20261123.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { addressPriorityQueue } from '../scripts/catalogue-address-priority.mjs'
import { levskiAddressPriorityPriorCatalogue } from './catalogue-levski-address-priority-20261123-scope.mjs'
import { priorityDistinctPriorCatalogue } from './catalogue-priority-distinct-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const SOFIA_CATALOGUE = priorityDistinctPriorCatalogue(currentCatalogue)
const prior = levskiAddressPriorityPriorCatalogue(SOFIA_CATALOGUE)
const [dca, alkom] = [batch.newRows[0].id, batch.existingChanges[0].id].map(id => SOFIA_CATALOGUE.find(row => row.id === id))
const host = url => url ? new URL(url).hostname.replace(/^www\./u, '') : ''
const search = (row, overrides) => normalizeCatalogueBusinesses([row], {
  cityCode: '68134', coordinates: row.coordinates, neighborhood: row.neighborhood,
  category: row.category, radiusKm: .15, browse: true, searchV2: true, ...overrides,
}, { now })

test('D.C.A. exposes exactly the published rear-window variants and a local external request, not a bookable slot', () => {
  assert.ok(prior.every(row => host(row.website) !== host(dca.website) && row.phone !== dca.phone))
  assert.equal(catalogueBoundCoordinates(dca).addressId, batch.newRows[0].addressId)
  assert.equal(pricingIdentity(dca), dcaEvidence.business.inventoryIdentity)
  const review = BOOKING_PRICE_REVIEWS.find(item => item.id === dca.id)
  const receipt = assessPricingReview(dca, review, now)
  assert.deepEqual([receipt.state, receipt.reviewedPriceCount], ['reviewed', 5])
  assert.deepEqual(dca.services.map(({ price }) => [price.amount, price.kind, price.currency]),
    [179, 230, 255, 281, 306].map(amount => [amount, 'fixed', 'EUR']))
  const [view] = search(dca)
  assert.deepEqual([view.id, view.booking.kind, view.booking.url], [dca.id, 'form', 'https://www.dcagarage.com/adres/'])
  assert.deepEqual(view.availability, { status: 'external', slots: [] })
  assert.deepEqual(search(dca, { neighborhood: 'Левски Г' }), [])
  assert.deepEqual(search(dca, { category: 'car_wash' }), [])
  for (const service of view.details.services) {
    assert.match(service.description, /Формулярът изпраща запитване/u)
    assert.equal(serviceThumbnail(service, { business: dca }).src, '/service-photos/vehicle-window-tint-v1.webp')
  }
})

test('Alkom fixes nearby distance only; never assumes a quarter or changes the service and booking evidence', () => {
  const previous = prior.find(row => row.id === alkom.id)
  assert.deepEqual({ ...alkom, coordinates: null }, previous)
  assert.deepEqual(applyAlkomPostalRecovery20261123([previous]), [alkom])
  assert.equal(applyAlkomPostalRecovery20261123([alkom])[0], alkom)
  assert.equal(applyAlkomPostalRecovery20261123([{ ...previous, address: previous.address + 'А' }])[0].coordinates, null)
  assert.equal(pricingIdentity(alkom), alkomEvidence.identities.unchangedPricingIdentitySha256)
  assert.equal(catalogueBoundCoordinates(alkom).addressId, batch.existingChanges[0].addressId)
  assert.equal(alkom.neighborhood, null)
  assert.equal(search(alkom)[0].id, alkom.id)
  for (const name of ['Борово', 'Манастирски ливади']) assert.deepEqual(search(alkom, { neighborhood: name }), [])
})

test('exact road-name aliases and named entrances preserve all pricing, routes, identities and scopes', () => {
  for (const change of batch.existingChanges.slice(1)) {
    const row = SOFIA_CATALOGUE.find(item => item.id === change.id)
    const previous = prior.find(item => item.id === change.id)
    assert.deepEqual({ ...row, coordinates: null }, previous)
    assert.deepEqual(applyNorthWestEntranceRecovery20261123(applyNamedRoadAliasRecovery20261123([previous])), [row])
    assert.equal(pricingIdentity(row), pricingIdentity(previous))
    assert.equal(catalogueBoundCoordinates(row).addressId, change.addressId)
    assert.equal(search(row)[0].id, row.id)
    assert.deepEqual(search(row, { neighborhood: 'Левски В' }), [])
  }
})

test('coverage gains six no-longer-empty cells and seven usable points, with no Alkom neighborhood attribution', () => {
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const cells = reports.map(report => addressPriorityQueue(report, { neighborhood: 'Левски В', category: 'detailing' })[0])
  assert.deepEqual(cells.map(c => c.premises), batch.newRows[0].physical)
  assert.deepEqual(cells.map(c => c.verifiedAddresses), batch.newRows[0].located)
  assert.deepEqual(cells.map(c => c.verifiedGap), [30, 29])
  assert.deepEqual(reports.map(x => x.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(x => x.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(x => x.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  assert.deepEqual(reports.map(x => addressPriorityQueue(x).filter(c => c.verifiedAddresses === 0).length), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(x => addressPriorityQueue(x).filter(c => c.verifiedAddresses === 0 && c.scope === 'existing_picker_neighborhood').length),
    batch.emptyLocatedPickerCells)
  for (const change of batch.existingChanges.slice(1)) {
    for (const expected of change.neighborhoodCategoryEffects) {
      const cell = reports.map(report => addressPriorityQueue(report, { neighborhood: change.neighborhood, category: expected.category })[0])
      assert.deepEqual(cell.map(x => x.premises), expected.physical)
      assert.deepEqual(cell.map(x => x.verifiedAddresses), expected.located)
    }
  }
})
