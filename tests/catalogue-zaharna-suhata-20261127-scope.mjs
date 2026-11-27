import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-zaharna-suhata-20261127.json' with { type: 'json' }
import { allowsFileChange as nextChange, allowsNewFile as nextNew, priorCatalogue as nextPriorCatalogue,
  priorSource as nextPriorSource } from './catalogue-lozenets-west-north-20261127-scope.mjs'

const intake = exactCatalogueIntakeScope(receipt, 'Verified Zaharna Fabrika and Suhata Reka intake')
export const allowsFileChange = path => intake.allowsFileChange(path) || nextChange(path)
export const allowsNewFile = path => intake.allowsNewFile(path) || nextNew(path)
export const priorSource = (path, source) => intake.priorSource(path, nextPriorSource(path, source))
const corrections = new Map(receipt.corrections.map(entry => [entry.id, entry]))
const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')

export function priorCatalogue(rows) {
  const seen = new Set()
  return intake.priorCatalogue(nextPriorCatalogue(rows)).map(row => {
    const fix = corrections.get(row.id)
    if (!fix) return row
    if (seen.has(row.id)) throw new Error('Duplicate Sofia auto follow-up: ' + row.id)
    seen.add(row.id)
    const hash = digest(row)
    if (hash === fix.before) return row
    if (hash !== fix.after) throw new Error('Unreviewed Sofia auto follow-up: ' + row.id)
    const original = { ...row, ...fix.original }
    if (digest(original) !== fix.before) throw new Error('Cannot restore Sofia auto follow-up: ' + row.id)
    return original
  })
}
