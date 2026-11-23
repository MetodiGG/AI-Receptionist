import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import sm from '../docs/catalogue-coverage/sm-group-intake-20261123.json' with { type: 'json' }
import paint from '../docs/catalogue-coverage/paintkillers-verified-location-20261123.json' with { type: 'json' }
import mushmula from '../docs/catalogue-coverage/specialist-intake-20261123.json' with { type: 'json' }
import batch from '../docs/catalogue-coverage/three-priority-areas-20261123.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { SOFIA_CATALOGUE as allCurrent } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { threeAreasPriorCatalogue } from './catalogue-three-priority-areas-20261123-scope.mjs'
import { workshopLessonsPriorCatalogue } from './catalogue-workshop-lessons-20261123-scope.mjs'

const SOFIA_CATALOGUE = workshopLessonsPriorCatalogue(allCurrent)
const now = Date.parse(batch.checkedAt)
const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const byId = id => {
  const rows = SOFIA_CATALOGUE.filter(row => row.id === id)
  assert.equal(rows.length, 1, id)
  return rows[0]
}
const englishResolver = createEnglishContentResolver(english)
const nearbyIntent = (row, category = row.category) => {
  const { latitude, longitude } = row.coordinates
  return { cityCode: '68134', neighborhood: row.neighborhood, category, coordinates: { latitude, longitude },
    radiusKm: 0.1, browse: true, searchV2: true }
}

test('a first accounting consultation is a request with zero price, not a monthly plan or live slot', () => {
  const row = byId(sm.business.id)
  assert.equal(digest(row), sm.business.normalizedRecordSha256)
  assert.equal(pricingIdentity(row), sm.business.inventoryIdentity)
  assert.equal(catalogueBoundCoordinates(row)?.addressId, '34234')
  assert.deepEqual(row.openingHours.days.map(day => day.weekday), [1, 2, 3, 4, 5])
  assert.deepEqual(assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(review => review.id === row.id), now),
    { id: row.id, state: 'reviewed', checkedOn: '2026-11-23', reviewedPriceCount: 1 })

  const intent = nearbyIntent(row)
  const [result] = normalizeCatalogueBusinesses([row], intent, { now })
  assert.equal(result.booking.kind, 'form')
  assert.equal(result.booking.url, sm.business.service.bookingDestination)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  const [service] = result.details.services
  assert.equal(result.details.services.length, 1)
  assert.equal(service.price, 0)
  assert.equal(service.currency, 'EUR')
  assert.equal(service.durationMin, null)
  assert.equal(service.illustrativePhotoKey, 'accounting-consultation')
  assert.ok(readFileSync(new URL('../public' + sm.business.image.asset, import.meta.url)).length > 1000)
  assert.equal(matchesSubcategory(row.services[0], 'consulting-accounting', row), true)
  const { presentationEn } = englishResolver.service(service, row)
  assert.equal(presentationEn.name, 'Initial accounting consultation')
  assert.match(presentationEn.description, /free first consultation.*Monthly accounting services are not included/u)
  assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Дружба 2' }, { now }), [])
})

test('PaintKillers reappears nearby at its own published point without rewriting booking or prices', () => {
  const row = byId(paint.id)
  assert.equal(digest(row), paint.reviewedRowSha256)
  const previous = { ...row, coordinates: null }
  assert.equal(digest(previous), paint.previousRowSha256)
  assert.equal(pricingIdentity(row), paint.pricingIdentity)
  assert.equal(pricingIdentity(previous), pricingIdentity(row))
  const point = catalogueBoundCoordinates(row)
  assert.equal(point?.source, paint.owner)
  assert.equal(point?.method, 'first_party_coordinates')
  assert.notDeepEqual([point.latitude, point.longitude], [paint.corroboration.sameBlockEntrance.latitude, paint.corroboration.sameBlockEntrance.longitude])
  assert.equal(catalogueBoundCoordinates({ ...row, address: row.address.replace('43Б', '44') }), null)

  const intent = nearbyIntent(row)
  assert.deepEqual(normalizeCatalogueBusinesses([previous], intent, { now }), [])
  const [result] = normalizeCatalogueBusinesses([row], intent, { now })
  assert.equal(result.booking.kind, 'phone')
  assert.equal(result.booking.phone, paint.booking.phone)
  assert.equal(result.details.services[0].price, 750)
  assert.equal(result.details.services[0].priceKind, 'from')
  assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, coordinates: { ...intent.coordinates, longitude: intent.coordinates.longitude + 0.02 } }, { now }), [])
})

test('the Poligona HIIT class matches group workouts with the exact owner booking, price and conditions', () => {
  const evidence = mushmula.newBusiness, row = byId(evidence.id)
  assert.equal(digest(row), evidence.normalizedRecordSha256)
  assert.equal(pricingIdentity(row), evidence.inventoryIdentity)
  assert.equal(catalogueBoundCoordinates(row)?.addressId, '112232')
  assert.equal(row.openingHours, undefined)
  assert.equal(assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(review => review.id === row.id), now).state, 'reviewed')
  assert.equal(row.services.length, 1)
  assert.equal(matchesSubcategory(row.services[0], 'fitness-group-training', row), true)
  assert.equal(matchesSubcategory(row.services[0], 'fitness-pilates', row), false)
  const [result] = normalizeCatalogueBusinesses([row], nearbyIntent(row), { now })
  assert.equal(result.booking.url, evidence.booking.url)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  const [service] = result.details.services
  assert.equal(service.price, 8)
  assert.equal(service.priceUnit, evidence.service.unit)
  assert.equal(service.illustrativePhotoKey, 'sx-hiit-group')
  assert.equal(service.durationMin, null)
  const { presentationEn } = englishResolver.service(service, row)
  assert.equal(presentationEn.name, evidence.service.nameEn)
  assert.equal(presentationEn.description, evidence.service.descriptionEn)
  assert.equal(presentationEn.unit, evidence.service.unitEn)
})

test('only the three accounted-for priority cells gain a verified location and only two businesses are added', () => {
  const prior = threeAreasPriorCatalogue(SOFIA_CATALOGUE)
  const before = new Map(prior.map(row => [row.id, row]))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => !before.has(row.id)).map(row => row.id),
    batch.affected.filter(entry => entry.kind === 'new_business').map(entry => entry.id))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => before.has(row.id) && digest(row) !== digest(before.get(row.id))).map(row => row.id), [paint.id])
  assert.throws(() => threeAreasPriorCatalogue([byId(paint.id), byId(paint.id)]), /Duplicate/u)
  assert.throws(() => threeAreasPriorCatalogue([{ ...byId(sm.business.id), phone: '+359880000000' }]), /Unreviewed/u)
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const areas = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = groups => groups.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.deepEqual(reports.map(r => r.counts.approvedBusinesses), batch.approvedBusinesses)
  assert.deepEqual(reports.map(r => r.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(r => empty(r.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(r => empty(areas(r))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(r => r.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  assert.ok(reports.every(r => r.counts.totalTargetCells === batch.totalTargetCells))
  for (const entry of batch.affected) {
    const cells = reports.map(r => areas(r).find(a => a.name === entry.neighborhood).cells.find(c => c.categoryId === entry.category))
    assert.deepEqual(cells.map(c => c.count), entry.physical)
    assert.deepEqual(cells.map(c => c.locatedCount), entry.located)
    assert.ok(cells[1].locatedBusinessIds.includes(entry.id))
  }
})
