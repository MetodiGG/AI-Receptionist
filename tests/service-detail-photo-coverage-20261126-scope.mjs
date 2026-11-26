import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/service-detail-photo-coverage-20261126-approval.json' with { type: 'json' }
import { preServicePhotoMarkerSource } from './service-photo-marker-20261126-scope.mjs'
import { preServiceDetailPhotoExpansionSource } from './service-detail-photo-expansion-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = /^[a-f0-9]{64}$/u
const prior = new Map()
export const serviceDetailPhotoChangedPath = path => path === 'components/service-thumbnail.js'
export const serviceDetailPhotoAddedPath = path => [
  'lib/service-detail-photo-presentation.mjs',
  'lib/service-detail-photo-variants.mjs',
  'scripts/audit-detail-service-photos.mjs',
].includes(path) || /^public\/service-photos\/go-detail-[a-z0-9-]+-20261126-v1\.webp$/u.test(path) ||
  /^docs\/(?:review\/)?service-detail-photo-[a-z0-9-]+-20261126\.(?:json|md)$/u.test(path)

function fileMatches(path, hash) {
  if (typeof hash !== 'string' || !digest.test(hash)) return false
  try {
    const url = new URL('../' + path, import.meta.url)
    const mode = lstatSync(url)
    const source = preServiceDetailPhotoExpansionSource(path, readFileSync(url))
    return mode.isFile() && !(mode.mode & 0o111) && sha(preServicePhotoMarkerSource(path, source)) === hash
  } catch { return false }
}

export const serviceDetailPhotoCoverageAllowsFileChange = path => serviceDetailPhotoChangedPath(path) &&
  Object.hasOwn(receipt.changed, path) && fileMatches(path, receipt.changed[path].after)
export const serviceDetailPhotoCoverageAllowsNewFile = path => serviceDetailPhotoAddedPath(path) &&
  Object.hasOwn(receipt.added, path) && fileMatches(path, receipt.added[path])
export const serviceDetailPhotoCoverageAllowsPath = path => serviceDetailPhotoCoverageAllowsFileChange(path) ||
  serviceDetailPhotoCoverageAllowsNewFile(path)

// Restore the previous tree only for precisely reviewed bytes; forward
// changes and unlisted paths must still be detected by the older receipts.
export function preServiceDetailPhotoCoverageSource(path, source) {
  if (!serviceDetailPhotoChangedPath(path) || !Object.hasOwn(receipt.changed, path)) return source
  source = preServicePhotoMarkerSource(path, source)
  const { before, after } = receipt.changed[path]
  if (typeof after !== 'string' || !digest.test(after) || sha(source) !== after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== before) throw Error('Service detail photo baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : Buffer.from(prior.get(path))
}
