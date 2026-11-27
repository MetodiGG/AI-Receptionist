import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-north-dog-branch-point-20261127.json' with { type: 'json' }
import { yavorovAllowsFileChange, yavorovAllowsNewFile, yavorovPriorCatalogue,
  yavorovPriorSource } from './catalogue-yavorov-geo-milev-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource } = exactCatalogueIntakeScope(receipt, 'Verified North Dog branch point')
export const northDogAllowsFileChange = path => allowsFileChange(path) || yavorovAllowsFileChange(path)
export const northDogAllowsNewFile = path => allowsNewFile(path) || yavorovAllowsNewFile(path)
export const northDogAllowsPath = path => northDogAllowsFileChange(path) || northDogAllowsNewFile(path)
export const northDogPriorSource = (path, source) => priorSource(path, yavorovPriorSource(path, source))

const sha = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const location = receipt.location
const digest = /^[a-f0-9]{64}$/u
if (location.id !== 'sofia-north-dog-grooming-vrabnitsa637' || !digest.test(location.before) ||
    !digest.test(location.after) || location.before === location.after || receipt.records.length !== 0) {
  throw Error('Invalid North Dog branch point receipt')
}

// Freeze every other field as well: only the exact reviewed location can
// disappear from an earlier scope, never an unrelated edit or a new row.
export function northDogPriorCatalogue(rows) {
  let seen = false
  return yavorovPriorCatalogue(rows).map(row => {
    if (row?.id !== location.id) return row
    if (seen) throw Error('Duplicate North Dog branch point record: ' + row.id)
    seen = true
    const current = sha(row)
    if (current === location.before) return row
    if (current !== location.after) throw Error('Unreviewed North Dog branch point record: ' + row.id)
    const previous = { ...row, coordinates: null }
    if (sha(previous) !== location.before) throw Error('Cannot restore exact North Dog branch point record: ' + row.id)
    return previous
  })
}
