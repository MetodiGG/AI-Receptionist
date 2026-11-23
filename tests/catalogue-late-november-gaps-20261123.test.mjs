import assert from 'node:assert/strict'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/late-november-gaps-20261123.json' with { type: 'json' }
import reformer from '../docs/catalogue-coverage/my-reformer-space-intake-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { filterBusinessesBySubcategory } from '../lib/discovery/subcategories.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { publicProse, serviceDisplayName } from '../lib/locale/public-content.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { lateNovemberGapPriorCatalogue } from './catalogue-late-november-gaps-20261123-scope.mjs'
import { northWestPriorCatalogue } from './catalogue-north-west-priority-20261123-scope.mjs'

const now = Date.parse(batch.checkedAt)
const SOFIA_CATALOGUE = northWestPriorCatalogue(currentCatalogue)
const prior = lateNovemberGapPriorCatalogue(SOFIA_CATALOGUE)
const { newBusiness: studio } = reformer

test('two new exact premises and one location repair improve the measured priority cells without claiming 30', () => {
  const before = new Map(prior.map(row => [row.id, row]))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => !before.has(row.id)).map(row => row.id),
    batch.affected.filter(entry => entry.kind === 'new_business').map(entry => entry.id))
  assert.deepEqual(SOFIA_CATALOGUE.filter(row => before.has(row.id) &&
    JSON.stringify(before.get(row.id)) !== JSON.stringify(row)).map(row => row.id),
    batch.affected.filter(entry => entry.kind === 'address_point_only').map(entry => entry.id))
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const areas = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const cells = report => areas(report).flatMap(area => area.cells)
  assert.deepEqual(reports.map(report => report.counts.approvedBusinesses), batch.approvedBusinesses)
  assert.deepEqual(reports.map(report => report.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(report => report.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  assert.deepEqual(reports.map(report => report.neighborhoods.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(report => cells(report).filter(cell => !cell.locatedCount).length), batch.emptyLocatedCells)
  for (const report of reports) assert.equal(cells(report).length, batch.totalTargetCells)
  for (const field of batch.affected) {
    const group = reports.map(report => areas(report).find(area => area.name === field.neighborhood)
      .cells.find(cell => cell.categoryId === field.category))
    assert.deepEqual(group.map(cell => cell.count), field.physical)
    assert.deepEqual(group.map(cell => cell.locatedCount), field.located)
    assert.ok(group[1].locatedBusinessIds.includes(field.id))
  }
})

test('the local studio shows for real nearby Pilates searches and displays the scoped phone price and conditions', async () => {
  assert.equal(PUBLIC_CATALOGUE.filter(row => row.id === studio.id).length, 1)
  const row = SOFIA_CATALOGUE.find(candidate => candidate.id === studio.id)
  const coordinates = { latitude: studio.municipal.latitude, longitude: studio.municipal.longitude }
  const intent = { cityCode: '68134', category: 'fitness', browse: true, searchV2: true, radiusKm: 0.2, coordinates }
  const matches = input => normalizeCatalogueBusinesses([row], input, { now })
  const [visible] = filterBusinessesBySubcategory(matches(intent), 'fitness-pilates')
  assert.equal(visible.id, studio.id)
  assert.deepEqual(visible.availability, { status: 'external', slots: [] })
  assert.deepEqual(matches({ ...intent, coordinates: { ...coordinates, longitude: 23.22 } }), [])
  assert.deepEqual(matches({ ...intent, neighborhood: 'Люлин 3' }), [])
  assert.deepEqual(railExternalAction(visible, now), { kind: 'phone', href: 'tel:' + studio.booking.phone })
  const handler = createPublicBusinessDetailsHandler({
    config: { enabled: true }, now: () => now, allowAttempt: () => true, findCatalogue: id => id === row.id ? row : null,
    readCataloguePhotos: async () => [], readPartner: () => assert.fail('A provider phone listing cannot trigger native booking'),
  })
  const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + row.id), row.id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  assert.deepEqual(business.coordinates, coordinates)
  const [service] = business.details.services
  assert.equal(business.details.services.length, 1)
  assert.deepEqual([service.price, service.priceKind, service.currency, service.priceSourceUrl, service.durationMin],
    [18, 'fixed', 'EUR', studio.ownerTariff, 50])
  assert.equal(serviceDisplayName(service, 'bg'), studio.service.name)
  assert.equal(serviceDisplayName(service, 'en'), studio.service.nameEn)
  assert.equal(publicProse(service.description, 'en', service.presentationEn.description), studio.service.descriptionEn)
  assert.equal(serviceThumbnail(service, { business }).source, 'illustrative')
  assert.equal(serviceThumbnail(service, { business }).src, studio.candidateIllustration)
})
