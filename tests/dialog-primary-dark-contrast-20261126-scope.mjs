import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/dialog-primary-dark-contrast-20261126-approval.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const reviewedPath = path => path === 'app/dark-mode.css' && path === receipt.path && /^[a-f0-9]{64}$/u.test(receipt.after ?? '')
let prior

export function dialogPrimaryDarkContrastAllowsFileChange(path) {
  if (!reviewedPath(path)) return false
  try {
    const file = new URL('../' + path, import.meta.url), mode = lstatSync(file)
    return mode.isFile() && !(mode.mode & 0o111) && sha(readFileSync(file)) === receipt.after
  } catch { return false }
}

// The older guards may replay the exact one-selector patch, never a broader
// unreviewed rewrite or a tampered file with mixed follow-up changes.
export function preDialogPrimaryDarkContrastSource(path, source) {
  if (!reviewedPath(path) || sha(source) !== receipt.after) return source
  if (!prior) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== receipt.before) throw Error('Dark booking contrast baseline does not match pinned source: ' + path)
    prior = original
  }
  return typeof source === 'string' ? prior.toString('utf8') : Buffer.from(prior)
}
