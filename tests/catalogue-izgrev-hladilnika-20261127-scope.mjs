import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-izgrev-hladilnika-20261127.json' with { type:'json' }

const scope = exactCatalogueIntakeScope(receipt,'Verified Izgrev and Hladilnika intake')
export const { allowsFileChange, allowsNewFile, priorSource } = scope
const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const reviewed = new Map(receipt.locations.map(row => [row.id,row]))
const sha = /^[0-9a-f]{64}$/u
if (reviewed.size!==receipt.locations.length || receipt.locations.some(r=>!sha.test(r.before)||!sha.test(r.after)||r.before===r.after)) {
  throw Error('Invalid reviewed location receipts')
}
export function priorCatalogue(rows) {
  const seen = new Set()
  return scope.priorCatalogue(rows).map(row => {
    const proof = reviewed.get(row?.id)
    if (!proof) return row
    if (seen.has(row.id)) throw Error('Duplicate reviewed location: '+row.id)
    seen.add(row.id)
    const actual = digest(row)
    if (actual===proof.before) return row
    if (actual!==proof.after) throw Error('Unreviewed location: '+row.id)
    const original = { ...row, neighborhood:proof.oldNeighborhood,
      coordinates:proof.changedPoint ? null : row.coordinates }
    if (digest(original)!==proof.before) throw Error('Cannot restore reviewed location: '+row.id)
    return original
  })
}
