import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/catalogue-mopart-20261127-approval.json' with { type: 'json' }
import { verifiedLyulinBatchAllowsFileChange, verifiedLyulinBatchAllowsNewFile, verifiedLyulinBatchPriorCatalogue, verifiedLyulinBatchPriorSource } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import { crossQuarterAllowsFileChange, crossQuarterAllowsNewFile, crossQuarterPriorCatalogue, crossQuarterPriorSource } from './catalogue-verified-sofia-cross-quarter-20261127-scope.mjs'
import { nearbyAddressReviewAllowsFileChange, nearbyAddressReviewAllowsNewFile, nearbyAddressReviewPriorCatalogue, nearbyAddressReviewPriorSource } from './catalogue-verified-nearby-addresses-20261127-scope.mjs'
import { appointmentGrowthAllowsFileChange, appointmentGrowthAllowsNewFile, appointmentGrowthPriorCatalogue, appointmentGrowthPriorSource } from './catalogue-verified-sofia-appointment-growth-20261127-scope.mjs'
import { lateOwnerPointsAllowsFileChange, lateOwnerPointsAllowsNewFile } from './catalogue-verified-owner-civic-points-20261127-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const frozen = new Map()

function exactFile(path, expected) {
  if (!expected) return false
  try {
    const file = new URL('../' + path, import.meta.url), info = lstatSync(file)
    return info.isFile() && !(info.mode & 0o111) && sha256(readFileSync(file)) === expected
  } catch { return false }
}

export const mopartIntakeAllowsFileChange = path => Object.hasOwn(receipt.changed, path) && exactFile(path, receipt.changed[path].after)
export const mopartIntakeAllowsNewFile = path => Object.hasOwn(receipt.added, path) && exactFile(path, receipt.added[path])
export const mopartIntakeAllowsPath = path => mopartIntakeAllowsFileChange(path) || mopartIntakeAllowsNewFile(path)

// Expose the preceding state to historical guards only after matching the
// reviewed entire file; a wider edit must remain visible to those guards.
export function mopartIntakePriorSource(path, source) {
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path]
  if (sha256(source) !== after) return source
  if (!frozen.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 5 * 1024 * 1024 })
    if (sha256(original) !== before) throw Error('Mopart cannot restore pinned source: ' + path)
    frozen.set(path, original)
  }
  const original = frozen.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}

export function mopartIntakePriorCatalogue(rows) {
  let seen = false
  return rows.filter(row => {
    if (row?.id !== receipt.record.id) return true
    if (seen) throw Error('Duplicate Mopart record: ' + row.id)
    if (sha256(JSON.stringify(row)) !== receipt.record.sha256) throw Error('Unreviewed Mopart record: ' + row.id)
    seen = true
    return false
  })
}

// Historical consumers unwind the most recent exact receipt first; the
// individual checks above still recognize only the original Mopart bytes.
export const catalogueIntakeAllowsFileChange = path => lateOwnerPointsAllowsFileChange(path) || appointmentGrowthAllowsFileChange(path) || nearbyAddressReviewAllowsFileChange(path) || crossQuarterAllowsFileChange(path) || verifiedLyulinBatchAllowsFileChange(path) || mopartIntakeAllowsFileChange(path)
export const catalogueIntakeAllowsNewFile = path => lateOwnerPointsAllowsNewFile(path) || appointmentGrowthAllowsNewFile(path) || nearbyAddressReviewAllowsNewFile(path) || crossQuarterAllowsNewFile(path) || verifiedLyulinBatchAllowsNewFile(path) || mopartIntakeAllowsNewFile(path)
export const catalogueIntakeAllowsPath = path => catalogueIntakeAllowsFileChange(path) || catalogueIntakeAllowsNewFile(path)
export const catalogueIntakePriorSource = (path, source) => mopartIntakePriorSource(path,
  verifiedLyulinBatchPriorSource(path, crossQuarterPriorSource(path, nearbyAddressReviewPriorSource(path, appointmentGrowthPriorSource(path, source)))))
export const catalogueIntakePriorCatalogue = rows => mopartIntakePriorCatalogue(
  verifiedLyulinBatchPriorCatalogue(crossQuarterPriorCatalogue(nearbyAddressReviewPriorCatalogue(appointmentGrowthPriorCatalogue(rows)))))
