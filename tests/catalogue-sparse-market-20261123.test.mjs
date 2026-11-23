import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import batch from '../docs/catalogue-coverage/sparse-market-priority-20261123.json' with { type: 'json' }
import vitosha from '../docs/catalogue-coverage/vitosha-pair-intake-20261123.json' with { type: 'json' }
import gemini from '../docs/catalogue-coverage/gemini4-intake-20261123.json' with { type: 'json' }
import alva from '../docs/catalogue-coverage/alva-dental-intake-20261123.json' with { type: 'json' }
import locations from '../docs/catalogue-coverage/sparse-address-bindings-20261123.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applySparseAddressBindings20261123 } from '../lib/discovery/catalogue-data/sparse-address-bindings-20261123.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { sparseMarketPriorCatalogue } from './catalogue-sparse-market-20261123-scope.mjs'
import { peripheryPriorCatalogue } from './catalogue-periphery-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const records = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const sha = value => createHash('sha256').update(value).digest('hex')
const pricingReview = row => assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(review => review.id === row.id), now)
function near(row, options) {
  return normalizeCatalogueBusinesses([row], {
    cityCode: '68134', neighborhood: row.neighborhood, category: row.category, coordinates: row.coordinates,
    radiusKm: 0.15, browse: true, searchV2: true, ...options,
  }, { now })
}
function checkPoint(row, point) {
  assert.deepEqual([catalogueBoundCoordinates(row)?.addressId, row.coordinates.latitude, row.coordinates.longitude],
    [point.addressId, point.latitude, point.longitude])
  assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
}

test('the two Vitosha venues expose real euros, a phone and external class reservations without inventing availability', () => {
  for (const receipt of vitosha.businesses) {
    const row = records.get(receipt.id), [result] = near(row)
    checkPoint(row, receipt.municipal)
    assert.deepEqual([result.booking.kind, result.booking.phone ?? result.booking.url, result.availability],
      [receipt.booking.kind, receipt.booking.phone ?? receipt.booking.url, { status: 'external', slots: [] }])
    assert.equal(pricingIdentity(row), receipt.inventoryIdentity)
    assert.equal(pricingReview(row).state, 'reviewed')
    assert.deepEqual(result.details.services.map(({ name, price, priceKind, currency, priceUnit }) => [name, price, priceKind, currency, priceUnit]),
      receipt.prices.map(({ name, amount, kind, currency, unit }) => [name, amount, kind, currency, unit ?? '']))
    for (const service of result.details.services) {
      const photo = serviceThumbnail(service, { business: row })
      assert.deepEqual([photo.source, photo.photoMatch], ['illustrative', 'activity'])
      assert.equal(sha(readFileSync(new URL('../public' + photo.src, import.meta.url))), vitosha.illustrationAssets[photo.src])
      if (service.name === 'Боядисване на броня') assert.equal(photo.src, '/service-photos/sx-auto-bumper-spray-paint-v1.webp')
      if (service.name === 'Боядисване на врата или калник') assert.equal(photo.src, '/service-photos/sx-auto-panel-spray-paint-v1.webp')
      const presentation = createEnglishContentResolver(english).service(service, row).presentationEn
      assert.match(presentation.name, /^[A-Z]/u)
      assert.doesNotMatch(presentation.description, /\p{Script=Cyrillic}/u)
      assert.ok(presentation.description)
    }
  }
  const [shop, gym] = vitosha.businesses.map(x => records.get(x.id))
  assert.equal(shop.openingHours, undefined)
  assert.equal(gym.openingHours.days.length, 7)
  assert.notEqual(gym.booking.url, gym.services[0].price.sourceUrl)
})

test('the transmission workshop and dental office leave unpriced services blank and retain sourced booking numbers', () => {
  for (const [receipt, point] of [[gemini.business, gemini.business.coordinateEvidence], [alva.newBusiness, alva.newBusiness.municipal]]) {
    const row = records.get(receipt.id), [result] = near(row)
    checkPoint(row, point)
    assert.equal(pricingIdentity(row), receipt.inventoryIdentity)
    assert.equal(pricingReview(row).pricingState, 'not_publicly_listed')
    assert.equal(pricingReview(row).state, 'service_reviewed')
    assert.deepEqual([result.booking.kind, result.booking.phone, result.availability], ['phone', receipt.booking?.phone ?? receipt.phone, { status: 'external', slots: [] }])
    for (const service of result.details.services) {
      assert.deepEqual([service.price, service.durationMin], [null, null])
      assert.equal(serviceThumbnail(service, { business: row }).photoMatch, 'activity')
      assert.doesNotMatch(createEnglishContentResolver(english).service(service, row).presentationEn.name, /\p{Script=Cyrillic}/u)
    }
  }
  assert.deepEqual(records.get(alva.newBusiness.id).services.map(({ name }) => name), alva.newBusiness.services.map(({ name }) => name))
})

test('four already-listed premises add only an identity-bound coordinate, preserving the booked service inventory', () => {
  for (const evidence of locations.recoveries) {
    const row = records.get(evidence.id), [previous] = sparseMarketPriorCatalogue([row])
    checkPoint(row, evidence.municipalMatch)
    assert.deepEqual(row, { ...previous, coordinates: row.coordinates })
    assert.equal(pricingIdentity(previous), evidence.pricingIdentity)
    assert.equal(pricingIdentity(row), evidence.pricingIdentity)
    assert.equal(near(row)[0]?.id, row.id)
    assert.deepEqual(near(previous, { coordinates: row.coordinates }), [])
    assert.equal(applySparseAddressBindings20261123([row])[0], row)
    const wrong = { ...previous, address: previous.address + 'А' }
    assert.equal(applySparseAddressBindings20261123([wrong])[0], wrong)
    assert.throws(() => sparseMarketPriorCatalogue([wrong]), /Unreviewed sparse-market/u)
  }
})

test('the coverage ledger describes distinct new operators and the first exact point in six cells', () => {
  const current = peripheryPriorCatalogue(SOFIA_CATALOGUE)
  const prior = sparseMarketPriorCatalogue(current)
  const earlier = new Map(prior.map(row => [row.id, row]))
  const newRows = current.filter(row => !earlier.has(row.id))
  assert.deepEqual(newRows.map(x => x.id), batch.affected.filter(x => x.change === 'new_operator').map(x => x.id))
  assert.equal(new Set(newRows.map(x => new URL(x.website).hostname)).size, batch.newDistinctOperators)
  assert.equal(newRows.flatMap(row => row.services).filter(service => service.price).length, batch.verifiedPublicPriceFacts)
  const reports = [prior, current].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const all = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = areas => areas.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.deepEqual(reports.map(r => r.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(r => r.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(r => empty(all(r))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(r => empty(r.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(r => r.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  for (const outcome of batch.affected) {
    const cells = reports.map(report => all(report).find(area => area.name === outcome.neighborhood).cells.find(c => c.categoryId === outcome.category))
    assert.deepEqual(cells.map(x => x.count), outcome.physical)
    assert.deepEqual(cells.map(x => x.locatedCount), outcome.located)
    assert.ok(cells[1].locatedBusinessIds.includes(outcome.id))
  }
})
