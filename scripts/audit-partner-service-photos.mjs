import { readFile, realpath, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { REVIEWED_PARTNER_SERVICE_PHOTOS, reviewedPartnerServicePhoto } from '../lib/partner-service-photos.mjs'
import { visiblePublicServices } from '../lib/public-service-eligibility.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const assetRoot = new URL('../public/service-photos/', import.meta.url)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const validId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const validSha = /^[a-f0-9]{64}$/
const suppliedId = 'partner-megan-supplied'

async function readLocalAsset(id) {
  if (typeof id !== 'string' || !validId.test(id)) throw Error('Invalid local asset ID')
  const root = await realpath(assetRoot), file = await realpath(new URL(`${id}-v1.webp`, assetRoot))
  if (!file.startsWith(`${root}/`)) throw Error('Asset escapes public photo directory')
  const info = await stat(file)
  if (!info.isFile() || info.size > 262144) throw Error('Invalid local photo file')
  return readFile(file)
}

// Dated public-partner snapshot only, not a claim about uninspected future
// native services. No network, database writes or private/customer fields.
export async function auditPartnerServicePhotos({ fixture, manifest, readAsset = readLocalAsset } = {}) {
  const issues = []
  try {
    if (fixture === undefined) fixture = JSON.parse(await readFile(new URL('../tests/fixtures/native-partner-services-20261113.json', import.meta.url), 'utf8'))
    if (manifest === undefined) manifest = JSON.parse(await readFile(new URL('../docs/partner-service-photo-assets-2026-11-13.json', import.meta.url), 'utf8'))
  } catch { return { complete: false, issues: [{ reason: 'missing-or-invalid-partner-photo-evidence' }] } }
  if (!Array.isArray(fixture?.businesses) || !Array.isArray(manifest?.assets)) return { complete: false, issues: [{ reason: 'invalid-partner-photo-evidence' }] }
  const required = new Map(REVIEWED_PARTNER_SERVICE_PHOTOS.map(photo => [photo.photoId, photo]))
  const records = new Map(), decoded = new Map()
  for (const record of manifest.assets) {
    if (!required.has(record?.id)) { issues.push({ id: record?.id, reason: 'unreferenced-partner-photo' }); continue }
    if (records.has(record.id)) { issues.push({ id: record.id, reason: 'duplicate-partner-photo' }); continue }
    records.set(record.id, record)
  }
  const decode = async id => {
    if (!decoded.has(id)) {
      try {
        const bytes = await readAsset(id)
        if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > 262144) throw Error('Invalid photo bytes')
        const image = sharp(bytes, { failOn: 'error', limitInputPixels: 16000000 })
        const metadata = await image.metadata(), { width, height, format, pages = 1 } = metadata
        if (format !== 'webp' || pages !== 1 || !width || !height || width > 1200 || height > 1200 || (id !== suppliedId && width !== height)) throw Error('Invalid photo dimensions or format')
        await image.raw().toBuffer()
        decoded.set(id, { valid: true, bytes: bytes.length, sha256: sha(bytes), width, height })
      } catch { decoded.set(id, { valid: false }); issues.push({ id, reason: 'missing-or-invalid-partner-asset' }) }
    }
    return decoded.get(id)
  }
  let reviewed = 0
  for (const [id, association] of required) {
    const record = records.get(id)
    if (!record) { issues.push({ id, reason: 'missing-partner-photo-record' }); continue }
    const provenance = record.provenance, review = record.review
    const sourceSha = provenance?.kind === 'existing_project' ? record.sha256 : provenance?.sourceSha256
    if (record.file !== `public/service-photos/${id}-v1.webp` || !validSha.test(record.sha256 || '') || !validSha.test(sourceSha || '') ||
        review?.status !== 'accepted' || review.finalDerivativeApproved !== true || review.sourceSha256 !== sourceSha ||
        !Array.isArray(review.reviewers) || !review.reviewers.length || review.reviewers.some(value => typeof value !== 'string' || !value.trim()) ||
        typeof review.method !== 'string' || !review.method.trim()) { issues.push({ id, reason: 'unreviewed-or-malformed-partner-photo' }); continue }
    if (id === suppliedId ? association.source !== 'provided' || provenance.kind !== 'user_supplied' || provenance.tool != null || provenance.prompt != null
      : association.source !== 'illustrative' || !['generated', 'existing_project'].includes(provenance?.kind)) { issues.push({ id, reason: 'incorrect-partner-photo-provenance' }); continue }
    if (id !== suppliedId && (id.startsWith('partner-') ? provenance.kind !== 'generated' : provenance.kind !== 'existing_project')) {
      issues.push({ id, reason: 'incorrect-generation-or-reuse-classification' }); continue
    }
    if (provenance.kind === 'generated' && (provenance.tool !== 'built-in image_gen' || !/^exec-[a-f0-9-]+\.png$/.test(provenance.sourceFile || '') || typeof provenance.prompt !== 'string' || provenance.prompt.length < 40)) {
      issues.push({ id, reason: 'missing-generation-prompt-or-source' }); continue
    }
    const asset = await decode(id)
    if (!asset.valid || ['width', 'height', 'bytes', 'sha256'].some(key => record[key] !== asset[key])) { issues.push({ id, reason: 'partner-asset-fingerprint-mismatch' }); continue }
    reviewed++
  }
  let rawServices = 0, visibleServices = 0, specificServices = 0
  for (const business of fixture.businesses) {
    if (!Array.isArray(business?.services)) { issues.push({ reason: 'invalid-partner-fixture-services' }); continue }
    rawServices += business.services.length
    for (const service of visiblePublicServices(business)) {
      visibleServices++
      const image = serviceThumbnail(service, { business }), match = /^\/service-photos\/([a-z0-9-]+)-v1\.webp$/.exec(image.src || '')
      if (image.type !== 'photo' || image.photoMatch === 'neutral' || !match) { issues.push({ serviceId: service.id, reason: 'non-specific-partner-thumbnail' }); continue }
      if ((await decode(match[1])).valid) specificServices++
    }
  }
  for (const association of REVIEWED_PARTNER_SERVICE_PHOTOS) {
    const business = fixture.businesses.find(row => row.id === association.businessId)
    const service = business?.services.find(row => row.id === association.serviceId)
    if (!service || reviewedPartnerServicePhoto(service, business) !== association) issues.push({ serviceId: association.serviceId, reason: 'association-not-in-reviewed-public-inventory' })
  }
  if (fixture.businesses.length !== 5 || rawServices !== 24 || visibleServices !== 21) issues.push({ reason: 'unexpected-dated-partner-inventory' })
  return { complete: issues.length === 0 && reviewed === required.size && specificServices === visibleServices,
    businesses: fixture.businesses.length, rawServices, visibleServices, specificServices, hiddenPlaceholders: rawServices - visibleServices,
    reviewedPhotos: reviewed, issues }
}
