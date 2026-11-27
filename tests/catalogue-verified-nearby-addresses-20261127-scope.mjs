import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-verified-nearby-addresses-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: nearbyAddressReviewAllowsFileChange, allowsNewFile: nearbyAddressReviewAllowsNewFile,
  allowsPath: nearbyAddressReviewAllowsPath, priorSource: nearbyAddressReviewPriorSource,
} = exactCatalogueIntakeScope({ ...receipt, records: [] }, 'Verified nearby address review')

const sha = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const digest = /^[a-f0-9]{64}$/u
const allowedFields = new Set(['address', 'neighborhood', 'coordinates'])
const records = new Map(receipt.records.map(item => [item.id, item]))
if (records.size !== receipt.records.length) throw Error('Duplicate verified nearby address in receipt')
for (const { id, before, after, previous } of receipt.records) {
  if (!digest.test(before) || !digest.test(after) || before === after ||
      !previous || Object.getPrototypeOf(previous) !== Object.prototype ||
      !Object.keys(previous).length || !Object.keys(previous).every(key => allowedFields.has(key))) {
    throw Error('Invalid verified nearby address receipt: ' + id)
  }
}

// Restore the complete earlier row without dropping it from any snapshot.
// A subsequent edit to the same ID is not grandfathered by this receipt.
export function nearbyAddressReviewPriorCatalogue(rows) {
  const seen = new Set()
  return rows.map(row => {
    const receiptRow = records.get(row?.id)
    if (!receiptRow) return row
    if (seen.has(row.id)) throw Error('Duplicate verified nearby address record: ' + row.id)
    seen.add(row.id)
    const current = sha(row)
    if (current === receiptRow.before) return row
    if (current !== receiptRow.after) throw Error('Unreviewed verified nearby address record: ' + row.id)
    const previous = { ...row, ...structuredClone(receiptRow.previous) }
    if (sha(previous) !== receiptRow.before) throw Error('Verified nearby address cannot restore exact prior record: ' + row.id)
    return previous
  })
}
