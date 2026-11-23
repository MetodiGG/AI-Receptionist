import assert from 'node:assert/strict'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/priority-next-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { priorityNextPriorCatalogue } from './catalogue-priority-next-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const prior = priorityNextPriorCatalogue(SOFIA_CATALOGUE)
const rows = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const host = website => website ? new URL(website).hostname.replace(/^www\./u, '') : ''
const search = (row, overrides) => normalizeCatalogueBusinesses([row], {
  cityCode: '68134', coordinates: row.coordinates, neighborhood: row.neighborhood,
  category: row.category, radiusKm: .15, browse: true, searchV2: true, ...overrides,
}, { now })

test('the new premises appear within the correct neighborhood and radius with the verified booking route', () => {
  let verifiedPriceFacts = 0
  for (const expected of batch.newRows) {
    const row = rows.get(expected.id), [hit] = search(row)
    assert.equal(hit.id, row.id)
    const point = catalogueBoundCoordinates(row)
    assert.ok(point)
    assert.equal(point.addressId ?? null, expected.addressId)
    assert.equal(point.method, expected.addressId === null ? 'first_party_coordinates' : 'verified_official_address')
    assert.deepEqual(search(row, { neighborhood: 'Горубляне' }), [])
    assert.deepEqual(search(row, { coordinates: { latitude: 42.61, longitude: 23.22 } }), [])
    assert.deepEqual(hit.availability, { status: 'external', slots: [] })
    assert.deepEqual([hit.booking.kind, hit.booking.url ?? hit.booking.phone],
      [row.booking.kind, row.booking.url ?? row.booking.phone])
    const review = BOOKING_PRICE_REVIEWS.find(item => item.id === row.id)
    const audit = assessPricingReview(row, review, now)
    assert.equal(audit.state, expected.reviewState)
    verifiedPriceFacts += audit.reviewedPriceCount
    assert.ok(prior.every(item => (!row.website || host(item.website) !== host(row.website)) && (!row.phone || item.phone !== row.phone)), row.id)
    if (audit.pricingState === 'not_publicly_listed') assert.ok(row.services.every(item => item.price === undefined))
    assert.ok(hit.details.services.every(item => ['activity', 'exact'].includes(serviceThumbnail(item, { business: row }).photoMatch)), row.id)
  }
  assert.equal(verifiedPriceFacts, batch.verifiedPublicPriceFacts)
})

test('the course tariff is for the full course, with exams outside it and no inferred availability', () => {
  const row = rows.get('sofia-drive-school-knyazhevo-tsar-boris365')
  const [hit] = search(row)
  assert.equal(hit.booking.url, 'https://drive-school.eu/program/bcategoria/')
  assert.equal(hit.details.services.length, 1)
  const [service] = hit.details.services
  assert.deepEqual([service.price, service.priceUnit], [1120, 'за курса, без изпитни такси'])
  assert.match(service.description, /60 € за теоретичния изпит и 70 € за практическия изпит/u)
  assert.equal(row.services[0].durationMin, undefined)
  assert.equal(serviceThumbnail(service, { business: row }).src, '/service-photos/driving-lesson-v1.webp')
})

test('dental services use their distinct pictures and the public telephone, without an invented fee or slot', () => {
  const row = rows.get('sofia-active-dental-mladost2-block295')
  const [hit] = search(row)
  assert.deepEqual(hit.details.services.map(item => [item.name, serviceThumbnail(item, { business: row }).src]), [
    ['Почистване на зъбен камък', '/service-photos/dental-cleaning-v1.webp'],
    ['Лечение на кариес', '/service-photos/dental-filling-v1.webp'],
  ])
  assert.equal(hit.booking.phone, '+359876300990')
  assert.equal(hit.booking.url, undefined)
  assert.deepEqual(row.openingHours.days.slice(-2).map(day => day.periods), [[], []])
})

test('the named tennis venue keeps one court-hour tariff and shows the surface-specific illustration', () => {
  const row = rows.get('sofia-sokol-tennis-benkovski-stadium')
  const [hit] = search(row)
  const [service] = hit.details.services
  assert.match(row.address, /стадион „Георги Бенковски“/u)
  assert.doesNotMatch(row.address, /130/u)
  assert.deepEqual([service.price, service.priceUnit, row.services[0].durationMin], [10, 'корт · час', 60])
  assert.match(service.description, /без треньор.*плащане на място/u)
  const photo = serviceThumbnail(service, { business: row })
  assert.equal(photo.source, 'illustrative')
  assert.equal(photo.src, '/service-photos/sx-outdoor-turf-tennis-court-v1.webp')
  const cover = businessCoverPhoto(hit)
  assert.equal(cover.src, '/business-cover-photos/activity-sx-outdoor-turf-tennis-court-v1.webp')
  assert.equal(cover.fallbackSrc, photo.src)
})

test('measured scope and documented gaps match the approved additions without rewriting earlier inventory', () => {
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
