import test from 'node:test'
import assert from 'node:assert/strict'
import { assessPricingReview, auditCataloguePricing, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { catalogueRecordSchema } from '../lib/discovery/catalogue-policy.mjs'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const now = Date.parse('2026-11-13T12:00:00Z')
const record = () => ({
  id: 'sofia-optional-price-review', name: 'Тестов салон', cityCode: '68134', neighborhood: 'Борово',
  address: 'София, ул. „Тестова“ 10', locationKind: 'premises', coordinates: null,
  category: 'hair', website: 'https://salon.example.com/', phone: '+359888123456',
  services: [{ name: 'Боядисване на коса', category: 'hair', appointmentModel: 'appointment' }],
  booking: { kind: 'form', url: 'https://salon.example.com/book' },
  verification: { status: 'approved', checkedOn: '2026-11-13', validUntil: '2027-02-11',
    booking: { url: 'https://salon.example.com/book', excerpt: 'Запазете час чрез формата за записване.' }, contact: 'https://salon.example.com/contact' },
})
const receipt = row => ({
  id: row.id, website: row.website, bookingEntry: row.booking.kind === 'phone' ? 'phone' : row.booking.url,
  checkedOn: '2026-11-13', bookingReview: row.booking.kind === 'phone' ? 'phone_booking_reviewed' : 'owned_booking_reviewed',
  reviewedUrls: [row.website, 'https://salon.example.com/book', 'https://salon.example.com/services'],
  notes: 'Test fixture only: actual booking and service pages reviewed; no published tariff.',
  inventoryIdentity: pricingIdentity(row), pricingDecision: 'not_publicly_listed',
  priceSearch: { outcome: 'not_published', bookingUrl: 'https://salon.example.com/book',
    serviceUrls: ['https://salon.example.com/services'], notes: 'Test fixture: services and booking pages contain no public amounts.' },
})

test('explicit unpublished tariff qualifies only as service-reviewed, never as price-reviewed', () => {
  const row = record(), review = receipt(row)
  assert.deepEqual(assessPricingReview(row, review, now), {
    id: row.id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-13', reviewedPriceCount: 0,
  })
  const report = auditCataloguePricing([row], [], [review], now)
  assert.equal(report.blocking.length, 0)
  assert.equal(report.summary.sourceReviewed, 0)
  assert.equal(report.summary.serviceReviewedWithoutPublicPrices, 1)
  assert.equal(report.summary.withPrices, 0)
  const draft = catalogueOnboardingDetail([row], row.id, { now })
  assert.equal(draft.services[0].price, '')
  assert.equal(draft.services[0].duration_min, '')
})

test('phone review must inspect the exact official appointment-evidence page', () => {
  const row = record(); row.booking = { kind: 'phone', phone: row.phone }
  assert.equal(assessPricingReview(row, receipt(row), now).state, 'service_reviewed')
  row.verification.booking.url = 'https://salon.example.com/contact'
  assert.equal(assessPricingReview(row, receipt(row), now).reason, 'explicit_unpublished_price_search_required')
})

test('missing, blocked, unrelated and uninspected tariff-search receipts remain pending', () => {
  const row = record()
  const changes = [
    review => { delete review.priceSearch },
    review => { review.priceSearch.outcome = 'blocked' },
    review => { review.priceSearch.outcome = 'conflicting' },
    review => { review.priceSearch.serviceUrls = [] },
    review => { review.priceSearch.serviceUrls = ['https://other.example.com/services']; review.reviewedUrls.push('https://other.example.com/services') },
    review => { review.priceSearch.serviceUrls = ['https://salon.example.com/uninspected'] },
    review => { review.priceSearch.bookingUrl = 'https://salon.example.com/services' },
    review => { review.priceSearch.notes = 'none' },
    review => { delete review.pricingDecision },
    review => { review.pricingDecision = 'hold_conflicting_sources' },
    review => { review.bookingReview = 'provider_menu_not_rendered' },
    review => { review.checkedOn = '2026-11-14' },
    review => { review.inventoryIdentity = 'outdated' },
  ]
  for (const change of changes) {
    const review = receipt(row); change(review)
    assert.equal(assessPricingReview(row, review, now).state, 'pending')
    assert.equal(auditCataloguePricing([row], [], [review], now).blocking.length, 1)
  }
})

test('unpublished-price path cannot hide a stale or unreviewed actual price or a changed service', () => {
  const row = record()
  row.services[0].price = { amount: 20, currency: 'EUR', kind: 'fixed', sourceUrl: row.website, checkedOn: '2026-11-13' }
  assert.equal(assessPricingReview(row, receipt(row), now).reason, 'unpublished_price_receipt_contains_prices')
  const empty = record(), review = receipt(empty)
  empty.services.push({ name: 'Подстригване на коса', category: 'hair', appointmentModel: 'appointment' })
  assert.equal(assessPricingReview(empty, review, now).reason, 'reviewed_service_inventory_changed')
})

test('the read-only batch CLI checks the same normalized inventory identity as the publication gate', async () => {
  const row = record(), today = new Date().toISOString().slice(0, 10)
  row.verification.checkedOn = today
  row.verification.validUntil = new Date(Date.parse(`${today}T00:00:00Z`) + 90 * 86400000).toISOString().slice(0, 10)
  const normalized = catalogueRecordSchema.parse(row)
  const review = { ...receipt(normalized), checkedOn: today }
  // Deliberately reverse source property order, without changing any facts.
  const source = { ...row, services: row.services.map(service => Object.fromEntries(Object.entries(service).reverse())) }
  assert.notEqual(pricingIdentity(source), review.inventoryIdentity)
  const directory = await mkdtemp(join(tmpdir(), 'gorez-catalogue-cli-qa-'))
  try {
    const batchPath = join(directory, 'batch.json'), reviewPath = join(directory, 'reviews.json')
    await writeFile(batchPath, JSON.stringify([source]))
    await writeFile(reviewPath, JSON.stringify([review]))
    const run = spawnSync(process.execPath, ['scripts/audit-catalogue-batch.mjs', '--input', batchPath, '--pricing-reviews', reviewPath],
      { cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 10000 })
    assert.equal(run.status, 0, run.stderr || run.stdout)
    const result = JSON.parse(run.stdout)
    assert.deepEqual(result.batch.readyForReview, [row.id])
    assert.deepEqual(result.batch.pending, [])
    assert.deepEqual(result.batch.rejected, [])
  } finally { await rm(directory, { recursive: true }) }
})
