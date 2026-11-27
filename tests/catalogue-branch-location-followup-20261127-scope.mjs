import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-branch-location-followup-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: branchLocationFollowupAllowsFileChange,
  allowsNewFile: branchLocationFollowupAllowsNewFile,
  allowsPath: branchLocationFollowupAllowsPath,
  priorSource: branchLocationFollowupPriorSource,
} = exactCatalogueIntakeScope({ ...receipt, records: [] }, 'Sofia branch location follow-up')

const sha = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const digest = /^[a-f0-9]{64}$/u
const records = new Map(receipt.records.map(record => [record.id, record]))
if (records.size !== receipt.records.length) throw Error('Duplicate branch location follow-up receipt')
for (const { id, before, after, previous } of receipt.records) {
  const moved = id === 'sofia-clean-ride-autoservice'
  const fields = Object.keys(previous || {}).sort().join(',')
  if (!digest.test(before) || !digest.test(after) || before === after || previous?.coordinates !== null ||
      fields !== (moved ? 'address,coordinates,neighborhood' : 'coordinates') ||
      (moved && (!previous.address || !previous.neighborhood))) throw Error('Invalid branch location follow-up receipt: ' + id)
}

// Undo only each exact reviewed successor. The hashes cover every other fact
// too, so no unrelated row or modification can disappear in historical tests.
export function branchLocationFollowupPriorCatalogue(rows) {
  const seen = new Set()
  return rows.map(row => {
    const approved = records.get(row?.id)
    if (!approved) return row
    if (seen.has(row.id)) throw Error('Duplicate branch location follow-up record: ' + row.id)
    seen.add(row.id)
    const current = sha(row)
    if (current === approved.before) return row
    if (current !== approved.after) throw Error('Unreviewed branch location follow-up record: ' + row.id)
    const previous = { ...row, ...approved.previous }
    if (sha(previous) !== approved.before) throw Error('Cannot restore exact prior branch location: ' + row.id)
    return previous
  })
}
