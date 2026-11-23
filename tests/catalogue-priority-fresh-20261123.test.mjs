import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/priority-fresh-20261123.json' with { type: 'json' }
import east from '../docs/catalogue-coverage/priority-fresh-east-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { filterBusinessesBySubcategory } from '../lib/discovery/subcategories.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { priorityFreshPriorCatalogue } from './catalogue-priority-fresh-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const prior = priorityFreshPriorCatalogue(SOFIA_CATALOGUE)
const rows = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const host = website => website ? new URL(website).hostname.replace(/^www\./u, '') : ''
const search = (row, overrides) => normalizeCatalogueBusinesses([row], {
  cityCode: '68134', coordinates: row.coordinates, neighborhood: row.neighborhood,
  category: row.category, radiusKm: .15, browse: true, searchV2: true, ...overrides,
}, { now })

test('fresh operators appear only within their exact quarter/radius and keep the audited external or phone routes', () => {
  let priced = 0
  for (const expected of batch.newRows) {
    const row = rows.get(expected.id)
    assert.ok(row)
    const [hit] = search(row)
    assert.equal(hit.id, row.id)
    const point = catalogueBoundCoordinates(row)
    assert.equal(point.addressId ?? null, expected.addressId)
    assert.equal(point.method, expected.addressId === null ? 'first_party_coordinates' : 'verified_official_address')
    assert.deepEqual(search(row, { neighborhood: 'Горубляне' }), [])
    assert.deepEqual(search(row, { coordinates: { latitude: 42.59, longitude: 23.14 } }), [])
    assert.deepEqual(hit.availability, { status: 'external', slots: [] })
    assert.deepEqual([hit.booking.kind, hit.booking.url ?? hit.booking.phone],
      [row.booking.kind, row.booking.url ?? row.booking.phone])
    const review = BOOKING_PRICE_REVIEWS.find(item => item.id === row.id)
    const audit = assessPricingReview(row, review, now)
    assert.equal(audit.state, expected.reviewState)
    priced += audit.reviewedPriceCount
    assert.ok(prior.every(item => (!row.website || host(item.website) !== host(row.website)) && (!row.phone || item.phone !== row.phone)), row.id)
    if (audit.pricingState === 'not_publicly_listed') assert.ok(row.services.every(item => item.price === undefined))
    assert.ok(hit.details.services.every(item => ['activity', 'exact'].includes(serviceThumbnail(item, { business: row }).photoMatch)), row.id)
  }
  assert.equal(priced, batch.verifiedPublicPriceFacts)
})

test('the barber keeps exact stated terms and each audited illustrative asset matches the public service', async () => {
  const evidence = east.businesses[0]
  const row = rows.get(evidence.id)
  const [{ details, booking }] = search(row)
  assert.deepEqual([booking.kind, booking.phone, booking.url], ['phone', '+359894419185', undefined])
  assert.equal(details.services.length, evidence.services.length)
  for (const expected of evidence.services) {
    const service = details.services.find(item => item.name === expected.nameBg)
    assert.equal(service.price, expected.amountEur)
    const photo = serviceThumbnail(service, { business: row })
    assert.equal(photo.src, '/service-photos/' + expected.imageKey + '-v1.webp')
    assert.equal(photo.source, 'illustrative')
    const bytes = await readFile(new URL('../public' + photo.src, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.imageSha256)
  }
  assert.equal(row.openingHours, undefined)
  assert.ok(row.services.every(item => item.durationMin === undefined))
})

test('the workshop exposes a starting price and confirms the final quote in person, without showing a fake duration', () => {
  const row = rows.get('sofia-one-service-vrabnitsa1-276-13')
  const [{ details, booking }] = search(row)
  assert.deepEqual([booking.kind, booking.url], ['form', 'https://motero.bg/servizi/one-service'])
  assert.equal(details.services.length, 1)
  assert.equal(details.services[0].price, 50)
  assert.equal(row.services[0].price.kind, 'from')
  assert.equal(row.services[0].durationMin, undefined)
  assert.match(details.services[0].description, /ориентировъчна начална цена.*след преглед.*плащането е на място/u)
  assert.equal(serviceThumbnail(details.services[0], { business: row }).src, '/service-photos/auto-diagnostics-v1.webp')
})

test('the located language lesson uses the enrolment number, per-lesson price and language subcategory', () => {
  const row = rows.get('sofia-magazinche-za-znanie-lyulin2')
  const hits = search(row)
  const [{ details, booking }] = filterBusinessesBySubcategory(hits, 'education-languages')
  assert.deepEqual([booking.kind, booking.phone], ['phone', '+359877666626'])
  assert.equal(details.services.length, 1)
  const [service] = details.services
  assert.deepEqual([service.name, service.price, service.priceUnit], ['Групов урок по английски за деца', 15, 'на занимание'])
  assert.match(service.description, /предварително записване по телефона/u)
  assert.equal(serviceThumbnail(service, { business: row }).src, '/service-photos/sx-child-language-group-v1.webp')
  assert.deepEqual(filterBusinessesBySubcategory(hits, 'education-mathematics'), [])
})

test('each quarter/category gain is measured against the previous inventory, not inflated by duplicate rows', () => {
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
