import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyReviewedAddressPoints20261122 } from '../lib/discovery/catalogue-data/address-points-recovery-20261122.mjs'
import { catalogueRecordSchema, approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { pricingIdentity, assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { cataloguePublicLocation } from '../lib/discovery/catalogue-public-location.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

const now = Date.parse('2026-11-22T12:00:00Z')
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const cases = [
  { id: 'sofia-maria-nemska-photo-suhodol', quarter: 'Суходол', category: 'other', serviceCount: 3,
    oldHash: 'f8cb0c98fe04fcb88426e6bdeceec8e3a4fa13bbb45d387af7516ebe6994ee13',
    newHash: 'c2f879493cb254b814bce4b07c8523572e21006dcdde0b774cee549781ed0767',
    pointHash: '6c2739a0bb0e060730e6f0f0a02b9558c43deb59ecb0f8daff821faf5babf6d1',
    pricingIdentity: '483c75b2c2435a9d4b3a9b30aef2093804cc67eaa4f1d8bb1b60d27d5feba12b',
    reviewHash: '7909062a50b1bc7523987349da0e32cf371cb4dad0fe8da7d2755223e68bada8',
    serviceHash: 'dc38af4cb3688925056019a576bb7cd63dc8f4efdaa5e0b3ecefa73e82fb75a2',
    checkedOn: '2026-11-16', validUntil: '2026-12-16', reviewState: 'reviewed', prices: 3 },
  { id: 'sofia-dar-auto-service-europa', quarter: 'Люлин 1', category: 'auto_repair', serviceCount: 1,
    oldHash: 'c837c373b5f64ae70cd684db0134a4db3ab22b977c00bcbc6f7de991b165467b',
    newHash: 'd784093cbd673638fcf508075e10ef21ec20eabc86d73bf7f1569297fae79bec',
    pointHash: '28672e753592c01c5068bcd172b6cf4dcf2f70e56b3e0c74ac50e1931b4dd6db',
    pricingIdentity: '7ac7a4bf8058dbafe4e47072b64bf6378ebf7cba3772a98b05caf02f07474372',
    reviewHash: '9bfc98ed7bc16a03db45da637d480319e6b9ffaaaec67e141a47c66c02f09bc7',
    serviceHash: '98c95246cb49d6698b90071bed1958ef24751f3ebaafe1caeedebc42b148120e',
    checkedOn: '2026-11-13', validUntil: '2027-02-11', reviewState: 'service_reviewed', prices: 0 },
]
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const previous = entry => ({ ...entry, coordinates: null })

test('two exact existing premises receive only their independently sourced points without changing names, quarters, source inventories or price reviews', () => {
  for (const expected of cases) {
    const current = row(expected.id), before = previous(current)
    assert.equal(SOFIA_CATALOGUE.filter(item => item.id === expected.id).length, 1)
    assert.equal(hash(before), expected.oldHash); assert.equal(hash(current), expected.newHash)
    assert.equal(current.neighborhood, expected.quarter); assert.equal(current.services.length, expected.serviceCount)
    assert.equal(hash(current.services), expected.serviceHash); assert.equal(pricingIdentity(current), expected.pricingIdentity)
    assert.equal(pricingIdentity(before), expected.pricingIdentity)
    assert.equal(hash(current.coordinates), expected.pointHash)
    assert.equal(catalogueBoundCoordinates(current), current.coordinates)
    assert.equal(current.verification.checkedOn, expected.checkedOn); assert.equal(current.verification.validUntil, expected.validUntil)
    const review = BOOKING_PRICE_REVIEWS.find(item => item.id === expected.id)
    assert.equal(hash(review), expected.reviewHash)
    assert.deepEqual(assessPricingReview(current, review, now), assessPricingReview(before, review, now))
    assert.equal(assessPricingReview(current, review, now).state, expected.reviewState)
    assert.equal(assessPricingReview(current, review, now).reviewedPriceCount, expected.prices)
  }
})

test('Maria uses the single exact municipal house candidate, not its administrative district, a guessed entrance or an attendance schedule', async () => {
  const current = row(cases[0].id)
  assert.deepEqual(current.coordinates, { latitude: 42.695082, longitude: 23.22738,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: 'София, Суходол, ул. Траян Танев 21', sourceCityCode: '68134', sourceNeighborhood: 'Суходол',
    sourceWebsite: 'https://marianemska.com/', checkedOn: '2026-11-22', addressId: '88442',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION })
  assert.equal(current.neighborhood, 'Суходол'); assert.notEqual(current.neighborhood, 'Овча купел')
  assert.equal(current.openingHours, undefined)
  assert.ok(current.services.every(service => service.durationMin === undefined && /обявените дати.*потвърждава/u.test(service.description)))
  const ledger = JSON.parse(await readFile(new URL('../docs/catalogue-coverage/address-points-review-20261122.json', import.meta.url), 'utf8'))
  const evidence = ledger.accepted.find(item => item.id === current.id)
  assert.equal(evidence.matchStatus, 'unique'); assert.equal(evidence.candidateCount, 1)
  assert.equal(evidence.municipalRow.rn, '88442'); assert.equal(evidence.municipalRow.entrance, '')
  assert.equal(evidence.municipalRow.region, 'Овча купел')
  assert.equal(ledger.municipalSource.originalFileChanged, false)
  assert.equal(ledger.municipalSource.sourceSha256, '0cd8c9d19996c0654707f711cb8d559a23e0a95148d4b8c6016aad76de2140ef')
})

test('DAR uses only the named owner AutoRepair entity point bound to Europe138, not an invented municipal match or tariff', async () => {
  const current = row(cases[1].id)
  assert.deepEqual(current.coordinates, { latitude: 42.7320882, longitude: 23.2553455,
    source: 'https://dar.autos/avtoservice', method: 'first_party_coordinates',
    sourceAddress: 'София, Люлин 1, бул. Европа 138' })
  assert.equal(current.services[0].price, undefined)
  const ledger = JSON.parse(await readFile(new URL('../docs/catalogue-coverage/address-points-review-20261122.json', import.meta.url), 'utf8'))
  const evidence = ledger.accepted.find(item => item.id === current.id)
  assert.equal(evidence.matchStatus, 'explicit_owner_named_business_point'); assert.equal(evidence.municipalCandidateCount, 0)
  assert.equal(evidence.ownerStructuredEntity.type, 'AutoRepair')
  assert.equal(evidence.ownerStructuredEntity.name, 'ДАР АУТО СЕРВИЗ')
  assert.equal(evidence.ownerStructuredEntity.telephone, current.phone)
  assert.equal(evidence.ownerStructuredEntity.latitude, current.coordinates.latitude)
  assert.equal(evidence.ownerStructuredEntity.longitude, current.coordinates.longitude)
  assert.equal(evidence.ownerStructuredEntity.url, current.coordinates.source)
  assert.equal(evidence.ownerSourceBodySha256, '6d3cba86e5bc90c99c50be0ef95b9923b1ba43862983f3137875ee483d65d74c')
})

test('the two-point overlay is immutable, idempotent and cannot overwrite an existing pin or attach a point after branch/address/contact context changes', () => {
  for (const expected of cases) {
    const current = row(expected.id), before = previous(current), original = JSON.stringify(before)
    const applied = applyReviewedAddressPoints20261122([before])[0]
    assert.equal(JSON.stringify(before), original); assert.deepEqual(applied, current)
    assert.equal(applied.services, before.services); assert.equal(applied.verification, before.verification)
    assert.equal(applied.booking, before.booking); assert.equal(applied.openingHours, before.openingHours)
    assert.equal(applyReviewedAddressPoints20261122([applied])[0], applied)
    for (const [field, value] of Object.entries({ id: 'sofia-another-premises', name: 'Друг оператор', cityCode: '44238',
      neighborhood: 'Център', address: current.address + 'А', website: 'https://example.org/', phone: '+359888000000',
      locationKind: 'service_area', coordinates: { latitude: 42.7, longitude: 23.3 } })) {
      const changed = { ...before, [field]: value }
      assert.equal(applyReviewedAddressPoints20261122([changed])[0], changed, expected.id + ':' + field)
    }
    assert.equal(catalogueRecordSchema.safeParse({ ...current, address: current.address + 'А' }).success, false)
    assert.equal(catalogueBoundCoordinates({ ...current, address: current.address + 'А' }), null)
  }
})

test('GPS-radius discovery now admits each existing venue at its supplied point without bypassing exact quarter, city or unchanged record expiry', () => {
  for (const expected of cases) {
    const current = row(expected.id), before = previous(current)
    const intent = { cityCode: '68134', neighborhood: expected.quarter, category: expected.category, browse: true, searchV2: true,
      coordinates: { latitude: current.coordinates.latitude, longitude: current.coordinates.longitude, consent: true }, radiusKm: 0.25 }
    assert.deepEqual(normalizeCatalogueBusinesses([before], intent, { now }), [])
    const [found] = normalizeCatalogueBusinesses([current], intent, { now })
    assert.ok(found); assert.deepEqual(found.coordinates, { latitude: current.coordinates.latitude, longitude: current.coordinates.longitude })
    assert.equal(rankCatalogueBusinesses([], [found], intent)[0].distanceKm, 0)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    assert.deepEqual(normalizeCatalogueBusinesses([current], { ...intent, neighborhood: 'Друг квартал' }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([current], { ...intent, cityCode: '44238' }, { now }), [])
    const expired = Date.parse(expected.validUntil + 'T12:00:00Z') + 86400000
    assert.equal(approvedCatalogueRecord(current, expired), null)
    assert.deepEqual(normalizeCatalogueBusinesses([current], intent, { now: expired }), [], 'a new coordinate must not extend the older business/service review')
    if (expected.id === cases[0].id) assert.deepEqual(found.coordinateAttribution, { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL })
  }
})

test('public details and BG/EN onboarding preserve all old service/price/action facts and existing attribution-aware point import policy', async () => {
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now, allowAttempt: () => true,
    findCatalogue: id => row(id), readCataloguePhotos: async () => [], readPartner: () => { throw Error('No private/native lookup') } })
  for (const expected of cases) {
    const current = row(expected.id), before = previous(current)
    const response = await handler(new Request('https://www.gorez.co/api/public/discovery/business/' + expected.id), expected.id)
    assert.equal(response.status, 200)
    const { business } = await response.json()
    assert.deepEqual(business.coordinates, { latitude: current.coordinates.latitude, longitude: current.coordinates.longitude })
    assert.equal(business.details.services.length, expected.serviceCount)
    const [oldPublic] = normalizeCatalogueBusinesses([before], { cityCode: '68134', browse: true, searchV2: true }, { now })
    const [newPublic] = normalizeCatalogueBusinesses([current], { cityCode: '68134', browse: true, searchV2: true }, { now })
    assert.deepEqual(newPublic.services, oldPublic.services); assert.deepEqual(newPublic.details, oldPublic.details)
    assert.deepEqual(railExternalAction(newPublic, now), railExternalAction(oldPublic, now))
    assert.equal(business.address, current.address)
    assert.equal(businessMapsDirectionsUrl(oldPublic), null, 'No pre-review address search')
    assert.equal(new URL(businessMapsDirectionsUrl(business)).searchParams.get('destination'),
      `${current.coordinates.latitude},${current.coordinates.longitude}`)
    assert.equal(businessMapsDirectionsUrl({ ...newPublic, navigationLocation: cataloguePublicLocation(current) }), businessMapsDirectionsUrl(business))
    for (const locale of ['bg', 'en']) {
      const oldDraft = catalogueOnboardingDetail([before], current.id, { now, cityCode: '68134', locale })
      const draft = catalogueOnboardingDetail([current], current.id, { now, cityCode: '68134', locale })
      assert.deepEqual(draft.services, oldDraft.services)
      if (expected.id === cases[0].id) assert.deepEqual(draft.business, oldDraft.business, 'municipal attribution is not silently stripped to a partner-owner pin')
      else {
        assert.deepEqual(draft.business.coordinates, current.coordinates, 'the existing first-party point import contract remains intact')
        const { coordinates, ...rest } = draft.business
        assert.deepEqual(rest, oldDraft.business)
      }
    }
  }
})

test('two existing point recoveries improve only located counts, not physical quotas, services, business totals or unknown-quarter membership', () => {
  const current = cases.map(expected => row(expected.id)), before = current.map(previous)
  const old = catalogueCoverageReport(before, { now, target: 30 }), after = catalogueCoverageReport(current, { now, target: 30 })
  for (const field of ['sourceRecords', 'approvedBusinesses', 'premises', 'serviceAreaProviders', 'mappedPickerPremises', 'missingNeighborhoodPremises', 'businessCategoryIncidences', 'outstandingBusinessCategoryIncidences']) assert.equal(after.counts[field], old.counts[field], field)
  assert.equal(after.counts.premisesWithBoundCoordinates, old.counts.premisesWithBoundCoordinates + 2)
  assert.equal(after.counts.premisesWithoutBoundCoordinates, old.counts.premisesWithoutBoundCoordinates - 2)
  for (const expected of cases) {
    const oldCell = old.neighborhoods.find(area => area.name === expected.quarter).cells.find(cell => cell.categoryId === expected.category)
    const newCell = after.neighborhoods.find(area => area.name === expected.quarter).cells.find(cell => cell.categoryId === expected.category)
    assert.equal(newCell.count, oldCell.count); assert.deepEqual(newCell.businessIds, oldCell.businessIds)
    assert.equal(oldCell.locatedCount, 0); assert.equal(newCell.locatedCount, 1)
  }
})

test('zero-match and ambiguous owner leads remain held without default houses, averaged entrances or newly admitted dental geography', async () => {
  const ledger = JSON.parse(await readFile(new URL('../docs/catalogue-coverage/address-points-review-20261122.json', import.meta.url), 'utf8'))
  assert.deepEqual(ledger.outcome, { newBusinesses: 0, newPhysicalPremises: 0, newUsableAddressPoints: 2 })
  assert.deepEqual(ledger.accepted.map(item => item.id), cases.map(item => item.id))
  for (const id of ['sofia-studio617-vrabnitsa-zlatenklas27', 'sofia-tl-autoservice']) {
    assert.equal(row(id).coordinates, null)
    assert.equal(ledger.held.find(item => item.id === id).candidateCount, 0)
  }
  const dental = ledger.held.find(item => item.candidateId === 'sofia-dentalnitsa-lomsko15')
  assert.equal(dental.candidateCount, 2); assert.deepEqual(dental.candidateEntrances, ['Б', 'А'])
  assert.ok(!PUBLIC_CATALOGUE.some(item => item.id === dental.candidateId))
  assert.equal(ledger.published, false)
})
