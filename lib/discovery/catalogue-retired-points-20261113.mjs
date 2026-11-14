// Frozen pre-enrichment source pairs rejected by the 2026-11-13 manual
// address review, plus two uncorroborated pairs suspended after the supplied
// municipal CSV cross-check. Never regenerate from corrected catalogue rows.
// A new method/source/address receipt cannot rehabilitate the same bad point.
export const RETIRED_CATALOGUE_POINTS_20261113 = Object.freeze([
  { id: 'sofia-in-beauty', latitude: 42.6852, longitude: 23.3245 },
  { id: 'sofia-san-krasi-barber', latitude: 42.7131329, longitude: 23.2480611 },
  { id: 'sofia-carbox-studio', latitude: 42.6272014, longitude: 23.3310508 },
  { id: 'sofia-xzona-sport', latitude: 42.6691113, longitude: 23.2545085 },
  { id: 'sofia-rhythm-academy', latitude: 42.6351614, longitude: 23.3065149 },
  { id: 'sofia-classy-barbershop', latitude: 42.6673803, longitude: 23.3493594 },
  { id: 'sofia-inergy-borovo-reserved-kickboxing', latitude: 42.668698, longitude: 23.285587 },
  // Current own contact sources confirm the postal address, but not these
  // literal old pins. Differences of150m/920m remain unresolved; do not show a
  // precise distance or force navigation to either an old or inferred pin.
  { id: 'sofia-shining-polishing-auto', latitude: 42.6591861, longitude: 23.4141981 },
  { id: 'sofia-katerene-europe-private', latitude: 42.6716059, longitude: 23.3958986 },
].map(Object.freeze))

const retiredById = new Map(RETIRED_CATALOGUE_POINTS_20261113.map(point => [point.id, point]))
// Retain the existing IN guard's small rounding tolerance; rounding a stale
// pair is not a new geographic source. This is not a broad nearby exclusion.
const tolerance = 0.00001
export function isRetiredCataloguePoint(id, point) {
  const retired = retiredById.get(id)
  return Boolean(retired && point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) &&
    Math.abs(point.latitude - retired.latitude) < tolerance && Math.abs(point.longitude - retired.longitude) < tolerance)
}
