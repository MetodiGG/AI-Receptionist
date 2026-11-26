import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import {
  catalogueProfileMetadata, catalogueProfileSitemapEntries, catalogueProfileStructuredData, catalogueProfileView,
} from '../lib/catalogue-profile.mjs'
import { catalogueBusinessDetails, currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { discoverySuggestions } from '../lib/discovery/suggestions.mjs'

const stillCurrent = Date.parse('2026-11-25T23:59:59.999Z')
const expired = Date.parse('2026-11-26T00:00:00Z')
const site = 'https://gorez.co'
const ownerTariff = 'https://example.com/current-tariff'
const promotion = { name: 'Limited November reformer promotion', category: 'fitness', appointmentModel: 'individual_training',
  description: 'A November-only price of 16 € for the introductory appointment.',
  price: { amount: 16, currency: 'EUR', kind: 'fixed', sourceUrl: ownerTariff, checkedOn: '2026-11-06', validUntil: '2026-11-25' } }
const regular = { name: 'Regular private reformer session', category: 'fitness', appointmentModel: 'individual_training',
  price: { amount: 44, currency: 'EUR', kind: 'fixed', sourceUrl: ownerTariff, checkedOn: '2026-11-08' } }
const noTariff = { name: 'Verified personal training by appointment', category: 'fitness', appointmentModel: 'individual_training' }
function rawFixture(services = [promotion, regular, noTariff]) {
  return { id: 'sofia-offer-freshness-test', name: 'Independent Branch Fixture', category: 'fitness', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Примерна 10', locationKind: 'premises', coordinates: null, website: 'https://example.com/', phone: '+359888888888',
    booking: { kind: 'phone', phone: '+359888888888' },
    verification: { status: 'approved', checkedOn: '2026-11-05', validUntil: '2026-12-15',
      booking: { url: 'https://example.com/book', excerpt: 'Phone appointments for personal training' }, contact: 'https://example.com/contact' },
    services: structuredClone(services) }
}
const openRequest = id => new Request(`${site}/api/public/discovery/business/${id}`, {
  headers: { 'sec-fetch-site': 'same-origin', origin: site },
})
const servicesOf = value => value.map(service => service.name)
const intent = { browse: true, category: 'fitness', cityCode: '68134', requirements: [] }

test('complete catalogue offer expires at the UTC date boundary without losing current or genuinely unpriced siblings', () => {
  const [record] = validateCatalogue([rawFixture()])
  const original = JSON.stringify(record)
  const before = approvedCatalogueRecord(record, stillCurrent)
  const after = approvedCatalogueRecord(record, expired)
  assert.deepEqual(servicesOf(before.services), [promotion.name, regular.name, noTariff.name])
  assert.deepEqual(servicesOf(after.services), [regular.name, noTariff.name])
  assert.equal(approvedCatalogueRecord(record, expired + 60000), after)
  assert.equal(approvedCatalogueRecord(record, stillCurrent), before)
  assert.equal(JSON.stringify(record), original)
  assert.ok(Object.isFrozen(after.services))

  const firstSearch = normalizeCatalogueBusinesses([record], intent, { now: stillCurrent })[0]
  const nextSearch = normalizeCatalogueBusinesses([record], intent, { now: expired })[0]
  for (const service of nextSearch.services) {
    assert.equal(service.id, firstSearch.services.find(item => item.name === service.name).id)
  }
  assert.deepEqual(nextSearch.publicServiceNames, [regular.name, noTariff.name])
  assert.deepEqual(nextSearch.details.services.map(service => service.price), [44, null])
  assert.doesNotMatch(JSON.stringify(nextSearch), /November-only|16 €|Limited November/)
  assert.deepEqual(servicesOf(catalogueBusinessDetails(record, expired).services), [regular.name, noTariff.name])
})

test('safe source and valid calendar evidence are required for first-party facts', () => {
  const now = Date.parse('2026-11-26T12:00:00Z')
  const fact = { sourceUrl: ownerTariff, checkedOn: '2026-08-28', validUntil: '2026-11-26' }
  assert.equal(currentPublishedFact(fact, now), true, 'review is exactly ninety days old')
  for (const change of [
    { sourceUrl: 'https://127.0.0.1/' }, { checkedOn: '2026-08-27' }, { checkedOn: '2026-11-27' },
    { checkedOn: '2026-09-31' }, { validUntil: '2027-02-30' }, { validUntil: null }, { validUntil: '2026-11-25' },
  ]) assert.equal(currentPublishedFact({ ...fact, ...change }, now), false)
  assert.equal(currentPublishedFact(fact, NaN), false)
})

test('discovery, direct detail, SEO and owner registration use the same current catalogue offer inventory', async () => {
  const [row] = validateCatalogue([rawFixture()])
  const [onlyExpired] = validateCatalogue([rawFixture([promotion])])
  assert.equal(approvedCatalogueRecord(onlyExpired, expired), null)
  assert.equal(approvedCatalogueRecord(rawFixture(), NaN), null)
  assert.equal(approvedCatalogueRecord({ ...rawFixture(), verification: { ...row.verification, status: 'draft' } }, expired), null)
  assert.deepEqual(catalogueBusinessDetails(onlyExpired, expired).services, [])

  const options = { now: expired }
  const onboarding = catalogueOnboardingDetail([row], row.id, options)
  assert.deepEqual(servicesOf(onboarding.services), [regular.name, noTariff.name])
  assert.deepEqual(searchCatalogueForOnboarding([onlyExpired], { query: onlyExpired.name }, options), [])
  assert.deepEqual(servicesOf(catalogueProfileView(row, options).details.services), [regular.name, noTariff.name])
  assert.equal(catalogueProfileView(onlyExpired, options), null)
  assert.equal(catalogueProfileMetadata(onlyExpired, 'en', expired).robots.index, false)
  assert.doesNotMatch(catalogueProfileMetadata(row, 'en', expired).description, /Limited November/)
  assert.deepEqual(catalogueProfileStructuredData(row, 'en', expired).hasOfferCatalog.itemListElement.map(item => item.itemOffered.name),
    [regular.name, noTariff.name])
  assert.deepEqual(catalogueProfileSitemapEntries([onlyExpired], expired), [])
  assert.equal(catalogueProfileSitemapEntries([row], expired).length, 2)

  const suggestionInput = { query: 'Limited November', locale: 'en', cityCode: '68134' }
  const suggest = (candidate, now) => discoverySuggestions({ catalogue: [candidate] }, suggestionInput, { now }).groups.flatMap(group => group.items)
  assert.ok(suggest(row, stillCurrent).some(item => item.label === promotion.name))
  assert.ok(suggest(row, expired).every(item => item.label !== promotion.name))
  assert.ok(suggest(onlyExpired, expired).every(item => item.id !== onlyExpired.id))

  let record = row, now = stillCurrent, clockReads = 0
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true, environment: 'production' },
    allowAttempt: async () => true, findCatalogue: async () => record, now: () => { clockReads++; return now } })
  let response = await handler(openRequest(row.id), row.id)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control'), /no-store/)
  assert.equal(clockReads, 1)
  assert.deepEqual(servicesOf((await response.json()).business.details.services), [promotion.name, regular.name, noTariff.name])
  now = expired
  response = await handler(openRequest(row.id), row.id)
  assert.equal(response.status, 200)
  assert.deepEqual(servicesOf((await response.json()).business.details.services), [regular.name, noTariff.name])
  record = onlyExpired
  response = await handler(openRequest(row.id), row.id)
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: { code: 'NOT_FOUND' } })
})

test('both actual expired catalogue profiles are withheld automatically without changing source facts', () => {
  for (const id of ['sofia-balance-reformer-ovcha-kupel', 'sofia-maximum-solunska8']) {
    const row = PUBLIC_CATALOGUE.find(item => item.id === id)
    assert.ok(row)
    assert.ok(approvedCatalogueRecord(row, stillCurrent), id)
    assert.equal(approvedCatalogueRecord(row, expired), null, id)
    assert.ok(row.services.every(service => service.price.validUntil === '2026-11-25'), id)
  }
})

test('VOX Studio retains its four current offers while the expired package disappears', () => {
  const row = PUBLIC_CATALOGUE.find(item => item.id === 'sofia-vox-studio-lyulin')
  const packageOffer = row.services.find(service => service.price?.validUntil === '2026-11-25')
  assert.equal(packageOffer.price.amount, 110)
  assert.equal(approvedCatalogueRecord(row, stillCurrent).services.length, 5)
  assert.deepEqual(servicesOf(approvedCatalogueRecord(row, expired).services),
    servicesOf(row.services.filter(service => service !== packageOffer)))
  assert.equal(catalogueProfileView(row, { now: expired }).details.services.length, 4)
})
