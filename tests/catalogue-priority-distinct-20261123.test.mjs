import assert from 'node:assert/strict'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/priority-distinct-20261123.json' with { type: 'json' }
import elit from '../docs/catalogue-coverage/elit-chess-sveta-troitsa-intake-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { priorityDistinctPriorCatalogue } from './catalogue-priority-distinct-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const prior = priorityDistinctPriorCatalogue(SOFIA_CATALOGUE)
const rows = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const host = site => site ? new URL(site).hostname.replace(/^www\./u, '') : ''
const search = (row, overrides) => normalizeCatalogueBusinesses([row], {
  cityCode: '68134', coordinates: row.coordinates, neighborhood: row.neighborhood, category: row.category,
  radiusKm: .15, browse: true, searchV2: true, ...overrides,
}, { now })

test('new premises have exact addresses, scoped services and checked external booking without invented slots', () => {
  const seenPostal = new Set()
  let verifiedPriceFacts = 0, explicitFreeOffers = 0, withoutPrice = 0
  for (const expected of batch.newRows) {
    const row = rows.get(expected.id), [hit] = search(row)
    assert.equal(hit.id, row.id)
    assert.deepEqual(hit.availability, { status: 'external', slots: [] })
    assert.deepEqual([hit.booking.kind, hit.booking.url ?? hit.booking.phone], [row.booking.kind, row.booking.url ?? row.booking.phone])
    assert.deepEqual(search(row, { neighborhood: 'Левски Г' }), [])
    const postal = catalogueBoundCoordinates(row).addressId
    assert.equal(postal, expected.addressId)
    assert.ok(!seenPostal.has(postal))
    seenPostal.add(postal)
    const previousByOperator = prior.filter(item => host(item.website) === host(row.website) || (row.phone && item.phone === row.phone))
    if (expected.change === 'new_operator') assert.deepEqual(previousByOperator, [], row.id)
    else assert.ok(previousByOperator.some(item => expected.existingOperatorRows.includes(item.id)), row.id)
    assert.ok(previousByOperator.every(item => catalogueBoundCoordinates(item)?.addressId !== postal && item.address !== row.address), row.id)
    const review = BOOKING_PRICE_REVIEWS.find(item => item.id === row.id)
    assert.equal(review.inventoryIdentity, pricingIdentity(row))
    const audit = assessPricingReview(row, review, now)
    assert.equal(audit.state, expected.reviewState)
    verifiedPriceFacts += audit.reviewedPriceCount
    explicitFreeOffers += row.services.filter(service => service.price?.amount === 0).length
    if (audit.pricingState === 'not_publicly_listed') {
      assert.ok(row.services.every(service => service.price === undefined))
      withoutPrice++
    }
    assert.ok(hit.details.services.every(service => ['activity', 'exact'].includes(serviceThumbnail(service, { business: row }).photoMatch)), row.id)
  }
  assert.deepEqual([verifiedPriceFacts, explicitFreeOffers, withoutPrice],
    [batch.verifiedPublicPriceFacts, batch.freeTrialsAmongPriceFacts, batch.serviceReviewedWithoutStandalonePrice])
})

test('chess preserves per-visit versus monthly pricing and the second-child condition without guessing duration', () => {
  const row = rows.get(elit.business.id)
  assert.equal(row.coordinates.addressId, elit.business.municipal.addressId)
  const [hit] = search(row)
  assert.deepEqual(hit.details.services.map(item => [item.price, item.priceUnit]), [[15, 'посещение'], [50, 'месечна такса'], [70, 'месечна такса']])
  assert.match(hit.details.services[1].description, /второ дете.*40 € на месец/u)
  assert.match(hit.details.services[2].description, /второ дете.*56 € на месец/u)
  assert.ok(row.services.every(item => item.durationMin === undefined))
  assert.ok(hit.details.services.every(item => serviceThumbnail(item, { business: row }).src === '/service-photos/sx-child-chess-group-v1.webp'))
})

test('separate education branches keep instalment and free-demo prices attached to the stated service only', () => {
  const studio = rows.get('sofia-studio-s-hadzhi-dimitar-vastanik5')
  assert.deepEqual(studio.services.map(({ price }) => [price.amount, price.unit]), [[390, 'вноска · 3 за курса'], [390, 'вноска · 3 за курса']])
  assert.ok(studio.services.every(service => /120 учебни часа.*една от трите вноски, не цена за занятие/u.test(service.description)))
  assert.deepEqual(search(studio, { neighborhood: 'Младост 1' }), [])
  const [smarty] = search(rows.get('sofia-smartykids-lyulin9-block954'))
  assert.equal(smarty.details.services.length, 1)
  assert.equal(smarty.details.services[0].price, 0)
  assert.match(smarty.details.services[0].name, /^Пробен урок/u)
  assert.match(smarty.details.services[0].description, /не включва редовния курс/u)
  const [limoncello] = search(rows.get('sofia-limoncello-kids-buxton-gortalov1'))
  assert.deepEqual([limoncello.booking.kind, limoncello.details.services[0].price, limoncello.details.services[0].priceUnit],
    ['phone', 4.09, 'час'])
  assert.match(limoncello.details.services[0].description, /дали е нужна резервация на маса/u)
})

test('branch coverage and business-operator growth reconcile without changing earlier inventory or rounding up empty cells', () => {
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const areas = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = list => list.flatMap(place => place.cells).filter(row => !row.locatedCount).length
  assert.ok(prior.every(row => SOFIA_CATALOGUE.includes(row)))
  assert.equal(SOFIA_CATALOGUE.length - prior.length, batch.newPremises)
  assert.equal(batch.newRows.filter(row => row.change === 'new_operator').length, batch.newDistinctOperators)
  assert.deepEqual(reports.map(item => item.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(item => item.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(item => empty(areas(item))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(item => empty(item.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(item => item.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  for (const expected of batch.newRows) {
    const cells = reports.map(item => areas(item).find(area => area.name === expected.neighborhood).cells.find(cell => cell.categoryId === expected.category))
    assert.deepEqual(cells.map(c => c.count), expected.physical)
    assert.deepEqual(cells.map(c => c.locatedCount), expected.located)
    assert.ok(cells[1].locatedBusinessIds.includes(expected.id))
  }
})
