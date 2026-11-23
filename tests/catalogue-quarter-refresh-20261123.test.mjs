import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import des from '../docs/catalogue-coverage/des-georgieva-refresh-20261123.json' with { type: 'json' }
import auto from '../docs/catalogue-coverage/autotest-republica-verified-location-20261123.json' with { type: 'json' }
import horo from '../docs/catalogue-coverage/horo-intake-20261123.json' with { type: 'json' }
import sharenReceipt from '../docs/catalogue-coverage/sharen-svyat-intake-20261123.json' with { type: 'json' }
import batch from '../docs/catalogue-coverage/quarter-refresh-priority-20261123.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { applyDesGeorgievaRefresh20261123, DES_GEORGIEVA_REFRESH_20261123_REVIEW } from '../lib/discovery/catalogue-data/des-georgieva-refresh-20261123.mjs'
import { applyAutotestRepublicaVerifiedLocation20261123 } from '../lib/discovery/catalogue-data/autotest-republica-verified-location-20261123.mjs'
import { BOOKING_PRICE_REVIEWS, BOOKING_REVIEWED_PRICING } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { quarterRefreshPriorCatalogue } from './catalogue-quarter-refresh-20261123-scope.mjs'
import { sparsePremisesPriorCatalogue } from './catalogue-sparse-premises-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const SOFIA_CATALOGUE = sparsePremisesPriorCatalogue(currentCatalogue)
const sharen = sharenReceipt.newBusiness
const englishResolver = createEnglishContentResolver(english)
const byId = id => {
  const matches = SOFIA_CATALOGUE.filter(row => row.id === id)
  assert.equal(matches.length, 1, id)
  return matches[0]
}
const [oldDes, oldAuto] = quarterRefreshPriorCatalogue([des, auto].map(fact => SOFIA_CATALOGUE.find(row => row.id === fact.id)))
const [newDes, newAuto] = [des, auto].map(fact => SOFIA_CATALOGUE.find(row => row.id === fact.id))

function near(row, options = {}) {
  const { latitude, longitude } = row.coordinates
  return normalizeCatalogueBusinesses([row], { cityCode: '68134', neighborhood: row.neighborhood, category: row.category,
    coordinates: { latitude, longitude }, radiusKm: 0.1, browse: true, searchV2: true, ...options }, { now })
}

test('Lyulin 2 studio is shown near the exact public entrance and keeps the reviewed amounts and terms', () => {
  assert.equal(oldDes.coordinates, null)
  assert.equal(newDes.address, des.address)
  assert.deepEqual([newDes.coordinates.addressId, newDes.coordinates.latitude, newDes.coordinates.longitude],
    [des.point.addressId, des.point.latitude, des.point.longitude])
  assert.equal(catalogueBoundCoordinates({ ...newDes, address: des.priorAddress }), null)
  const [result] = near(newDes)
  assert.equal(result.id, des.id)
  assert.deepEqual(result.booking, { ...oldDes.booking, verified: true, checkedOn: des.checkedOn, validUntil: oldDes.verification.validUntil })
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(newDes.services.map(item => [item.name, item.price.amount, item.price.kind, item.price.sourceUrl, item.durationMin]),
    des.tariff.services.map(item => [item.name, item.amount, item.kind, des.ownerServiceBase + encodeURIComponent(item.slug), item.minutes]))
  assert.deepEqual(result.details.services.map(item => [item.price, item.currency, item.priceKind, item.durationMin]),
    des.tariff.services.map(item => [item.amount, 'EUR', item.kind, item.minutes]))
  const resolver = createEnglishContentResolver(english)
  const express = resolver.service(result.details.services[0], newDes).presentationEn.description
  assert.match(express, /50%.*09:00.*19:00\. Eyeliner is not included\./u)
})

test('studio tariff revokes the superseded receipt without modifying historical pricing inputs', () => {
  assert.equal(pricingIdentity(oldDes), des.priorPricingIdentity)
  assert.equal(pricingIdentity(newDes), des.pricingIdentity)
  assert.deepEqual(BOOKING_PRICE_REVIEWS.filter(row => row.id === des.id), [DES_GEORGIEVA_REFRESH_20261123_REVIEW])
  assert.deepEqual(BOOKING_REVIEWED_PRICING.find(row => row.id === des.id).services.map(item => item.price.amount),
    des.tariff.services.map(item => item.oldAmount))
  assert.equal(assessPricingReview(newDes, DES_GEORGIEVA_REFRESH_20261123_REVIEW, now).state, 'reviewed')
  assert.equal(assessPricingReview(oldDes, DES_GEORGIEVA_REFRESH_20261123_REVIEW, now).reason, 'reviewed_service_inventory_changed')
  const unrelated = { ...oldDes, address: 'София, ж.к. Люлин 2, бл. 280, вх. А' }
  assert.equal(applyDesGeorgievaRefresh20261123([unrelated])[0], unrelated)
  assert.equal(applyDesGeorgievaRefresh20261123([newDes])[0], newDes)
})

test('Republica picking and radius honor the existing address-bound point and phone booking', () => {
  assert.deepEqual(newAuto, { ...oldAuto, neighborhood: 'Република', coordinates: { ...oldAuto.coordinates, sourceNeighborhood: 'Република' } })
  assert.deepEqual(oldAuto.services, newAuto.services)
  assert.equal(pricingIdentity(newAuto), auto.pricingIdentity)
  assert.equal(catalogueBoundCoordinates(newAuto)?.addressId, auto.point.addressId)
  const [result] = near(newAuto)
  assert.equal(result.id, auto.id)
  assert.deepEqual(result.booking, { ...oldAuto.booking, verified: true, checkedOn: oldAuto.verification.checkedOn, validUntil: oldAuto.verification.validUntil })
  assert.deepEqual(near(newAuto, { neighborhood: 'Люлин 2' }), [])
  assert.deepEqual(near(newAuto, { coordinates: { latitude: 42.70, longitude: 23.23 } }), [])
  const foreign = { ...oldAuto, coordinates: { ...oldAuto.coordinates, addressId: '1' } }
  assert.equal(applyAutotestRepublicaVerifiedLocation20261123([foreign])[0], foreign)
  assert.equal(applyAutotestRepublicaVerifiedLocation20261123([newAuto])[0], newAuto)
})

test('the new folk-dance school is a nearby enrolment by phone, with no price or implied calendar', () => {
  const row = byId(horo.business.id)
  assert.equal(catalogueBoundCoordinates(row)?.addressId, horo.addressEvidence.municipalRow.rn)
  assert.equal(assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(item => item.id === row.id), now).state, 'service_reviewed')
  assert.equal(row.services[0].price, undefined)
  assert.equal(row.openingHours, undefined)
  assert.equal(matchesSubcategory(row.services[0], 'fitness-folk-dance', row), true)
  const [result] = near(row)
  assert.equal(result.booking.phone, horo.business.phone)
  assert.equal(result.booking.kind, 'phone')
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.equal(result.details.services[0].illustrativePhotoKey, horo.service.approvedActivityPhotoId)
  assert.equal(englishResolver.service(result.details.services[0], row).presentationEn.description, horo.service.english.description)
  assert.deepEqual(near(row, { neighborhood: 'Република' }), [])
})

test('the birthday card retains the real package duration, price unit, non-confirming phone action and illustrative asset', () => {
  const row = byId(sharen.id)
  assert.equal(catalogueBoundCoordinates(row)?.addressId, sharen.municipal.addressId)
  assert.equal(assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(item => item.id === row.id), now).reviewedPriceCount, 1)
  assert.deepEqual(row.openingHours.days.map(item => item.periods[0].open), Array(7).fill('10:00'))
  const [result] = near(row)
  const [service] = result.details.services
  assert.deepEqual([service.price, service.currency, service.priceKind, service.priceUnit, service.durationMin],
    [sharen.service.amount, sharen.service.currency, sharen.service.kind, sharen.service.unit, sharen.service.durationMin])
  assert.equal(result.booking.phone, sharen.booking.phone)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  const { presentationEn } = englishResolver.service(service, row)
  assert.deepEqual([presentationEn.name, presentationEn.description, presentationEn.unit],
    [sharen.service.nameEn, sharen.service.descriptionEn, sharen.service.unitEn])
  const photo = serviceThumbnail(service, { business: row })
  assert.equal(photo.source, 'illustrative')
  assert.equal(photo.src, sharen.illustrationCandidate.path)
  assert.equal(createHash('sha256').update(readFileSync(new URL('../public' + photo.src, import.meta.url))).digest('hex'), sharen.illustrationCandidate.sha256)
})

test('exactly two new businesses and two repairs improve four previously empty exact-location category cells', () => {
  const before = quarterRefreshPriorCatalogue(SOFIA_CATALOGUE)
  const ids = new Set(before.map(row => row.id))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => !ids.has(row.id)).map(row => row.id), [horo.business.id, sharen.id])
  const reports = [before, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const all = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = groups => groups.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), batch.approvedBusinesses)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  assert.deepEqual(reports.map(report => empty(report.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(report => empty(all(report))), batch.emptyLocatedCells)
  assert.ok(reports.every(report => report.counts.totalTargetCells === batch.totalTargetCells && report.counts.pickerTargetCells === batch.pickerTargetCells))
  for (const fact of batch.affected) {
    const cells = reports.map(report => all(report)
      .find(area => area.name === fact.neighborhood).cells.find(cell => cell.categoryId === fact.category))
    assert.deepEqual(cells.map(cell => cell.count), fact.physical)
    assert.deepEqual(cells.map(cell => cell.locatedCount), fact.located)
    assert.ok(cells[1].locatedBusinessIds.includes(fact.id))
  }
  assert.throws(() => quarterRefreshPriorCatalogue([{ ...newDes, address: 'София' }]), /Unreviewed/u)
  assert.throws(() => quarterRefreshPriorCatalogue([newAuto, newAuto]), /Duplicate/u)
})
