import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'

// Compared independently with every selected-branch rendered menu on
// 2026-11-22 (owner booking version 6.10.111), not a chain-wide teaser tariff.
const women = [
  ['Цяло лице', 30], ['Гърди', 24], ['1/2 корем', 24], ['Ръце', 28],
  ['1/2 ръце', 19], ['Мишници', 19], ['Пълен интим', 24], ['Цели крака', 45],
  ['Шия', 13], ['Врат', 13], ['Корем – лента', 13], ['Гръб', 32],
  ['Кръст', 27], ['Седалище', 24], ['Горна устна', 13], ['Брадичка', 13],
  ['Бакенбарди', 11], ['Скули', 11], ['Бедра', 27], ['Подбедрици', 27],
  ['Ареоли', 13], ['Бикини', 19], ['Уши', 13], ['Корем', 32],
]
const men = [
  ['Гръб', 54], ['Рамене', 25], ['Мишници', 22], ['Гърди', 35], ['Корем', 35],
  ['Кръст', 35], ['Седалище', 35], ['Ръце', 41], ['1/2 ръце', 25],
  ['Бедра', 49], ['Подбедрици', 41], ['Крака - бедра, подбедрици', 76],
  ['Шия', 17], ['Врат', 17], ['Уши', 15], ['Скули', 18], ['Цяло лице', 41],
]
const maleIntimateIds = [
  'sofia-gpoint-five-corners', 'sofia-gpoint-hladilnika', 'sofia-gpoint-lozenets',
  'sofia-gpoint-lyulin-10', 'sofia-gpoint-manastirski-iztok',
  'sofia-gpoint-manastirski-zapad', 'sofia-gpoint-nadezhda-5',
  'sofia-gpoint-suhata-reka', 'sofia-gpoint-zona-b19',
].sort()
const reviews = BOOKING_PRICE_REVIEWS.filter(row => row.id.startsWith('sofia-gpoint-'))
const bookingUrl = 'https://gpoint.bg/запазване-час'

test('fresh G Point receipts cover exactly 43 branch inventories and 1772 observed price facts', () => {
  assert.equal(reviews.length, 43)
  assert.equal(new Set(reviews.map(row => row.id)).size, 43)
  assert.equal(reviews.reduce((total, row) => total + row.services.length, 0), 1772)
  for (const review of reviews) {
    assert.equal(review.checkedOn, '2026-11-22', review.id)
    assert.equal(review.website, 'https://gpoint.bg/')
    assert.equal(review.bookingEntry, bookingUrl)
    assert.equal(review.bookingReview, 'owned_booking_reviewed')
    assert.deepEqual(review.reviewedUrls, ['https://gpoint.bg/', bookingUrl])
    assert.match(review.notes, /version6\.10\.111/)
    assert.match(review.notes, /seven-day internal recheck deadline is not a claimed promotion end date/)
    assert.match(review.notes, /basket remained empty/)
  }
})

test('each exact branch keeps all observed women/men zone names, current EUR fees and no crossed-out prices', () => {
  for (const review of reviews) {
    const expected = [
      ...women.map(([zone, amount]) => ['Лазерна епилация · ' + zone + ' · жени', amount]),
      ...men.map(([zone, amount]) => ['Лазерна епилация · ' + zone + ' · мъже', amount]),
      ...(maleIntimateIds.includes(review.id) ? [['Лазерна епилация · Интим · мъже', 30]] : []),
    ].sort(([a], [b]) => a.localeCompare(b))
    const actual = review.services.map(service => [service.name, service.price.amount]).sort(([a], [b]) => a.localeCompare(b))
    assert.deepEqual(actual, expected, review.id)
    assert.equal(new Set(actual.map(([name]) => name)).size, expected.length, review.id)
    for (const service of review.services) {
      assert.equal(service.price.kind, 'fixed')
      assert.equal(service.price.currency, 'EUR')
      assert.equal(service.price.sourceUrl, bookingUrl)
      assert.equal(service.price.unit, 'процедура')
      assert.equal(service.durationMin, undefined)
      assert.equal(service.price.maximum, undefined)
    }
  }
})

test('male intimate is present only in the nine directly observed menus', () => {
  assert.deepEqual(reviews.filter(row => row.services.some(service => service.name === 'Лазерна епилация · Интим · мъже')).map(row => row.id).sort(), maleIntimateIds)
})

test('freshly bound G Point inventories are pending before review and reviewed only on or after November 22', () => {
  for (const review of reviews) {
    const row = SOFIA_CATALOGUE.find(value => value.id === review.id)
    assert.ok(row, review.id)
    assert.deepEqual(assessPricingReview(row, review, Date.parse('2026-11-11T12:00:00Z')), {
      id: review.id, state: 'pending', reason: 'source_review_expired_or_invalid',
    })
    assert.deepEqual(assessPricingReview(row, review, Date.parse('2026-11-22T12:00:00Z')), {
      id: review.id, state: 'reviewed', checkedOn: '2026-11-22', reviewedPriceCount: review.services.length,
    })
    assert.equal(assessPricingReview(row, review, Date.parse('2026-11-30T12:00:00Z')).reason, 'published_sourced_price_required')
  }
})

test('conditional online-only fees receive a seven-day internal review window without inventing a promotion end', () => {
  for (const review of reviews) for (const service of review.services) {
    assert.equal(service.price.checkedOn, '2026-11-22')
    assert.equal(service.price.validUntil, '2026-11-29')
    assert.equal(Date.parse(service.price.validUntil) - Date.parse(service.price.checkedOn), 7 * 24 * 60 * 60 * 1000)
    assert.match(service.description, /САМО при онлайн записване/)
    assert.match(service.description, /проверена на 22\.11\.2026/)
    assert.match(service.description, /не е зачеркнатата стара цена/)
    assert.doesNotMatch(service.description, /10\.11\.2026|29\.11\.2026|гарантиран|guaranteed|expires/iu)
  }
})

test('G Point revalidation does not replace the module-wide historical review defaults', async () => {
  const source = await readFile(new URL('../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs', import.meta.url), 'utf8')
  assert.match(source, /const checkedOn = '2026-11-10', validUntil = '2027-02-08'/)
  assert.match(source, /const gpointCheckedOn = '2026-11-22', gpointValidUntil = '2026-11-29'/)
})
