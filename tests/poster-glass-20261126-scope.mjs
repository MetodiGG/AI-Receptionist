import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/poster-glass-20261126-approval.json' with { type: 'json' }
import { posterPolishPriorSource } from './poster-polish-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()

export function posterGlassAllowsFileChange(path) {
  if (!Object.hasOwn(receipt.changed, path)) return false
  try { return sha(posterPolishPriorSource(path, readFileSync(new URL('../' + path, import.meta.url)))) === receipt.changed[path].after }
  catch { return false }
}

export function posterGlassMatchesPriorHash(path, hash) {
  return Boolean(hash && Object.hasOwn(receipt.changed, path)
    && receipt.changed[path].before === hash && posterGlassAllowsFileChange(path))
}

// Replay the pre-redesign production bytes only for the exact reviewed patch.
export function posterGlassPriorSource(path, source) {
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path], digest = sha(source)
  if (digest === before) return source
  if (digest !== after) throw Error('Unreviewed 26 Nov poster/glass source delta: ' + path)
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Poster/glass baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : Buffer.from(prior.get(path))
}
