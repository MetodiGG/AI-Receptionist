import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-monika-20261116.mjs'
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
const id = 'sofia-monika-hristova-lagera53'
const site = 'https://semeino-konsultirane.bg/', contact = `${site}kontakti/`
const individual = `${site}individualna-terapiya/`, couples = `${site}terapiya-za-dvoiki/`, faq = `${site}vaprosi/`
const [row] = validateCatalogue(batch.records)
// Test-local binding only. Persisted review/hash and admission belong to root.
const review = { ...batch.reviews[0], inventoryIdentity: pricingIdentity(row) }

test('Monika is one owner-stated Lagera private psychotherapy practice with exactly two literal service titles and existing psychology category', () => {
  assert.equal(batch.records.length, 1)
  assert.equal(batch.reviews.length, 1)
  assert.equal(row.id, id)
  assert.equal(row.name, 'Моника Христова · семеен психотерапевт')
  assert.equal(row.cityCode, '68134')
  assert.equal(row.neighborhood, 'Лагера')
  assert.equal(row.address, 'София, ж.к. Лагера, бл. 53, вх. Г')
  assert.equal(row.locationKind, 'premises')
  assert.equal(row.category, 'other')
  assert.deepEqual(row.services.map(service => service.name), ['Индивидуална терапия', 'Терапия за двойки'])
  for (const service of row.services) {
    assert.equal(service.category, 'other')
    assert.equal(service.appointmentModel, 'appointment')
    assert.doesNotMatch(service.name, /дет|груп|онлайн|диагно|изслед|тест|психиатр|лечение|лекар|курс|пакет/iu)
    assert.doesNotMatch(service.description, /гарант|излекув|диагноза|рецепта|безплат|резултат|медицинск/iu)
  }
  assert.deepEqual(auditCatalogueBatch([], batch.records, now), {
    readyForReview: [id], pending: [], rejected: [],
    notice: 'Schema and duplicate audit only. A reviewer must verify current first-party service, appointment, contact and address facts before explicitly importing any batch. Nothing is published automatically.',
  })
})

test('unknown fees and each selected-service duration remain absent instead of expanding the family FAQ60minute scope or weekly frequency', () => {
  for (const service of row.services) {
    assert.equal(service.price, undefined)
    assert.equal(service.durationMin, undefined)
    assert.equal(service.durationSourceUrl, undefined)
    assert.equal(service.durationCheckedOn, undefined)
    assert.match(service.description, /Цената и продължителността се уточняват при записване/u)
    assert.match(service.description, /няма публикувана сума за услугата/u)
    assert.doesNotMatch(service.description, /\d+\s*(?:€|евро|лв|минут)|веднъж седмично|две седмици/iu)
  }
  assert.match(review.notes, /Original research010 proposed60minutes.*integration deliberately omits both durations/u)
  assert.match(review.notes, /not expanded by assumption/u)
  assert.match(review.notes, /usual weekly\/fortnightly frequency is not opening hours/u)
})

test('actual native Contact explicitly invites phone appointments, not an inquiry-only form or imaginary external calendar', () => {
  assert.equal(row.website, site)
  assert.equal(row.phone, '+359878908731')
  assert.deepEqual(row.booking, { kind: 'phone', phone: row.phone })
  assert.equal(row.verification.booking.url, contact)
  assert.equal(row.verification.booking.excerpt, 'За записване на час.')
  assert.equal(row.verification.contact, contact)
  assert.equal(review.bookingEntry, 'phone')
  assert.equal(review.bookingReview, 'phone_booking_reviewed')
  assert.equal(review.manualIntakeResolution, undefined)
  for (const url of [site, contact, individual, couples, faq, `${site}za-men/`, `${site}privacy-policy/`]) assert.ok(review.reviewedUrls.includes(url), url)
  assert.match(review.notes, /not a crawler signal, root admission or production verification/u)
  assert.match(review.notes, /Contact\/phone appointment route FIRST/u)
  assert.match(review.notes, /fourteen-section actual linked privacy policy dated20August2026 readHTTP200/u)
  assert.match(review.notes, /not a licence or legal-clearance claim/u)
})

test('explicit complete owner tariff search permits only service_reviewed with exact two-service inventory, never a completed price review', () => {
  assert.equal(review.pricingDecision, 'not_publicly_listed')
  assert.equal(review.priceSearch.outcome, 'not_published')
  assert.equal(review.priceSearch.bookingUrl, contact)
  assert.deepEqual(review.priceSearch.serviceUrls, [individual, couples, faq, `${site}semejna-konsultacziya/`, `${site}psiholog/`])
  assert.match(review.priceSearch.notes, /title mentions prices but its full content has no amount/u)
  assert.match(review.priceSearch.notes, /no separate price page or unread external menu/u)
  assert.deepEqual(assessPricingReview(row, review, now), {
    id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-16', reviewedPriceCount: 0,
  })
  assert.equal(assessPricingReview(row, { ...review, priceSearch: undefined }, now).reason, 'explicit_unpublished_price_search_required')
  assert.equal(assessPricingReview(row, { ...review, pricingDecision: undefined }, now).reason, 'published_sourced_price_required')
  const changed = { ...row, services: [{ ...row.services[0], durationMin: 60, durationSourceUrl: faq, durationCheckedOn: '2026-11-16' }, row.services[1]] }
  assert.equal(assessPricingReview(changed, review, now).reason, 'reviewed_service_inventory_changed')
})

test('one exact owner office has no invented coordinates, street, opening hours, branch or availability', () => {
  assert.equal(row.coordinates, null)
  assert.equal(catalogueBoundCoordinates(row), null)
  assert.equal(row.openingHours, undefined)
  assert.equal(row.gorezBusinessId, undefined)
  const detail = catalogueBusinessDetails(row, now)
  assert.deepEqual(detail.hours, [])
  assert.equal(detail.hoursSourceUrl, null)
  assert.ok(detail.services.every(service => service.price === null && service.durationMin === null))
  assert.ok(approvedCatalogueRecord(row, now))
  const expired = Date.parse('2027-02-15T00:00:00Z')
  assert.equal(approvedCatalogueRecord(row, expired), null)
  assert.equal(catalogueOnboardingDetail([row], id, { now: expired }), null)
})

test('isolated BG/EN onboarding find the full practice name and import both therapy services with exact qualifications and blank fee/minutes', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: [row], now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(row.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    assert.deepEqual((await search.json()).businesses.map(item => [item.id, item.serviceCount, item.currentPriceCount]), [[id, 2, 0]])
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail([row], id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.address, row.address)
    assert.equal(draft.business.neighborhood, 'Лагера')
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.business.phone, row.phone)
    assert.equal(draft.business.website, site)
    assert.equal(draft.serviceCount, 2)
    draft.services.forEach((service, index) => {
      assert.equal(service.name, row.services[index].name)
      assert.equal(service.description, row.services[index].description)
      assert.equal(service.price, '')
      assert.equal(service.duration_min, '')
      assert.deepEqual(service.price_details, {})
      assert.equal(service.catalogueHint.priceLabel, undefined)
      assert.equal(service.catalogueHint.description, row.services[index].description)
    })
  }
})

test('exact Lagera public discovery retains both services and phone action with no guessed distance or native slots', () => {
  const intent = { cityCode: '68134', neighborhood: 'Лагера', category: 'other', browse: true, searchV2: true }
  const [result] = normalizeCatalogueBusinesses([row], intent, { now })
  assert.ok(result)
  assert.equal(result.id, id)
  assert.equal(result.neighborhood, 'Лагера')
  assert.equal(result.address, row.address)
  assert.equal(result.coordinates, null)
  assert.deepEqual(result.details.services.map(service => service.name), row.services.map(service => service.name))
  assert.ok(result.details.services.every(service => service.price === null && service.durationMin === null))
  assert.deepEqual(result.details.hours, [])
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(result, now), { kind: 'phone', href: 'tel:+359878908731' })
  assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Хиподрума' }, { now }), [])
  const [ranked] = rankCatalogueBusinesses([], [result], { ...intent, coordinates: { latitude: 42.68, longitude: 23.29 } })
  assert.equal(ranked.distanceKm, null)
})

test('two therapy services at one Lagera office contribute exactly one real other-category coverage option', () => {
  const report = catalogueCoverageReport([row], { now, target: 50 })
  assert.equal(report.counts.approvedBusinesses, 1)
  assert.equal(report.counts.premises, 1)
  assert.equal(report.counts.serviceAreaProviders, 0)
  assert.equal(report.counts.businessCategoryIncidences, 1)
  const cells = [...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area => area.cells.filter(cell => cell.count > 0).map(cell => ({ neighborhood: area.name, ...cell })))
  assert.equal(cells.length, 1)
  assert.equal(cells[0].neighborhood, 'Лагера')
  assert.equal(cells[0].categoryId, 'other')
  assert.deepEqual(cells[0].businessIds, [id])
  assert.equal(cells[0].count, 1)
  assert.equal(cells[0].gap, 49)
})

test('individual and couple therapy resolve separate existing activity-specific consultation photos, not family/child or neutral artwork', async () => {
  const expected = ['psychology-consultation', 'couples-counselling']
  for (const locale of ['bg', 'en']) for (const [index, service] of row.services.entries()) {
    const image = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, row) }, { business: row, locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.photoMatch, 'activity')
    assert.equal(image.src, `/service-photos/${expected[index]}-v1.webp`)
    assert.ok(image.alt)
    assert.doesNotMatch(image.src, /notebook|appointment-workspace|neutral|family-counselling|child|online/u)
    const data = await readFile(new URL(`../public${image.src}`, import.meta.url))
    assert.equal(data.subarray(0, 4).toString(), 'RIFF')
    assert.equal(data.subarray(8, 12).toString(), 'WEBP')
  }
})
