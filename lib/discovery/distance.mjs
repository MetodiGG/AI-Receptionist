// Geometry only: display calculations must not change radius eligibility,
// infer a visitor's location or create a routing/ETA claim.
export function distanceKm(origin, destination) {
  if (![origin, destination].every(point => point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180)) return null
  const rad = value => value * Math.PI / 180
  const lat = rad(destination.latitude - origin.latitude), lon = rad(destination.longitude - origin.longitude)
  const a = Math.sin(lat / 2) ** 2 + Math.cos(rad(origin.latitude)) * Math.cos(rad(destination.latitude)) * Math.sin(lon / 2) ** 2
  const clamped = Math.min(1, Math.max(0, a))
  return 6371 * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped))
}
export const displayDistanceKm = value => Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : null
