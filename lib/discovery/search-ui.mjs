import { discoveryCitiesInQuery } from './intent.mjs'
import { DEFAULT_DISCOVERY_CITY, DEFAULT_DISCOVERY_RADIUS_KM } from './defaults.mjs'
import { categoryById } from './categories.mjs'

export { DEFAULT_DISCOVERY_CITY } from './defaults.mjs'
export const DISCOVERY_SHORTCUTS = Object.freeze(['hair', 'nails', 'car_wash', 'fitness', 'auto_repair'])

// A deliberate category choice supplies a complete usable query, even after
// another category/query was used. Clearing the filter preserves editable text.
// Never submits a search, requests location or contacts a provider on selection.
export function discoveryCategorySelection(query, category, locale = 'bg') {
  const item = categoryById(category)
  return item ? { category: item.id, query: item[locale === 'en' ? 'en' : 'bg'] } : { category: '', query }
}

export function discoveryCitySelection(query, cityCode = DEFAULT_DISCOVERY_CITY, cityWasChosen = false) {
  if (cityWasChosen || !query.trim()) return cityCode
  const cities = discoveryCitiesInQuery(query)
  return cities.length === 1 ? cities[0].code : cities.length > 1 ? '' : cityCode
}

export function discoverySearchInput({ query = '', locale = 'bg', cityCode = DEFAULT_DISCOVERY_CITY, cityWasChosen = false, neighborhood = '', category = '', radiusKm = DEFAULT_DISCOVERY_RADIUS_KM, coordinates = null, expandNearby = false, browse = false }) {
  const resolvedCity = coordinates ? '' : discoveryCitySelection(query, cityCode, cityWasChosen)
  return { query: query.trim(), locale, radiusKm, ...(browse && !query.trim() ? { browse: true } : {}),
    ...(category ? { category } : {}), ...(resolvedCity ? { cityCode: resolvedCity } : {}),
    ...(resolvedCity && resolvedCity === cityCode && neighborhood ? { neighborhood } : {}),
    ...(coordinates ? { coordinates, ...(expandNearby ? { expandNearby: true } : {}) } : {}),
  }
}

// Coordinates are returned only after the browser grants permission. The
// homepage may ask once on entry; off/on remains available. No watch, IP-based
// location, storage, analytics or provider request is made by this helper.
export function requestDiscoveryLocation(geolocation, { secure = true, deadlineMs = 11000 } = {}) {
  return new Promise((resolve, reject) => {
    const fail = code => reject(new Error(code))
    if (!secure) { fail('LOCATION_INSECURE'); return }
    if (!geolocation?.getCurrentPosition) { fail('LOCATION_UNSUPPORTED'); return }
    let finished = false
    const finish = (error, value) => {
      if (finished) return
      finished = true; clearTimeout(timer)
      if (error) fail(error); else resolve(value)
    }
    const timer = setTimeout(() => finish('LOCATION_TIMEOUT'), deadlineMs)
    try {
      geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position?.coords || {}
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { finish('LOCATION_UNAVAILABLE'); return }
        if (latitude < 41 || latitude > 44.5 || longitude < 22 || longitude > 29) { finish('LOCATION_OUTSIDE'); return }
        finish(null, { latitude, longitude, consent: true })
      }, error => finish(error?.code === 1 ? 'LOCATION_DENIED' : error?.code === 3 ? 'LOCATION_TIMEOUT' : 'LOCATION_UNAVAILABLE'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 })
    } catch { finish('LOCATION_UNAVAILABLE') }
  })
}
