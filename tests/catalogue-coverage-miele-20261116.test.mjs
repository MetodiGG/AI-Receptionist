import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-miele-20261116.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueBusinessDetails, currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { specificServicePhotoKey } from '../lib/specific-service-photo-ids.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const id = 'sofia-miele-servisbg-home-diagnostic'
const site = 'https://mieleservisbg.com/', book = `${site}zashto-da-izberete-nas/`, tariff = `${site}услуги/`
const [row] = validateCatalogue(batch.records)
const review = { ...batch.reviews[0], inventoryIdentity: pricingIdentity(row) }

test('Miele is exactly one schema-valid home-visit identity, not a retail shop, local workshop or one business per quarter', () => {
  assert.equal(batch.records.length, 1)
  assert.equal(batch.reviews.length, 1)
  assert.equal(row.id, id)
  assert.equal(row.name, 'MieleServisBG · СТАНИ 83')
  assert.equal(row.cityCode, '68134')
  assert.equal(row.category, 'home_services')
  assert.equal(row.locationKind, 'service_area')
  assert.equal(row.address, null)
  assert.equal(row.neighborhood, null)
  assert.equal(row.coordinates, null)
  assert.equal(catalogueBoundCoordinates(row), null)
  assert.equal(row.openingHours, undefined)
  assert.equal(row.gorezBusinessId, undefined)
  assert.equal(row.services.length, 1)
  assert.equal(row.services[0].appointmentModel, 'home_visit')
  assert.throws(() => validateCatalogue([{ ...batch.records[0], shopAddress: 'Надежда 1, бл. 173' }]), /Unrecognized key/u)
})

test('the literal fixed40EUR fee is a Sofia out-of-warranty Miele visit plus diagnosis, never a full repair or parts price', () => {
  const service = row.services[0]
  assert.equal(service.name, 'Посещение и диагностика на извънгаранционен уред Miele')
  assert.equal(service.category, 'home_services')
  assert.deepEqual(service.price, {
    amount: 40, currency: 'EUR', kind: 'fixed', unit: 'посещение с диагностика',
    sourceUrl: tariff, checkedOn: '2026-11-16', validUntil: '2027-02-14',
  })
  assert.match(service.description, /на адрес в София/u)
  assert.match(service.description, /извънгаранционен уред Miele/u)
  assert.match(service.description, /не за цял ремонт или резервни части/u)
  assert.match(service.description, /Обадете се първо с модела и проблема/u)
  assert.doesNotMatch(service.description, /безплат|оторизиран|официален|гарантиран|\d+\s*мин/iu)
  assert.equal(service.durationMin, undefined)
  assert.equal(service.durationSourceUrl, undefined)
  assert.ok(row.services.every(item => !/монтаж|качване|продажба|филтър|сушилня за продажба|финанс/iu.test(item.name)))
})

test('same-owner FAQ servicing instructions preserve the exact service phone rather than retail orders or an invented booking form', () => {
  assert.equal(row.website, site)
  assert.equal(row.phone, '+359888105240')
  assert.deepEqual(row.booking, { kind: 'phone', phone: row.phone })
  assert.equal(row.verification.booking.url, book)
  assert.equal(row.verification.contact, `${site}kontakti-i-magazin/`)
  assert.match(row.verification.booking.excerpt, /0888 105 240.*модел.*проблем/u)
  assert.equal(new URL(book).hostname, new URL(site).hostname)
  assert.ok(review.reviewedUrls.includes(book))
  assert.ok(review.reviewedUrls.includes(tariff))
  assert.ok(review.reviewedUrls.includes(row.verification.contact))
  assert.equal(review.bookingEntry, 'phone')
  assert.equal(review.bookingReview, 'phone_booking_reviewed')
  assert.equal(review.pricingDecision, undefined)
})

test('a fresh isolated pricing receipt binds the one actual tariff and rejects changed inventory without touching persisted identities', () => {
  assert.deepEqual(assessPricingReview(row, review, now), {
    id, state: 'reviewed', checkedOn: '2026-11-16', reviewedPriceCount: 1,
  })
  const changed = { ...row, services: [{ ...row.services[0], price: { ...row.services[0].price, amount: 25 } }] }
  assert.equal(assessPricingReview(changed, review, now).reason, 'reviewed_service_inventory_changed')
  assert.equal(assessPricingReview(row, { ...review, pricingDecision: 'not_publicly_listed' }, now).reason, 'unpublished_price_receipt_contains_prices')
  assert.equal(assessPricingReview(row, { ...review, pricingDecision: 'hold_conflicting_sources' }, now).reason, 'conflicting_published_prices_require_owner_confirmation')
})

test('the dated listing and selected tariff expire, without substituting shop hours, travel times or duration', () => {
  assert.ok(approvedCatalogueRecord(row, now))
  assert.ok(currentPublishedFact(row.services[0].price, now))
  const expired = Date.parse('2027-02-15T00:00:00Z')
  assert.equal(approvedCatalogueRecord(row, expired), null)
  assert.equal(currentPublishedFact(row.services[0].price, expired), false)
  assert.equal(catalogueOnboardingDetail([row], id, { now: expired }), null)
  assert.equal(approvedCatalogueRecord({ ...row, verification: { ...row.verification, status: 'draft' } }, now), null)
  assert.deepEqual(catalogueBusinessDetails(row, now).hours, [])
  assert.equal(catalogueBusinessDetails(row, now).hoursSourceUrl, null)
})

test('BG and EN isolated partner lookup/import preserve one qualified40EUR service and never prefill the unrelated shop address or schedule', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: [row], now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(row.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    assert.deepEqual((await search.json()).businesses.map(item => [item.id, item.serviceCount, item.currentPriceCount]), [[id, 1, 1]])
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail([row], id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.address, null)
    assert.equal(draft.business.neighborhood, null)
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.business.phone, row.phone)
    assert.equal(draft.business.website, site)
    assert.equal(draft.serviceCount, 1)
    assert.equal(draft.services[0].name, row.services[0].name)
    assert.equal(draft.services[0].price, '40')
    assert.equal(draft.services[0].currency, 'EUR')
    assert.equal(draft.services[0].duration_min, '')
    assert.deepEqual(draft.services[0].price_details, { kind: 'fixed', unit: 'посещение с диагностика' })
    assert.equal(draft.services[0].description, row.services[0].description)
    assert.equal(draft.services[0].catalogueHint.description, row.services[0].description)
    assert.match(draft.services[0].catalogueHint.priceLabel, /посещение с диагностика/u)
  }
})

test('isolated public discovery offers a phone request with the qualified tariff, no native slots or fabricated nearby distance', () => {
  const intent = { cityCode: '68134', category: 'home_services', browse: true, searchV2: true }
  const [result] = normalizeCatalogueBusinesses([row], intent, { now })
  assert.ok(result)
  assert.equal(result.id, id)
  assert.equal(result.locationKind, 'service_area')
  assert.equal(result.neighborhood, null)
  assert.equal(result.address, null)
  assert.equal(result.coordinates, null)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(result, now), { kind: 'phone', href: 'tel:+359888105240' })
  const detail = result.details.services[0]
  assert.equal(detail.price, 40)
  assert.equal(detail.currency, 'EUR')
  assert.equal(detail.priceKind, 'fixed')
  assert.equal(detail.priceUnit, 'посещение с диагностика')
  assert.equal(detail.description, row.services[0].description)
  assert.equal(detail.durationMin, null)
  assert.deepEqual(result.details.hours, [])
  const ranked = rankCatalogueBusinesses([], [result], { ...intent, coordinates: { latitude: 42.7, longitude: 23.3 } })
  assert.equal(ranked.length, 1)
  assert.equal(ranked[0].distanceKm, null)
})

test('the mobile provider is counted once separately and earns zero physical-neighborhood or unknown-premises quota credit', () => {
  const report = catalogueCoverageReport([row], { now })
  assert.equal(report.counts.sourceRecords, 1)
  assert.equal(report.counts.approvedBusinesses, 1)
  assert.equal(report.counts.serviceAreaProviders, 1)
  assert.equal(report.counts.premises, 0)
  assert.equal(report.counts.missingNeighborhoodPremises, 0)
  assert.equal(report.counts.businessCategoryIncidences, 0)
  assert.deepEqual(report.serviceAreaProviders.map(item => item.id), [id])
  assert.ok([...report.neighborhoods, ...report.additionalNamedAreas].every(area => area.distinctPremises === 0 && area.cells.every(cell => cell.count === 0)))
  const home = report.categories.find(category => category.id === 'home_services')
  assert.equal(home.businesses, 1)
  assert.equal(home.serviceAreaProviders, 1)
  assert.equal(home.premises, 0)
})

test('the existing explicitly bound diagnostic artwork is available without introducing a semantic notebook fallback or changing mappings', async () => {
  const key = 'sx-home-appliance-diagnose'
  assert.equal(specificServicePhotoKey(key), key)
  for (const locale of ['bg', 'en']) {
    // Exercise the candidate asset in isolation. Root owns visual approval and
    // the exact business/service association; this test edits neither registry.
    const image = serviceThumbnail({ ...row.services[0], illustrativePhotoKey: key }, { business: row, locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.src, `/service-photos/${key}-v1.webp`)
    assert.equal(image.photoMatch, 'activity')
    assert.ok(image.alt)
    assert.doesNotMatch(image.src, /notebook|appointment-workspace|neutral|washer-repair/u)
  }
  const data = await readFile(new URL('../public/service-photos/sx-home-appliance-diagnose-v1.webp', import.meta.url))
  assert.equal(data.subarray(0, 4).toString(), 'RIFF')
  assert.equal(data.subarray(8, 12).toString(), 'WEBP')
})
