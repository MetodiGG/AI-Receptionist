import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-kriva-reka-darvenitsa-20261127.json' with { type: 'json' }
import { allowsFileChange as nextChange, allowsNewFile as nextNew,
  priorSource as nextPriorSource, priorCatalogue as nextPriorCatalogue } from './catalogue-orlyak-banishora-20261127-scope.mjs'

const scope = exactCatalogueIntakeScope(receipt, 'Verified Kriva Reka and Darvenitsa intake')
export const allowsFileChange = path => scope.allowsFileChange(path) || nextChange(path)
export const allowsNewFile = path => scope.allowsNewFile(path) || nextNew(path)
export const priorSource = (path, source) => scope.priorSource(path, nextPriorSource(path, source))
const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const proof = receipt.location

export function priorCatalogue(rows) {
  let seen = false
  return scope.priorCatalogue(nextPriorCatalogue(rows)).map(row => {
    if (row.id !== proof.id) return row
    if (seen) throw Error('Duplicate SAMA review record')
    seen = true
    const actual = digest(row)
    if (actual === proof.before) return row
    if (actual !== proof.after) throw Error('Unreviewed SAMA location')
    const original = { ...row, neighborhood: null }
    if (digest(original) !== proof.before) throw Error('Cannot restore SAMA location')
    return original
  })
}
