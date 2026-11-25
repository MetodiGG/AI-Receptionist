import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import scope from './fixtures/pr81-location-only-approval.json' with {type:'json'}

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const cached = new Map()
const read = path => readFileSync(new URL('../'+path, import.meta.url))

// Later calendar copy only. Kept separate from the original location manifest;
// the historical scope suites use the exports below as a single entry point.
const calendarBase = 'f38b2192150f958304a6b8319ed4d2b7b14ebccd'
const calendarCopy = {
  'app/dashboard/share/page.js': {
    before: '06b3df3bdb738ea3aea112e95b9b354fae1e7ddc882122ee6203a0755761fb63',
    after: '2e1ebca1165fea744213fd0e218f348318477ecb4d0c58002cd0f44f43c07025',
  },
  'lib/faq.mjs': {
    before: '0ac94070272c6c9e342e6aac7c1a3b1dd190aaa88ef41a76d17f5f124d270a9e',
    after: 'f4d881edbbeaf9ba6ea9a85d217dbd00443159cbe7bc3ef205682a940bd4b187',
  },
}

export const calendarCopyPaths = Object.freeze(Object.keys(calendarCopy))

export function pr81LocationAllowsFileChange(path) {
  const receipt = Object.hasOwn(calendarCopy, path) ? calendarCopy[path] : Object.hasOwn(scope.changed, path) ? scope.changed[path] : null
  if (!receipt) return false
  try { return sha(read(path)) === receipt.after }
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
// Reconstruct only the exact pinned changes before older release fingerprints.
// No other tree entries or newer edits are exempted.
export function pr81LocationPriorSource(path, source) {
  const calendar = Object.hasOwn(calendarCopy, path)
  if (!calendar && !Object.hasOwn(scope.changed, path)) return source
  const {before,after} = calendar ? calendarCopy[path] : scope.changed[path], actual = sha(source)
  if (actual === before) return source
  if (actual !== after) throw Error((calendar ? 'Unreviewed calendar copy delta: ' : 'Unreviewed PR #81 address-only delta: ') + path)
  if (!cached.has(path)) {
    const baseline = execFileSync('git', ['show', (calendar ? calendarBase : scope.baseline)+':'+path], {cwd:root,maxBuffer:8*1024*1024})
    if (sha(baseline) !== before) throw Error('Pinned baseline mismatch: ' + path)
    cached.set(path,baseline)
  }
  return typeof source === 'string' ? cached.get(path).toString('utf8') : Buffer.from(cached.get(path))
}
