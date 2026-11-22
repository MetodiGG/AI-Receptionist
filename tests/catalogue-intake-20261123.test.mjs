import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import evidence from '../docs/catalogue-coverage/intake-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { INTAKE_20261123_RECORDS, INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-intake-20261123.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { validateCatalogue, catalogueRecordSchema } from '../lib/discovery/catalogue-policy.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_CSV_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { serviceDisplayName, publicProse } from '../lib/locale/public-content.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

// This UTC timestamp is after midnight in Sofia. The evidence records both dates.
const clock = DateTime.fromISO('2026-11-22T22:30:00Z', { setZone: true })
const now = clock.toMillis()
const fixtures = [
  { id: 'sofia-vr-sofia-west-mall-lyulin7', quarter: 'Люлин 7', category: 'other', name: 'VR игра ARENA за 2–6 играчи',
    english: 'VR ARENA game for 2–6 players', addressId: '98466', coordinates: { latitude: 42.710348, longitude: 23.271305 },
    booking: { kind: 'phone', phone: '+359886656559' }, action: { kind: 'phone', href: 'tel:+359886656559' }, image: 'sx-vr-arena-free-roam',
    beforeCell: [3, 1], afterCell: [4, 2], priceState: 'reviewed' },
  { id: 'sofia-brainland-lyulin3-block319v', quarter: 'Люлин 3', category: 'education', name: 'Английски език за възрастни',
    english: 'English for adults', addressId: '30434', coordinates: { latitude: 42.721203, longitude: 23.243208 },
    booking: { kind: 'form', url: 'https://www.brainland.bg/kontakt.html' }, action: { kind: 'form', href: 'https://www.brainland.bg/kontakt.html' }, image: 'language-lesson',
    beforeCell: [1, 0], afterCell: [2, 1], priceState: 'service_reviewed' },
]
const ids = new Set(fixtures.map(item => item.id))
const admitted = id => SOFIA_CATALOGUE.find(row => row.id === id)
const prior = SOFIA_CATALOGUE.filter(row => !ids.has(row.id))
const forbidden = () => assert.fail('Do not access a live provider, take action or ask for slots')
const discovery = createDiscoveryHandler({
  now: clock, config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'catalogue' }),
  allowAttempt: async () => true, readCatalogue: async () => SOFIA_CATALOGUE, readInternal: async () => [],
  fetcher: forbidden, claimBudget: forbidden, authorizeGoogle: forbidden, getBusiness: forbidden, getSlots: forbidden,
})
const details = createPublicBusinessDetailsHandler({
  config: { enabled: true }, now: () => now, allowAttempt: async () => true, findCatalogue: admitted,
  readCataloguePhotos: async () => [], readPartner: forbidden,
})

async function search(input) {
  const response = await discovery(new Request('https://www.gorez.co/api/public/discovery', {
    method: 'POST', headers: { Origin: 'https://www.gorez.co', 'Content-Type': 'application/json' },
    body: JSON.stringify({ cityCode: '68134', radiusKm: 1, ...input }),
  }))
  assert.equal(response.status, 200)
  return (await response.json()).results
}

test('the independently reviewed records enter the shared catalogue exactly once and retain their source proofs', () => {
  assert.equal(evidence.checkedOn, '2026-11-23')
  assert.equal(evidence.publicationReviewDateUtc, '2026-11-22')
  assert.equal(evidence.municipalSource.sourceSha256, OFFICIAL_SOFIA_CSV_SHA256)
  assert.equal(evidence.municipalSource.source, OFFICIAL_SOFIA_SOURCE_URL)
  assert.equal(evidence.businesses.length, fixtures.length)
  assert.deepEqual(auditCatalogueBatch(prior, INTAKE_20261123_RECORDS, now).readyForReview, [...ids])

  const normalized = validateCatalogue(INTAKE_20261123_RECORDS)
  for (const item of fixtures) {
    const row = admitted(item.id), work = evidence.businesses.find(entry => entry.id === item.id)
    const review = BOOKING_PRICE_REVIEWS.find(entry => entry.id === item.id)
    assert.equal(SOFIA_CATALOGUE.filter(entry => entry.id === item.id).length, 1)
    assert.equal(PUBLIC_CATALOGUE.filter(entry => entry.id === item.id).length, 1)
    assert.deepEqual(row, normalized.find(entry => entry.id === item.id))
    assert.deepEqual(review, INTAKE_20261123_REVIEWS.find(entry => entry.id === item.id))
    assert.equal(pricingIdentity(row), work.inventoryIdentity)
    assert.equal(review.inventoryIdentity, work.inventoryIdentity)
    assert.equal(assessPricingReview(row, review, now).state, item.priceState)
    assert.equal(row.verification.checkedOn, evidence.publicationReviewDateUtc)
    assert.equal(row.verification.validUntil, work.validUntil)
    assert.equal(row.category, item.category)
    assert.equal(row.locationKind, 'premises')
    assert.deepEqual(row.services.map(service => service.name), [item.name])
  }
})

test('the two municipal points are bound to actual customer premises, not a generic district or a guessed entrance', () => {
  for (const item of fixtures) {
    const row = admitted(item.id), work = evidence.businesses.find(entry => entry.id === item.id)
    assert.equal(row.neighborhood, item.quarter)
    assert.equal(row.address, work.address)
    assert.equal(row.website, work.website)
    assert.equal(row.phone, work.phone)
    assert.equal(work.municipalRow.rn, item.addressId)
    assert.equal(work.municipalRow.latitude, item.coordinates.latitude)
    assert.equal(work.municipalRow.longitude, item.coordinates.longitude)
    assert.deepEqual(catalogueBoundCoordinates(row), {
      ...item.coordinates, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: row.address, sourceCityCode: '68134', sourceNeighborhood: item.quarter, sourceWebsite: row.website,
      checkedOn: evidence.publicationReviewDateUtc, addressId: item.addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    })
    for (const changed of [{ ...row, neighborhood: 'Люлин' }, { ...row, address: row.address + ' 9' }]) {
      assert.equal(catalogueRecordSchema.safeParse(changed).success, false)
      assert.equal(catalogueBoundCoordinates(changed), null)
    }
  }
  assert.equal(evidence.businesses.find(row => row.id === fixtures[1].id).municipalRow.entrance, 'В')
  assert.match(admitted(fixtures[1].id).address, /бл\. 319, вх\. В/u)
})

test('the two additions fill exactly two physical and located cells without adding mobile providers or multiplying services', () => {
  const before = catalogueCoverageReport(prior, { now, target: 30 })
  const after = catalogueCoverageReport(SOFIA_CATALOGUE, { now, target: 30 })
  for (const key of ['sourceRecords', 'approvedBusinesses', 'premises', 'premisesWithBoundCoordinates', 'businessCategoryIncidences']) {
    assert.equal(after.counts[key], before.counts[key] + 2, key)
  }
  for (const key of ['serviceAreaProviders', 'premisesWithoutBoundCoordinates', 'totalTargetCells']) {
    assert.equal(after.counts[key], before.counts[key], key)
  }
  const flatten = report => new Map([...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area =>
    area.cells.map(cell => [`${area.name}:${cell.categoryId}`, cell])))
  const oldCells = flatten(before), newCells = flatten(after)
  assert.deepEqual([...newCells].filter(([key, cell]) => oldCells.get(key)?.count !== cell.count)
    .map(([key]) => key).sort(), fixtures.map(item => `${item.quarter}:${item.category}`).sort())
  for (const item of fixtures) {
    const key = `${item.quarter}:${item.category}`, old = oldCells.get(key), current = newCells.get(key)
    assert.deepEqual([old.count, old.locatedCount], item.beforeCell)
    assert.deepEqual([current.count, current.locatedCount], item.afterCell)
    assert.equal(current.gap, 30 - current.count)
    assert.equal(current.businessIds.filter(id => id === item.id).length, 1)
  }
})

test('BG service and EN business-name discovery reach the same local records with translated service presentation', async () => {
  for (const item of fixtures) {
    const row = admitted(item.id)
    const scope = { category: item.category, neighborhood: item.quarter, coordinates: { ...item.coordinates, consent: true } }
    for (const [locale, query] of [['bg', item.name], ['en', row.name]]) {
      const found = (await search({ ...scope, query, locale })).find(entry => entry.id === item.id)
      assert.ok(found, `${locale}: ${query}`)
      assert.equal(found.source, 'catalogue')
      assert.equal(found.distanceKm, 0)
      assert.equal(found.neighborhood, item.quarter)
      assert.deepEqual(found.coordinateAttribution, { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL })
      assert.deepEqual(found.availability, { status: 'external', slots: [] })
      assert.equal(found.services.length, 1)
      const service = found.services[0]
      assert.equal(serviceDisplayName(service, locale), locale === 'bg' ? item.name : item.english)
      assert.equal(service.id, `${item.id}-0`)
      assert.deepEqual(railExternalAction(found, now), item.action)
    }
    const other = fixtures.find(entry => entry.id !== item.id)
    for (const mismatch of [
      { neighborhood: other.quarter }, { category: 'fitness' }, { cityCode: '44238', neighborhood: undefined },
      { coordinates: { latitude: 42.68, longitude: 23.32, consent: true } },
    ]) {
      const rows = await search({ ...scope, query: row.name, locale: 'bg', ...mismatch })
      assert.ok(rows.every(found => found.id !== item.id), JSON.stringify(mismatch))
    }
  }
})

test('public details and onboarding preserve VR duration and conditions while leaving Brainland price and timing unset', async () => {
  for (const [index, item] of fixtures.entries()) {
    const row = admitted(item.id)
    const response = await details(new Request(`https://www.gorez.co/api/public/discovery/business/${item.id}`), item.id)
    assert.equal(response.status, 200)
    const { business } = await response.json()
    const [service] = business.details.services
    assert.equal(business.details.services.length, 1)
    assert.deepEqual(business.details.hours, [])
    assert.deepEqual(business.coordinates, item.coordinates)
    assert.deepEqual(business.booking, { ...item.booking, verified: true, checkedOn: row.verification.checkedOn, validUntil: row.verification.validUntil })
    assert.deepEqual(railExternalAction(business, now), item.action)
    const en = publicProse(service.description, 'en', service.presentationEn?.description)
    assert.equal(serviceDisplayName(service, 'en'), item.english)
    assert.doesNotMatch(en, /[а-яѝ]|translation pending/iu)
    if (index === 0) {
      assert.equal(service.price, 18.5); assert.equal(service.currency, 'EUR'); assert.equal(service.priceKind, 'fixed')
      assert.equal(service.durationMin, 30); assert.equal(service.priceSourceUrl, 'https://www.vr-sofia.com/ceni/')
      assert.equal(service.priceUnit, 'на човек')
      assert.match(service.description, /2–6 играчи, от петък до неделя/u)
      assert.match(en, /2–6 players, Friday to Sunday/u)
      assert.match(detailPriceLabel(service, 'bg'), /18,50.+на човек/u)
      assert.match(detailPriceLabel(service, 'en'), /18\.50.+per person/u)
    } else {
      assert.equal(service.price, null); assert.equal(service.durationMin, null); assert.equal(service.priceSourceUrl, null)
      assert.equal(detailPriceLabel(service, 'bg'), null); assert.equal(detailPriceLabel(service, 'en'), null)
      assert.match(en, /enquiry/u)
      assert.equal(row.services[0].price, undefined)
      assert.equal(row.services[0].durationMin, undefined)
      assert.equal(assessPricingReview(row, INTAKE_20261123_REVIEWS[1], now).pricingState, 'not_publicly_listed')
    }
    for (const locale of ['bg', 'en']) {
      const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, item.id, { now, cityCode: '68134', locale })
      assert.equal(draft.business.coordinates, undefined)
      assert.equal(draft.business.neighborhood, item.quarter)
      assert.equal(draft.services.length, 1)
      assert.equal(draft.services[0].name, item.name)
      assert.equal(draft.services[0].price, index === 0 ? '18.5' : '')
      assert.equal(draft.services[0].duration_min, index === 0 ? '30' : '')
      if (index === 0) assert.equal(draft.services[0].price_details.unit, 'на човек')
    }
  }
})

test('both activities use actual local illustrative WebP files with no partner-photo claim or placeholder fallback', async () => {
  for (const item of fixtures) {
    const row = admitted(item.id), service = row.services[0]
    assert.equal(row.photo, undefined)
    assert.equal(catalogueServicePhotoFields(service, row).illustrativePhotoKey, item.image)
    for (const locale of ['bg', 'en']) {
      const image = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, row) }, { business: row, locale })
      assert.equal(image.type, 'photo')
      assert.equal(image.photoMatch, 'activity')
      assert.equal(image.src, `/service-photos/${item.image}-v1.webp`)
      assert.ok(image.alt)
      const bytes = await readFile(new URL(`../public${image.src}`, import.meta.url))
      assert.equal(bytes.subarray(0, 4).toString(), 'RIFF'); assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
    }
  }
})
