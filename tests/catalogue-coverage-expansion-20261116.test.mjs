import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { SOFIA_CATALOGUE as liveCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { COVERAGE_20261116_RECORDS as additions, COVERAGE_20261116_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-coverage-20261116.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueCoverageReport, coverageNeighborhood } from '../scripts/catalogue-coverage-report.mjs'
import { searchCatalogueForOnboarding, catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { arhollPricePriorCatalogue } from './catalogue-arholl-reformer-price-refresh-20261127-scope.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const SOFIA_CATALOGUE = arhollPricePriorCatalogue(liveCatalogue)
const ids = new Set(additions.map(row => row.id))
const record = id => SOFIA_CATALOGUE.find(row => row.id === id)
const receipt = id => reviews.find(row => row.id === id)
const historicalBaselines = {
  'lib/discovery/catalogue-data/pricing-review-baseline-20261110.json': '6b9fd46f3b1d030894b82e7561705aa5aa2a5837b69641c88d58f9f72ab52b53',
  'docs/catalogue-pricing/expansion-baseline-20261111.json': '11eb9aed9746852dcf943b61da59baebc650b107e462caf8b401673b92f1d541',
  'docs/catalogue-pricing/expansion-baseline-20261113.json': '5790d08b2daa5a63af36cbd692aab0ebfd5342ce0fdfa2563d9f3d838d845b67',
}

test('coverage-first batches add only distinct, schema-valid and source-reviewed Sofia businesses', () => {
  assert.ok(additions.length > 0)
  assert.equal(ids.size, additions.length)
  assert.equal(reviews.length, additions.length)
  assert.equal(new Set(reviews.map(row => row.id)).size, additions.length)
  assert.deepEqual([...new Set(reviews.map(row => row.id))].sort(), [...ids].sort())
  assert.equal(validateCatalogue(additions).length, additions.length)
  const audit = auditCatalogueBatch(SOFIA_CATALOGUE.filter(row => !ids.has(row.id)), additions, now)
  // The intake helper is not an automatic verifier: keep its different-host
  // flag for this exact manually reviewed merchant, rather than weaken it.
  const manuallyReviewed = ['sofia-diamant-dental-pashovi-obelya316', 'sofia-art-masters-band-nadezhda1-172']
  assert.deepEqual(audit.readyForReview.sort(), [...ids].filter(id => !manuallyReviewed.includes(id)).sort())
  assert.deepEqual(audit.pending, manuallyReviewed.map(id => ({ id, reason: 'first_party_appointment_evidence_required' })))
  for (const id of manuallyReviewed) {
    const resolution = receipt(id).manualIntakeResolution
    assert.equal(resolution.flag, 'first_party_appointment_evidence_required')
    if (id === 'sofia-diamant-dental-pashovi-obelya316') {
      assert.equal(resolution.decision, 'manually_verified_provider_merchant_identity')
      assert.equal(resolution.providerPractice, record(id).booking.url)
      assert.ok(resolution.providerProfiles.every(url => receipt(id).reviewedUrls.includes(url)))
      assert.equal(receipt(id).bookingReview, 'provider_booking_reviewed')
    } else {
      assert.equal(resolution.decision, 'manually_verified_same_owner_websites')
      assert.equal(resolution.ownerWebsite, record(id).website)
      assert.equal(resolution.appointmentEvidence, record(id).verification.booking.url)
      assert.equal(resolution.currentContact, record(id).verification.contact)
      assert.ok([resolution.appointmentEvidence, resolution.appointmentContact, resolution.currentPremises].every(url => receipt(id).reviewedUrls.includes(url)))
      assert.equal(receipt(id).bookingReview, 'phone_booking_reviewed')
    }
    assert.ok(resolution.matchingPhones.includes(record(id).phone))
  }
  assert.deepEqual(audit.rejected, [])
  for (const raw of additions) {
    const row = record(raw.id), review = receipt(raw.id)
    assert.equal(SOFIA_CATALOGUE.filter(item => item.id === raw.id).length, 1, raw.id)
    assert.ok(approvedCatalogueRecord(row, now), raw.id)
    assert.equal(row.cityCode, '68134')
    assert.equal(row.gorezBusinessId, undefined, 'A catalogue addition is not an approved partner account')
    assert.equal(review.inventoryIdentity, pricingIdentity(row), raw.id)
    const outcome = assessPricingReview(row, review, now)
    assert.ok(['reviewed', 'service_reviewed'].includes(outcome.state), `${raw.id}: ${outcome.reason}`)
    assert.equal(outcome.state === 'reviewed', row.services.some(service => service.price), raw.id)
    assert.ok(review.reviewedUrls.includes(row.verification.contact), `${raw.id}: contact source must have been reviewed`)
    assert.ok(review.reviewedUrls.includes(row.verification.booking.url), `${raw.id}: actual booking entry must have been reviewed`)
    if (row.openingHours) {
      assert.equal(row.openingHours.checkedOn, review.checkedOn, raw.id)
      assert.ok(review.reviewedUrls.includes(row.openingHours.sourceUrl), raw.id)
    }
  }
})

test('coverage expansion cannot refresh the historical price or operational baselines to bypass review', async () => {
  for (const [path, expected] of Object.entries(historicalBaselines)) {
    const data = await readFile(new URL(`../${path}`, import.meta.url))
    assert.equal(createHash('sha256').update(data).digest('hex'), expected, path)
    const baseline = JSON.parse(data)
    const old = Array.isArray(baseline) ? baseline : baseline.records
    assert.ok(Array.isArray(old), path)
    assert.ok(old.every(row => !ids.has(row.id)), `${path}: new businesses must not be grandfathered`)
  }
})

test('North Dog keeps its exact first-party premises, three services, genuine unpublished tariff and sourced weekly hours', () => {
  const row = record('sofia-north-dog-grooming-vrabnitsa637')
  assert.ok(row)
  assert.equal(row.neighborhood, 'Връбница 2')
  assert.equal(row.address, 'София, ж.к. Връбница 2, бл. 637, до паркинга на Северен парк')
  assert.equal(row.coordinates, null, 'A block address does not establish a verified map point')
  assert.deepEqual(row.services.map(service => service.name), [
    'Къпане и сушене на куче', 'Подстригване и оформяне на куче', 'Разресване на куче и премахване на заплитания',
  ])
  assert.ok(row.services.every(service => !service.price && !service.durationMin))
  assert.deepEqual(row.booking, { kind: 'phone', phone: '+359898776598' })
  assert.equal(receipt(row.id).pricingDecision, 'not_publicly_listed')
  assert.equal(assessPricingReview(row, receipt(row.id), now).state, 'service_reviewed')
  assert.deepEqual(row.openingHours.days.map(day => [day.weekday, day.periods]), [
    [1, []], ...[2, 3, 4, 5, 6].map(day => [day, [{ open: '10:00', close: '18:00' }]]), [7, []],
  ])
})

test('partner registration finds every added business and preserves its entire known service and price inventory in BG and EN', () => {
  for (const row of additions.map(item => record(item.id))) for (const locale of ['bg', 'en']) {
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: row.name.slice(0, 120), cityCode: '68134' }, { now }).some(item => item.id === row.id), row.id)
    const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, row.id, { now, cityCode: '68134', locale })
    assert.equal(draft.business.id, row.id)
    assert.equal(draft.business.address, row.address)
    assert.equal(draft.business.neighborhood, row.neighborhood)
    assert.equal(draft.business.website, row.website)
    assert.equal(draft.business.phone, row.phone)
    assert.equal(draft.serviceCount, row.services.length)
    assert.deepEqual(draft.services.map(service => service.name), row.services.map(service => service.name))
    row.services.forEach((service, index) => {
      const imported = draft.services[index]
      assert.equal(imported.price, service.price ? String(service.price.amount) : '', `${row.id}: ${service.name}`)
      assert.equal(imported.duration_min, service.durationMin ? String(service.durationMin) : '', `${row.id}: ${service.name}`)
      assert.equal(imported.description, service.description || '')
      if (service.price) {
        assert.equal(imported.currency, service.price.currency)
        assert.equal(imported.price_details.kind, service.price.kind)
        if (service.price.kind === 'range') assert.equal(imported.price_details.maximum, service.price.maximum)
        if (service.price.unit) assert.equal(imported.price_details.unit, service.price.unit)
      } else assert.deepEqual(imported.price_details, {})
    })
  }
})

test('the existing public catalogue-onboarding endpoint returns the full new inventory without external lookups or writes', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => now, allowAttempt: () => true })
  for (const row of additions) for (const locale of ['bg', 'en']) {
    const searchResponse = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(row.name.slice(0, 120))}&city=68134&lang=${locale}`))
    assert.equal(searchResponse.status, 200, row.id)
    assert.ok((await searchResponse.json()).businesses.some(item => item.id === row.id), row.id)
    const detailResponse = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${row.id}&city=68134&lang=${locale}`))
    assert.equal(detailResponse.status, 200, row.id)
    const detail = await detailResponse.json()
    assert.equal(detail.business.id, row.id)
    assert.deepEqual(detail.services, catalogueOnboardingDetail(SOFIA_CATALOGUE, row.id, { now, cityCode: '68134', locale }).services)
  }
})

test('public details retain all sourced services, prices and hours; phone and external bookings never invent a native calendar', () => {
  for (const raw of additions) {
    const row = record(raw.id)
    const result = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { cityCode: '68134', category: row.category, browse: true, searchV2: true }, { now }).find(item => item.id === row.id)
    assert.ok(result, row.id)
    assert.deepEqual(result.details.services.map(service => service.name), row.services.map(service => service.name))
    row.services.forEach((service, index) => {
      const detail = result.details.services[index]
      assert.equal(detail.price, service.price?.amount ?? null, `${row.id}: ${service.name}`)
      assert.equal(detail.durationMin, service.durationMin ?? null)
      assert.equal(detail.description, service.description || '')
      if (service.price) {
        assert.equal(detail.priceKind, service.price.kind)
        assert.equal(detail.priceMaximum, service.price.maximum ?? null)
        assert.equal(detail.priceUnit, service.price.unit || '')
        assert.equal(detail.priceSourceUrl, service.price.sourceUrl)
      }
    })
    assert.deepEqual(result.details.hours, (row.openingHours?.days || []).map(day => ({ weekday: day.weekday, periods: day.periods.map(period => `${period.open}–${period.close}`), ...(day.byAppointment ? { byAppointment: true } : {}) })).sort((a, b) => a.weekday - b.weekday))
    assert.equal(result.details.hoursSourceUrl, row.openingHours?.sourceUrl || null)
    assert.equal(result.booking.kind, row.booking.kind)
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    assert.deepEqual(railExternalAction(result, now), row.booking.kind === 'phone'
      ? { kind: 'phone', href: `tel:${row.booking.phone}` }
      : { kind: 'form', href: new URL(row.booking.url).href })
  }
})

test('actual complete new business names resolve through free discovery without paid providers or booking calls', async () => {
  const forbidden = () => assert.fail('No provider request, paid lookup, availability check, booking or database mutation')
  const deps = {
    now: DateTime.fromMillis(now), config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }),
    readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE,
    fetcher: forbidden, claimBudget: forbidden, getBusiness: forbidden, getSlots: forbidden,
  }
  for (const row of additions) {
    for (const input of [{ query: row.name, cityCode: '68134' }, discoverySearchInput({ query: row.name })]) {
      const result = await discoverBusinesses(input, deps)
      assert.equal(result.clarification, null, row.name)
      assert.ok(result.results.some(item => item.id === row.id), `${row.id}: full-name discovery`)
    }
    const wrongCity = await discoverBusinesses({ query: row.name, cityCode: '56784' }, deps)
    assert.ok(!wrongCity.results.some(item => item.id === row.id), `${row.id}: Sofia cannot leak into a different chosen city`)
    const historical = await discoverBusinesses({ query: row.name, cityCode: '68134' }, { ...deps, now: DateTime.fromISO('2026-11-15T12:00:00Z') })
    assert.ok(!historical.results.some(item => item.id === row.id), `${row.id}: must not appear before source review`)
  }
})

test('every new service has a specific, existing photographic asset, never an emoji or neutral placeholder', async () => {
  for (const row of additions) for (const service of row.services) for (const locale of ['bg', 'en']) {
    const image = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, row) }, { business: row, locale })
    assert.equal(image.type, 'photo', `${row.id}: ${service.name}`)
    assert.ok(['exact', 'activity'].includes(image.photoMatch), `${row.id}: ${service.name}: ${image.src}`)
    assert.match(image.src, /^\/service-photos\/[a-z0-9-]+\.webp$/)
    assert.doesNotMatch(image.src, /neutral|appointment-workspace|notebook/u)
    const asset = new URL(`../public${image.src}`, import.meta.url)
    assert.ok((await stat(asset)).size > 0, image.src)
    const bytes = await readFile(asset)
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF', image.src)
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP', image.src)
    assert.ok(image.alt, `${row.id}: accessible photo name`)
  }
})

test('coverage counts actual premises once and keeps the reviewed home-visit identity outside physical-neighborhood quotas', () => {
  const report = catalogueCoverageReport(SOFIA_CATALOGUE, { now })
  const areas = [...report.neighborhoods, ...report.additionalNamedAreas]
  // Exactly this independently reviewed home visit joins the separate mobile
  // queue; it cannot satisfy a physical category/quarter cell. A new unknown
  // non-premises record still fails this explicit cohort expectation.
  const mobile = additions.filter(row => row.locationKind !== 'premises')
  assert.deepEqual(mobile.map(row => row.id), ['sofia-miele-servisbg-home-diagnostic'])
  for (const raw of mobile) {
    const row = record(raw.id)
    assert.equal(row.locationKind, 'service_area')
    assert.equal(row.neighborhood, null)
    assert.equal(row.address, null)
    assert.equal(row.coordinates, null)
    assert.ok(row.services.every(service => service.category === 'home_services' && service.appointmentModel === 'home_visit'))
    assert.ok(report.serviceAreaProviders.some(provider => provider.id === row.id))
    assert.ok(areas.every(area => area.cells.every(cell => !cell.businessIds.includes(row.id))), 'A home visit earns zero physical-neighborhood quota credit')
  }
  for (const raw of additions.filter(row => row.locationKind === 'premises')) {
    const row = record(raw.id)
    assert.equal(row.locationKind, 'premises', 'This coverage-first batch must establish a real local premises')
    assert.ok(row.neighborhood, `${row.id}: an unknown neighborhood must not claim a filled cell`)
    const areaName = coverageNeighborhood(row.neighborhood)
    const area = areas.find(item => item.name === areaName)
    assert.ok(area, `${row.id}: ${row.neighborhood}`)
    const categories = new Set(row.services.map(service => service.category))
    for (const cell of area.cells) assert.equal(cell.businessIds.includes(row.id), categories.has(cell.categoryId), `${row.id}: ${cell.categoryId}`)
    for (const other of areas.filter(item => item !== area)) assert.ok(other.cells.every(cell => !cell.businessIds.includes(row.id)), `${row.id}: do not duplicate into ${other.name}`)
  }
})
