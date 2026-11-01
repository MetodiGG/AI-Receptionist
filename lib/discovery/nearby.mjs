import { DEFAULT_DISCOVERY_RADIUS_KM } from './defaults.mjs'
import { distanceKm } from './internal-search.mjs'

export const NEARBY_OUTER_RADIUS_KM = 5

// One bounded search batch, not an infinite-scroll provider request loop.
// Explicit radii and named areas remain strict; widening is an opt-in UI mode.
export function nearbySearchScope(input, intent) {
  const explicitRadius = /(?:на|до|within)\s*\d+(?:[.,]\d+)?\s*(?:км|km)/iu.test(input.query)
  const expanded = input.expandNearby === true && Boolean(intent.coordinates) && !intent.city && !intent.neighborhood && !explicitRadius && intent.radiusKm === DEFAULT_DISCOVERY_RADIUS_KM
  return { expanded, primaryRadiusKm: intent.radiusKm, outerRadiusKm: expanded ? NEARBY_OUTER_RADIUS_KM : intent.radiusKm,
    searchIntent: expanded ? { ...intent, radiusKm: NEARBY_OUTER_RADIUS_KM, primaryRadiusKm: intent.radiusKm } : intent }
}

export function proximityBand(coordinates, intent) {
  if (!intent.coordinates || !intent.primaryRadiusKm) return 'nearby'
  const distance = distanceKm(intent.coordinates, coordinates)
  return distance !== null && distance <= intent.primaryRadiusKm ? 'nearby' : 'further'
}

// Preserve provider order within each distance band. No Google card content
// is extracted from UI Kit, retained, or sent to a model.
export function partitionNearbyPlaceIds(google, scope) {
  if (!scope.expanded) return { nearby: google.placeIds || [], further: [] }
  const nearby = [], further = []
  for (const id of google.placeIds || []) {
    const distance = google.placeDistances?.[id]
    if (!Number.isFinite(distance) || distance > scope.outerRadiusKm) continue
    if (distance <= scope.primaryRadiusKm) nearby.push(id)
    else further.push(id)
  }
  return { nearby, further }
}
