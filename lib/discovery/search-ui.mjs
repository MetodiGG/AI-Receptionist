import { discoveryCitiesInQuery } from './intent.mjs'

export const DEFAULT_DISCOVERY_CITY = '68134'

export function discoveryCitySelection(query, cityCode = DEFAULT_DISCOVERY_CITY, cityWasChosen = false) {
  if (cityWasChosen || !query.trim()) return cityCode
  const cities = discoveryCitiesInQuery(query)
  return cities.length === 1 ? cities[0].code : cities.length > 1 ? '' : cityCode
}

export function discoverySearchInput({ query = '', locale = 'bg', cityCode = DEFAULT_DISCOVERY_CITY, cityWasChosen = false, neighborhood = '', category = '', radiusKm = 5, coordinates = null }) {
  const resolvedCity = coordinates ? '' : discoveryCitySelection(query, cityCode, cityWasChosen)
  return { query: query.trim(), locale, radiusKm,
    ...(category ? { category } : {}), ...(resolvedCity ? { cityCode: resolvedCity } : {}),
    ...(resolvedCity && resolvedCity === cityCode && neighborhood ? { neighborhood } : {}),
    ...(coordinates ? { coordinates } : {}),
  }
}

// Only called by an explicit Near me click. No watch, IP-based location, store,
// analytics or provider request is made here. Errors contain codes only.
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
