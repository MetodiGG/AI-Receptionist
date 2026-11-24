// GIS Sofia / Sofia Municipality, CC BY, dated 2026-08-28.
// https://urbandata.sofia.bg/dataset/zeml_sofia-zip
// Selected and simplified (see scripts/prepare-sofia-settlement-exclusions.mjs).
// These are distinct settlement *land* boundaries, NOT a positive polygon
// for Sofia city. A negative hit is a coordinate conflict for a Sofia claim.
import exclusions from './sofia-settlement-exclusions.json' with { type: 'json' }
import { coordinatePair } from './sofia-location-scope.mjs'

const buffer = .0015 // uncertainty margin > the simplification and rounding error
const indexed = exclusions.map(([name, rings]) => {
  const xs = rings[0].map(p => p[0]), ys = rings[0].map(p => p[1])
  return { name, rings, west: Math.min(...xs), east: Math.max(...xs), south: Math.min(...ys), north: Math.max(...ys) }
})
function inside(x, y, ring) {
  let contained = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j]
    if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) contained = !contained
  }
  return contained
}
function nearBoundary(x, y, ring) {
  for (let i = 0; i < ring.length - 1; i++) {
    const [a, b] = ring[i], [c, d] = ring[i + 1], dx = c - a, dy = d - b
    const length = dx ** 2 + dy ** 2
    const t = length ? Math.min(1, Math.max(0, ((x - a) * dx + (y - b) * dy) / length)) : 0
    if ((x - a - dx * t) ** 2 + (y - b - dy * t) ** 2 <= buffer ** 2) return true
  }
  return false
}
export function sofiaSettlementPointConflict(value) {
  const point = coordinatePair(value)
  if (!point) return null
  // GeoJSON: x is longitude, y is latitude.
  const x = point.longitude, y = point.latitude
  for (const { name, rings, west, east, south, north } of indexed) {
    if (x < west - buffer || x > east + buffer || y < south - buffer || y > north + buffer) continue
    if (rings.some(ring => nearBoundary(x, y, ring))) return { kind: 'boundary_review', settlement: name }
    if (inside(x, y, rings[0]) && !rings.slice(1).some(ring => inside(x, y, ring))) return { kind: 'separate_settlement', settlement: name }
  }
  return null
}
