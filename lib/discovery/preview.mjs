import { railCategory, railServiceCandidates, SERVICE_PREVIEW_LIMIT } from './rail.mjs'
import { normalizeSearchText } from './categories.mjs'
import { matchesSubcategory, subcategoriesForCategory } from './subcategories.mjs'
import { isGenericSearchService } from './service-lexicon.mjs'
import { businessActivityPhotoKey } from '../business-cover-photo.mjs'
import { catalogueBranchIllustration } from '../public-business-cover-photo.mjs'
import { isCataloguePhotoSource } from '../catalogue-photo-view.mjs'
import { homeBusinessPhoto } from './home.mjs'

function coverKey(row, service) {
  return businessActivityPhotoKey({ id: row.id, name: row.name, source: row.source, industry: row.industry,
    businessCategory: service.category || row.businessCategory || row.category, services: [service] })
}

const brows = (service, row) => matchesSubcategory(service, 'beauty-brows', row)
const lashes = (service, row) => matchesSubcategory(service, 'beauty-lashes', row)
const lashRemoval = /свалян|премахван|remov/iu
// A cylinder head is an engine component even if its tariff title does not
// repeat “engine”. Use the reviewed artwork's known subject, not broad Auto.
const coverFacets = Object.freeze({ 'sx-auto-cylinder-head': 'auto_repair-engine' })

// The first visible service anchors the illustration; choose a related second
// service rather than spending the spare slot on an unrelated paid treatment.
function representativeSelection(row, intent) {
  const child = row.subcategory || intent.subcategory
  const matchingOnly = Boolean(child || intent.category || intent.categoryFilter || intent.budget || intent.durationMin ||
    (intent.service && !intent.businessNameQuery && !intent.addressQuery))
  const candidates = railServiceCandidates(row, { matchingOnly })
  const authentic = row.source === 'catalogue' ? isCataloguePhotoSource(row.photo?.src) : Boolean(homeBusinessPhoto(row))
  if (authentic || !candidates.length) return { list: candidates.slice(0, SERVICE_PREVIEW_LIMIT) }

  const primary = row.businessCategory || row.category
  const principal = !matchingOnly && primary ? candidates.filter(service => service.category === primary) : []
  const ordered = principal.length ? principal : candidates
  const [first, ...rest] = ordered
  const key = coverKey(row, first)
  // Unknown or unclassified photos may not manufacture a specialty. Preserve
  // actual services when there is no defensible image for them.
  if (!key) return { list: ordered.slice(0, SERVICE_PREVIEW_LIMIT), key: null }

  // Brows and lashes are related visual choices on a broad Beauty card, but
  // keep each distinct fare and never insert a lash service into a brow result.
  const broadBeauty = !child && (!matchingOnly || (intent.category === 'beauty' &&
    !intent.budget && !intent.durationMin && (!intent.service || isGenericSearchService(intent.service, 'beauty'))))
  const firstBrows = broadBeauty && brows(first, row), firstLashes = broadBeauty && lashes(first, row)
  const sibling = firstBrows !== firstLashes && rest.find(service => service.price != null && (
    firstBrows ? lashes(service, row) && !brows(service, row) && !lashRemoval.test(service.name)
      : brows(service, row) && !lashes(service, row)
  ))
  const facets = subcategoriesForCategory(first.category || primary)
    .filter(facet => facet.id === coverFacets[key] || matchesSubcategory(first, facet.id, row))
  const second = sibling || rest.find(service => (!first.category || !service.category || service.category === first.category) &&
    (facets.some(facet => matchesSubcategory(service, facet.id, row)) ||
      (!facets.length && coverKey(row, service) === key)))
  return { list: second ? [first, second] : [first], key }
}

// Only the HTTP boundary is compacted. Matching, budgets, ranking and calendar
// verification still use their complete server-side candidate sets.
export function compactDiscoveryRow(row, intent = {}) {
  if (!['gorez', 'catalogue'].includes(row?.source)) return row
  const { details, publicServiceNames, services, photos, hours, ...preview } = row
  const { list: servicePreview, key } = representativeSelection(row, intent || {})
  // Retain the original selected service object, not the unrelated first rows
  // in the matching inventory or a synthetic ID/name pair.
  const matchedByName = new Map()
  for (const service of services || []) {
    if (service?.active === false || typeof service?.name !== 'string') continue
    const key = normalizeSearchText(service.name)
    if (!matchedByName.has(key)) matchedByName.set(key, service)
  }
  const compactServices = servicePreview.map(service => matchedByName.get(normalizeSearchText(service.name))).filter(Boolean)
  // Two branch-owned illustrations already depict those exact activities. No
  // change to their identity, alt text or artwork; the rows stay source-bound.
  const cover = key === undefined || catalogueBranchIllustration(row) ? {} : { illustrativeCoverPhotoKey: key }
  return { ...preview, detailsRef: row.id,
    ...cover,
    categoryLabel: { bg: railCategory(row, 'bg'), en: railCategory(row, 'en') },
    servicePreview,
    services: compactServices.slice(0, SERVICE_PREVIEW_LIMIT), photos: (photos || []).slice(0, 1),
  }
}

export function compactDiscoveryResponse(body) {
  const freeCatalogue = ['catalogue', 'sofia_only'].includes(body.externalStatus)
  return { ...body, results: (body.results || []).map(row => {
    const preview = compactDiscoveryRow(row, body.intent)
    // Free catalogue cards need no extra Google-rating plan/SDK requests.
    // Actual GoRez reviews remain a separate factual source as before.
    return freeCatalogue && row.source === 'gorez' ? { ...preview, googleRatingsEnabled: false } : preview
  }) }
}
