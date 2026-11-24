import assert from 'node:assert/strict'
import test from 'node:test'
import receipt from '../docs/catalogue-coverage/unigas-intake-20261123.json' with { type: 'json' }
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { UNIGAS_INTAKE_20261123_RECORDS, UNIGAS_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-unigas-20261123.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { publicProse, serviceDisplayName } from '../lib/locale/public-content.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { manualIntakeIdentity } from '../scripts/catalogue-manual-intake-review.mjs'

const evidence = receipt.business
const now = Date.parse('2026-11-23T12:00:00Z')
const expectedPoint = { latitude: 42.725261, longitude: 23.326636 }
const intent = { cityCode: '68134', neighborhood: 'Военна рампа', category: 'auto_repair', coordinates: expectedPoint,
  radiusKm: 0.2, browse: true, searchV2: true }
const record = SOFIA_CATALOGUE.find(row => row.id === evidence.id)

test('UniGas has one verified fitting tariff, not a retail product price or a fixed offer', () => {
  assert.equal(SOFIA_CATALOGUE.filter(row => row.id === evidence.id).length, 1)
  assert.deepEqual(record, validateCatalogue(UNIGAS_INTAKE_20261123_RECORDS)[0])
  assert.equal(manualIntakeIdentity(record), evidence.normalizedRecordSha256)
  const [review] = UNIGAS_INTAKE_20261123_REVIEWS
  assert.deepEqual(BOOKING_PRICE_REVIEWS.filter(item => item.id === evidence.id), [review])
  assert.equal(pricingIdentity(record), evidence.inventoryIdentity)
  assert.deepEqual(assessPricingReview(record, review, now), {
    id: evidence.id, state: 'reviewed', checkedOn: '2026-11-23', reviewedPriceCount: 1,
  })
  assert.deepEqual(record.booking, { kind: 'form', url: evidence.service.bookingSource })
  assert.equal(record.services.length, 1)
  const [service] = record.services
  assert.equal(service.name, evidence.service.name)
  assert.deepEqual(service.price, { amount: 700, currency: 'EUR', kind: 'from', sourceUrl: evidence.service.priceSource,
    checkedOn: '2026-11-23', validUntil: '2026-12-23' })
  assert.match(service.description, /ДДС.*цилиндрична бутилка до 40 л.*монтажен протокол.*сложността.*допълнения/u)
  assert.equal(service.durationMin, undefined)
  assert.deepEqual(record.openingHours.days.map(day => day.periods), [
    ...Array.from({ length: 5 }, () => [{ open: '08:30', close: '17:00' }]), [], [],
  ])
  const changedConditions = { ...record, services: [{ ...service, description: 'Цената е окончателна.' }] }
  assert.equal(assessPricingReview(changedConditions, review, now).reason, 'reviewed_service_inventory_changed')
})

test('UniGas contributes one verified physical option in its exact local auto-repair cell', () => {
  const bound = catalogueBoundCoordinates(record)
  assert.deepEqual({ latitude: bound.latitude, longitude: bound.longitude }, expectedPoint)
  assert.deepEqual([bound.addressId, bound.method, bound.sourceNeighborhood], ['98280', 'verified_official_address', 'Военна рампа'])
  for (const patch of [{ neighborhood: 'Орландовци' }, { address: record.address + 'А' }]) {
    assert.equal(catalogueBoundCoordinates({ ...record, ...patch }), null)
  }
  const [shown] = normalizeCatalogueBusinesses([record], intent, { now })
  assert.deepEqual(shown.coordinates, expectedPoint)
  assert.deepEqual(shown.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(shown, now), { kind: 'form', href: evidence.service.bookingSource })
  for (const patch of [{ neighborhood: 'Орландовци' }, { category: 'detailing' },
    { coordinates: { ...expectedPoint, latitude: expectedPoint.latitude + 0.03 } }]) {
    assert.deepEqual(normalizeCatalogueBusinesses([record], { ...intent, ...patch }, { now }), [])
  }
  const before = SOFIA_CATALOGUE.filter(row => row.id !== evidence.id)
  const focus = rows => {
    const { neighborhoods, additionalNamedAreas } = catalogueCoverageReport(rows, { now, target: 30 })
    return [...neighborhoods, ...additionalNamedAreas].find(area => area.name === intent.neighborhood)
      .cells.find(cell => cell.categoryId === intent.category)
  }
  const cells = [focus(before), focus(SOFIA_CATALOGUE)]
  assert.deepEqual(cells.map(cell => cell.count), receipt.isolatedCoverageDelta.physical)
  assert.deepEqual(cells.map(cell => cell.locatedCount), receipt.isolatedCoverageDelta.located)
  assert.ok(cells[1].locatedBusinessIds.includes(evidence.id))
})

test('the public details keep the installation scope, owner request, and illustrative disclosure', async () => {
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now, allowAttempt: () => true,
    findCatalogue: id => id === record.id ? record : null, readCataloguePhotos: async () => [],
    readPartner: () => assert.fail('Static workshop details must not use native partner access') })
  const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + record.id), record.id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  assert.equal(business.details.services.length, 1)
  const [service] = business.details.services
  assert.deepEqual([service.price, service.priceKind, service.currency, service.priceSourceUrl, service.durationMin],
    [700, 'from', 'EUR', evidence.service.priceSource, null])
  assert.match(detailPriceLabel(service, 'bg'), /^от .*700.*€/u)
  assert.match(detailPriceLabel(service, 'en'), /^from (?:€.*700|700.*€)/u)
  assert.equal(serviceDisplayName(service, 'bg'), evidence.service.name)
  assert.equal(serviceDisplayName(service, 'en'), evidence.english.name)
  assert.equal(publicProse(service.description, 'en', service.presentationEn.description), evidence.english.description)
  for (const locale of ['bg', 'en']) {
    const thumbnail = serviceThumbnail(service, { business, locale })
    assert.deepEqual([thumbnail.src, thumbnail.source], [evidence.image.asset, 'illustrative'])
  }
  assert.deepEqual(railExternalAction(business, now), { kind: 'form', href: evidence.service.bookingSource })
})
