import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-borbelov-20261116.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueBusinessDetails } from '../lib/discovery/business-details.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const id = 'sofia-borbelov-dental-borovo61a'
const site = 'https://borbelov.com/', contact = `${site}kontakti/`, procedure = `${site}uslugi/profilaktika/`
const [row] = validateCatalogue(batch.records)
// Isolated receipt only: production identity is independently bound by root.
const review = { ...batch.reviews[0], inventoryIdentity: pricingIdentity(row) }

test('Borbelov is one owner-stated Borovo practice and one verified oral-hygiene procedure, not staff, retail or child preventive extras', () => {
  assert.equal(batch.records.length, 1)
  assert.equal(batch.reviews.length, 1)
  assert.equal(row.id, id)
  assert.equal(row.name, 'Borbelov Dental Solutions')
  assert.equal(row.cityCode, '68134')
  assert.equal(row.neighborhood, 'Борово')
  assert.equal(row.address, 'София, ж.к. Борово, ул. Пирински проход 61А')
  assert.equal(row.locationKind, 'premises')
  assert.equal(row.category, 'other')
  assert.equal(row.coordinates, null)
  assert.equal(catalogueBoundCoordinates(row), null)
  assert.equal(row.gorezBusinessId, undefined)
  assert.equal(row.services.length, 1)
  assert.equal(row.services[0].name, 'Професионално почистване на плака и зъбен камък')
  assert.equal(row.services[0].category, 'other')
  assert.equal(row.services[0].appointmentModel, 'appointment')
  assert.doesNotMatch(row.services[0].name, /дете|детски|флуор|силант|шина|материал|паста|безплат|за възрастни/iu)
  assert.deepEqual(auditCatalogueBatch([], batch.records, now), {
    readyForReview: [id], pending: [], rejected: [],
    notice: 'Schema and duplicate audit only. A reviewer must verify current first-party service, appointment, contact and address facts before explicitly importing any batch. Nothing is published automatically.',
  })
})

test('cleaning price and minutes stay absent rather than zero, fixed duration, market estimate or converted tariff', () => {
  const service = row.services[0]
  assert.equal(service.price, undefined)
  assert.equal(service.durationMin, undefined)
  assert.equal(service.durationSourceUrl, undefined)
  assert.match(service.description, /Цената, обхватът и часът се уточняват предварително с кабинета/u)
  assert.match(service.description, /няма публикувана сума за услугата/u)
  assert.match(service.description, /Последният възможен час за записване е 18:00/u)
  assert.doesNotMatch(service.description, /безплат|гарант|\d+\s*(?:€|евро|лв|минут)/iu)
})

test('actual owned appointment invitation remains phone booking; native request form is not an instant calendar', () => {
  assert.equal(row.website, site)
  assert.equal(row.phone, '+359884204080')
  assert.deepEqual(row.booking, { kind: 'phone', phone: row.phone })
  assert.equal(row.verification.booking.url, site)
  assert.equal(row.verification.booking.excerpt, 'Запишете час за преглед или процедура')
  assert.equal(row.verification.contact, contact)
  assert.equal(review.bookingEntry, 'phone')
  assert.equal(review.bookingReview, 'phone_booking_reviewed')
  assert.equal(review.manualIntakeResolution, undefined)
  for (const url of [site, contact, `${site}uslugi/`, procedure, `${site}dentalna-klinika/`, `${site}politika-za-zashtita-na-lichnite-danni/`]) assert.ok(review.reviewedUrls.includes(url), url)
  assert.match(review.notes, /actual homepage appointment invitation FIRST/u)
  assert.match(review.notes, /not a live calendar or GoRez availability/u)
  assert.match(review.notes, /full ten-section GDPR policy.*including all initially truncated middle text/u)
  assert.match(review.notes, /ordinary copyright is not a licence or legal clearance/u)
})

test('unpublished fee has an explicit fully inspected booking/service receipt and qualifies only as service_reviewed', () => {
  assert.equal(review.pricingDecision, 'not_publicly_listed')
  assert.equal(review.priceSearch.outcome, 'not_published')
  assert.equal(review.priceSearch.bookingUrl, site)
  assert.deepEqual(review.priceSearch.serviceUrls, [`${site}uslugi/`, procedure, contact, `${site}dentalna-klinika/`])
  assert.match(review.priceSearch.notes, /normal HTTP200 public GET.*not misrepresented as unpublished because inaccessible/u)
  assert.deepEqual(assessPricingReview(row, review, now), {
    id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-16', reviewedPriceCount: 0,
  })
  assert.equal(assessPricingReview(row, { ...review, priceSearch: undefined }, now).reason, 'explicit_unpublished_price_search_required')
  assert.equal(assessPricingReview(row, { ...review, pricingDecision: undefined }, now).reason, 'published_sourced_price_required')
  const changed = { ...row, services: [...row.services, { name: 'Непроверена допълнителна услуга', category: 'other', appointmentModel: 'appointment' }] }
  assert.equal(assessPricingReview(changed, review, now).reason, 'reviewed_service_inventory_changed')
})

test('owner weekdays09–19 keep last appointment18 separate, with unstated weekend absent and no free slots', () => {
  assert.deepEqual(row.openingHours, {
    days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
    sourceUrl: contact, checkedOn: '2026-11-16',
  })
  assert.equal(row.openingHours.days.some(day => day.weekday > 5), false)
  const detail = catalogueBusinessDetails(row, now)
  assert.equal(detail.hours.length, 5)
  assert.equal(detail.hoursSourceUrl, contact)
  assert.equal(detail.services[0].price, null)
  assert.equal(detail.services[0].durationMin, null)
  assert.ok(approvedCatalogueRecord(row, now))
  const expired = Date.parse('2027-02-15T00:00:00Z')
  assert.equal(approvedCatalogueRecord(row, expired), null)
  assert.equal(catalogueOnboardingDetail([row], id, { now: expired }), null)
})

test('isolated BG/EN partner search and detail share the exact premises and one service with blank fee/minutes', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: [row], now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(row.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    assert.deepEqual((await search.json()).businesses.map(item => [item.id, item.serviceCount, item.currentPriceCount]), [[id, 1, 0]])
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail([row], id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.address, row.address)
    assert.equal(draft.business.neighborhood, 'Борово')
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.business.phone, row.phone)
    assert.equal(draft.business.website, site)
    assert.equal(draft.serviceCount, 1)
    const service = draft.services[0]
    assert.equal(service.name, row.services[0].name)
    assert.equal(service.description, row.services[0].description)
    assert.equal(service.price, '')
    assert.equal(service.duration_min, '')
    assert.deepEqual(service.price_details, {})
    assert.equal(service.catalogueHint.priceLabel, undefined)
    assert.equal(service.catalogueHint.description, row.services[0].description)
  }
})

test('exact-quarter public discovery preserves one unpriced cleaning and phone route without fake distance, weekend or native availability', () => {
  const intent = { cityCode: '68134', neighborhood: 'Борово', category: 'other', browse: true, searchV2: true }
  const [result] = normalizeCatalogueBusinesses([row], intent, { now })
  assert.ok(result)
  assert.equal(result.id, id)
  assert.equal(result.neighborhood, 'Борово')
  assert.equal(result.address, row.address)
  assert.equal(result.coordinates, null)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(result, now), { kind: 'phone', href: 'tel:+359884204080' })
  assert.equal(result.details.services.length, 1)
  assert.equal(result.details.services[0].price, null)
  assert.equal(result.details.services[0].durationMin, null)
  assert.equal(result.details.services[0].description, row.services[0].description)
  assert.equal(result.details.hours.length, 5)
  assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Бъкстон' }, { now }), [])
  const [ranked] = rankCatalogueBusinesses([], [result], { ...intent, coordinates: { latitude: 42.66, longitude: 23.28 } })
  assert.equal(ranked.distanceKm, null)
})

test('one verified Borovo practice earns one other-category cell, not staff, service, adjacent-quarter or citywide copies', () => {
  const report = catalogueCoverageReport([row], { now })
  assert.equal(report.counts.approvedBusinesses, 1)
  assert.equal(report.counts.premises, 1)
  assert.equal(report.counts.serviceAreaProviders, 0)
  assert.equal(report.counts.businessCategoryIncidences, 1)
  const cells = [...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area => area.cells.filter(cell => cell.count > 0).map(cell => ({ neighborhood: area.name, ...cell })))
  assert.equal(cells.length, 1)
  assert.equal(cells[0].neighborhood, 'Борово')
  assert.equal(cells[0].categoryId, 'other')
  assert.deepEqual(cells[0].businessIds, [id])
  assert.equal(cells[0].gap, 49)
})

test('professional plaque/calculus cleaning automatically resolves the exact existing dental-cleaning photograph in BG and EN', async () => {
  const service = row.services[0]
  for (const locale of ['bg', 'en']) {
    const image = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, row) }, { business: row, locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.photoMatch, 'exact')
    assert.equal(image.src, '/service-photos/dental-cleaning-v1.webp')
    assert.ok(image.alt)
    assert.doesNotMatch(image.src, /notebook|appointment-workspace|neutral|child|generic/u)
    const data = await readFile(new URL(`../public${image.src}`, import.meta.url))
    assert.equal(data.subarray(0, 4).toString(), 'RIFF')
    assert.equal(data.subarray(8, 12).toString(), 'WEBP')
  }
})
