import { findCity, transliterate } from './business-location.mjs'
import { validPlaceId } from './outbound-booking.mjs'
import { reviewedBusinessDestination } from './business-directions-reviewed.mjs'

const clean = value => typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : ''
const words = value => transliterate(clean(value)).toLowerCase().replace(/[^a-z0-9]+/gu, ' ').trim().replace(/\bsofiya\b/gu, 'sofia')
const contains = (value, term) => (` ${words(value)} `).includes(` ${words(term)} `)

// Route to the actual displayed postal address, not a possibly stale map
// coordinate or a similarly named business/another branch. No geocoding or
// visitor origin is performed/sent here; opening Maps remains a user action.
export function businessDirectionsAddress(business) {
  const address = clean(business?.address)
  if (!address || business.locationKind === 'service_area') return null
  const city = clean(business.city) || findCity(business.cityCode || business.city_ekatte)?.name || ''
  // A boulevard called "България" is not the country clause.
  const countryPresent = /(?:^|[,;])\s*(?:България|Bulgaria)\s*\.?$/iu.test(address)
  const blockOnly = /(?:^|[\s,])(?:бл\.?|блок|block)\s*\d/iu.test(address) && !/(?:ул\.|улица|бул\.|булевард|street|str\.|blvd)/iu.test(address)
  const quarter = blockOnly && clean(business.neighborhood) && !contains(address, business.neighborhood) ? clean(business.neighborhood) : ''
  return [city && !contains(address, city) ? city : '', quarter, address, countryPresent ? '' : 'България'].filter(Boolean).join(', ')
}

export function validBusinessDirectionsPoint(point) {
  return Boolean(point && Number.isFinite(point.latitude) && point.latitude >= 41 && point.latitude <= 44.5 &&
    Number.isFinite(point.longitude) && point.longitude >= 22 && point.longitude <= 29)
}

export function businessMapsDirectionsUrl(business) {
  if (!business || business.locationKind === 'service_area') return null
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  if (business.source === 'google') {
    if (!validPlaceId(business.placeId)) return null
    url.searchParams.set('destination', business.placeId)
    url.searchParams.set('destination_place_id', business.placeId)
  } else {
    const address = businessDirectionsAddress(business)
    const reviewed = reviewedBusinessDestination(business)
    if (reviewed?.mapsUrl) return reviewed.mapsUrl
    if (reviewed?.placeId && validPlaceId(reviewed.placeId)) {
      url.searchParams.set('destination', address)
      url.searchParams.set('destination_place_id', reviewed.placeId)
    } else if (reviewed && validBusinessDirectionsPoint(reviewed)) url.searchParams.set('destination', `${reviewed.latitude},${reviewed.longitude}`)
    else if (address) url.searchParams.set('destination', address)
    else if (validBusinessDirectionsPoint(business.coordinates)) url.searchParams.set('destination', `${business.coordinates.latitude},${business.coordinates.longitude}`)
    else return null
  }
  return url.href
}
