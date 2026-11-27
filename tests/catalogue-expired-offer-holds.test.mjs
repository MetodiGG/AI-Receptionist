import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyExpiredCatalogueOffers, expiredCatalogueOfferHold } from '../lib/discovery/catalogue-expired-offer-holds.mjs'
import { auditCataloguePricing } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { PUBLIC_CATALOGUE, PUBLIC_CATALOGUE_PRICE_REVIEWS } from '../lib/discovery/public-catalogue.mjs'
import { cataloguePublicationState } from '../scripts/check-sofia-catalogue.mjs'

const ids = ['sofia-balance-reformer-ovcha-kupel', 'sofia-maximum-solunska8']
const records = ids.map(id => PUBLIC_CATALOGUE.find(row => row.id === id))
const receipts = [...BOOKING_PRICE_REVIEWS, ...PUBLIC_CATALOGUE_PRICE_REVIEWS].filter(row => ids.includes(row.id))
const finalDay = Date.parse('2026-11-25T12:00:00Z')
const expired = Date.parse('2026-11-26T12:00:00Z')
const pricingReport = (rows, reviews, now) => classifyExpiredCatalogueOffers(auditCataloguePricing(rows, [], reviews, now), rows, reviews, now)

test('declared offer expiry leaves the original source records but removes both unconfirmed listings from publication', () => {
  for (const row of records) assert.equal(expiredCatalogueOfferHold(row, finalDay), null)
  assert.deepEqual(cataloguePublicationState(records, finalDay).current.map(row => row.id), ids)
  const after = cataloguePublicationState(records, expired)
  assert.deepEqual(after.rows, records)
  assert.deepEqual(after.rows.map(row => row.services.length), [3, 1])
  assert.deepEqual(after.current, [])
  assert.deepEqual(after.recheck, [])
  assert.deepEqual(after.withheldExpiredOffers.map(hold => hold.id), ids)
})

test('pricing gate reports these expired offers separately without counting them as verified', () => {
  assert.equal(pricingReport(records, receipts, finalDay).summary.sourceReviewed, 2)
  for (const now of [expired, Date.parse('2027-04-01T12:00:00Z')]) {
    const report = pricingReport(records, receipts, now)
    assert.equal(report.summary.sourceReviewed, 0)
    assert.equal(report.summary.pending, 0)
    assert.equal(report.summary.withheldExpiredOffers, 2)
    assert.deepEqual(report.records.map(row => row.state), ['withheld_expired_offer', 'withheld_expired_offer'])
    assert.deepEqual(report.blocking, [])
  }
})

test('the 26 November ART Izba event passes the deployment check only as already withheld after expiry', () => {
  const id = 'sofia-artizba-cherni-vrah33e'
  const old = PUBLIC_CATALOGUE.find(row => row.id === id)
  const review = BOOKING_PRICE_REVIEWS.find(entry => entry.id === id)
  const lastDay = Date.parse('2026-11-26T23:59:59Z')
  const after = Date.parse('2026-11-27T00:00:00Z')
  assert.equal(expiredCatalogueOfferHold(old, lastDay), null)
  assert.equal(pricingReport([old], [review], lastDay).summary.sourceReviewed, 1)
  assert.deepEqual(cataloguePublicationState([old], after).current, [])
  assert.deepEqual(expiredCatalogueOfferHold(old, after), {
    id, validThrough: '2026-11-26', reason: 'single_dated_painting_event_expired',
  })
  const report = pricingReport([old], [review], after)
  assert.equal(report.summary.withheldExpiredOffers, 1)
  assert.equal(report.summary.sourceReviewed, 0)
  assert.deepEqual(report.blocking, [])
  assert.equal(pricingReport([old], [], after).blocking.length, 1)
  const changed = { ...old, services: old.services.map(s => ({ ...s, name: s.name + ' · нова дата' })) }
  assert.equal(expiredCatalogueOfferHold(changed, after), null)
  assert.equal(pricingReport([changed], [review], after).blocking.length, 1)
})

test('a changed record or missing/conflicting pricing receipt cannot be excused by a historical hold', () => {
  const [original] = records
  const review = receipts.find(row => row.id === original.id)
  const changed = { ...original, services: original.services.map(service => ({ ...service, price: { ...service.price, amount: service.price.amount + 1 } })) }
  assert.equal(expiredCatalogueOfferHold(changed, expired), null)
  const state = cataloguePublicationState([changed], expired)
  assert.deepEqual(state.withheldExpiredOffers, [])
  assert.deepEqual(state.recheck.map(row => row.id), [original.id])
  assert.equal(pricingReport([changed], [review], expired).blocking.length, 1)
  assert.equal(pricingReport([original], [], expired).blocking[0].reason, 'booking_price_review_required')
  const conflict = { ...review, pricingDecision: 'hold_conflicting_sources' }
  assert.equal(pricingReport([original], [conflict], expired).blocking[0].reason, 'conflicting_published_prices_require_owner_confirmation')
  const malformed = { ...original, services: [{ ...original.services[0], price: { ...original.services[0].price, amount: -1 } }] }
  assert.equal(expiredCatalogueOfferHold(malformed, expired), null)
  assert.throws(() => cataloguePublicationState([malformed], expired))
})
