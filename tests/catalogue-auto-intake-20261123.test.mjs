import test from 'node:test'
import assert from 'node:assert/strict'
import receipt from '../docs/catalogue-coverage/auto-intake-20261123.json' with { type: 'json' }
import { AUTO_INTAKE_20261123_RECORDS, AUTO_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-auto-intake-20261123.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { publicProse, serviceDisplayName } from '../lib/locale/public-content.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { AUTO_INTAKE_ID, autoAreaPriorCatalogue } from './catalogue-auto-20261123-scope.mjs'
import { verifiedPriorCatalogue } from './catalogue-verified-20261123-scope.mjs'

const SOFIA_CATALOGUE = verifiedPriorCatalogue(currentCatalogue)

const now = Date.parse('2026-11-23T12:00:00Z')
const record = SOFIA_CATALOGUE.find(row => row.id === AUTO_INTAKE_ID)
const [evidence] = receipt.businesses
const withoutAdmission = SOFIA_CATALOGUE.filter(row => row.id !== AUTO_INTAKE_ID)

test('the single new Gorublyane studio has an exact postal point, phone booking and independently reviewed starting price', () => {
  assert.equal(SOFIA_CATALOGUE.filter(row => row.id === AUTO_INTAKE_ID).length, 1)
  assert.deepEqual(record, validateCatalogue(AUTO_INTAKE_20261123_RECORDS)[0])
  assert.deepEqual(auditCatalogueBatch(withoutAdmission, AUTO_INTAKE_20261123_RECORDS, now).readyForReview, [record.id])
  const [review] = AUTO_INTAKE_20261123_REVIEWS
  assert.ok(BOOKING_PRICE_REVIEWS.includes(review))
  assert.equal(pricingIdentity(record), evidence.inventoryIdentity)
  assert.equal(assessPricingReview(record, review, now).state, 'reviewed')
  assert.equal(record.verification.checkedOn, receipt.publicationReviewDateUtc)
  const { addressId, latitude, longitude } = catalogueBoundCoordinates(record)
  assert.deepEqual({ addressId, latitude, longitude }, { addressId: '32182', latitude: 42.631683, longitude: 23.40813 })
  assert.equal(catalogueBoundCoordinates({ ...record, address: 'София, кв. Горубляне, ул. Пионерска 4' }), null)
  assert.deepEqual(record.services.map(({ price }) => [price.kind, price.amount, price.currency]), [['from', 190, 'EUR']])
  assert.equal(record.services[0].durationMin, undefined)
  assert.deepEqual(record.openingHours.days.at(-1), { weekday: 7, periods: [] })
})

test('nearby discovery and public/onboarding details share a qualified fee, illustrative photo and original phone action', async () => {
  const { latitude, longitude } = record.coordinates
  const intent = { cityCode: '68134', neighborhood: 'Горубляне', category: 'detailing', coordinates: { latitude, longitude }, radiusKm: 0.2, browse: true, searchV2: true }
  const [found] = normalizeCatalogueBusinesses([record], intent, { now })
  assert.equal(found.id, record.id)
  assert.deepEqual(found.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(found, now), { kind: 'phone', href: 'tel:+359898515911' })
  for (const patch of [{ neighborhood: 'Младост 4' }, { category: 'car_wash' }, { coordinates: { latitude: latitude + 0.03, longitude } }, { cityCode: '44238' }]) {
    assert.deepEqual(normalizeCatalogueBusinesses([record], { ...intent, ...patch }, { now }), [])
  }
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now, allowAttempt: () => true,
    findCatalogue: id => id === record.id ? record : null, readCataloguePhotos: async () => [], readPartner: () => assert.fail('Unexpected provider access') })
  const response = await handler(new Request(`https://gorez.test/api/public/discovery/business/${record.id}`), record.id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  const [service] = business.details.services
  assert.equal(service.priceKind, 'from'); assert.equal(service.price, 190); assert.equal(service.durationMin, null)
  assert.match(detailPriceLabel(service, 'bg'), /^от\s+190/u)
  assert.match(detailPriceLabel(service, 'en'), /^from\s+.*190/iu)
  assert.equal(serviceDisplayName(service, 'en'), evidence.english.name)
  assert.equal(publicProse(service.description, 'en', service.presentationEn.description), evidence.english.description)
  const photo = serviceThumbnail(service, { business })
  assert.equal(photo.src, evidence.image.asset)
  assert.equal(photo.source, 'illustrative')
  const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, record.id, { now, cityCode: '68134', locale: 'bg' })
  assert.equal(draft.business.neighborhood, 'Горубляне')
  assert.equal(draft.services.length, 1)
  assert.equal(draft.services[0].price, '190')
  assert.deepEqual(draft.services[0].price_details, { kind: 'from' })
  assert.equal(draft.services[0].duration_min, '')
})

test('exactly one new business adds the first located detailing result in Gorublyane', () => {
  const baseline = autoAreaPriorCatalogue(SOFIA_CATALOGUE)
  assert.equal(baseline.length + 1, SOFIA_CATALOGUE.length)
  assert.ok(!baseline.some(row => row.id === record.id))
  assert.throws(() => autoAreaPriorCatalogue([{ ...record, phone: '+359880000001' }]), /Unreviewed 23 Nov auto intake/u)
  const coverage = [withoutAdmission, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const cells = coverage.map(report => report.neighborhoods.find(area => area.name === 'Горубляне').cells.find(cell => cell.categoryId === 'detailing'))
  assert.deepEqual(cells.map(cell => cell.count), [0, 1])
  assert.deepEqual(cells.map(cell => cell.locatedCount), [0, 1])
  assert.deepEqual(coverage.map(report => report.counts.approvedBusinesses), receipt.coverage.approvedSofiaBusinesses)
  assert.deepEqual(coverage.map(report => report.counts.premisesWithBoundCoordinates), receipt.coverage.premisesWithBoundCoordinates)
})
