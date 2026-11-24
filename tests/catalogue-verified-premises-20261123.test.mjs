import test from 'node:test'
import assert from 'node:assert/strict'
import receipt from '../docs/catalogue-coverage/verified-premises-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { VERIFIED_INTAKE_20261123_RECORDS, VERIFIED_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-intake-20261123.mjs'
import { applyVerifiedAddressRecovery20261123 } from '../lib/discovery/catalogue-data/verified-address-recovery-20261123.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_CSV_SHA256, OFFICIAL_SOFIA_SOURCE_URL } from '../lib/discovery/official-sofia-address-source.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { publicProse, serviceDisplayName } from '../lib/locale/public-content.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { verifiedPriorCatalogue } from './catalogue-verified-20261123-scope.mjs'
import { additionalPriorCatalogue } from './catalogue-additional-20261123-scope.mjs'

const now = Date.parse('2026-11-23T12:00:00Z')
const SOFIA_CATALOGUE = additionalPriorCatalogue(currentCatalogue)
const prior = verifiedPriorCatalogue(SOFIA_CATALOGUE)
const actual = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const previous = new Map(prior.map(row => [row.id, row]))
const clinic = actual.get(receipt.new.id)
const source = receipt.new.source
const publicRow = (row, intent) => normalizeCatalogueBusinesses([row], intent, { now })

test('one new exact premises passes the dated provider booking and one-price review', () => {
  assert.equal(receipt.municipalSource, OFFICIAL_SOFIA_SOURCE_URL)
  assert.equal(receipt.municipalCsvSha256, OFFICIAL_SOFIA_CSV_SHA256)
  assert.deepEqual([...actual.keys()].filter(id => !previous.has(id)), [receipt.new.id])
  assert.deepEqual([clinic], validateCatalogue(VERIFIED_INTAKE_20261123_RECORDS))
  assert.equal(clinic.address, receipt.new.address)
  assert.equal(clinic.verification.checkedOn, receipt.checkedOn)
  assert.deepEqual(clinic.booking, { kind: 'form', url: source })
  assert.equal(clinic.services.length, 1)
  assert.equal(clinic.services[0].name, receipt.new.service)
  assert.deepEqual(clinic.services[0].price, { amount: receipt.new.priceEur, currency: 'EUR', kind: 'fixed',
    sourceUrl: source, checkedOn: receipt.checkedOn, validUntil: clinic.verification.validUntil })
  assert.equal(clinic.services[0].durationMin, undefined)
  assert.equal(clinic.openingHours, undefined)
  const [review] = VERIFIED_INTAKE_20261123_REVIEWS
  assert.ok(BOOKING_PRICE_REVIEWS.includes(review))
  assert.equal(review.inventoryIdentity, pricingIdentity(clinic))
  assert.equal(review.bookingEntry, source)
  assert.ok(review.reviewedUrls.includes(source))
  assert.deepEqual(assessPricingReview(clinic, review, now), {
    id: clinic.id, state: 'reviewed', checkedOn: receipt.checkedOn, reviewedPriceCount: 1,
  })
  assert.equal(approvedCatalogueRecord(clinic, Date.parse('2026-12-24T00:00:00Z')), null)
})

test('the two recovered premises change only the postal text and point, not eligibility, prices or contact routes', () => {
  assert.equal(prior.length + 1, SOFIA_CATALOGUE.length)
  assert.deepEqual(prior.filter(row => row !== actual.get(row.id)).map(row => row.id).sort(),
    receipt.recovered.map(row => row.id).sort())
  for (const evidence of receipt.recovered) {
    const old = previous.get(evidence.id), row = actual.get(evidence.id)
    assert.equal(old.coordinates, null)
    assert.equal(row.address, evidence.address)
    assert.deepEqual({ ...row, address: old.address, coordinates: null }, old)
    assert.equal(pricingIdentity(row), pricingIdentity(old))
    assert.equal(Boolean(approvedCatalogueRecord(row, now)), Boolean(approvedCatalogueRecord(old, now)))
    assert.deepEqual(applyVerifiedAddressRecovery20261123([old]), [row])
    const wrong = { ...old, address: old.address + 'А' }
    assert.deepEqual(applyVerifiedAddressRecovery20261123([wrong]), [wrong])
    assert.throws(() => verifiedPriorCatalogue([{ ...row, address: wrong.address }]), /Unreviewed 23 Nov verified address delta/u)
  }
})

test('each postal point enables only the reviewed nearby public result and retains the correct external action', () => {
  for (const evidence of [receipt.new, ...receipt.recovered]) {
    const row = actual.get(evidence.id), { addressId, latitude, longitude } = evidence.point
    const coordinates = { latitude, longitude }
    assert.deepEqual(catalogueBoundCoordinates(row), { ...coordinates, addressId, source: OFFICIAL_SOFIA_SOURCE_URL,
      method: 'verified_official_address', sourceAddress: evidence.address, sourceCityCode: '68134',
      sourceNeighborhood: row.neighborhood, sourceWebsite: row.website, checkedOn: receipt.checkedOn,
      licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION })
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
    const intent = { cityCode: '68134', neighborhood: row.neighborhood, category: evidence.category, coordinates,
      radiusKm: 0.2, browse: true, searchV2: true }
    const [found] = rankCatalogueBusinesses([], publicRow(row, intent), intent)
    assert.equal(found.id, evidence.id)
    assert.equal(found.distanceKm, 0)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    assert.deepEqual(railExternalAction(found, now), row.id === clinic.id
      ? { kind: 'form', href: source } : { kind: 'phone', href: 'tel:' + previous.get(row.id).booking.phone })
    assert.deepEqual(publicRow(row, { ...intent, coordinates: { latitude: latitude + 0.03, longitude } }), [])
    assert.deepEqual(publicRow(row, { ...intent, neighborhood: 'Младост 4' }), [])
    if (row.id !== clinic.id) assert.deepEqual(publicRow(previous.get(row.id), intent), [])
  }
})

test('external dental details preserve the single sourced price and the practice preparation note in BG and EN', async () => {
  const forbidden = () => assert.fail('No live provider, authenticated backend, slots or booking')
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now,
    allowAttempt: () => true, findCatalogue: id => actual.get(id), readCataloguePhotos: async () => [], readPartner: forbidden })
  const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + clinic.id), clinic.id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  const [service] = business.details.services
  assert.equal(business.details.services.length, 1)
  assert.deepEqual(business.details.hours, [])
  assert.equal(serviceDisplayName(service, 'bg'), receipt.new.service)
  assert.equal(serviceDisplayName(service, 'en'), 'Initial Dental Examination')
  assert.deepEqual([service.price, service.currency, service.priceKind, service.priceSourceUrl, service.durationMin],
    [receipt.new.priceEur, 'EUR', 'fixed', source, null])
  assert.match(service.description, /панорамна снимка.+6 месеца/u)
  assert.match(publicProse(service.description, 'en', service.presentationEn?.description), /panoramic dental X-ray.+6 months/u)
  assert.deepEqual(railExternalAction(business, now), { kind: 'form', href: source })
  const image = serviceThumbnail(service, { business })
  assert.equal(image.src, receipt.new.illustrativeServicePhoto)
  assert.equal(image.source, 'illustrative')
})

test('the dated coverage replay touches exactly the reported cells without broadening the 30-premises target', () => {
  const expected = receipt.coverage
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: expected.targetPerQuarterCategory }))
  const cells = reports.map(report => new Map([...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area =>
    area.cells.map(cell => [area.name + ':' + cell.categoryId, cell]))))
  assert.deepEqual(reports.map(report => report.counts.totalTargetCells), [1750, 1750])
  assert.equal(expected.trackedCellsIncludingAdditionalNamedAreas, cells[1].size)
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), expected.approvedSofiaBusinesses)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), expected.premisesWithBoundCoordinates)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), expected.cellsAtLocatedTarget)
  assert.deepEqual(cells.map(report => [...report.values()].filter(cell => !cell.locatedCount).length), expected.emptyLocatedCells)
  assert.deepEqual([...cells[1]].filter(([key, cell]) =>
    cell.count !== cells[0].get(key).count || cell.locatedCount !== cells[0].get(key).locatedCount).map(([key]) => key).sort(),
  expected.affected.map(item => item.neighborhood + ':' + item.category).sort())
  for (const change of expected.affected) {
    const pair = cells.map(report => report.get(change.neighborhood + ':' + change.category))
    assert.deepEqual(pair.map(cell => cell.count), change.physical)
    assert.deepEqual(pair.map(cell => cell.locatedCount), change.located)
  }
})
