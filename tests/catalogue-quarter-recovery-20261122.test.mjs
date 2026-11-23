import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyReviewedNeighborhoodRecovery20261122 } from '../lib/discovery/catalogue-data/neighborhood-recovery-20261122.mjs'
import { catalogueRecordSchema, approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates, applyCatalogueCoordinateBindings } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'
import { quarterRecoveryPriorCatalogue } from './quarter-recovery-20261123-scope.mjs'

const now = Date.parse('2026-11-22T12:00:00Z')
const id = 'sofia-stephan-borovo', quarter = 'Манастирски ливади'
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const record = () => SOFIA_CATALOGUE.find(row => row.id === id)
const previous = row => ({ ...row, neighborhood: null, coordinates: { ...row.coordinates, sourceNeighborhood: null } })
const beforeHash = '053ce29de177ac1f113dc55b75e05b8277d16198b55ea369b0155c8264a324da'
const afterHash = 'a25c159ca78869baeee00ceb863d2ba5d393f842202674c65acb4e1cad09776e'
const priceIdentity = '9ae012a74eb9166cb17f097c3936e090b19e1c63dc0106b556a04ae5e0e1c29f'
const oldPoint = {
  latitude: 42.66702142457208, longitude: 23.27695821128835,
  source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
  sourceAddress: 'София, ул. Пирин 22', sourceCityCode: '68134', sourceNeighborhood: null,
  sourceWebsite: 'https://www.stephan.bg/', checkedOn: '2026-11-13', addressId: '11557',
  licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
}

test('only the explicit owner-sourced quarter changes for the existing Pirin22 branch, never a new business or a guess from its Borovo name', async () => {
  const ledger = JSON.parse(await readFile(new URL('../docs/catalogue-coverage/quarter-recovery-20261122.json', import.meta.url), 'utf8'))
  const row = record(), evidence = ledger.corrections.find(item => item.id === id)
  assert.equal(ledger.newBusinessesAdded, 0); assert.equal(ledger.corrections.length, 1)
  assert.equal(ledger.baseCommit, 'a44faaa77bdda3f129ca48f36385393761b58e31'); assert.equal(ledger.checkedOn, '2026-11-22')
  assert.equal(SOFIA_CATALOGUE.filter(item => item.id === id).length, 1)
  assert.equal(row.name, 'Stephan · Борово'); assert.equal(row.address, 'София, ул. Пирин 22')
  assert.equal(row.website, 'https://www.stephan.bg/'); assert.equal(row.phone, '+359888164144')
  assert.equal(row.cityCode, '68134'); assert.equal(row.locationKind, 'premises'); assert.equal(row.neighborhood, quarter)
  assert.notEqual(row.neighborhood, 'Борово', 'the unchanged branch name is not source evidence of geography')
  assert.equal(evidence.sourceUrl, 'https://www.stephan.bg/saloni/borovo')
  assert.match(evidence.excerpt, /кв\. Манастирски ливади/u); assert.match(evidence.contactExcerpt, /Пирин 22/u)
  assert.equal(evidence.oldNeighborhood, null); assert.equal(evidence.newNeighborhood, quarter)
  assert.equal(evidence.oldNormalizedRecordSha256, beforeHash); assert.equal(evidence.newNormalizedRecordSha256, afterHash)
  assert.equal(evidence.pricingIdentityUnchanged, priceIdentity)
  assert.equal(catalogueRecordSchema.safeParse(row).success, true); assert.ok(approvedCatalogueRecord(row, now))
})

test('undoing precisely the two quarter fields reproduces the complete old row, all 64 services and every old pricing/contact/verification byte', () => {
  const row = record(), before = previous(row)
  assert.equal(hash(before), beforeHash); assert.equal(hash(row), afterHash)
  assert.deepEqual(before, { ...row, neighborhood: null, coordinates: oldPoint })
  assert.equal(row.services.length, 64); assert.equal(row.services.filter(service => service.price).length, 61)
  assert.equal(hash(row.services), 'afdcce68c5bf56ef24a426a0ec46829556c1ee1742c09f186ddf240baa5f0544')
  assert.equal(hash(row.services.map(service => service.price || null)), '43a1d1e37364fbce67507986cf3dde192f7cd257f0396fd57a3fea57a1ea5680')
  assert.equal(hash(row.booking), '7aba4398587ca8a2a4dabf8f12597448401d636f3c12b57db7f04457be802cb9')
  assert.equal(hash(row.verification), '99637a4f0e7ea2f8a4cf84fc50f1e348ad23f94fbdb593001b81c3d6d42ec831')
  assert.equal(pricingIdentity(row), priceIdentity); assert.equal(pricingIdentity(before), priceIdentity)
  assert.equal(row.verification.checkedOn, '2026-11-06'); assert.equal(row.verification.validUntil, '2027-02-04')
})

test('the prior 61-price source review remains unchanged and is not refreshed by a quarter-only correction', () => {
  const row = record(), review = BOOKING_PRICE_REVIEWS.find(item => item.id === id)
  assert.equal(hash(review), '5485fdb99755c15bfbfb4e58c31382100f912145f60b303b043f4ead5fd7c473')
  assert.equal(review.checkedOn, '2026-11-10'); assert.equal(review.inventoryIdentity, priceIdentity)
  const before = assessPricingReview(previous(row), review, now), after = assessPricingReview(row, review, now)
  assert.deepEqual(after, before); assert.equal(after.state, 'reviewed'); assert.equal(after.reviewedPriceCount, 61)
  assert.ok(row.services.filter(service => service.price).every(service => service.price.checkedOn === '2026-11-10' && service.price.validUntil === '2027-02-08'))
})

test('only sourceNeighborhood is rebound on the existing municipal point while all historical cache, coordinate and source dates stay intact', async () => {
  const row = record(), before = previous(row)
  assert.deepEqual(before.coordinates, oldPoint)
  assert.deepEqual(row.coordinates, { ...oldPoint, sourceNeighborhood: quarter })
  assert.equal(hash(before.coordinates), '3217978849bdde28e91b10d1140ce703f2bc68878ce6835b82e86d6426c23a4b')
  assert.equal(hash(row.coordinates), 'eea8cbc278e9d8e3053106e48f0117ec27c86ad5bd7d138cda0fdcfdd2411dc5')
  assert.equal(catalogueBoundCoordinates(before), before.coordinates); assert.equal(catalogueBoundCoordinates(row), row.coordinates)
  assert.equal(catalogueBoundCoordinates({ ...before, neighborhood: quarter }), null, 'a changed quarter without matching point metadata cannot retain a stale binding')
  const caches = {
    'public/catalogue-official-address-points-20261113.json': '59bc3d5b91df3a2f677283d8935fd9c69bb8f9a4511418e2e5f31e187da4854d',
    'public/catalogue-official-address-growth-subset-20261113.json': 'b37d9d93d99532310a6f05daa79e1509394035dd2c6b584623cb9f8802671242',
    'public/catalogue-official-address-2000-subset-20261113.json': 'e0fe802119f2c3c46a51fead579cf33ebb2915ce591c29260a9445a2683f8615',
    'lib/discovery/catalogue-data/coordinate-bindings-20261113.json': '1d957e6deac1efae4b11d868eaac5fbe46b0ebf49dc408f6dc0c8ad9df652832',
  }
  for (const [path, expected] of Object.entries(caches)) {
    const bytes = await readFile(new URL('../' + path, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, path)
  }
})

test('the narrowly guarded recovery is immutable and idempotent and cannot attach this quarter to a changed branch, contact or old-point context', () => {
  const row = record(), before = previous(row), unchanged = { ...before, id: 'sofia-another-branch' }
  const source = [unchanged, before], original = JSON.stringify(source)
  const applied = applyReviewedNeighborhoodRecovery20261122(source)
  assert.equal(JSON.stringify(source), original); assert.equal(applied[0], unchanged)
  assert.deepEqual(applied[1], row); assert.equal(applied[1].services, before.services)
  assert.equal(applied[1].booking, before.booking); assert.equal(applied[1].verification, before.verification)
  assert.equal(applyReviewedNeighborhoodRecovery20261122(applied)[1], applied[1])
  const contextMutations = { id: 'sofia-another-branch', name: 'Stephan · друг обект', cityCode: '56784',
    address: 'София, ул. Пирин 23', website: 'https://example.org/', phone: '+359888000000',
    locationKind: 'service_area', neighborhood: 'Борово' }
  for (const [field, value] of Object.entries(contextMutations)) {
    const changed = { ...before, [field]: value }
    assert.equal(applyReviewedNeighborhoodRecovery20261122([changed])[0], changed, field)
  }
  for (const field of Object.keys(oldPoint)) {
    const changed = { ...before, coordinates: { ...oldPoint, [field]: typeof oldPoint[field] === 'number' ? oldPoint[field] + 0.00001 : 'changed' } }
    assert.equal(applyReviewedNeighborhoodRecovery20261122([changed])[0], changed, 'point.' + field)
  }
  for (const point of [null, { ...oldPoint, extra: 'unreviewed' }, Object.fromEntries(Object.entries(oldPoint).filter(([key]) => key !== 'sourceNeighborhood'))]) {
    const changed = { ...before, coordinates: point }
    assert.equal(applyReviewedNeighborhoodRecovery20261122([changed])[0], changed)
  }
})

test('the updated binding still rejects edited address, quarter, city or website instead of showing a precise point for unreviewed facts', () => {
  const row = record()
  for (const patch of [{ address: 'София, ул. Пирин 23' }, { cityCode: '56784' }, { website: 'https://example.org/' },
    { neighborhood: null }, { neighborhood: 'Борово' }, { coordinates: { ...row.coordinates, sourceNeighborhood: null } },
    { coordinates: { ...row.coordinates, sourceAddress: 'София, ул. Пирин 23' } }, { coordinates: { ...row.coordinates, sourceWebsite: 'https://example.org/' } }]) {
    const changed = { ...row, ...patch }
    assert.equal(catalogueRecordSchema.safeParse(changed).success, false, JSON.stringify(patch))
    assert.equal(catalogueBoundCoordinates(changed), null); assert.equal(approvedCatalogueRecord(changed, now), null)
    assert.equal(applyCatalogueCoordinateBindings([changed])[0].coordinates, null)
  }
})

test('BG/EN exact-quarter discovery and actual public details preserve service identifiers, raw fees, attribution and telephone/directions destinations', async () => {
  const row = record(), before = previous(row)
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now, allowAttempt: () => true,
    findCatalogue: value => value === id ? row : null, readCataloguePhotos: async () => [], readPartner: () => { throw Error('No native/private lookup') } })
  for (const locale of ['bg', 'en']) for (const category of ['hair', 'nails']) {
    const intent = { cityCode: '68134', neighborhood: quarter, category, locale, browse: true, searchV2: true }
    const [found] = normalizeCatalogueBusinesses([row], intent, { now })
    assert.ok(found); assert.equal(found.neighborhood, quarter)
    assert.deepEqual(found.services.map(service => service.id), row.services.map((service, index) => ({ service, index })).filter(({ service }) => service.category === category).map(({ index }) => `${id}-${index}`))
    const [old] = normalizeCatalogueBusinesses([before], { ...intent, neighborhood: undefined }, { now })
    assert.deepEqual(found.services, old.services); assert.deepEqual(found.booking, old.booking)
    assert.deepEqual(railExternalAction(found, now), { kind: 'phone', href: 'tel:+359888164144' })
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    assert.deepEqual(found.coordinateAttribution, { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL })
    assert.deepEqual(normalizeCatalogueBusinesses([before], intent, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Борово' }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, cityCode: '44238' }, { now }), [])
  }
  const response = await handler(new Request('https://www.gorez.co/api/public/discovery/business/' + id), id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  assert.equal(business.neighborhood, quarter); assert.equal(business.details.services.length, 64)
  assert.deepEqual(business.coordinates, { latitude: oldPoint.latitude, longitude: oldPoint.longitude })
  const href = businessMapsDirectionsUrl(row)
  assert.equal(href, businessMapsDirectionsUrl(before))
  assert.equal(new URL(href).searchParams.get('destination'), 'София, ул. Пирин 22, България')
  assert.equal(new URL(href).searchParams.get('origin'), null)
})

test('both onboarding locales prefill the sourced quarter while retaining all 64 original drafts, prices, conditions and existing point-import policy', async () => {
  const row = record(), before = previous(row)
  const handler = createCatalogueOnboardingHandler({ catalogue: [row], now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const oldDraft = catalogueOnboardingDetail([before], id, { now, cityCode: '68134', locale })
    const draft = catalogueOnboardingDetail([row], id, { now, cityCode: '68134', locale })
    assert.equal(draft.business.neighborhood, quarter)
    assert.deepEqual({ ...draft.business, neighborhood: null }, oldDraft.business)
    assert.deepEqual(draft.services, oldDraft.services); assert.equal(draft.services.length, 64)
    assert.equal(draft.business.coordinates, undefined, 'a municipal postal point is not newly certified as a salon-owner entrance point for registration')
    assert.equal(searchCatalogueForOnboarding([row], { query: row.name, cityCode: '68134' }, { now })[0].neighborhood, quarter)
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200); assert.deepEqual((await response.json()).services, oldDraft.services)
    assert.equal((await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=44238&lang=${locale}`))).status, 404)
  }
})

test('the isolated historical 1709-public-ID cohort gains exactly one sourced quarter membership and two real category cells, never 64 new businesses or a new coordinate', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../docs/catalogue-coverage/coverage-20261122-priority30.json', import.meta.url), 'utf8'))
  const priorIds = new Set([
    ...[...snapshot.neighborhoods, ...snapshot.additionalNamedAreas].flatMap(area => area.cells.flatMap(cell => cell.businessIds)),
    ...snapshot.missingNeighborhood.map(row => row.id), ...snapshot.unresolvedBroadAreas.flatMap(area => area.businesses.map(row => row.id)),
    ...snapshot.serviceAreaProviders.map(row => row.id),
  ])
  assert.equal(priorIds.size, 1709)
  const current = quarterRecoveryPriorCatalogue(SOFIA_CATALOGUE).filter(row => priorIds.has(row.id))
  assert.equal(current.length, priorIds.size, 'every earlier public ID remains; separate newly admitted rows are outside this quarter-only comparison')
  const old = current.map(row => row.id === id ? previous(row) : row)
  const before = catalogueCoverageReport(old, { now, target: 30 }), after = catalogueCoverageReport(current, { now, target: 30 })
  for (const key of ['approvedBusinesses', 'premises', 'serviceAreaProviders', 'premisesWithBoundCoordinates', 'premisesWithoutBoundCoordinates', 'totalTargetCells']) assert.equal(after.counts[key], before.counts[key], key)
  assert.equal(before.counts.missingNeighborhoodPremises, 584); assert.equal(after.counts.missingNeighborhoodPremises, 583)
  assert.equal(before.counts.missingNeighborhoodPremisesWithBoundCoordinates, 377); assert.equal(after.counts.missingNeighborhoodPremisesWithBoundCoordinates, 376)
  assert.equal(after.counts.businessCategoryIncidences, before.counts.businessCategoryIncidences + 2)
  assert.equal(after.counts.outstandingBusinessCategoryIncidences, before.counts.outstandingBusinessCategoryIncidences - 2)
  const area = report => report.neighborhoods.find(item => item.name === quarter)
  assert.equal(area(before).distinctPremises, 71); assert.equal(area(after).distinctPremises, 72)
  assert.equal(area(before).premisesWithBoundCoordinates, 41); assert.equal(area(after).premisesWithBoundCoordinates, 42)
  for (const [category, oldCount, newCount, oldLocated, newLocated] of [['hair', 6, 7, 4, 5], ['nails', 5, 6, 3, 4]]) {
    const oldCell = area(before).cells.find(cell => cell.categoryId === category), newCell = area(after).cells.find(cell => cell.categoryId === category)
    assert.equal(oldCell.count, oldCount); assert.equal(newCell.count, newCount)
    assert.equal(oldCell.locatedCount, oldLocated); assert.equal(newCell.locatedCount, newLocated)
    assert.equal(newCell.businessIds.filter(value => value === id).length, 1)
  }
})
