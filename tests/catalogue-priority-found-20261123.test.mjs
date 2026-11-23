import assert from 'node:assert/strict'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/priority-found-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { filterBusinessesBySubcategory } from '../lib/discovery/subcategories.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { priorityFoundPriorCatalogue } from './catalogue-priority-found-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const prior = priorityFoundPriorCatalogue(SOFIA_CATALOGUE)
const rows = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const host = website => website ? new URL(website).hostname.replace(/^www\./u, '') : ''
const search = (row, overrides) => normalizeCatalogueBusinesses([row], {
  cityCode: '68134', coordinates: row.coordinates, neighborhood: row.neighborhood,
  category: row.category, radiusKm: .15, browse: true, searchV2: true, ...overrides,
}, { now })

test('each new operator appears at the verified civic premises with source-reviewed prices and the actual booking route', () => {
  let priced = 0
  for (const expected of batch.newRows) {
    const row = rows.get(expected.id), [hit] = search(row)
    const point = catalogueBoundCoordinates(row)
    assert.equal(point.addressId, expected.addressId)
    assert.equal(point.method, 'verified_official_address')
    assert.equal(hit.id, row.id)
    assert.deepEqual(search(row, { neighborhood: 'Горубляне' }), [])
    assert.deepEqual(search(row, { coordinates: { latitude: 42.59, longitude: 23.14 } }), [])
    assert.deepEqual(hit.availability, { status: 'external', slots: [] })
    assert.deepEqual([hit.booking.kind, hit.booking.url ?? hit.booking.phone],
      [row.booking.kind, row.booking.url ?? row.booking.phone])
    const audit = assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(item => item.id === row.id), now)
    assert.equal(audit.state, expected.reviewState)
    priced += audit.reviewedPriceCount
    assert.ok(prior.every(item => (!row.website || host(item.website) !== host(row.website)) && (!row.phone || item.phone !== row.phone)), row.id)
    assert.ok(hit.details.services.every(item => ['activity', 'exact'].includes(serviceThumbnail(item, { business: row }).photoMatch)), row.id)
  }
  assert.equal(priced, batch.verifiedPublicPriceFacts)
})

test('SparkLab preserves one price per 10-lesson level and separates each optional instalment', () => {
  const row = rows.get('sofia-sparklab-mladost3-block304-3')
  const [{ details, booking }] = filterBusinessesBySubcategory(search(row), 'education-coding')
  assert.deepEqual([booking.kind, booking.phone], ['phone', '+359876452447'])
  assert.deepEqual(details.services.map(service => [service.price, service.priceUnit]), [
    [219, 'за ниво от 10 урока'], [219, 'за ниво от 10 урока'], [239, 'за ниво от 10 урока'],
  ])
  for (const [i, fee] of [115, 115, 129].entries()) {
    const service = details.services[i]
    assert.match(service.description, new RegExp('2 вноски по ' + fee + ' €', 'u'))
    assert.match(service.description, /10 групови урока по 90 минути с включени материали/u)
    assert.equal(row.services[i].durationMin, undefined)
    assert.equal(service.durationMin, null)
    assert.equal(serviceThumbnail(service, { business: row }).src, '/service-photos/sx-child-robotics-v1.webp')
  }
})

test('Little Smiles separates the hall package, food, entertainer and refundable deposit', () => {
  const row = rows.get('sofia-little-smiles-mladost1-nikola-genadiev5g')
  const [{ details, booking }] = search(row)
  assert.deepEqual([booking.kind, booking.phone], ['phone', '+359988832856'])
  assert.deepEqual(details.services.map(service => [service.price, service.priceUnit, service.durationMin]), [
    [240, 'пакет', 120], [380, 'пакет', 120], [440, 'пакет', 150], [480, 'пакет', 150],
  ])
  assert.match(details.services[0].description, /няма професионален аниматор/u)
  assert.match(details.services[1].description, /професионален аниматор за два часа/u)
  assert.match(details.services[2].description, /Тортата не е включена/u)
  assert.match(details.services[3].description, /Включена е торта с фотоснимка/u)
  for (const service of details.services) {
    assert.match(service.description, /Капаро за резервация: 50 €, възстановимо при отказ поне 7 дни/u)
    assert.equal(serviceThumbnail(service, { business: row }).src, '/service-photos/sx-indoor-childrens-birthday-party-v1.webp')
  }
})

test('a shared address does not merge two independent Pavlovo education operators', () => {
  const row = rows.get('sofia-jolly-kids-pavlovo-duychev12v')
  const colocated = rows.get('sofia-part-time-pavlovo-duychev12v')
  assert.equal(catalogueBoundCoordinates(row).addressId, catalogueBoundCoordinates(colocated).addressId)
  assert.notEqual(row.booking.phone, colocated.booking.phone)
  assert.notEqual(host(row.website), host(colocated.website))
  const [{ details, booking }] = filterBusinessesBySubcategory(search(row), 'education-languages')
  assert.deepEqual([booking.kind, booking.phone], ['phone', '+359889050604'])
  const [service] = details.services
  assert.deepEqual([service.price, service.priceUnit], [165, 'месечна такса'])
  assert.match(service.description, /договор и депозит.*последната месечна такса/u)
  assert.equal(serviceThumbnail(service, { business: row }).src, '/service-photos/sx-child-language-group-v1.webp')
})

test('each quarter/category addition is measured against the previous dated local catalogue', () => {
  const reports = [prior, SOFIA_CATALOGUE].map(items => catalogueCoverageReport(items, { now, target: 30 }))
  const areas = result => [...result.neighborhoods, ...result.additionalNamedAreas]
  const empty = list => list.flatMap(area => area.cells).filter(item => !item.locatedCount).length
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
