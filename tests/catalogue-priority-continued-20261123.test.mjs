import assert from 'node:assert/strict'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/priority-continued-20261123.json' with { type: 'json' }
import east from '../docs/catalogue-coverage/priority-continued-east-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { priorityContinuedPriorCatalogue } from './catalogue-priority-continued-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const prior = priorityContinuedPriorCatalogue(SOFIA_CATALOGUE)
const rows = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const search = (row, overrides) => normalizeCatalogueBusinesses([row], {
  cityCode: '68134', coordinates: row.coordinates, neighborhood: row.neighborhood, category: row.category,
  radiusKm: .15, browse: true, searchV2: true, ...overrides,
}, { now })

test('new locations pass neighborhood and tight-radius search without making external slots available', () => {
  let priceFacts = 0
  for (const record of batch.newRows) {
    const row = rows.get(record.id), [hit] = search(row)
    assert.equal(hit.id, row.id)
    assert.equal(catalogueBoundCoordinates(row).addressId, record.addressId)
    assert.deepEqual(hit.availability, { status: 'external', slots: [] })
    assert.deepEqual([hit.booking.kind, hit.booking.url ?? hit.booking.phone],
      [row.booking.kind, row.booking.url ?? row.booking.phone])
    assert.deepEqual(search(row, { neighborhood: 'Левски Г' }), [])
    assert.deepEqual(search(row, { coordinates: { latitude: 42.63, longitude: 23.25 } }), [])
    assert.ok(prior.every(existing => existing.website !== row.website && (!row.phone || existing.phone !== row.phone)))
    const review = BOOKING_PRICE_REVIEWS.find(item => item.id === row.id)
    const audit = assessPricingReview(row, review, now)
    assert.equal(audit.state, record.reviewState)
    if (audit.pricingState === 'not_publicly_listed') assert.ok(row.services.every(service => service.price === undefined))
    priceFacts += audit.reviewedPriceCount
  }
  assert.equal(priceFacts, batch.verifiedPublicPriceFacts)
})

test('Йонитрейд uses the correct branch phone, an illustrative driving image and no invented course price', () => {
  const [receipt] = east.businesses
  const row = rows.get(receipt.id), [hit] = search(row)
  const [service] = hit.details.services
  assert.equal(hit.details.services.length, 1)
  assert.equal(service.name, receipt.serviceNameBg)
  assert.equal(row.services[0].price, undefined)
  assert.equal(row.services[0].durationMin, undefined)
  assert.equal(hit.booking.phone, '+359888403319')
  assert.equal(hit.booking.url, undefined)
  assert.equal(serviceThumbnail(service, { business: row }).src, '/service-photos/driving-lesson-v1.webp')
})

test('the batch improves verified coverage without crediting held venues or changing earlier inventory', () => {
  const reports = [prior, SOFIA_CATALOGUE].map(records => catalogueCoverageReport(records, { now, target: 30 }))
  const areas = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = list => list.flatMap(place => place.cells).filter(item => !item.locatedCount).length
  assert.ok(prior.every(row => rows.get(row.id) === row))
  assert.equal(SOFIA_CATALOGUE.length - prior.length, batch.newDistinctOperators)
  assert.deepEqual(reports.map(item => item.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(item => item.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(item => empty(areas(item))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(item => empty(item.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(item => item.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  for (const record of batch.newRows) {
    const cells = reports.map(item => areas(item).find(area => area.name === record.neighborhood).cells.find(cell => cell.categoryId === record.category))
    assert.deepEqual(cells.map(item => item.count), record.physical)
    assert.deepEqual(cells.map(item => item.locatedCount), record.located)
    assert.ok(cells[1].locatedBusinessIds.includes(record.id))
  }
})
