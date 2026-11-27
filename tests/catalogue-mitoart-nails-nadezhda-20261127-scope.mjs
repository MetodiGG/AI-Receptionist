import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-mitoart-nails-nadezhda-20261127.json' with { type: 'json' }

const scope = exactCatalogueIntakeScope(receipt, 'Verified MitoArt and Sofia location update')
export const { allowsFileChange, allowsNewFile, priorSource } = scope
const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const updates = new Map(receipt.updates.map(update => [update.id, update]))

export function priorCatalogue(rows) {
  const seen = new Set()
  return scope.priorCatalogue(rows).map(row => {
    const update = updates.get(row.id)
    if (!update) return row
    if (seen.has(row.id)) throw new Error('Duplicate reviewed catalogue update: ' + row.id)
    seen.add(row.id)
    const actual = digest(row)
    if (actual === update.before) return row
    if (actual !== update.after) throw new Error('Unreviewed catalogue update: ' + row.id)
    const original = { ...row, ...update.original }
    if (digest(original) !== update.before) throw new Error('Cannot restore catalogue update: ' + row.id)
    return original
  })
}
