import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/discovery-static-webp-cache-cpu-approval.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()

export function staticWebpCacheCpuAllowsFileChange(path) {
  if (!Object.hasOwn(receipt.changed, path)) return false
  try {
    const file = new URL('../' + path, import.meta.url)
    const stat = lstatSync(file)
    return stat.isFile() && !(stat.mode & 0o111) && sha(readFileSync(file)) === receipt.changed[path].after
  } catch { return false }
}

// Replay only the pinned bytes of this release for older approvals. Paths
// outside this receipt and any unreviewed edit remain unchanged inputs.
export function staticWebpCacheCpuPriorSource(path, source) {
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path]
  if (sha(source) !== after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== before) throw Error('Static WebP and catalogue CPU baseline checksum mismatch: ' + path)
    prior.set(path, original)
  }
  const original = prior.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}
