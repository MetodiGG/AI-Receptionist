import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/catalogue-expiry-20261126-approval.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()

function exactFile(path, hash) {
  try { return sha(readFileSync(new URL('../' + path, import.meta.url))) === hash }
  catch { return false }
}

export const catalogueExpiryAllowsFileChange = path => Object.hasOwn(receipt.changed, path)
  && exactFile(path, receipt.changed[path].after)
export const catalogueExpiryAllowsNewFile = path => Object.hasOwn(receipt.added, path)
  && exactFile(path, receipt.added[path])
export const catalogueExpiryMatchesPriorHash = (path, hash) => Boolean(hash
  && Object.hasOwn(receipt.changed, path)
  && receipt.changed[path].before === hash && catalogueExpiryAllowsFileChange(path))

// A future clone can restore the original main bytes even after a squash:
// the design phase never changes the eight existing paths in this receipt.
export function catalogueExpiryPriorSource(path, source) {
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path], digest = sha(source)
  if (digest === before) return source
  if (digest !== after) throw Error('Unreviewed 26 Nov catalogue expiry source delta: ' + path)
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Catalogue expiry baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : Buffer.from(prior.get(path))
}
