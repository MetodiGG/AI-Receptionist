import { BULGARIAN_CITIES, NEIGHBOURHOODS, transliterate } from '../business-location.mjs'
import { normalizeSearchText } from './categories.mjs'

// Pure browser/server location wording helpers. Keeping these apart from the
// authoritative intent schemas avoids booting the server parser just to fill
// city and neighbourhood controls; validation stays on the API boundary.
export const boundaryMatch = (text, word) => new RegExp(`(?:^|[^\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'u').test(text)
const citiesByNameLength = [...BULGARIAN_CITIES].sort((a, b) => b.name.length - a.name.length)
  .map(city => ({ city, name: normalizeSearchText(city.name), nameEn: normalizeSearchText(city.nameEn) }))
export function citiesIn(text) {
  // Cheap substring checks avoid compiling thousands of regular expressions
  // on each request/client keystroke; boundary matching remains authoritative.
  const matches = citiesByNameLength.filter(({ name, nameEn }) => (text.includes(name) && boundaryMatch(text, name)) || (text.includes(nameEn) && boundaryMatch(text, nameEn))).map(row => row.city)
  // Avoid treating "Загорци" as a second place inside a longer matched name.
  return matches.filter(city => !matches.some(other => other !== city && normalizeSearchText(other.name).includes(normalizeSearchText(city.name))))
}
// Shared by the search form so its Sofia default never overrides a city that
// the client explicitly typed. The server still validates the final request.
export function discoveryCitiesInQuery(query = '') { return citiesIn(normalizeSearchText(query)) }
export function neighborhoodChoices(cityCode) {
  const rows = [...(NEIGHBOURHOODS[cityCode] || [])]
  // A client can ask for the whole district, not just one numbered part.
  // Derive only names supported by the existing local neighbourhood registry.
  rows.push(...rows.map(value => value.replace(/\s+\d+[\p{L}]?$/u, '')).filter(value => value))
  return [...new Set(rows)].sort((a, b) => a.localeCompare(b, 'bg'))
}
export function neighborhoodIn(text, cityCode) {
  // Near me has coordinates instead of a selected city. Still honour an
  // explicitly typed quarter; never erase it and widen to the whole radius.
  const choices = cityCode ? neighborhoodChoices(cityCode) : [...new Set(Object.keys(NEIGHBOURHOODS).flatMap(neighborhoodChoices))]
  return choices.sort((a, b) => b.length - a.length).find(value => boundaryMatch(text, normalizeSearchText(value)) || boundaryMatch(text, normalizeSearchText(transliterate(value)))) || null
}
