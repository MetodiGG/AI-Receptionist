import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-arholl-20261116.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueBusinessDetails, currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const id = 'sofia-arholl-arena-obelya1-124-reformer'
const site = 'https://arholl-arena.bg/', book = `${site}service/reformer-pilates`, tariff = `${site}prices`
const [row] = validateCatalogue(batch.records)
// Isolated review only; root binds the actual persisted normalized identity.
const review = { ...batch.reviews[0], inventoryIdentity: pricingIdentity(row) }

test('Arholl admits one exact Obelya1 premises with one reserved instructor Reformer visit, not staff, gym entry or other activities', () => {
  assert.equal(batch.records.length, 1)
  assert.equal(batch.reviews.length, 1)
  assert.equal(row.id, id)
  assert.equal(row.name, 'Arholl Arena · Обеля 1')
  assert.equal(row.cityCode, '68134')
  assert.equal(row.neighborhood, 'Обеля 1')
  assert.equal(row.address, 'София, ж.к. Обеля 1, бл. 124, комплекс Архолл Парк')
  assert.equal(row.locationKind, 'premises')
  assert.equal(row.coordinates, null)
  assert.equal(catalogueBoundCoordinates(row), null)
  assert.equal(row.gorezBusinessId, undefined)
  assert.equal(row.category, 'fitness')
  assert.equal(row.services.length, 1)
  assert.equal(row.services[0].name, 'Reformer Pilates · еднократно посещение с инструктор')
  assert.equal(row.services[0].appointmentModel, 'individual_training')
  assert.doesNotMatch(row.services[0].name, /двама|групов|абонамент|месец|фитнес карта|йога|солна|терапия|кинези|масаж/iu)
  assert.deepEqual(auditCatalogueBatch([], batch.records, now), {
    readyForReview: [id], pending: [], rejected: [],
    notice: 'Schema and duplicate audit only. A reviewer must verify current first-party service, appointment, contact and address facts before explicitly importing any batch. Nothing is published automatically.',
  })
})

test('literal20EUR is one single-person visit with instructor work, not half a duet, divided package, private1:1 guarantee or fixed minutes', () => {
  const service = row.services[0]
  assert.equal(service.category, 'fitness')
  assert.deepEqual(service.price, {
    amount: 20, currency: 'EUR', kind: 'fixed', unit: 'еднократно посещение за един човек',
    sourceUrl: tariff, checkedOn: '2026-11-16', validUntil: '2027-02-14',
  })
  assert.match(service.description, /за един човек/u)
  assert.match(service.description, /индивидуална работа с инструктор/u)
  assert.match(service.description, /Денят, часът и инструкторът се уточняват предварително по телефона/u)
  assert.match(service.description, /Работното време е на клуба, не график за свободни часове/u)
  assert.doesNotMatch(service.description, /ексклузив|частен|1:1|1\s*към\s*1|безплат|гарант|лечение|отслабване|\d+\s*мин/iu)
  assert.equal(service.durationMin, undefined)
  assert.equal(service.durationSourceUrl, undefined)
})

test('the owned named-service phone appointment stays independent from subscription purchase and ephemeral group slots', () => {
  assert.equal(row.website, site)
  assert.equal(row.phone, '+359889758011')
  assert.deepEqual(row.booking, { kind: 'phone', phone: row.phone })
  assert.equal(row.verification.booking.url, book)
  assert.equal(row.verification.contact, `${site}contacts`)
  assert.match(row.verification.booking.excerpt, /Reformer Pilates.*0889 758 011.*час при инструктор/u)
  assert.equal(review.bookingEntry, 'phone')
  assert.equal(review.bookingReview, 'phone_booking_reviewed')
  assert.equal(review.pricingDecision, undefined)
  const notes = review.notes
  assert.match(notes, /human source attestation.*not automated verification/u)
  assert.match(notes, /visible16–29November2026 window.*IN THAT WINDOW ONLY/u)
  assert.match(notes, /not a blanket assertion about other dates/u)
  assert.match(notes, /EXACT single-Reformer price card Buy href/u)
  assert.match(notes, /subscriptions including Reformer8visits and8visitsfor2, but no single-Reformer option/u)
  assert.match(notes, /All inputs and auto-today value remained untouched/u)
  assert.match(notes, /cookie policy was read to EOF/u)
  assert.ok(review.reviewedUrls.some(url => url.includes('/Schedulev2/EmbedGroupScheduleV2?')))
  assert.ok(review.reviewedUrls.some(url => url.includes('/membership/PurchaseV2?')))
  for (const url of [site, book, tariff, `${site}contacts`, `${site}page/obshchi-usloviya-biskvitki`]) assert.ok(review.reviewedUrls.includes(url), url)
})

test('isolated numerical source review is fresh and exact-inventory-bound without a manual-host or unpublished-price bypass', () => {
  assert.deepEqual(assessPricingReview(row, review, now), { id, state: 'reviewed', checkedOn: '2026-11-16', reviewedPriceCount: 1 })
  assert.equal(review.manualIntakeResolution, undefined)
  const changed = { ...row, services: [{ ...row.services[0], price: { ...row.services[0].price, amount: 15 } }] }
  assert.equal(assessPricingReview(changed, review, now).reason, 'reviewed_service_inventory_changed')
  assert.equal(assessPricingReview(row, { ...review, pricingDecision: 'not_publicly_listed' }, now).reason, 'unpublished_price_receipt_contains_prices')
  assert.equal(assessPricingReview(row, { ...review, pricingDecision: 'hold_conflicting_sources' }, now).reason, 'conflicting_published_prices_require_owner_confirmation')
})

test('club opening hours retain the exact Contact schedule without producing free slots, instructor hours or duration', () => {
  assert.deepEqual(row.openingHours, {
    days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '07:00', close: '22:00' }] })),
      ...[6, 7].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '21:00' }] }))],
    sourceUrl: `${site}contacts`, checkedOn: '2026-11-16',
  })
  const detail = catalogueBusinessDetails(row, now)
  assert.equal(detail.hours.length, 7)
  assert.equal(detail.hoursSourceUrl, `${site}contacts`)
  assert.equal(detail.services[0].durationMin, null)
  assert.ok(approvedCatalogueRecord(row, now))
  assert.ok(currentPublishedFact(row.services[0].price, now))
  const expired = Date.parse('2027-02-15T00:00:00Z')
  assert.equal(approvedCatalogueRecord(row, expired), null)
  assert.equal(currentPublishedFact(row.services[0].price, expired), false)
  assert.equal(catalogueOnboardingDetail([row], id, { now: expired }), null)
})

test('isolated BG and EN onboarding preserve the exact one-person fee/unit, qualifications and actual premises with blank duration', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: [row], now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(row.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    assert.deepEqual((await search.json()).businesses.map(item => [item.id, item.serviceCount, item.currentPriceCount]), [[id, 1, 1]])
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail([row], id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.address, row.address)
    assert.equal(draft.business.neighborhood, 'Обеля 1')
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.business.phone, row.phone)
    assert.equal(draft.business.website, site)
    assert.equal(draft.serviceCount, 1)
    const service = draft.services[0]
    assert.equal(service.name, row.services[0].name)
    assert.equal(service.price, '20')
    assert.equal(service.currency, 'EUR')
    assert.equal(service.duration_min, '')
    assert.deepEqual(service.price_details, { kind: 'fixed', unit: 'еднократно посещение за един човек' })
    assert.equal(service.description, row.services[0].description)
    assert.equal(service.catalogueHint.description, row.services[0].description)
    assert.match(service.catalogueHint.priceLabel, /еднократно посещение за един човек/u)
  }
})

test('isolated exact-quarter public discovery preserves phone booking and qualified20EUR with no native slots or guessed distance', () => {
  const intent = { cityCode: '68134', neighborhood: 'Обеля 1', category: 'fitness', browse: true, searchV2: true }
  const [result] = normalizeCatalogueBusinesses([row], intent, { now })
  assert.ok(result)
  assert.equal(result.id, id)
  assert.equal(result.neighborhood, 'Обеля 1')
  assert.equal(result.address, row.address)
  assert.equal(result.coordinates, null)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(result, now), { kind: 'phone', href: 'tel:+359889758011' })
  assert.equal(result.details.services.length, 1)
  assert.equal(result.details.services[0].price, 20)
  assert.equal(result.details.services[0].priceUnit, 'еднократно посещение за един човек')
  assert.equal(result.details.services[0].description, row.services[0].description)
  assert.equal(result.details.services[0].durationMin, null)
  assert.equal(result.details.hours.length, 7)
  assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Обеля 2' }, { now }), [])
  assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, category: 'education' }, { now }), [])
  const [ranked] = rankCatalogueBusinesses([], [result], { ...intent, coordinates: { latitude: 42.74, longitude: 23.26 } })
  assert.equal(ranked.distanceKm, null)
})

test('the premises earns exactly one physical Obelya1 sport cell, without teacher, service, adjacent-quarter or citywide multiplication', () => {
  const report = catalogueCoverageReport([row], { now, target: 50 })
  assert.equal(report.counts.approvedBusinesses, 1)
  assert.equal(report.counts.premises, 1)
  assert.equal(report.counts.serviceAreaProviders, 0)
  assert.equal(report.counts.missingNeighborhoodPremises, 0)
  assert.equal(report.counts.businessCategoryIncidences, 1)
  const cells = [...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area => area.cells.filter(cell => cell.count > 0).map(cell => ({ neighborhood: area.name, ...cell })))
  assert.equal(cells.length, 1)
  assert.equal(cells[0].neighborhood, 'Обеля 1')
  assert.equal(cells[0].categoryId, 'fitness')
  assert.deepEqual(cells[0].businessIds, [id])
  assert.equal(cells[0].count, 1)
  assert.equal(cells[0].gap, 49)
})

test('the exact existing Reformer Pilates photo resolves automatically in BG and EN without a new override or neutral notebook', async () => {
  const service = row.services[0]
  const fields = catalogueServicePhotoFields(service, row)
  assert.deepEqual(fields, {})
  for (const locale of ['bg', 'en']) {
    const image = serviceThumbnail({ ...service, ...fields }, { business: row, locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.photoMatch, 'exact')
    assert.equal(image.src, '/service-photos/reformer-pilates-v1.webp')
    assert.ok(image.alt)
    assert.doesNotMatch(image.src, /notebook|appointment-workspace|neutral|generic|gym-entry/u)
  }
  const data = await readFile(new URL('../public/service-photos/reformer-pilates-v1.webp', import.meta.url))
  assert.equal(data.subarray(0, 4).toString(), 'RIFF')
  assert.equal(data.subarray(8, 12).toString(), 'WEBP')
})
