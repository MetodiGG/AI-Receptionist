import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { catalogueCoverageReport, coverageNeighborhood } from './catalogue-coverage-report.mjs'

const compareBG = (a, b) => a.localeCompare(b, 'bg')

// This maintenance queue uses address-bound premises, not just approved
// records carrying a neighborhood label. It never updates a catalogue row.
export function addressPriorityQueue(report, { neighborhood, category } = {}) {
  const areas = [...report.neighborhoods, ...report.additionalNamedAreas]
  const names = areas.map(area => area.name)
  const selected = neighborhood && coverageNeighborhood(neighborhood, names)
  if (neighborhood && !names.includes(selected)) throw Error('Unknown coverage neighborhood: ' + neighborhood)
  const byCategory = new Map(report.categories.map(c => [c.id, c.premisesWithBoundCoordinates]))
  if (category && !byCategory.has(category)) throw Error('Unknown discovery category: ' + category)

  const queue = areas.filter(area => !selected || selected === area.name)
    .flatMap(area => area.cells.filter(cell => !cell.locatedTargetMet && (!category || category === cell.categoryId)).map(cell => {
      const bound = new Set(cell.locatedBusinessIds)
      const addressReviewIds = cell.businessIds.filter(id => !bound.has(id))
      return {
        neighborhood: area.name, scope: area.scope, categoryId: cell.categoryId,
        category: cell.category, premises: cell.count, verifiedAddresses: cell.locatedCount, verifiedGap: cell.locatedGap,
        addressReviewIds, neighborhoodVerifiedPremises: area.premisesWithBoundCoordinates,
        minimumNewPremises: Math.max(0, cell.locatedGap - addressReviewIds.length),
      }
    }))
  queue.sort((a, b) => a.verifiedAddresses - b.verifiedAddresses
    || Number(b.addressReviewIds.length > 0) - Number(a.addressReviewIds.length > 0)
    || a.neighborhoodVerifiedPremises - b.neighborhoodVerifiedPremises
    || byCategory.get(a.categoryId) - byCategory.get(b.categoryId)
    || compareBG(a.neighborhood, b.neighborhood) || compareBG(a.category, b.category))
  return queue.map((cell, index) => ({ rank: index + 1, ...cell }))
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { values } = parseArgs({ options: {
    'as-of': { type: 'string' }, target: { type: 'string' }, limit: { type: 'string' },
    neighborhood: { type: 'string' }, category: { type: 'string' },
  } })
  const date = values['as-of'], now = date ? Date.parse(`${date}T00:00:00.000Z`) : Date.now()
  const limit = Number(values.limit ?? 30)
  if (!Number.isInteger(limit) || limit < 1) throw Error('--limit must be a positive integer')
  if (!Number.isFinite(now) || date && new Date(now).toISOString().slice(0, 10) !== date) throw Error('--as-of must be a valid UTC day (YYYY-MM-DD)')
  const report = catalogueCoverageReport(undefined, { now, target: values.target == null ? undefined : Number(values.target) })
  const queue = addressPriorityQueue(report, values)
  console.log(JSON.stringify({
    checkedAt: report.checkedAt, target: report.targetPerCategoryPerNeighborhood,
    cellsBelowAddressTarget: queue.length,
    emptyAddressCells: queue.filter(cell => cell.verifiedAddresses === 0).length,
    addressGap: queue.reduce((sum, cell) => sum + cell.verifiedGap, 0),
    notes: 'Review IDs are existing unbound premises in that same cell, not yet verified. Minimum new premises assumes all existing candidates can be bound, not a guarantee or a new-business count.',
    queue: queue.slice(0, limit),
  }, null, 2))
}
