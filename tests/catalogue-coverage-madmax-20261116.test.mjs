import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-madmax-20261116.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { COVERAGE_20261116_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-coverage-20261116.mjs'
import { validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { serviceFitsBudget } from '../lib/discovery/internal-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { safeBookingUrl } from '../lib/booking-mode.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const id = 'sofia-madmax-grooming-suhata-reka18'
const site = 'https://madmax-grooming.com/'
const book = site, contact = site
const source = batch.records[0]
const business = SOFIA_CATALOGUE.find(row => row.id === id)
const review = COVERAGE_20261116_REVIEWS.find(row => row.id === id)

test('MadMax adds one reviewed SuhataReka salon and one exact mixed-breed full-grooming offer, not an old-metadata branch', () => {
  assert.equal(validateCatalogue(batch.records).length, 1)
  assert.deepEqual(batch.records.map(row => row.id), [id])
  assert.equal(batch.reviews.length, 1)
  assert.equal(SOFIA_CATALOGUE.filter(row => row.website === site).length, 1)
  assert.equal(business.name, 'Груминг салон Лудият Макс')
  assert.equal(business.cityCode, '68134')
  assert.equal(business.neighborhood, 'Сухата река')
  assert.equal(business.address, 'София, ж.к. Сухата река, бл. 18')
  assert.equal(business.locationKind, 'premises')
  assert.equal(business.coordinates, null)
  assert.equal(business.phone, '+359878412046')
  assert.deepEqual(business.booking, { kind: 'form', url: book })
  assert.equal(business.verification.booking.url, book)
  assert.equal(business.verification.contact, contact)
  assert.equal(safeBookingUrl(book), site)
  assert.equal(safeBookingUrl(`${site}#booking`), null, 'Canonical single-page routing must not weaken the shared URL guard')
  assert.deepEqual(business.services.map(service => service.name), ['Цялостен груминг · смесица до 5 кг с нормална козина'])
  assert.equal(business.category, 'pets')
  assert.doesNotMatch(business.address, /Стрелбище|Тошев/u)
})

test('MadMax retains literal FROM40EUR for one normal-coat mixed dog up to5kg without converting either inconsistent BGN companion label', () => {
  const service = source.services[0]
  assert.equal(service.category, 'pets')
  assert.equal(service.appointmentModel, 'appointment')
  assert.deepEqual(service.price, {
    amount: 40, currency: 'EUR', kind: 'from', unit: 'една процедура за смесица до 5 кг с нормална козина',
    sourceUrl: book, checkedOn: '2026-11-16', validUntil: '2027-02-14',
  })
  assert.match(service.description, /смесица до 5 кг с нормална козина/u)
  for (const inclusion of ['къпане', 'сушене', 'разресване', 'подстригване', 'нокти', 'уши']) assert.ok(service.description.includes(inclusion), inclusion)
  assert.match(service.description, /Цена от 40 €/u)
  assert.match(service.description, /крайната сума се уточнява на място/u)
  assert.match(service.description, /сплъстена козина се доплаща/u)
  assert.doesNotMatch(service.description, /лв\.|BGN|88|78[.,]23/u)
  assert.equal(service.durationMin, undefined)
  assert.equal(service.durationSourceUrl, undefined)
})

test('conflicting hygiene, puppy and optional-nail tariffs and health-related surcharges cannot become extra admitted service rows', () => {
  assert.equal(source.services.length, 1)
  assert.ok(source.services.every(service => !/хигиенен|бебе|бълх|кърлеж|добавк|само нокти/iu.test(service.name)))
  const notes = batch.reviews[0].notes
  assert.match(notes, /Hygiene card20EUR versus procedure25EUR/u)
  assert.match(notes, /puppy card35EUR versus procedure40EUR/u)
  assert.match(notes, /nail checkbox8EUR versus selected-total10EUR/u)
  assert.match(notes, /card88 versus booking78\.23/u)
  assert.match(notes, /not a conversion of either BGN figure/u)
  assert.match(notes, /restored that exact full-grooming context/u)
})

test('only the rendered contact weekly hours are retained, without interpreting average grooming time as procedure duration', () => {
  assert.deepEqual(source.openingHours, {
    days: [{ weekday: 1, periods: [] }, ...[2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] }))],
    sourceUrl: contact, checkedOn: '2026-11-16',
  })
  assert.match(batch.reviews[0].notes, /usually-two-hour guidance is not a guaranteed service-specific duration/u)
  assert.match(batch.reviews[0].notes, /static noscript\/JSON-LD is retired metadata, not a second branch/u)
  assert.match(batch.reviews[0].notes, /downstream calendar is intentionally not claimed reviewed/u)
})

test('the exact rendered owner-menu inventory has a fresh price review rather than an unpublished-price or stale metadata exception', () => {
  assert.equal(review.inventoryIdentity, pricingIdentity(business))
  assert.equal(review.bookingEntry, book)
  assert.equal(review.bookingReview, 'owned_booking_reviewed')
  assert.deepEqual(review.reviewedUrls, [site])
  assert.equal(review.pricingDecision, undefined)
  assert.deepEqual(assessPricingReview(business, review, now), { id, state: 'reviewed', checkedOn: '2026-11-16', reviewedPriceCount: 1 })
})

test('BG and EN partner intake preserves the FROM qualifier, weight/coat unit and customer qualifications without a two-hour default', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(business.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    assert.ok((await search.json()).businesses.some(row => row.id === id))
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail(SOFIA_CATALOGUE, id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.neighborhood, 'Сухата река')
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.serviceCount, 1)
    assert.equal(draft.services[0].name, source.services[0].name)
    assert.equal(draft.services[0].description, source.services[0].description)
    assert.equal(draft.services[0].price, '40')
    assert.equal(draft.services[0].currency, 'EUR')
    assert.equal(draft.services[0].duration_min, '')
    assert.deepEqual(draft.services[0].price_details, { kind: 'from', unit: source.services[0].price.unit })
    assert.match(draft.services[0].catalogueHint.priceLabel, locale === 'en' ? /^from /u : /^от /u)
    assert.ok(draft.services[0].catalogueHint.priceLabel.includes(source.services[0].price.unit))
  }
})

test('public SuhataReka grooming discovery uses the actual owner form, qualified starting price and sourced hours with no fake native availability', () => {
  const row = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { cityCode: '68134', neighborhood: 'Сухата река', category: 'pets', browse: true, searchV2: true }, { now })
    .find(item => item.id === id)
  assert.ok(row)
  assert.equal(row.neighborhood, 'Сухата река')
  assert.equal(row.address, source.address)
  assert.equal(row.coordinates, null)
  assert.deepEqual(row.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(row, now), { kind: 'form', href: book })
  assert.equal(row.details.services.length, 1)
  const service = row.details.services[0]
  assert.equal(service.price, 40)
  assert.equal(service.currency, 'EUR')
  assert.equal(service.priceKind, 'from')
  assert.equal(service.priceMaximum, null)
  assert.equal(service.priceUnit, source.services[0].price.unit)
  assert.equal(service.description, source.services[0].description)
  assert.equal(service.durationMin, null)
  assert.deepEqual(row.details.hours, [{ weekday: 1, periods: [] }, ...[2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: ['09:00–19:00'] }))])
  assert.equal(row.details.hoursSourceUrl, contact)
  assert.equal(serviceFitsBudget(row.services[0], { max: 40, currency: 'EUR' }), false, 'A starting fee is not a guaranteed complete visit within budget')
  assert.equal(normalizeCatalogueBusinesses([business], { cityCode: '68134', neighborhood: 'Стрелбище', category: 'pets', browse: true, searchV2: true }, { now }).length, 0)
})

test('the mixed-dog full-grooming offer uses its reviewed dog scene instead of a breed-specific substitute or neutral equipment placeholder', async () => {
  const service = business.services[0]
  const fields = catalogueServicePhotoFields(service, business)
  assert.equal(fields.illustrativePhotoKey, 'dog-full-grooming')
  for (const locale of ['bg', 'en']) {
    const image = serviceThumbnail({ ...service, ...fields }, { business, locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.photoMatch, 'activity')
    assert.equal(image.src, '/service-photos/dog-full-grooming-v1.webp')
    assert.doesNotMatch(image.src, /neutral|notebook|appointment-workspace|pomeranian|yorkie|poodle/u)
    assert.ok(image.alt)
    const data = await readFile(new URL(`../public${image.src}`, import.meta.url))
    assert.equal(data.subarray(0, 4).toString(), 'RIFF')
    assert.equal(data.subarray(8, 12).toString(), 'WEBP')
  }
})
