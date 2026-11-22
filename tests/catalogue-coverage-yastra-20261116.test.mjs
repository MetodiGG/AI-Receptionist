import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-yastra-20261116.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueBusinessDetails } from '../lib/discovery/business-details.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const site = 'https://yastra.dance/'
const schedule = `${site}index.php/bg/2021-04-19-11-01-29`
const contact = `${site}index.php/bg/2021-04-19-11-06-12`
const rows = validateCatalogue(batch.records)
const ids = rows.map(row => row.id)
// Isolated receipts only. Root binds the persisted normalized inventories.
const reviews = rows.map((row, index) => ({ ...batch.reviews[index], inventoryIdentity: pricingIdentity(row) }))

test('Yastra consists of two explicitly named halls of one operator, not teacher, level or neighbourhood clones', () => {
  assert.equal(rows.length, 2)
  assert.equal(batch.reviews.length, 2)
  assert.deepEqual(ids, ['sofia-yastra-lyulin9-masalitinov901-private-folk', 'sofia-yastra-lyulin10-mayski26-private-folk'])
  assert.deepEqual(rows.map(row => row.neighborhood), ['Люлин 9', 'Люлин 10'])
  assert.deepEqual(rows.map(row => row.address), [
    "София, ж.к. Люлин 9, ул. Николай Масалитинов, до бл. 901, зала My Soul's Place",
    'София, ж.к. Люлин 10, ул. Майски ден 26, ет. 2, зала Tancuvai.com',
  ])
  for (const row of rows) {
    assert.equal(row.locationKind, 'premises')
    assert.equal(row.cityCode, '68134')
    assert.equal(row.website, site)
    assert.equal(row.phone, '+359895672657')
    assert.equal(row.category, 'fitness')
    assert.equal(row.services.length, 1)
    assert.equal(row.services[0].name, 'Индивидуален урок по български народни танци')
    assert.equal(row.services[0].appointmentModel, 'individual_training')
    assert.equal(row.gorezBusinessId, undefined)
  }
})

test('the same owned schedule explicitly arranges individual lessons by phone, independently of generic Contact and empty event calendar', () => {
  for (const [index, row] of rows.entries()) {
    assert.deepEqual(row.booking, { kind: 'phone', phone: row.phone })
    assert.equal(row.verification.booking.url, schedule)
    assert.equal(row.verification.contact, contact)
    assert.match(row.verification.booking.excerpt, /индивидуални уроци по договаряне.*089 567 2657/u)
    const review = reviews[index]
    assert.equal(review.bookingEntry, 'phone')
    assert.equal(review.bookingReview, 'phone_booking_reviewed')
    assert.equal(review.manualIntakeResolution, undefined)
    for (const url of [site, schedule, contact, `${site}robots.txt`]) assert.ok(review.reviewedUrls.includes(url))
    assert.match(review.notes, /Today16November2026 and Calendar16–22November2026.*neither proves closure nor promises availability/u)
    assert.match(review.notes, /No separate Terms\/Privacy\/reuse-policy anchor/u)
    assert.match(review.notes, /not a licence or legal-clearance assertion/u)
  }
})

test('the selected individual lesson has a fresh unpriced receipt, not group fee, package, trial, guessed duration or exclusive1:1 guarantee', () => {
  for (const [index, row] of rows.entries()) {
    const service = row.services[0], review = reviews[index]
    assert.equal(service.price, undefined)
    assert.equal(service.durationMin, undefined)
    assert.equal(service.durationSourceUrl, undefined)
    assert.match(service.description, /Денят, часът и цената се уточняват предварително по телефона/u)
    assert.doesNotMatch(service.description, /\d+\s*(?:мин|час|евро|лв|€)|безплат|пакет|групов|ексклузив|1:1|гарант/iu)
    assert.equal(review.pricingDecision, 'not_publicly_listed')
    assert.equal(review.priceSearch.bookingUrl, schedule)
    assert.deepEqual(assessPricingReview(row, review, now), { id: row.id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-16', reviewedPriceCount: 0 })
    const price = { amount: 8, currency: 'BGN', kind: 'fixed', sourceUrl: schedule, checkedOn: '2026-11-16' }
    const changed = { ...row, services: [{ ...service, price }] }
    assert.equal(assessPricingReview(changed, review, now).reason, 'reviewed_service_inventory_changed')
    assert.equal(assessPricingReview(changed, { ...review, inventoryIdentity: pricingIdentity(changed) }, now).reason, 'unpublished_price_receipt_contains_prices')
    assert.equal(assessPricingReview(row, { ...review, priceSearch: undefined }, now).reason, 'explicit_unpublished_price_search_required')
  }
})

test('source preflight rejects duplicate operator-premises rows but not the distinct Tancuvai wedding teaching operator in the shared hall', () => {
  const existing = SOFIA_CATALOGUE.filter(row => !ids.includes(row.id))
  const result = auditCatalogueBatch(existing, batch.records, now)
  assert.deepEqual(result.readyForReview, ids)
  assert.deepEqual(result.pending, [])
  assert.deepEqual(result.rejected, [])
  const tancuvai = existing.find(row => row.id === 'sofia-tancuvai-lyulin10-wedding-lessons')
  assert.ok(tancuvai)
  assert.equal(tancuvai.neighborhood, 'Люлин 10')
  assert.equal(tancuvai.phone, '+359895481402')
  assert.notEqual(tancuvai.website, site)
  assert.notEqual(tancuvai.phone, rows[1].phone)
  const duplicate = { ...batch.records[0], id: 'sofia-yastra-copy-do-not-admit' }
  assert.deepEqual(auditCatalogueBatch(rows, [duplicate], now).rejected, [{ id: duplicate.id, reason: 'duplicate_identity' }])
})

test('no point, distance, opening hours, duration or native slots are invented from suggested lesson starts or map viewport', () => {
  for (const row of rows) {
    assert.equal(row.coordinates, null)
    assert.equal(catalogueBoundCoordinates(row), null)
    assert.equal(row.openingHours, undefined)
    const details = catalogueBusinessDetails(row, now)
    assert.deepEqual(details.hours, [])
    assert.equal(details.services[0].price, null)
    assert.equal(details.services[0].durationMin, null)
    const intent = { cityCode: '68134', neighborhood: row.neighborhood, category: 'fitness', browse: true, searchV2: true }
    const [result] = normalizeCatalogueBusinesses(rows, intent, { now })
    assert.equal(result.id, row.id)
    assert.equal(result.coordinates, null)
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    assert.deepEqual(railExternalAction(result, now), { kind: 'phone', href: 'tel:+359895672657' })
    const [ranked] = rankCatalogueBusinesses([], [result], { ...intent, coordinates: { latitude: 42.72, longitude: 23.27 } })
    assert.equal(ranked.distanceKm, null)
  }
})

test('BG and EN shared onboarding expose each exact hall and negotiated lesson with blank price and duration', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: rows, now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent('Ястра')}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    const results = (await search.json()).businesses
    assert.deepEqual(new Set(results.map(item => item.id)), new Set(ids))
    assert.ok(results.every(item => item.serviceCount === 1 && item.currentPriceCount === 0))
  }
  for (const locale of ['bg', 'en']) for (const row of rows) {
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${row.id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail(rows, row.id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.neighborhood, row.neighborhood)
    assert.equal(draft.business.address, row.address)
    assert.equal(draft.business.phone, row.phone)
    assert.equal(draft.business.website, site)
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.serviceCount, 1)
    assert.ok(draft.services.every(service => service.price === ''))
    assert.equal(draft.services[0].name, row.services[0].name)
    assert.equal(draft.services[0].price, '')
    assert.equal(draft.services[0].duration_min, '')
    assert.equal(draft.services[0].description, row.services[0].description)
  }
})

test('public quarter and category filtering keeps each hall local and expiry removes both without legacy refresh', () => {
  for (const row of rows) {
    const intent = { cityCode: '68134', neighborhood: row.neighborhood, category: 'fitness', browse: true, searchV2: true }
    assert.deepEqual(normalizeCatalogueBusinesses(rows, intent, { now }).map(item => item.id), [row.id])
    assert.deepEqual(normalizeCatalogueBusinesses(rows, { ...intent, category: 'education' }, { now }), [])
    assert.ok(approvedCatalogueRecord(row, now))
    const expired = Date.parse('2027-02-15T00:00:00Z')
    assert.equal(approvedCatalogueRecord(row, expired), null)
    assert.equal(catalogueOnboardingDetail(rows, row.id, { now: expired }), null)
  }
  assert.deepEqual(normalizeCatalogueBusinesses(rows, { cityCode: '68134', neighborhood: 'Обеля 1', category: 'fitness', browse: true, searchV2: true }, { now }), [])
})

test('the two verified premises earn one exact sport cell each, without neighbouring or teacher multiplication', () => {
  const report = catalogueCoverageReport(rows, { now, target: 50 })
  assert.equal(report.counts.approvedBusinesses, 2)
  assert.equal(report.counts.premises, 2)
  assert.equal(report.counts.serviceAreaProviders, 0)
  assert.equal(report.counts.businessCategoryIncidences, 2)
  const cells = [...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area => area.cells.filter(cell => cell.count > 0).map(cell => ({ neighborhood: area.name, ...cell })))
  assert.equal(cells.length, 2)
  for (const row of rows) {
    const cell = cells.find(item => item.neighborhood === row.neighborhood)
    assert.equal(cell.categoryId, 'fitness')
    assert.equal(cell.count, 1)
    assert.equal(cell.gap, 49)
    assert.deepEqual(cell.businessIds, [row.id])
  }
})

test('both selected folk lessons use the specifically approved private folk-lesson asset in BG and EN, not boxing, group or notebook imagery', async () => {
  for (const row of rows) for (const locale of ['bg', 'en']) {
    const service = row.services[0], fields = catalogueServicePhotoFields(service, row)
    assert.deepEqual(fields, { illustrativePhotoKey: 'sx-bulgarian-folk-private-lesson' })
    const image = serviceThumbnail({ ...service, ...fields }, { business: row, locale })
    assert.equal(image.type, 'photo')
    // This existing registry asset is classified as activity; pin the reviewed
    // ID and exact source, not a different fallback or a new match taxonomy.
    assert.equal(image.photoMatch, 'activity')
    assert.equal(image.src, '/service-photos/sx-bulgarian-folk-private-lesson-v1.webp')
    assert.ok(image.alt)
    assert.doesNotMatch(image.src, /group|boxing|notebook|neutral|appointment-workspace/u)
  }
  const data = await readFile(new URL('../public/service-photos/sx-bulgarian-folk-private-lesson-v1.webp', import.meta.url))
  assert.equal(data.subarray(0, 4).toString(), 'RIFF')
  assert.equal(data.subarray(8, 12).toString(), 'WEBP')
})
