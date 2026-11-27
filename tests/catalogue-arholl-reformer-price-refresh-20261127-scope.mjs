import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-arholl-reformer-price-refresh-20261127.json' with { type: 'json' }
import { mtsIntakeAllowsFileChange, mtsIntakeAllowsNewFile, mtsIntakePriorCatalogue,
  mtsIntakePriorSource } from './catalogue-mts-krasna-polyana3-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource } =
  exactCatalogueIntakeScope(receipt, 'Verified Arholl Reformer price refresh')

export const arhollPriceAllowsFileChange = path => allowsFileChange(path) || mtsIntakeAllowsFileChange(path)
export const arhollPriceAllowsNewFile = path => allowsNewFile(path) || mtsIntakeAllowsNewFile(path)
export const arhollPriceAllowsPath = path => arhollPriceAllowsFileChange(path) || arhollPriceAllowsNewFile(path)
export const arhollPricePriorSource = (path, source) => priorSource(path, mtsIntakePriorSource(path, source))

const sha = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const digest = /^[a-f0-9]{64}$/u
const { id, before, after } = receipt.refresh
if (id !== 'sofia-arholl-arena-obelya1-124-reformer' || !digest.test(before) || !digest.test(after) || before === after || receipt.records.length) {
  throw Error('Invalid Arholl price refresh receipt')
}

// Historical tests check the frozen Nov 16 receipt against its exact predecessor,
// not a later tariff. Do not roll back an unreviewed edit to any other field.
export function arhollPricePriorCatalogue(rows) {
  let seen = false
  return mtsIntakePriorCatalogue(rows).map(row => {
    if (row?.id !== id) return row
    if (seen) throw Error('Duplicate Arholl price refresh record: ' + id)
    seen = true
    const current = sha(row)
    if (current === before) return row
    if (current !== after) throw Error('Unreviewed Arholl price refresh record: ' + id)
    const [service] = row.services
    const original = { ...row, services: [{ ...service, price: { ...service.price, amount: 20, checkedOn: '2026-11-16' } }] }
    if (sha(original) !== before) throw Error('Cannot restore exact Arholl price refresh record: ' + id)
    return original
  })
}
