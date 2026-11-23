import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import candyReceipt from '../docs/catalogue-coverage/candy-house-intake-20261123.json' with { type: 'json' }
import felix from '../docs/catalogue-coverage/felix-dogs-lyulin-verified-location-20261123.json' with { type: 'json' }
import kobaReceipt from '../docs/catalogue-coverage/koba-paris-intake-20261123.json' with { type: 'json' }
import batch from '../docs/catalogue-coverage/lyulin-premises-priority-20261123.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyFelixDogsLyulinVerifiedLocation20261123 } from '../lib/discovery/catalogue-data/felix-dogs-lyulin-verified-location-20261123.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { lyulinPremisesPriorCatalogue } from './catalogue-lyulin-premises-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const candy = candyReceipt.newBusiness
const koba = kobaReceipt.business
const sha256 = value => createHash('sha256').update(value).digest('hex')
const byId = id => {
  const matching = SOFIA_CATALOGUE.filter(row => row.id === id)
  assert.equal(matching.length, 1, id)
  return matching[0]
}
function near(row, options = {}) {
  const { latitude, longitude } = row.coordinates
  return normalizeCatalogueBusinesses([row], { cityCode: '68134', neighborhood: row.neighborhood, category: row.category,
    coordinates: { latitude, longitude }, radiusKm: 0.15, browse: true, searchV2: true, ...options }, { now })
}

test('Candy House uses the correct municipal No. 22 point and an owner inquiry, not a confirmed party', () => {
  const row = byId(candy.id), [result] = near(row), [service] = result.details.services
  assert.equal(sha256(JSON.stringify(row)), candy.normalizedRecordSha256)
  assert.deepEqual([catalogueBoundCoordinates(row)?.addressId, row.coordinates.latitude, row.coordinates.longitude],
    [candy.municipal.addressId, candy.municipal.latitude, candy.municipal.longitude])
  assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
  assert.deepEqual(near(row, { neighborhood: 'Люлин 2' }), [])
  assert.deepEqual([result.booking.kind, result.booking.url, result.availability], ['form', candy.booking.url, { status: 'external', slots: [] }])
  const receipt = BOOKING_PRICE_REVIEWS.find(review => review.id === row.id)
  assert.equal(assessPricingReview(row, receipt, now).state, 'reviewed')
  assert.equal(pricingIdentity(row), candy.inventoryIdentity)
  assert.deepEqual([service.price, service.priceKind, service.priceUnit, service.currency, service.durationMin],
    [candy.service.amount, candy.service.kind, candy.service.unit, candy.service.currency, candy.service.durationMin])
  assert.equal(service.description, candy.service.description)
  const en = createEnglishContentResolver(english).service(service, row).presentationEn
  assert.deepEqual([en.name, en.description, en.unit], [candy.service.nameEn, candy.service.descriptionEn, candy.service.unitEn])
  const photo = serviceThumbnail(service, { business: row })
  assert.deepEqual([photo.src, photo.source], [candy.illustrationCandidate.path, 'illustrative'])
  assert.equal(sha256(readFileSync(new URL('../public' + photo.src, import.meta.url))), candy.illustrationCandidate.sha256)
})

test('Felix Dogs gains only its public entrance and address-bound municipal point', () => {
  const row = byId(felix.id), [old] = lyulinPremisesPriorCatalogue([row])
  assert.equal(sha256(JSON.stringify(row)), felix.reviewedRowSha256)
  assert.deepEqual(row, { ...old, address: felix.address, coordinates: row.coordinates })
  assert.deepEqual([row.coordinates.addressId, row.coordinates.latitude, row.coordinates.longitude],
    [felix.point.addressId, felix.point.latitude, felix.point.longitude])
  assert.equal(old.coordinates, null)
  assert.equal(pricingIdentity(row), felix.pricingIdentity)
  assert.equal(pricingIdentity(old), felix.pricingIdentity)
  assert.equal(catalogueBoundCoordinates({ ...row, address: felix.previousAddress }), null)
  const [result] = near(row)
  assert.equal(result.id, row.id)
  assert.deepEqual([result.booking.kind, result.booking.phone], ['phone', old.booking.phone])
  assert.deepEqual(near(row, { coordinates: { latitude: 42.73, longitude: 23.20 } }), [])
  assert.equal(applyFelixDogsLyulinVerifiedLocation20261123([row])[0], row)
  const different = { ...old, address: old.address.replace('122', '121') }
  assert.equal(applyFelixDogsLyulinVerifiedLocation20261123([different])[0], different)
})

test('Koba Paris is a separately bookable workshop, not a second operator or a copy of Rodopi', () => {
  const row = byId(koba.id), [result] = near(row), [service] = result.details.services
  const rodopi = byId(koba.operatorEvidence.existingOperatorWorkshopId)
  assert.deepEqual(lyulinPremisesPriorCatalogue([rodopi]), [rodopi])
  assert.equal(new URL(row.website).hostname, new URL(rodopi.website).hostname)
  assert.notEqual(row.address, rodopi.address)
  assert.notEqual(row.phone, rodopi.phone)
  assert.doesNotMatch(row.name, /Bosch/u)
  assert.equal(sha256(JSON.stringify(row)), koba.normalizedRecordSha256)
  assert.equal(catalogueBoundCoordinates(row)?.addressId, koba.coordinateEvidence.addressId)
  assert.equal(pricingIdentity(row), koba.inventoryIdentity)
  assert.equal(assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(review => review.id === row.id), now).state, 'service_reviewed')
  assert.equal(row.services[0].price, undefined)
  assert.equal(service.price, null)
  assert.equal(service.durationMin, null)
  assert.deepEqual([result.booking.kind, result.booking.phone, result.availability], ['phone', koba.phone, { status: 'external', slots: [] }])
  const en = createEnglishContentResolver(english).service(service, row).presentationEn
  assert.equal(en.description, koba.english.description)
  assert.equal(row.openingHours.days.filter(day => day.periods.length > 0).length, 5)
  const photo = serviceThumbnail(service, { business: row })
  assert.deepEqual([photo.src, photo.source], [koba.image.asset, 'illustrative'])
  assert.equal(sha256(readFileSync(new URL('../public' + photo.src, import.meta.url))), koba.image.sha256)
})

test('the ledger verifies exact location coverage and distinguishes additions from an address-only repair', () => {
  const prior = lyulinPremisesPriorCatalogue(SOFIA_CATALOGUE), before = new Set(prior.map(row => row.id))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => !before.has(row.id)).map(row => row.id),
    batch.affected.filter(item => item.change !== 'existing_entrance').map(item => item.id))
  assert.equal(batch.newIndependentOperators, batch.affected.filter(item => item.change === 'new_operator').length)
  assert.equal(batch.newLocationsOfExistingOperators, batch.affected.filter(item => item.change === 'new_premises_existing_operator').length)
  assert.throws(() => lyulinPremisesPriorCatalogue([byId(felix.id), byId(felix.id)]), /Duplicate/u)
  assert.throws(() => lyulinPremisesPriorCatalogue([{ ...byId(felix.id), address: 'София' }]), /Unreviewed/u)
  assert.ok(prior.filter(row => row.id !== felix.id).every(row => SOFIA_CATALOGUE.includes(row)))
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const all = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = areas => areas.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.deepEqual(reports.map(r => r.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(r => r.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(r => empty(all(r))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(r => empty(r.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(r => r.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  assert.ok(reports.every(r => r.counts.totalTargetCells === batch.totalTargetCells && r.counts.pickerTargetCells === batch.pickerTargetCells))
  for (const entry of batch.affected) {
    const results = reports.map(r => all(r).find(area => area.name === entry.neighborhood).cells.find(c => c.categoryId === entry.category))
    assert.deepEqual(results.map(c => c.count), entry.physical)
    assert.deepEqual(results.map(c => c.locatedCount), entry.located)
    assert.ok(results[1].locatedBusinessIds.includes(entry.id))
  }
})
