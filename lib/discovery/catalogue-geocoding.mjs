// Offline catalogue maintenance only. Never import into a customer API route.
// Public Nominatim policy: https://operations.osmfoundation.org/policies/nominatim/
import { OSM_ATTRIBUTION } from './catalogue-attribution.mjs'
export { OSM_ATTRIBUTION, OSM_COPYRIGHT_URL } from './catalogue-attribution.mjs'
const text = value => String(value || '').normalize('NFKC').toLocaleLowerCase('bg')
const roadKey = value => text(value).replace(/^(?:улица|ул\.?|булевард|бул\.?)\s+/u,'')
  .replace(/\bprof\.?\b/gu,'професор').replace(/(?:^|\s)проф\.?\s/gu,' професор ')
  .replace(/(?:^|\s)акад\.?\s/gu,' академик ').replace(/(?:^|\s)ген\.?\s/gu,' генерал ')
  .replace(/(?:^|\s)д-р\s/gu,' доктор ').replace(/[^\p{L}\p{N}]/gu,'')
// Latin A and Cyrillic А are unambiguous here. B/C can be transliterated or
// look-alike letters, so do not silently turn them into a different building.
const houseKey = value => text(value).replace(/a/gu,'а').replace(/\s/gu,'')

export function catalogueStreetAddress(row) {
  if (row.locationKind !== 'premises' || row.coordinates || !row.address) return null
  // Block-only, ranged or unnamed-street addresses need manual review. Do not
  // turn a neighbourhood, mall name or general Sofia point into a precise km.
  const match = row.address.match(/(?:^|[,\s])((?:ул(?:ица)?|бул(?:евард)?)\.?)\s*[„"“]?(.+?)\s*[„"“]?\s+№?\s*(\d+\s*[а-яa-z]?)(?=\s*(?:[,.(]|$))/iu)
  if (!match || !roadKey(match[2]) || !/^\d+[а-яa-z]?$/iu.test(houseKey(match[3]))) return null
  return { road:match[2].trim(),house:match[3].trim(),query:`${match[1]} ${match[2].trim()} ${match[3].trim()}, София, България`,sourceAddress:row.address }
}

export function matchCatalogueGeocode(row, candidates, checkedOn) {
  const requested=catalogueStreetAddress(row)
  if (!requested || !Array.isArray(candidates)) return null
  const matches=candidates.filter(candidate=>{
    const a=candidate.address || {}, lat=Number(candidate.lat),lon=Number(candidate.lon)
    const box=candidate.boundingbox?.map(Number)
    return ['node','way','relation'].includes(candidate.osm_type) && /^\d+$/.test(String(candidate.osm_id || ''))
      && Number.isFinite(lat) && Number.isFinite(lon) && lat>=42.45 && lat<=42.9 && lon>=23.1 && lon<=23.65
      && ['софия','sofia'].includes(text(a.city || a.town)) && a.country_code==='bg'
      && roadKey(a.road || a.pedestrian)===roadKey(requested.road) && houseKey(a.house_number)===houseKey(requested.house)
      && Array.isArray(box) && box.length===4 && box.every(Number.isFinite) && Math.abs(box[1]-box[0])<=.003 && Math.abs(box[3]-box[2])<=.003
      && !['road','suburb','city','county','state','village','town','neighbourhood','postcode'].includes(candidate.addresstype)
  })
  if (!matches.length) return null
  const first=matches[0]
  // Conflicting exact-address hits still need a human, not an arbitrary point.
  if (matches.some(row=>Math.abs(Number(row.lat)-Number(first.lat))>.0003 || Math.abs(Number(row.lon)-Number(first.lon))>.0004)) return null
  return { id:row.id,coordinates:{latitude:Number(first.lat),longitude:Number(first.lon),source:`https://www.openstreetmap.org/${first.osm_type}/${first.osm_id}`,
    method:'verified_address_geocode',sourceAddress:row.address,checkedOn,licence:'ODbL-1.0',attribution:OSM_ATTRIBUTION} }
}
