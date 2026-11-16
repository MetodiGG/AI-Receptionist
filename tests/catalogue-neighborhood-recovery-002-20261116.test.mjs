import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import beauty from '../lib/discovery/catalogue-data/beauty-expansion-v2.json' with { type: 'json' }
import psychology from '../lib/discovery/catalogue-data/neighborhood-psychology-pets-more-20261113.mjs'
import sport from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-008-20261113.mjs'
import legacyPrices from '../lib/discovery/catalogue-data/pricing-review-baseline-20261110.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { catalogueRecordSchema, approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
// Captured BEFORE the five quarter-only edits, against published baseline
// dc465f4. Restoring just neighborhood:null must reproduce each old record,
// including all contacts, receipts, prices, services and null map points.
const recoveries = [
  { id: 'sofia-terra-adora-spa-beauty', neighborhood: 'Красно село',
    rawHash: 'afe0cbcccba1279888165b5990844c6587965eca72e1e2d1d44630056afda116',
    normalizedHash: 'afe0cbcccba1279888165b5990844c6587965eca72e1e2d1d44630056afda116',
    pricingIdentity: '624643ae847fda62c28d0c2235b5d34f39c7d5159515fbd2751539e4d2d7b471',
    reviewHash: null, reviewState: 'pending', categories: ['hair', 'nails'] },
  { id: 'sofia-stimul-psychiatry-pimen-zografski38', neighborhood: 'Дианабад',
    rawHash: '52aa2992f4bfe2c05068055379175679ad3d54e045d27e2a9f6b12cad222d8ca',
    normalizedHash: 'ff1fe36a536d2e2c36a5ed9b7c859a0bfdc6db5657e522684727c1f9fde000b5',
    pricingIdentity: '430e31236960b1929881a58fbb0b1d36fc5a7089e1b02fd00cfd3d0ccfdf50a1',
    reviewHash: 'e9d4ba58865550ca68dbedeff7109765127ee0e85211bc196c40b81e9deade4a',
    reviewState: 'reviewed', categories: ['other'] },
  { id: 'sofia-nadezhda-muzdrakova-joliot-curie20', neighborhood: 'Изгрев',
    rawHash: '4c2770542a77ef1aadc40f94e7789246da5f2fecc30b7c29e82e9694cecafff9',
    normalizedHash: '5e25f02465950227a849096a0380de6336ce2383aa752166728af790dd7b4210',
    pricingIdentity: 'b173ab86ad16229dedcf526ed54ee86d5d5bf7379b5d56b73b6263d9f35005fe',
    reviewHash: 'ad7d2c7658da958bd64b676067e5ce87bcb38a1b65ee9a93fe5a761663e7a965',
    reviewState: 'service_reviewed', categories: ['other'] },
  { id: 'sofia-petya-dimova-hadzhi-dimitar19', neighborhood: 'Център',
    rawHash: '51cfb5f1041a1df2cf571cb86cb289e5c00f646aa635c115b7d6db1c8de18e0a',
    normalizedHash: 'f384c0330fb0c36ade41ab998956bb1797bbc3c844fb89748d86449be140f491',
    pricingIdentity: '90d629df78b06fffab91fd653ee63acbdb78d0b24434755d463755acb6d24d19',
    reviewHash: '291a221ca6590a1a7ebe9c90ea32f35a86083b44916bcd125b3c5c288294da49',
    reviewState: 'service_reviewed', categories: ['other'] },
  { id: 'sofia-ax-horca-veda-fondovi25a', neighborhood: 'Фондови жилища',
    rawHash: 'd3119215db8de7a249ab8bf9ea882be84bf31e7705d8da37e9e4a6c52cd3e329',
    normalizedHash: 'aefcbd5c108a0eb5ade6f1b27f4eedccaeae97e0cdd114671d0398b85823b98e',
    pricingIdentity: 'bb218bb61f5950dafce0936cec63dbef05bd792d3fee688cfb9a980aab4b2b77',
    reviewHash: '1e02e6f87399274a1ad7aa63f74499b1485e2e35698feb3c82d8f55a7fe9a640',
    reviewState: 'reviewed', categories: ['fitness'] },
]
const sourceRecords = [...beauty, ...psychology.records, ...sport.records]
const record = id => SOFIA_CATALOGUE.find(row => row.id === id)

test('five sourced quarter recoveries remain unique, strict-schema valid and currently eligible', () => {
  for (const expected of recoveries) {
    const source = sourceRecords.find(row => row.id === expected.id), row = record(expected.id)
    assert.ok(source && row, expected.id)
    assert.equal(SOFIA_CATALOGUE.filter(item => item.id === expected.id).length, 1, 'An existing venue is not cloned')
    assert.equal(source.neighborhood, expected.neighborhood)
    assert.equal(row.neighborhood, expected.neighborhood)
    assert.equal(row.locationKind, 'premises')
    assert.equal(row.cityCode, '68134')
    assert.equal(catalogueRecordSchema.safeParse(source).success, true, expected.id)
    assert.equal(catalogueRecordSchema.safeParse(row).success, true, expected.id)
    assert.equal(catalogueRecordSchema.safeParse({ ...row, inventedField: true }).success, false)
    assert.ok(approvedCatalogueRecord(row, now), expected.id)
    assert.deepEqual([...new Set(row.services.map(service => service.category))], expected.categories)
  }
})

test('the raw source and normalized record differ from the published baseline only in neighborhood', () => {
  for (const expected of recoveries) {
    const source = sourceRecords.find(row => row.id === expected.id), row = record(expected.id)
    assert.equal(hash({ ...source, neighborhood: null }), expected.rawHash, `${expected.id}: source fields changed beyond neighborhood`)
    assert.equal(hash({ ...row, neighborhood: null }), expected.normalizedHash, `${expected.id}: public fields changed beyond neighborhood`)
    assert.equal(row.coordinates, null, expected.id)
    assert.equal(catalogueBoundCoordinates(row), null, 'No map point is inferred from a known quarter')
    assert.equal(row.gorezBusinessId, undefined, 'Recovery does not create or claim a native partner')
  }
})

test('service/price identity and review receipts retain their original exact fingerprints and review status', () => {
  for (const expected of recoveries) {
    const row = record(expected.id), review = BOOKING_PRICE_REVIEWS.find(item => item.id === expected.id)
    assert.equal(pricingIdentity(row), expected.pricingIdentity, expected.id)
    assert.equal(pricingIdentity({ ...row, neighborhood: null }), expected.pricingIdentity)
    assert.equal(review ? hash(review) : null, expected.reviewHash, `${expected.id}: historical receipt was refreshed`)
    assert.equal(assessPricingReview(row, review, now).state, expected.reviewState)
    if (!review) {
      // Terra Adora remains a grandfathered, pending price review; an address
      // correction must never be reported as a new completed tariff review.
      assert.equal(legacyPrices.find(item => item.id === row.id)?.identity, expected.pricingIdentity)
      assert.equal(assessPricingReview(row, review, now).reason, 'booking_price_review_required')
    }
  }
  assert.equal(recoveries.reduce((sum, expected) => sum + record(expected.id).services.filter(service => service.price).length, 0), 2)
})

test('shared registration lookup exposes the recovered quarter in BG/EN without changing service drafts or inventing coordinates', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => now, allowAttempt: () => true })
  for (const expected of recoveries) for (const locale of ['bg', 'en']) {
    const row = record(expected.id), previous = { ...row, neighborhood: null }
    const before = catalogueOnboardingDetail([previous], row.id, { now, cityCode: '68134', locale })
    const after = catalogueOnboardingDetail(SOFIA_CATALOGUE, row.id, { now, cityCode: '68134', locale })
    assert.equal(after.business.neighborhood, expected.neighborhood)
    assert.deepEqual({ ...after.business, neighborhood: null }, before.business, row.id)
    assert.deepEqual(after.services, before.services, row.id)
    assert.equal(after.business.coordinates, undefined)
    const matches = searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: row.name, cityCode: '68134' }, { now })
    assert.equal(matches.find(item => item.id === row.id)?.neighborhood, expected.neighborhood)
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${row.id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200, row.id)
    const body = await response.json()
    assert.equal(body.business.neighborhood, expected.neighborhood)
    assert.deepEqual(body.services, before.services)
    assert.equal(body.business.coordinates, undefined)
  }
})

test('public quarter/category filtering finds each recovered existing venue and preserves all matching service IDs and booking targets', () => {
  for (const expected of recoveries) for (const category of expected.categories) {
    const row = record(expected.id), intent = { cityCode: '68134', neighborhood: expected.neighborhood, category, browse: true, searchV2: true }
    const results = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, intent, { now })
    const found = results.find(item => item.id === row.id)
    assert.ok(found, `${row.id}: ${expected.neighborhood}/${category}`)
    assert.equal(results.filter(item => item.id === row.id).length, 1)
    assert.equal(found.neighborhood, expected.neighborhood)
    assert.equal(found.address, row.address)
    assert.equal(found.coordinates, null)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    const originalIds = row.services.map((service, index) => ({ service, id: `${row.id}-${index}` }))
      .filter(item => item.service.category === category).map(item => item.id)
    assert.deepEqual(found.services.map(service => service.id), originalIds)
    assert.ok(found.services.every(service => service.category === category))
    assert.equal(found.booking.kind, row.booking.kind)
    assert.equal(found.booking.url ?? found.booking.phone, row.booking.url ?? row.booking.phone)
    assert.equal(normalizeCatalogueBusinesses([{ ...row, neighborhood: null }], intent, { now }).length, 0, 'The old missing quarter did not falsely match')
    assert.equal(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Свобода' }, { now }).length, 0, 'The corrected venue is not copied into an unrelated quarter')
  }
})
