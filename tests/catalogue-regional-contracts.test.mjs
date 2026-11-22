import { suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
import { nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'
import test from 'node:test'
import { locationRecoveryPriorCatalogue } from './location-recovery-20261122-scope.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { CATALOGUE_CITY_CODES, CATALOGUE_ID_PATTERN, catalogueCity, catalogueIdMatchesCity, cataloguePointMatchesCity } from '../lib/discovery/catalogue-cities.mjs'
import { catalogueRecordSchema, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses, searchFreeCatalogue, isCataloguePartnerDuplicate } from '../lib/discovery/catalogue-search.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { discoverySuggestions } from '../lib/discovery/suggestions.mjs'
import { searchCatalogueForOnboarding, catalogueOnboardingDetail, parseCatalogueOnboardingQuery, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { validSuggestionResponse } from '../lib/discovery/suggestions-ui.mjs'
import { catalogueProfilePath, catalogueProfileView, catalogueProfileSitemapEntries, relatedCatalogueProfiles } from '../lib/catalogue-profile.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'

const SOFIA_CATALOGUE = suhodolIntakePriorCatalogue(currentCatalogue)
const now = Date.parse('2026-11-22T12:00:00Z')
const cityCases = [['sofia', '68134', 'София'], ['lom', '44238', 'Лом'], ['brusartsi', '06570', 'Брусарци']]
// Synthetic contract fixtures, never source facts or imported business rows.
function fixture(prefix, cityCode, cityName) {
  const website = `https://regional-fixture.example.com/${prefix}/`
  return {
    id: `${prefix}-regional-contract-fixture`, name: `Тестов салон ${cityName}`, cityCode, neighborhood: null,
    address: `гр. ${cityName}, ул. Тестова 1`, locationKind: 'premises', coordinates: null, category: 'hair',
    website, phone: '+359888123456', services: [{ name: 'Мъжко подстригване', category: 'hair', appointmentModel: 'appointment', price: { amount: 20, currency: 'EUR', kind: 'from', unit: 'посещение', sourceUrl: website + 'services', checkedOn: '2026-11-22' } }],
    booking: { kind: 'phone', phone: '+359888123456' },
    verification: { status: 'approved', checkedOn: '2026-11-22', validUntil: '2026-12-22', booking: { url: website + 'contacts', excerpt: 'Обадете се за предварително записване на час.' }, contact: website + 'contacts' },
  }
}
const records = validateCatalogue(cityCases.map(values => fixture(...values)))
const intent = cityCode => ({ cityCode, browse: true, searchV2: true, requirements: [] })
const request = query => new Request('https://www.gorez.co/api/public/catalogue-onboarding?' + query)

test('all 1732 original normalized Sofia records retain their published values and ordering', () => {
  // Independently evaluated from all 326 local Git-blob modules at published
  // e3bf738; one aggregate digest, not a refreshed per-record price baseline.
  assert.equal(SOFIA_CATALOGUE.length, 1732)
  assert.ok(SOFIA_CATALOGUE.every(row => row.cityCode === '68134' && row.id.startsWith('sofia-')))
  assert.equal(createHash('sha256').update(JSON.stringify(locationRecoveryPriorCatalogue(nearbyPointsPriorCatalogue(SOFIA_CATALOGUE)))).digest('hex'), 'e0af5db43c503050ffcbdfc7061a6e8c8c609aa6eb353babfa2f4c79f544098c')
})

test('the shared catalogue allowlist accepts only the three reviewed city prefixes and rejects mismatched or unsafe identities', () => {
  assert.deepEqual(CATALOGUE_CITY_CODES, ['68134', '44238', '06570'])
  for (const [prefix, code] of cityCases) {
    assert.equal(catalogueCity(code)?.prefix, prefix)
    assert.equal(CATALOGUE_ID_PATTERN.test(`${prefix}-real-public-id`), true)
    assert.equal(catalogueIdMatchesCity(`${prefix}-real-public-id`, code), true)
    for (const [otherPrefix, otherCode] of cityCases) if (code !== otherCode) {
      assert.equal(catalogueIdMatchesCity(`${prefix}-real-public-id`, otherCode), false)
      assert.equal(catalogueRecordSchema.safeParse({ ...fixture(prefix, code, prefix), id: `${otherPrefix}-real-public-id` }).success, false)
    }
  }
  for (const code of ['56784', '07079', '00000', '', null]) assert.equal(catalogueCity(code), null)
  for (const id of ['plovdiv-unknown-id', 'burgas-unknown-id', 'lom-../escape', 'lom-%2Fescape', 'lom-Uppercase', 'brusartsi-ab', 'sofia-' + 'a'.repeat(81)]) assert.equal(CATALOGUE_ID_PATTERN.test(id), false, id)
  assert.equal(catalogueRecordSchema.safeParse({ ...fixture('lom', '44238', 'Лом'), cityCode: '56784' }).success, false)
})

test('regional coordinates remain exact sourced facts, not city centres, cross-city points or service-area pins', () => {
  const row = fixture('lom', '44238', 'Лом')
  const point = { latitude: 43.825404, longitude: 23.237443, method: 'first_party_coordinates', source: row.website + 'contacts', sourceAddress: row.address }
  assert.equal(catalogueRecordSchema.safeParse({ ...row, coordinates: point }).success, true)
  assert.equal(catalogueRecordSchema.safeParse({ ...row, coordinates: { ...point, sourceAddress: undefined } }).success, false)
  assert.equal(catalogueRecordSchema.safeParse({ ...row, coordinates: { ...point, sourceAddress: 'Друг адрес 2' } }).success, false)
  assert.equal(catalogueRecordSchema.safeParse({ ...row, coordinates: { ...point, latitude: 42.6977, longitude: 23.3219 } }).success, false)
  assert.equal(catalogueRecordSchema.safeParse({ ...row, locationKind: 'service_area', coordinates: point }).success, false)
  assert.equal(cataloguePointMatchesCity('06570', { latitude: 43.66253, longitude: 23.066269 }), true)
  assert.equal(cataloguePointMatchesCity('06570', { latitude: 42.6977, longitude: 23.3219 }), false)
  assert.equal(cataloguePointMatchesCity('56784', point), false)
  assert.equal(cataloguePointMatchesCity('44238', { latitude: NaN, longitude: 23.2 }), false)
})

test('mixed-city discovery keeps the selected city authoritative and never invents distances for unlocated businesses', () => {
  for (const [, code, name] of cityCases) {
    const rows = normalizeCatalogueBusinesses(records, intent(code), { now })
    assert.equal(rows.length, 1); assert.equal(rows[0].cityCode, code); assert.equal(rows[0].city, name)
    assert.equal(rows[0].coordinates, null)
    assert.equal(rankCatalogueBusinesses([], rows, intent(code))[0].distanceKm, null)
    const gps = { ...intent(code), coordinates: { latitude: 43.825404, longitude: 23.237443, consent: true }, radiusKm: 5 }
    assert.deepEqual(normalizeCatalogueBusinesses(records, gps, { now }), [], 'unknown business points cannot pretend to match a nearby radius')
  }
  assert.deepEqual(normalizeCatalogueBusinesses(records, intent('56784'), { now }), [])
  assert.deepEqual(normalizeCatalogueBusinesses(records, { ...intent('44238'), neighborhood: 'Непотвърден квартал' }, { now }), [])
})

test('a shared chain phone and identical unqualified street never merge clearly different cities', () => {
  const row = { ...fixture('lom', '44238', 'Лом'), address: 'ул. Тестова 1' }
  const partner = { id: '123e4567-e89b-42d3-a456-426614174000', phone: row.phone, address: row.address }
  for (const cityField of ['cityCode', 'city_ekatte']) {
    assert.equal(isCataloguePartnerDuplicate(row, [{ ...partner, [cityField]: '68134' }]), false, cityField + ': a Sofia partner is not the Lom branch')
    assert.equal(isCataloguePartnerDuplicate(row, [{ ...partner, [cityField]: '44238' }]), true, cityField + ': independently matched same-city contacts still deduplicate')
  }
  assert.equal(isCataloguePartnerDuplicate({ ...row, gorezBusinessId: partner.id }, [{ ...partner, cityCode: '68134' }]), true, 'an explicitly reviewed native identity retains its existing exact-ID contract')
})

test('the actual full-search and suggestion pipelines keep regional filters and links without calling providers or booking services', async () => {
  const clock = DateTime.fromMillis(now)
  const dependencies = { now: clock, config: { maxResults: 15 }, readInternal: async () => [], readCatalogue: async () => records,
    getBusiness: async () => { throw Error('No native booking lookup is authorized') }, getSlots: async () => { throw Error('No availability lookup is authorized') } }
  for (const [index, [, code]] of cityCases.entries()) {
    const input = discoveryRequestSchema.parse({ query: 'подстригване', cityCode: code, category: 'hair' })
    const result = await searchFreeCatalogue(input, { intent: parseIntent(input, clock, { v2: true }), mode: 'deterministic' }, dependencies)
    assert.deepEqual(result.results.map(row => row.id), [records[index].id])
    assert.equal(result.externalStatus, 'catalogue'); assert.equal(result.external, null)
    assert.ok(!result.warnings.includes('catalogue_sofia_only'))
    const suggestions = discoverySuggestions({ catalogue: records }, { query: 'Тестов салон', cityCode: code, locale: 'en' }, { now })
    const businesses = suggestions.groups.filter(group => group.kind === 'business').flatMap(group => group.items)
    assert.deepEqual(businesses.map(row => row.id), [records[index].id])
    assert.equal(businesses[0].href, `/businesses/catalogue/${records[index].id}?lang=en`)
    assert.equal(validSuggestionResponse(suggestions), true)
  }
  const input = discoveryRequestSchema.parse({ query: 'подстригване', cityCode: '56784', category: 'hair' })
  const result = await searchFreeCatalogue(input, { intent: parseIntent(input, clock, { v2: true }), mode: 'deterministic' }, dependencies)
  assert.deepEqual(result.results, [], 'an unsupported catalogue city never receives Sofia or regional fallback businesses')
})

test('regional onboarding uses the same public inventory, exact city scope and literal source prices without ownership or writes', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: records, allowAttempt: () => true, now: () => now })
  for (const [index, [prefix, code]] of cityCases.entries()) {
    const row = records[index], results = searchCatalogueForOnboarding(records, { query: 'Тестов салон', cityCode: code }, { now })
    assert.deepEqual(results.map(item => item.id), [row.id])
    assert.deepEqual(parseCatalogueOnboardingQuery(request(`id=${row.id}&city=${code}&lang=en`).url), { id: row.id, cityCode: code, locale: 'en' })
    const draft = catalogueOnboardingDetail(records, row.id, { now, cityCode: code })
    assert.equal(draft.business.cityCode, code); assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.services[0].name, row.services[0].name); assert.equal(draft.services[0].price, '20')
    assert.deepEqual(draft.services[0].price_details, { kind: 'from', unit: 'посещение' })
    assert.equal(draft.services[0].duration_min, '')
    assert.equal((await handler(request(`id=${prefix}-regional-contract-fixture&city=${code}`))).status, 200)
    const otherCity = cityCases[(index + 1) % cityCases.length][1]
    assert.equal(catalogueOnboardingDetail(records, row.id, { now, cityCode: otherCity }), null)
    assert.equal((await handler(request(`id=${row.id}&city=${otherCity}`))).status, 404)
  }
  assert.deepEqual(searchCatalogueForOnboarding(records, { query: 'Тестов салон', cityCode: '56784' }, { now }), [])
})

test('regional details, profile paths and related links preserve the actual city and stay within exact same-origin public routes', async () => {
  let partnerReads = 0
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, allowAttempt: () => true, now: () => now,
    findCatalogue: id => records.find(row => row.id === id), readCataloguePhotos: () => [], readPartner: () => { partnerReads++; return null } })
  const response = href => ({ groups: [{ kind: 'business', label: 'Businesses', items: [{ kind: 'business', id: 'fixture', label: 'Fixture', href }] }], alternatives: [] })
  for (const [index, [, code, name]] of cityCases.entries()) {
    const row = records[index], path = `/businesses/catalogue/${row.id}`
    assert.equal(catalogueProfilePath(row.id), path)
    assert.equal(validSuggestionResponse(response(path + '?lang=bg')), true)
    assert.equal(validSuggestionResponse(response(path + '?lang=en')), true)
    const res = await handler(new Request('https://www.gorez.co/api/public/discovery/business/' + row.id), row.id)
    assert.equal(res.status, 200)
    const { business } = await res.json()
    assert.equal(business.cityCode, code); assert.equal(business.city, name); assert.equal(business.coordinates, null)
    assert.deepEqual(business.booking.kind, row.booking.kind); assert.equal(business.booking.phone, row.booking.phone)
    assert.equal(catalogueProfileView(row, { now }).city, name)
    assert.equal(catalogueProfileSitemapEntries([row], now).length, 2)
    assert.deepEqual(relatedCatalogueProfiles(records, row, { now }), [], 'a similar business in another city is not a local related profile')
  }
  for (const href of ['https://evil.example/businesses/catalogue/lom-fixture?lang=bg', '//evil.example/businesses/catalogue/lom-fixture?lang=bg', '/businesses/catalogue/lom-fixture?lang=de', '/businesses/catalogue/lom-fixture?lang=bg&next=https://evil.example', '/businesses/catalogue/lom-fixture/extra?lang=bg', '/businesses/catalogue/lom-%2fescape?lang=bg', '/businesses/catalogue/plovdiv-fixture?lang=bg']) assert.equal(validSuggestionResponse(response(href)), false, href)
  assert.equal(partnerReads, 0, 'regional catalogue requests never fall through to private/native lookups')
})

test('new regional records receive no legacy price exemption; missing, stale, blocked and inventory-mismatched receipts remain pending', () => {
  const row = fixture('lom', '44238', 'Лом')
  const review = { id: row.id, website: row.website, bookingEntry: 'phone', checkedOn: '2026-11-22', reviewedUrls: [row.website, row.verification.booking.url, row.services[0].price.sourceUrl], bookingReview: 'phone_booking_reviewed', notes: 'Reviewed the exact branch, published service menu and literal per-visit starting tariff.', inventoryIdentity: pricingIdentity(row) }
  assert.equal(assessPricingReview(row, review, now).state, 'reviewed')
  assert.equal(assessPricingReview(row, undefined, now).state, 'pending')
  assert.equal(assessPricingReview(row, { ...review, bookingReview: 'page_only' }, now).state, 'pending')
  assert.equal(assessPricingReview(row, { ...review, checkedOn: '2026-07-01' }, now).state, 'pending')
  assert.equal(assessPricingReview(row, { ...review, inventoryIdentity: '0'.repeat(64) }, now).state, 'pending')
  const unpriced = { ...row, services: row.services.map(({ price, ...service }) => service) }
  const unpublished = { ...review, inventoryIdentity: pricingIdentity(unpriced), pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl: row.verification.booking.url, serviceUrls: [row.website], notes: 'Actual booking and service pages reviewed; no current public tariff is provided.' } }
  assert.equal(assessPricingReview(unpriced, unpublished, now).state, 'service_reviewed')
  assert.equal(assessPricingReview(unpriced, { ...unpublished, priceSearch: { ...unpublished.priceSearch, outcome: 'blocked' } }, now).state, 'pending')
  assert.equal(assessPricingReview(unpriced, { ...unpublished, pricingDecision: 'hold_conflicting_sources' }, now).state, 'pending')
})

test('the dated Brusartsi research preserves two held leads and admits no unsupported services, locations, fees or schedules', async () => {
  const receipt = JSON.parse(await readFile(new URL('../docs/catalogue-regions/research-brusartsi-20261122.json', import.meta.url), 'utf8'))
  assert.equal(receipt.checkedOn, '2026-11-22'); assert.equal(receipt.city.code, '06570')
  assert.equal(receipt.admitted, 0); assert.equal(receipt.held, 2); assert.equal(receipt.candidates.length, 2)
  assert.match(receipt.city.sourceUrl, /^https:\/\/www\.nsi\.bg\//u)
  for (const candidate of receipt.candidates) {
    assert.equal(candidate.status, 'held'); assert.equal(candidate.facts.coordinates, null)
    assert.equal(candidate.facts.hours, null); assert.deepEqual(candidate.facts.prices, [])
    assert.deepEqual(candidate.facts.verifiedBookableServices, [])
    assert.equal(candidate.pricingReview.status, 'pending'); assert.equal(candidate.pricingReview.notPubliclyListedReceipt, false)
    assert.ok(candidate.missing.length >= 3)
  }
  for (const key of ['bookingsSubmitted', 'callsOrMessagesSent', 'accountsOrConsentsCreated', 'photosCopiedOrChanged', 'geocodingRequests', 'paidProvidersUsed']) assert.equal(receipt.accessAndSafety[key], 0, key)
})
