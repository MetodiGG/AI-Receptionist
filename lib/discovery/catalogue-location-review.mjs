// Offline evidence comparison only. Never geocode, mutate a catalogue row or
// automatically replace an owner's point because another source differs.
import { catalogueStreetAddress, matchCatalogueGeocode, OSM_ATTRIBUTION } from './catalogue-geocoding.mjs'
import { catalogueBoundCoordinates } from './catalogue-coordinate-binding.mjs'
import { distanceKm } from './distance.mjs'
import { transliterate } from '../business-location.mjs'

export const CATALOGUE_LOCATION_CLOSE_METERS = 75
const key = value => typeof value === 'string' ? transliterate(value.normalize('NFKC')).toLocaleLowerCase('bg').replace(/[^\p{L}\p{N}]+/gu, ' ').trim() : ''
const inBounds = point => Boolean(point && Number.isFinite(point.latitude) && point.latitude >= 42.45 && point.latitude <= 42.9 && Number.isFinite(point.longitude) && point.longitude >= 23.1 && point.longitude <= 23.65)
const text = value => typeof value === 'string' ? value : null
const quarterKey = value => key(value).replace(/^(?:zh k|zhk|kvartal|kv)\s+/u, '').replace(/\s+/gu, '')
const blockKey = value => typeof value === 'string' ? value.normalize('NFKC').toLocaleLowerCase('bg').replace(/^(?:бл\.?|блок|block)\s*/u, '').replace(/a/gu, 'а').replace(/\s+/gu, '') : ''
const literalQuery = address => `${address.replace(/\s+/gu, ' ').trim()}${/(?:^|[,;])\s*България\s*$/iu.test(address) ? '' : ', България'}`
const joinedHouse = address => address.replace(/([\p{L}])(\d+\s*[а-яa-z]?)(?=\s*(?:[,.(]|$))/giu, '$1 $2')
const streetRange = address => /(?:ул(?:ица)?|бул(?:евард)?)\.?[^,\n]*\d+\s*[а-яa-z]?\s*[-–—/]\s*\d+/iu.test(address)

function parsedStreet(row, address, originalQuery = false) {
  const requested = catalogueStreetAddress({ ...row, address, coordinates: null })
  // A lazy street parser must not treat the last number in 3–5 as a house.
  if (!requested || /\d+\s*[а-яa-z]?\s*[-–—/]\s*$/iu.test(requested.road)) return null
  return { id: row.id, ...requested, sourceAddress: row.address, ...(originalQuery ? { query: literalQuery(row.address) } : {}) }
}

export function catalogueLocationReviewRequest(row) {
  if (!row || row.locationKind !== 'premises' || row.cityCode !== '68134' || typeof row.address !== 'string' || streetRange(row.address)) return null
  // The existing lookup parser intentionally ignores already located rows.
  // Project only for parsing; retain the original current point separately.
  // Older comparisons held every numeric range, including a separately
  // labelled office/block suffix. Preserve their already-spent literal query
  // key even when the actual street/house can now be parsed independently.
  const legacyRangeHold = /\d+\s*[а-яa-z]?\s*[-–—/]\s*\d+/iu.test(row.address)
  const requested = parsedStreet(row, row.address, legacyRangeHold)
  if (requested) return requested
  const joined = parsedStreet(row, joinedHouse(row.address), true)
  if (joined) return joined
  const parts = row.address.split(',').map(value => value.trim()).filter(Boolean)
  const ringRoad = parts.find(value => /^Околовръстен\s*път\s*\d+\s*[а-яa-z]?$/iu.test(value))
  if (ringRoad) return parsedStreet(row, `ул. ${joinedHouse(ringRoad)}`, true)
  // Only a native public row may omit the street label. Its exact known city
  // and quarter must be separate source segments, leaving one named road and
  // house; never turn a shop, office or a quarter itself into a street.
  if (row.source === 'gorez' && parts.length === 3 && ['sofia', 'sofiya', 'gr sofia', 'gr sofiya', 'grad sofia', 'grad sofiya'].includes(key(parts[0])) &&
    quarterKey(row.neighborhood) && quarterKey(parts[1]) === quarterKey(row.neighborhood) &&
    /^[\p{L}][\p{L}\s.„"“’'-]*?\s*\d+\s*[а-яa-z]?$/iu.test(parts[2]) &&
    !/^(?:бл\.?|блок|block|офис|магазин|салон|ет\.?|вх\.?)\s*/iu.test(parts[2])) {
    return parsedStreet(row, `ул. ${joinedHouse(parts[2])}`, true)
  }
  const block = row.address.match(/(?:^|[,\s])(?:бл\.?|блок|block)\s*(\d+\s*[а-яa-z]?)(?=\s*(?:[,.(]|вх\.?|вход|ет\.?|$))/iu)?.[1]
  const quarter = text(row.neighborhood)
  if (!block || !/^\d+[а-яa-z]?$/iu.test(blockKey(block)) || !quarterKey(quarter) ||
    !parts.some(value => quarterKey(value) === quarterKey(quarter))) return null
  return { id: row.id, kind: 'block_quarter', block: block.trim(), quarter, query: literalQuery(row.address), sourceAddress: row.address }
}

function compactBox(candidate) {
  if (!Array.isArray(candidate?.boundingbox) || candidate.boundingbox.length !== 4) return null
  const [south, north, west, east] = candidate.boundingbox.map(value => typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN)
  const latitude = Number(candidate.lat), longitude = Number(candidate.lon)
  return [south, north, west, east, latitude, longitude].every(Number.isFinite) && south <= north && west <= east &&
    north - south <= .003 && east - west <= .003 && latitude >= south && latitude <= north && longitude >= west && longitude <= east &&
    inBounds({ latitude: south, longitude: west }) && inBounds({ latitude: north, longitude: east })
    ? { south, north, west, east } : null
}

function candidateKind(row, candidate) {
  const domain = key(candidate.category || candidate.class), type = key(candidate.type), addressType = key(candidate.addresstype)
  const addressObject = ['building', 'house', 'house number', 'housenumber'].includes(type) || ['building', 'house', 'house number', 'housenumber'].includes(addressType)
  if (addressObject && (!domain || ['building', 'place'].includes(domain))) return 'address_point'
  // A different shop/amenity at the very same postal address does not prove
  // this business's location. Named POIs need the complete normalized name;
  // display_name substrings, generic descriptors and fuzzy matches do not.
  const name = key(candidate.name), expected = key(row.name)
  return name && expected && name === expected ? 'exact_named_business_point' : null
}

function blockMatch(row, request, candidate, checkedOn) {
  const address = candidate?.address || {}, number = address.block || address.house_number || address.building
  if (!['node', 'way', 'relation'].includes(candidate?.osm_type) || !/^[1-9]\d*$/.test(String(candidate?.osm_id || '')) ||
    !['sofia', 'sofiya'].includes(key(address.city || address.town)) || address.country_code !== 'bg' ||
    ['road', 'suburb', 'city', 'county', 'state', 'village', 'town', 'neighbourhood', 'postcode'].includes(candidate.addresstype) ||
    blockKey(number) !== blockKey(request.block) ||
    ![address.quarter, address.suburb, address.neighbourhood].some(value => quarterKey(value) && quarterKey(value) === quarterKey(request.quarter))) return null
  return { id: row.id, coordinates: { latitude: Number(candidate.lat), longitude: Number(candidate.lon),
    source: `https://www.openstreetmap.org/${candidate.osm_type}/${candidate.osm_id}`, method: 'verified_address_geocode',
    sourceAddress: row.address, checkedOn, licence: 'ODbL-1.0', attribution: OSM_ATTRIBUTION } }
}

function pointBinding(row) {
  const point = row?.coordinates
  if (!point) return { bound: false, kind: 'absent', point: null }
  const bound = catalogueBoundCoordinates(row)
  return {
    bound: Boolean(bound),
    kind: !bound ? 'unbound' : point.sourceAddress === row.address ? 'explicit_source_address' : 'legacy_snapshot',
    point: {
      latitude: Number.isFinite(point.latitude) ? point.latitude : null,
      longitude: Number.isFinite(point.longitude) ? point.longitude : null,
      method: text(point.method), source: text(point.source), sourceAddress: text(point.sourceAddress),
    },
  }
}

export function reviewCatalogueLocation(row, candidates, checkedOn) {
  if (!row || typeof row !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(checkedOn || '') ||
    new Date(`${checkedOn}T00:00:00Z`).toISOString().slice(0, 10) !== checkedOn) throw new TypeError('Expected a catalogue source row and explicit ISO review date')
  const request = catalogueLocationReviewRequest(row), binding = pointBinding(row)
  const result = {
    id: text(row.id), name: text(row.name), sourceAddress: text(row.address), cityCode: text(row.cityCode), neighborhood: text(row.neighborhood),
    checkedOn, request, currentPointBinding: binding, rawCandidateCount: Array.isArray(candidates) ? candidates.length : null,
    exactCandidateCount: 0, eligibleCandidateCount: 0, rejectedCandidates: [],
    status: 'unresolved', reason: 'unambiguous_street_address_required', matched: null, separationMeters: null,
    automaticReplacement: false, spatialAccuracyVerifiedByThisReview: false,
  }
  if (!request) return result
  if (!Array.isArray(candidates)) return { ...result, reason: 'candidate_array_required' }
  // Prefixes/spaces in a parsing projection do not rename the source road or
  // rewrite the public address. The original sourceAddress is restored below.
  const projected = { ...row, address: request.kind === 'block_quarter' ? row.address : `ул. ${request.road} ${request.house}`, coordinates: null }, exact = []
  for (const [index, candidate] of candidates.entries()) {
    const box = compactBox(candidate)
    const match = request.kind === 'block_quarter' ? blockMatch(row, request, candidate, checkedOn)
      : candidate && /^[1-9]\d*$/.test(String(candidate.osm_id || '')) ? matchCatalogueGeocode(projected, [candidate], checkedOn) : null
    if (!match || !box) { result.rejectedCandidates.push({ index, reason: 'strict_address_point_mismatch' }); continue }
    const kind = candidateKind(row, candidate)
    exact.push({ candidate, box, match, kind })
    if (!kind) result.rejectedCandidates.push({ index, reason: 'unrelated_or_unnamed_poi_at_same_address' })
  }
  result.exactCandidateCount = exact.length
  result.eligibleCandidateCount = exact.filter(value => value.kind).length
  if (!exact.length) return { ...result, reason: 'no_exact_address_candidate' }
  // Even coincident duplicates need manual disambiguation. Do not silently
  // select one source, a nearby shop or a plausible first candidate.
  if (exact.length !== 1) return { ...result, reason: 'multiple_exact_address_candidates' }
  const selected = exact[0]
  if (!selected.kind) return { ...result, reason: 'unrelated_or_unnamed_poi_at_same_address' }
  result.matched = {
    ...selected.match.coordinates, sourceAddress: row.address, osmType: selected.candidate.osm_type, osmId: String(selected.candidate.osm_id),
    name: text(selected.candidate.name), kind: selected.kind, boundingBox: selected.box,
    addressEvidence: request.kind === 'block_quarter' ? 'exact_block_number_and_quarter' : 'exact_street_and_house',
    semantics: selected.kind === 'address_point' ? 'postal_address_point_not_verified_business_or_entrance' : 'exact_name_and_postal_address_not_verified_entrance',
  }
  const separationKm = inBounds(row.coordinates) ? distanceKm(row.coordinates, result.matched) : null
  result.separationMeters = separationKm === null ? null : separationKm * 1000
  if (!binding.bound) return { ...result, reason: binding.kind === 'absent' ? 'current_point_absent' : 'current_point_unbound' }
  if (result.separationMeters === null) return { ...result, reason: 'current_point_invalid' }
  return { ...result, status: result.separationMeters <= CATALOGUE_LOCATION_CLOSE_METERS ? 'close' : 'needs_review', reason: result.separationMeters <= CATALOGUE_LOCATION_CLOSE_METERS ? 'sources_within_75m' : 'sources_more_than_75m_apart' }
}
