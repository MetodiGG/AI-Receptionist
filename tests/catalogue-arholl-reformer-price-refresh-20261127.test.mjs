import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import prior from '../lib/discovery/catalogue-data/neighborhood-coverage-arholl-20261116.mjs'
import { applyArhollReformerPriceRefreshNov27, ARHOLL_REFORMER_PRICE_REFRESH_20261127_REVIEW } from '../lib/discovery/catalogue-data/arholl-reformer-price-refresh-20261127.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { arhollPriceAllowsFileChange, arhollPriceAllowsNewFile, arhollPriceAllowsPath,
  arhollPricePriorSource, arhollPricePriorCatalogue } from './catalogue-arholl-reformer-price-refresh-20261127-scope.mjs'
import receipt from './fixtures/catalogue-arholl-reformer-price-refresh-20261127.json' with { type: 'json' }

const id = 'sofia-arholl-arena-obelya1-124-reformer'
const phone = '+359889758011'
const now = Date.parse('2026-11-27T12:00:00Z')
const [previous] = validateCatalogue(prior.records)
const current = SOFIA_CATALOGUE.find(row => row.id === id)
const refreshedReview = ARHOLL_REFORMER_PRICE_REFRESH_20261127_REVIEW

test('the dated refresh seals only exact price-review source changes and keeps every other catalogue row byte-identical', () => {
  const cwd = new URL('../', import.meta.url)
  const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
  const sha = data => createHash('sha256').update(data).digest('hex')
  const paths = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
  const observed = new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...observed].filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort(),
    [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort())
  for (const [path, proof] of Object.entries(receipt.changed)) {
    const before = git('show', receipt.baseline + ':' + path)
    const after = readFileSync(new URL(path, cwd))
    assert.deepEqual([sha(before), sha(after)], [proof.before, proof.after], path)
    assert.ok(arhollPriceAllowsFileChange(path), path)
    assert.deepEqual(arhollPricePriorSource(path, after), before, path)
    const tampered = Buffer.concat([after, Buffer.from('\n')])
    assert.equal(arhollPricePriorSource(path, tampered), tampered, path)
  }
  for (const [path, expected] of Object.entries(receipt.added)) {
    assert.equal(sha(readFileSync(new URL(path, cwd))), expected, path)
    assert.ok(arhollPriceAllowsNewFile(path), path)
    assert.ok(!arhollPriceAllowsFileChange(path), path)
  }
  for (const path of ['lib/booking-engine.mjs', 'lib/discovery/catalogue-policy.mjs', 'app/layout.js',
    'public/logo.svg', 'package.json', 'supabase/config.toml']) assert.equal(arhollPriceAllowsPath(path), false, path)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    const earlier = arhollPricePriorCatalogue(rows)
    assert.equal(earlier.length, rows.length)
    assert.equal(sha(JSON.stringify(earlier)), receipt.baselineCatalogueSha256)
    assert.equal(sha(JSON.stringify(rows)), receipt.currentCatalogueSha256)
    const old = earlier.find(row => row.id === id)
    assert.deepEqual(old, previous)
    assert.deepEqual([sha(JSON.stringify(old)), sha(JSON.stringify(current))], [receipt.refresh.before, receipt.refresh.after])
    assert.equal(arhollPricePriorCatalogue([old])[0], old)
    assert.throws(() => arhollPricePriorCatalogue([old, current]), /Duplicate Arholl price refresh record/u)
    assert.throws(() => arhollPricePriorCatalogue([{ ...current, phone: '+359879044545' }]), /Unreviewed Arholl price refresh record/u)
  }
})

test('only the already reviewed branch and precise single-visit tariff can change', () => {
  const [preview] = applyArhollReformerPriceRefreshNov27([previous])
  const { amount, checkedOn } = preview.services[0].price
  assert.deepEqual([amount, checkedOn], [35, '2026-11-27'])
  assert.deepEqual(preview, {
    ...previous, services: [{ ...previous.services[0], price: { ...previous.services[0].price, amount, checkedOn } }],
  })
  assert.equal(applyArhollReformerPriceRefreshNov27([preview])[0], preview)
  const nonMatches = [
    { ...previous, id: id + '-other' },
    { ...previous, address: previous.address + ', вх. Б' },
    { ...previous, booking: { ...previous.booking, phone: '+359879044545' } },
    { ...previous, services: [{ ...previous.services[0], price: { ...previous.services[0].price, amount: 50 } }] },
  ]
  for (const record of nonMatches) assert.equal(applyArhollReformerPriceRefreshNov27([record])[0], record)
  assert.equal(prior.records[0].services[0].price.amount, 20)
  assert.equal(prior.reviews[0].checkedOn, '2026-11-16')
})

test('the live catalogue has one current pricing receipt and keeps independent booking and location facts', () => {
  assert.ok(current)
  assert.equal(SOFIA_CATALOGUE.filter(row => row.id === id).length, 1)
  assert.deepEqual(current, applyArhollReformerPriceRefreshNov27([previous])[0])
  assert.deepEqual(BOOKING_PRICE_REVIEWS.filter(row => row.id === id), [refreshedReview])
  assert.equal(pricingIdentity(current), refreshedReview.inventoryIdentity)
  assert.deepEqual(assessPricingReview(current, refreshedReview, now), {
    id, state: 'reviewed', checkedOn: '2026-11-27', reviewedPriceCount: 1,
  })
  assert.equal(assessPricingReview(previous, refreshedReview, now).reason, 'reviewed_service_inventory_changed')
  assert.equal(approvedCatalogueRecord(current, Date.parse('2026-11-26T12:00:00Z')), null)
  assert.equal(approvedCatalogueRecord(current, Date.parse('2027-02-15T12:00:00Z')), null)
  assert.deepEqual(current.booking, { kind: 'phone', phone })
  assert.equal(current.coordinates, null)
  assert.equal(current.services[0].durationMin, undefined)
})

test('discovery, business details and onboarding expose the fixed EUR 35 tariff and do not create slots', async () => {
  const [card] = normalizeCatalogueBusinesses([current], { cityCode: '68134', neighborhood: 'Обеля 1', category: 'fitness', browse: true, searchV2: true }, { now })
  assert.equal(card.id, id)
  assert.deepEqual(card.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(card, now), { kind: 'phone', href: 'tel:' + phone })
  const details = createPublicBusinessDetailsHandler({
    config: { enabled: true }, findCatalogue: requested => requested === id ? current : undefined, now: () => now, allowAttempt: () => true,
  })
  const response = await details(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  for (const surface of [card, business]) {
    const [service] = surface.details.services
    assert.deepEqual([service.price, service.currency, service.priceKind, service.durationMin], [35, 'EUR', 'fixed', null])
    assert.equal(service.priceSourceUrl, 'https://arholl-arena.bg/prices')
    assert.equal(service.priceUnit, 'еднократно посещение за един човек')
  }
  for (const locale of ['bg', 'en']) {
    const [service] = catalogueOnboardingDetail([current], id, { now, cityCode: '68134', locale }).services
    assert.deepEqual([service.price, service.currency, service.duration_min], ['35', 'EUR', ''])
    assert.equal(service.price_details.kind, 'fixed')
  }
})
