import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/service-detail-photo-expansion-20261126-approval.json' with { type: 'json' }
import { detailPreviewPriorSource } from './public-detail-photo-preview-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = /^[a-f0-9]{64}$/u
const prior = new Map()
const changedPath = path => ['lib/service-detail-photo-presentation.mjs', 'lib/service-detail-photo-variants.mjs'].includes(path)
export const serviceDetailPhotoExpansionAddedPath = path => [
  'lib/service-detail-photo-expansion-20261126.json',
  'docs/service-detail-photo-beauty-20261126.json',
  'docs/service-detail-photo-auto-home-20261126.json',
  'docs/service-detail-photo-activity-education-20261126.json',
  'docs/service-detail-photo-specialties-20261126.json',
  'docs/service-detail-photo-expansion-20261126.md',
].includes(path) || /^public\/service-photos\/go-detail-[a-z0-9]+(?:-[a-z0-9]+)*-20261126-v2\.webp$/u.test(path)

function fileMatches(path, expected) {
  if (typeof expected !== 'string' || !digest.test(expected)) return false
  try {
    const file = new URL('../' + path, import.meta.url), mode = lstatSync(file)
    return mode.isFile() && !(mode.mode & 0o111) && sha(detailPreviewPriorSource(path, readFileSync(file))) === expected
  } catch { return false }
}

export const serviceDetailPhotoExpansionAllowsFileChange = path => changedPath(path) &&
  Object.hasOwn(receipt.changed, path) && fileMatches(path, receipt.changed[path].after)
export const serviceDetailPhotoExpansionAllowsNewFile = path => serviceDetailPhotoExpansionAddedPath(path) &&
  Object.hasOwn(receipt.added, path) && fileMatches(path, receipt.added[path])
export const serviceDetailPhotoExpansionAllowsPath = path => serviceDetailPhotoExpansionAllowsFileChange(path) ||
  serviceDetailPhotoExpansionAllowsNewFile(path)

// Model the older detail-photo layer from the exact reviewed expansion bytes,
// without treating later unlisted edits as part of either approval.
export function preServiceDetailPhotoExpansionSource(path, source) {
  source = detailPreviewPriorSource(path, source)
  if (!changedPath(path) || !Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path]
  if (typeof after !== 'string' || !digest.test(after) || sha(source) !== after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== before) throw Error('Service detail photo expansion baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : Buffer.from(prior.get(path))
}
