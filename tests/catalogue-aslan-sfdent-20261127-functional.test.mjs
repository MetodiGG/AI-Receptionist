import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applySfDentIzgrevPoint20261127 } from '../lib/discovery/catalogue-data/sf-dent-izgrev-point-20261127.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railDirections, railExternalAction, railServiceItems } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const date = day => Date.parse(`${day}T12:00:00Z`)
const now = date('2026-11-27'), afterPair = date('2026-12-30'), lastSingle = date('2027-01-02'), expired = date('2027-01-03')
const aslanId = 'sofia-aslan-poligona-block44', sfId = 'sofia-sf-dent', samaId = 'sofia-sama-pilates'
const found = id => SOFIA_CATALOGUE.find(row => row.id === id)
const [aslan, sf, sama] = [aslanId, sfId, samaId].map(found)
const rows = [aslan, sf, sama]
const aslanAddress = 'София, кв. Полигона, бл. 44, офис 3'
const programme = 'https://aslan-edu.com/probni-maturi-nvo-i-dzi-2026-2027/'
const grade7Form = 'https://aslan-edu.com/nvo-bel-mat-7-klas/'
const sfForm = 'https://superdoc.bg/lekar/sandi-festok', samaForm = 'https://www.samapilates.bg/en/login'
const subcategory = 'education-exam-preparation'
const point = { latitude: 42.66876, longitude: 23.34684 }
const sameOrigin = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }
let providerCalls = 0
const forbidden = () => {
  providerCalls++
  assert.fail('Read-only catalogue must not call a provider or native booking/slot adapter')
}
test.afterEach(() => assert.equal(providerCalls, 0))

async function search(input, at = now) {
  const handler = createDiscoveryHandler({
    config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'catalogue' }),
    sofiaOnly: true, allowAttempt: () => true, now: DateTime.fromMillis(at),
    readCatalogue: async () => rows, readInternal: async () => [], fetcher: forbidden,
    claimBudget: forbidden, readLinks: forbidden, readPartnerPlaces: forbidden,
    readBookablePlaces: forbidden, getBusiness: forbidden, getSlots: forbidden,
  })
  const response = await handler(new Request('https://gorez.test/api/public/discovery', {
    method: 'POST', headers: sameOrigin, body: JSON.stringify({ browse: true, cityCode: '68134', ...input }),
  }))
  assert.equal(response.status, 200)
  return (await response.json()).results
}

function details(id, at = now) {
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => at,
    allowAttempt: () => true, findCatalogue: found, readPartner: forbidden })
  return handler(new Request('https://gorez.test/api/public/discovery/business/' + id, { headers: sameOrigin }), id)
}

const cell = (coverage, neighborhood, category) => [...coverage.neighborhoods, ...coverage.additionalNamedAreas]
  .find(area => area.name === neighborhood).cells.find(item => item.categoryId === category)
const aslanFilter = { neighborhood: 'Полигона', category: 'education', subcategory }
const sampleExamPrices = entries => entries.map(entry => [entry.price, entry.priceUnit])

test('Aslan adds a verified physical office, not a geo result; SF Dent corrects only its own point', () => {
  assert.ok(rows.every(Boolean))
  const baseSf = { ...sf, coordinates: null }
  const beforeRows = SOFIA_CATALOGUE.filter(row => row.id !== aslanId).map(row => row.id === sfId ? baseSf : row)
  const [before, after] = [beforeRows, SOFIA_CATALOGUE].map(input => catalogueCoverageReport(input, { now, target: 30 }))
  const [oldAslan, newAslan] = [before, after].map(coverage => cell(coverage, 'Полигона', 'education'))
  assert.equal(newAslan.count - oldAslan.count, 1)
  assert.equal(newAslan.locatedCount, oldAslan.locatedCount)
  assert.ok(newAslan.businessIds.includes(aslanId))
  assert.ok(!newAslan.locatedBusinessIds.includes(aslanId))
  const [oldSf, newSf] = [before, after].map(coverage => cell(coverage, 'Изгрев', 'other'))
  assert.equal(newSf.count, oldSf.count)
  assert.equal(newSf.locatedCount - oldSf.locatedCount, 1)
  assert.ok(newSf.locatedBusinessIds.includes(sfId) && !oldSf.locatedBusinessIds.includes(sfId))
  assert.deepEqual(applySfDentIzgrevPoint20261127([baseSf]), [sf])
  assert.equal(pricingIdentity(sf), pricingIdentity(baseSf))
  assert.deepEqual(catalogueBoundCoordinates(sf), { ...point, method: 'first_party_coordinates',
    source: 'https://sfdent.eu/facts', sourceAddress: 'София, ж.к. Изгрев, ул. Елемаг 22' })
  assert.equal(catalogueBoundCoordinates({ ...sf, address: sf.address + ', друг обект' }), null)
  assert.deepEqual(applySfDentIzgrevPoint20261127([sama]), [sama])
  for (const changed of [{ ...baseSf, address: baseSf.address + 'А' },
    { ...baseSf, phone: '+359888111222' }, { ...baseSf, booking: { kind: 'form', url: 'https://sfdent.eu/' } }]) {
    assert.equal(applySfDentIzgrevPoint20261127([changed])[0], changed)
  }
})

test('the two Aslan totals match the current grade-7 form and expire separately without turning into unpriced offers', async () => {
  const review = BOOKING_PRICE_REVIEWS.find(item => item.id === aslanId)
  assert.deepEqual(assessPricingReview(aslan, review, now), { id: aslanId, state: 'reviewed', checkedOn: '2026-11-27', reviewedPriceCount: 2 })
  assert.equal(pricingIdentity(aslan), review.inventoryIdentity)
  assert.ok(aslan.services.every(service => matchesSubcategory(service, subcategory, aslan)))
  assert.deepEqual(aslan.services.map(({ price, durationMin }) => [price.amount, price.currency, price.kind, price.unit,
    price.sourceUrl, price.validUntil, durationMin]), [
    [50, 'EUR', 'fixed', 'един изпит', programme, '2027-01-02', 180],
    [90, 'EUR', 'fixed', 'два изпита общо', programme, '2026-12-29', undefined],
  ])
  assert.equal(aslan.verification.validUntil, '2027-01-02')
  assert.deepEqual(aslan.booking, { kind: 'form', url: grade7Form })
  assert.deepEqual(approvedCatalogueRecord(aslan, date('2026-12-29')).services.map(item => item.price.amount), [50, 90])
  for (const at of [afterPair, lastSingle]) {
    const response = await details(aslanId, at)
    assert.equal(response.status, 200)
    const business = (await response.json()).business
    assert.deepEqual(sampleExamPrices(business.details.services), [[50, 'един изпит']])
    const [card] = await search(aslanFilter, at)
    assert.deepEqual(sampleExamPrices(railServiceItems(card)), [[50, 'един изпит']])
  }
  assert.equal(approvedCatalogueRecord(aslan, expired), null)
  assert.equal(catalogueProfileView(aslan, { now: expired }), null)
  assert.equal((await details(aslanId, expired)).status, 404)
  assert.deepEqual(await search(aslanFilter, expired), [])
})

test('Aslan remains visible without a distance/route, and SF’s point is not applied to SAMA', async () => {
  const projections = {}
  for (const id of [aslanId, sfId, samaId]) {
    const read = await details(id)
    assert.equal(read.status, 200)
    projections[id] = (await read.json()).business
  }
  for (const locale of ['bg', 'en']) {
    const [aslanCard] = await search({ ...aslanFilter, locale })
    assert.equal(aslanCard.id, aslanId)
    assert.deepEqual(sampleExamPrices(railServiceItems(aslanCard)), [[50, 'един изпит'], [90, 'два изпита общо']])
    assert.deepEqual(aslanCard.availability, { status: 'external', slots: [] })
    assert.deepEqual(await search({ ...aslanFilter, locale, radiusKm: 1,
      coordinates: { latitude: 42.662231, longitude: 23.381532, consent: true } }), [])
    for (const view of [aslanCard, projections[aslanId], catalogueProfileView(aslan, { now })]) {
      assert.equal(view.source, 'catalogue')
      assert.equal(view.address, aslanAddress)
      assert.equal(view.distanceKm ?? null, null)
      assert.equal(view.coordinates, null)
      assert.equal(railDirections(view), null)
      assert.equal(businessMapUrl(view), null)
      assert.deepEqual(railExternalAction(view, now), { kind: 'form', href: grade7Form })
    }
    const bySfPoint = { coordinates: { ...point, consent: true }, radiusKm: 1, locale, neighborhood: 'Изгрев' }
    const sfResults = await search({ ...bySfPoint, category: 'other', subcategory: 'other-dental' })
    assert.deepEqual(sfResults.map(item => item.id), [sfId])
    assert.deepEqual(sfResults[0].availability, { status: 'external', slots: [] })
    for (const view of [sfResults[0], projections[sfId], catalogueProfileView(sf, { now })]) {
      assert.equal(view.phone, '+359876662785')
      assert.deepEqual(railExternalAction(view, now), { kind: 'form', href: sfForm })
      const route = new URL(businessDirectionsUrl(view))
      assert.equal(route.href, railDirections(view))
      assert.equal(route.searchParams.get('api'), '1')
      assert.equal(route.searchParams.get('destination'), `${point.latitude},${point.longitude}`)
      assert.equal(route.searchParams.get('destination_place_id'), null)
    }
    const samaScope = { neighborhood: 'Изгрев', category: 'fitness', subcategory: 'fitness-pilates', locale }
    const [samaCard] = await search(samaScope)
    assert.equal(samaCard.id, samaId)
    assert.deepEqual(railExternalAction(samaCard, now), { kind: 'form', href: samaForm })
    assert.equal(samaCard.coordinates, null)
    assert.equal(businessDirectionsUrl(samaCard), null)
    assert.equal(businessDirectionsUrl(projections[samaId]), null)
    assert.deepEqual(await search({ ...samaScope, ...bySfPoint }), [])
  }
})
