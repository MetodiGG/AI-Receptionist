import { distanceKm } from './internal-search.mjs'
export const RANKING_VERSION = 'service-location-availability-v1'
export const RANKING_WEIGHTS = { service: 50, distance: 20, neighborhood: 10, verifiedAvailability: 8, completeness: 4, bookingConvenience: 2 }

export function rankDiscoveryResults(internal, external, intent, { links = [], maxResults = 12 } = {}) {
  // Only admin-verified Place IDs authorize a merge. Name/address resemblance
  // must never silently turn an unclaimed external listing into a GoRez partner.
  const partners = new Set(internal.map(row => row.id)), linkedIds = new Set(links.filter(link => partners.has(link.business_id)).map(link => link.place_id))
  const unique = new Map()
  for (const row of [...internal, ...external.filter(row => !linkedIds.has(row.placeId))]) {
    const key = `${row.source}:${row.source === 'google' ? row.placeId : row.id}`
    if (!unique.has(key)) unique.set(key, row)
  }
  return [...unique.values()].map(row => {
    const distance = row.distanceKm ?? distanceKm(intent.coordinates, row.coordinates)
    const signals = { service: 50, distance: distance === null ? 0 : Math.max(0, 20 * (1 - distance / intent.radiusKm)),
      neighborhood: row.source === 'gorez' && intent.neighborhood && row.neighborhood ? 10 : 0,
      verifiedAvailability: row.availability.status === 'verified' ? 8 : 0,
      completeness: row.address ? 4 : 0, bookingConvenience: row.source === 'gorez' ? 2 : 0,
    }
    return { ...row, distanceKm: distance, ranking: { score: Math.round(Object.values(signals).reduce((a, b) => a + b, 0)), signals } }
  }).filter(row => row.distanceKm === null || row.distanceKm <= intent.radiusKm)
    .sort((a, b) => b.ranking.score - a.ranking.score || a.name.localeCompare(b.name, 'bg') || a.id.localeCompare(b.id))
    .slice(0, maxResults)
}
