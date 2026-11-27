import reviewed from './provider-role-illustrations.json' with { type: 'json' }
import { staticDiscoveryPhotoPath } from './discovery-photo-identity.mjs'

function index(corrections, providers) {
  const byProvider = new Map()
  for (const correction of corrections) {
    for (const id of providers(correction)) {
      if (!byProvider.has(id)) byProvider.set(id, [])
      byProvider.get(id).push(correction)
    }
  }
  return byProvider
}
const covers = index(reviewed.cover, correction => correction.providers)
const services = index(reviewed.service, correction => Object.keys(correction.offers))

// Explicit catalogue reviews only. A street name, a brand, a search result's
// category, or the appearance of a client never identifies the practitioner.
// Map the actually selected artwork, not the offer title or arbitrary text.
export function providerRoleIllustration(business, src, surface, service) {
  if (business?.source !== 'catalogue' || typeof business.id !== 'string') return null
  const corrections = (surface === 'cover' ? covers : surface === 'service' ? services : null)?.get(business.id)
  if (!corrections) return null
  const path = staticDiscoveryPhotoPath(src)
  if (!path) return null
  for (const correction of corrections) {
    const applies = surface === 'cover' || correction.offers[business.id].includes(service?.name)
    if (applies && correction.replaces.includes(path)) {
      return correction
    }
  }
  return null
}
