import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/catalogue-verified-lyulin-batch-20261127.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digests = /^[a-f0-9]{64}$/u
const records = new Map(receipt.records.map(row => [row.id, row.sha256]))
const baseline = new Map()

function matchesFile(path, expected) {
  if (!digests.test(expected ?? '')) return false
  try {
    const file = new URL('../' + path, import.meta.url), stat = lstatSync(file)
    return stat.isFile() && !(stat.mode & 0o111) && sha(readFileSync(file)) === expected
  } catch { return false }
}

export const verifiedLyulinBatchAllowsFileChange = path => Object.hasOwn(receipt.changed, path) && matchesFile(path, receipt.changed[path].after)
export const verifiedLyulinBatchAllowsNewFile = path => Object.hasOwn(receipt.added, path) && matchesFile(path, receipt.added[path])
export const verifiedLyulinBatchAllowsPath = path => verifiedLyulinBatchAllowsFileChange(path) || verifiedLyulinBatchAllowsNewFile(path)

export function verifiedLyulinBatchPriorSource(path, source) {
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path]
  if (!digests.test(before ?? '') || !digests.test(after ?? '') || sha(source) !== after) return source
  if (!baseline.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 5 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Verified Lyulin batch cannot restore pinned source: ' + path)
    baseline.set(path, original)
  }
  const original = baseline.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}

// Historical catalogue assertions may strip only the exact normalized rows.
// An edited row with one of their IDs must not disappear from an audit.
export function verifiedLyulinBatchPriorCatalogue(rows) {
  const seen = new Set()
  return rows.filter(row => {
    if (!records.has(row?.id)) return true
    if (seen.has(row.id)) throw Error('Duplicate verified Lyulin batch record: ' + row.id)
    seen.add(row.id)
    if (sha(JSON.stringify(row)) !== records.get(row.id)) throw Error('Unreviewed verified Lyulin batch record: ' + row.id)
    return false
  })
}
