// Small, client-safe identity allowlist. A city's presence here never creates
// a listing, expands a search radius or certifies a business address.
export const CATALOGUE_CITY_CODES = Object.freeze(['68134', '44238', '06570'])
export const CATALOGUE_ID_PATTERN = /^(?:sofia|lom|brusartsi)-[a-z0-9-]{3,80}$/
const cities = Object.freeze({
  '68134': Object.freeze({ code: '68134', prefix: 'sofia' }),
  '44238': Object.freeze({ code: '44238', prefix: 'lom' }),
  '06570': Object.freeze({ code: '06570', prefix: 'brusartsi' }),
})
export const catalogueCity = code => cities[code] || null
export const catalogueIdMatchesCity = (id, code) => typeof id === 'string'
  && CATALOGUE_ID_PATTERN.test(id) && Boolean(catalogueCity(code))
  && id.startsWith(catalogueCity(code).prefix + '-')

// Defensive source-review envelopes, not cadastral boundaries or generated
// business points. Sofia retains its original exact numeric acceptance box;
// regional envelopes surround the existing CC0 settlement reference points.
export function cataloguePointMatchesCity(code, point) {
  if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return false
  const bounds = code === '68134' ? [42.45, 42.9, 23.1, 23.65]
    : code === '44238' ? [43.725404, 43.925404, 23.087443, 23.387443]
      : code === '06570' ? [43.56253, 43.76253, 22.916269, 23.216269] : null
  return Boolean(bounds) && point.latitude >= bounds[0] && point.latitude <= bounds[1]
    && point.longitude >= bounds[2] && point.longitude <= bounds[3]
}
