import assert from 'node:assert/strict'
import test from 'node:test'
import receipt from '../docs/catalogue-coverage/mikron-intake-20261123.json' with { type: 'json' }
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { MIKRON_INTAKE_20261123_RECORDS, MIKRON_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-mikron-20261123.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { publicProse, serviceDisplayName } from '../lib/locale/public-content.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { manualIntakeIdentity } from '../scripts/catalogue-manual-intake-review.mjs'

const evidence = receipt.business
const { id } = evidence
const now = Date.parse('2026-11-23T12:00:00Z')
const bookingUrl = 'https://reservation.mikrondocev.com/bg'
const picture = '/service-photos/sx-auto-sunroof-inspection-v1.webp'
const record = SOFIA_CATALOGUE.find(row => row.id === id)
const expectedPoint = { latitude: 42.658608, longitude: 23.239234 }
const serviceIntent = { cityCode: '68134', neighborhood: 'Княжево', category: 'auto_repair', coordinates: expectedPoint,
  radiusKm: 0.2, browse: true, searchV2: true }

test('Mikron admits one Knyazhevo workshop and one exact owner-reviewed inspection fee', () => {
  assert.equal(PUBLIC_CATALOGUE.filter(row => row.id === id).length, 1)
  assert.deepEqual(record, validateCatalogue(MIKRON_INTAKE_20261123_RECORDS)[0])
  assert.equal(manualIntakeIdentity(record), evidence.normalizedRecordSha256)
  const [review] = MIKRON_INTAKE_20261123_REVIEWS
  assert.equal(BOOKING_PRICE_REVIEWS.filter(item => item.id === id).length, 1)
  assert.deepEqual(BOOKING_PRICE_REVIEWS.find(item => item.id === id), review)
  assert.equal(pricingIdentity(record), evidence.inventoryIdentity)
  const assessed = assessPricingReview(record, review, now)
  assert.equal(assessed.state, 'reviewed')
  assert.equal(assessed.reviewedPriceCount, 1)
  assert.deepEqual(record.booking, { kind: 'form', url: bookingUrl })
  assert.equal(record.verification.booking.url, bookingUrl)
  const [service] = record.services
  assert.equal(record.services.length, 1)
  assert.equal(service.name, evidence.service.name)
  assert.deepEqual(service.price, { amount: 40, currency: 'EUR', kind: 'fixed', sourceUrl: bookingUrl,
    checkedOn: '2026-11-23', validUntil: '2026-12-23' })
  assert.match(service.description, /около 30 минути.*ремонтът се оферират отделно.*се приспада, ако ремонтът бъде извършен/u)
  assert.equal(service.durationMin, undefined)
  assert.equal(assessPricingReview({ ...record, booking: { kind: 'form', url: record.website } }, review, now).reason,
    'business_or_booking_target_changed')
  const changedFeeTerms = { ...record, services: [{ ...service, description: 'Ремонтът е включен.' }] }
  assert.equal(assessPricingReview(changedFeeTerms, review, now).reason, 'reviewed_service_inventory_changed')
})

test('nearby discovery binds only the official Knyazhevo postal point and opens the external request without availability', () => {
  assert.equal(record.address, 'София, кв. Княжево, бул. Цар Борис III 298')
  const bound = catalogueBoundCoordinates(record)
  assert.deepEqual({ latitude: bound.latitude, longitude: bound.longitude }, expectedPoint)
  assert.deepEqual([bound.addressId, bound.method, bound.sourceNeighborhood],
    ['5509', 'verified_official_address', 'Княжево'])
  for (const patch of [{ neighborhood: 'Карпузица' }, { address: record.address + 'А' }, { website: 'https://gorez.test/' }]) {
    assert.equal(catalogueBoundCoordinates({ ...record, ...patch }), null)
  }
  const [shown] = normalizeCatalogueBusinesses([record], serviceIntent, { now })
  assert.equal(shown.id, id)
  assert.deepEqual(shown.coordinates, expectedPoint)
  assert.deepEqual(shown.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(shown, now), { kind: 'form', href: bookingUrl })
  for (const patch of [{ neighborhood: 'Карпузица' }, { category: 'detailing' },
    { coordinates: { ...expectedPoint, latitude: expectedPoint.latitude + 0.03 } }]) {
    assert.deepEqual(normalizeCatalogueBusinesses([record], { ...serviceIntent, ...patch }, { now }), [])
  }
  assert.deepEqual(normalizeCatalogueBusinesses([record], serviceIntent, { now: Date.parse('2026-12-24T12:00:00Z') }), [])
})

test('the public and onboarding projections preserve the fee conditions, both languages and the inspection illustration', async () => {
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now, allowAttempt: () => true,
    findCatalogue: lookup => lookup === id ? record : null, readCataloguePhotos: async () => [],
    readPartner: () => assert.fail('Static catalogue details must not attempt to use native partner access') })
  const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  assert.deepEqual(business.coordinates, expectedPoint)
  assert.deepEqual(railExternalAction(business, now), { kind: 'form', href: bookingUrl })
  const [service] = business.details.services
  assert.equal(business.details.services.length, 1)
  assert.deepEqual([service.price, service.priceKind, service.currency, service.priceSourceUrl, service.durationMin],
    [40, 'fixed', 'EUR', bookingUrl, null])
  assert.match(detailPriceLabel(service, 'bg'), /40.*€/u)
  assert.match(detailPriceLabel(service, 'en'), /(?:€.*40|40.*€)/u)
  assert.equal(serviceDisplayName(service, 'bg'), evidence.service.name)
  assert.equal(serviceDisplayName(service, 'en'), evidence.english.name)
  assert.equal(publicProse(service.description, 'en', service.presentationEn.description), evidence.english.description)
  assert.match(evidence.english.description, /quoted separately.*credited toward the repair if it is carried out/u)
  for (const locale of ['bg', 'en']) {
    const thumbnail = serviceThumbnail(service, { business, locale })
    assert.deepEqual([thumbnail.src, thumbnail.source], [picture, 'illustrative'])
  }
  const draft = catalogueOnboardingDetail(PUBLIC_CATALOGUE, id, { now, cityCode: '68134', locale: 'bg' })
  assert.equal(draft.business.neighborhood, 'Княжево')
  assert.equal(draft.services.length, 1)
  assert.equal(draft.services[0].price, '40')
  assert.equal(draft.services[0].duration_min, '')
})

test('Mikron contributes exactly one physical and located option only in Knyazhevo auto repair', () => {
  const before = SOFIA_CATALOGUE.filter(row => row.id !== id)
  const reports = [before, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const lookup = (report, neighborhood) => [...report.neighborhoods, ...report.additionalNamedAreas]
    .find(area => area.name === neighborhood).cells.find(cell => cell.categoryId === 'auto_repair')
  const cells = reports.map(report => lookup(report, 'Княжево'))
  assert.deepEqual(cells.map(cell => cell.count), receipt.isolatedCoverageDelta.physical)
  assert.deepEqual(cells.map(cell => cell.locatedCount), receipt.isolatedCoverageDelta.located)
  assert.ok(cells[1].locatedBusinessIds.includes(id))
  assert.deepEqual(lookup(reports[0], 'Карпузица'), lookup(reports[1], 'Карпузица'))
})
