import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-aslan-sfdent-20261127.json' with { type: 'json' }

const here = exactCatalogueIntakeScope(receipt, 'Verified Aslan intake')
export const { allowsFileChange, allowsNewFile, priorSource } = here
const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const location = receipt.location

export function priorCatalogue(rows) {
  let seen = false
  return here.priorCatalogue(rows).map(row => {
    if (row.id !== location.id) return row
    if (seen) throw Error('Duplicate location-reviewed SF Dent profile')
    seen = true
    const actual = digest(row)
    if (actual === location.before) return row
    if (actual !== location.after) throw Error('Unreviewed SF Dent location or inventory')
    const original = { ...row, coordinates: null }
    if (digest(original) !== location.before) throw Error('Cannot restore SF Dent location')
    return original
  })
}
