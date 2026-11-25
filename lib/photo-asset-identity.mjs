import { BUSINESS_COVER_PHOTOS, BUSINESS_SPECIALTY_COVERS } from './business-cover-photo.mjs'
import { BUSINESS_ACTIVITY_COVER_ASSETS } from './business-activity-cover-assets.mjs'

// Only recorded derivatives share an identity. Similar subjects, matching
// category labels and a business's unused fallback key are not image evidence.
const legacyCovers = { ...BUSINESS_COVER_PHOTOS, ...BUSINESS_SPECIALTY_COVERS }
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const mediaPath = new RegExp(`^/api/(business|catalogue)-media/(${uuid})$`, 'i')
const officialOrigins = new Set(['https://gorez.co', 'https://www.gorez.co'])

function publicPhotoPath(value, unwrapOptimizer = true) {
  if (typeof value !== 'string' || !value || value.length > 2000 || /[\\\u0000-\u0020\u007f]/u.test(value)) return null
  if (!value.startsWith('/') && !value.startsWith('https://')) return null
  if (value.startsWith('//')) return null
  // URL() canonicalizes dot segments. Reject them before parsing instead of
  // accidentally treating an unknown or encoded reference as a known asset.
  const rawPath = value.split(/[?#]/u, 1)[0].replace(/^https:\/\/[^/]+/u, '')
  if (/%|(?:^|\/)\.{1,2}(?:\/|$)/u.test(rawPath)) return null
  let url
  try { url = new URL(value, 'https://www.gorez.co') } catch { return null }
  if (!officialOrigins.has(url.origin) || url.username || url.password || url.hash) return null
  if (unwrapOptimizer && url.pathname === '/_next/image') {
    const entries = [...url.searchParams]
    if (entries.length !== 3 || entries.some(([key]) => !['url', 'w', 'q'].includes(key)) ||
      ['url', 'w', 'q'].some(key => url.searchParams.getAll(key).length !== 1) ||
      !/^[1-9]\d{0,4}$/u.test(url.searchParams.get('w') || '') ||
      !/^(?:[1-9]\d?|100)$/u.test(url.searchParams.get('q') || '')) return null
    return publicPhotoPath(url.searchParams.get('url'), false)
  }
  return url.search ? null : url.pathname
}

export function photoAssetIdentity(reference) {
  const path = publicPhotoPath(typeof reference === 'string' ? reference : reference?.src)
  if (!path) return null
  const service = path.match(/^\/service-photos\/([a-z0-9]+(?:-[a-z0-9]+)*)-v1\.webp$/u)
  if (service) return `service:${service[1]}`
  const activity = path.match(/^\/business-cover-photos\/activity-([a-z0-9]+(?:-[a-z0-9]+)*)-v1\.webp$/u)
  if (activity && Object.hasOwn(BUSINESS_ACTIVITY_COVER_ASSETS, activity[1])) return `service:${activity[1]}`
  const cover = path.match(/^\/business-cover-photos\/([a-z_]+)-v1\.webp$/u)
  if (cover && Object.hasOwn(legacyCovers, cover[1])) return `service:${legacyCovers[cover[1]]}`
  const media = path.match(mediaPath)
  if (media) return `media:${media[1].toLowerCase()}:${media[2].toLowerCase()}`
  if (/^\/businesses\/[a-z0-9_-]+\/[a-z0-9_-]+\.(?:webp|png|jpe?g)$/iu.test(path) ||
    /^\/catalogue-media\/[a-z0-9-]+\.webp$/u.test(path)) return `public:${path}`
  return null
}

export function samePhotoAsset(left, right) {
  const identity = photoAssetIdentity(left)
  return identity !== null && identity === photoAssetIdentity(right)
}
