import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-atues-visit-points-20261127.json' with { type: 'json' }

const here = exactCatalogueIntakeScope(receipt, 'Verified A Tu Estilo intake')
export const { allowsFileChange, allowsNewFile, priorSource } = here
const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const locations = new Map(receipt.locations.map(location=>[location.id,location]))

export function priorCatalogue(rows) {
  const seen = new Set()
  return here.priorCatalogue(rows).map(row => {
    const fix = locations.get(row.id)
    if (!fix) return row
    if (seen.has(row.id)) throw Error('Duplicate visit-point review: '+row.id)
    seen.add(row.id)
    const actual = digest(row)
    if (actual === fix.before) return row
    if (actual !== fix.after) throw Error('Unreviewed visit-point or inventory: '+row.id)
    const original = {...row,...fix.original}
    if (digest(original)!==fix.before) throw Error('Cannot restore reviewed location: '+row.id)
    return original
  })
}
