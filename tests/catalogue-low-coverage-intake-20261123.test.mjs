import assert from 'node:assert/strict'
import test from 'node:test'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { serviceDisplayName, publicProse } from '../lib/locale/public-content.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { lowCoveragePriorCatalogue } from './catalogue-low-coverage-20261123-scope.mjs'
import receipt from '../docs/catalogue-coverage/low-coverage-intake-20261123.json' with { type: 'json' }
import neksas from '../docs/catalogue-coverage/neksas-intake-20261123.json' with { type: 'json' }
import pkg from '../docs/catalogue-coverage/pakosti-intake-20261123.json' with { type: 'json' }
import ac from '../docs/catalogue-coverage/acpower-intake-20261123.json' with { type: 'json' }

const now = Date.parse(receipt.checkedAt)
const rows = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
const handler = createPublicBusinessDetailsHandler({
  config: { enabled: true }, now: () => now, allowAttempt: () => true,
  findCatalogue: id => rows.get(id), readCataloguePhotos: async () => [],
  readPartner: () => assert.fail('Static listings must not query native booking'),
})
const party = pkg.newBusiness, workshop = ac.business
const cases = [
  { evidence: neksas, point: neksas.municipal, phone: neksas.booking.phone,
    services: [{ name: neksas.service.name, en: neksas.service.englishName, enDescription: neksas.service.englishDescription, price: null, unit: '' }], image: neksas.service.illustration },
  { evidence: party, point: party.municipal, phone: party.booking.phone,
    services: party.services.map(s => ({ name: s.name, en: s.nameEn, enDescription: party.commonServiceDescriptionEn, price: s.amount, unit: s.unit })), image: party.illustrationCandidate.asset },
  { evidence: workshop, point: workshop.coordinateEvidence, phone: workshop.phone,
    services: [{ name: workshop.service.name, en: workshop.english.name, enDescription: workshop.english.description, price: 154, unit: '' }], image: workshop.image.asset },
]

for (const { evidence, point, phone, services, image } of cases) {
  test(evidence.id + ' is offered at the exact postal address with its literal booking and tariff conditions', async () => {
    const row = rows.get(evidence.id), bound = catalogueBoundCoordinates(row)
    assert.equal(PUBLIC_CATALOGUE.filter(candidate => candidate.id === row.id).length, 1)
    assert.deepEqual([row.address, row.neighborhood], [evidence.address, evidence.neighborhood])
    assert.deepEqual([bound.addressId, bound.latitude, bound.longitude], [point.addressId, point.latitude, point.longitude])
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
    const intent = { cityCode: '68134', neighborhood: row.neighborhood, category: row.category, browse: true, searchV2: true,
      radiusKm: 0.2, coordinates: { latitude: bound.latitude, longitude: bound.longitude } }
    const [shown] = normalizeCatalogueBusinesses([row], intent, { now })
    assert.equal(shown.id, row.id)
    assert.deepEqual(shown.availability, { status: 'external', slots: [] })
    assert.deepEqual(railExternalAction(shown, now), { kind: 'phone', href: 'tel:' + phone })
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Люлин 1' }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, coordinates: { latitude: 42.6977, longitude: 23.3219 } }, { now }), [])
    assert.deepEqual(normalizeCatalogueBusinesses([row], intent, { now: Date.parse('2026-12-24T12:00Z') }), [])
    const pricing = assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(item => item.id === row.id), now)
    assert.equal(pricing.state, services.every(service => service.price === null) ? 'service_reviewed' : 'reviewed')
    assert.equal(pricing.reviewedPriceCount, services.filter(service => service.price !== null).length)
    const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + row.id), row.id)
    assert.equal(response.status, 200)
    const { business } = await response.json()
    const details = business.details.services
    assert.equal(details.length, services.length)
    const draft = catalogueOnboardingDetail(PUBLIC_CATALOGUE, row.id, { now, cityCode: '68134', locale: 'bg' })
    for (const [index, want] of services.entries()) {
      const entry = details[index]
      assert.equal(serviceDisplayName(entry, 'bg'), want.name)
      assert.equal(serviceDisplayName(entry, 'en'), want.en)
      assert.equal(publicProse(entry.description, 'en', entry.presentationEn.description), want.enDescription)
      assert.deepEqual([entry.price, entry.priceUnit, entry.durationMin], [want.price, want.unit, null])
      assert.equal(draft.services[index].price, want.price === null ? '' : String(want.price))
      if (want.price !== null) {
        assert.equal(entry.currency, 'EUR')
        assert.equal(entry.priceKind, 'fixed')
        assert.equal(entry.priceSourceUrl, evidence.ownerPackages ?? workshop.service.appointmentAndPriceSource)
      } else assert.equal(entry.priceSourceUrl, null)
      const thumbnail = serviceThumbnail(entry, { business })
      assert.deepEqual([thumbnail.src, thumbnail.source], [image, 'illustrative'])
    }
  })
}

test('three unique premises give one verified nearby result in each target area and no duplicated services or counts', () => {
  const prior = lowCoveragePriorCatalogue(SOFIA_CATALOGUE)
  const previousIds = new Set(prior.map(row => row.id))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => !previousIds.has(row.id)).map(row => row.id), receipt.affected.map(r => r.id))
  const reports = [prior, SOFIA_CATALOGUE].map(input => catalogueCoverageReport(input, { now, target: 30 }))
  assert.deepEqual(reports.map(r => r.counts.approvedBusinesses), receipt.approvedBusinesses)
  assert.deepEqual(reports.map(r => r.counts.premisesWithBoundCoordinates), receipt.locatedPremises)
  assert.deepEqual(reports.map(r => r.counts.cellsAtLocatedTarget), receipt.cellsAtLocatedTarget)
  assert.deepEqual(reports.map(r => r.neighborhoods.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length), receipt.emptyLocatedPickerCells)
  const pair = reports.map(r => new Map([...r.neighborhoods, ...r.additionalNamedAreas].flatMap(area =>
    area.cells.map(cell => [area.name + ':' + cell.categoryId, cell]))))
  assert.deepEqual(pair.map(cells => [...cells.values()].filter(cell => !cell.locatedCount).length), receipt.emptyLocatedCells)
  for (const { neighborhood, category, physical, located } of receipt.affected) {
    const history = pair.map(cells => cells.get(neighborhood + ':' + category))
    assert.deepEqual(history.map(cell => cell.count), physical)
    assert.deepEqual(history.map(cell => cell.locatedCount), located)
  }
})
