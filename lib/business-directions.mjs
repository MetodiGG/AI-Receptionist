import { validPlaceId } from './outbound-booking.mjs'
import { reviewedBusinessDestination } from './business-directions-reviewed.mjs'
import { businessVisitAddress, coordinatePair, noPublicVisit, possibleSofiaPoint, sofiaBusinessLocality } from './sofia-location-scope.mjs'

export function businessDirectionsAddress(business) {
  if (noPublicVisit(business)) return null
  return businessVisitAddress(business?.address || business?.locationAddress) || null
}

// Kept for the existing directory/proximity callers. Navigation itself uses
// address-bound Sofia evidence and possibleSofiaPoint below.
export function validBusinessDirectionsPoint(point) {
  return Boolean(point && Number.isFinite(point.latitude) && point.latitude >= 41 && point.latitude <= 44.5 &&
    Number.isFinite(point.longitude) && point.longitude >= 22 && point.longitude <= 29)
}

function destinationBinding(business, point) {
  if (!business?.id || !point) return null
  return JSON.stringify([business.id, businessDirectionsAddress(business),
    business.cityCode || business.city_ekatte || '', point.latitude, point.longitude])
}

function mapsUrl(destination, placeId) {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('destination', destination)
  if (placeId) url.searchParams.set('destination_place_id', placeId)
  return url.href
}

function trustedReviewedLink(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return null
    return (url.hostname === 'maps.app.goo.gl' && /^\/[a-z\d]+$/iu.test(url.pathname)) ||
      (url.hostname === 'g.page' && /^\/r\/[\w-]+$/u.test(url.pathname)) ? url.href : null
  } catch { return null }
}

// approved partner status is deliberately not a location check. verifiedCoordinates
// is supplied by server adapters using dated/address-bound source evidence.
// navigationLocation is separate from the legacy public ranking/distance point.
// Its locationVerified flag is derived on the server, not a write/API input.
export function resolveBusinessDestination(business, { verifiedCoordinates, pointConflict } = {}) {
  const address = businessDirectionsAddress(business)
  const result = (status, reason, values = {}) => ({ status, reason, address, coordinates: null,
    placeId: null, provider: null, href: null, sourceUrl: null, ...values })
  if (!business) return result('missing', 'missing_record')
  const navigation = business.navigationLocation
  if (noPublicVisit(business) || navigation?.locationStatus === 'not_visit_location') return result('not_visit_location', 'no_customer_visit')
  const locality = sofiaBusinessLocality(business)
  if (locality === 'outside') return result('outside_sofia', 'other_settlement')
  if (locality === 'conflict') return result('conflict', 'conflicting_locality')
  if (!address) return result('missing', 'missing_visit_address')
  if (locality !== 'sofia') return result('unverified', 'no_exact_sofia_city')
  if (navigation?.locationVerified === false && navigation.locationStatus === 'conflict')
    return result('conflict', 'point_needs_location_review')
  // Do not accept a caller-supplied Google Place ID or its claimed address.
  // Numeric pins from a provider response also require actual branch evidence.
  if (business.source === 'google') return result('unverified', 'provider_id_not_branch_verified')
  const source = business.source || (business.city_ekatte ? 'gorez' : 'catalogue')
  const reviewed = reviewedBusinessDestination({ ...business, source })
  const clientPoint = coordinatePair(navigation?.coordinates)
  const expected = destinationBinding(business, clientPoint)
  const proposed = verifiedCoordinates || (navigation?.locationVerified === true && navigation.locationStatus === 'verified_sofia' && expected && navigation.locationBinding === expected
    ? clientPoint : null)
  const preferred = possibleSofiaPoint(reviewed) ? reviewed : proposed
  const point = possibleSofiaPoint(preferred) ? coordinatePair(preferred) : null
  const geographicConflict = point && pointConflict?.(point)
  if (geographicConflict) return result('conflict', geographicConflict.kind, { sourceUrl: preferred?.sourceUrl || preferred?.source || null })
  if (point) return result('verified_sofia', 'verified_branch_point', {
    coordinates: point, provider: 'google_maps', href: mapsUrl(`${point.latitude},${point.longitude}`),
    sourceUrl: preferred?.sourceUrl || preferred?.source || null,
  })
  // Only exact, independently reviewed static ID/address pairs can use this
  // fallback. A place ID never overrides a verified point.
  if (reviewed?.placeId && validPlaceId(reviewed.placeId)) {
    const destination = /(?:^|[,;])\s*(?:България|Bulgaria)\s*\.?$/iu.test(address) ? address : `${address}, България`
    return result('verified_sofia', 'verified_branch_place', { placeId: reviewed.placeId, provider: 'google_maps',
      href: mapsUrl(destination, reviewed.placeId), sourceUrl: reviewed.sourceUrl })
  }
  const reviewedUrl = trustedReviewedLink(reviewed?.mapsUrl)
  if (reviewedUrl) return result('verified_sofia', 'reviewed_owner_directions', {
    provider: 'google_maps', href: reviewedUrl, sourceUrl: reviewed.sourceUrl,
  })
  const existing = business.coordinates || business.public_profile
  if (existing && (existing.latitude != null || existing.longitude != null) && !possibleSofiaPoint(existing))
    return result('conflict', 'point_outside_or_invalid')
  return result('unverified', 'no_current_branch_location_evidence')
}

export function businessMapsDirectionsUrl(business) {
  return resolveBusinessDestination(business).href
}

export function publicBusinessLocation(business, verifiedCoordinates, pointConflict) {
  // A new DTO must come from current source evidence, never recycled client
  // fields (including its own previous public projection).
  const source = business && { ...business, navigationLocation: undefined }
  const location = resolveBusinessDestination(source, { verifiedCoordinates, pointConflict })
  return { coordinates: location.coordinates, locationVerified: location.status === 'verified_sofia',
    locationStatus: location.status, locationBinding: destinationBinding(source, location.coordinates) }
}
