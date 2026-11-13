import { normalizeSearchText } from './discovery/categories.mjs'
import { approvedServicePhotoKind } from './service-photos.mjs'
import { catalogueServicePhotoKind } from './service-photo-catalogue-matches.mjs'
import { generatedCatalogueServicePhotoKind } from './service-photos-catalogue-expansion.mjs'
import { neutralServiceThumbnail } from './service-photo-fallback.mjs'
import { specificServicePhotoKey } from './specific-service-photo-ids.mjs'
import { reviewedPartnerServicePhoto } from './partner-service-photos.mjs'
import { contextualBrowThreadingPhoto } from './service-photos-early.mjs'

// Semantic icon metadata remains compatible for other consumers, but the
// shared thumbnail always renders a photo, never a symbol or object drawing.
const ICONS = Object.freeze({ manicure: 'spark', pedicure: 'calendarSearch', nails: 'spark', haircut: 'scissors', 'hair-colour': 'spark', 'beard-trim': 'scissors',
  'car-wash': 'wrench', 'auto-repair': 'wrench', detailing: 'wrench', tennis: 'racket', 'dog-grooming': 'paw', 'pet-care': 'paw',
  education: 'graduation', consulting: 'briefcase', health: 'stethoscope', 'home-services': 'house', fitness: 'dumbbell', beauty: 'spark', other: 'calendarSearch' })
const CATEGORY_ICONS = Object.freeze({ hair: 'scissors', barber: 'scissors', nails: 'spark', beauty: 'spark', auto: 'wrench', auto_repair: 'wrench', car_wash: 'wrench', detailing: 'wrench',
  fitness: 'dumbbell', education: 'graduation', consulting: 'briefcase', health: 'stethoscope', home_services: 'house', pets: 'paw', other: 'calendarSearch' })
const begins = (text, terms) => new RegExp(`(?:^|[^\\p{L}])(?:${terms})`, 'u').test(text)
const categoryOf = (service, business) => service?.category || business?.businessCategory || business?.category || business?.industry || 'other'

const MAKEUP_STYLE = '(?:професионален|пробен|вечерен|официален|ежедневен|дневен|сватбен|абитуриентски|експресен|бюти)'
const MAKEUP_APPLICATION = new RegExp(`^(?:(?:${MAKEUP_STYLE}(?:\\s+(?:и|или)\\s+|\\s*\\/\\s*|\\s+))*грим(?: за (?:бал|фотосесия))?|(?:поставяне|нанасяне) на грим|гримиране|(?:(?:professional|bridal|day|evening|occasion|trial|prom|wedding) )?make[ -]?up(?: application)?)(?: (?:в (?:салона?|студиото|студио)|на (?:клиентски )?адрес(?: в софия)?|in (?:the )?(?:salon|studio)|at (?:the )?client['’]s (?:home|address)))?$`, 'u')
const OTHER_MAKEUP_ACTIVITY = /перманент|тату|микроблейд|свалян|премахван|мигл|вежд|причес|подстриг|специални ефекти|концептуал|детск|уро[кц]|обучени|курс|(?:^|[^\p{L}])арт(?=$|[^\p{L}])|permanent|tattoo|microblad|removal|lashes|brows?|hairstyle|haircut|special effects|conceptual|child|lesson|course|training|sfx/u

function makeupApplicationPhoto(service, business, category, kind) {
  const name = normalizeSearchText(service?.name)
  // The approved photo depicts ordinary adult makeup being applied, not
  // artistic/SFX work, lessons, removal, or another half of a service bundle.
  // Location and occasion qualifiers do not change that pictured activity.
  if (kind === 'pet-care' || kind === 'dog-grooming' || business?.industry === 'pets' ||
    ['auto', 'auto_repair', 'car_wash', 'detailing'].includes(category) || OTHER_MAKEUP_ACTIVITY.test(name)) return null
  const [core] = name.split(/\s*·\s*/u, 1)
  return MAKEUP_APPLICATION.test(core) ? 'makeup' : null
}

export function serviceArtKind(service, business) {
  const name = normalizeSearchText(service?.name), category = categoryOf(service, business)
  const pet = category === 'pets' || business?.industry === 'pets' || begins(name, 'куч|котк|dogs?(?![a-z])|cats?(?![a-z])|pets?(?![a-z])|грум|groom')
  // Pet nail/coat care must never be pictured as a human manicure/haircut.
  if (pet) return begins(name, 'куч|dogs?(?![a-z])|puppy(?![a-z])') && begins(name, 'грум|groom|подстриг|къп|bath|разрес|brush') ? 'dog-grooming' : 'pet-care'
  const manicure = begins(name, 'маникюр|manicure'), pedicure = begins(name, 'педикюр|pedicure')
  if (manicure && pedicure) return 'nails'
  if (pedicure) return 'pedicure'
  if (manicure) return 'manicure'
  if (begins(name, 'брада|брадата|beard') && begins(name, 'оформ|подстриг|trim|clipper')) return 'beard-trim'
  if (begins(name, 'подстриг|haircut|hair cut')) return 'haircut'
  if (begins(name, 'боядис|балеаж|кичур|hair colou?r|balayage|highlights')) return 'hair-colour'
  if (begins(name, 'тенис|tennis') && category !== 'health' && !/тенис на маса|table tennis/u.test(name)) return 'tennis'
  const auto = ['auto', 'auto_repair', 'car_wash', 'detailing'].includes(category) || business?.industry === 'auto' || begins(name, 'автомоб|кола|cars?(?![a-z])|vehicles?(?![a-z])')
  if (begins(name, 'автомив|car wash') || (auto && begins(name, 'измив|миене|wash'))) return 'car-wash'
  if (auto && begins(name, 'ремонт|диагност|смяна|монтаж|баланс|repair|diagnostic|oil change|tyre|tire')) return 'auto-repair'
  if (auto && begins(name, 'детайлинг|полира|detailing|polish')) return 'detailing'
  const categories = { education: 'education', consulting: 'consulting', health: 'health', home_services: 'home-services', fitness: 'fitness', beauty: 'beauty' }
  return Object.hasOwn(categories, category) ? categories[category] : 'other'
}

function approvedServiceImage(image, service, business) {
  // There is currently no service-photo association in the public DB/query.
  // This is an explicit integration hook for an already rights-checked, exact
  // service association, NOT an invitation to infer one from the gallery.
  if (!image || image.rightsCleared !== true || image.businessProvided !== true ||
    typeof service?.id !== 'string' || !service.id || typeof business?.id !== 'string' || !business.id ||
    image.serviceId !== service.id || image.businessId !== business.id || typeof image.src !== 'string') return null
  const media = /^\/api\/business-media\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const curated = /^\/businesses\/[a-z0-9_-]+\/[a-z0-9_-]+\.(?:webp|png|jpe?g)$/i
  return media.test(image.src) || curated.test(image.src) ? image : null
}

export function serviceThumbnail(service, { business, locale = 'bg', trustedServiceImage, unavailableSources = [] } = {}) {
  const en = locale === 'en', kind = serviceArtKind(service, business)
  const name = typeof service?.name === 'string' && service.name.trim() ? service.name.trim().slice(0, 200) : (en ? 'this service' : 'услугата')
  const category = categoryOf(service, business)
  const categoryIcon = Object.hasOwn(CATEGORY_ICONS, category) ? CATEGORY_ICONS[category] : 'calendarSearch'
  const icon = kind === 'other' ? categoryIcon : ICONS[kind]
  const unavailable = new Set(Array.isArray(unavailableSources) ? unavailableSources : [])
  const image = approvedServiceImage(trustedServiceImage, service, business)
  if (image && !unavailable.has(image.src)) {
    const suppliedAlt = typeof image.alt === 'string' ? image.alt : image.alt?.[en ? 'en' : 'bg']
    return { kind, type: 'photo', photoMatch: 'exact', icon, src: image.src, srcSet: null, alt: typeof suppliedAlt === 'string' && suppliedAlt.trim() ? suppliedAlt.trim().slice(0, 300) :
      (en ? `Business-provided photo for ${name}` : `Снимка от бизнеса за ${name}`) }
  }
  const partnerPhoto = reviewedPartnerServicePhoto(service, business)
  if (partnerPhoto) {
    const src = `/service-photos/${partnerPhoto.photoId}-v1.webp`
    if (!unavailable.has(src)) return { kind, type: 'photo', source: partnerPhoto.source, photoMatch: 'exact', icon, src, srcSet: null,
      alt: partnerPhoto.source === 'provided'
        ? (en ? `Supplied photo for ${name}` : `Предоставена снимка за ${name}`)
        : (en ? `Illustrative photo for ${name}, not the business's own work` : `Примерна снимка за ${name}, не показва работа на бизнеса`) }
  }
  const photoContext = { category, artKind: kind, business, service }
  const reviewedPhoto = contextualBrowThreadingPhoto(specificServicePhotoKey(service?.illustrativePhotoKey), photoContext)
  if (reviewedPhoto) {
    const src = `/service-photos/${reviewedPhoto}-v1.webp`
    if (!unavailable.has(src)) return { kind, type: 'photo', source: 'illustrative', photoMatch: 'activity', icon, src, srcSet: null,
      alt: en ? `Illustrative photo for ${name}, not the business's own work` : `Примерна снимка за ${name}, не показва работа на бизнеса` }
  }
  const precise = approvedServicePhotoKind(service, business, category, kind) || makeupApplicationPhoto(service, business, category, kind)
  for (let stage = 0; stage < 3; stage++) {
    // Most services finish at the existing precise match; do not run the two
    // supplemental rule sets unless the previous photo is absent/unavailable.
    const candidate = stage === 0 ? precise : stage === 1 ? catalogueServicePhotoKind(service, business) : generatedCatalogueServicePhotoKind(service, business)
    const photoKind = contextualBrowThreadingPhoto(candidate, photoContext)
    const photoMatch = stage === 0 ? 'exact' : 'activity'
    if (!photoKind) continue
    const photoSrc = `/service-photos/${photoKind}-v1.webp`
    const photoAlt = photoKind === 'laser-equipment'
      ? (en ? "Illustrative photo of laser hair removal equipment, not the business's own equipment" : 'Примерна снимка на апарат за лазерна епилация, не е апаратът на бизнеса')
      : (en ? `Illustrative photo for ${name}, not the business's own work` : `Примерна снимка за ${name}, не показва работа на бизнеса`)
    if (!unavailable.has(photoSrc)) return { kind, type: 'photo', source: 'illustrative', photoMatch, icon, src: photoSrc, srcSet: null,
      alt: photoAlt }
  }
  return { kind, icon, ...neutralServiceThumbnail({ locale, unavailableSources }) }
}
