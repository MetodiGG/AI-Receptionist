import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/periphery-priority-20261123.json' with { type: 'json' }
import east from '../docs/catalogue-coverage/sparse-east-intake-20261123.json' with { type: 'json' }
import south from '../docs/catalogue-coverage/sparse-south-intake-20261123.json' with { type: 'json' }
import emika from '../docs/catalogue-coverage/emika-druzhba2-intake-20261123.json' with { type: 'json' }
import silverstar from '../docs/catalogue-coverage/silverstar-ring-intake-20261123.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { filterBusinessesBySubcategory } from '../lib/discovery/subcategories.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { peripheryPriorCatalogue } from './catalogue-periphery-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const byId = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const premises = [...east.businesses, ...south.businesses, ...emika.businesses, ...silverstar.businesses]
  .map(receipt => ({ row: byId.get(receipt.id), receipt }))
const [salt, logos, exam, garage] = premises
const sha = data => createHash('sha256').update(data).digest('hex')
const resolveEnglish = createEnglishContentResolver(english)
function search(row, overrides) {
  return normalizeCatalogueBusinesses([row], { cityCode: '68134', neighborhood: row.neighborhood,
    coordinates: row.coordinates, category: row.category, radiusKm: .15, browse: true, searchV2: true, ...overrides }, { now })
}

test('the four venues require their exact premises, category and correct appointment contact', () => {
  for (const { row, receipt } of premises) {
    const point = catalogueBoundCoordinates(row), [result] = search(row)
    assert.deepEqual([point?.addressId, point?.latitude, point?.longitude],
      [receipt.municipal.addressId, receipt.municipal.latitude, receipt.municipal.longitude])
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
    assert.equal(result.id, row.id)
    assert.equal(result.booking.kind, 'phone')
    assert.equal(result.booking.phone, row.phone)
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    assert.deepEqual(search(row, { neighborhood: 'Горубляне' }), [])
    assert.deepEqual(search(row, { category: 'car_wash' }), [])
    assert.deepEqual(search(row, { coordinates: { latitude: 42.7, longitude: 23.32 } }), [])
    assert.equal(pricingIdentity(row), receipt.inventoryIdentity)
  }
})

test('only the sourced Salt Home price is displayed and the course fee stays absent; titles, photos and scope are preserved', () => {
  for (const [{ row, receipt }, subcategory, state, photoFiles] of [
    [salt, 'fitness-yoga', 'reviewed', ['yoga-class-v1.webp']],
    [logos, 'education-languages', 'service_reviewed', ['sx-child-language-group-v1.webp', 'language-lesson-v1.webp']],
    [exam, 'education-exam-preparation', 'service_reviewed', ['sx-school-tutoring-pair-v1.webp']],
    [garage, 'auto_repair-brakes-suspension', 'service_reviewed', ['sx-auto-brake-disc-v1.webp']],
  ]) {
    const review = BOOKING_PRICE_REVIEWS.find(review => review.id === row.id)
    assert.equal(assessPricingReview(row, review, now).state, state)
    const [result] = filterBusinessesBySubcategory(search(row), subcategory)
    assert.equal(result.id, row.id)
    assert.equal(result.details.services.length, photoFiles.length)
    for (const [i, service] of result.details.services.entries()) {
      const photo = serviceThumbnail(service, { business: row })
      assert.deepEqual([photo.source, photo.photoMatch, photo.src], ['illustrative', 'activity', '/service-photos/' + photoFiles[i]])
      const translated = resolveEnglish.service(service, row).presentationEn
      assert.doesNotMatch(translated.name + translated.description, /\p{Script=Cyrillic}/u)
      assert.ok(translated.name && translated.description)
    }
    if (state === 'reviewed') {
      const [{ price, currency, priceKind, priceUnit }] = result.details.services
      const [source] = receipt.prices
      assert.deepEqual([price, currency, priceKind, priceUnit], [source.amount, source.currency, source.kind, ''])
      assert.equal(row.services[0].price.sourceUrl, source.sourceUrl)
      assert.match(row.services[0].description, /17:00–18:30/)
      assert.equal(row.openingHours, undefined)
      const [path, expected] = Object.entries(east.illustrationAssets)[0]
      assert.equal(sha(readFileSync(new URL('../public' + path, import.meta.url))), expected)
    } else {
      assert.ok(result.details.services.every(service => service.price == null && service.durationMin == null))
      assert.equal(review.pricingDecision, 'not_publicly_listed')
    }
  }
})

test('periphery coverage separates a chain branch from three new operators and fills four previously empty cells', () => {
  const previous = peripheryPriorCatalogue(SOFIA_CATALOGUE)
  const priorIds = new Set(previous.map(row => row.id))
  const newRows = SOFIA_CATALOGUE.filter(row => !priorIds.has(row.id))
  assert.deepEqual(newRows.map(row =>
    ({ id: row.id, neighborhood: row.neighborhood, category: row.category, normalizedRecordSha256: sha(JSON.stringify(row)) })),
    batch.newRows.map(({ existingOperatorRecordId, ...facts }) => facts))
  const domains = rows => new Set(rows.map(row => row.website && new URL(row.website).hostname.replace(/^www\./, '')))
  const newOperators = batch.newRows.filter(row => !row.existingOperatorRecordId).map(row => byId.get(row.id))
  const newDomains = domains(newOperators), priorDomains = domains(previous)
  assert.equal(newRows.length, batch.newPremises)
  assert.equal(newOperators.length, batch.newDistinctOperators)
  assert.equal(newDomains.size, batch.newDistinctOperators)
  assert.ok([...newDomains].every(domain => domain && !priorDomains.has(domain)))
  const branches = batch.newRows.filter(row => row.existingOperatorRecordId)
  assert.equal(branches.length, 1)
  const [branch] = branches
  assert.ok(priorIds.has(branch.existingOperatorRecordId))
  assert.equal(byId.get(branch.existingOperatorRecordId).address, 'София, ул. Челопешко шосе 52')
  assert.notEqual(byId.get(branch.id).address, byId.get(branch.existingOperatorRecordId).address)
  assert.equal(newRows.flatMap(row => row.services).filter(service => service.price).length, batch.verifiedPublicPriceFacts)
  const reports = [previous, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const areas = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = areas => areas.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.deepEqual(reports.map(r => r.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(r => r.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(r => empty(areas(r))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(r => empty(r.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(r => r.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  for (const change of batch.affected) {
    const cells = reports.map(r => areas(r).find(area => area.name === change.neighborhood).cells.find(cell => cell.categoryId === change.category))
    assert.deepEqual(cells.map(cell => cell.count), change.physical)
    assert.deepEqual(cells.map(cell => cell.locatedCount), change.located)
    assert.ok(change.ids.every(id => cells[1].locatedBusinessIds.includes(id)))
  }
})
