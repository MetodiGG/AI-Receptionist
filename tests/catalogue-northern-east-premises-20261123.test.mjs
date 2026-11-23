import assert from 'node:assert/strict'
import test from 'node:test'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { serviceDisplayName, publicProse } from '../lib/locale/public-content.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { northernEastPriorCatalogue } from './catalogue-northern-east-20261123-scope.mjs'
import aggregate from '../docs/catalogue-coverage/northern-east-premises-20261123.json' with { type: 'json' }
import education from '../docs/catalogue-coverage/sport-education-gap-20261123.json' with { type: 'json' }
import clinic from '../docs/catalogue-coverage/doichinova-intake-20261123.json' with { type: 'json' }

const now = Date.parse(aggregate.checkedAt)
const records = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const handler = createPublicBusinessDetailsHandler({
  config: { enabled: true }, now: () => now, allowAttempt: () => true,
  findCatalogue: id => records.get(id), readCataloguePhotos: async () => [],
  readPartner: () => assert.fail('These unaffiliated listings need no native partner or provider activity'),
})

for (const evidence of [education.newBusiness, clinic.newBusiness]) {
  const { id } = evidence
  const isCourse = evidence.category === 'education'
  const row = records.get(id)
  test(id + ' retains linked address, actual public request route and branch-specific terms in both languages', async () => {
    assert.equal(PUBLIC_CATALOGUE.filter(item => item.id === id).length, 1)
    assert.equal(row.neighborhood, evidence.neighborhood)
    assert.equal(row.address, evidence.address)
    const point = catalogueBoundCoordinates(row)
    const official = evidence.municipalAddress ?? evidence.municipal
    assert.deepEqual([point.addressId, point.latitude, point.longitude], [official.addressId, official.latitude, official.longitude])
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'Б' }), null)
    const intent = { cityCode: '68134', neighborhood: row.neighborhood, browse: true, searchV2: true, category: row.category,
      radiusKm: 0.2, coordinates: { latitude: point.latitude, longitude: point.longitude } }
    const [nearest] = normalizeCatalogueBusinesses([row], intent, { now })
    assert.equal(nearest.id, id)
    assert.deepEqual(nearest.availability, { status: 'external', slots: [] })
    assert.deepEqual(railExternalAction(nearest, now), { kind: 'form', href: evidence.booking?.url ?? evidence.practitionerBooking })
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Люлин 1' }, { now }), [])
    assert.equal(approvedCatalogueRecord(row, Date.parse('2026-12-24T00:00:00Z')), null)
    const review = BOOKING_PRICE_REVIEWS.find(item => item.id === id)
    assert.equal(assessPricingReview(row, review, now).state, isCourse ? 'service_reviewed' : 'reviewed')
    const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
    assert.equal(response.status, 200)
    const { business } = await response.json()
    assert.equal(business.details.services.length, 1)
    const [service] = business.details.services
    assert.equal(service.durationMin, null)
    assert.equal(serviceDisplayName(service, 'bg'), isCourse ? evidence.service.name : evidence.service)
    const draft = catalogueOnboardingDetail(PUBLIC_CATALOGUE, id, { now, cityCode: '68134', locale: 'bg' })
    if (isCourse) {
      assert.equal(service.price, null)
      assert.equal(draft.services[0].price, '')
      assert.deepEqual(business.details.hours, [])
      assert.equal(serviceDisplayName(service, 'en'), evidence.english.service)
      assert.equal(publicProse(service.description, 'en', service.presentationEn.description), evidence.english.description)
    } else {
      assert.deepEqual([service.price, service.currency, service.priceKind, service.priceSourceUrl],
        [15.34, 'EUR', 'fixed', evidence.practitionerBooking])
      assert.equal(draft.services[0].price, '15.34')
      assert.equal(serviceDisplayName(service, 'en'), 'Initial Dental Examination')
      assert.match(publicProse(service.description, 'en', service.presentationEn.description), /Dr Gergana Zinkova at the Lyulin 3 practice.*if you have them/u)
      assert.deepEqual(row.openingHours.days.map(day => day.periods.map(period => [period.open, period.close])),
        [[['08:00', '20:00']], [['08:00', '20:00']], [['08:00', '20:00']], [['08:00', '20:00']], [['08:00', '20:00']], [], []])
    }
    const image = serviceThumbnail(service, { business })
    assert.equal(image.src, evidence.recommendedIllustration?.service ?? evidence.illustration)
    assert.equal(image.source, 'illustrative')
  })
}

test('six formerly empty nearby cells gain usable coverage with exactly two new business IDs', () => {
  const prior = northernEastPriorCatalogue(SOFIA_CATALOGUE), byId = new Map(prior.map(row => [row.id, row]))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => !byId.has(row.id)).map(row => row.id), aggregate.newPlaces)
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => byId.has(row.id) && byId.get(row.id) !== row).map(row => row.id).sort(), [...aggregate.existingPlacesRecovered].sort())
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const cells = reports.map(report => new Map([...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area =>
    area.cells.map(cell => [area.name + ':' + cell.categoryId, cell]))))
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), aggregate.catalogueBusinessCount)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), aggregate.locatedPremises)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), aggregate.cellsAtLocatedTarget)
  assert.deepEqual(cells.map(map => [...map.values()].filter(cell => !cell.locatedCount).length), aggregate.emptyLocatedCells)
  assert.deepEqual([...cells[1]].filter(([key, row]) => row.locatedCount !== cells[0].get(key).locatedCount).map(([key]) => key).sort(),
    aggregate.affected.map(area => area.neighborhood + ':' + area.category).sort())
  for (const entry of aggregate.affected) {
    const pair = cells.map(map => map.get(entry.neighborhood + ':' + entry.category))
    assert.deepEqual(pair.map(cell => cell.count), entry.physical)
    assert.deepEqual(pair.map(cell => cell.locatedCount), entry.located)
  }
})
