import { CITY_REFERENCE_DATA as references } from './city-reference-points.mjs'
import { distanceKm } from './distance.mjs'

const pointOK = point => point && Number.isFinite(point.latitude) && point.latitude >= 41 && point.latitude <= 44.5 && Number.isFinite(point.longitude) && point.longitude >= 22 && point.longitude <= 29

// Display origin only. City reference points never become consented device
// coordinates, a nearby filter or an origin sent to a Google search.
export function discoveryDistanceOrigin({ coordinates, cityCode } = {}) {
  if (coordinates?.consent === true && pointOK(coordinates)) return { kind: 'device', latitude: coordinates.latitude, longitude: coordinates.longitude }
  const city = references.cities[cityCode]
  return city && pointOK(city) ? { kind: 'city_center', cityCode, latitude: city.latitude, longitude: city.longitude } : null
}

export function distanceBadge(origin, destination, locale = 'bg') {
  if (!origin || !['device', 'city_center'].includes(origin.kind) || !pointOK(origin)) return null
  const km = distanceKm(origin, destination)
  if (km === null) return null
  const value = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'bg-BG', { maximumFractionDigits: 1 }).format(km)
  const suffix = origin.kind === 'city_center' ? locale === 'en' ? 'from centre' : 'от центъра' : ''
  return { km, value: `${value} km`, suffix, title: locale === 'en' ? `Straight-line distance${suffix ? ' from the selected city centre' : ' from your allowed location'}` : `Разстояние по права линия${suffix ? ' от центъра на избрания град' : ' от разрешената ти локация'}` }
}

// A Maps directions link can resolve an address string without our knowing
// its exact point. Keep that address visible, but never turn it into km or
// use it as evidence of proximity. Service-area businesses have no fixed pin.
export function businessLocationBadge(business, locale = 'bg') {
  if (!business) return null
  const en = locale === 'en'
  const text = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  const known = value => value && !/^(?:неуточнен|неуточнено|unknown|not specified)$/iu.test(value)
  const field = value => known(text(value)) ? text(value) : ''
  const address = field(business.address), city = field(business.city), neighborhood = field(business.neighborhood)
  if (business.locationKind === 'service_area') return { kind: 'area', value: en ? 'At your address' : 'На твой адрес', title: en ? `Service area${city ? `: ${city}` : ''}` : `Обслужване на адрес${city ? `: ${city}` : ''}` }
  const street = city && address.toLocaleLowerCase().startsWith(`${city.toLocaleLowerCase()},`) ? address.slice(city.length + 1).trim() : address
  const value = [neighborhood, street, city].find(known)
  return value ? { kind: 'address', value, title: `${en ? 'Location' : 'Местоположение'}: ${[address || neighborhood, !address && city].filter(Boolean).join(', ') || value}` }
    : { kind: 'unknown', value: en ? 'Confirm address' : 'Уточни адреса', title: en ? 'Confirm the address with the business' : 'Уточни адреса с бизнеса' }
}

// Only the public API property of the EXACT single-place widget. No private
// provider fields, DOM scraping, contact extraction or fetchFields enrichment.
export function widgetBusinessPoint(widget, expectedId) {
  const place = widget?.place
  if (!place || place.id !== expectedId) return null
  const location = place.location
  const point = { latitude: typeof location?.lat === 'function' ? location.lat() : location?.lat, longitude: typeof location?.lng === 'function' ? location.lng() : location?.lng }
  return pointOK(point) ? point : null
}
