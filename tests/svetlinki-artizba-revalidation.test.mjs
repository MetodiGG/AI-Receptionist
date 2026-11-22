import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-006-20261113.mjs'
import receipt from '../docs/catalogue-pricing/source-revalidation-svetlinki-artizba-20261122.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { pricingIdentity, assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const sourcePath = 'lib/discovery/catalogue-data/neighborhood-home-education-2000-006-20261113.mjs'
const baselineText = execFileSync('git', ['show', `b8dcdf4:${sourcePath}`], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
const baseline = (await import(`data:text/javascript;base64,${Buffer.from(baselineText).toString('base64')}`)).default
const ids = ['sofia-svetlinki-sheynovo13a', 'sofia-artizba-cherni-vrah33e']
const target = id => SOFIA_CATALOGUE.find(row => row.id === id)
const evidence = id => receipt.businesses.find(row => row.id === id)
const omit = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)))
const now = Date.parse('2026-11-22T12:00:00Z')

test('fresh two-business evidence is dated, source-bound and involves no reservation or image mutation', () => {
  assert.equal(receipt.reviewDate, '2026-11-22')
  assert.equal(receipt.baseCommit, 'b8dcdf4')
  assert.deepEqual(receipt.businesses.map(row => row.id), ids)
  assert.equal(receipt.methodology.actionsPerformed, 0)
  assert.equal(receipt.methodology.productionWrites, 0)
  assert.equal(receipt.methodology.newImageAssets, 0)
  assert.equal(receipt.integration.historicalBaselinesChanged, false)
  assert.equal(receipt.integration.pricingCheckerChanged, false)
  for (const item of receipt.businesses) {
    assert.equal(item.reviewedInventoryIdentity, pricingIdentity(target(item.id)), item.id)
    assert.ok(item.sources.length >= 5)
    for (const source of item.sources) {
      assert.match(source.fetchedAtUtc, /^2026-11-22T/)
      assert.match(source.bodySha256, /^[a-f0-9]{64}$/)
      assert.ok([200, 404].includes(source.httpStatus))
      assert.equal(new URL(source.url).search, '')
      assert.ok(!/add-to-cart|checkout|\/cart\//.test(source.url))
    }
  }
})

test('only the two reviewed records and receipts change; the other thirteen rows stay byte-equivalent in value', () => {
  const unchanged = rows => rows.filter(row => !ids.includes(row.id))
  assert.equal(home.records.length, 15)
  assert.equal(home.records.flatMap(row => row.services).length, baseline.records.flatMap(row => row.services).length)
  assert.deepEqual(unchanged(home.records), unchanged(baseline.records))
  assert.deepEqual(unchanged(home.reviews), unchanged(baseline.reviews))
  for (const id of ids) {
    const before = baseline.records.find(row => row.id === id)
    const after = home.records.find(row => row.id === id)
    assert.deepEqual(omit(after, ['services', 'openingHours', 'verification', 'booking']), omit(before, ['services', 'openingHours', 'verification', 'booking']))
    assert.equal(after.services.length, before.services.length)
    assert.equal(after.verification.checkedOn, '2026-11-22')
    assert.equal(home.reviews.find(row => row.id === id).checkedOn, '2026-11-22')
  }
})

test('Svetlinki preserves both standing per-visit tariffs and all service qualifications without claiming a future art slot', () => {
  const id = ids[0], before = baseline.records.find(row => row.id === id), after = home.records.find(row => row.id === id)
  assert.deepEqual(after.booking, before.booking)
  assert.deepEqual(after.services.map(row => omit(row, ['price', 'durationCheckedOn'])), before.services.map(row => omit(row, ['price', 'durationCheckedOn'])))
  assert.deepEqual(after.services.map(row => omit(row.price, ['checkedOn', 'validUntil'])), before.services.map(row => omit(row.price, ['checkedOn', 'validUntil'])))
  assert.deepEqual(after.services.map(row => [row.price.amount, row.durationMin]), [[15, 90], [25, 150]])
  assert.ok(after.services.every(row => row.durationCheckedOn === '2026-11-22' && row.price.checkedOn === '2026-11-22' && row.price.validUntil === '2026-11-29'))
  assert.deepEqual(omit(after.openingHours, ['checkedOn']), omit(before.openingHours, ['checkedOn']))
  assert.equal(after.openingHours.checkedOn, '2026-11-22')
  assert.equal(evidence(id).actualBooking.noFuturePaidArtSlotClaimed, true)
  assert.match(evidence(id).validity.basis, /internal source-recheck/)
  assert.deepEqual(evidence(id).englishAdditions, [])
})

test('ART Izba replaces the expired event only with its actual future date and literal standard price', () => {
  const before = baseline.records.find(row => row.id === ids[1]), after = target(ids[1]), service = after.services[0]
  assert.match(before.services[0].name, /Есенна кошница.*18\.11\.2026/)
  assert.equal(before.services[0].price.amount, 30)
  assert.equal(before.verification.validUntil, '2026-11-18')
  assert.equal(service.name, 'Рисуване и вино „Планинско езеро“ · 26.11.2026')
  assert.equal(service.price.amount, 28)
  assert.equal(service.price.currency, 'EUR')
  assert.equal(service.price.kind, 'fixed')
  assert.equal(service.price.unit, 'участник · събитие на 26.11.2026 от 18:45')
  assert.equal(service.price.sourceUrl, 'https://artizba.bg/produkt/016/')
  assert.deepEqual(after.booking, { kind: 'form', url: service.price.sourceUrl })
  assert.equal(service.durationMin, undefined)
  assert.ok(service.description.length <= 300)
  for (const qualification of [/26\.11\.2026/, /18:45/, /вино и вода или сок за непълнолетни/, /15% отстъпка при онлайн плащане/, /не е приспадната/, /Минимум 6/, /повече от 48 ч\./]) assert.match(service.description, qualification)
  assert.deepEqual(after.openingHours, before.openingHours)
  assert.equal(evidence(ids[1]).sources.find(source => source.role.startsWith('old 18')).httpStatus, 404)
  assert.equal(evidence(ids[1]).supportedFacts.stockImportedAsAvailability, false)
  assert.equal(evidence(ids[1]).actualBooking.formSubmitted, false)
})

test('new exact receipt hashes pass normal review rules while old bindings cannot authorize the changed inventory', () => {
  for (const id of ids) {
    const current = target(id), review = home.reviews.find(row => row.id === id), proof = evidence(id)
    assert.equal(assessPricingReview(current, { ...review, inventoryIdentity: proof.oldInventoryIdentity }, now).reason, 'reviewed_service_inventory_changed')
    const result = assessPricingReview(current, { ...review, inventoryIdentity: proof.reviewedInventoryIdentity }, now)
    assert.equal(result.state, 'reviewed', `${id}: ${result.reason}`)
    assert.equal(result.reviewedPriceCount, current.services.length)
    assert.equal(approvedCatalogueRecord(current, now), current)
    assert.equal(approvedCatalogueRecord(current, Date.parse(proof.validity.validUntil + 'T23:59:59Z')), current)
    assert.equal(approvedCatalogueRecord(current, Date.parse(proof.validity.validUntil + 'T23:59:59Z') + 1000), null)
    assert.equal(assessPricingReview(current, { ...review, inventoryIdentity: proof.reviewedInventoryIdentity }, Date.parse(proof.validity.validUntil + 'T23:59:59Z') + 1000).reason, 'published_sourced_price_required')
  }
})

test('new event exact alias reuses the approved painting image without dropping the historical alias', () => {
  const current = target(ids[1]), original = baseline.records.find(row => row.id === ids[1])
  for (const business of [original, current]) {
    const service = business.services[0]
    const fields = catalogueServicePhotoFields(service, business)
    assert.equal(fields.illustrativePhotoKey, 'sx-adult-acrylic-painting-wine')
    const photo = serviceThumbnail({ ...service, ...fields }, { business })
    assert.equal(photo.type, 'photo')
    // The name-to-key lookup is exact; this is honestly an activity
    // illustration, not a photograph of this particular provider/event.
    assert.equal(photo.photoMatch, 'activity')
    assert.match(photo.src, /sx-adult-acrylic-painting-wine-v1\.webp$/)
  }
  const additions = evidence(ids[1]).englishAdditions
  assert.deepEqual(additions.map(row => row.section), ['names', 'descriptions', 'units'])
  assert.deepEqual(additions.map(row => row.source), [current.services[0].name, current.services[0].description, current.services[0].price.unit])
  assert.ok(additions.every(row => !/[\u0400-\u04ff]/u.test(row.english)))
})
