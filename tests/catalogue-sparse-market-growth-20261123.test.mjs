import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import batch from '../docs/catalogue-coverage/sparse-market-growth-20261123.json' with { type: 'json' }
import intake from '../docs/catalogue-coverage/sparse-market-south-intake-20261123.json' with { type: 'json' }
import dictionary from '../lib/locale/service-english.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { sparseMarketGrowthPriorCatalogue } from './catalogue-sparse-market-growth-20261123-scope.mjs'

const before = sparseMarketGrowthPriorCatalogue(SOFIA_CATALOGUE)
const now = Date.parse(batch.checkedAt)
const opts = { now, target: batch.targetPerQuarterCategory }
const evidence = intake.businesses[0]
const business = SOFIA_CATALOGUE.find(row => row.id === evidence.id)
const reviews = BOOKING_PRICE_REVIEWS.filter(review => review.id === business.id)
const host = website => website ? new URL(website).hostname.replace(/^www\./u, '') : ''

test('actual cleaning operator has a unique proprietor site and order phone, four qualified rates and one bound address', () => {
  assert.ok(before.every(row => host(row.website) !== host(business.website) && row.phone !== business.phone))
  assert.equal(catalogueBoundCoordinates(business)?.addressId, evidence.municipal.addressId)
  assert.equal(pricingIdentity(business), evidence.inventoryIdentity)
  assert.equal(reviews.length, 1)
  const assessment = assessPricingReview(business, reviews[0], now)
  assert.equal(assessment.state, 'reviewed')
  assert.equal(assessment.reviewedPriceCount, 4)
  assert.deepEqual(business.services.map(({ name, price }) => [name, price.kind, price.amount, price.currency, price.unit]),
    evidence.pricing.map(p => [p.service, p.kind, p.amount, p.currency, p.unit]))
  for (const service of business.services) {
    assert.match(service.description, /включен ДДС/u)
    assert.ok(service.durationMin === undefined, 'turnaround is not a bookable visit length')
    const photo = serviceThumbnail(service, { business })
    assert.deepEqual([photo.source, photo.photoMatch, photo.src], ['illustrative', 'exact', '/service-photos/carpet-cleaning-v1.webp'])
    assert.ok(readFileSync(new URL('../public' + photo.src, import.meta.url)).length > 0)
    const en = createEnglishContentResolver(dictionary).service(service, business).presentationEn
    assert.doesNotMatch(en.name + en.description, /\p{Script=Cyrillic}/u)
    assert.match(en.description, /VAT/u)
  }
  const duplicate = batch.duplicateHeld[0]
  assert.ok(before.find(row => row.id === duplicate.existingId))
  assert.equal(SOFIA_CATALOGUE.some(row => host(row.website) === host(duplicate.website)), false)
})

test('Knyazhevo nearby results use the correct category and actual external request, not an invented calendar slot', () => {
  const query = { cityCode: '68134', neighborhood: 'Княжево', category: 'home_services',
    coordinates: business.coordinates, radiusKm: .15, browse: true, searchV2: true }
  const search = patch => normalizeCatalogueBusinesses([business], { ...query, ...patch }, { now })
  const [hit] = search({})
  assert.equal(hit.id, business.id)
  assert.deepEqual(hit.availability, { status: 'external', slots: [] })
  assert.deepEqual([hit.booking.kind, hit.booking.url], ['form', evidence.sources.ownerBookingForm])
  assert.deepEqual(search({ neighborhood: 'Горна баня' }), [])
  assert.deepEqual(search({ category: 'car_wash' }), [])
  assert.deepEqual(search({ coordinates: { latitude: 42.717, longitude: 23.248 } }), [])
})

test('the ledger proves change in the applicable physical/located cell without altering any earlier row', () => {
  const reports = [before, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, opts))
  const areas = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = entries => entries.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.equal(SOFIA_CATALOGUE.length - before.length, batch.newDistinctOperators)
  assert.ok(before.every(row => SOFIA_CATALOGUE.includes(row)))
  assert.deepEqual(reports.map(x => x.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(x => x.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(x => empty(areas(x))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(x => empty(x.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(x => x.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  const cells = reports.map(x => areas(x).find(a => a.name === business.neighborhood).cells.find(c => c.categoryId === business.category))
  assert.deepEqual(cells.map(x => x.count), evidence.coverageAtReview.physical)
  assert.deepEqual(cells.map(x => x.locatedCount), evidence.coverageAtReview.located)
  assert.deepEqual(cells[1].locatedBusinessIds, [business.id])
})
