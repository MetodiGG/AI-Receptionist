import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { readFile, realpath, stat, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { categoryById } from '../lib/discovery/categories.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const counters = () => ({ total: 0, photo: 0, missing: 0 })
const counts = () => ({ services: counters(), priceBearing: counters(), paid: counters() })
const matchCounts = () => ({ exact: 0, activity: 0, neutral: 0, missing: 0 })
const add = (count, photo) => { count.total++; count[photo ? 'photo' : 'missing']++ }
const hasPhoto = thumbnail => Boolean(typeof thumbnail?.src === 'string' && thumbnail.src.trim() &&
  (thumbnail.type === 'photo' || thumbnail.kind === 'photo' || thumbnail.kind === 'business'))
const matchOf = thumbnail => ['exact', 'activity', 'neutral'].includes(thumbnail?.photoMatch) ? thumbnail.photoMatch : thumbnail?.photoMatch === undefined ? 'exact' : 'neutral'
const priority = (a, b) => b.paid.missing - a.paid.missing ||
  b.priceBearing.missing - a.priceBearing.missing || b.services.missing - a.services.missing
const bgOrder = (a, b) => a.localeCompare(b, 'bg') || (a < b ? -1 : a > b ? 1 : 0)

// Local report only. It measures what the shared thumbnail resolver will show,
// never the presence of a business gallery, an object illustration or an icon.
export function auditServicePhotoCoverage(records = SOFIA_CATALOGUE, { now = Date.now(), resolveThumbnail = serviceThumbnail } = {}) {
  const totals = counts(), photoMatches = matchCounts(), categories = new Map()
  let approvedBusinesses = 0
  for (const record of records) {
    const business = approvedCatalogueRecord(record, now)
    if (!business) continue
    approvedBusinesses++
    for (const service of business.services) {
      const category = categoryById(service.category)
      if (!categories.has(category.id)) categories.set(category.id, { category: category.id, label: category.bg, ...counts(), photoMatches: matchCounts(), missing: new Map() })
      const group = categories.get(category.id)
      const thumbnail = resolveThumbnail(service, { business }), photo = hasPhoto(thumbnail)
      const match = photo ? matchOf(thumbnail) : 'missing'
      photoMatches[match]++; group.photoMatches[match]++
      const priceBearing = currentPublishedFact(service.price, now)
      // A published zero price belongs in priceBearing, but only prices that
      // can exceed zero (including an explicit range) belong in paid.
      const paid = priceBearing && (service.price.maximum ?? service.price.amount) > 0
      for (const target of [totals, group]) {
        add(target.services, photo)
        if (priceBearing) add(target.priceBearing, photo)
        if (paid) add(target.paid, photo)
      }
      if (!photo) {
        if (!group.missing.has(service.name)) group.missing.set(service.name, { name: service.name, ...counts(), listings: [] })
        const item = group.missing.get(service.name)
        add(item.services, false)
        if (priceBearing) add(item.priceBearing, false)
        if (paid) add(item.paid, false)
        item.listings.push({ businessId: business.id, businessName: business.name, priceBearing, paid })
      }
    }
  }
  return {
    checkedAt: new Date(now).toISOString(), approvedBusinesses, totals, photoMatches,
    complete: totals.services.total > 0 && totals.services.missing === 0,
    exactComplete: totals.services.total > 0 && photoMatches.exact === totals.services.total,
    categories: [...categories.values()].sort((a, b) => priority(a, b) || bgOrder(a.category, b.category)).map(group => ({
      ...group, missing: [...group.missing.values()].sort((a, b) => priority(a, b) || bgOrder(a.name, b.name)).map(item => ({
        ...item, listings: item.listings.sort((a, b) => Number(b.paid) - Number(a.paid) || Number(b.priceBearing) - Number(a.priceBearing) || bgOrder(a.businessId, b.businessId)),
      })),
    })),
  }
}

const DEFAULT_PUBLIC_DIRECTORY = fileURLToPath(new URL('../public/', import.meta.url))
const DEFAULT_MAX_ASSET_BYTES = 256 * 1024
const assetLimits = ({ maxDimension = 1200, maxBytes = DEFAULT_MAX_ASSET_BYTES } = {}) => {
  if (!Number.isInteger(maxDimension) || maxDimension < 1 || maxDimension > 1200 ||
    !Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > 16 * 1024 * 1024) throw Error('Invalid offline image limits')
  return { maxDimension, maxBytes, requireSquare: true, requireWebp: true }
}
const within = (root, candidate) => {
  const path = relative(root, candidate)
  return path !== '' && !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`)
}

// Static local files or a bounded inline WebP only: never fetch a remote URL
// or call a media API. Decode the complete raster, not merely its header.
export function createLocalServicePhotoVerifier({ publicDirectory = DEFAULT_PUBLIC_DIRECTORY, ...options } = {}) {
  const policy = assetLimits(options), root = resolve(publicDirectory)
  let sharpModule
  const verify = async src => {
    if (typeof src !== 'string') return { valid: false, reason: 'not-static-public-asset' }
    const inline = src.startsWith('data:image/webp;base64,')
    let bytes, decoded
    if (inline) {
      const encoded = src.slice('data:image/webp;base64,'.length)
      if (encoded.length > 4 * Math.ceil(policy.maxBytes / 3)) return { valid: false, reason: 'file-too-large' }
      if (!encoded.length || encoded.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) return { valid: false, reason: 'invalid-inline-image' }
      bytes = Buffer.from(encoded, 'base64')
      if (bytes.toString('base64') !== encoded) return { valid: false, reason: 'invalid-inline-image' }
      if (bytes.length > policy.maxBytes) return { valid: false, reason: 'file-too-large', bytes: bytes.length }
    } else {
      if (src.length > 2048 || !src.startsWith('/') || src.startsWith('//') || /[?#\\\0]/.test(src) || src.startsWith('/api/')) {
        return { valid: false, reason: 'not-static-public-asset' }
      }
      try { decoded = decodeURIComponent(src) } catch { return { valid: false, reason: 'unsafe-path' } }
      if (decoded.startsWith('/api/')) return { valid: false, reason: 'not-static-public-asset' }
      if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').some(part => part === '..' || part === '.')) return { valid: false, reason: 'unsafe-path' }
      const candidate = resolve(root, `.${decoded}`)
      if (!within(root, candidate)) return { valid: false, reason: 'unsafe-path' }
      try {
        const [actualRoot, actualFile] = await Promise.all([realpath(root), realpath(candidate)])
        if (!within(actualRoot, actualFile)) return { valid: false, reason: 'unsafe-path' }
        const info = await stat(actualFile)
        if (!info.isFile()) return { valid: false, reason: 'not-a-file' }
        if (info.size > policy.maxBytes) return { valid: false, reason: 'file-too-large', bytes: info.size }
        bytes = await readFile(actualFile)
        if (bytes.length > policy.maxBytes) return { valid: false, reason: 'file-too-large', bytes: bytes.length }
      } catch (problem) { return { valid: false, reason: problem?.code === 'ENOENT' ? 'missing-file' : 'unreadable-file' } }
    }
    try {
      const { default: sharp } = await (sharpModule ||= import('sharp'))
      const image = sharp(bytes, { failOn: 'error', limitInputPixels: 16 * 1024 * 1024 })
      const { width, height, format, pages = 1 } = await image.metadata()
      const detail = { width, height, format, bytes: bytes.length }
      if (format !== 'webp' || (!inline && !/\.webp$/i.test(decoded))) return { valid: false, reason: 'not-webp', ...detail }
      if (pages !== 1) return { valid: false, reason: 'animated-image', ...detail }
      if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return { valid: false, reason: 'invalid-dimensions', ...detail }
      if (width > policy.maxDimension || height > policy.maxDimension) return { valid: false, reason: 'dimensions-exceeded', ...detail }
      if (width !== height) return { valid: false, reason: 'not-square', ...detail }
      await image.raw().toBuffer()
      return { valid: true, reason: null, ...detail }
    } catch { return { valid: false, reason: 'invalid-image', bytes: bytes.length } }
  }
  return Object.assign(verify, { policy: Object.freeze(policy) })
}

// Opt-in asynchronous physical audit; the original synchronous report remains
// backwards compatible. Totals here count usable, fully verified photos. A
// broken primary asset prevents `complete`, even if a valid fallback exists.
export async function auditServicePhotoAssets(records = SOFIA_CATALOGUE, {
  now = Date.now(), resolveThumbnail = serviceThumbnail,
  verifyAsset = createLocalServicePhotoVerifier(),
} = {}) {
  const resolutions = [], assets = new Map(), fallbacks = new Map()
  const logical = auditServicePhotoCoverage(records, { now, resolveThumbnail(service, options) {
    const thumbnail = resolveThumbnail(service, options)
    resolutions.push({ service, business: options.business, thumbnail })
    return thumbnail
  } })
  const check = async src => {
    if (!assets.has(src)) {
      let detail
      try { detail = await verifyAsset(src) } catch { detail = { valid: false, reason: 'verification-failed' } }
      const valid = detail?.valid === true
      assets.set(src, { src, valid, reason: valid ? null : typeof detail?.reason === 'string' ? detail.reason : 'unverified',
        ...Object.fromEntries(['width', 'height', 'bytes', 'format'].filter(key => typeof detail?.[key] === (key === 'format' ? 'string' : 'number')).map(key => [key, detail[key]])),
        references: 0, selectedReferences: 0 })
    }
    const asset = assets.get(src); asset.references++
    return asset.valid
  }
  for (const row of resolutions) {
    const unavailableSources = [], seen = new Set()
    let thumbnail = row.thumbnail
    // Include bitmap illustration fallbacks in the physical inventory too;
    // successfully decoding one still does not turn it into a service photo.
    while (typeof thumbnail?.src === 'string' && thumbnail.src.trim()) {
      if (seen.has(thumbnail.src) || seen.size >= 8) { thumbnail = { type: 'icon', src: null }; break }
      seen.add(thumbnail.src)
      if (await check(thumbnail.src)) { assets.get(thumbnail.src).selectedReferences++; break }
      unavailableSources.push(thumbnail.src)
      thumbnail = resolveThumbnail(row.service, { business: row.business, unavailableSources })
    }
    row.selected = thumbnail
    if (!hasPhoto(thumbnail) || unavailableSources.length) {
      const type = hasPhoto(thumbnail) ? 'photo' : thumbnail?.type === 'illustration' ? 'illustration' : 'icon'
      const source = typeof thumbnail?.src === 'string' ? thumbnail.src : null
      const key = JSON.stringify([type, source, unavailableSources])
      if (!fallbacks.has(key)) fallbacks.set(key, { type, src: source, unavailableSources, services: 0 })
      fallbacks.get(key).services++
    }
  }
  let position = 0
  const physical = auditServicePhotoCoverage(records, { now, resolveThumbnail: () => resolutions[position++].selected })
  const items = [...assets.values()].sort((a, b) => bgOrder(a.src, b.src))
  const invalid = items.filter(item => !item.valid).length
  return { ...physical, complete: physical.complete && invalid === 0, exactComplete: physical.exactComplete && invalid === 0,
    logicalTotals: logical.totals,
    assets: { verified: true, scope: 'approved-local-catalogue-services-only', policy: verifyAsset.policy || null,
      uniqueUsed: items.length, valid: items.length - invalid, invalid,
      totalBytes: items.reduce((sum, asset) => sum + (asset.bytes || 0), 0), items },
    fallbackSources: [...fallbacks.values()].sort((a, b) => b.services - a.services || bgOrder(a.type, b.type) || bgOrder(a.src || '', b.src || '')),
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { values } = parseArgs({ options: { 'as-of': { type: 'string' }, 'require-complete': { type: 'boolean' },
    'verify-assets': { type: 'boolean' }, 'public-dir': { type: 'string' }, 'max-asset-bytes': { type: 'string' }, report: { type: 'string' } } })
  const day = values['as-of']
  const now = day === undefined ? Date.now() : Date.parse(`${day}T00:00:00Z`)
  if (day !== undefined && (!Number.isFinite(now) || new Date(now).toISOString().slice(0, 10) !== day)) {
    throw new Error('--as-of must be a valid UTC date (YYYY-MM-DD)')
  }
  if (!values['verify-assets'] && (values['public-dir'] !== undefined || values['max-asset-bytes'] !== undefined)) throw Error('Asset options require --verify-assets')
  const report = values['verify-assets'] ? await auditServicePhotoAssets(SOFIA_CATALOGUE, { now,
    verifyAsset: createLocalServicePhotoVerifier({ ...(values['public-dir'] && { publicDirectory: values['public-dir'] }),
      ...(values['max-asset-bytes'] !== undefined && { maxBytes: Number(values['max-asset-bytes']) }) }),
  }) : auditServicePhotoCoverage(SOFIA_CATALOGUE, { now })
  const output = JSON.stringify(report, null, 2)
  if (values.report) await writeFile(values.report, `${output}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  console.log(output)
  if (values['require-complete'] && !report.complete) process.exitCode = 1
}
