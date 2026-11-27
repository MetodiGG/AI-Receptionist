import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/catalogue-verified-lyulin-batch-20261127.json' with { type: 'json' }
import { providerRolePhotosPriorSource } from './provider-role-photo-scope.mjs'
import { businessOnboardingSofiaPriorSource } from './business-onboarding-sofia-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digests = /^[a-f0-9]{64}$/u

function matchesFile(path, expected) {
  if (!digests.test(expected ?? '')) return false
  try {
    const file = new URL('../' + path, import.meta.url), stat = lstatSync(file)
    return stat.isFile() && !(stat.mode & 0o111) && sha(providerRolePhotosPriorSource(path, businessOnboardingSofiaPriorSource(path, readFileSync(file)))) === expected
  } catch { return false }
}

// Test-only helper for exact, independently reviewed and additive intakes.
// File and row hashes never excuse changes they did not specifically seal.
export function exactCatalogueIntakeScope(receipt, label) {
  const records = new Map(receipt.records.map(row => [row.id, row.sha256]))
  const baseline = new Map()
  const recordLabel = label.charAt(0).toLowerCase() + label.slice(1)
  const allowsFileChange = path => Object.hasOwn(receipt.changed, path) && matchesFile(path, receipt.changed[path].after)
  const allowsNewFile = path => Object.hasOwn(receipt.added, path) && matchesFile(path, receipt.added[path])
  const allowsPath = path => allowsFileChange(path) || allowsNewFile(path)
  function priorSource(path, source) {
    source = businessOnboardingSofiaPriorSource(path, source)
    source = providerRolePhotosPriorSource(path, source)
    if (!Object.hasOwn(receipt.changed, path)) return source
    const { before, after } = receipt.changed[path]
    if (!digests.test(before ?? '') || !digests.test(after ?? '') || sha(source) !== after) return source
    if (!baseline.has(path)) {
      const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 5 * 1024 * 1024 })
      if (sha(original) !== before) throw Error(label + ' cannot restore pinned source: ' + path)
      baseline.set(path, original)
    }
    const original = baseline.get(path)
    return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
  }
  function priorCatalogue(rows) {
    const seen = new Set()
    return rows.filter(row => {
      if (!records.has(row?.id)) return true
      if (seen.has(row.id)) throw Error('Duplicate ' + recordLabel + ' record: ' + row.id)
      seen.add(row.id)
      if (sha(JSON.stringify(row)) !== records.get(row.id)) throw Error('Unreviewed ' + recordLabel + ' record: ' + row.id)
      return false
    })
  }
  return { allowsFileChange, allowsNewFile, allowsPath, priorSource, priorCatalogue }
}

export const {
  allowsFileChange: verifiedLyulinBatchAllowsFileChange, allowsNewFile: verifiedLyulinBatchAllowsNewFile,
  allowsPath: verifiedLyulinBatchAllowsPath, priorSource: verifiedLyulinBatchPriorSource,
  priorCatalogue: verifiedLyulinBatchPriorCatalogue,
} = exactCatalogueIntakeScope(receipt, 'Verified Lyulin batch')
