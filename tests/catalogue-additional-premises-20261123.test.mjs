import assert from 'node:assert/strict'
import test from 'node:test'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { pricingIdentity, assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyReviewedTennisLyulin6Recovery20261123 } from '../lib/discovery/catalogue-data/tennis-lyulin-6-recovery-20261123.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { serviceDisplayName, publicProse } from '../lib/locale/public-content.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { additionalPriorCatalogue } from './catalogue-additional-20261123-scope.mjs'
import dentalReceipt from '../docs/catalogue-coverage/galileodent-intake-20261123.json' with { type: 'json' }
import tennisReceipt from '../docs/catalogue-coverage/tennis-lyulin-6-recovery-20261123.json' with { type: 'json' }
import vmReceipt from '../docs/catalogue-coverage/vm-auto-intake-20261123.json' with { type: 'json' }
import intakeReceipt from '../docs/catalogue-coverage/additional-premises-20261123.json' with { type: 'json' }

const now = Date.parse('2026-11-23T12:00:00Z')
const lookup = id => SOFIA_CATALOGUE.find(row => row.id === id)
const neighborhoodResults = (row, options) => {
  const { latitude, longitude } = row.coordinates
  return normalizeCatalogueBusinesses([row], {
    cityCode: '68134', browse: true, searchV2: true, neighborhood: row.neighborhood, category: row.category,
    coordinates: { latitude, longitude }, radiusKm: 0.2, ...options,
  }, { now })
}
const publicDetails = async id => {
  const handler = createPublicBusinessDetailsHandler({
    config: { enabled: true }, now: () => now, allowAttempt: () => true,
    findCatalogue: lookup, readCataloguePhotos: async () => [],
    readPartner: () => assert.fail('No actual partner, booking, or analytics activity'),
  })
  const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
  assert.equal(response.status, 200)
  return (await response.json()).business
}

test('Galileodent is one independently verified dental practice; its offer is one unpriced bookable exam', async () => {
  const row = lookup('sofia-galileodent-nadezhda4-lomsko182')
  assert.equal(PUBLIC_CATALOGUE.filter(entry => entry.id === row.id).length, 1)
  assert.equal(row.neighborhood, 'Надежда 4')
  assert.match(row.address, /Ломско шосе 182, ет\. 1, ателие 2$/u)
  const coordinates = catalogueBoundCoordinates(row)
  assert.deepEqual([coordinates.addressId, coordinates.latitude, coordinates.longitude], ['104319', 42.734741, 23.293965])
  assert.equal(catalogueBoundCoordinates({ ...row, address: row.address.replace('182', '184') }), null)
  assert.equal(pricingIdentity(row), BOOKING_PRICE_REVIEWS.find(item => item.id === row.id).inventoryIdentity)
  assert.equal(assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(item => item.id === row.id), now).state, 'service_reviewed')
  assert.equal(approvedCatalogueRecord(row, Date.parse('2026-12-24T12:00:00Z')), null)
  const [local] = neighborhoodResults(row)
  assert.equal(local.id, row.id)
  assert.deepEqual(railExternalAction(local, now), { kind: 'phone', href: 'tel:+359888910328' })
  for (const patch of [{ neighborhood: 'Връбница 2' }, { cityCode: '44238' }, { category: 'education' }]) {
    assert.deepEqual(neighborhoodResults(row, patch), [])
  }
  const business = await publicDetails(row.id)
  const [service] = business.details.services
  assert.equal(business.details.services.length, 1)
  assert.deepEqual([service.price, service.durationMin], [null, null])
  assert.equal(serviceDisplayName(service, 'bg'), 'Профилактичен дентален преглед')
  assert.equal(serviceDisplayName(service, 'en'), 'Prophylactic dental examination')
  assert.equal(serviceThumbnail(service, { business }).src, '/service-photos/dental-exam-v1.webp')
  assert.equal(serviceThumbnail(service, { business }).source, 'illustrative')
  const draft = catalogueOnboardingDetail(PUBLIC_CATALOGUE, row.id, { now, cityCode: '68134', locale: 'bg' })
  assert.equal(draft.services[0].price, '')
  assert.equal(draft.services[0].duration_min, '')
  assert.equal(dentalReceipt.newBusiness.id, row.id)
})

test('Lyulin 6 gains the existing tennis court at its unchanged phone and owner point, not a duplicate', () => {
  const row = lookup(tennisReceipt.business.id), [prior] = additionalPriorCatalogue([row])
  assert.equal(row.neighborhood, 'Люлин 6'); assert.equal(prior.neighborhood, 'Люлин')
  assert.deepEqual({ ...prior, neighborhood: row.neighborhood, coordinates: row.coordinates }, row)
  assert.deepEqual(row.coordinates, tennisReceipt.coordinateReview.retainedPoint)
  assert.equal(pricingIdentity(row), tennisReceipt.identities.unchangedPricingIdentitySha256)
  assert.deepEqual(applyReviewedTennisLyulin6Recovery20261123([prior]), [row])
  const unaudited = { ...prior, address: prior.address + 'Б' }
  assert.equal(applyReviewedTennisLyulin6Recovery20261123([unaudited])[0], unaudited)
  assert.throws(() => additionalPriorCatalogue([{ ...row, phone: '+359876666666' }]), /Unreviewed 23 Nov tennis location delta/u)
  assert.equal(PUBLIC_CATALOGUE.filter(entry => entry.id === row.id).length, 1)
  assert.deepEqual(neighborhoodResults(prior, { neighborhood: 'Люлин 6' }), [])
  assert.deepEqual(railExternalAction(neighborhoodResults(row)[0], now), { kind: 'phone', href: 'tel:+359876663676' })
})

test('VM Auto displays the published starting rate and vehicle-specific condition, not a fixed quote or online slot', async () => {
  const [entry] = vmReceipt.businesses, row = lookup(entry.id)
  const point = catalogueBoundCoordinates(row)
  assert.equal(point.method, 'first_party_coordinates')
  assert.deepEqual([point.latitude, point.longitude], [entry.coordinateEvidence.latitude, entry.coordinateEvidence.longitude])
  assert.equal(point.sourceAddress, entry.address)
  assert.equal(catalogueBoundCoordinates({ ...row, address: row.address.replace('248А', '248') }), null)
  assert.equal(pricingIdentity(row), entry.inventoryIdentity)
  assert.deepEqual(row.openingHours.days.map(day => day.periods.map(period => [period.open, period.close])),
    [[['09:00', '18:00']], [['09:00', '18:00']], [['09:00', '18:00']], [['09:00', '18:00']], [['09:00', '18:00']], [], []])
  const [local] = neighborhoodResults(row)
  assert.deepEqual(local.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(local, now), { kind: 'phone', href: 'tel:+359897937799' })
  assert.deepEqual(neighborhoodResults(row, { neighborhood: 'Обеля 1' }), [])
  const business = await publicDetails(row.id)
  assert.equal(business.details.services.length, 1)
  const [service] = business.details.services
  assert.deepEqual([service.price, service.currency, service.priceKind, service.priceSourceUrl, service.durationMin],
    [30, 'EUR', 'from', entry.service.pricePages[0], null])
  assert.equal(serviceDisplayName(service, 'en'), entry.english.name)
  assert.equal(publicProse(service.description, 'en', service.presentationEn.description), entry.english.description)
  assert.equal(serviceThumbnail(service, { business }).src, entry.image.asset)
  assert.equal(serviceThumbnail(service, { business }).source, 'illustrative')
  const withdrawn = new Date('2026-12-24T00:00:00Z').getTime()
  assert.equal(approvedCatalogueRecord(row, withdrawn), null)
})

test('all coverage deltas reconcile to exact additions and address recovery without new eligibility or broad-area attribution', () => {
  const prior = additionalPriorCatalogue(SOFIA_CATALOGUE)
  const priorById = new Map(prior.map(row => [row.id, row]))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => !priorById.has(row.id)).map(row => row.id), intakeReceipt.newPlaces)
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => priorById.has(row.id) && priorById.get(row.id) !== row).map(row => row.id),
    intakeReceipt.existingPlacesCorrected)
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const flatten = areas => areas.flatMap(area => area.cells.map(cell => ({ neighborhood: area.name, ...cell })))
  const combined = reports.map(report => new Map(flatten([...report.neighborhoods, ...report.additionalNamedAreas])
    .map(cell => [cell.neighborhood + ':' + cell.categoryId, cell])))
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), intakeReceipt.approvedSofiaBusinesses)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), intakeReceipt.premisesWithBoundCoordinates)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), intakeReceipt.cellsAtLocatedTarget)
  assert.deepEqual(reports.map(report => flatten(report.neighborhoods).filter(cell => !cell.locatedCount).length), intakeReceipt.emptyLocatedPickerCells)
  assert.deepEqual(combined.map(map => [...map.values()].filter(cell => !cell.locatedCount).length), intakeReceipt.emptyLocatedTrackedCells)
  assert.deepEqual([...combined[1]].filter(([key, current]) =>
    current.count !== combined[0].get(key).count || current.locatedCount !== combined[0].get(key).locatedCount
  ).map(([key]) => key).sort(), intakeReceipt.affected.map(entry => entry.neighborhood + ':' + entry.category).sort())
  for (const entry of intakeReceipt.affected) {
    const pair = combined.map(map => map.get(entry.neighborhood + ':' + entry.category))
    assert.deepEqual(pair.map(cell => cell.count), entry.physical)
    assert.deepEqual(pair.map(cell => cell.locatedCount), entry.located)
  }
})
