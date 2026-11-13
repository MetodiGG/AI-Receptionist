import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { SPECIFIC_SERVICE_PHOTO_IDS } from '../lib/specific-service-photo-ids.mjs'

const manifestUrl = new URL('../docs/specific-service-photo-generation-2026-11-12.json', import.meta.url)
const assetDirectory = new URL('../public/service-photos/', import.meta.url)
const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const sha256 = /^[a-f0-9]{64}$/

// Offline release evidence only. Source PNGs stay outside the repository; the
// reviewed source hash is bound to the exact optimized public asset hash.
// No network, arbitrary manifest paths, customer data or production writes.
export async function auditSpecificServicePhotoProvenance({
  ids = SPECIFIC_SERVICE_PHOTO_IDS, manifest,
  readAsset = id => readFile(new URL(`${id}-v1.webp`, assetDirectory)),
} = {}) {
  const issues = []
  const finish = checked => ({ complete: issues.length === 0, checked, issues })
  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !identifier.test(id))) {
    issues.push({ reason: 'invalid-photo-ids' }); return finish(0)
  }
  if (manifest === undefined) {
    try { manifest = JSON.parse(await readFile(manifestUrl, 'utf8')) }
    catch { issues.push({ reason: 'missing-or-invalid-generation-manifest' }); return finish(0) }
  }
  if (!manifest || manifest.generationTool !== 'built-in image_gen' || !Array.isArray(manifest.assets) || !Array.isArray(manifest.rejectedSources)) {
    issues.push({ reason: 'invalid-generation-manifest' }); return finish(0)
  }
  const required = new Set(ids.filter(id => id.startsWith('sx-')))
  const rejected = new Set()
  for (const source of manifest.rejectedSources) {
    if (!sha256.test(source?.sourceSha256 || '')) issues.push({ reason: 'invalid-rejected-source-hash' })
    else rejected.add(source.sourceSha256)
  }
  const assets = new Map()
  for (const asset of manifest.assets) {
    if (!required.has(asset?.id)) { issues.push({ id: asset?.id, reason: 'unreferenced-generation-record' }); continue }
    if (assets.has(asset.id)) { issues.push({ id: asset.id, reason: 'duplicate-generation-record' }); continue }
    assets.set(asset.id, asset)
  }
  let checked = 0
  for (const id of required) {
    const asset = assets.get(id)
    if (!asset) { issues.push({ id, reason: 'missing-generation-record' }); continue }
    if (!sha256.test(asset.sha256 || '') || !sha256.test(asset.sourceSha256 || '') ||
        !/^exec-[a-f0-9-]+\.png$/.test(asset.sourceFile || '') ||
        typeof asset.prompt !== 'string' || asset.prompt.length < 40 || typeof asset.label !== 'string' || !asset.label.trim()) {
      issues.push({ id, reason: 'incomplete-generation-evidence' }); continue
    }
    if (rejected.has(asset.sourceSha256)) { issues.push({ id, reason: 'rejected-source-is-referenced' }); continue }
    const review = asset.review
    if (review?.status !== 'accepted' || review.finalLayoutApproved !== true || review.sourceSha256 !== asset.sourceSha256 ||
        !Array.isArray(review.reviewers) || !review.reviewers.length || review.reviewers.some(value => typeof value !== 'string' || !value.trim()) ||
        typeof review.method !== 'string' || !review.method.trim()) {
      issues.push({ id, reason: 'missing-source-bound-visual-review' }); continue
    }
    try {
      const bytes = await readAsset(id)
      if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) {
        issues.push({ id, reason: 'public-asset-hash-mismatch' }); continue
      }
      checked++
    } catch { issues.push({ id, reason: 'public-asset-unreadable' }) }
  }
  return finish(checked)
}
