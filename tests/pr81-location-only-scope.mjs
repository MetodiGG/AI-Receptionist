import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import scope from './fixtures/pr81-location-only-approval.json' with {type:'json'}

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const cached = new Map()
const read = path => readFileSync(new URL('../'+path, import.meta.url))

export function pr81LocationAllowsFileChange(path) {
  if (!Object.hasOwn(scope.changed, path)) return false
  try { return sha(read(path)) === scope.changed[path].after }
  catch { return false }
}
export function pr81LocationAllowsNewFile(path) {
  if (!Object.hasOwn(scope.added, path)) return false
  try { return sha(read(path)) === scope.added[path] }
  catch { return false }
}
export function pr81LocationMatchesPriorHash(path, hash) {
  return Boolean(hash && Object.hasOwn(scope.changed, path) &&
    scope.changed[path].before === hash && pr81LocationAllowsFileChange(path))
}
// Reconstruct only the exact address-only changes before older release
// fingerprints run. No other tree entries or newer edits are exempted.
export function pr81LocationPriorSource(path, source) {
  if (!Object.hasOwn(scope.changed, path)) return source
  const {before,after} = scope.changed[path], actual = sha(source)
  if (actual === before) return source
  if (actual !== after) throw Error('Unreviewed PR #81 address-only delta: ' + path)
  if (!cached.has(path)) {
    const baseline = execFileSync('git', ['show', scope.baseline+':'+path], {cwd:root,maxBuffer:8*1024*1024})
    if (sha(baseline) !== before) throw Error('PR #81 address-only baseline mismatch: ' + path)
    cached.set(path,baseline)
  }
  return typeof source === 'string' ? cached.get(path).toString('utf8') : Buffer.from(cached.get(path))
}
