import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE, REGIONAL_CATALOGUE, PUBLIC_CATALOGUE_PRICE_REVIEWS } from '../lib/discovery/public-catalogue.mjs'
import { REGIONAL_RAW_RECORDS, REGIONAL_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/lom-brusartsi-20261122.mjs'
import { LOM_GPOINT_RAW_RECORDS, LOM_GPOINT_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/lom-gpoint-20261122.mjs'
import { AZIS_RAW_RECORDS, AZIS_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/azis-style-20261122.mjs'
import { PLATFORM_CATALOGUE_CONFIRMATIONS, platformCatalogueConfirmation, platformConfirmationFacts } from '../lib/discovery/catalogue-platform-confirmations.mjs'
import { catalogueProvenance } from '../lib/discovery/catalogue-provenance.mjs'
import { catalogueRecordSchema, validateCatalogue, approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, auditCataloguePricing, pricingIdentity, platformConfirmationIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses, searchFreeCatalogue } from '../lib/discovery/catalogue-search.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { discoverySuggestions } from '../lib/discovery/suggestions.mjs'
import { validSuggestionResponse } from '../lib/discovery/suggestions-ui.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { catalogueProfilePath, catalogueProfileView, catalogueProfileSitemapEntries, catalogueProfileStructuredData } from '../lib/catalogue-profile.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122 } from '../lib/catalogue-service-photo-associations-azis-20261122.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { presentPublicService } from '../lib/locale/public-content-server.mjs'
import { serviceDisplayName, serviceDisplayUnit } from '../lib/locale/public-content.mjs'

const now = Date.parse('2026-11-22T12:00:00Z')
const ids = ['lom-azis-stil-krum-pastarmadzhiev7', 'brusartsi-azis-stil-septemvri8']
const expectedServices = [
  ['Мъжко подстригване', 'hair'], ['Дамско подстригване', 'hair'], ['Детско подстригване', 'hair'],
  ['Прически', 'hair'], ['Удължаване на коса', 'hair'], ['Сгъстяване на коса', 'hair'],
  ['Оформяне на вежди', 'beauty'], ['Боядисване на коса', 'hair'], ['Балеаж', 'hair'],
]
const originalRegional = validateCatalogue([...REGIONAL_RAW_RECORDS, ...LOM_GPOINT_RAW_RECORDS])
const originalCatalogue = [...SOFIA_CATALOGUE, ...originalRegional]
const azis = REGIONAL_CATALOGUE.filter(row => ids.includes(row.id))
const receipt = row => AZIS_PRICE_REVIEWS.find(review => review.id === row.id)
const intent = (cityCode, category) => ({ cityCode, ...(category ? { category } : {}), browse: true, searchV2: true, requirements: [] })

test('only the two explicitly confirmed premises append after all 1735 unchanged existing catalogue objects and receipts', () => {
  assert.equal(originalCatalogue.length, 1735)
  assert.deepEqual(PUBLIC_CATALOGUE.slice(0, originalCatalogue.length), originalCatalogue)
  assert.deepEqual(PUBLIC_CATALOGUE.slice(originalCatalogue.length).map(row => row.id), ids)
  assert.equal(PUBLIC_CATALOGUE.length, 1737)
  assert.deepEqual(REGIONAL_CATALOGUE.slice(0, originalRegional.length), originalRegional)
  assert.deepEqual(PUBLIC_CATALOGUE_PRICE_REVIEWS, [...REGIONAL_PRICE_REVIEWS, ...LOM_GPOINT_PRICE_REVIEWS, ...AZIS_PRICE_REVIEWS])
  assert.deepEqual(PLATFORM_CATALOGUE_CONFIRMATIONS.map(row => row.id), ids)
  assert.deepEqual(AZIS_RAW_RECORDS.map(row => row.id), ids)
  assert.equal(new Set(PUBLIC_CATALOGUE.map(row => row.id)).size, PUBLIC_CATALOGUE.length)
  assert.equal(PUBLIC_CATALOGUE.filter(row => row.cityCode === '44238').length, 4)
  assert.equal(PUBLIC_CATALOGUE.filter(row => row.cityCode === '06570').length, 1)
})

test('both actual branches retain the confirmed common phone and all nine services with the latest hair category instruction', () => {
  assert.deepEqual(azis.map(row => [row.name, row.cityCode, row.address]), [
    ['Азис Стил · Лом', '44238', 'Лом, ул. Крум Пастърмаджиев 7'],
    ['Азис Стил · Брусарци', '06570', 'Брусарци, ул. 9-ти септември 8'],
  ])
  for (const row of azis) {
    assert.equal(row.category, 'hair'); assert.equal(row.phone, '+359893804054')
    assert.deepEqual(row.booking, { kind: 'phone', phone: '+359893804054' })
    assert.deepEqual(row.services.map(service => [service.name, service.category]), expectedServices)
    assert.ok(row.services.every(service => service.appointmentModel === 'appointment' && Object.keys(service).length === 3))
    assert.equal(row.coordinates, null); assert.equal(row.neighborhood, null); assert.equal(row.openingHours, undefined)
    assert.equal(row.photo, undefined); assert.equal(row.gorezBusinessId, undefined)
    assert.equal(row.verification.sourceKind, 'platform_owner_confirmation')
    assert.equal(new URL(row.website).hostname, 'www.google.com', 'the URL is a public contact reference, not a salon-owner website')
    assert.ok(approvedCatalogueRecord(row, now))
  }
  assert.deepEqual(auditCatalogueBatch(originalCatalogue, AZIS_RAW_RECORDS, now).rejected, [], 'different genuine premises are not merged merely for a shared phone')
})

test('the separate two-sided offline receipt approves service facts only, never prices or an allegedly unpublished tariff', () => {
  const report = auditCataloguePricing(azis, [], AZIS_PRICE_REVIEWS, now)
  assert.deepEqual(report.blocking, [])
  assert.equal(report.summary.sourceReviewed, 0); assert.equal(report.summary.withPrices, 0)
  for (const row of azis) {
    const review = receipt(row), confirmation = platformCatalogueConfirmation(row)
    assert.ok(confirmation)
    assert.equal(review.pricingDecision, 'platform_owner_confirmed_unpriced')
    assert.equal(review.bookingReview, 'platform_owner_contact_confirmed')
    assert.equal(review.priceSearch, undefined)
    assert.equal(review.inventoryIdentity, confirmation.inventoryIdentity)
    assert.equal(review.inventoryIdentity, pricingIdentity(row))
    assert.equal(review.confirmationFactsIdentity, confirmation.factsIdentity)
    assert.equal(review.confirmationFactsIdentity, platformConfirmationIdentity(row))
    assert.deepEqual(assessPricingReview(row, review, now), {
      id: row.id, state: 'service_reviewed', pricingState: 'platform_owner_confirmed_unpriced', checkedOn: '2026-11-22', reviewedPriceCount: 0,
    })
    assert.equal(report.records.find(item => item.id === row.id).legacy, false)
  }
})

test('unknown IDs, changed branch/contact/category/service facts and added unconfirmed facts cannot reuse the bounded confirmation', () => {
  const mutations = [
    ['id', row => { row.id = 'lom-another-unconfirmed-salon' }],
    ['name', row => { row.name += ' друг обект' }], ['city', row => { row.cityCode = '68134' }],
    ['address', row => { row.address += ' ет. 2' }], ['website', row => { row.website = 'https://example.com/' }],
    ['phone', row => { row.phone = row.booking.phone = '+359888123456' }],
    ['main category', row => { row.category = 'beauty' }], ['neighborhood', row => { row.neighborhood = 'Център' }],
    ['service name', row => { row.services[0].name += ' с измиване' }],
    ['service category', row => { row.services[0].category = 'beauty' }],
    ['service order', row => { row.services.reverse() }], ['missing service', row => { row.services.pop() }],
    ['extra service', row => { row.services.push({ name: 'Оформяне на брада', category: 'hair', appointmentModel: 'appointment' }) }],
    ['service model', row => { row.services[0].appointmentModel = 'home_visit' }],
    ['zero price', row => { row.services[0].price = { amount: 0, currency: 'EUR', kind: 'fixed', sourceUrl: row.website, checkedOn: '2026-11-22' } }],
    ['duration', row => { Object.assign(row.services[0], { durationMin: 30, durationSourceUrl: row.website, durationCheckedOn: '2026-11-22' }) }],
    ['description', row => { row.services[0].description = 'Непотвърден метод и условие.' }],
    ['hours', row => { row.openingHours = { days: [{ weekday: 1, periods: [{ open: '09:00', close: '18:00' }] }], sourceUrl: row.website, checkedOn: '2026-11-22' } }],
    ['point', row => { row.coordinates = { latitude: 43.825404, longitude: 23.237443, method: 'first_party_coordinates', source: row.website, sourceAddress: row.address } }],
    ['native partner', row => { row.gorezBusinessId = '123e4567-e89b-42d3-a456-426614174000' }],
    ['wrong reference', row => { row.verification.confirmationReference = 'invented-confirmation' }],
    ['wrong date', row => { row.verification.checkedOn = '2026-11-21' }],
    ['extended expiry', row => { row.verification.validUntil = '2027-02-21' }],
    ['draft', row => { row.verification.status = 'draft' }], ['rejected', row => { row.verification.status = 'rejected' }],
  ]
  for (const original of azis) for (const [label, mutate] of mutations) {
    const changed = structuredClone(original); mutate(changed)
    assert.equal(platformCatalogueConfirmation(changed), null, label)
    assert.equal(catalogueRecordSchema.safeParse(changed).success, false, label + ': the runtime schema retains exact manual facts')
    assert.equal(approvedCatalogueRecord(changed, now), null, label)
    assert.equal(assessPricingReview(changed, receipt(original), now).state, 'pending', label)
  }
})

test('receipt mutations, missing manual tags, future reviews and expiration never become a generic price-review waiver', () => {
  for (const row of azis) {
    const review = receipt(row)
    for (const patch of [
      { pricingDecision: 'not_publicly_listed' }, { pricingDecision: undefined }, { pricingDecision: 'hold_conflicting_sources' },
      { bookingReview: 'phone_booking_reviewed' }, { confirmationReference: 'invented-confirmation' },
      { inventoryIdentity: '0'.repeat(64) }, { confirmationFactsIdentity: '0'.repeat(64) },
      { reviewedUrls: [] }, { reviewedUrls: [row.website, 'https://example.com/'] },
      { notes: '' }, { checkedOn: '2026-11-23' }, { checkedOn: '2026-01-01' },
    ]) assert.equal(assessPricingReview(row, { ...review, ...patch }, now).state, 'pending', JSON.stringify(patch))
    const untagged = structuredClone(row)
    delete untagged.verification.sourceKind; delete untagged.verification.confirmationReference
    assert.equal(catalogueRecordSchema.safeParse(untagged).success, false, 'reserved confirmed IDs cannot downgrade to an ordinary website source')
    assert.equal(approvedCatalogueRecord(untagged, now), null)
    assert.equal(assessPricingReview(untagged, review, now).state, 'pending')
    const forgedOrdinary = { ...review, pricingDecision: 'not_publicly_listed', bookingReview: 'phone_booking_reviewed',
      inventoryIdentity: pricingIdentity(untagged), priceSearch: { outcome: 'not_published', bookingUrl: row.website,
        serviceUrls: [row.website], notes: 'Forged claim of inspected booking and service pages, without a real owner review.' } }
    delete forgedOrdinary.confirmationReference; delete forgedOrdinary.confirmationFactsIdentity
    assert.equal(pricingIdentity(untagged), pricingIdentity(row), 'the old inventory identity alone deliberately cannot establish source authority')
    assert.equal(assessPricingReview(untagged, forgedOrdinary, now).state, 'pending', 'stripping both source flags and forging an ordinary unpublished-price receipt cannot bypass the bounded source class')
    const unknown = { ...row, id: 'lom-unreviewed-platform-claim' }
    assert.equal(assessPricingReview(unknown, { ...review, id: unknown.id, inventoryIdentity: pricingIdentity(unknown), confirmationFactsIdentity: platformConfirmationIdentity(unknown) }, now).state, 'pending', 'recomputing hashes cannot expand the bounded registry')
    assert.equal(assessPricingReview(row, review, Date.parse('2026-11-21T12:00:00Z')).state, 'pending')
    assert.equal(approvedCatalogueRecord(row, Date.parse('2026-11-21T12:00:00Z')), null)
    assert.equal(approvedCatalogueRecord(row, Date.parse('2027-02-21T12:00:00Z')), null)
    assert.equal(assessPricingReview(row, review, Date.parse('2027-02-21T12:00:00Z')).state, 'pending')
    const changedExcerpt = structuredClone(row)
    changedExcerpt.verification.booking.excerpt += ' Променено доказателство.'
    assert.notEqual(platformConfirmationIdentity(changedExcerpt), platformConfirmationIdentity(row))
    assert.equal(assessPricingReview(changedExcerpt, review, now).state, 'pending', 'the full offline hash binds evidence wording too')
    assert.deepEqual(platformConfirmationFacts(row), platformConfirmationFacts(structuredClone(row)))
  }
  for (const row of originalRegional) {
    assert.equal(platformCatalogueConfirmation(row), null)
    const existingReview = [...REGIONAL_PRICE_REVIEWS, ...LOM_GPOINT_PRICE_REVIEWS].find(item => item.id === row.id)
    assert.equal(assessPricingReview(row, existingReview, now).state, row.id.includes('europe') ? 'service_reviewed' : 'reviewed')
    assert.equal(assessPricingReview(row, { ...existingReview, pricingDecision: 'platform_owner_confirmed_unpriced', bookingReview: 'platform_owner_contact_confirmed' }, now).state, 'pending')
  }
})

test('actual browse and search keep both branches in their own city, eight hair services and only the real eyebrow service in beauty', async () => {
  const clock = DateTime.fromMillis(now)
  const deps = { now: clock, config: { maxResults: 15 }, readInternal: async () => [], readCatalogue: async () => PUBLIC_CATALOGUE,
    getBusiness: async () => { throw Error('No native booking lookup') }, getSlots: async () => { throw Error('No availability lookup') } }
  for (const row of azis) {
    const hair = normalizeCatalogueBusinesses(PUBLIC_CATALOGUE, intent(row.cityCode, 'hair'), { now }).find(item => item.id === row.id)
    const beauty = normalizeCatalogueBusinesses(PUBLIC_CATALOGUE, intent(row.cityCode, 'beauty'), { now }).find(item => item.id === row.id)
    assert.deepEqual(hair.services.map(service => service.name), expectedServices.filter(([, category]) => category === 'hair').map(([name]) => name))
    assert.deepEqual(beauty.services.map(service => service.name), ['Оформяне на вежди'])
    assert.deepEqual(hair.provenance, catalogueProvenance(row)); assert.equal(hair.provenance.kind, 'platform_owner_confirmed')
    assert.deepEqual(hair.availability, { status: 'external', slots: [] })
    assert.equal(rankCatalogueBusinesses([], [hair], intent(row.cityCode))[0].distanceKm, null)
    const input = discoveryRequestSchema.parse({ query: 'Азис Стил', cityCode: row.cityCode, category: 'hair' })
    const found = await searchFreeCatalogue(input, { intent: parseIntent(input, clock, { v2: true }), mode: 'deterministic' }, deps)
    assert.deepEqual(found.results.filter(item => ids.includes(item.id)).map(item => item.id), [row.id])
    const suggestions = discoverySuggestions({ catalogue: PUBLIC_CATALOGUE }, { query: 'Азис Стил', cityCode: row.cityCode, locale: 'en' }, { now })
    assert.equal(validSuggestionResponse(suggestions), true)
    assert.deepEqual(suggestions.groups.filter(group => group.kind === 'business').flatMap(group => group.items).filter(item => ids.includes(item.id)).map(item => item.id), [row.id])
    assert.deepEqual(normalizeCatalogueBusinesses([row], intent(row.cityCode === '44238' ? '06570' : '44238'), { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent(row.cityCode), coordinates: { latitude: 43.825404, longitude: 23.237443, consent: true }, radiusKm: 5 }, { now }), [])
  }
  assert.deepEqual(normalizeCatalogueBusinesses(azis, intent('68134'), { now }), [])
  assert.deepEqual(normalizeCatalogueBusinesses(azis, intent('56784'), { now }), [])
})

test('actual onboarding and public detail/profile projections preserve all nine unpriced services, truthful provenance and telephone-only contact', async () => {
  let privateReads = 0
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, allowAttempt: () => true, now: () => now,
    findCatalogue: id => PUBLIC_CATALOGUE.find(row => row.id === id), readCataloguePhotos: async () => [], readPartner: () => { privateReads++; return null } })
  const onboarding = createCatalogueOnboardingHandler({ catalogue: PUBLIC_CATALOGUE, allowAttempt: () => true, now: () => now })
  for (const row of azis) {
    assert.ok(searchCatalogueForOnboarding(PUBLIC_CATALOGUE, { query: 'Азис Стил', cityCode: row.cityCode }, { now }).some(item => item.id === row.id))
    const draft = catalogueOnboardingDetail(PUBLIC_CATALOGUE, row.id, { now, cityCode: row.cityCode })
    assert.equal(draft.business.website, '', 'a public Maps reference is not prefilled as the salon website')
    assert.equal(draft.business.phone, '+359893804054'); assert.equal(draft.business.coordinates, undefined)
    assert.deepEqual(draft.business.provenance, catalogueProvenance(row))
    assert.deepEqual(draft.services.map(service => service.name), expectedServices.map(([name]) => name))
    assert.ok(draft.services.every(service => service.price === '' && service.duration_min === '' && !service.catalogueHint.priceLabel && Object.keys(service.price_details).length === 0))
    assert.equal((await onboarding(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${row.id}&city=${row.cityCode}&lang=en`))).status, 200)
    assert.equal((await onboarding(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${row.id}&city=68134`))).status, 404)
    const response = await handler(new Request('https://www.gorez.co/api/public/discovery/business/' + row.id), row.id)
    assert.equal(response.status, 200)
    const { business } = await response.json(), profile = catalogueProfileView(row, { now })
    for (const view of [business, profile]) {
      assert.equal(view.cityCode, row.cityCode); assert.deepEqual(view.provenance, catalogueProvenance(row))
      assert.equal(view.booking.kind, 'phone'); assert.equal(view.booking.phone, '+359893804054')
      assert.equal(view.coordinates, null); assert.equal(view.details.services.length, 9)
      assert.ok(view.details.services.every(service => service.price === null && service.durationMin === null))
      assert.deepEqual(view.details.hours, [])
    }
    assert.equal(catalogueProfilePath(row.id), '/businesses/catalogue/' + row.id)
    assert.equal(catalogueProfileSitemapEntries([row], now).length, 2)
    const structured = catalogueProfileStructuredData(row, 'en', now)
    assert.equal(structured.telephone, '+359893804054'); assert.equal(structured.hasOfferCatalog.itemListElement.length, 9)
    for (const field of ['geo', 'aggregateRating', 'reviewCount', 'priceRange', 'openingHours', 'availability']) assert.equal(structured[field], undefined, field)
  }
  assert.equal(privateReads, 0)
  assert.equal(catalogueProvenance(originalRegional[0]).kind, 'first_party', 'existing own-source provenance is unchanged')
})

test('all eighteen new service associations resolve to exact existing illustrative assets and complete offline English without altering source facts', async () => {
  assert.equal(CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122.length, 18)
  assert.equal(new Set(CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122.map(([id, category, name]) => JSON.stringify([id, category, name]))).size, 18)
  for (const row of azis) for (const service of row.services) {
    const alias = CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122.find(([id, category, name]) => row.id === id && service.category === category && service.name === name)
    assert.ok(alias, row.id + ':' + service.name)
    const fields = catalogueServicePhotoFields(service, row), photo = serviceThumbnail({ ...service, ...fields }, { business: row })
    assert.equal(fields.illustrativePhotoKey, alias[3]); assert.equal(photo.type, 'photo')
    assert.equal(photo.source, 'illustrative'); assert.equal(photo.photoMatch, 'activity')
    assert.equal(photo.src, `/service-photos/${alias[3]}-v1.webp`); assert.doesNotMatch(photo.src, /notebook|neutral/u)
    await access(new URL('../public' + photo.src, import.meta.url))
    const presented = presentPublicService(service, row)
    assert.equal(presented.name, service.name); assert.equal(presented.price, undefined); assert.equal(presented.durationMin, undefined)
    for (const text of [serviceDisplayName(presented, 'en'), presented.presentationEn.description, serviceDisplayUnit(presented, 'en')].filter(Boolean)) assert.doesNotMatch(text, /[а-яѝ]|translation pending/iu)
  }
})

test('the dated confirmation receipt never claims salon-owner verification, a rendered booking menu or a reviewed unpublished tariff', async () => {
  const doc = JSON.parse(await readFile(new URL('../docs/catalogue-regions/azis-style-confirmation-20261122.json', import.meta.url), 'utf8'))
  assert.equal(doc.sourceKind, 'platform_owner_confirmation'); assert.equal(doc.pricingDecision, 'platform_owner_confirmed_unpriced')
  assert.equal(doc.checkedOn, '2026-11-22'); assert.equal(doc.confirmedPhone, '+359893804054'); assert.equal(doc.mainCategory, 'hair')
  assert.deepEqual(doc.services, expectedServices); assert.deepEqual(doc.branches.map(row => row.id), ids)
  assert.match(doc.authority, /NOT confirmation from the salon owner/u)
  assert.match(doc.pricingMeaning, /No prices supplied.*not a claim that a tariff is unpublished/iu)
  assert.deepEqual(doc.unknown, ['prices', 'durations', 'openingHours', 'preciseCoordinates', 'neighborhood', 'appointmentSlots'])
  for (const branch of doc.branches) {
    const row = azis.find(row => row.id === branch.id)
    assert.equal(branch.confirmationReference, row.verification.confirmationReference)
    assert.equal(branch.inventoryIdentity, pricingIdentity(row)); assert.equal(branch.confirmationFactsIdentity, platformConfirmationIdentity(row))
  }
  const source = await readFile(new URL('../lib/discovery/catalogue-data/azis-style-20261122.mjs', import.meta.url), 'utf8')
  const registry = await readFile(new URL('../lib/discovery/catalogue-platform-confirmations.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source + registry, /(?:pricingIdentity|platformConfirmationIdentity)\s*\(|\bfetch\s*\(|getSupabase|\.from\(/u, 'no automatic identity refresh, provider call or database write approves a future change')
})
