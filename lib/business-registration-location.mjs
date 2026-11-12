import { findCity } from './business-location.mjs'

const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : ''

// This validates an explicit applicant-supplied point, not an address lookup.
// Bounds and an attestation cannot independently prove that a pin is a venue.
export function validRegistrationPoint(point) {
  return Boolean(point && typeof point.latitude === 'number' && Number.isFinite(point.latitude)
    && typeof point.longitude === 'number' && Number.isFinite(point.longitude)
    && point.latitude >= 41 && point.latitude <= 44.5 && point.longitude >= 22 && point.longitude <= 29)
}

export function registrationLocationFingerprint(business) {
  if (!findCity(business?.city_ekatte) || clean(business?.address).length < 2 || !validRegistrationPoint(business?.public_profile)) return ''
  return JSON.stringify([business.city_ekatte, clean(business.neighborhood), clean(business.address), business.public_profile.latitude, business.public_profile.longitude])
}

export function registrationLocationConfirmed(business, confirmation) {
  const fingerprint = registrationLocationFingerprint(business)
  return Boolean(fingerprint && confirmation === fingerprint)
}

// The catalogue endpoint calls this only after full source-record validation.
// The draft layer also checks it so malformed/stale client responses do not
// silently replace a manual point. The applicant must still inspect the pin.
export function catalogueRegistrationPoint(point) {
  // OSM-derived points retain their catalogue attribution/licence there. Do not
  // silently strip it into the older partner profile's two-number data model.
  if (!validRegistrationPoint(point) || point.method !== 'first_party_coordinates') return null
  try {
    const source = new URL(point.source)
    if (source.protocol !== 'https:' || source.username || source.password) return null
  } catch { return null }
  return { latitude: point.latitude, longitude: point.longitude }
}

export function registrationMapPreview(point) {
  if (!validRegistrationPoint(point)) return null
  const url = new URL('https://www.google.com/maps/search/')
  url.searchParams.set('api', '1'); url.searchParams.set('query', `${point.latitude},${point.longitude}`)
  return url.href
}
