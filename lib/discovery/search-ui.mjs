import { discoveryCitiesInQuery } from './location-query.mjs'
import { DEFAULT_DISCOVERY_CITY, DEFAULT_DISCOVERY_RADIUS_KM } from './defaults.mjs'
import { categoryById, normalizeSearchText } from './categories.mjs'
import { discoveryPosition, discoveryRequestPoint } from './geolocation.mjs'

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

export function discoverySearchInput({ query = '', locale = 'bg', cityCode = DEFAULT_DISCOVERY_CITY, cityWasChosen = false, neighborhood = '', category = '', radiusKm = DEFAULT_DISCOVERY_RADIUS_KM, coordinates = null, expandNearby = false, browse = false, categoryBrowse = false }) {
  const item = categoryById(category)
  // Category shortcuts display the category label in the input, while their
  // request explicitly browses that category. "Other service" is not a literal
  // service name, and "Pet grooming" must not discard cat-only groomers.
  const categoryOnly = categoryBrowse && item && [item.bg, item.en].some(label => normalizeSearchText(label) === normalizeSearchText(query))
  const text = categoryOnly ? '' : query.trim()
  const resolvedCity = coordinates ? '' : discoveryCitySelection(query, cityCode, cityWasChosen)
  // Keep a manually chosen city explicit. A city found only in query text is
  // parsed by the server instead of being mislabeled as a manual selection:
  // a real brand/branch name may itself contain "Борово" or "Левски".
  const queryCity = !coordinates && !cityWasChosen && discoveryCitiesInQuery(query).length > 0
  const boundNeighborhood = resolvedCity && resolvedCity === cityCode && neighborhood
  return { query: text, locale, radiusKm, ...((browse || categoryOnly) && !text ? { browse: true } : {}),
    ...(category ? { category } : {}), ...(resolvedCity && (!queryCity || boundNeighborhood) ? { cityCode: resolvedCity } : {}),
    ...(boundNeighborhood ? { neighborhood } : {}),
    ...(coordinates ? { coordinates: discoveryRequestPoint(coordinates), ...(expandNearby ? { expandNearby: true } : {}) } : {}),
  }
}

// Coordinates are returned only after the browser grants permission. The
// homepage loads by city immediately; this helper runs only on an explicit
// location action. No watch, IP-based
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
        try { finish(null, discoveryPosition(position)) }
        catch (error) { finish(error.message) }
      }, error => finish(error?.code === 1 ? 'LOCATION_DENIED' : error?.code === 3 ? 'LOCATION_TIMEOUT' : 'LOCATION_UNAVAILABLE'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
    } catch { finish('LOCATION_UNAVAILABLE') }
  })
}
