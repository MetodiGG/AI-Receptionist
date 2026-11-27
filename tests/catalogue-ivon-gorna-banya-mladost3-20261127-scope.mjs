import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-ivon-gorna-banya-mladost3-20261127.json' with { type: 'json' }
import { nadezhdaAllowsFileChange, nadezhdaAllowsNewFile,
  nadezhdaPriorCatalogue, nadezhdaPriorSource } from './catalogue-nadezhda-fitness-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource, priorCatalogue } =
  exactCatalogueIntakeScope(receipt, 'Verified IVON Gorna Banya intake')

export const ivonAllowsFileChange = path => allowsFileChange(path) || nadezhdaAllowsFileChange(path)
export const ivonAllowsNewFile = path => allowsNewFile(path) || nadezhdaAllowsNewFile(path)
export const ivonAllowsPath = path => ivonAllowsFileChange(path) || ivonAllowsNewFile(path)
export const ivonPriorSource = (path, source) => priorSource(path, nadezhdaPriorSource(path, source))

const digest = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const point = receipt.rebound
const hash = /^[a-f0-9]{64}$/u
if (point.id !== 'sofia-neli-slavova-mladost-3' || !hash.test(point.before) || !hash.test(point.after) || point.before === point.after) {
  throw Error('Invalid approved Neli Slavova coordinate-only receipt')
}

export function ivonPriorCatalogue(rows) {
  let seen = false
  return priorCatalogue(nadezhdaPriorCatalogue(rows)).map(row => {
    if (row?.id !== point.id) return row
    if (seen) throw Error('Duplicate reviewed Neli Slavova branch: ' + row.id)
    seen = true
    const actual = digest(row)
    if (actual === point.before) return row
    if (actual !== point.after) throw Error('Unreviewed Neli Slavova branch: ' + row.id)
    const before = { ...row, coordinates: null }
    if (digest(before) !== point.before) throw Error('Cannot restore exact Neli Slavova branch: ' + row.id)
    return before
  })
}
