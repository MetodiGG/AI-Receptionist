import { businessArtCategory } from './category-art.mjs'
import { CATEGORY_IDS, DISCOVERY_CATEGORIES, normalizeSearchText } from './discovery/categories.mjs'

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

export function businessCoverPhoto(business) {
  const primary = business?.businessCategory
  const declared = business?.category
  const placeCategory = typeCategories.get(business?.primaryType)
  const inferred = () => businessArtCategory(business)
  // A partner can appear in another category's search results. That filter
  // never overrides the partner's actual category.
  const category = knownCategories.has(primary) ? primary :
    (!['gorez', 'google'].includes(business?.source) && knownCategories.has(declared)) ? declared :
      placeCategory || (business?.industry ? inferred() : knownCategories.has(declared) ? declared : 'other')
  const resolved = Object.hasOwn(BUSINESS_COVER_PHOTOS, category) ? category : 'other'
  const specialty = resolved === 'other' ? otherCover(business) : null
  return { category: resolved, src: specialty === 'laboratory' ? '/service-photos/lab-tests-v1.webp' :
    `/business-cover-photos/${specialty || resolved}-v1.webp`, size: specialty === 'laboratory' ? 256 : 720 }
}
