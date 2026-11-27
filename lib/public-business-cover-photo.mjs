import coverOwners from './discovery-photo-cover-owners.json' with { type: 'json' }
import { businessCoverPhoto } from './business-cover-photo.mjs'
import { catalogueIdPattern, isCataloguePhotoSource } from './catalogue-photo-view.mjs'
import { staticDiscoveryPhotoPath } from './discovery-photo-identity.mjs'

// Keep the cover-only path independent of the full service photo ownership
// inventory: it is used on every results card, not just in an opened menu.
// Bespoke photos are branch-only. Reviewed named examples can also opt into
// an activity cover distinct from the illustrations inside their details.
const catalogueIllustrations = Object.freeze({
  'sofia-mts-massage-pchinya31b': Object.freeze({
    cover: '/business-cover-photos/activity-massage-v1.webp',
  }),
  'sofia-aura-music-stamboliyski175': Object.freeze({
    cover: '/business-cover-photos/activity-piano-lesson-v1.webp',
  }),
  'sofia-garage46-serdika-ivanivanov67': Object.freeze({
    cover: '/business-cover-photos/go-garage46-serdika-20261127-v1.webp',
  }),
  'sofia-nosia-todor-alexandrov17': Object.freeze({
    cover: '/business-cover-photos/go-nosia-todor-alexandrov-20261125-v1.webp',
    service: '/service-photos/go-nosia-folk-dance-beginners-20261125-v1.webp',
    identity: '["fitness","български народни танци · група за начинаещи"]',
  }),
  'sofia-latin-force-centre': Object.freeze({
    cover: '/business-cover-photos/go-latin-force-centre-20261125-v1.webp',
    service: '/service-photos/go-latin-force-individual-dance-20261125-v1.webp',
    identity: '["fitness","индивидуален урок по танци"]',
  }),
})

export const catalogueBranchIllustration = business =>
  Object.hasOwn(catalogueIllustrations, business?.id) ? catalogueIllustrations[business.id] : null

// A real gallery stays first, in the caller. A published catalogue business
// may use reviewed local activity artwork as its explicitly labelled cover.
// Related businesses may share that illustrative scene when they provide the
// pictured activity. This does not transfer its ownership to any other
// category, subcategory or service thumbnail. Bare category fallbacks and
// unknown service text are not evidence of a specific pictured activity.
export function publicBusinessCoverPhoto(business, { unavailableSources = [] } = {}) {
  const selection = businessCoverPhoto(business, { unavailableSources })
  const path = staticDiscoveryPhotoPath(selection.src), fallback = staticDiscoveryPhotoPath(selection.fallbackSrc)
  const own = source => source && Object.hasOwn(coverOwners, source) && coverOwners[source] === business?.id
  const bespoke = catalogueBranchIllustration(business)
  if (bespoke) {
    return { category: selection.category, src: unavailableSources.includes(bespoke.cover) ? null : bespoke.cover, size: 720, height: 540 }
  }
  const reviewedActivity = Boolean(path && selection.activityPhotoKey && business?.source === 'catalogue' && catalogueIdPattern.test(business.id || ''))
  return { category: selection.category, size: selection.size,
    src: own(path) || reviewedActivity ? selection.src : null,
    ...(fallback && (own(fallback) || reviewedActivity) ? { fallbackSrc: selection.fallbackSrc } : {}),
    ...((own(path) || reviewedActivity) && selection.activityPhotoKey ? { activityPhotoKey: selection.activityPhotoKey } : {}),
    ...(reviewedActivity && !own(path) ? { representativeActivity: true } : {}),
  }
}

// The detail menu suppresses the active hero image and its small derivative,
// so a relevant service visual never just prints the business cover again.
export function businessCoverPhotoSources(business) {
  const actual = business?.source === 'catalogue' && isCataloguePhotoSource(business.photo?.src)
    ? business.photo.src : business?.photos?.[0]?.src
  if (typeof actual === 'string' && actual) return [actual]
  const { src, fallbackSrc } = publicBusinessCoverPhoto(business)
  return [src, fallbackSrc].filter(Boolean)
}

export function matchesBusinessCoverPhoto(source, coverSources) {
  if (typeof source !== 'string' || !source || !coverSources?.length) return false
  const canonical = staticDiscoveryPhotoPath(source)
  return coverSources.some(cover => cover === source || Boolean(canonical && canonical === staticDiscoveryPhotoPath(cover)))
}
