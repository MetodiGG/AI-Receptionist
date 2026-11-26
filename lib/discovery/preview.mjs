import { railCategory, railServiceItems, SERVICE_PREVIEW_LIMIT } from './rail.mjs'
import { normalizeSearchText } from './categories.mjs'

// Only the HTTP boundary is compacted. Matching, budgets, ranking and calendar
// verification still use their complete server-side candidate sets.
export function compactDiscoveryRow(row) {
  if (!['gorez', 'catalogue'].includes(row?.source)) return row
  const { details, publicServiceNames, services, photos, hours, ...preview } = row
  const servicePreview = railServiceItems(row)
  // Strict child previews may select a later priced match. Keep that original
  // service object/identifier, not unrelated first rows from the same menu.
  const matchedByName = new Map()
  if (row.subcategory) for (const service of services || []) {
    if (service?.active === false || typeof service?.name !== 'string') continue
    const key = normalizeSearchText(service.name)
    if (!matchedByName.has(key)) matchedByName.set(key, service)
  }
  const compactServices = row.subcategory ? servicePreview.map(service => matchedByName.get(normalizeSearchText(service.name))).filter(Boolean) : services || []
  return { ...preview, detailsRef: row.id,
    categoryLabel: { bg: railCategory(row, 'bg'), en: railCategory(row, 'en') },
    servicePreview,
    services: compactServices.slice(0, SERVICE_PREVIEW_LIMIT), photos: (photos || []).slice(0, 1),
  }
}

export function compactDiscoveryResponse(body) {
  const freeCatalogue = ['catalogue', 'sofia_only'].includes(body.externalStatus)
  return { ...body, results: (body.results || []).map(row => {
    const preview = compactDiscoveryRow(row)
    // Free catalogue cards need no extra Google-rating plan/SDK requests.
    // Actual GoRez reviews remain a separate factual source as before.
    return freeCatalogue && row.source === 'gorez' ? { ...preview, googleRatingsEnabled: false } : preview
  }) }
}
