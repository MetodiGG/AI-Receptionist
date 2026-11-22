import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyReviewedNearbyAddressPoints20261122 } from '../lib/discovery/catalogue-data/nearby-address-points-20261122.mjs'
import { catalogueRecordSchema, approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { pricingIdentity, assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { serviceDisplayName, businessDisplayAddress } from '../lib/locale/public-content.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

const now = Date.parse('2026-11-22T12:00:00Z')
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const cases = [
  { id: 'sofia-shining-polishing-auto', quarter: 'НПЗ Искър', category: 'detailing', count: 12,
    latitude: 42.659126, longitude: 23.412371, addressId: '96395',
    oldHash: '56947f97d1895a6b62564511bcf5d63edaf67bfff3cdef6f270370b8e75604f7',
    serviceHash: '9021194eb2605cd61603661c413e5f985b4ea286c6582519881453dc8b50ef21',
    pricingIdentity: '4b769b2d63c98e9845b61f4e21b02598a96939a6d52211511b10d410dda4a5c4',
    reviewHash: '9f7558345b3479f0e8f16209469895727fc9fdde29e58fbc38205473ea5f293f',
    checkedOn: '2026-11-10', validUntil: '2027-02-08', state: 'reviewed', prices: 12 },
  { id: 'sofia-vas-val-auto-malashevtsi-lavandula53', quarter: 'Малашевци', category: 'auto_repair', count: 1,
    latitude: 42.718868, longitude: 23.353062, addressId: '30118',
    oldHash: 'f057568bc34af2565172918c9ed9e4de1104ed56d86022992ade420148881954',
    serviceHash: '3e785ea3a5518492844dd1951744600b4634ab02c8ac89ce7712dab45244e81d',
    pricingIdentity: 'bfe86c77d5b6a43734f08920dffabe3ce50d0d8fab2c90b7dce06a33a3d85424',
    reviewHash: '5d90ac70d7135904bd6e034e7db81803ed6f9fd0d9b89e5d5aa20a718ed385d9',
    checkedOn: '2026-11-16', validUntil: '2027-02-14', state: 'service_reviewed', prices: 0 },
  { id: 'sofia-diva-zone-mladost2-bg-shkolo', quarter: 'Младост 2', category: 'fitness', count: 1,
    latitude: 42.6360833, longitude: 23.3650101,
    oldHash: '9c1ed8de43c41000b64c90d65fdc66c7c348852454b53a98181a4ac42e4f04f7',
    serviceHash: 'ca588d5391360a46dc7d9a5709728a2eb7cd0839892a74c1807554ad5950a9a4',
    pricingIdentity: 'b0e0e279c605bd7d1f549ea5fea184ca524479456cf604babaa8faeee5894bcb',
    reviewHash: 'f8c530aed88a7fc932ae3f6b2fd7e30811c4e9f07f04f1f7650d4462cc0e9b75',
    checkedOn: '2026-11-14', validUntil: '2027-02-12', state: 'service_reviewed', prices: 0 },
]
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const beforePoint = entry => ({ ...entry, coordinates: null })
const pointPair = entry => ({ latitude: entry.latitude, longitude: entry.longitude })
const cell = (report, expected) => [...report.neighborhoods, ...report.additionalNamedAreas]
  .find(area => area.name === expected.quarter).cells.find(item => item.categoryId === expected.category)

test('three existing premises get only reviewed points; inventories, fees, review bindings and business expiry stay frozen', () => {
  for (const expected of cases) {
    const current = row(expected.id), before = beforePoint(current)
    assert.equal(SOFIA_CATALOGUE.filter(item => item.id === expected.id).length, 1)
    assert.ok(current.coordinates, 'the accepted point must be wired into the public Sofia pipeline')
    assert.equal(hash(before), expected.oldHash)
    assert.equal(hash(current.services), expected.serviceHash)
    assert.equal(current.services.length, expected.count)
    assert.equal(pricingIdentity(current), expected.pricingIdentity)
    assert.equal(pricingIdentity(before), expected.pricingIdentity)
    assert.equal(current.verification.checkedOn, expected.checkedOn)
    assert.equal(current.verification.validUntil, expected.validUntil)
    const review = BOOKING_PRICE_REVIEWS.find(item => item.id === expected.id)
    assert.equal(hash(review), expected.reviewHash)
    assert.deepEqual(assessPricingReview(current, review, now), assessPricingReview(before, review, now))
    assert.equal(assessPricingReview(current, review, now).state, expected.state)
    assert.equal(assessPricingReview(current, review, now).reviewedPriceCount, expected.prices)
    assert.equal(catalogueBoundCoordinates(current), current.coordinates)
    assert.equal(catalogueRecordSchema.safeParse(current).success, true)
  }
})

test('Shining and Vas Val use exact reviewed municipal pairs with attribution, never a repaired owner GPS string', () => {
  for (const expected of cases.slice(0, 2)) {
    const current = row(expected.id)
    assert.deepEqual(current.coordinates, {
      ...pointPair(expected), source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: current.address, sourceCityCode: '68134', sourceNeighborhood: expected.quarter,
      sourceWebsite: current.website, checkedOn: '2026-11-22', addressId: expected.addressId,
      licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    })
  }
  const vasVal = row(cases[1].id)
  assert.equal(vasVal.coordinates.source, OFFICIAL_SOFIA_SOURCE_URL)
  assert.equal(vasVal.services[0].price, undefined)
  assert.equal(vasVal.services[0].durationMin, undefined)
})

test('DIVA uses its named BG Shkolo hall marker, not head-office metadata, another venue or a campus postal centre', () => {
  const current = row(cases[2].id)
  assert.deepEqual(current.coordinates, {
    ...pointPair(cases[2]), source: 'https://www.divazone.bg/zali/',
    method: 'first_party_coordinates', sourceAddress: current.address,
  })
  assert.equal(current.neighborhood, 'Младост 2')
  assert.match(current.address, /БГ Школо$/u)
  assert.notDeepEqual(pointPair(current.coordinates), { latitude: 42.6803761, longitude: 23.2882205 })
  assert.notDeepEqual(pointPair(current.coordinates), { latitude: 42.651499, longitude: 23.372488 })
  assert.equal(current.services[0].price, undefined)
  assert.equal(current.openingHours, undefined)
})

test('overlay is immutable/idempotent, checks every reviewed identity field and cannot overwrite any existing pin', () => {
  const ids = new Set(cases.map(item => item.id))
  for (const expected of cases) {
    const current = row(expected.id), before = beforePoint(current)
    Object.freeze(before)
    const snapshot = JSON.stringify(before)
    const [applied] = applyReviewedNearbyAddressPoints20261122([before])
    assert.equal(JSON.stringify(before), snapshot)
    assert.deepEqual(applied, current)
    for (const key of ['services', 'verification', 'booking', 'openingHours']) assert.equal(applied[key], before[key])
    assert.equal(Object.isFrozen(applied.coordinates), true)
    assert.equal(applyReviewedNearbyAddressPoints20261122([applied])[0], applied)
    for (const [field, value] of Object.entries({
      id: 'sofia-another-premises', name: 'Друг оператор', cityCode: '44238', neighborhood: 'Център',
      address: current.address + 'А', website: 'https://example.org/', phone: '+359888000000',
      locationKind: 'service_area', coordinates: { latitude: 42.7, longitude: 23.3 },
    })) {
      const changed = { ...before, [field]: value }
      assert.equal(applyReviewedNearbyAddressPoints20261122([changed])[0], changed, `${expected.id}:${field}`)
    }
    const missingCoordinates = { ...before }
    delete missingCoordinates.coordinates
    assert.equal(applyReviewedNearbyAddressPoints20261122([missingCoordinates])[0], missingCoordinates)
    assert.equal(catalogueRecordSchema.safeParse({ ...current, address: current.address + 'А' }).success, false)
    assert.equal(catalogueBoundCoordinates({ ...current, address: current.address + 'А' }), null)
  }
  const inputs = SOFIA_CATALOGUE.map(entry => ids.has(entry.id) ? beforePoint(entry) : entry)
  const outputs = applyReviewedNearbyAddressPoints20261122(inputs)
  assert.equal(outputs.length, inputs.length)
  assert.deepEqual(outputs.filter((entry, index) => entry !== inputs[index]).map(entry => entry.id).sort(), [...ids].sort())
})

test('new usable points unlock GPS radius only within exact quarter/category/city and never extend older eligibility', () => {
  for (const expected of cases) {
    const current = row(expected.id), before = beforePoint(current)
    const intent = { cityCode: '68134', neighborhood: expected.quarter, category: expected.category, browse: true, searchV2: true,
      coordinates: { ...pointPair(expected), consent: true }, radiusKm: 0.25 }
    assert.deepEqual(normalizeCatalogueBusinesses([before], intent, { now }), [])
    const [found] = normalizeCatalogueBusinesses([current], intent, { now })
    assert.ok(found)
    assert.deepEqual(found.coordinates, pointPair(expected))
    assert.equal(rankCatalogueBusinesses([], [found], intent)[0].distanceKm, 0)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    assert.deepEqual(normalizeCatalogueBusinesses([current], { ...intent, neighborhood: 'Друг квартал' }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([current], { ...intent, cityCode: '44238' }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([current], { ...intent, category: 'barber' }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([current], { ...intent,
      coordinates: { latitude: expected.latitude + 0.02, longitude: expected.longitude, consent: true } }, { now }), [])
    const expired = Date.parse(expected.validUntil + 'T12:00:00Z') + 86400000
    assert.equal(approvedCatalogueRecord(current, expired), null)
    assert.deepEqual(normalizeCatalogueBusinesses([current], intent, { now: expired }), [])
    if (expected.addressId) assert.deepEqual(found.coordinateAttribution, { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL })
    else assert.equal(found.coordinateAttribution, undefined)
  }
})

test('public details and both-language presentation/onboarding preserve services, price conditions and correct action destinations', async () => {
  const handler = entry => createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now,
    allowAttempt: () => true, findCatalogue: id => id === entry.id ? entry : null,
    readCataloguePhotos: async () => [], readPartner: () => { throw Error('No private/native lookup') } })
  for (const expected of cases) {
    const current = row(expected.id), before = beforePoint(current)
    const request = () => new Request('https://www.gorez.co/api/public/discovery/business/' + current.id)
    const response = await handler(current)(request(), current.id)
    const previousResponse = await handler(before)(request(), current.id)
    assert.equal(response.status, 200); assert.equal(previousResponse.status, 200)
    const { business } = await response.json(), { business: previous } = await previousResponse.json()
    assert.deepEqual(business.coordinates, pointPair(expected))
    assert.deepEqual(business.details, previous.details)
    assert.equal(business.details.services.length, expected.count)
    const [oldPublic] = normalizeCatalogueBusinesses([before], { cityCode: '68134', browse: true, searchV2: true }, { now })
    const [newPublic] = normalizeCatalogueBusinesses([current], { cityCode: '68134', browse: true, searchV2: true }, { now })
    assert.deepEqual(newPublic.services, oldPublic.services)
    assert.deepEqual(railExternalAction(newPublic, now), railExternalAction(oldPublic, now))
    assert.equal(businessMapsDirectionsUrl(current), businessMapsDirectionsUrl(before))
    assert.equal(new URL(businessMapsDirectionsUrl(current)).searchParams.get('destination'), current.address + ', България')
    for (const locale of ['bg', 'en']) {
      assert.equal(businessDisplayAddress(business, locale), businessDisplayAddress(previous, locale))
      assert.deepEqual(business.details.services.map(service => serviceDisplayName(service, locale)),
        previous.details.services.map(service => serviceDisplayName(service, locale)))
      const oldDraft = catalogueOnboardingDetail([before], current.id, { now, cityCode: '68134', locale })
      const draft = catalogueOnboardingDetail([current], current.id, { now, cityCode: '68134', locale })
      assert.deepEqual(draft.services, oldDraft.services)
      if (expected.addressId) assert.deepEqual(draft.business, oldDraft.business, 'municipal attribution must not be stripped into an uncredited owner pin')
      else {
        assert.deepEqual(draft.business.coordinates, current.coordinates)
        const { coordinates, ...rest } = draft.business
        assert.deepEqual(rest, oldDraft.business)
      }
    }
  }
})

test('three point recoveries change only located coverage, never quotas, business counts or neighborhood membership', () => {
  const current = cases.map(expected => row(expected.id)), before = current.map(beforePoint)
  const old = catalogueCoverageReport(before, { now, target: 30 }), after = catalogueCoverageReport(current, { now, target: 30 })
  for (const field of ['sourceRecords', 'approvedBusinesses', 'premises', 'serviceAreaProviders', 'mappedPickerPremises',
    'observedAdditionalAreaPremises', 'missingNeighborhoodPremises', 'businessCategoryIncidences', 'outstandingBusinessCategoryIncidences']) {
    assert.equal(after.counts[field], old.counts[field], field)
  }
  assert.equal(after.counts.premisesWithBoundCoordinates, old.counts.premisesWithBoundCoordinates + 3)
  assert.equal(after.counts.premisesWithoutBoundCoordinates, old.counts.premisesWithoutBoundCoordinates - 3)
  for (const expected of cases) {
    assert.equal(cell(after, expected).count, cell(old, expected).count)
    assert.deepEqual(cell(after, expected).businessIds, cell(old, expected).businessIds)
    assert.equal(cell(after, expected).locatedCount, cell(old, expected).locatedCount + 1)
  }
})

test('runtime overlay has no fetching, CSV, crypto or dynamic review-binding machinery', async () => {
  const source = await readFile(new URL('../lib/discovery/catalogue-data/nearby-address-points-20261122.mjs', import.meta.url), 'utf8')
  const code = source.replace(/\/\/[^\n]*/gu, '')
  assert.doesNotMatch(code, /\b(?:fetch|readFile|writeFile|createHash|pricingIdentity|matchOfficialSofiaAddress|Date\.now)\s*\(/u)
  assert.doesNotMatch(source, /from ['"]node:|import\s*\(/u)
})
