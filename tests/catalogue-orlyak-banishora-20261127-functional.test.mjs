import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railDirections, railExternalAction, railServiceItems } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { serviceDisplayName } from '../lib/locale/public-content.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const now = Date.parse('2026-11-27T12:00:00Z'), expired = Date.parse('2026-12-28T12:00:00Z')
const id = 'sofia-orlyak-sport-banishora-orlyak24a', skId = 'sofia-sk-studio-banishora-gymnastics'
const address = 'София, ж.к. Банишора, ул. Орляк 24А', phone = '+359878515130'
const point = { latitude: 42.7128963, longitude: 23.3091318 }
const label = 'Да Дао за деца · групова тренировка по бойни изкуства'
const en = 'Da Dao for children · group martial arts class'
const subcategories = ['fitness-martial-arts', 'fitness-group-training']
const row = SOFIA_CATALOGUE.find(item => item.id === id)
const review = BOOKING_PRICE_REVIEWS.find(item => item.id === id)
const headers = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }
let externalCalls = 0
const forbidden = () => {
  externalCalls++
  assert.fail('Catalogue reads must not retrieve provider availability, native slots, or booking data')
}
test.afterEach(() => assert.equal(externalCalls, 0))

function searchHandler(at = now) {
  return createDiscoveryHandler({
    config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'catalogue' }),
    sofiaOnly: true, now: DateTime.fromMillis(at), allowAttempt: () => true,
    readInternal: async () => [], readCatalogue: async () => [row], fetcher: forbidden,
    claimBudget: forbidden, readLinks: forbidden, readBookablePlaces: forbidden,
    readPartnerPlaces: forbidden, getBusiness: forbidden, getSlots: forbidden,
  })
}

async function search(input, at = now) {
  const result = await searchHandler(at)(new Request('https://gorez.test/api/public/discovery', {
    method: 'POST', headers,
    body: JSON.stringify({ browse: true, cityCode: '68134', neighborhood: 'Банишора', category: 'fitness', ...input }),
  }))
  assert.equal(result.status, 200)
  return (await result.json()).results
}

function details(at = now) {
  return createPublicBusinessDetailsHandler({
    config: { enabled: true }, now: () => at, allowAttempt: () => true,
    findCatalogue: key => key === id ? row : null, readPartner: forbidden,
  })(new Request('https://gorez.test/api/public/discovery/business/' + id, { headers }), id)
}

function fitnessCell(records) {
  const report = catalogueCoverageReport(records, { now, target: 30 })
  return report.neighborhoods.find(area => area.name === 'Банишора').cells.find(cell => cell.categoryId === 'fitness')
}

test('Orlyak supplies one new located premises without attributing its point to the older gymnastics studio', () => {
  const checkedIds = new Set([id, skId])
  const exactPair = SOFIA_CATALOGUE.filter(item => checkedIds.has(item.id))
  const before = fitnessCell(exactPair.filter(item => item.id !== id))
  const after = fitnessCell(exactPair)
  assert.deepEqual([before.count, after.count], [1, 2])
  assert.deepEqual(after.locatedBusinessIds.filter(key => !before.locatedBusinessIds.includes(key)), [id])
  const live = fitnessCell(SOFIA_CATALOGUE)
  assert.ok(live.businessIds.includes(id) && live.locatedBusinessIds.includes(id))
  assert.ok(live.businessIds.includes(skId))
  assert.equal(row.address, address)
  const bound = catalogueBoundCoordinates(row)
  assert.deepEqual(bound, { ...point, method: 'first_party_coordinates', source: 'https://orlyak.com/?page_id=43', sourceAddress: address })
  assert.equal(catalogueBoundCoordinates({ ...row, address: address.replace('24А', '24') }), null)
  assert.equal(catalogueBoundCoordinates({ ...row, locationKind: 'service_area' }), null)
})

test('the named children’s group is reviewed without a tariff, duration, or available slot', async () => {
  assert.equal(row.locationKind, 'premises')
  assert.deepEqual(row.booking, { kind: 'phone', phone })
  assert.equal(row.openingHours, undefined)
  assert.equal(row.services.length, 1)
  const [service] = row.services
  assert.equal(service.name, label)
  assert.equal(service.appointmentModel, 'group_reservation')
  assert.equal(service.price, undefined)
  assert.equal(service.durationMin, undefined)
  assert.ok(subcategories.every(key => matchesSubcategory(service, key, row)))
  assert.ok(!matchesSubcategory(service, 'fitness-personal-training', row))
  assert.deepEqual(assessPricingReview(row, review, now), {
    id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-27', reviewedPriceCount: 0,
  })
  assert.equal(assessPricingReview({ ...row, services: [{ ...service, name: 'Different group' }] }, review, now).reason,
    'reviewed_service_inventory_changed')
  assert.equal(approvedCatalogueRecord(row, expired), null)
  assert.equal(catalogueProfileView(row, { now: expired }), null)
  assert.equal((await details(expired)).status, 404)
  assert.deepEqual(await search({ subcategory: subcategories[0], locale: 'bg' }, expired), [])
})

test('catalogue search, details, map actions and standalone view keep the exact phone and pin in both locales', async () => {
  const [base] = await search({ locale: 'bg', coordinates: { ...point, consent: true }, radiusKm: 1 })
  assert.equal(base.id, id)
  const distant = { latitude: 42.766, longitude: 23.397, consent: true }
  assert.deepEqual(await search({ subcategory: subcategories[0], coordinates: distant, radiusKm: 1, locale: 'bg' }), [])
  assert.deepEqual(await search({ subcategory: 'fitness-personal-training', locale: 'bg' }), [])
  const opened = await details()
  assert.equal(opened.status, 200)
  const detailBusiness = (await opened.json()).business
  const profile = catalogueProfileView(row, { now })
  for (const locale of ['bg', 'en']) {
    for (const subcategory of subcategories) {
      const hits = await search({ subcategory, coordinates: { ...point, consent: true }, radiusKm: 1, locale })
      assert.deepEqual(hits.map(hit => hit.id), [id])
      const [card] = hits
      assert.deepEqual(card.availability, { status: 'external', slots: [] })
      assert.deepEqual(railServiceItems(card).map(service => [service.name, service.price]), [[label, null]])
      for (const business of [card, detailBusiness, profile]) {
        assert.equal(business.source, 'catalogue')
        assert.equal(business.address, address)
        assert.deepEqual(railExternalAction(business, now), { kind: 'phone', href: 'tel:' + phone })
        const route = new URL(businessDirectionsUrl(business))
        assert.equal(route.href, railDirections(business))
        assert.equal(route.origin, 'https://www.google.com')
        assert.equal(route.searchParams.get('api'), '1')
        assert.equal(route.searchParams.get('destination'), `${point.latitude},${point.longitude}`)
        assert.equal(route.searchParams.get('destination_place_id'), null)
      }
    }
    for (const view of [detailBusiness, profile]) {
      assert.deepEqual(view.details.hours, [])
      assert.deepEqual(view.details.services.map(item => [serviceDisplayName(item, locale), item.price, item.durationMin]),
        [[locale === 'bg' ? label : en, null, null]])
      assert.doesNotMatch(view.details.services[0].presentationEn.description, /\p{Script=Cyrillic}/u)
    }
  }
})
