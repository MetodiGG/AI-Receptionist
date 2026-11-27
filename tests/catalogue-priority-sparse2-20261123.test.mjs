import assert from 'node:assert/strict'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/priority-sparse2-20261123.json' with { type: 'json' }
import translations from '../lib/locale/service-english.json' with { type: 'json' }
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { prioritySparse2PriorCatalogue } from './catalogue-priority-sparse2-20261123-scope.mjs'
import { catalogueIntakePriorCatalogue } from './catalogue-mopart-20261127-scope.mjs'

const now = Date.parse(batch.checkedAt)
const SOFIA_CATALOGUE = catalogueIntakePriorCatalogue(currentCatalogue)
const before = prioritySparse2PriorCatalogue(SOFIA_CATALOGUE)
const rows = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const previousRows = new Map(before.map(row => [row.id, row]))
const search = (row, overrides) => normalizeCatalogueBusinesses([row], {
  cityCode: '68134', coordinates: row.coordinates, neighborhood: row.neighborhood,
  category: row.category, radiusKm: .15, browse: true, searchV2: true, ...overrides,
}, { now })
const outsideRadius = { latitude: 42.59, longitude: 23.14 }

test('new premises are separately bookable only in their verified quarter and radius', () => {
  let priced = 0
  for (const expected of batch.newRows) {
    const row = rows.get(expected.id)
    const point = catalogueBoundCoordinates(row)
    assert.equal(point.addressId ?? null, expected.addressId)
    assert.equal(point.method, expected.addressId === null ? 'first_party_coordinates' : 'verified_official_address')
    assert.equal(catalogueBoundCoordinates({ ...row, address: 'София, ул. „Оборище“ 101' }), null)
    const [hit] = search(row)
    assert.equal(hit.id, row.id)
    assert.deepEqual(search(row, { neighborhood: 'Горубляне' }), [])
    assert.deepEqual(search(row, { coordinates: outsideRadius }), [])
    assert.deepEqual(hit.availability, { status: 'external', slots: [] })
    assert.deepEqual([hit.booking.kind, hit.booking.url ?? hit.booking.phone], [row.booking.kind, row.booking.url ?? row.booking.phone])
    const audit = assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(item => item.id === row.id), now)
    assert.equal(audit.state, expected.reviewState)
    priced += audit.reviewedPriceCount
    assert.ok(before.every(item => item.id !== row.id && item.booking?.url !== row.booking.url &&
      (item.address !== row.address || item.phone !== row.phone)), row.id)
    for (const service of hit.details.services) {
      assert.ok(translations.names[service.name], service.name)
      assert.ok(translations.descriptions[service.description], service.name)
      assert.ok(['activity', 'exact'].includes(serviceThumbnail(service, { business: row }).photoMatch), service.name)
    }
  }
  assert.equal(priced, batch.verifiedPublicPriceFacts)
})

test('Lokomotiv shows the indoor clay court rate and an illustrative clay court, not outdoor or live GoRez availability', () => {
  const row = rows.get('sofia-lokomotiv-tennis-voenna-rampa-rozhen23')
  const [hit] = search(row)
  assert.equal(hit.details.services.length, 1)
  const [service] = hit.details.services
  assert.deepEqual([service.price, service.currency, service.priceUnit, service.durationMin], [20, 'EUR', 'корт · час', 60])
  assert.match(service.description, /закрит клей корт, без треньор.*избрания час.*плащане на място/u)
  const photo = serviceThumbnail(service, { business: row })
  assert.equal(photo.source, 'illustrative')
  assert.equal(photo.src, '/service-photos/sx-indoor-clay-tennis-court-v1.webp')
  assert.equal(businessCoverPhoto(hit).src, '/business-cover-photos/activity-sx-indoor-clay-tennis-court-v1.webp')
  assert.equal(businessCoverPhoto(hit).fallbackSrc, photo.src)
})

test('KindyROO uses a centre-specific booking route and does not offer the term rate as a drop-in', () => {
  const [hit] = search(rows.get('sofia-kindyroo-lyulin8-tsaritsa-yoanna68'))
  const [service] = hit.details.services
  assert.equal(hit.booking.url, 'https://portal.kindyroo.bg/public/timetable?centerId=31')
  assert.deepEqual([service.price, service.currency, service.priceUnit, service.durationMin],
    [19.94, 'EUR', 'на урок при срок от 11 урока', null])
  assert.match(service.description, /не за единично посещение.*оставащите уроци/u)
  assert.equal(translations.units[service.priceUnit], 'per lesson in an 11-lesson term')
})

test('recovered owner destination pins change no listing fields except coordinates', () => {
  for (const record of batch.recoveredRows) {
    const row = rows.get(record.id), previous = previousRows.get(record.id)
    const point = catalogueBoundCoordinates(row)
    assert.equal(previous.coordinates, null)
    assert.deepEqual({ ...row, coordinates: null }, previous)
    assert.deepEqual([point.latitude, point.longitude], record.coordinates)
    assert.equal(point.method, record.coordinateMethod)
    assert.equal(point.addressId ?? null, record.addressId)
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'A' }), null)
    assert.equal(pricingIdentity(row), record.inventoryIdentity)
    for (const { category } of record.categories) {
      const [hit] = search(row, { category })
      assert.equal(hit.id, record.id)
      assert.deepEqual([hit.booking.kind, hit.booking.url ?? hit.booking.phone], [row.booking.kind, row.booking.url ?? row.booking.phone])
      assert.deepEqual(search(row, { category, neighborhood: 'Горубляне' }), [])
      assert.deepEqual(search(row, { category, coordinates: outsideRadius }), [])
    }
  }
})

test('coverage counts reflect the new physical premises and recovered location cells without changing unrelated rows', () => {
  const reports = [before, SOFIA_CATALOGUE].map(items => catalogueCoverageReport(items, { now, target: 30 }))
  const areas = result => [...result.neighborhoods, ...result.additionalNamedAreas]
  const empty = list => list.flatMap(area => area.cells).filter(item => !item.locatedCount).length
  const recovered = new Set(batch.recoveredRows.map(row => row.id))
  assert.ok(before.every(row => recovered.has(row.id) || rows.get(row.id) === row))
  assert.equal(SOFIA_CATALOGUE.length - before.length, batch.newRows.length)
  assert.deepEqual(reports.map(item => item.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(item => item.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(item => empty(areas(item))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(item => empty(item.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(item => item.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  for (const record of [
    ...batch.newRows,
    ...batch.recoveredRows.flatMap(row => row.categories.map(cell => ({ id: row.id, neighborhood: row.neighborhood, ...cell }))),
  ]) {
    const cells = reports.map(item => areas(item).find(area => area.name === record.neighborhood).cells.find(cell => cell.categoryId === record.category))
    assert.deepEqual(cells.map(item => item.count), record.physical)
    assert.deepEqual(cells.map(item => item.locatedCount), record.located)
    assert.ok(cells[1].locatedBusinessIds.includes(record.id))
  }
})
