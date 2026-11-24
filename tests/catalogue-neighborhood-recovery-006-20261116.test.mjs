import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import supplemental from '../lib/discovery/catalogue-data/supplemental-expansion-v2.mjs'
import originalSport from '../lib/discovery/catalogue-data/auto-sport-home-expansion.json' with { type: 'json' }
import legacyPrices from '../lib/discovery/catalogue-data/pricing-review-baseline-20261110.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { catalogueRecordSchema, approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates, applyCatalogueCoordinateBindings } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { cataloguePublicLocation } from '../lib/discovery/catalogue-public-location.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const record = id => SOFIA_CATALOGUE.find(row => row.id === id)
// Captured before the two source changes in research-quarter-recovery-016.
// Restoring only the old quarter fields must reproduce the entire old record.
const recoveries = [
  { id: 'sofia-vayasport', neighborhood: 'Мотописта',
    address: 'София, бул. Гоце Делчев 98, Бизнес Център АЗИМУТ', website: 'https://vayasport.bg/',
    contactEvidence: 'https://vayasport.bg/kontakti/',
    normalizedHash: '6b0161e2d0ccfb295580d1b0d3cd88ae9eeb1c1ed6a6a69a84550f84de752b5c',
    pricingIdentity: '987683c29b5e9333045d24e04c94a2dd8b57d1f0e9e8b7484188b5c8daed868e',
    reviewHash: 'b760e7d381858b3c787c1ce18aa650b744c868fb86fd34dffd9cd1a99703a228',
    reviewState: 'reviewed', reviewedPriceCount: 6 },
  { id: 'sofia-lazarov-athletics', neighborhood: 'Център',
    address: 'София, район Оборище, ул. Чумерна 3', website: 'https://www.lazarovathletics.com/',
    contactEvidence: 'https://www.lazarovathletics.com/contactus',
    normalizedHash: '30d60687637c2531053783b07546a79c4e252a7323db2e9e498350bd10dd785f',
    pricingIdentity: '69d79413d172aaa2ac1bd7b8f31f56f47af8766f9f00a3b6b3cf743ba27ec63b',
    reviewHash: null, reviewState: 'pending', reviewedPriceCount: 0 },
]
const ids = new Set(recoveries.map(row => row.id))
const previous = row => ({ ...row, neighborhood: null,
  ...(row.id === 'sofia-lazarov-athletics' ? { coordinates: { ...row.coordinates, sourceNeighborhood: null } } : {}),
})
// These exact original/subset/binding bytes were attested before integration.
// Do not regenerate a historical cache merely to accommodate a new quarter.
const immutableCaches = {
  'public/catalogue-official-address-points-20261113.json': '59bc3d5b91df3a2f677283d8935fd9c69bb8f9a4511418e2e5f31e187da4854d',
  'public/catalogue-official-address-growth-subset-20261113.json': 'b37d9d93d99532310a6f05daa79e1509394035dd2c6b584623cb9f8802671242',
  'public/catalogue-official-address-2000-subset-20261113.json': 'e0fe802119f2c3c46a51fead579cf33ebb2915ce591c29260a9445a2683f8615',
  'lib/discovery/catalogue-data/coordinate-bindings-20261113.json': '1d957e6deac1efae4b11d868eaac5fbe46b0ebf49dc408f6dc0c8ad9df652832',
}

test('two existing premises recover only the independently quoted owner quarters, not new businesses or district/nearby-area guesses', async () => {
  const ledger = JSON.parse(await readFile(new URL('../docs/catalogue-coverage/research-quarter-recovery-016-20261116.json', import.meta.url)))
  assert.equal(ledger.validation.newBusinessesAdded, 0)
  assert.equal(ledger.readyCorrections.length, 2)
  for (const expected of recoveries) {
    const row = record(expected.id)
    const source = [...supplemental, ...originalSport].find(item => item.id === row.id)
    const evidence = ledger.readyCorrections.find(item => item.id === row.id)
    assert.ok(source && evidence, expected.id)
    assert.equal(SOFIA_CATALOGUE.filter(item => item.id === row.id).length, 1)
    assert.equal(source.neighborhood, expected.neighborhood)
    assert.equal(row.neighborhood, expected.neighborhood)
    assert.equal(row.address, expected.address)
    assert.equal(row.website, expected.website)
    assert.equal(row.cityCode, '68134')
    assert.equal(row.locationKind, 'premises')
    assert.equal(row.gorezBusinessId, undefined)
    assert.equal(catalogueRecordSchema.safeParse(source).success, true)
    assert.equal(catalogueRecordSchema.safeParse(row).success, true)
    assert.ok(approvedCatalogueRecord(row, now))
    assert.equal(evidence.proposedNeighborhood, expected.neighborhood)
    assert.equal(evidence.addressUnchanged, row.address)
    assert.equal(evidence.websiteUnchanged, row.website)
    assert.equal(evidence.sourceUrl, expected.contactEvidence)
    assert.equal(evidence.identityReview.oldNormalizedRecordSha256, expected.normalizedHash)
    assert.match(evidence.excerpt, new RegExp(expected.neighborhood, 'u'))
  }
  assert.notEqual(record('sofia-vayasport').neighborhood, 'Иван Вазов', 'An old service URL slug is not the physical quarter')
  assert.notEqual(record('sofia-lazarov-athletics').neighborhood, 'Оборище', 'The address administrative district is not substituted for the explicit owner area')
})

test('restoring neighborhood null and only the old Lazarov point quarter reconstructs both complete pre-change normalized records', () => {
  for (const expected of recoveries) {
    const row = record(expected.id), before = previous(row)
    assert.equal(hash(before), expected.normalizedHash, `${row.id}: unrelated address, contact, service, price, booking, hours or verification changed`)
    assert.equal(pricingIdentity(row), expected.pricingIdentity)
    assert.equal(pricingIdentity(before), expected.pricingIdentity)
    assert.deepEqual(row.services, before.services)
    assert.deepEqual(row.booking, before.booking)
    assert.deepEqual(row.verification, before.verification)
    assert.equal(row.openingHours, before.openingHours)
  }
  assert.equal(record('sofia-vayasport').coordinates, null)
  assert.equal(catalogueBoundCoordinates(record('sofia-vayasport')), null)
})

test('the old six-price Vayasport review and pending Lazarov baseline remain unchanged rather than receiving a new price clearance', () => {
  for (const expected of recoveries) {
    const row = record(expected.id), review = BOOKING_PRICE_REVIEWS.find(item => item.id === row.id)
    assert.equal(review ? hash(review) : null, expected.reviewHash)
    const outcome = assessPricingReview(row, review, now)
    assert.equal(outcome.state, expected.reviewState)
    if (review) {
      assert.equal(review.checkedOn, '2026-11-10')
      assert.equal(review.inventoryIdentity, expected.pricingIdentity)
      assert.equal(outcome.reviewedPriceCount, expected.reviewedPriceCount)
    } else {
      assert.equal(outcome.reason, 'booking_price_review_required')
      assert.equal(legacyPrices.find(item => item.id === row.id)?.identity, expected.pricingIdentity)
      assert.ok(row.services.every(service => !service.price && !service.durationMin))
    }
  }
})

test('Lazarov rebinds only the quarter of the exact old municipal postal point, without a new point/date/source or historical cache rewrite', async () => {
  const row = record('sofia-lazarov-athletics'), before = previous(row)
  assert.deepEqual(row.coordinates, {
    latitude: 42.7006596043555, longitude: 23.33305221485938,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: row.address, sourceCityCode: '68134', sourceNeighborhood: 'Център', sourceWebsite: row.website,
    checkedOn: '2026-11-13', addressId: '47351', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  })
  assert.equal(hash(before.coordinates), '37a14981a90b2f3bacd63d193a482a3b8f30e2d3923ad7313210b8047c3d5449')
  assert.equal(catalogueBoundCoordinates(row), row.coordinates)
  assert.equal(catalogueBoundCoordinates(before), before.coordinates)
  assert.deepEqual({ ...row.coordinates, sourceNeighborhood: null }, before.coordinates)
  for (const [path, expected] of Object.entries(immutableCaches)) {
    const data = await readFile(new URL(`../${path}`, import.meta.url))
    assert.equal(createHash('sha256').update(data).digest('hex'), expected, path)
  }
})

test('the rebound official point still fails closed on an edited address/city/quarter/website or mismatched source binding', () => {
  const row = record('sofia-lazarov-athletics')
  const intent = { cityCode: '68134', category: 'fitness', browse: true, searchV2: true }
  const mutations = [
    { address: 'София, район Оборище, ул. Чумерна 4' },
    { cityCode: '56784' }, { neighborhood: 'Оборище' }, { neighborhood: null },
    { website: 'https://example.org/' },
    { coordinates: { ...row.coordinates, sourceNeighborhood: null } },
    { coordinates: { ...row.coordinates, sourceAddress: 'София, ул. Чумерна 4' } },
    { coordinates: { ...row.coordinates, sourceCityCode: '56784' } },
    { coordinates: { ...row.coordinates, sourceWebsite: 'https://example.org/' } },
    { coordinates: { ...row.coordinates, source: 'https://example.org/dataset' } },
    { coordinates: { ...row.coordinates, licence: 'ODbL-1.0' } },
    { coordinates: { ...row.coordinates, latitude: 0 } },
  ]
  for (const patch of mutations) {
    const changed = { ...row, ...patch }
    assert.equal(catalogueRecordSchema.safeParse(changed).success, false, JSON.stringify(patch))
    assert.equal(catalogueBoundCoordinates(changed), null)
    assert.equal(approvedCatalogueRecord(changed, now), null)
    assert.deepEqual(normalizeCatalogueBusinesses([changed], intent, { now }), [])
    assert.equal(applyCatalogueCoordinateBindings([changed])[0].coordinates, null)
  }
})

test('public exact-quarter discovery preserves original service IDs and external actions, with sanitized existing point attribution only', () => {
  for (const expected of recoveries) {
    const row = record(expected.id), before = previous(row)
    const intent = { cityCode: '68134', neighborhood: expected.neighborhood, category: 'fitness', browse: true, searchV2: true }
    const results = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, intent, { now })
    const result = results.find(item => item.id === row.id)
    assert.ok(result, row.id)
    assert.equal(results.filter(item => item.id === row.id).length, 1)
    assert.equal(result.neighborhood, expected.neighborhood)
    assert.equal(result.address, row.address)
    assert.deepEqual(result.services.map(service => service.id), row.services.map((_, index) => `${row.id}-${index}`))
    const previousPublic = normalizeCatalogueBusinesses([before], { ...intent, neighborhood: undefined }, { now })[0]
    assert.deepEqual(result.booking, previousPublic.booking)
    assert.equal(result.booking.kind, before.booking.kind)
    assert.equal(result.booking.url ?? result.booking.phone, before.booking.url ?? before.booking.phone)
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    assert.deepEqual(normalizeCatalogueBusinesses([before], intent, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Свобода' }, { now }), [])
    if (row.coordinates) {
      assert.deepEqual(result.coordinates, { latitude: row.coordinates.latitude, longitude: row.coordinates.longitude })
      assert.deepEqual(result.coordinateAttribution, { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL })
      assert.doesNotMatch(JSON.stringify(result), /sourceAddress|sourceCityCode|sourceNeighborhood|sourceWebsite|addressId|verified_official_address/u)
    } else assert.equal(result.coordinates, null)
  }
})

test('BG/EN registration search and detail prefill recovered quarters while the full old service and price drafts remain identical', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => now, allowAttempt: () => true })
  for (const expected of recoveries) for (const locale of ['bg', 'en']) {
    const row = record(expected.id), before = previous(row)
    const oldDraft = catalogueOnboardingDetail([before], row.id, { now, cityCode: '68134', locale })
    const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, row.id, { now, cityCode: '68134', locale })
    assert.equal(draft.business.neighborhood, expected.neighborhood)
    assert.deepEqual({ ...draft.business, neighborhood: null }, oldDraft.business)
    assert.deepEqual(draft.services, oldDraft.services)
    assert.equal(draft.business.coordinates, undefined)
    const found = searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: row.name, cityCode: '68134' }, { now })
    assert.equal(found.find(item => item.id === row.id)?.neighborhood, expected.neighborhood)
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(row.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    assert.equal((await search.json()).businesses.find(item => item.id === row.id)?.neighborhood, expected.neighborhood)
    const detail = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${row.id}&city=68134&lang=${locale}`))
    assert.equal(detail.status, 200)
    assert.deepEqual((await detail.json()).services, oldDraft.services)
  }
})

test('quarter recovery preserves verified directions and never uses a text-only address as a route', () => {
  const directionsFor = row => businessMapsDirectionsUrl({ ...row, navigationLocation: cataloguePublicLocation(row) })
  for (const expected of recoveries) {
    const row = record(expected.id), before = previous(row)
    const href = directionsFor(row)
    assert.equal(row.address, before.address)
    assert.equal(href, directionsFor(before))
    if (row.id === 'sofia-vayasport') {
      assert.equal(href, null)
      continue
    }
    const url = new URL(href)
    assert.equal(url.searchParams.get('destination'), `${row.coordinates.latitude},${row.coordinates.longitude}`)
    assert.equal(url.searchParams.get('destination_place_id'), null)
    assert.equal(url.searchParams.get('origin'), null)
  }
  const mim = record('sofia-mim-auto96-knyazhevo-lyublyana69')
  assert.equal(SOFIA_CATALOGUE.filter(row => row.id === mim.id).length, 1)
  assert.equal(mim.address, 'София, кв. Княжево, ул. Любляна 69')
  assert.equal(mim.neighborhood, 'Княжево')
  assert.equal(mim.coordinates.addressId, '93387')
  assert.equal(mim.coordinates.checkedOn, '2026-11-16')
  assert.equal(mim.coordinates.latitude, 42.666068)
  assert.equal(mim.coordinates.longitude, 23.249097)
  assert.equal(catalogueBoundCoordinates(mim), mim.coordinates)
  assert.equal(pricingIdentity(mim), 'd66f80409e8752ce1f173e129c8e5946e3de030dab345be7866add36933199f7')
  assert.equal(mim.services.length, 4)
  assert.ok(mim.services.every(service => !service.price))
  assert.equal(new URL(directionsFor(mim)).searchParams.get('destination'), '42.666068,23.249097')
})

test('the two quarter corrections reduce missing-quarter premises by two without increasing catalogue or physical-business counts', () => {
  const beforeRows = SOFIA_CATALOGUE.map(row => ids.has(row.id) ? previous(row) : row)
  const before = catalogueCoverageReport(beforeRows, { now }), after = catalogueCoverageReport(SOFIA_CATALOGUE, { now })
  for (const key of ['sourceRecords', 'approvedBusinesses', 'premises', 'serviceAreaProviders']) assert.equal(after.counts[key], before.counts[key], key)
  assert.equal(after.counts.missingNeighborhoodPremises, before.counts.missingNeighborhoodPremises - 2)
  const area = (report, neighborhood) => [...report.neighborhoods, ...report.additionalNamedAreas].find(item => item.name === neighborhood)
  for (const expected of recoveries) {
    const oldCell = area(before, expected.neighborhood)?.cells.find(cell => cell.categoryId === 'fitness')
    const cell = area(after, expected.neighborhood).cells.find(item => item.categoryId === 'fitness')
    assert.equal(cell.count, (oldCell?.count || 0) + 1)
    assert.equal(cell.businessIds.filter(id => id === expected.id).length, 1)
  }
})
