import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-dogspa-20261116.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueBusinessDetails, currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { safeBookingUrl } from '../lib/booking-mode.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const id = 'sofia-happy-pet-spa-druzhba2-283', site = 'https://dogspa.bg/'
const [row] = validateCatalogue(batch.records)
// Isolated test binding only; root persists the reviewed normalized identity.
const review = { ...batch.reviews[0], inventoryIdentity: pricingIdentity(row) }
const expected = [
  ['Цялостен груминг · Френски булдог / Мопс', 35, 120],
  ['Цялостен груминг · Померан / Шпиц', 45, 180],
  ['Цялостен груминг · Чао Чао', 90, 240],
  ['Цялостен груминг · куче до 5 кг', 40, 180],
  ['Цялостен груминг · куче от 5 до 10 кг', 45, 180],
  ['Цялостен груминг · куче от 10 до 20 кг', 60, 240],
  ['Цялостен груминг · куче от 20 до 30 кг', 70, 240],
  ['Цялостен груминг · куче над 30 кг', 90, 270],
]

test('Dogspa is one exact owner-stated Druzhba2 premises with eight grooming offers, not eight businesses or adjoining-quarter copies', () => {
  assert.equal(batch.records.length, 1)
  assert.equal(batch.reviews.length, 1)
  assert.equal(row.id, id)
  assert.equal(row.name, 'Happy Pet Spa & Grooming · Дружба 2')
  assert.equal(row.cityCode, '68134')
  assert.equal(row.neighborhood, 'Дружба 2')
  assert.equal(row.locationKind, 'premises')
  assert.equal(row.category, 'pets')
  assert.equal(row.services.length, 8)
  assert.equal(row.address, 'София, ж.к. Дружба 2, Цариградско шосе, 7–11 км, Цариградски комплекс, бл. 283, вх. Б')
  assert.doesNotMatch(row.address, /1000|шосе №? ?7|Младост|Дружба 1/u)
  assert.equal(row.coordinates, null)
  assert.equal(catalogueBoundCoordinates(row), null)
  assert.equal(row.gorezBusinessId, undefined)
  assert.deepEqual(auditCatalogueBatch([], batch.records, now), {
    readyForReview: [id], pending: [], rejected: [],
    notice: 'Schema and duplicate audit only. A reviewer must verify current first-party service, appointment, contact and address facts before explicitly importing any batch. Nothing is published automatically.',
  })
})

test('all three breed categories and five weight bands keep their literal EUR fees and separately sourced2/3/4/4.5hour card durations', () => {
  assert.deepEqual(row.services.map(service => [service.name, service.price.amount, service.durationMin]), expected)
  for (const service of row.services) {
    assert.equal(service.category, 'pets')
    assert.equal(service.appointmentModel, 'appointment')
    assert.deepEqual(service.price, {
      amount: expected.find(([name]) => name === service.name)[1], currency: 'EUR', kind: 'fixed',
      sourceUrl: site, checkedOn: '2026-11-16', validUntil: '2027-02-14',
    })
    assert.equal(service.durationSourceUrl, site)
    assert.equal(service.durationCheckedOn, '2026-11-16')
    assert.match(service.description, /Обхватът и приложимата тарифа се потвърждават по телефона/u)
    assert.equal(service.price.unit, undefined)
  }
  assert.ok(row.services.slice(0, 3).every(service => service.description.includes('Породна тарифа, отделна от общите тарифи по тегло.')))
  assert.ok(row.services.slice(3).every(service => service.description.includes('Тарифа по тегло, отделна от специалните породни тарифи.')))
  assert.match(review.notes, /generic ContactFAQ usually1–3hours does not replace specific4\/4.5hour cards/u)
  assert.match(review.notes, /weight-boundary wording is not silently changed/u)
})

test('puppy bundles, cats, ambiguous additional procedures and health/certification claims are excluded rather than repackaged as ordinary grooming', () => {
  assert.ok(row.services.every(service => !/бебе|коте|котка|нокти|уши|хигиен|разрес|CO2|карбокси|пакет|сертифи|безопас|лечение|терапия/iu.test(`${service.name} ${service.description}`)))
  assert.match(review.notes, /Starter-puppy package, additional cat\/hygiene\/detangling\/ear\/nail\/CO2 rows/u)
  assert.match(review.notes, /No health, safety, certification, founding-date, staff or clinical claims/u)
})

test('actual rendered Book is owner phone booking with hash-route provenance, not a native calendar or weakened URL safeguard', () => {
  assert.equal(row.website, site)
  assert.equal(row.phone, '+359898629839')
  assert.deepEqual(row.booking, { kind: 'phone', phone: row.phone })
  assert.equal(row.verification.booking.url, site)
  assert.equal(row.verification.booking.excerpt, 'Обадете ни се, за да запазите час.')
  assert.equal(row.verification.contact, site)
  assert.equal(review.bookingEntry, 'phone')
  assert.equal(review.bookingReview, 'phone_booking_reviewed')
  assert.equal(review.manualIntakeResolution, undefined)
  assert.equal(safeBookingUrl(site), site)
  assert.equal(safeBookingUrl(`${site}#/contacts`), null)
  assert.equal(safeBookingUrl(`${site}#/home`), null)
  assert.deepEqual(review.reviewedUrls, [site, `${site}robots.txt`, `${site}sitemap.xml`])
  assert.match(review.notes, /Parent \/root independently rendered.*#\/contacts FIRST/u)
  assert.match(review.notes, /not a separate live browser review/u)
  assert.match(review.notes, /same native Contact\/phone route/u)
  assert.match(review.notes, /accepts walk-ins but explicitly invites advance phone booking/u)
  assert.match(review.notes, /Contact automatically loaded Leaflet resources/u)
  assert.match(review.notes, /not a licence.*legal clearance/u)
})

test('Tuesday–Saturday09–20 and explicitly closed Monday do not invent Sunday opening, availability or a universal FAQ duration', () => {
  assert.deepEqual(row.openingHours, {
    days: [{ weekday: 1, periods: [] }, ...[2, 3, 4, 5, 6].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '20:00' }] }))],
    sourceUrl: site, checkedOn: '2026-11-16',
  })
  assert.equal(row.openingHours.days.some(day => day.weekday === 7), false)
  const detail = catalogueBusinessDetails(row, now)
  assert.equal(detail.hours.length, 6)
  assert.equal(detail.hoursSourceUrl, site)
  assert.deepEqual(detail.hours[0], { weekday: 1, periods: [] })
  assert.deepEqual(detail.services.map(service => service.durationMin), expected.map(([, , minutes]) => minutes))
})

test('eight current card fees have an exact inventory-bound numerical review, not an unpublished or conflict exception', () => {
  assert.deepEqual(assessPricingReview(row, review, now), { id, state: 'reviewed', checkedOn: '2026-11-16', reviewedPriceCount: 8 })
  assert.equal(review.pricingDecision, undefined)
  assert.equal(review.priceSearch, undefined)
  assert.equal(assessPricingReview(row, { ...review, pricingDecision: 'not_publicly_listed' }, now).reason, 'unpublished_price_receipt_contains_prices')
  const changed = { ...row, services: [{ ...row.services[0], price: { ...row.services[0].price, amount: 40 } }, ...row.services.slice(1)] }
  assert.equal(assessPricingReview(changed, review, now).reason, 'reviewed_service_inventory_changed')
  assert.ok(approvedCatalogueRecord(row, now))
  assert.ok(row.services.every(service => currentPublishedFact(service.price, now)))
  const expired = Date.parse('2027-02-15T00:00:00Z')
  assert.equal(approvedCatalogueRecord(row, expired), null)
  assert.ok(row.services.every(service => !currentPublishedFact(service.price, expired)))
  assert.equal(catalogueOnboardingDetail([row], id, { now: expired }), null)
})

test('BG/EN partner onboarding searches the full practice name and imports all eight literal fees and individual card durations without invented units', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: [row], now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(row.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    assert.deepEqual((await search.json()).businesses.map(item => [item.id, item.serviceCount, item.currentPriceCount]), [[id, 8, 8]])
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail([row], id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.address, row.address)
    assert.equal(draft.business.neighborhood, 'Дружба 2')
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.business.phone, row.phone)
    assert.equal(draft.business.website, site)
    assert.equal(draft.serviceCount, 8)
    draft.services.forEach((service, index) => {
      assert.equal(service.name, expected[index][0])
      assert.equal(service.description, row.services[index].description)
      assert.equal(service.price, String(expected[index][1]))
      assert.equal(service.currency, 'EUR')
      assert.equal(service.duration_min, String(expected[index][2]))
      assert.deepEqual(service.price_details, { kind: 'fixed' })
      assert.doesNotMatch(service.catalogueHint.priceLabel, /процедура|за кг|на кг|пакет|абонамент/u)
      assert.equal(service.catalogueHint.description, row.services[index].description)
    })
  }
})

test('exact-quarter public discovery retains eight sourced offers and phone action with unknown point and no native free slots', () => {
  const intent = { cityCode: '68134', neighborhood: 'Дружба 2', category: 'pets', browse: true, searchV2: true }
  const [result] = normalizeCatalogueBusinesses([row], intent, { now })
  assert.ok(result)
  assert.equal(result.id, id)
  assert.equal(result.neighborhood, 'Дружба 2')
  assert.equal(result.address, row.address)
  assert.equal(result.coordinates, null)
  assert.deepEqual(result.details.services.map(service => [service.name, service.price, service.durationMin]), expected)
  assert.ok(result.details.services.every(service => service.currency === 'EUR' && service.priceKind === 'fixed' && service.priceUnit === ''))
  assert.equal(result.details.hours.length, 6)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(result, now), { kind: 'phone', href: 'tel:+359898629839' })
  assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Дружба 1' }, { now }), [])
  const [ranked] = rankCatalogueBusinesses([], [result], { ...intent, coordinates: { latitude: 42.65, longitude: 23.38 } })
  assert.equal(ranked.distanceKm, null)
})

test('eight differently scoped tariffs count as one real physical Druzhba2 grooming option rather than eight businesses', () => {
  const report = catalogueCoverageReport([row], { now, target: 50 })
  assert.equal(report.counts.approvedBusinesses, 1)
  assert.equal(report.counts.premises, 1)
  assert.equal(report.counts.serviceAreaProviders, 0)
  assert.equal(report.counts.businessCategoryIncidences, 1)
  const cells = [...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area => area.cells.filter(cell => cell.count > 0).map(cell => ({ neighborhood: area.name, ...cell })))
  assert.equal(cells.length, 1)
  assert.equal(cells[0].neighborhood, 'Дружба 2')
  assert.equal(cells[0].categoryId, 'pets')
  assert.deepEqual(cells[0].businessIds, [id])
  assert.equal(cells[0].count, 1)
  assert.equal(cells[0].gap, 49)
})

test('all eight BG/EN grooming thumbnails retain exact reviewed breed or breed-neutral grooming-activity assets, never unrelated animals or neutral placeholders', async () => {
  const expectedKeys = [
    'sx-groom-french-bulldog', 'sx-groom-small-double-coat', 'sx-groom-chow-chow',
    ...Array(5).fill('sx-pet-full-grooming-equipment'),
  ]
  for (const locale of ['bg', 'en']) for (const [index, service] of row.services.entries()) {
    const fields = catalogueServicePhotoFields(service, row)
    assert.deepEqual(fields, { illustrativePhotoKey: expectedKeys[index] })
    const image = serviceThumbnail({ ...service, ...fields }, { business: row, locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.photoMatch, 'activity')
    assert.equal(image.source, 'illustrative')
    assert.equal(image.src, `/service-photos/${expectedKeys[index]}-v1.webp`)
    assert.ok(image.alt)
    assert.doesNotMatch(image.src, /notebook|appointment-workspace|neutral|guinea|cat-grooming|dog-training/u)
    const data = await readFile(new URL(`../public${image.src}`, import.meta.url))
    assert.equal(data.subarray(0, 4).toString(), 'RIFF')
    assert.equal(data.subarray(8, 12).toString(), 'WEBP')
  }
})
