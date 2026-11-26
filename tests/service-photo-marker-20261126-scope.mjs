import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/service-photo-marker-20261126-approval.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()
const markerPath = path => ['app/service-thumbnail.css', 'components/service-thumbnail.js'].includes(path)
const review = path => markerPath(path) && Object.hasOwn(receipt.changed, path) &&
  /^[a-f0-9]{64}$/u.test(receipt.changed[path].after ?? '') ? receipt.changed[path] : null

export function servicePhotoMarkerAllowsFileChange(path) {
  const entry = review(path)
  if (!entry) return false
  try {
    const file = new URL('../' + path, import.meta.url), mode = lstatSync(file)
    return mode.isFile() && !(mode.mode & 0o111) && sha(readFileSync(file)) === entry.after
  } catch { return false }
}

// Invert only the two exact marker edits. Unreviewed or tampered source is
// deliberately passed through to the earlier scope's original enforcement.
export function preServicePhotoMarkerSource(path, source) {
  const entry = review(path)
  if (!entry || sha(source) !== entry.after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== entry.before) throw Error('Service photo marker baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : Buffer.from(prior.get(path))
}
