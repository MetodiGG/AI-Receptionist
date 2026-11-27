import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-levski-lyulin-20261127.json' with { type: 'json' }
import { allowsFileChange as nextChange, allowsNewFile as nextNew,
  priorSource as nextPriorSource, priorCatalogue as nextPriorCatalogue } from './catalogue-smirnenski-karadzha-mladost-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource, priorCatalogue } =
  exactCatalogueIntakeScope(receipt, 'Verified Levski and Lyulin intake')
export const levskiLyulinAllowsFileChange = path => allowsFileChange(path) || nextChange(path)
export const levskiLyulinAllowsNewFile = path => allowsNewFile(path) || nextNew(path)
export const levskiLyulinAllowsPath = path => levskiLyulinAllowsFileChange(path) || levskiLyulinAllowsNewFile(path)
export const levskiLyulinPriorSource = (path, source) => priorSource(path, nextPriorSource(path, source))

const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const points = new Map(receipt.rebound.map(point => [point.id, point]))
const hash = /^[a-f0-9]{64}$/u
if (points.size !== receipt.rebound.length || [...points.values()].some(p => !hash.test(p.before) || !hash.test(p.after) || p.before === p.after)) {
  throw Error('Invalid Lyulin coordinate-only receipts')
}

export function levskiLyulinPriorCatalogue(rows) {
  const seen = new Set()
  return priorCatalogue(nextPriorCatalogue(rows)).map(row => {
    const point = points.get(row?.id)
    if (!point) return row
    if (seen.has(point.id)) throw Error('Duplicate reviewed Lyulin branch: ' + point.id)
    seen.add(point.id)
    const actual = digest(row)
    if (actual === point.before) return row
    if (actual !== point.after) throw Error('Unreviewed Lyulin branch: ' + point.id)
    const before = { ...row, coordinates: null }
    if (digest(before) !== point.before) throw Error('Cannot restore original Lyulin branch: ' + point.id)
    return before
  })
}
