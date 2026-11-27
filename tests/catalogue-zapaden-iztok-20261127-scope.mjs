import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-zapaden-iztok-20261127.json' with { type: 'json' }
import { allowsFileChange as nextChange, allowsNewFile as nextNew, priorCatalogue as nextPriorCatalogue,
  priorSource as nextPriorSource } from './catalogue-mitoart-nails-nadezhda-20261127-scope.mjs'

const scope = exactCatalogueIntakeScope(receipt, 'Verified Zapaden Park and Iztok intake')
export const allowsFileChange = path => scope.allowsFileChange(path) || nextChange(path)
export const allowsNewFile = path => scope.allowsNewFile(path) || nextNew(path)
export const priorSource = (path, source) => scope.priorSource(path, nextPriorSource(path, source))
const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const updates = new Map(receipt.updates.map(update => [update.id, update]))

export function priorCatalogue(rows) {
  const seen = new Set()
  return scope.priorCatalogue(nextPriorCatalogue(rows)).map(row => {
    const fix = updates.get(row.id)
    if (!fix) return row
    if (seen.has(row.id)) throw new Error('Duplicate intake update: ' + row.id)
    seen.add(row.id)
    const actual = digest(row)
    if (actual === fix.before) return row
    if (actual !== fix.after) throw new Error('Unreviewed intake update: ' + row.id)
    const original = { ...row, ...fix.original }
    if (digest(original) !== fix.before) throw new Error('Cannot restore intake update: ' + row.id)
    return original
  })
}
