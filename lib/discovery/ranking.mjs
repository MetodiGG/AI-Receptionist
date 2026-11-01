import { displayDistanceKm, distanceKm, matchesPartnerLocation, withinDiscoveryRadius } from './internal-search.mjs'
import { proximityBand } from './nearby.mjs'
export const RANKING_VERSION = 'local-partners-distance-v3'
export const RANKING_WEIGHTS = { service: 50, distance: 20, neighborhood: 10, verifiedAvailability: 8, completeness: 4, bookingConvenience: 2 }

export function rankDiscoveryResults(internal, external, intent, { links = [], maxResults = 12 } = {}) {
  // Eligibility is a hard gate, never a score that a partnership can outweigh.
  // No widening to a different quarter/radius to fill an empty partner section.
  const eligible = internal.filter(row => row.source === 'gorez' && row.category === intent.category && row.services?.length && matchesPartnerLocation(row, intent) && !(intent.date && row.availability.status === 'none'))
  // Only admin-verified Place IDs authorize a merge. Name/address resemblance
  // must never silently turn an unclaimed external listing into a GoRez partner.
  const partners = new Set(eligible.map(row => row.id)), linkedIds = new Set(links.filter(link => partners.has(link.business_id)).map(link => link.place_id))
  const unique = new Map()
  for (const row of [...eligible, ...external.filter(row => row.source === 'google' && withinDiscoveryRadius(row.coordinates, intent) && !linkedIds.has(row.placeId))]) {
    const key = `${row.source}:${row.source === 'google' ? row.placeId : row.id}`
    if (!unique.has(key)) unique.set(key, row)
  }
  return [...unique.values()].map(row => {
    const distance = distanceKm(intent.coordinates, row.coordinates)
    const signals = { service: 50, distance: distance === null ? 0 : Math.max(0, 20 * (1 - distance / intent.radiusKm)),
      neighborhood: row.source === 'gorez' && intent.neighborhood && row.neighborhood ? 10 : 0,
      verifiedAvailability: row.availability.status === 'verified' ? 8 : 0,
      completeness: row.address ? 4 : 0, bookingConvenience: row.source === 'gorez' ? 2 : 0,
    }
    return { ...row, proximityBand: proximityBand(row.coordinates, intent), distanceKm: displayDistanceKm(distance), ranking: { group: row.source === 'gorez' ? 'partner' : 'external', score: Math.round(Object.values(signals).reduce((a, b) => a + b, 0)), signals } }
  })
    .sort((a, b) => Number(a.proximityBand === 'further') - Number(b.proximityBand === 'further') || Number(b.source === 'gorez') - Number(a.source === 'gorez') || (intent.coordinates ? distanceKm(intent.coordinates, a.coordinates) - distanceKm(intent.coordinates, b.coordinates) : 0) || b.ranking.score - a.ranking.score || a.name.localeCompare(b.name, 'bg') || a.id.localeCompare(b.id))
    .slice(0, maxResults)
}
