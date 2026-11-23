import assert from 'node:assert/strict'
import test from 'node:test'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { serviceDisplayName, publicProse } from '../lib/locale/public-content.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import evidence from '../docs/catalogue-coverage/education-intake-pavlovo-20261123.json' with { type: 'json' }

const now = Date.parse('2026-11-23T12:00:00Z')
const { id, address, neighborhood } = evidence.newBusiness
const row = SOFIA_CATALOGUE.find(business => business.id === id)

test('one checked education venue has a real phone path and no invented regular price, period, or duration', () => {
  assert.equal(PUBLIC_CATALOGUE.filter(business => business.id === id).length, 1)
  assert.equal(row.address, address); assert.equal(row.neighborhood, neighborhood)
  assert.equal(row.locationKind, 'premises'); assert.equal(row.cityCode, '68134')
  assert.deepEqual(row.booking, { kind: 'phone', phone: '+359888250355' })
  assert.equal(pricingIdentity(row), evidence.newBusiness.pricingIdentity)
  const review = BOOKING_PRICE_REVIEWS.find(item => item.id === id)
  assert.equal(assessPricingReview(row, review, now).state, 'service_reviewed')
  assert.equal(row.services.length, 1); assert.equal(row.services[0].price, undefined)
  assert.equal(row.services[0].durationMin, undefined); assert.equal(row.openingHours, undefined)
  assert.match(row.services[0].description, /групи за 7–9 и 9–12.*пробно посещение е отделно/u)
  const draft = catalogueOnboardingDetail(PUBLIC_CATALOGUE, id, { now, cityCode: '68134', locale: 'bg' })
  assert.equal(draft.business.neighborhood, neighborhood)
  assert.equal(draft.services[0].price, ''); assert.equal(draft.services[0].duration_min, '')
  assert.ok(evidence.held.every(hold => !PUBLIC_CATALOGUE.some(business => business.name === hold.name)))
})

test('nearby results use exact official 12В, honour quarter/category/radius, and keep the telephone action', () => {
  const { addressId, latitude, longitude } = catalogueBoundCoordinates(row)
  assert.deepEqual({ addressId, latitude, longitude }, { addressId: '103070', latitude: 42.660216, longitude: 23.267109 })
  assert.equal(catalogueBoundCoordinates({ ...row, address: address.replace('12В', '12А') }), null)
  const intent = { cityCode: '68134', neighborhood, category: 'education', browse: true, searchV2: true, radiusKm: 0.2,
    coordinates: { latitude, longitude } }
  const [business] = normalizeCatalogueBusinesses([row], intent, { now })
  assert.equal(business.id, id); assert.deepEqual(railExternalAction(business, now), { kind: 'phone', href: 'tel:+359888250355' })
  for (const patch of [{ neighborhood: 'Бъкстон' }, { category: 'fitness' }, { cityCode: '44238' },
    { coordinates: { latitude: latitude + 0.03, longitude } }]) {
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, ...patch }, { now }), [])
  }
})

test('public details match the checked programme, its illustrative photo and the exact bilingual qualification', async () => {
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now, allowAttempt: () => true,
    findCatalogue: lookup => lookup === id ? row : null, readCataloguePhotos: async () => [],
    readPartner: () => assert.fail('Unexpected partner read') })
  const response = await handler(new Request(`https://gorez.test/api/public/discovery/business/${id}`), id)
  assert.equal(response.status, 200)
  const { business } = await response.json(), [service] = business.details.services
  assert.equal(service.price, null)
  assert.equal(serviceDisplayName(service, 'en'), 'Group acting classes in English for children')
  assert.match(publicProse(service.description, 'en', service.presentationEn.description), /ages 7–9 and 9–12.*free trial is separate from the regular classes/u)
  for (const locale of ['bg', 'en']) {
    const image = serviceThumbnail(service, { business, locale })
    assert.equal(image.src, evidence.newBusiness.illustration); assert.equal(image.source, 'illustrative')
  }
})

test('the new premises fills exactly the first physical and nearby education gap in Pavlovo', () => {
  const reports = [SOFIA_CATALOGUE.filter(business => business.id !== id), SOFIA_CATALOGUE]
    .map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const cells = reports.map(report => report.neighborhoods.find(area => area.name === neighborhood).cells.find(cell => cell.categoryId === 'education'))
  assert.deepEqual(cells.map(cell => cell.count), evidence.newBusiness.coverage.physical)
  assert.deepEqual(cells.map(cell => cell.locatedCount), evidence.newBusiness.coverage.located)
  assert.ok(cells[1].locatedBusinessIds.includes(id))
})
