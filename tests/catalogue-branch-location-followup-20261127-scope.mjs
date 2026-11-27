import { createHash } from 'node:crypto'
import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-branch-location-followup-20261127.json' with { type: 'json' }
import { garage46AllowsFileChange, garage46AllowsNewFile, garage46AllowsPath, garage46PriorCatalogue, garage46PriorSource } from './catalogue-garage46-serdika-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource } =
  exactCatalogueIntakeScope({ ...receipt, records: [] }, 'Sofia branch location follow-up')
export const branchLocationFollowupAllowsFileChange = path => allowsFileChange(path) || garage46AllowsFileChange(path)
export const branchLocationFollowupAllowsNewFile = path => allowsNewFile(path) || garage46AllowsNewFile(path)
export const branchLocationFollowupAllowsPath = path => branchLocationFollowupAllowsFileChange(path) || branchLocationFollowupAllowsNewFile(path)
export const branchLocationFollowupPriorSource = (path, source) => priorSource(path, garage46PriorSource(path, source))

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
  return garage46PriorCatalogue(rows).map(row => {
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
