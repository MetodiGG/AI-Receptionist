import legacyBindings from './catalogue-data/coordinate-bindings-20261113.json' with { type: 'json' }
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from './official-sofia-address-source.mjs'
import { isRetiredCataloguePoint } from './catalogue-retired-points-20261113.mjs'

// A binding prevents an old point surviving an edited address. It does NOT
// certify that an owner's published JSON-LD was geographically correct.
// Legacy pairs were inventoried on 2026-11-13; the known incorrect IN Beauty
// point is deliberately absent. New points must name the reviewed address.
const legacy = new Map(legacyBindings.map(row => [row.id, row]))
const usableSofiaPoint = point => point && Number.isFinite(point.latitude) && point.latitude >= 42.45 && point.latitude <= 42.9 &&
  Number.isFinite(point.longitude) && point.longitude >= 23.1 && point.longitude <= 23.65
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value

export function catalogueBoundCoordinates(row) {
  const point = row?.coordinates
  if (row?.locationKind !== 'premises' || !row.address || !usableSofiaPoint(point)) return null
  // Run before any method/metadata acceptance. Changing a receipt, source,
  // website or street cannot revive a known rejected ID/point pair.
  if (isRetiredCataloguePoint(row.id, point)) return null
  if (point.method === 'verified_official_address') return point.source === OFFICIAL_SOFIA_SOURCE_URL && point.licence === 'CC-BY-4.0' && point.attribution === OFFICIAL_SOFIA_ATTRIBUTION &&
    typeof point.addressId === 'string' && /^[1-9]\d*$/u.test(point.addressId) && validDay(point.checkedOn) && point.sourceCityCode === '68134' &&
    point.sourceAddress === row.address && point.sourceCityCode === row.cityCode &&
    (point.sourceNeighborhood === null || typeof point.sourceNeighborhood === 'string' && point.sourceNeighborhood.trim().length >= 2 && point.sourceNeighborhood.length <= 120) && point.sourceNeighborhood === row.neighborhood &&
    typeof point.sourceWebsite === 'string' && point.sourceWebsite.length > 0 && point.sourceWebsite === row.website ? point : null
  if (point.method === 'verified_address_geocode') return point.sourceAddress === row.address ? point : null
  if (point.method !== 'first_party_coordinates') return null
  if (point.sourceAddress) return point.sourceAddress === row.address ? point : null
  const bound = legacy.get(row.id)
  return bound && bound.address === row.address && bound.cityCode === row.cityCode && bound.neighborhood === row.neighborhood &&
    bound.latitude === point.latitude && bound.longitude === point.longitude && bound.source === point.source ? point : null
}

export function applyCatalogueCoordinateBindings(records) {
  return records.map(row => {
    const coordinates = catalogueBoundCoordinates(row)
    return coordinates === row.coordinates ? row : { ...row, coordinates }
  })
}
