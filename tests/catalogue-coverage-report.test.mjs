import test from 'node:test'
import assert from 'node:assert/strict'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { DISCOVERY_CATEGORIES } from '../lib/discovery/categories.mjs'
import { NEIGHBOURHOODS } from '../lib/business-location.mjs'
import { catalogueCoverageReport, coverageNeighborhood, coverageMarkdown, DEFAULT_CATALOGUE_COVERAGE_TARGET } from '../scripts/catalogue-coverage-report.mjs'

const now = Date.parse('2026-11-16T00:00:00Z')
const seed = SOFIA_CATALOGUE.find(row => row.id === 'sofia-mokro-nosle')
const row = (id, patch = {}) => ({ ...structuredClone(seed), id: `sofia-coverage-${id}`, coordinates: null, neighborhood: 'Борово', ...patch })
const fixture = rows => catalogueCoverageReport(rows, { now, neighborhoods: ['Борово', 'Младост 1', 'Младост 2'], target: 50 })
const cell = (report, name, category) => report.neighborhoods.find(area => area.name === name)?.cells.find(item => item.categoryId === category)

test('current priority defaults to30 and prose respects explicit historical or future targets', () => {
  assert.equal(DEFAULT_CATALOGUE_COVERAGE_TARGET, 30)
  const current = catalogueCoverageReport([], { now, neighborhoods: ['Борово'] })
  assert.equal(current.targetPerCategoryPerNeighborhood, 30)
  assert.equal(current.counts.outstandingBusinessCategoryIncidences, 30 * DISCOVERY_CATEGORIES.length)
  for (const target of [7, 30, 50]) {
    const report = catalogueCoverageReport([], { now, neighborhoods: ['Борово'], target })
    const markdown = coverageMarkdown(report)
    assert.match(markdown, new RegExp(`${target} различни реални обекта`))
    assert.match(markdown, new RegExp(`целта е ${target}\\.`))
    assert.match(markdown, new RegExp(`че ${target} подходящи обекта`))
    assert.ok(report.policy.some(text => text.includes(`proof that ${target} eligible premises`)))
  }
})

test('other supported cities neither fill Sofia cells nor inflate the excluded Sofia count', () => {
  const report = fixture([row('sofia'), row('lom', { id: 'lom-coverage-fixture', cityCode: '44238', neighborhood: null }),
    row('brusartsi', { id: 'brusartsi-coverage-fixture', cityCode: '06570', neighborhood: null }),
    row('draft', { verification: { ...seed.verification, status: 'draft' } })])
  assert.equal(report.counts.sourceRecords, 4)
  assert.equal(report.counts.sourceSofiaRecords, 2)
  assert.equal(report.counts.sourceOtherCityRecords, 2)
  assert.equal(report.counts.approvedOtherCityBusinesses, 2)
  assert.equal(report.counts.approvedBusinesses, 1)
  assert.equal(report.counts.excludedOrNotCurrentlyEligible, 1)
  assert.equal(cell(report, 'Борово', 'pets').count, 1)
})

test('nearby readiness separates bound points from raw, invalid, absent and service-area coordinates', () => {
  const bound = row('bound')
  bound.coordinates = { latitude: 42.67, longitude: 23.29, method: 'first_party_coordinates',
    source: bound.website, sourceAddress: bound.address }
  const unbound = row('unbound', { coordinates: { ...bound.coordinates, sourceAddress: 'София, друг адрес 1' } })
  const legacyWithoutReceipt = row('legacy-no-receipt', { coordinates: { latitude: 42.67, longitude: 23.29,
    method: 'first_party_coordinates', source: bound.website } })
  const mobile = row('mobile', { locationKind: 'service_area', address: null, coordinates: null })
  const report = catalogueCoverageReport([bound, unbound, legacyWithoutReceipt, row('absent'), mobile],
    { now, neighborhoods: ['Борово'], target: 2 })
  const pets = cell(report, 'Борово', 'pets')
  assert.equal(pets.count, 3)
  assert.equal(pets.targetMet, true)
  assert.equal(pets.locatedCount, 1)
  assert.equal(pets.unlocatedCount, 2)
  assert.equal(pets.locatedGap, 1)
  assert.equal(pets.locatedTargetMet, false)
  assert.deepEqual(pets.locatedBusinessIds, [bound.id])
  assert.equal(report.counts.premisesWithBoundCoordinates, 1)
  assert.equal(report.counts.premisesWithoutBoundCoordinates, 2)
  assert.equal(report.counts.excludedOrNotCurrentlyEligible, 1)
  assert.equal(report.counts.serviceAreaProviders, 1)
  assert.equal(report.counts.cellsAtLocatedTarget, 0)
  assert.match(coverageMarkdown(report), /не гарантира резултати във всеки радиус/)
})

test('coverage counts unique business IDs per real service category, not services or primary label', () => {
  const rows = [row('multiple', { category: 'other', services: [
    { name: 'Дамско подстригване', category: 'hair', appointmentModel: 'appointment' },
    { name: 'Мъжко подстригване', category: 'hair', appointmentModel: 'appointment' },
    { name: 'Маникюр', category: 'nails', appointmentModel: 'appointment' },
  ] }), row('second')]
  const before = JSON.stringify(rows), report = fixture(rows)
  assert.equal(cell(report, 'Борово', 'hair').count, 1)
  assert.equal(cell(report, 'Борово', 'nails').count, 1)
  assert.equal(cell(report, 'Борово', 'pets').count, 1)
  assert.equal(cell(report, 'Борово', 'other').count, 0)
  assert.equal(report.counts.approvedBusinesses, 2)
  assert.equal(report.counts.businessCategoryIncidences, 3)
  assert.equal(JSON.stringify(rows), before)
  assert.throws(() => fixture([rows[0], rows[0]]), /Duplicate catalogue ID/)
})

test('mobile, unknown and broad parent labels cannot fabricate exact neighborhood coverage', () => {
  const report = fixture([
    row('exact', { neighborhood: 'Младост 1' }),
    row('broad', { neighborhood: 'Младост' }),
    row('mobile', { locationKind: 'service_area', address: null, neighborhood: 'Младост 2' }),
    row('unknown', { neighborhood: null }), row('unspecified', { neighborhood: 'Неуточнен' }),
    row('additional', { neighborhood: 'Малинова долина' }),
  ])
  assert.equal(cell(report, 'Младост 1', 'pets').count, 1)
  assert.equal(cell(report, 'Младост 2', 'pets').count, 0)
  assert.equal(report.counts.broadAreaUnresolvedPremises, 1)
  assert.equal(report.counts.missingNeighborhoodPremises, 2)
  assert.equal(report.counts.serviceAreaProviders, 1)
  assert.equal(report.additionalNamedAreas[0].name, 'Малинова долина')
  assert.equal(report.additionalNamedAreas[0].cells.find(cell => cell.categoryId === 'pets').count, 1)
  assert.equal(report.counts.totalTargetCells, 4 * DISCOVERY_CATEGORIES.length)
})

test('only eligible current records count; exclusions, expired, future and draft remain excluded', () => {
  const verification = patch => ({ ...seed.verification, ...patch })
  const report = fixture([
    row('valid'), row('draft', { verification: verification({ status: 'draft' }) }),
    row('expired', { verification: verification({ checkedOn: '2026-08-01', validUntil: '2026-10-01' }) }),
    row('future', { verification: verification({ checkedOn: '2026-11-17', validUntil: '2026-12-17' }) }),
    row('excluded', { id: 'sofia-balance-clinic' }),
  ])
  assert.equal(report.counts.approvedBusinesses, 1)
  assert.equal(report.counts.excludedOrNotCurrentlyEligible, 4)
  assert.equal(cell(report, 'Борово', 'pets').count, 1)
})

test('report-only aliases preserve numbered parts and do not infer geographic identity', () => {
  assert.equal(coverageNeighborhood('Манастирски ливади – изток'), 'Манастирски ливади')
  assert.equal(coverageNeighborhood('Бели брези'), 'Белите брези')
  assert.equal(coverageNeighborhood('Св. Троица'), 'Света Троица')
  assert.equal(coverageNeighborhood('Суха река'), 'Сухата река')
  assert.equal(coverageNeighborhood('Овча Купел 2'), 'Овча купел 2')
  assert.equal(coverageNeighborhood('Зона Б19'), 'Зона Б-19')
  assert.equal(coverageNeighborhood('Люлин 1'), 'Люлин 1')
  assert.equal(coverageNeighborhood('Люлин'), 'Люлин')
  assert.equal(coverageNeighborhood('Васил Левски'), 'Васил Левски')
  assert.equal(coverageNeighborhood('Неуточнен'), null)
})

test('priority is gap driven and complete, stable, and target states are literal', () => {
  const report = fixture([row('one')])
  assert.ok(report.priorityQueue.every((item, index) => item.rank === index + 1 && item.count < 50 && item.gap === 50 - item.count))
  assert.ok(report.priorityQueue.slice(0, -1).every((item, index) => item.count <= report.priorityQueue[index + 1].count))
  assert.equal(report.priorityQueue.length, report.counts.totalTargetCells)
  assert.equal(report.priorityQueue[0].neighborhoodPremises, 0)
  const targetReport = catalogueCoverageReport([row('one')], { now, neighborhoods: ['Борово'], target: 1 })
  assert.equal(cell(targetReport, 'Борово', 'pets').targetMet, true)
  assert.equal(cell(targetReport, 'Борово', 'pets').gap, 0)
  assert.equal(targetReport.counts.cellsAtTarget, 1)
  for (const target of [0, -1, 0.5, NaN, Infinity]) assert.throws(() => catalogueCoverageReport([], { now, target }))
  assert.throws(() => catalogueCoverageReport([], { now, neighborhoods: ['Борово', 'БОРОВО'] }), /Duplicate coverage neighborhood/)
})

test('real inventory report covers all fourteen categories and existing97suggestions without claiming exhaustive geography', () => {
  const report = catalogueCoverageReport(SOFIA_CATALOGUE, { now })
  assert.equal(report.categories.length, 14)
  assert.equal(report.taxonomy.pickerNeighborhoods, NEIGHBOURHOODS['68134'].length)
  assert.equal(report.taxonomy.pickerNeighborhoods, 97)
  assert.equal(report.counts.pickerTargetCells, 97 * 14)
  assert.equal(report.taxonomy.exhaustiveOfficialNeighborhoodRegister, false)
  assert.ok(report.additionalNamedAreas.some(area => area.name === 'Малинова долина'))
  assert.ok(report.additionalNamedAreas.some(area => area.name === 'НПЗ Искър'))
  assert.ok(report.additionalNamedAreas.some(area => area.name === 'Панчарево'))
  assert.equal(report.counts.mappedPickerPremises + report.counts.observedAdditionalAreaPremises + report.counts.broadAreaUnresolvedPremises + report.counts.missingNeighborhoodPremises, report.counts.premises)
  assert.equal(report.counts.premises + report.counts.serviceAreaProviders, report.counts.approvedBusinesses)
  for (const area of [...report.neighborhoods, ...report.additionalNamedAreas]) {
    assert.equal(area.cells.length, 14)
    for (const item of area.cells) assert.equal(new Set(item.businessIds).size, item.count)
  }
  assert.equal(report.counts.totalTargetCells - report.counts.cellsAtTarget, report.priorityQueue.length)
  const markdown = coverageMarkdown(report)
  assert.match(markdown, /не е изчерпателен официален регистър/)
  assert.match(markdown, /Първи 30 комбинации/)
  assert.match(markdown, /Люлин/)
})
