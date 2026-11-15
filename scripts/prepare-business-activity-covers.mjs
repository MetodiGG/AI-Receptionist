// Offline mechanical reuse only: no generation, retouching, network, customer
// data or catalogue edits. Derive only the primary artwork actually selected
// by the current approved catalogue; never upscale small public thumbnails.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { BUSINESS_COVER_PHOTOS, BUSINESS_SPECIALTY_COVERS, businessActivityPhotoKey } from '../lib/business-cover-photo.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const { values } = parseArgs({ options: { 'source-dir': { type: 'string' }, apply: { type: 'boolean' }, 'as-of': { type: 'string' } } })
if (!values['source-dir']) throw Error('Provide the explicit directory of approved original PNGs')
const sourceDirectory = resolve(values['source-dir'])
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const now = values['as-of'] ? Date.parse(`${values['as-of']}T00:00:00Z`) : Date.now()
if (!Number.isFinite(now)) throw Error('Invalid as-of date')
const sourceName = /^exec-[a-f0-9-]+\.png$/u
const required = new Map()
for (const raw of SOFIA_CATALOGUE) {
  const business = approvedCatalogueRecord(raw, now)
  if (!business) continue
  const details = catalogueDetailsWithServicePhotos(business, now)
  const key = businessActivityPhotoKey({ ...business, details })
  if (!key) throw Error(`No approved activity illustration for ${business.id}`)
  required.set(key, (required.get(key) || 0) + 1)
}
const originalManifests = [
  'docs/service-photo-generation-2026-11-12.json',
  'docs/specific-service-photo-generation-2026-11-12.json',
  'docs/partner-service-photo-assets-2026-11-13.json',
]
const receipts = new Map()
for (const manifest of originalManifests) {
  const data = JSON.parse(await readFile(resolve(root, manifest), 'utf8'))
  for (const asset of data.assets || data.images || []) {
    const source = asset.provenance?.kind === 'generated' ? asset.provenance : asset
    if (!sourceName.test(source.sourceFile || '') || !/^[a-f0-9]{64}$/u.test(source.sourceSha256 || '')) continue
    receipts.set(asset.id, { sourceFile: source.sourceFile, sourceSha256: source.sourceSha256, manifest, publicSha256: asset.sha256 || null })
  }
}
const legacy = new Map(Object.entries({ ...BUSINESS_COVER_PHOTOS, ...BUSINESS_SPECIALTY_COVERS }).map(([category, id]) => [id, category]))
const candidates = (await readdir(sourceDirectory)).filter(file => sourceName.test(file)).sort()
const fingerprint = async bytes => {
  // Compare the same two-stage sampling path as the approved 256px asset.
  // Direct original→32 and original→256→32 use different reconstruction
  // kernels; that difference is not image content or compression evidence.
  const normalized = await sharp(bytes).rotate().resize(256, 256, { fit: 'cover', position: 'centre' }).removeAlpha().toColourspace('srgb').png().toBuffer()
  return sharp(normalized).resize(32, 32).raw().toBuffer()
}
const targets = new Map(), unresolved = [], indexedSources = []
for (const id of required.keys()) {
  if (legacy.has(id)) continue
  const bytes = await readFile(resolve(root, `public/service-photos/${id}-v1.webp`))
  const receipt = receipts.get(id)
  if (receipt && (!receipt.publicSha256 || receipt.publicSha256 === hash(bytes))) continue
  targets.set(id, { pixels: await fingerprint(bytes), hash: hash(bytes) })
}
if (targets.size) {
  let cursor = 0
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < candidates.length) {
      const file = candidates[cursor++]
      try {
        const path = resolve(sourceDirectory, file), metadata = await sharp(path).metadata()
        if (Math.min(metadata.width, metadata.height) < 720) continue
        indexedSources.push({ file, pixels: await fingerprint(path) })
      } catch { /* An unrelated/unreadable original is not a candidate. */ }
    }
  }))
  for (const [id, target] of targets) {
    let best = null, second = Infinity
    for (const candidate of indexedSources) {
      if (candidate.pixels.length !== target.pixels.length) continue
      let sum = 0
      for (let i = 0; i < target.pixels.length; i++) { const delta = target.pixels[i] - candidate.pixels[i]; sum += delta * delta }
      const mse = sum / target.pixels.length
      if (!best || mse < best.mse) { second = best?.mse ?? second; best = { file: candidate.file, mse } }
      else if (mse < second) second = mse
    }
    // Small WebP quantization differences are expected; a loose visual nearest
    // neighbour is NOT enough. Reject ambiguous or substantially changed crops.
    if (!best || best.mse > 16 || second < Math.max(best.mse * 8, best.mse + 25)) { unresolved.push({ id, best, secondMse: second }); continue }
    const sourceBytes = await readFile(resolve(sourceDirectory, best.file))
    receipts.set(id, { sourceFile: best.file, sourceSha256: hash(sourceBytes), publicSha256: target.hash,
      manifest: 'approved-existing-public-service-photo', recovery: { method: 'unique-32px-RGB-pixel-comparison', mse: best.mse, secondMse: second } })
  }
}
if (unresolved.length) {
  console.log(JSON.stringify({ requiredPhotos: required.size, missingSourceReceipts: unresolved }, null, 2))
  process.exitCode = 1
} else {
  const assets = [], existingCovers = [], outputDirectory = resolve(root, 'public/business-cover-photos')
  if (values.apply) await mkdir(outputDirectory, { recursive: true })
  for (const [id, businesses] of [...required].sort(([a], [b]) => a.localeCompare(b))) {
    if (legacy.has(id)) { existingCovers.push({ id, file: `public/business-cover-photos/${legacy.get(id)}-v1.webp`, businesses }); continue }
    const receipt = receipts.get(id), sourceBytes = await readFile(resolve(sourceDirectory, basename(receipt.sourceFile)))
    if (hash(sourceBytes) !== receipt.sourceSha256) throw Error(`Original source hash changed: ${id}`)
    const publicBytes = await readFile(resolve(root, `public/service-photos/${id}-v1.webp`))
    if (receipt.publicSha256 && hash(publicBytes) !== receipt.publicSha256) throw Error(`Approved service photo changed: ${id}`)
    const original = await sharp(sourceBytes).metadata()
    if (Math.min(original.width, original.height) < 720) throw Error(`Original would require upscaling: ${id}`)
    const buffer = await sharp(sourceBytes).rotate().resize(720, 720, { fit: 'cover', position: 'centre', withoutEnlargement: true }).webp({ quality: 76, effort: 5 }).toBuffer()
    const file = `public/business-cover-photos/activity-${id}-v1.webp`
    if (buffer.length > 150000) throw Error(`Activity cover exceeds the offline byte budget: ${id}`)
    if (values.apply) await writeFile(resolve(root, file), buffer)
    assets.push({ id, file, businesses, width: 720, height: 720, bytes: buffer.length, sha256: hash(buffer),
      approvedServicePhoto: `public/service-photos/${id}-v1.webp`, approvedServicePhotoSha256: hash(publicBytes),
      sourceFile: receipt.sourceFile, sourceSha256: receipt.sourceSha256,
      originalWidth: original.width, originalHeight: original.height,
      sourceCrop: { left: (original.width - Math.min(original.width, original.height)) / 2, top: (original.height - Math.min(original.width, original.height)) / 2,
        width: Math.min(original.width, original.height), height: Math.min(original.width, original.height) },
      transformation: 'Proportional centre crop/downscale from the approved original PNG; 720px WebP quality76; no enlargement or generative editing.',
      sourceReceipt: receipt.manifest, ...(receipt.recovery ? { sourceRecovery: receipt.recovery } : {}) })
  }
  const report = { preparedOn: new Date(now).toISOString().slice(0, 10), purpose: 'Activity-correct illustrative business covers; never actual business premises, staff or work.',
    generator: 'Existing owner-approved built-in image_gen artwork; mechanical derivatives only.',
    primaryBusinesses: [...required.values()].reduce((a, b) => a + b, 0), uniquePrimaryPhotos: required.size,
    assets, existingCovers, totalNewBytes: assets.reduce((sum, item) => sum + item.bytes, 0), unresolved: [] }
  if (values.apply) {
    await writeFile(resolve(root, 'docs/business-activity-cover-sources-2026-11-15.json'), JSON.stringify(report, null, 2) + '\n')
    await writeFile(resolve(root, 'lib/business-activity-cover-assets.mjs'), '// Generated mechanical derivatives of already approved service artwork.\n// Only compact photo IDs and intrinsic dimensions belong in browser code.\nexport const BUSINESS_ACTIVITY_COVER_ASSETS = Object.freeze(' + JSON.stringify(Object.fromEntries(assets.map(item => [item.id, item.width])), null, 2) + ')\n')
  }
  console.log(JSON.stringify({ primaryBusinesses: report.primaryBusinesses, uniquePrimaryPhotos: required.size, derivedAssets: assets.length, existingCoverReuses: existingCovers.length,
    totalNewBytes: report.totalNewBytes, recoveredSources: assets.filter(item => item.sourceRecovery).length, applied: Boolean(values.apply) }, null, 2))
}
