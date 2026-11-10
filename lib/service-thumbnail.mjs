import { normalizeSearchText } from './discovery/categories.mjs'

// These existing, generated object illustrations have recorded provenance in
// docs/{category-art-prompts,automotive-category-art-prompts}-2026-10-30.json.
// Category photographs and business gallery/interior photos are deliberately
// not used: neither establishes what an individual service looks like.
const ART = Object.freeze({ manicure: 'nails', haircut: 'hair', 'beard-trim': 'barber', 'car-wash': 'carwash', 'auto-repair': 'repair', tennis: 'sports', 'dog-grooming': 'pets' })
const ICONS = Object.freeze({ manicure: 'spark', pedicure: 'calendarSearch', nails: 'spark', haircut: 'scissors', 'hair-colour': 'spark', 'beard-trim': 'scissors',
  'car-wash': 'wrench', 'auto-repair': 'wrench', detailing: 'wrench', tennis: 'racket', 'dog-grooming': 'paw', 'pet-care': 'paw',
  education: 'graduation', consulting: 'briefcase', health: 'stethoscope', 'home-services': 'house', fitness: 'dumbbell', beauty: 'spark', other: 'calendarSearch' })
const CATEGORY_ICONS = Object.freeze({ hair: 'scissors', barber: 'scissors', nails: 'spark', beauty: 'spark', auto: 'wrench', auto_repair: 'wrench', car_wash: 'wrench', detailing: 'wrench',
  fitness: 'dumbbell', education: 'graduation', consulting: 'briefcase', health: 'stethoscope', home_services: 'house', pets: 'paw', other: 'calendarSearch' })
const begins = (text, terms) => new RegExp(`(?:^|[^\\p{L}])(?:${terms})`, 'u').test(text)
const categoryOf = (service, business) => service?.category || business?.businessCategory || business?.category || business?.industry || 'other'

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
    return { kind, type: 'photo', icon, src: image.src, srcSet: null, alt: typeof suppliedAlt === 'string' && suppliedAlt.trim() ? suppliedAlt.trim().slice(0, 300) :
      (en ? `Business-provided photo for ${name}` : `Снимка от бизнеса за ${name}`) }
  }
  const asset = Object.hasOwn(ART, kind) ? ART[kind] : null
  const src = asset ? `/category-art/${asset}-sm-v1.webp` : null
  const alt = en ? `Illustration for ${name}, not a photo of the business's work` : `Илюстрация за ${name}, не е снимка на работа на бизнеса`
  if (src && !unavailable.has(src)) return { kind, type: 'illustration', icon, src, srcSet: `${src} 128w, /category-art/${asset}-v1.webp 256w`, alt }
  return { kind, type: 'icon', icon, src: null, srcSet: null, alt: en ? `Service symbol for ${name}, not a photo of the business's work` : `Символ за ${name}, не е снимка на работа на бизнеса` }
}
