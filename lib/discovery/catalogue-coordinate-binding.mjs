import legacyBindings from './catalogue-data/coordinate-bindings-20261113.json' with { type: 'json' }

// A binding prevents an old point surviving an edited address. It does NOT
// certify that an owner's published JSON-LD was geographically correct.
// Legacy pairs were inventoried on 2026-11-13; the known incorrect IN Beauty
// point is deliberately absent. New points must name the reviewed address.
const legacy = new Map(legacyBindings.map(row => [row.id, row]))
const usableSofiaPoint = point => point && Number.isFinite(point.latitude) && point.latitude >= 42.45 && point.latitude <= 42.9 &&
  Number.isFinite(point.longitude) && point.longitude >= 23.1 && point.longitude <= 23.65

export function catalogueBoundCoordinates(row) {
  const point = row?.coordinates
  if (row?.locationKind !== 'premises' || !row.address || !usableSofiaPoint(point)) return null
  // The published IN Beauty JSON-LD is a confirmed wrong source, not merely
  // missing address metadata. Adding sourceAddress must not revive that pair.
  if (row.id === 'sofia-in-beauty' && row.address === 'София, ул. Генерал Иван Колев 2' &&
    Math.abs(point.latitude - 42.6852) < 0.00001 && Math.abs(point.longitude - 23.3245) < 0.00001) return null
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
