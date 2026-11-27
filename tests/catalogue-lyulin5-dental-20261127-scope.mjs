import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-lyulin5-dental-20261127.json' with { type: 'json' }

const { allowsFileChange, allowsNewFile, allowsPath, priorSource, priorCatalogue } =
  exactCatalogueIntakeScope(receipt, 'Verified Lyulin 5 intake')
export {
  allowsFileChange as lyulin5DentalAllowsFileChange,
  allowsNewFile as lyulin5DentalAllowsNewFile,
  allowsPath as lyulin5DentalAllowsPath,
  priorSource as lyulin5DentalPriorSource,
}

const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const points = new Map(receipt.rebound.map(point => [point.id, point]))
const hash = /^[a-f0-9]{64}$/u
if (points.size !== 3 || [...points.values()].some(({ before, after }) => !hash.test(before) || !hash.test(after) || before === after)) {
  throw Error('Invalid dental coordinate-only receipts')
}

export function lyulin5DentalPriorCatalogue(rows) {
  const seen = new Set()
  return priorCatalogue(rows).map(row => {
    const point = points.get(row?.id)
    if (!point) return row
    if (seen.has(row.id)) throw Error('Duplicate reviewed dental branch: ' + row.id)
    seen.add(row.id)
    const actual = digest(row)
    if (actual === point.before) return row
    if (actual !== point.after) throw Error('Unreviewed dental branch: ' + row.id)
    const before = { ...row, coordinates: null }
    if (digest(before) !== point.before) throw Error('Cannot restore the original dental branch: ' + row.id)
    return before
  })
}
