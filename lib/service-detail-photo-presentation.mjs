import { catalogueIdPattern } from './catalogue-photo-view.mjs'
import { businessCoverPhotoSources, publicServiceThumbnail } from './discovery-photo-presentation.mjs'
import { discoveryServicePhotoIdentity, staticDiscoveryPhotoPath } from './discovery-photo-identity.mjs'
import { DISCOVERY_SUBCATEGORIES } from './discovery/subcategories.mjs'
import { serviceDetailAlternates } from './service-detail-photo-variants.mjs'
import { serviceThumbnail } from './service-thumbnail.mjs'
import { existingDetailServicePhoto } from './service-detail-existing-photo-coverage.mjs'
import { detailGapWavePhotos } from './service-detail-gap-wave.mjs'
import { detailGapFollowupPhotos } from './service-detail-gap-followup.mjs'
import { serviceDetailTailPhotos } from './service-detail-tail.mjs'
import exactGapPhotos from './service-detail-photo-exact-gaps.json' with { type: 'json' }

const submenuArtwork = new Set(DISCOVERY_SUBCATEGORIES.map(option => staticDiscoveryPhotoPath(option.photo)).filter(Boolean))
const mediaPath = /^\/api\/(?:business-media|catalogue-media)\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu
const exactGaps = new Map(exactGapPhotos.flatMap(photo => (photo.services || []).map(([category, name]) =>
  [discoveryServicePhotoIdentity({ name, category }), photo])))
const partnerGaps = new Map(exactGapPhotos.flatMap(photo => (photo.partnerServices || []).map(([businessId, serviceId, name]) =>
  [serviceId, { businessId, name, photo }])))

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

  const isCatalogue = business?.source === 'catalogue' && catalogueIdPattern.test(business?.id || '')
  const namedFallback = () => {
    const partner = partnerGaps.get(service?.id)
    const reviewed = isCatalogue ? exactGaps.get(discoveryServicePhotoIdentity(service, business))
      : partner && (business?.source === 'gorez' || business?.source == null) && partner.businessId === business?.id &&
        partner.name === service?.name?.normalize('NFC').trim() && !service?.category ? partner.photo : null
    const newChoices = isCatalogue ? [
      ...detailGapWavePhotos(service, business), ...detailGapFollowupPhotos(service, business), ...serviceDetailTailPhotos(service, business),
    ] : []
    for (const photo of [reviewed, existingDetailServicePhoto(service, business), ...newChoices]) {
      if (!excludes(photo?.src, cover, unavailable)) return {
        ...strict, type: 'photo', source: 'illustrative', photoMatch: photo.photoMatch || 'exact',
        src: photo.src, srcSet: null, alt: photo.alt[locale] || photo.alt.bg,
      }
    }
    return { ...strict, src: null, srcSet: null, photoMatch: 'none' }
  }
  // Partners only acquire a fallback from exact business ID, service ID and
  // reviewed title, never from trusting new free text or a gallery neighbour.
  if (!isCatalogue) return namedFallback()
  const tried = new Set()
  let expandedAlternate = null
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
    if (!key || !key.startsWith('/service-photos/') || key.includes('/partner-')) continue
    if (namedActivity && !excludes(base.src, cover, unavailable)) return base
    const alternate = serviceDetailAlternates(key, service, { confirmedActivity: namedActivity }).find(photo => !excludes(photo.src, cover, unavailable))
    if (alternate) return { ...base, src: alternate.src, srcSet: null, alt: alternate.alt?.[locale] || base.alt }
    if (!expandedAlternate) {
      const extra = serviceDetailAlternates(key, service, { expansionOnly: true, confirmedActivity: namedActivity }).find(photo => !excludes(photo.src, cover, unavailable))
      if (extra) expandedAlternate = { ...base, src: extra.src, srcSet: null, alt: extra.alt?.[locale] || base.alt }
    }
  }
  // Never replace an already visible approved photograph with a new scene.
  return expandedAlternate || namedFallback()
}
