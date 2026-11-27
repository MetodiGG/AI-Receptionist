import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-verified-owner-civic-points-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: lateOwnerPointsAllowsFileChange, allowsNewFile: lateOwnerPointsAllowsNewFile,
  allowsPath: lateOwnerPointsAllowsPath, priorSource: lateOwnerPointsPriorSource,
} = exactCatalogueIntakeScope({ ...receipt, records: [] }, 'Verified owner and civic points')

const sha = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const digest = /^[a-f0-9]{64}$/u
const records = new Map(receipt.records.map(row => [row.id, row]))
if (records.size !== receipt.records.length) throw Error('Duplicate owner/civic coordinates in receipt')
for (const { id, before, after, previous } of receipt.records) {
  if (!digest.test(before) || !digest.test(after) || before === after || !previous || previous.coordinates !== null ||
      !Object.keys(previous).every(key => key === 'coordinates' || key === 'neighborhood' && previous.neighborhood === null)) {
    throw Error('Invalid owner/civic coordinates receipt: ' + id)
  }
}

// No additions or deletions. Restore only the reviewed location fields on
// each exact successor row, then verify the entire predecessor identity.
export function lateOwnerPointsPriorCatalogue(rows) {
  const seen = new Set()
  return rows.map(row => {
    const approved = records.get(row?.id)
    if (!approved) return row
    if (seen.has(row.id)) throw Error('Duplicate owner/civic coordinate record: ' + row.id)
    seen.add(row.id)
    const current = sha(row)
    if (current === approved.before) return row
    if (current !== approved.after) throw Error('Unreviewed owner/civic coordinate record: ' + row.id)
    const previous = { ...row, ...approved.previous }
    if (sha(previous) !== approved.before) throw Error('Owner/civic points cannot restore exact prior record: ' + row.id)
    return previous
  })
}
