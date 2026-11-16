import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-dental-20261116.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { COVERAGE_20261116_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-coverage-20261116.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const id = 'sofia-diamant-dental-pashovi-obelya316'
const ownerSite = 'https://diamantdental.wixsite.com/diamantdental'
const book = 'https://superdoc.bg/klinika/familna-praktika-diamant-dental-d-r-pashovi'
const profiles = [
  'https://superdoc.bg/lekar/d-r-dimitrichka-pashova-260',
  'https://superdoc.bg/lekar/d-r-svetoslav-pashov',
]
const business = SOFIA_CATALOGUE.find(row => row.id === id)
const review = COVERAGE_20261116_REVIEWS.find(row => row.id === id)

test('Diamant is one private Obelya2 practice with two adult dental services, not one listing per dentist or a general medical centre', () => {
  assert.deepEqual(batch.records.map(row => row.id), [id])
  assert.equal(batch.reviews.length, 1)
  assert.equal(SOFIA_CATALOGUE.filter(row => row.id === id).length, 1)
  assert.equal(business.name, 'Диамант-Дентал Д-р Пашови · Обеля 2')
  assert.equal(business.category, 'other')
  assert.deepEqual(business.services.map(service => service.name), [
    'Дентален преглед за възрастни', 'Почистване на зъбен камък за възрастни',
  ])
  for (const service of business.services) {
    assert.equal(service.category, 'other')
    assert.equal(service.appointmentModel, 'appointment')
    assert.match(service.name, /за възрастни$/u)
    assert.doesNotMatch(service.name, /дете|детски|майчин|бремен|административ|документ|материал|спешен/iu)
    assert.equal(service.price, undefined, 'No price, not even zero, was published for the admitted services')
    assert.equal(service.durationMin, undefined, 'Calendar spacing is not a procedure duration')
    assert.equal(service.durationSourceUrl, undefined)
  }
  assert.match(business.services[0].description, /евентуалното покритие по НЗОК се уточняват/u)
  assert.match(business.services[1].description, /метод, обхватът и цената се потвърждават/u)
  assert.ok(business.services.every(service => service.description.includes('няма публикувана сума')))
})

test('the owner website and actual provider booking target remain separate and retain exact manually corroborated merchant identity', () => {
  assert.equal(business.website, ownerSite)
  assert.deepEqual(business.booking, { kind: 'form', url: book })
  assert.equal(business.verification.booking.url, book)
  assert.equal(business.verification.contact, `${ownerSite}/contact`)
  assert.equal(business.phone, '+359888638741')
  const resolution = review.manualIntakeResolution
  assert.equal(resolution.flag, 'first_party_appointment_evidence_required')
  assert.equal(resolution.decision, 'manually_verified_provider_merchant_identity')
  assert.equal(resolution.checkedOn, '2026-11-16')
  assert.equal(resolution.ownerContact, `${ownerSite}/contact`)
  assert.equal(resolution.providerPractice, book)
  assert.deepEqual(resolution.providerProfiles, profiles)
  assert.deepEqual(resolution.matchingPhones, ['+359888638741', '+359878180263'])
  assert.equal(resolution.matchingPremises, 'Обеля 2, ДКЦ 30, кабинет 316')
  assert.deepEqual(resolution.reviewedBy, ['/root', '/root/catalogue_workflow_audit'])
  for (const url of [ownerSite, resolution.ownerContact, book, ...profiles]) assert.ok(review.reviewedUrls.includes(url), url)
  assert.match(resolution.note, /Own Wix has only an inquiry route/u)
})

test('the offline intake helper still flags cross-host evidence and cannot silently auto-approve the manually reviewed provider', () => {
  const audit = auditCatalogueBatch(SOFIA_CATALOGUE.filter(row => row.id !== id), batch.records, now)
  assert.deepEqual(audit.readyForReview, [])
  assert.deepEqual(audit.rejected, [])
  assert.deepEqual(audit.pending, [{ id, reason: 'first_party_appointment_evidence_required' }])
  const anotherCandidate = { ...batch.records[0], id: `${id}-unchecked` }
  assert.deepEqual(auditCatalogueBatch([], [anotherCandidate], now).pending,
    [{ id: anotherCandidate.id, reason: 'first_party_appointment_evidence_required' }])
  assert.notEqual(new URL(business.website).hostname, new URL(business.booking.url).hostname)
})

test('a genuine inspected unpublished tariff qualifies only as service_reviewed and stays bound to the exact two-service inventory', () => {
  assert.equal(review.inventoryIdentity, pricingIdentity(business))
  assert.equal(review.bookingReview, 'provider_booking_reviewed')
  assert.equal(review.pricingDecision, 'not_publicly_listed')
  assert.deepEqual(assessPricingReview(business, review, now), {
    id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-16', reviewedPriceCount: 0,
  })
  assert.equal(review.priceSearch.outcome, 'not_published')
  assert.equal(review.priceSearch.bookingUrl, book)
  assert.deepEqual(review.priceSearch.serviceUrls, [`${ownerSite}/services`, book, ...profiles])
  assert.match(review.priceSearch.notes, /NHIF badges do not mean a free private service/u)
  assert.equal(assessPricingReview(business, { ...review, pricingDecision: undefined }, now).reason, 'published_sourced_price_required')
  const changed = { ...business, services: [...business.services, { name: 'Непроверена допълнителна услуга', category: 'other', appointmentModel: 'appointment' }] }
  assert.equal(assessPricingReview(changed, review, now).reason, 'reviewed_service_inventory_changed')
})

test('room316 stays distinct from the existing VIA practice in rooms317/318 without inventing a street number, coordinates or weekly hours', () => {
  assert.equal(business.cityCode, '68134')
  assert.equal(business.neighborhood, 'Обеля 2')
  assert.equal(business.address, 'София, ж.к. Обеля 2, ул. Кривините, ДКЦ 30, кабинет 316')
  assert.equal(business.locationKind, 'premises')
  assert.equal(business.coordinates, null)
  assert.equal(business.openingHours, undefined)
  assert.ok(review.reviewedUrls.includes('https://www.sofia.bg/bg/web/guest/w/7814054'))
  const via = SOFIA_CATALOGUE.find(row => row.id === 'sofia-via-dental-obelya')
  assert.ok(via)
  assert.equal(via.neighborhood, 'Обеля 2')
  assert.match(via.address, /кабинети 317 и 318$/u)
  assert.notEqual(via.website, business.website)
  assert.notEqual(via.phone, business.phone)
  assert.deepEqual(auditCatalogueBatch([via], batch.records, now).rejected, [])
})

test('BG and EN partner registration find the practice and import both adult services with blank prices and no made-up minutes', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(business.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    const match = (await search.json()).businesses.find(row => row.id === id)
    assert.ok(match)
    assert.equal(match.currentPriceCount, 0)
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail(SOFIA_CATALOGUE, id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.website, ownerSite)
    assert.equal(draft.business.neighborhood, 'Обеля 2')
    assert.equal(draft.business.address, business.address)
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.serviceCount, 2)
    draft.services.forEach((service, index) => {
      assert.equal(service.name, business.services[index].name)
      assert.equal(service.description, business.services[index].description)
      assert.equal(service.price, '')
      assert.equal(service.duration_min, '')
      assert.deepEqual(service.price_details, {})
      assert.equal(service.catalogueHint.priceLabel, undefined)
      assert.equal(service.catalogueHint.description, business.services[index].description)
    })
  }
})

test('public Obelya2 discovery includes both independent practices and retains the actual external Book route with no native availability', () => {
  const result = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { cityCode: '68134', neighborhood: 'Обеля 2', category: 'other', browse: true, searchV2: true }, { now })
  assert.ok(result.some(row => row.id === 'sofia-via-dental-obelya'))
  const row = result.find(row => row.id === id)
  assert.ok(row)
  assert.equal(row.neighborhood, 'Обеля 2')
  assert.equal(row.coordinates, null)
  assert.deepEqual(row.details.services.map(service => service.name), business.services.map(service => service.name))
  assert.ok(row.details.services.every(service => service.price === null && service.priceSourceUrl === null && service.durationMin === null))
  assert.deepEqual(row.details.hours, [])
  assert.equal(row.details.hoursSourceUrl, null)
  assert.deepEqual(row.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(row, now), { kind: 'form', href: book })
  assert.equal(normalizeCatalogueBusinesses([business], { cityCode: '68134', neighborhood: 'Обеля 1', category: 'other', browse: true, searchV2: true }, { now }).length, 0)
})

test('adult examination and calculus-removal use existing precise clinical photos rather than child, generic consultation or neutral artwork', async () => {
  const expected = ['dental-exam', 'oral-hygiene']
  for (const locale of ['bg', 'en']) for (const [index, service] of business.services.entries()) {
    const image = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, business) }, { business, locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.photoMatch, 'exact')
    assert.equal(image.src, `/service-photos/${expected[index]}-v1.webp`)
    assert.doesNotMatch(image.src, /child|neutral|notebook|appointment-workspace|consultation/u)
    assert.ok(image.alt)
    const data = await readFile(new URL(`../public${image.src}`, import.meta.url))
    assert.equal(data.subarray(0, 4).toString(), 'RIFF')
    assert.equal(data.subarray(8, 12).toString(), 'WEBP')
  }
})
