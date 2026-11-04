// Local parsing only. A map link never triggers a redirect, geocoding request
// or provider charge. A map viewport (@lat,lng) is NOT a verified place pin.
export function parseBusinessCoordinates(value) {
  const pair = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/
  let match = String(value || '').match(pair)
  if (!match) {
    try {
      const url = new URL(String(value).trim())
      if (url.protocol !== 'https:' || url.username || url.password || !['www.google.com', 'google.com', 'maps.google.com', 'www.google.bg', 'google.bg'].includes(url.hostname)) return null
      const pin = url.pathname.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
      match = pin || (url.searchParams.get('query') || url.searchParams.get('q') || '').match(pair)
    } catch { return null }
  }
  if (!match) return null
  const latitude = Number(match[1]), longitude = Number(match[2])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 41 || latitude > 44.5 || longitude < 22 || longitude > 29) return null
  return { latitude, longitude }
}

export function hasBusinessCoordinates(latitude, longitude) {
  return latitude !== '' && latitude !== null && latitude !== undefined && longitude !== '' && longitude !== null && longitude !== undefined && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && Number(latitude) >= 41 && Number(latitude) <= 44.5 && Number(longitude) >= 22 && Number(longitude) <= 29
}
