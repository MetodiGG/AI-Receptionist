// Ephemeral browser-location checks only. Metadata never belongs in the API
// payload, URLs, persistent storage, analytics or a business-location record.
export const DISCOVERY_LOCATION_MAX_AGE_MS = 5 * 60 * 1000
export const DISCOVERY_POSITION_MAX_AGE_MS = 60 * 1000
export const DISCOVERY_LOCATION_MAX_ACCURACY_M = 250
const FUTURE_TOLERANCE_MS = 1000

export function discoveryLocationError(point, now = Date.now(), maxAgeMs = DISCOVERY_LOCATION_MAX_AGE_MS) {
  if (point?.consent !== true || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return 'LOCATION_UNAVAILABLE'
  if (point.latitude < 41 || point.latitude > 44.5 || point.longitude < 22 || point.longitude > 29) return 'LOCATION_OUTSIDE'
  if (!Number.isFinite(point.accuracyMeters) || point.accuracyMeters <= 0 || point.accuracyMeters > DISCOVERY_LOCATION_MAX_ACCURACY_M) return 'LOCATION_INACCURATE'
  if (!Number.isFinite(point.observedAt) || point.observedAt <= 0 || point.observedAt > now + FUTURE_TOLERANCE_MS || now - point.observedAt >= maxAgeMs) return 'LOCATION_STALE'
  return ''
}

export function freshDiscoveryLocation(point, now = Date.now()) {
  return discoveryLocationError(point, now) ? null : point
}

export function discoveryPosition(position, now = Date.now()) {
  const { latitude, longitude, accuracy } = position?.coords || {}
  const point = { latitude, longitude, consent: true, accuracyMeters: accuracy, observedAt: position?.timestamp }
  const error = discoveryLocationError(point, now, DISCOVERY_POSITION_MAX_AGE_MS)
  if (error) throw Error(error)
  return point
}

// Preserve full numeric precision, but send only the existing public contract.
export function discoveryRequestPoint(point) {
  return point ? { latitude: point.latitude, longitude: point.longitude, consent: point.consent } : null
}

export function sameDiscoveryOrigin(request, intent) {
  const expected = request?.coordinates, actual = intent?.coordinates
  return !expected ? !actual && (!request?.cityCode || !intent?.cityCode || request.cityCode === intent.cityCode)
    : Boolean(actual && expected.latitude === actual.latitude && expected.longitude === actual.longitude)
}

export function discoveryLocationRetryMessage(error, locale = 'bg') {
  const en = locale === 'en'
  if (error === 'LOCATION_INACCURATE') return en
    ? 'Your location is not accurate enough. Try Near me again or search by city.'
    : 'Локацията не е достатъчно точна. Опитай „Около мен“ отново или търси по град.'
  if (error === 'LOCATION_STALE') return en
    ? 'Your location has expired. Press Near me again or search by city.'
    : 'Локацията е остаряла. Натисни „Около мен“ отново или търси по град.'
  return ''
}
