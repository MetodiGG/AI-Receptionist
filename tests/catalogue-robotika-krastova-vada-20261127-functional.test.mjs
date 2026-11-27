import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { classifyExpiredCatalogueOffers } from '../lib/discovery/catalogue-expired-offer-holds.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, auditCataloguePricing } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { ROBOTIKA_KRASTOVA_VADA_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-robotika-krastova-vada-20261127.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const now = Date.parse('2026-11-27T12:00:00Z'), expires = Date.parse('2026-12-11T00:00:00Z')
const id = 'sofia-robotika-krastova-vada-sasho-nikolov7'
const branch = SOFIA_CATALOGUE.find(row => row.id === id)
const address = 'София, кв. Кръстова вада, ул. Сашо Николов-Сладура 7, зад Smile Center'
const point = { latitude: 42.653782, longitude: 23.319496 }
const form = 'https://robotika.bg/register-course?group=0zem7woxl'
const review = ROBOTIKA_KRASTOVA_VADA_20261127_REVIEWS
let providerCalls = 0
const forbidden = () => {
  providerCalls += 1
  assert.fail('No booking, availability, profile, or geo provider may be called for an exact catalogue branch')
}
test.afterEach(() => assert.equal(providerCalls, 0))

const headers = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }
const relatedIds = [
  'sofia-robotika-serdika-todor-aleksandrov17',
  'sofia-robotika-mladost1-saharov25',
  'sofia-robotika-manastirski-flora1a',
]
const relatedBranches = SOFIA_CATALOGUE.filter(row => relatedIds.includes(row.id))

async function browse(time, locale, origin, query) {
  const handler = createDiscoveryHandler({
    config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'catalogue' }),
    sofiaOnly: true, now: DateTime.fromMillis(time), allowAttempt: () => true,
    readInternal: async () => [], readCatalogue: async () => [branch, ...relatedBranches],
    fetcher: forbidden, claimBudget: forbidden, readLinks: forbidden, readBookablePlaces: forbidden,
    readPartnerPlaces: forbidden, getBusiness: forbidden, getSlots: forbidden,
  })
  const response = await handler(new Request('https://gorez.test/api/public/discovery', {
    method: 'POST', headers, body: JSON.stringify({
      ...(query ? { query } : { browse: true }), category: 'education', subcategory: 'education-coding',
      neighborhood: 'Кръстова вада', cityCode: '68134', locale,
      ...(origin ? { coordinates: { ...origin, consent: true }, radiusKm: 1 } : {}),
    }),
  }))
  assert.equal(response.status, 200)
  return (await response.json()).results
}

const details = (time) => createPublicBusinessDetailsHandler({
  config: { enabled: true }, allowAttempt: () => true, now: () => time,
  findCatalogue: key => key === id ? branch : undefined, readPartner: forbidden,
})(new Request('https://gorez.test/api/public/discovery/business/' + id, { headers }), id)

test('a distinct Robotika branch supplies the first actual classroom and verified address in this cell', () => {
  assert.equal(relatedBranches.length, 3)
  assert.equal(relatedBranches.every(row => row.phone === branch.phone && row.address !== address && row.booking.url !== form), true)
  assert.equal(branch.coordinates.addressId, '111654')
  assert.equal(branch.coordinates.sourceAddress, address)
  assert.equal(branch.coordinates.sourceNeighborhood, 'Кръстова вада')
  assert.equal(catalogueBoundCoordinates(branch), branch.coordinates)
  assert.equal(catalogueBoundCoordinates({ ...branch, address: address.replace('7,', '5,') }), null)
  const cell = rows => catalogueCoverageReport(rows, { now, target: 30 }).neighborhoods
    .find(area => area.name === 'Кръстова вада').cells.find(entry => entry.categoryId === 'education')
  assert.deepEqual([cell(SOFIA_CATALOGUE.filter(r => r !== branch)), cell(SOFIA_CATALOGUE)]
    .map(row => [row.count, row.locatedCount]), [[0, 0], [1, 1]])
})

test('both languages and results/details/profile keep the verified address, €158 course price and external form', async () => {
  const response = await details(now)
  assert.equal(response.status, 200)
  const loaded = (await response.json()).business, profile = catalogueProfileView(branch, { now })
  for (const locale of ['bg', 'en']) {
    const [card] = await browse(now, locale, point)
    assert.equal(card.id, id)
    assert.equal(card.distanceKm, 0)
    assert.deepEqual(card.availability, { status: 'external', slots: [] })
    assert.deepEqual(await browse(now, locale, { latitude: 42.732, longitude: 23.4 }), [])
    assert.equal((await browse(now, locale, null, locale === 'en' ? 'Kubo' : 'роботика'))[0]?.id, id)
    for (const view of [card, loaded, profile]) {
      assert.equal(view.address, address)
      assert.equal(new URL(businessDirectionsUrl(view)).searchParams.get('destination'), '42.653782,23.319496')
      assert.equal(new URL(businessMapUrl(view)).searchParams.get('marker'), '42.653782,23.319496')
      assert.deepEqual(railExternalAction(view, now), { kind: 'form', href: form })
    }
  }
  const [service] = profile.details.services
  assert.deepEqual([service.price, service.priceKind, service.currency, service.durationMin, service.priceUnit],
    [158, 'fixed', 'EUR', null, 'цял курс · 7 занятия по 60 минути'])
  assert.equal(service.presentationEn.unit, 'full course · 7 classes of 60 minutes')
  assert.doesNotMatch([service.presentationEn.name, service.presentationEn.description].join(' '), /\p{Script=Cyrillic}/u)
  assert.match(service.presentationEn.description, /2 instalments of €86 each/u)
  assert.match(service.presentationEn.description, /18:30 on 11\.12\.2026/u)
  assert.deepEqual(businessCoverPhotoSources(profile), ['/business-cover-photos/go-nov27-robotika-kubo-cover-v1.webp'])
  assert.deepEqual([publicDetailServiceThumbnail(service, { business: profile }).src,
    publicDetailServiceThumbnail(service, { business: profile }).source], ['/service-photos/go-nov27-robotika-kubo-service-v1.webp', 'illustrative'])
})

test('the confirmed group is withheld before it starts and cannot be reproduced as an unpriced or altered offer', async () => {
  assert.equal(assessPricingReview(branch, review[0], now).state, 'reviewed')
  assert.equal(assessPricingReview(branch, review[0], now).reviewedPriceCount, 1)
  assert.ok(approvedCatalogueRecord(branch, expires - 1))
  assert.equal(approvedCatalogueRecord(branch, expires), null)
  assert.equal(catalogueProfileView(branch, { now: expires }), null)
  assert.deepEqual(await browse(expires, 'bg', point), [])
  assert.equal((await details(expires)).status, 404)
  const report = (row, at) => classifyExpiredCatalogueOffers(auditCataloguePricing([row], [], review, at), [row], review, at)
  assert.deepEqual(report(branch, expires).withheldExpiredOffers,
    [{ id, validThrough: '2026-12-10', reason: 'dated_kubo_cohort_enrolment_expired' }])
  assert.deepEqual(report(branch, expires).blocking, [])
  const altered = { ...branch, services: branch.services.map(row => ({ ...row, price: { ...row.price, amount: 86 } })) }
  assert.equal(report(altered, expires).blocking[0]?.id, id)
  assert.deepEqual(report(altered, expires).withheldExpiredOffers, [])
})
