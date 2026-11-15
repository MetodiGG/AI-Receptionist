import { businessArtCategory } from './category-art.mjs'
import { CATEGORY_IDS, DISCOVERY_CATEGORIES, normalizeSearchText } from './discovery/categories.mjs'
import { serviceThumbnail } from './service-thumbnail.mjs'
import { BUSINESS_ACTIVITY_COVER_ASSETS } from './business-activity-cover-assets.mjs'
import { APPROVED_SERVICE_PHOTO_IDS } from './service-photos.mjs'
import { GENERATED_CATALOGUE_SERVICE_PHOTO_IDS } from './service-photos-catalogue-expansion.mjs'
import { SPECIFIC_SERVICE_PHOTO_IDS } from './specific-service-photo-ids.mjs'
import { REVIEWED_PARTNER_SERVICE_PHOTOS } from './partner-service-photos.mjs'

// Reviewed generated photos, not business media. Keep this small and local:
// the same compressed file can be reused on every card in its category.
export const BUSINESS_COVER_PHOTOS = Object.freeze({
  barber: 'mens-haircut', hair: 'hair-blowdry', nails: 'classic-manicure', beauty: 'makeup',
  auto_repair: 'auto-diagnostics', car_wash: 'car-exterior-hand-wash', detailing: 'ceramic-car-coating',
  fitness: 'kickboxing-training', education: 'math-lesson', pets: 'dog-full-grooming',
  home_services: 'plumbing', health: 'therapeutic-massage', consulting: 'psychology-consultation',
  other: 'legal-consultation',
})

export const BUSINESS_SPECIALTY_COVERS = Object.freeze({
  dental: 'dental-exam', veterinary: 'veterinary-exam',
})
const knownCategories = new Set(CATEGORY_IDS)
const typeCategories = new Map(DISCOVERY_CATEGORIES.flatMap(category => category.types.map(type => [type, category.id])))
const existingActivityCovers = new Map(Object.entries({ ...BUSINESS_COVER_PHOTOS, ...BUSINESS_SPECIALTY_COVERS }).map(([category, key]) => [key, category]))
const knownActivityPhotoKeys = new Set([...APPROVED_SERVICE_PHOTO_IDS, ...GENERATED_CATALOGUE_SERVICE_PHOTO_IDS, ...SPECIFIC_SERVICE_PHOTO_IDS,
  ...REVIEWED_PARTNER_SERVICE_PHOTOS.filter(photo => photo.source === 'illustrative').map(photo => photo.photoId)])

function otherCover(business) {
  const name = normalizeSearchText([business?.name, ...(business?.services || []).map(service => typeof service === 'string' ? service : service?.name)].filter(Boolean).join(' '))
  const type = business?.primaryType
  if (type === 'dentist' || /дентал|стоматолог|зъболекар|ортодонт|\b(?:dent(?:al|ist)|orthodont)/u.test(name)) return 'dental'
  // Reuse the approved psychology-consultation cover, not the generic legal
  // meeting, for explicitly named mental-health practices in Other services.
  if (['psychologist', 'psychiatrist'].includes(type) || /психолог|психотерап|психиат|\bpsycholog|\bpsychotherap|\bpsychiatr/u.test(name)) return 'consulting'
  if (type === 'veterinary_care' || /ветеринар|\bveterinar|\bvet clinic\b/u.test(name)) return 'veterinary'
  if (type === 'medical_lab' || /лаборатори|\blaborator|\b(?:genica|synevo|cibalab|ramus)\b/u.test(name)) return 'laboratory'
  return null
}

function actualBusinessCategory(business) {
  const primary = business?.businessCategory
  const declared = business?.category
  const placeCategory = typeCategories.get(business?.primaryType)
  const inferred = () => businessArtCategory(business)
  // A partner can appear in another category's search results. That filter
  // never overrides the partner's actual category.
  const category = knownCategories.has(primary) ? primary :
    (!['gorez', 'google'].includes(business?.source) && knownCategories.has(declared)) ? declared :
      placeCategory || (business?.industry ? inferred() : knownCategories.has(declared) ? declared : 'other')
  return Object.hasOwn(BUSINESS_COVER_PHOTOS, category) ? category : 'other'
}

// Prefer the complete, stable published inventory over a query-filtered rail.
// Public service names keep their original order even when a card only carries
// two matching services. Existing reviewed image IDs are merged by exact name.
function activityServices(business, category) {
  const details = Array.isArray(business?.details?.services) ? business.details.services : []
  const ordinary = Array.isArray(business?.services) ? business.services : []
  const preview = Array.isArray(business?.servicePreview) ? business.servicePreview : []
  const inventory = [...details, ...ordinary, ...preview].filter(value => value && value.active !== false)
    .map(value => typeof value === 'string' ? { name: value } : value)
  const byName = new Map()
  for (const service of inventory) if (typeof service.name === 'string' && !byName.has(service.name.trim())) byName.set(service.name.trim(), service)
  const names = Array.isArray(business?.publicServiceNames) ? business.publicServiceNames.filter(value => typeof value === 'string' && value.trim()) : []
  const services = names.length ? names.map(name => byName.get(name.trim()) || { name: name.trim() }) : details.length ? details.filter(value => value && value.active !== false).map(value => typeof value === 'string' ? { name: value } : value) : inventory
  const primary = services.filter(service => !knownCategories.has(service.category) || service.category === category)
  // Legacy broad labels can have no inventory in that label (for example a
  // Beauty salon publishing only hair/nail services). Real services still win.
  return primary.length ? primary : services
}

function namedActivityFallback(service, category) {
  const name = normalizeSearchText(service?.name)
  // Native/future registrations do not have the catalogue's exact-name photo
  // association table. A plainly named folk-dance activity still must not get
  // boxing. Keep adult/private/child contexts distinct; do not generalize a
  // broad Pilates, instrument or therapy facet into a different real method.
  if (!['fitness', 'education'].includes(category)) return null
  const child = /детск|деца|дете|момич|момч|\b(?:child|children|kids?)\b/u.test(name)
  const individual = /индивидуал|частн|персонал|\b(?:private|individual|one.to.one)\b/u.test(name)
  const folk = /народн.*танц|танц.*народн|bulgarian folk.*danc|folk danc|(?:^|[^\p{L}])хоро(?:$|[^\p{L}])/u.test(name)
  if (folk) {
    // No approved private-child folk image exists. Do not substitute adult
    // students or pretend a children's group is one-to-one instruction.
    if (child) return individual ? null : 'sx-child-bulgarian-folk-group'
    return individual ? 'sx-bulgarian-folk-private-lesson' : 'sx-bulgarian-folk-group'
  }
  if (/айкидо|\baikido\b/u.test(name) && !/оръж|меч|състез|weapons?|swords?|competition/u.test(name)) {
    return child ? null : 'martial-arts-aikido'
  }
  if (/джудо|\bjudo\b/u.test(name) && !/джу.?дж|джиу.?дж|jiu.?jitsu|bjj|състез|competition/u.test(name)) {
    if (child) return individual ? null : 'sx-judo-child-group'
    return individual ? 'sx-judo-private' : 'sx-judo-adult-group'
  }
  return null
}

export function businessActivityPhotoKey(business) {
  const category = actualBusinessCategory(business)
  for (const service of activityServices(business, category)) {
    const photo = serviceThumbnail(service, { business: { ...business, businessCategory: category } })
    // A supplied service-specific photo is not automatically permission to use
    // it as a business cover; only the already approved illustrative artwork.
    if (photo.source === 'provided') continue
    if (photo.photoMatch === 'neutral') {
      const fallback = namedActivityFallback(service, category)
      if (fallback) return fallback
      continue
    }
    const key = photo.src?.match(/^\/service-photos\/([a-z0-9]+(?:-[a-z0-9]+)*)-v1\.webp$/u)?.[1]
    if (key && knownActivityPhotoKeys.has(key)) return key
  }
  return null
}

export function businessCoverPhoto(business, { unavailableSources = [] } = {}) {
  const resolved = actualBusinessCategory(business)
  const unavailable = new Set(Array.isArray(unavailableSources) ? unavailableSources : [])
  const suppliedKey = business?.illustrativeCoverPhotoKey
  const activity = typeof suppliedKey === 'string' && knownActivityPhotoKeys.has(suppliedKey)
    ? suppliedKey : businessActivityPhotoKey(business)
  if (activity) {
    const existing = existingActivityCovers.get(activity)
    const size = existing ? 720 : BUSINESS_ACTIVITY_COVER_ASSETS[activity]
    const large = existing ? `/business-cover-photos/${existing}-v1.webp` : size ? `/business-cover-photos/activity-${activity}-v1.webp` : null
    const small = `/service-photos/${activity}-v1.webp`
    // Failed large artwork retries the SAME activity, never a boxing/category
    // cover for an unrelated dance or yoga business.
    if (large && !unavailable.has(large)) return { category: resolved, activityPhotoKey: activity, src: large, fallbackSrc: small, size }
    if (!unavailable.has(small)) return { category: resolved, activityPhotoKey: activity, src: small, size: 256 }
    return { category: resolved, activityPhotoKey: activity, src: null, size: 256 }
  }
  // Unknown future custom service names are not evidence of the category's
  // stock pictured activity. Prefer honest missing-artwork feedback to boxing
  // for an unrecognized sport, or a notebook/emoji/unrelated procedure.
  if (activityServices(business, resolved).some(service => typeof service.name === 'string' && service.name.trim())) {
    return { category: resolved, src: null, size: 720 }
  }
  const specialty = resolved === 'other' ? otherCover(business) : null
  const src = specialty === 'laboratory' ? '/service-photos/lab-tests-v1.webp' : `/business-cover-photos/${specialty || resolved}-v1.webp`
  return { category: resolved, src: unavailable.has(src) ? null : src, size: specialty === 'laboratory' ? 256 : 720 }
}
