import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-aura-b19-growth-20261127.json' with { type: 'json' }
import { arhollPriceAllowsFileChange, arhollPriceAllowsNewFile, arhollPricePriorCatalogue,
  arhollPricePriorSource } from './catalogue-arholl-reformer-price-refresh-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource, priorCatalogue } =
  exactCatalogueIntakeScope(receipt, 'Verified Aura B19 growth')

export const auraGrowthAllowsFileChange = path => allowsFileChange(path) || arhollPriceAllowsFileChange(path)
export const auraGrowthAllowsNewFile = path => allowsNewFile(path) || arhollPriceAllowsNewFile(path)
export const auraGrowthAllowsPath = path => auraGrowthAllowsFileChange(path) || auraGrowthAllowsNewFile(path)
export const auraGrowthPriorSource = (path, source) => priorSource(path, arhollPricePriorSource(path, source))

const sha = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const digest = /^[a-f0-9]{64}$/u
const rebindings = new Map(receipt.rebindings.map(item => [item.id, item]))
if (rebindings.size !== receipt.rebindings.length) throw Error('Duplicate Aura B19 growth location receipt')
for (const { id, before, after } of rebindings.values()) {
  if (id !== 'sofia-bo-bella-grooming' || !digest.test(before) || !digest.test(after) || before === after) {
    throw Error('Invalid Aura B19 growth location receipt: ' + id)
  }
}

// An earlier test may already have the old row. Restore only the exact new
// coordinates for the pinned existing branch, and never forgive other edits.
export function auraGrowthPriorCatalogue(rows) {
  const seen = new Set()
  return priorCatalogue(arhollPricePriorCatalogue(rows)).map(row => {
    const approval = rebindings.get(row?.id)
    if (!approval) return row
    if (seen.has(row.id)) throw Error('Duplicate Aura B19 growth location record: ' + row.id)
    seen.add(row.id)
    const current = sha(row)
    if (current === approval.before) return row
    if (current !== approval.after) throw Error('Unreviewed Aura B19 growth location record: ' + row.id)
    const previous = { ...row, coordinates: null }
    if (sha(previous) !== approval.before) throw Error('Cannot restore exact Aura B19 growth location record: ' + row.id)
    return previous
  })
}
