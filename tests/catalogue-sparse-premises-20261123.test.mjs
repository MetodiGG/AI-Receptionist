import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import batch from '../docs/catalogue-coverage/sparse-premises-priority-20261123.json' with { type: 'json' }
import saltReceipt from '../docs/catalogue-coverage/salt-hug-intake-20261123.json' with { type: 'json' }
import dentalReceipt from '../docs/catalogue-coverage/frantsov-intake-20261123.json' with { type: 'json' }
import autoReceipt from '../docs/catalogue-coverage/solux-auto-intake-20261123.json' with { type: 'json' }
import masters from '../docs/catalogue-coverage/masters-dance-intake-20261123.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { cataloguePublicationState } from '../scripts/check-sofia-catalogue.mjs'
import { sparsePremisesPriorCatalogue } from './catalogue-sparse-premises-20261123-scope.mjs'
import { lyulinPremisesPriorCatalogue } from './catalogue-lyulin-premises-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const SOFIA_CATALOGUE = lyulinPremisesPriorCatalogue(currentCatalogue)
const digest = value => createHash('sha256').update(value).digest('hex')
const englishResolver = createEnglishContentResolver(english)
const salt = saltReceipt.business, dentist = dentalReceipt.newBusiness, auto = autoReceipt.business
const byId = id => {
  const rows = SOFIA_CATALOGUE.filter(row => row.id === id)
  assert.equal(rows.length, 1, id)
  return rows[0]
}
function near(row, options = {}) {
  const { latitude, longitude } = row.coordinates
  return normalizeCatalogueBusinesses([row], { cityCode: '68134', neighborhood: row.neighborhood, category: row.category,
    coordinates: { latitude, longitude }, radiusKm: 0.1, browse: true, searchV2: true, ...options }, { now })
}
function verified(fact, addressId, state, photoPath, photoHash) {
  const row = byId(fact.id)
  assert.equal(digest(JSON.stringify(row)), fact.normalizedRecordSha256)
  assert.equal(pricingIdentity(row), fact.inventoryIdentity)
  assert.equal(catalogueBoundCoordinates(row)?.addressId, addressId)
  assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + ', различен вход' }), null)
  const reviews = BOOKING_PRICE_REVIEWS.filter(review => review.id === fact.id)
  assert.equal(reviews.length, 1)
  assert.equal(assessPricingReview(row, reviews[0], now).state, state)
  const [result] = near(row)
  assert.equal(result.id, row.id)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(near(row, { coordinates: { latitude: row.coordinates.latitude, longitude: row.coordinates.longitude + 0.04 } }), [])
  assert.equal(result.details.services.length, 1)
  const [service] = result.details.services
  const photo = serviceThumbnail(service, { business: row })
  assert.deepEqual([photo.source, photo.src], ['illustrative', photoPath])
  assert.equal(digest(readFileSync(new URL('../public' + photoPath, import.meta.url))), photoHash)
  return { row, result, service, presentationEn: englishResolver.service(service, row).presentationEn }
}

test('Salt Hug uses its private adult visit price, actual phone reservation and a standalone salt-room illustration', () => {
  const { row, result, service, presentationEn } = verified(salt, salt.municipalPoint.row, 'reviewed', saltReceipt.service.photo, saltReceipt.service.photoSha256)
  const fact = saltReceipt.service
  assert.deepEqual([service.price, service.currency, service.priceKind, service.priceUnit, service.durationMin],
    [fact.amount, fact.currency, fact.kind, fact.unit, fact.durationMin])
  assert.equal(row.services[0].price.sourceUrl, fact.tariff)
  assert.deepEqual([result.booking.kind, result.booking.phone], [salt.booking.kind, salt.booking.phone])
  assert.deepEqual([presentationEn.name, presentationEn.description, presentationEn.unit], [fact.nameEn, fact.descriptionEn, fact.unitEn])
  assert.equal(row.openingHours.days[0].periods[0].open, '14:00')
  assert.equal(row.openingHours.days[6].periods[0].open, '10:00')
})

test('the first dental examination links the exact publishing channel, not a presumed phone rate or included treatment', () => {
  const { row, result, service, presentationEn } = verified(dentist, dentist.municipal.addressId, 'reviewed',
    dentist.illustrationCandidate.path, dentist.illustrationCandidate.sha256)
  assert.deepEqual([result.booking.kind, result.booking.url], [dentist.booking.kind, dentist.booking.url])
  assert.equal(row.verification.booking.url, dentist.booking.firstPartyEvidence)
  assert.equal(cataloguePublicationState([row], now).manualIntakeResolutions.length, 0, 'the owner evidence qualifies independently of the separate provider destination')
  assert.deepEqual([service.price, service.currency, service.priceKind, service.durationMin], [25, 'EUR', 'fixed', null])
  assert.equal(row.services[0].price.sourceUrl, dentist.service.sourceUrl)
  assert.equal(presentationEn.name.toLowerCase(), dentist.service.nameEn.toLowerCase())
  assert.equal(presentationEn.description, dentist.service.descriptionEn)
  assert.doesNotMatch(row.address, /ап\.|ет\./u)
})

test('Solux phone appointments preserve the exact industrial locality, without a guessed price or opening hours', () => {
  const { row, result, service, presentationEn } = verified(auto, auto.coordinateEvidence.addressId, 'service_reviewed', auto.image.asset, auto.image.sha256)
  assert.equal(row.services[0].price, undefined)
  assert.equal(row.openingHours, undefined)
  assert.deepEqual([result.booking.kind, result.booking.phone], ['phone', auto.phone])
  assert.equal(service.price, null)
  assert.equal(service.durationMin, null)
  assert.equal(presentationEn.name, auto.english.name)
  assert.equal(presentationEn.description, auto.english.description)
  assert.deepEqual(near(row, { neighborhood: 'Хаджи Димитър' }), [])
})

test('adult folklore classes belong to the precise Lyulin-centre school with no assumed price or slot', () => {
  const { row, result, service, presentationEn } = verified({ ...masters.business, ...masters.identities },
    masters.addressEvidence.municipalRow.rn, 'service_reviewed', '/service-photos/sx-bulgarian-folk-group-v1.webp',
    '9f9eee80c60dd3ad61d6115451707bf0f3da8ff95f36790f40023eefd9b8a279')
  assert.deepEqual([result.booking.kind, result.booking.url], ['form', masters.bookingEvidence.entry])
  assert.equal(row.openingHours, undefined)
  assert.equal(row.services[0].price, undefined)
  assert.equal(service.illustrativePhotoKey, masters.service.approvedActivityPhotoId)
  assert.equal(matchesSubcategory(row.services[0], 'fitness-folk-dance', row), true)
  assert.deepEqual([presentationEn.name, presentationEn.description], [masters.service.english.name, masters.service.english.description])
  assert.deepEqual(near(row, { neighborhood: 'Люлин 3' }), [])
})

test('the measured local report adds only the four reviewed venues, with no earlier rows or duplicate phones changed', () => {
  const prior = sparsePremisesPriorCatalogue(SOFIA_CATALOGUE), ids = new Set(prior.map(row => row.id))
  const added = SOFIA_CATALOGUE.filter(row => !ids.has(row.id))
  assert.deepEqual(added.map(row => row.id), batch.affected.map(row => row.id))
  assert.ok(prior.every(row => SOFIA_CATALOGUE.includes(row)))
  for (const row of added) assert.equal(SOFIA_CATALOGUE.filter(other => other.phone === row.phone).length, 1)
  assert.throws(() => sparsePremisesPriorCatalogue([added[0], added[0]]), /Duplicate/u)
  assert.throws(() => sparsePremisesPriorCatalogue([{ ...added[0], address: 'София' }]), /Unreviewed/u)
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const all = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = areas => areas.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.deepEqual(reports.map(r => r.counts.approvedBusinesses), batch.approvedBusinesses)
  assert.deepEqual(reports.map(r => r.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(r => empty(all(r))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(r => empty(r.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(r => r.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  assert.ok(reports.every(r => r.counts.totalTargetCells === batch.totalTargetCells && r.counts.pickerTargetCells === batch.pickerTargetCells))
  for (const entry of batch.affected) {
    const cells = reports.map(report => all(report).find(area => area.name === entry.neighborhood).cells.find(cell => cell.categoryId === entry.category))
    assert.deepEqual(cells.map(cell => cell.count), entry.physical)
    assert.deepEqual(cells.map(cell => cell.locatedCount), entry.located)
    assert.ok(cells[1].locatedBusinessIds.includes(entry.id))
  }
})
