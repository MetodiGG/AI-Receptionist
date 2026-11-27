import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import legacyIntake from '../lib/discovery/catalogue-data/coverage-expansion-v4.mjs'
import { applyGotseMladostVisitPoints20261127 } from '../lib/discovery/catalogue-data/gotse-mladost-visit-points-20261127.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../lib/discovery/official-sofia-address-source.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction, railServiceItems } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const mallId = 'sofia-thai-spa-the-mall', barberId = 'sofia-a-tu-estilo-lyulin3-block386', ecruId = 'sofia-ecru-lyulin386'
const [mall, barber, ecru] = [mallId, barberId, ecruId].map(id => SOFIA_CATALOGUE.find(row => row.id === id))
const mallAddress = 'София, кв. Полигона, бул. Цариградско шосе 115З, The Mall, ет. -2, ляв вход'
const mallPoint = { latitude: 42.660230, longitude: 23.382686 }
const oldPoint = { latitude: 42.663956435978896, longitude: 23.37883487997901 }
const mallForm = 'https://www.fresha.com/bg/a/the-mall-tay-spa-sofia-boulevard-tsarigradsko-shose-115-4g6mhoep?pId=113178'
const barberForm = 'https://www.atuestilo.eu/'
const mallScope = { neighborhood: 'Полигона', category: 'health', subcategory: 'health-massage' }
const barberScope = { neighborhood: 'Люлин 3', category: 'barber', subcategory: 'barber-haircut' }
const headers = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }
let providerCalls = 0
const forbidden = () => {
  providerCalls++
  assert.fail('Public catalogue reads must not fetch provider details, availability or booking data')
}
test.afterEach(() => assert.equal(providerCalls, 0))

const handler = createDiscoveryHandler({
  config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'catalogue' }),
  sofiaOnly: true, now: DateTime.fromMillis(now), allowAttempt: () => true, readInternal: async () => [],
  readCatalogue: async () => [mall, barber, ecru], fetcher: forbidden, claimBudget: forbidden,
  readLinks: forbidden, readBookablePlaces: forbidden, readPartnerPlaces: forbidden, getBusiness: forbidden, getSlots: forbidden,
})
const details = createPublicBusinessDetailsHandler({ config: { enabled: true }, allowAttempt: () => true,
  now: () => now, findCatalogue: id => [mall, barber, ecru].find(row => row.id === id), readPartner: forbidden })

async function browse(input, coordinates) {
  const response = await handler(new Request('https://gorez.test/api/public/discovery', { method: 'POST', headers,
    body: JSON.stringify({ browse: true, cityCode: '68134', ...input,
      ...(coordinates ? { coordinates: { ...coordinates, consent: true }, radiusKm: 1 } : {}) }),
  }))
  assert.equal(response.status, 200)
  return (await response.json()).results
}

async function readBusiness(id) {
  const response = await details(new Request('https://gorez.test/api/public/discovery/business/' + id, { headers }), id)
  assert.equal(response.status, 200)
  return (await response.json()).business
}

test('THAI SPA retains its historic service inventory and booking, but only the sourced 115З mall point survives', () => {
  const [historical] = validateCatalogue([legacyIntake.find(row => row.id === mallId)])
  const old = { ...historical, coordinates: { ...mall.coordinates, ...oldPoint, addressId: '125239',
    sourceAddress: historical.address, sourceNeighborhood: null } }
  assert.equal(historical.neighborhood, null)
  assert.equal(historical.address, 'София, бул. Цариградско шосе 115, ет. -2, The Mall')
  assert.equal(mall.address, mallAddress)
  assert.equal(mall.neighborhood, 'Полигона')
  assert.deepEqual(mall.booking, { kind: 'form', url: mallForm })
  assert.equal(pricingIdentity(mall), pricingIdentity(historical))
  assert.deepEqual(mall, { ...historical, address: mallAddress, neighborhood: 'Полигона', coordinates: mall.coordinates })
  assert.deepEqual(applyGotseMladostVisitPoints20261127([old]), [mall])
  const wrongBranch = { ...old, booking: { kind: 'form', url: 'https://thaispa.bg/' } }
  assert.deepEqual(applyGotseMladostVisitPoints20261127([wrongBranch]), [{...wrongBranch,coordinates:null}])
  assert.deepEqual(catalogueBoundCoordinates(mall), { ...mallPoint, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: mallAddress, sourceCityCode: '68134', sourceNeighborhood: 'Полигона',
    sourceWebsite: 'https://thaispa.bg/', checkedOn: '2026-11-27', addressId: '100187', licence: 'CC-BY-4.0',
    attribution: OFFICIAL_SOFIA_ATTRIBUTION })
  const mismatched = { ...mall, coordinates: old.coordinates }
  assert.equal(catalogueBoundCoordinates(mismatched), null)
  assert.equal(catalogueProfileView(mismatched, { now }), null)
  for (const coordinates of [{ ...mall.coordinates, ...oldPoint },
    { ...mall.coordinates, latitude: 42.663956, longitude: 23.378835 }]) {
    const stale = { ...mall, coordinates }
    const [sanitized] = applyGotseMladostVisitPoints20261127([stale])
    assert.equal(catalogueBoundCoordinates(sanitized), null)
    const profile = catalogueProfileView(sanitized, { now })
    assert.equal(profile.coordinates, null)
    assert.equal(businessDirectionsUrl(profile), null)
    assert.deepEqual(railExternalAction(profile, now), { kind: 'form', href: mallForm })
  }
  assert.equal(catalogueBoundCoordinates({ ...mall, address: mallAddress.replace('115З', '115') }), null)
})

test('A Tu Estilo and Ecru keep separate identities, bookings, and inventories at the shared block', () => {
  assert.equal(barber.address, 'София, ж.к. Люлин 3, бл. 386, ул. Георги Дражев')
  assert.equal(barber.neighborhood, 'Люлин 3')
  assert.equal(barber.phone, '+359885225558')
  assert.deepEqual(barber.booking, { kind: 'form', url: barberForm })
  assert.deepEqual(ecru.booking, { kind: 'phone', phone: '+359897728146' })
  assert.equal(catalogueBoundCoordinates(barber), null)
  assert.equal(catalogueBoundCoordinates(ecru), null)
  assert.deepEqual(barber.services.map(({ price }) => [price.amount, price.currency, price.kind, price.unit]), [
    [20, 'EUR', 'fixed', 'подстригване'], [30, 'EUR', 'fixed', 'общо за подстригване и брада'],
  ])
  const assessed = assessPricingReview(barber, BOOKING_PRICE_REVIEWS.find(receipt => receipt.id === barberId), now)
  assert.equal(assessed.state, 'reviewed')
  assert.equal(assessed.reviewedPriceCount, 2)
  assert.equal(approvedCatalogueRecord(barber, Date.parse('2026-12-28T12:00:00Z')), null)
  const cell = rows => catalogueCoverageReport(rows, { now, target: 30 }).neighborhoods.find(area => area.name === 'Люлин 3')
    .cells.find(item => item.categoryId === 'barber')
  const [before, after] = [cell(SOFIA_CATALOGUE.filter(row => row.id !== barberId)), cell(SOFIA_CATALOGUE)]
  assert.equal(after.count - before.count, 1)
  assert.equal(after.locatedCount, before.locatedCount)
})

test('BG and EN browse/detail routes reach only the verified mall and do not guess a point for either Lyulin salon', async () => {
  const mallDetails = await readBusiness(mallId), barberDetails = await readBusiness(barberId)
  const mallProfile = catalogueProfileView(mall, { now }), barberProfile = catalogueProfileView(barber, { now })
  for (const locale of ['bg', 'en']) {
    const [mallCard] = await browse({ ...mallScope, locale }, mallPoint)
    assert.equal(mallCard.id, mallId)
    assert.equal(mallCard.distanceKm, 0)
    assert.deepEqual(mallCard.availability, { status: 'external', slots: [] })
    assert.deepEqual(await browse({ ...mallScope, locale }, { latitude: 42.766, longitude: 23.396 }), [])
    for (const view of [mallCard, mallDetails, mallProfile]) {
      assert.equal(view.address, mallAddress)
      assert.deepEqual(railExternalAction(view, now), { kind: 'form', href: mallForm })
      assert.equal(new URL(businessDirectionsUrl(view)).searchParams.get('destination'), '42.66023,23.382686')
      assert.equal(new URL(businessMapUrl(view)).searchParams.get('marker'), '42.66023,23.382686')
    }
    const hits = await browse({ ...barberScope, locale })
    assert.deepEqual(new Set(hits.map(row => row.id)), new Set([barberId, ecruId]))
    const barberCard = hits.find(row => row.id === barberId), ecruCard = hits.find(row => row.id === ecruId)
    assert.deepEqual(barberCard.availability, { status: 'external', slots: [] })
    assert.deepEqual(railServiceItems(barberCard).map(service => service.price).sort((a, b) => a - b), [20, 30])
    assert.deepEqual(railServiceItems(ecruCard).map(service => service.price), [9.71])
    assert.deepEqual(railExternalAction(ecruCard, now), { kind: 'phone', href: 'tel:+359897728146' })
    assert.deepEqual(await browse({ ...barberScope, locale }, { latitude: 42.721, longitude: 23.254 }), [])
    for (const view of [barberCard, barberDetails, barberProfile]) {
      assert.equal(view.coordinates, null)
      assert.equal(view.distanceKm ?? null, null)
      assert.equal(businessDirectionsUrl(view), null)
      assert.deepEqual(railExternalAction(view, now), { kind: 'form', href: barberForm })
    }
  }
})
