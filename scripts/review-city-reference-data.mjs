// Read-only preparation. Emits JSON to stdout; no API keys, Google requests,
// repository writes or runtime geocoding. Join by the NSI EKATTE ID, not name.
import { BULGARIAN_CITIES } from '../lib/bulgarian-cities.mjs'

const query = `SELECT ?code ?item ?lat ?lon ?precision ?rank WHERE {
  VALUES ?code { ${BULGARIAN_CITIES.map(city => JSON.stringify(city.code)).join(' ')} }
  ?item wdt:P3990 ?code; p:P625 ?statement.
  ?statement psv:P625 ?value; wikibase:rank ?rank.
  ?value wikibase:geoLatitude ?lat; wikibase:geoLongitude ?lon;
    wikibase:geoPrecision ?precision; wikibase:geoGlobe wd:Q2.
}`
const url = new URL('https://query.wikidata.org/sparql')
url.search = new URLSearchParams({ query, format: 'json' })
const response = await fetch(url, { headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'GoRez-local-city-reference-review/1.0 (info@gorez.co)' }, signal: AbortSignal.timeout(30000) })
if (!response.ok) throw new Error(`CITY_REFERENCE_SOURCE_${response.status}`)
const { results } = await response.json(), cities = {}, unresolved = []
for (const city of BULGARIAN_CITIES) {
  const rows = results.bindings.filter(row => row.code.value === city.code && !row.rank.value.endsWith('DeprecatedRank'))
    .map(row => ({ entity: row.item.value.split('/').at(-1), latitude: Number(row.lat.value), longitude: Number(row.lon.value), precision: Number(row.precision.value), preferred: row.rank.value.endsWith('PreferredRank') }))
    .filter(row => row.latitude >= 41 && row.latitude <= 44.5 && row.longitude >= 22 && row.longitude <= 29 && row.precision > 0)
    .sort((a, b) => Number(b.preferred) - Number(a.preferred) || a.precision - b.precision)
  const best = rows[0], tied = best && rows.filter(row => row.preferred === best.preferred && row.precision === best.precision)
  if (!best || tied.some(row => row.latitude !== best.latitude || row.longitude !== best.longitude || row.entity !== best.entity)) { unresolved.push(city.code); continue }
  cities[city.code] = { name: city.name, latitude: best.latitude, longitude: best.longitude, source: `https://www.wikidata.org/wiki/${best.entity}` }
}
console.log(JSON.stringify({ source: 'Wikidata P3990 (EKATTE) + P625, CC0', retrievedAt: new Date().toISOString().slice(0, 10), description: 'Approximate settlement reference points, not visitor locations, business entrances or cadastral centroids. Display distances only.', cities, unresolved }, null, 2))
