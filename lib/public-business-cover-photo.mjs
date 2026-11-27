import coverOwners from './discovery-photo-cover-owners.json' with { type: 'json' }
import { businessCoverPhoto } from './business-cover-photo.mjs'
import { catalogueIdPattern, isCataloguePhotoSource } from './catalogue-photo-view.mjs'
import { staticDiscoveryPhotoPath } from './discovery-photo-identity.mjs'
import { providerRoleIllustration } from './provider-role-illustrations.mjs'

// Keep the cover-only path independent of the full service photo ownership
// inventory: it is used on every results card, not just in an opened menu.
// Bespoke photos are branch-only. Reviewed named examples can also opt into
// an activity cover distinct from the illustrations inside their details.
const catalogueIllustrations = Object.freeze({
  'sofia-boantika-borovo-sveta-marina46': Object.freeze({
    cover: '/business-cover-photos/go-boantika-borovo-20261127-v1.webp',
  }),
  'sofia-vizio-works-gorna-banya-boycho-boychev81': Object.freeze({
    cover: '/business-cover-photos/go-vizio-works-gorna-banya-20261127-v1.webp',
  }),
  'sofia-autolakir-center-moderno-predgradie-mickevich61': Object.freeze({
    cover: '/business-cover-photos/go-autolakir-center-moderno-predgradie-20261127-v1.webp',
  }),
  'sofia-ezdasofia-slavia-haydushko-izvorche28': Object.freeze({
    cover: '/business-cover-photos/go-ezdasofia-slavia-20261127-v1.webp',
  }),
  'sofia-abv-sporten-svyat-mladost1-dospevski9': Object.freeze({
    cover: '/business-cover-photos/go-abv-sporten-svyat-mladost1-20261127-v1.webp',
  }),
  'sofia-dekra-automotive-fakulteta-suhodolska102': Object.freeze({
    cover: '/business-cover-photos/go-dekra-fakulteta-20261127-v1.webp',
  }),
  'sofia-bratya-miladinovi-kniazhevo-tsar-boris375': Object.freeze({
    cover: '/business-cover-photos/go-bratya-miladinovi-kniazhevo-20261127-v1.webp',
  }),
  'sofia-mitoart-hadzhi-dimitar-albert-long11-15': Object.freeze({
    cover: '/business-cover-photos/go-mitoart-hadzhi-dimitar-20261127-v1.webp',
  }),
  'sofia-tino-hair-hladilnika-paradisecenter100': Object.freeze({
    cover: '/business-cover-photos/go-tino-hair-hladilnika-20261127-v1.webp',
  }),
  'sofia-soma-masazhi-zapaden-park-block5b': Object.freeze({
    cover: '/business-cover-photos/go-soma-zapaden-park-20261127-v1.webp',
  }),
  'sofia-darita-iztok-lachezar-stanchev5': Object.freeze({
    cover: '/business-cover-photos/go-darita-iztok-20261127-v1.webp',
  }),
  'sofia-sisters-of-dogs-lozenets-tachev18': Object.freeze({
    cover: '/business-cover-photos/go-sisters-dogs-lozenets-20261127-v1.webp',
  }),
  'sofia-galabov-legal-zaharna-fabrika-block31a': Object.freeze({
    cover: '/business-cover-photos/go-galabov-zaharna-fabrika-20261127-v1.webp',
  }),
  'sofia-kihon-suhata-reka-botevgradsko50': Object.freeze({
    cover: '/business-cover-photos/go-kihon-suhata-reka-20261127-v1.webp',
  }),
  'sofia-car-paint-service-levski-g-kyumyurdzhiev22': Object.freeze({
    cover: '/business-cover-photos/go-carpaint-levski-g-20261127-v1.webp',
  }),
  'sofia-sense-center-karpuzitsa-nikola-petkov95a': Object.freeze({
    cover: '/business-cover-photos/go-sense-center-karpuzitsa-20261127-v1.webp',
  }),
  'sofia-robotika-krastova-vada-sasho-nikolov7': Object.freeze({
    cover: '/business-cover-photos/go-nov27-robotika-kubo-cover-v1.webp',
  }),
  'sofia-a-tu-estilo-lyulin3-block386': Object.freeze({
    cover: '/business-cover-photos/go-atues-lyulin3-20261127-v1.webp',
  }),
  'sofia-aslan-poligona-block44': Object.freeze({
    cover: '/business-cover-photos/go-aslan-poligona-20261127-v1.webp',
  }),
  'sofia-orlyak-sport-banishora-orlyak24a': Object.freeze({
    cover: '/business-cover-photos/go-orlyak-banishora-20261127-v1.webp',
  }),
  'sofia-divna-stoyanova-geyamed-kriva-reka-bogdanovets6': Object.freeze({
    cover: '/business-cover-photos/go-divna-kriva-reka-20261127-v1.webp',
  }),
  'sofia-stamovident-darvenitsa-plovdivsko11': Object.freeze({
    cover: '/business-cover-photos/go-stamovident-darvenitsa-20261127-v1.webp',
  }),
  'sofia-avtostart-izgrev-joliot-curie20': Object.freeze({
    cover: '/business-cover-photos/go-avtostart-izgrev-20261127-v1.webp',
  }),
  'sofia-dentaart-hladilnika-filipkutev14': Object.freeze({
    cover: '/business-cover-photos/go-dentaart-hladilnika-20261127-v1.webp',
  }),
  'sofia-clean-carpet-smirnenski-marko-bochar1': Object.freeze({
    cover: '/business-cover-photos/go-clean-carpet-smirnenski-20261127-v1.webp',
  }),
  'sofia-veda-junior-stefan-karadzha-gintsi11': Object.freeze({
    cover: '/business-cover-photos/go-veda-junior-stefan-karadzha-20261127-v1.webp',
  }),
  'sofia-kotev-dental-mladost1a-564': Object.freeze({
    cover: '/business-cover-photos/go-kotev-dental-mladost1a-20261127-v1.webp',
  }),
  'sofia-ramirus-levski-v-letostruy91a': Object.freeze({
    cover: '/business-cover-photos/go-ramirus-levski-v-20261127-v1.webp',
  }),
  'sofia-sedemchakri-lyulin5-dertliev99': Object.freeze({
    cover: '/business-cover-photos/go-sedemchakri-lyulin5-20261127-v1.webp',
  }),
  'sofia-sihia-nadezhda2-velezhki49g': Object.freeze({
    cover: '/business-cover-photos/activity-sx-reformer-group-v1.webp',
  }),
  'sofia-flais-nadezhda1-lyuborodie2': Object.freeze({
    cover: '/business-cover-photos/activity-sx-strength-group-v1.webp',
  }),
  'sofia-ivon-service-gorna-banya-eho1': Object.freeze({
    cover: '/business-cover-photos/activity-sx-auto-routine-service-v1.webp',
  }),
  'sofia-yavorov1920-geo-milev24': Object.freeze({
    cover: '/business-cover-photos/go-yavorov-geo-milev-choir-20261127-v1.webp',
  }),
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
function selectReviewedCover(business, unavailableSources) {
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

function roleMatchedCover(business, selected, unavailableSources) {
  const primary = providerRoleIllustration(business, selected.src, 'cover')
  const secondary = providerRoleIllustration(business, selected.fallbackSrc, 'cover')
  if (!primary && !secondary) return selected
  const { fallbackSrc, ...result } = selected
  const src = primary ? unavailableSources.includes(primary.src) ? null : primary.src : selected.src
  const fallback = secondary ? unavailableSources.includes(secondary.src) ? null : secondary.src : fallbackSrc
  return { ...result, src, ...(primary ? { size: 720, height: 540 } : {}),
    ...(fallback && fallback !== src ? { fallbackSrc: fallback } : {}) }
}

export function publicBusinessCoverPhoto(business, { unavailableSources = [] } = {}) {
  return roleMatchedCover(business, selectReviewedCover(business, unavailableSources), unavailableSources)
}

// The detail menu suppresses the active hero image and its small derivative,
// so a relevant service visual never just prints the business cover again.
export function businessCoverPhotoSources(business) {
  const actual = business?.source === 'catalogue' && isCataloguePhotoSource(business.photo?.src)
    ? business.photo.src : business?.photos?.[0]?.src
  if (typeof actual === 'string' && actual) return [actual]
  const original = selectReviewedCover(business, [])
  const { src, fallbackSrc } = roleMatchedCover(business, original, [])
  // Keep the replaced cover's small derivative out of the service gallery
  // too; changing the hero must not reintroduce the mismatched illustration.
  const replaced = original.src !== src ? [original.src, original.fallbackSrc] : []
  return [...new Set([src, fallbackSrc, ...replaced].filter(Boolean))]
}

export function matchesBusinessCoverPhoto(source, coverSources) {
  if (typeof source !== 'string' || !source || !coverSources?.length) return false
  const canonical = staticDiscoveryPhotoPath(source)
  return coverSources.some(cover => cover === source || Boolean(canonical && canonical === staticDiscoveryPhotoPath(cover)))
}
