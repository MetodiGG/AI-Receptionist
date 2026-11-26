import { catalogueIdPattern } from './catalogue-photo-view.mjs'
import { businessCoverPhotoSources, publicServiceThumbnail } from './discovery-photo-presentation.mjs'
import { staticDiscoveryPhotoPath } from './discovery-photo-identity.mjs'
import { DISCOVERY_SUBCATEGORIES } from './discovery/subcategories.mjs'
import { serviceDetailAlternates } from './service-detail-photo-variants.mjs'
import { serviceThumbnail } from './service-thumbnail.mjs'

const submenuArtwork = new Set(DISCOVERY_SUBCATEGORIES.map(option => staticDiscoveryPhotoPath(option.photo)).filter(Boolean))
const mediaPath = /^\/api\/(?:business-media|catalogue-media)\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu

function photoIdentity(src) {
  const staticPath = staticDiscoveryPhotoPath(src)
  if (staticPath || typeof src !== 'string') return staticPath
  if (src.startsWith('/_next/image?')) {
    const inner = new URL(src, 'https://gorez.invalid').searchParams.get('url')
    return typeof inner === 'string' && !inner.startsWith('/_next/') ? photoIdentity(inner) : null
  }
  const bare = src.split(/[?#]/u, 1)[0]
  return mediaPath.test(bare) ? bare.toLowerCase() : null
}

function excludes(source, cover, unavailable) {
  if (!source || unavailable.has(source) || cover.has(source)) return true
  const identity = photoIdentity(source)
  if (!identity) return true
  return cover.has(identity) || unavailable.has(identity) || submenuArtwork.has(identity) ||
    /^\/(?:category-photos|category-art|business-cover-photos)\//u.test(identity)
}

function sourceKeys(sources) {
  return new Set((Array.isArray(sources) ? sources : []).flatMap(src => typeof src === 'string' ? [src, photoIdentity(src)] : []).filter(Boolean))
}

export function publicDetailServiceThumbnail(service, {
  business, locale = 'bg', trustedServiceImage, unavailableSources = [],
  coverSources = businessCoverPhotoSources(business),
} = {}) {
  const options = { business, locale, trustedServiceImage }
  const gallery = Array.isArray(business?.photos) ? business.photos.map(photo => photo?.src) : []
  const cover = sourceKeys([...(Array.isArray(coverSources) ? coverSources : []), ...gallery])
  const unavailable = sourceKeys(unavailableSources)
  const strict = publicServiceThumbnail(service, { ...options, unavailableSources: [...unavailable] })
  if (!excludes(strict.src, cover, unavailable)) return strict

  // The shared catalogue is the source of proven activity photos. Do not
  // infer art for newly typed partner services or borrow another partner's
  // originals from their gallery. The ordinary thumbnail remains unchanged.
  if (business?.source !== 'catalogue' || !catalogueIdPattern.test(business?.id || '')) {
    return { ...strict, src: null, srcSet: null, photoMatch: 'none' }
  }
  const tried = new Set()
  // Look at the primary match even if it failed or is the cover: its reviewed
  // alternate is a different scene, and is not an arbitrary category fallback.
  for (let attempt = 0; attempt < 6; attempt++) {
    const base = serviceThumbnail(service, { ...options, unavailableSources: [...tried] })
    if (!base.src || tried.has(base.src) || base.photoMatch === 'neutral') break
    tried.add(base.src)
    if (base.source !== 'illustrative') {
      if (!excludes(base.src, cover, unavailable)) return base
      continue
    }
    const key = photoIdentity(base.src)
    // A reviewed exact association from the public catalogue or an explicit
    // precise procedure rule can lend an example of the same action. A broad
    // category match (or another partner's work) cannot.
    const namedActivity = base.photoMatch === 'exact' ||
      (typeof service?.illustrativePhotoKey === 'string' && key === `/service-photos/${service.illustrativePhotoKey}-v1.webp`)
    if (!namedActivity || !key || !key.startsWith('/service-photos/')) continue
    if (!excludes(base.src, cover, unavailable) && !key.includes('/partner-')) return base
    const alternate = serviceDetailAlternates(key, service).find(photo => !excludes(photo.src, cover, unavailable))
    if (alternate) return { ...base, src: alternate.src, srcSet: null, alt: alternate.alt?.[locale] || base.alt }
  }
  return { ...strict, src: null, srcSet: null, photoMatch: 'none' }
}
