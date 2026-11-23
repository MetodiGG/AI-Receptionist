import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import batch from '../docs/catalogue-coverage/quarter-next-priority-20261123.json' with { type: 'json' }
import postal from '../docs/catalogue-coverage/priority-address-recovery-20261123.json' with { type: 'json' }
import north from '../docs/catalogue-coverage/north-next-intake-20261123.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { applyPriorityAddressRecovery20261123 } from '../lib/discovery/catalogue-data/priority-address-recovery-20261123.mjs'
import { applyNorthNextExistingCoordinates20261123 } from '../lib/discovery/catalogue-data/neighborhood-verified-north-next-20261123.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { quarterNextPriorCatalogue } from './catalogue-quarter-next-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const byId = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const prior = quarterNextPriorCatalogue(SOFIA_CATALOGUE)
const priorById = new Map(prior.map(row => [row.id, row]))
const englishResolver = createEnglishContentResolver(english)
const near = (row, overrides) => normalizeCatalogueBusinesses([row], {
  cityCode: '68134', neighborhood: row.neighborhood, category: row.category, coordinates: row.coordinates,
  browse: true, searchV2: true, radiusKm: .15, ...overrides,
}, { now })

test('the ten reviewed existing points are bound to their physical premises only', () => {
  const bindings = [...postal.recoveries.map(receipt => [receipt, applyPriorityAddressRecovery20261123]),
    ...north.existingBindings.map(receipt => [receipt, applyNorthNextExistingCoordinates20261123])]
  assert.equal(bindings.length, batch.existingAddressBindings)
  for (const [receipt, apply] of bindings) {
    const { id, municipal } = receipt, row = byId.get(id), original = priorById.get(id)
    const point = catalogueBoundCoordinates(row)
    assert.deepEqual([point?.addressId, point?.latitude, point?.longitude],
      [municipal.addressId, municipal.latitude, municipal.longitude], id)
    assert.deepEqual({ ...row, coordinates: null }, original, id)
    assert.equal(pricingIdentity(row), pricingIdentity(original), id)
    if (receipt.pricingIdentity) assert.equal(pricingIdentity(row), receipt.pricingIdentity, id)
    assert.equal(digest(row), receipt.reviewedRowSha256 ?? receipt.normalizedRecordAfterSha256, id)
    assert.equal(digest(original), receipt.previousRowSha256 ?? receipt.normalizedRecordBeforeSha256, id)
    assert.deepEqual(apply([original]), [row])
    assert.equal(apply([row])[0], row)
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
    const intent = { coordinates: { latitude: point.latitude, longitude: point.longitude } }
    assert.equal(near(row, intent)[0]?.id, id)
    assert.deepEqual(near(original, intent), [])
    assert.deepEqual(near(row, { cityCode: '56784' }), [])
    for (const delta of [{ address: row.address + 'А' }, { website: 'https://example.org/' },
      { neighborhood: 'неуточнен' }, { booking: { kind: 'form', url: 'https://example.org/' } }]) {
      const different = { ...original, ...delta }
      assert.equal(apply([different])[0], different)
    }
  }
})

test('new businesses have independent operators, source-reviewed booking and fitting existing photos', () => {
  const priorHosts = new Set(prior.map(row => row.website && new URL(row.website).hostname.replace(/^www\./u, '')))
  const newHosts = new Set()
  for (const expected of batch.newRows) {
    const row = byId.get(expected.id), source = BOOKING_PRICE_REVIEWS.find(review => review.id === expected.id)
    const [result] = near(row)
    const host = new URL(row.website).hostname.replace(/^www\./u, '')
    if (!expected.existingOperatorRecordId) {
      assert.ok(!priorHosts.has(host) && !newHosts.has(host), expected.id)
      newHosts.add(host)
    } else assert.ok(priorById.has(expected.existingOperatorRecordId))
    assert.equal(result.id, row.id)
    assert.ok(catalogueBoundCoordinates(row), row.id)
    assert.equal(digest(row), expected.normalizedRecordSha256)
    assert.deepEqual([result.booking.kind, result.booking.phone ?? result.booking.url], [row.booking.kind, row.booking.phone ?? row.booking.url])
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    assert.deepEqual(near(row, { coordinates: { latitude: 42.699, longitude: 23.324 } }), [])
    const price = assessPricingReview(row, source, now)
    assert.equal(price.state, expected.pricingReview, row.id)
    if (price.state === 'service_reviewed') assert.ok(result.details.services.every(service => service.price == null))
    else assert.ok(price.reviewedPriceCount > 0)
    assert.equal(result.details.services.length, expected.imageKeys.length)
    for (const [i, service] of result.details.services.entries()) {
      const photo = serviceThumbnail(service, { business: row })
      assert.deepEqual([photo.source, photo.photoMatch], ['illustrative', 'activity'])
      assert.equal(service.illustrativePhotoKey, expected.imageKeys[i], service.name)
      assert.ok(readFileSync(new URL('../public' + photo.src, import.meta.url)).length > 0)
      const en = englishResolver.service(service, row).presentationEn
      assert.ok(en.name && en.description)
      assert.doesNotMatch(en.name + en.description, /\p{Script=Cyrillic}/u)
    }
  }
  assert.equal(newHosts.size, batch.newDistinctOperators)
})

test('stored aggregate matches the actual newly covered cells and accurate-address counts', () => {
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const areas = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = areas => areas.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(report => empty(areas(report))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(report => empty(report.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  assert.equal(batch.newRows.length, SOFIA_CATALOGUE.filter(row => !priorById.has(row.id)).length)
  assert.equal(SOFIA_CATALOGUE.filter(row => priorById.has(row.id) && digest(priorById.get(row.id)) !== digest(row)).length,
    batch.existingAddressBindings)
  for (const change of batch.affected) {
    const cells = reports.map(report => areas(report).find(area => area.name === change.neighborhood)
      .cells.find(cell => cell.categoryId === change.category))
    assert.deepEqual(cells.map(cell => cell.count), change.physical)
    assert.deepEqual(cells.map(cell => cell.locatedCount), change.located)
    assert.ok(change.ids.every(id => cells[1].locatedBusinessIds.includes(id)))
  }
})
