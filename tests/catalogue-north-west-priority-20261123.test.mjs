import assert from 'node:assert/strict'
import test from 'node:test'
import batch from '../docs/catalogue-coverage/north-west-priority-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE as allCurrent } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { northWestPriorCatalogue } from './catalogue-north-west-priority-20261123-scope.mjs'
import { threeAreasPriorCatalogue } from './catalogue-three-priority-areas-20261123-scope.mjs'

const SOFIA_CATALOGUE = threeAreasPriorCatalogue(allCurrent)

test('new workshop and two location repairs improve five exact priority cells without changing other records', () => {
  const prior = northWestPriorCatalogue(SOFIA_CATALOGUE)
  const before = new Map(prior.map(row => [row.id, row]))
  const added = SOFIA_CATALOGUE.filter(row => !before.has(row.id)).map(row => row.id)
  assert.deepEqual(added, batch.affected.filter(entry => entry.kind === 'new_business').map(entry => entry.id))
  const corrected = SOFIA_CATALOGUE.filter(row => before.has(row.id) && JSON.stringify(before.get(row.id)) !== JSON.stringify(row)).map(row => row.id)
  assert.deepEqual(corrected.sort(), batch.affected.filter(entry => entry.kind !== 'new_business').map(entry => entry.id).sort())
  const now = Date.parse(batch.checkedAt)
  const reports = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: batch.targetPerQuarterCategory }))
  const areas = report => [...report.neighborhoods, ...report.additionalNamedAreas]
  const empty = groups => groups.flatMap(area => area.cells).filter(cell => !cell.locatedCount).length
  assert.deepEqual(reports.map(r => r.counts.approvedBusinesses), batch.approvedBusinesses)
  assert.deepEqual(reports.map(r => r.counts.premisesWithBoundCoordinates), batch.locatedPremises)
  assert.deepEqual(reports.map(r => empty(r.neighborhoods)), batch.emptyLocatedPickerCells)
  assert.deepEqual(reports.map(r => empty(areas(r))), batch.emptyLocatedCells)
  assert.deepEqual(reports.map(r => r.counts.cellsAtLocatedTarget), batch.cellsAtLocatedTarget)
  assert.ok(reports.every(r => r.counts.totalTargetCells === batch.totalTargetCells))
  for (const { id, neighborhood, cells } of batch.affected) {
    for (const [category, expected] of Object.entries(cells)) {
      const cells = reports.map(report => areas(report).find(area => area.name === neighborhood)
        .cells.find(cell => cell.categoryId === category))
      assert.deepEqual(cells.map(cell => cell.count), expected.physical)
      assert.deepEqual(cells.map(cell => cell.locatedCount), expected.located)
      assert.ok(cells[1].locatedBusinessIds.includes(id))
    }
  }
})
