import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import batch from '../docs/catalogue-coverage/priced-growth-20261123.json' with { type: 'json' }
import wave from '../docs/catalogue-coverage/wave-lyulin-hair-growth-20261123.json' with { type: 'json' }
import dictionary from '../lib/locale/service-english.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { WAVE_LYULIN_HAIR_20261123_REVIEW, applyWaveLyulinHair20261123 } from '../lib/discovery/catalogue-data/wave-lyulin-hair-growth-20261123.mjs'
import { pricedGrowthPriorCatalogue } from './catalogue-priced-growth-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const byId = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const sha = data => createHash('sha256').update(data).digest('hex')
const english = createEnglishContentResolver(dictionary)
const previous = pricedGrowthPriorCatalogue(SOFIA_CATALOGUE)
function search(row, category = row.category, overrides) {
  return normalizeCatalogueBusinesses([row], { cityCode: '68134', neighborhood: row.neighborhood,
    coordinates: row.coordinates, category, radiusKm: .15, browse: true, searchV2: true, ...overrides }, { now })
}
function checkThumb(service, row, expected) {
  const photo = serviceThumbnail(service, { business: row })
  assert.ok(['activity', 'exact'].includes(photo.photoMatch), service.name)
  assert.deepEqual([photo.source, photo.src], ['illustrative', '/service-photos/' + expected + '-v1.webp'], service.name)
  assert.ok(readFileSync(new URL('../public' + photo.src, import.meta.url)).length > 0)
  const en = english.service(service, row).presentationEn
  assert.ok(en.name)
  assert.doesNotMatch(en.name + (en.description || ''), /\p{Script=Cyrillic}/u)
}

test('Wave adds a searchable hair category with 24 verified euro quotes and preserves its original nail profile', () => {
  const row = byId.get(wave.id), original = previous.find(r => r.id === wave.id)
  assert.deepEqual({ ...row, services: row.services.filter(service => service.category !== 'hair') }, original)
  assert.equal(pricingIdentity(original), wave.previousPricingIdentity)
  assert.equal(pricingIdentity(row), wave.reviewedPricingIdentity)
  assert.equal(catalogueBoundCoordinates(row).addressId, wave.addressId)
  assert.deepEqual(applyWaveLyulinHair20261123([original]), [row])
  assert.equal(applyWaveLyulinHair20261123([row])[0], row)
  const moved = { ...original, address: 'София, НДК' }
  assert.equal(applyWaveLyulinHair20261123([moved])[0], moved)
  const [hair] = search(row, 'hair'), [nails] = search(row, 'nails')
  assert.equal(hair.id, nails.id)
  assert.equal(hair.booking.phone, nails.booking.phone)
  assert.deepEqual(search(original, 'hair'), [])
  assert.deepEqual(nails.services.map(service => service.price), [10.23, 12.78, 17.9])
  assert.deepEqual(row.services.filter(service => service.category === 'hair').map(({ name, price, durationMin }) =>
    [name, price.amount, price.currency, price.sourceUrl, durationMin]),
  wave.priceFacts.map(p => [p.name, p.amount, 'EUR', wave.operatorSource, p.durationMin]))
  const facts = new Map(wave.priceFacts.map(x => [x.name, x.imageKey]))
  for (const service of hair.services) checkThumb(service, row, facts.get(service.name))
  assert.equal(assessPricingReview(row, WAVE_LYULIN_HAIR_20261123_REVIEW, now).reviewedPriceCount, 24)
})

test('new venues expose only scoped visits, booking requests and exact local cards', () => {
  const newSites = new Set()
  const priorSites = new Set(previous.map(row => row.website && new URL(row.website).hostname.replace(/^www\./u, '')))
  for (const expected of batch.newRows) {
    const row = byId.get(expected.id), [result] = search(row)
    assert.equal(result.id, row.id)
    const site = new URL(row.website).hostname.replace(/^www\./u, '')
    assert.ok(!newSites.has(site) && !priorSites.has(site), row.id)
    newSites.add(site)
    assert.equal(catalogueBoundCoordinates(row).addressId, expected.addressId)
    assert.equal(sha(JSON.stringify(row)), expected.normalizedRecordSha256)
    assert.equal(pricingIdentity(row), expected.inventoryIdentity)
    const review = BOOKING_PRICE_REVIEWS.find(value => value.id === row.id)
    assert.equal(assessPricingReview(row, review, now).state, expected.pricingReview)
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    assert.deepEqual([result.booking.kind, result.booking.phone ?? result.booking.url],
      [row.booking.kind, row.booking.phone ?? row.booking.url])
    assert.deepEqual(search(row, row.category, { neighborhood: 'Младост 4' }), [])
    assert.equal(result.details.services.length, expected.imageKeys.length)
    result.details.services.forEach((service, index) => checkThumb(service, row, expected.imageKeys[index]))
  }
  const kart = byId.get('sofia-karting-ring-academy-simeonovo-214'), party = byId.get('sofia-partydots-druzhba2-block280e')
  assert.deepEqual(kart.services.map(({ price, durationMin }) => [price.kind, price.amount, price.maximum, price.unit, durationMin]),
    [['range', 270, 300, 'курс', undefined], ['fixed', 300, undefined, 'курс', undefined]])
  assert.match(kart.services[0].description, /270 € за делнична група или 300 € за група през уикенда/)
  assert.ok(kart.services.every(service => /9 дни.*18 карания.*80 минути/u.test(service.description)))
  assert.deepEqual(party.services.map(({ price, durationMin }) => [price.kind, price.amount, price.unit, durationMin]),
    [['from', 180, 'пакет', 150], ['from', 245, 'пакет', undefined], ['from', 385, 'пакет', undefined]])
})

test('coverage ledger agrees with current records and does not count the expanded Wave profile as a new operator', () => {
  const reports = [previous, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const areas = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = areas => areas.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.equal(SOFIA_CATALOGUE.length - previous.length, batch.newDistinctOperators)
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), batch.approvedCatalogueRecords)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(report => empty(areas(report))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(report => empty(report.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  const newPrices = batch.newRows.flatMap(x => byId.get(x.id).services).filter(service => service.price).length
  assert.equal(newPrices + wave.priceFacts.length, batch.verifiedPublicPriceFacts)
  for (const change of batch.affected) {
    const cells = reports.map(report => areas(report).find(area => area.name === change.neighborhood)
      .cells.find(cell => cell.categoryId === change.category))
    assert.deepEqual(cells.map(cell => cell.count), change.physical)
    assert.deepEqual(cells.map(cell => cell.locatedCount), change.located)
    assert.ok(cells[1].locatedBusinessIds.includes(change.id))
  }
})
