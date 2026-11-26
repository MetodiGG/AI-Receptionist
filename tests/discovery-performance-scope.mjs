import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/discovery-performance-approval.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()

function currentHash(path, digest) {
  if (!digest) return false
  try {
    const file = new URL('../' + path, import.meta.url), stat = lstatSync(file)
    return stat.isFile() && !(stat.mode & 0o111) && sha(readFileSync(file)) === digest
  } catch { return false }
}

export const discoveryPerformanceAllowsFileChange = path => currentHash(path, receipt.changed[path]?.after)
export const discoveryPerformanceAllowsNewFile = path => currentHash(path, receipt.added[path])
export const discoveryPerformanceAllowsPath = path => discoveryPerformanceAllowsFileChange(path) || discoveryPerformanceAllowsNewFile(path)

// Keep previous approvals enforceable. Only revert a reviewed whole-file
// performance delta under historical tests; unreviewed bytes stay visible.
export function discoveryPerformancePriorSource(path, source) {
  const change = receipt.changed[path] ?? receipt.adapters[path]
  if (!change || sha(source) !== change.after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== change.before) throw Error('Performance baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  const original = prior.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}
