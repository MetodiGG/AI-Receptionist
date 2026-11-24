import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/sofia-location-image-integrity-20261124-approval.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = content => createHash('sha256').update(content).digest('hex')
const prior = new Map()
function exactFile(path, map, pick) {
  if (!Object.hasOwn(map, path)) return false
  try { return sha(readFileSync(new URL('../' + path, import.meta.url))) === pick(map[path]) }
  catch { return false }
}
export const sofiaIntegrityAllowsFileChange = path => exactFile(path, receipt.changed, value => value.after)
export const sofiaIntegrityAllowsNewFile = path => exactFile(path, receipt.added, value => value)
export const sofiaIntegrityMatchesPriorHash = (path, hash) => Boolean(hash && receipt.changed[path]?.before === hash && sofiaIntegrityAllowsFileChange(path))

// Replay the reviewed baseline before each older phase's own literal inverse.
// Every later byte must be pinned; unrelated changes are never hidden and an
// in-scope file with append-only tampering cannot be canonicalized.
export function sofiaIntegrityPriorSource(path, source) {
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path], digest = sha(source)
  if (digest === before) return source
  if (digest !== after) throw Error('Unreviewed 24 Nov Sofia location/image source delta: ' + path)
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Sofia location/image baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : prior.get(path)
}
