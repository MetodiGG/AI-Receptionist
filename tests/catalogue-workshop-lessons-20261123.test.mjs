import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import ucha from '../docs/catalogue-coverage/courses-recreation-intake-20261123.json' with { type: 'json' }
import koba from '../docs/catalogue-coverage/koba-intake-20261123.json' with { type: 'json' }
import infinity from '../docs/catalogue-coverage/infinity-intake-20261123.json' with { type: 'json' }
import batch from '../docs/catalogue-coverage/workshop-lessons-priority-20261123.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { workshopLessonsPriorCatalogue } from './catalogue-workshop-lessons-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const englishResolver = createEnglishContentResolver(english)
const byId = id => {
  const rows = SOFIA_CATALOGUE.filter(row => row.id === id)
  assert.equal(rows.length, 1, id)
  return rows[0]
}
const nearby = (row, input = {}) => {
  const { latitude, longitude } = row.coordinates
  return normalizeCatalogueBusinesses([row], { cityCode: '68134', neighborhood: row.neighborhood, category: row.category,
    coordinates: { latitude, longitude }, radiusKm: 0.1, browse: true, searchV2: true, ...input }, { now })
}
function checkRecord(evidence, addressId, state) {
  const row = byId(evidence.id)
  assert.equal(sha256(JSON.stringify(row)), evidence.normalizedRecordSha256)
  assert.equal(pricingIdentity(row), evidence.inventoryIdentity)
  assert.equal(catalogueBoundCoordinates(row)?.addressId, addressId)
  assert.equal(assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(review => review.id === row.id), now).state, state)
  const [result] = nearby(row)
  assert.equal(result.id, row.id)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(nearby(row, { coordinates: { ...result.coordinates, longitude: result.coordinates.longitude + 0.03 } }), [])
  assert.equal(result.details.services.length, 1)
  return { row, result, service: result.details.services[0] }
}

test('the Rodopi workshop accepts a diagnostic appointment by phone without inheriting another branch rate', () => {
  const { row, result, service } = checkRecord(koba.business, '28516', 'service_reviewed')
  assert.equal(result.booking.kind, 'phone')
  assert.equal(result.booking.phone, '+359884192080')
  assert.equal(row.services[0].price, undefined)
  assert.equal(service.price, null)
  assert.equal(service.durationMin, null)
  assert.equal(service.illustrativePhotoKey, 'auto-diagnostics')
  assert.equal(row.openingHours.days.filter(day => day.periods.length).length, 5)
  assert.deepEqual(nearby(row, { neighborhood: 'Орландовци' }), [])
  assert.equal(englishResolver.service(service, row).presentationEn.description, koba.business.english.description)
})

test('the Dianabad chess course keeps the full pack price, class requirements and genuine illustration', () => {
  const evidence = ucha.newBusiness
  const { row, result, service } = checkRecord(evidence, '108404', 'reviewed')
  assert.equal(result.booking.url, evidence.booking.url)
  assert.deepEqual([service.price, service.currency, service.priceKind, service.priceUnit], [100, 'EUR', 'fixed', evidence.service.unit])
  assert.equal(service.illustrativePhotoKey, 'sx-child-chess-group')
  assert.equal(sha256(readFileSync(new URL('../public' + evidence.image.asset, import.meta.url))), evidence.image.sha256)
  assert.ok(nearby(row, { service: 'шах', browse: false }).length)
  assert.deepEqual(nearby(row, { neighborhood: 'Изгрев' }), [])
  const { presentationEn } = englishResolver.service(service, row)
  assert.equal(presentationEn.name, evidence.service.nameEn)
  assert.equal(presentationEn.description, evidence.service.descriptionEn)
  assert.equal(presentationEn.unit, evidence.service.unitEn)
})

test('the Strelbishte trial is a 13+ group request, not a free trial or recurring membership', () => {
  const evidence = infinity.newBusiness
  const { row, result, service } = checkRecord(evidence, '4111', 'service_reviewed')
  assert.equal(result.booking.url, evidence.booking.url)
  assert.equal(row.services[0].price, undefined)
  assert.equal(row.openingHours, undefined)
  assert.equal(service.price, null)
  assert.equal(service.illustrativePhotoKey, 'sx-adult-ballroom-group')
  assert.equal(matchesSubcategory(row.services[0], 'fitness-group-training', row), true)
  assert.deepEqual(nearby(row, { neighborhood: 'Люлин 10' }), [])
  assert.equal(englishResolver.service(service, row).presentationEn.description, evidence.service.descriptionEn)
})

test('exactly three distinct venues were added without altering any earlier catalogue record', () => {
  const prior = workshopLessonsPriorCatalogue(SOFIA_CATALOGUE)
  const before = new Set(prior.map(row => row.id))
  assert.ok(prior.every(row => SOFIA_CATALOGUE.includes(row)))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => !before.has(row.id)).map(row => row.id), batch.affected.map(row => row.id))
  assert.throws(() => workshopLessonsPriorCatalogue([{ ...byId(koba.business.id), neighborhood: 'Орландовци' }]), /Unreviewed/u)
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const areas = r => [...r.neighborhoods, ...r.additionalNamedAreas]
  const empty = groups => groups.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.deepEqual(reports.map(r => r.counts.approvedBusinesses), batch.approvedBusinesses)
  assert.deepEqual(reports.map(r => r.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(r => empty(r.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(r => empty(areas(r))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(r => r.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  assert.ok(reports.every(r => r.counts.totalTargetCells === batch.totalTargetCells))
  for (const entry of batch.affected) {
    const cells = reports.map(r => areas(r).find(a => a.name === entry.neighborhood).cells.find(c => c.categoryId === entry.category))
    assert.deepEqual(cells.map(cell => cell.count), entry.physical)
    assert.deepEqual(cells.map(cell => cell.locatedCount), entry.located)
    assert.ok(cells[1].locatedBusinessIds.includes(entry.id))
  }
})
