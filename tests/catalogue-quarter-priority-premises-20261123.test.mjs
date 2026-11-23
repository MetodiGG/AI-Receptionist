import assert from 'node:assert/strict'
import test from 'node:test'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { serviceDisplayName, publicProse } from '../lib/locale/public-content.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { priorityPriorCatalogue } from './catalogue-quarter-priority-20261123-scope.mjs'
import receipt from '../docs/catalogue-coverage/quarter-priority-premises-20261123.json' with { type: 'json' }
import garage from '../docs/catalogue-coverage/dbros-intake-20261123.json' with { type: 'json' }
import dental from '../docs/catalogue-coverage/priority-dental-20261123.json' with { type: 'json' }
import corroboration from '../docs/catalogue-coverage/quarter-corroboration-20261123.json' with { type: 'json' }

const now = Date.parse(receipt.checkedAt)
const current = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const original = priorityPriorCatalogue(SOFIA_CATALOGUE)
const prior = new Map(original.map(row => [row.id, row]))
const handler = createPublicBusinessDetailsHandler({
  config: { enabled: true }, now: () => now, allowAttempt: () => true,
  findCatalogue: id => current.get(id), readCataloguePhotos: async () => [],
  readPartner: () => assert.fail('A static listing must not query partner appointments'),
})

const byLocation = row => {
  const coordinates = catalogueBoundCoordinates(row)
  return { cityCode: '68134', neighborhood: row.neighborhood, category: row.category,
    browse: true, searchV2: true, primaryRadiusKm: 0.2, radiusKm: 0.2,
    coordinates: { latitude: coordinates.latitude, longitude: coordinates.longitude } }
}

for (const evidence of [garage.newBusiness, dental.newBusiness]) {
  test(evidence.name + ' uses the exact postal point, actual booking type and localised unpriced services', async () => {
    const row = current.get(evidence.id)
    const car = evidence.category === 'auto_repair'
    const sources = car ? evidence.services : [{ name: evidence.service, photo: evidence.illustration, englishName: 'Treatment of caries' }]
    assert.equal(PUBLIC_CATALOGUE.filter(record => record.id === row.id).length, 1)
    assert.deepEqual([row.address, row.neighborhood], [evidence.address, evidence.neighborhood])
    const point = catalogueBoundCoordinates(row), municipal = evidence.officialAddress ?? evidence.municipal
    assert.deepEqual([point.addressId, point.latitude, point.longitude], [municipal.addressId, municipal.latitude, municipal.longitude])
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'Б' }), null)
    const intent = byLocation(row)
    const [result] = normalizeCatalogueBusinesses([row], intent, { now })
    assert.equal(result.id, row.id)
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    assert.deepEqual(railExternalAction(result, now),
      car ? { kind: 'form', href: evidence.ownerContactAndActualBooking } : { kind: 'phone', href: 'tel:+359887833222' })
    assert.equal(railExternalAction(result, Date.parse('2026-12-24T00:00Z')), null)
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Люлин 1' }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, category: 'fitness' }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent,
      coordinates: { latitude: 42.6977, longitude: 23.3219 } }, { now }), [])
    const review = BOOKING_PRICE_REVIEWS.find(item => item.id === row.id)
    assert.equal(assessPricingReview(row, review, now).state, 'service_reviewed')
    assert.equal(pricingIdentity(row), evidence.inventoryIdentity)
    const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + row.id), row.id)
    assert.equal(response.status, 200)
    const { business } = await response.json()
    assert.equal(business.details.services.length, sources.length)
    const draft = catalogueOnboardingDetail(PUBLIC_CATALOGUE, row.id, { now, cityCode: '68134', locale: 'bg' })
    assert.deepEqual(business.details.hours, car ? [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: ['09:00–18:00'] })) : [])
    for (const [index, service] of business.details.services.entries()) {
      assert.deepEqual([service.price, service.durationMin, service.priceSourceUrl], [null, null, null])
      assert.equal(draft.services[index].price, '')
      assert.equal(serviceDisplayName(service, 'bg'), sources[index].name)
      assert.equal(serviceDisplayName(service, 'en'), sources[index].englishName)
      if (car) assert.match(publicProse(service.description, 'en', service.presentationEn.description), /appointment time and price with the workshop/iu)
      const image = serviceThumbnail(service, { business })
      assert.deepEqual([image.src, image.source], [sources[index].photo, 'illustrative'])
    }
  })
}

test('the two corrected quarters keep their original premises, booking, and service price identity', () => {
  for (const evidence of corroboration.existingBusinesses) {
    const row = current.get(evidence.id), previous = prior.get(evidence.id)
    assert.deepEqual([previous.neighborhood, row.neighborhood], evidence.neighborhood)
    const position = value => [value.latitude, value.longitude]
    assert.deepEqual(position(catalogueBoundCoordinates(row)), position(previous.coordinates))
    assert.deepEqual([row.address, row.website, row.booking, row.openingHours, row.services],
      [previous.address, previous.website, previous.booking, previous.openingHours, previous.services])
    assert.deepEqual([pricingIdentity(previous), pricingIdentity(row)], [evidence.inventoryIdentity, evidence.inventoryIdentity])
    assert.equal(normalizeCatalogueBusinesses([row], byLocation(row), { now })[0]?.id, row.id)
  }
})

test('the coverage receipt shows exactly two new places and two fewer empty nearby cells', () => {
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => !prior.has(row.id)).map(row => row.id), receipt.newPlaces)
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => prior.has(row.id) && prior.get(row.id) !== row).map(row => row.id).sort(),
    [...receipt.existingPlacesRecovered].sort())
  const reports = [original, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const pairs = reports.map(report => new Map([...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area =>
    area.cells.map(cell => [area.name + ':' + cell.categoryId, cell]))))
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), receipt.catalogueBusinessCount)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), receipt.locatedPremises)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), receipt.cellsAtLocatedTarget)
  assert.deepEqual(reports.map(report => report.neighborhoods.flatMap(area => area.cells).filter(cell => cell.locatedCount === 0).length),
    receipt.emptyLocatedPickerCells)
  assert.deepEqual(pairs.map(map => [...map.values()].filter(cell => cell.locatedCount === 0).length), receipt.emptyLocatedCells)
  assert.deepEqual([...pairs[1]].filter(([key, cell]) => cell.locatedCount !== pairs[0].get(key).locatedCount).map(([key]) => key).sort(),
    receipt.affected.map(area => area.neighborhood + ':' + area.category).sort())
  for (const evidence of receipt.affected) {
    const cells = pairs.map(map => map.get(evidence.neighborhood + ':' + evidence.category))
    assert.deepEqual(cells.map(cell => cell.count), evidence.physical)
    assert.deepEqual(cells.map(cell => cell.locatedCount), evidence.located)
  }
})
