import { railCategory, railServiceItems } from './rail.mjs'

// Only the HTTP boundary is compacted. Matching, budgets, ranking and calendar
// verification still use their complete server-side candidate sets.
export function compactDiscoveryRow(row) {
  if (!['gorez', 'catalogue'].includes(row?.source)) return row
  const { details, publicServiceNames, services, photos, hours, ...preview } = row
  return { ...preview, detailsRef: row.id,
    categoryLabel: { bg: railCategory(row, 'bg'), en: railCategory(row, 'en') },
    servicePreview: railServiceItems(row),
    services: (services || []).slice(0, 2), photos: (photos || []).slice(0, 1),
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
