import { freshDiscoveryLocation } from './geolocation.mjs'

// Navigation-only memory. Precise coordinates and free text disappear on
// reload/tab close; a permitted point additionally expires after five minutes.
let draft = null
export const setDiscoveryDraft = value => { draft = value }
export function peekDiscoveryDraft(now = Date.now()) {
  if (!draft) return null
  const input = draft.request || draft
  if (!input.coordinates) return draft
  const point = { ...input.coordinates,
    accuracyMeters: draft.locationMetadata ? draft.locationMetadata.accuracyMeters : input.coordinates.accuracyMeters,
    observedAt: draft.locationMetadata ? draft.locationMetadata.observedAt : input.coordinates.observedAt }
  const coordinates = freshDiscoveryLocation(point, now)
  if (coordinates) return draft.request ? { ...draft, request: { ...input, coordinates } } : { ...input, coordinates }
  const { coordinates: _coordinates, expandNearby: _expandNearby, neighborhood: _neighborhood, ...cityInput } = input
  // Preserve the service/manual city, never a stale point or its old quarter.
  draft = draft.request ? { ...draft, request: cityInput, locationMetadata: null, locationExpired: true } : { ...cityInput, locationExpired: true }
  return draft
}
export const clearDiscoveryDraft = () => { draft = null }
