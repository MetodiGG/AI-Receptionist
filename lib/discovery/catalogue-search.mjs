import { approvedCatalogueRecord } from './catalogue-policy.mjs'
import { normalizeSearchText } from './categories.mjs'
import { businessAddress } from '../business-location.mjs'
import { matchingServices, matchesPartnerLocation, normalizeInternalBusinesses, verifyDiscoveryAvailability } from './internal-search.mjs'
import { distanceKm, displayDistanceKm } from './distance.mjs'
import { discoveryDistanceOrigin } from './distance-origin.mjs'
import { nearbySearchScope, proximityBand } from './nearby.mjs'

export const CATALOGUE_RANKING_VERSION = 'sofia-reviewed-distance-v2'
const phoneKey = value => String(value || '').replace(/[^+\d]/g, '').replace(/^0(?=\d{8,9}$)/, '+359')
const addressKey = value => normalizeSearchText(value).replace(/[^\p{L}\p{N}]/gu, '')
function websiteKey(value) { try { const url = new URL(value); return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}` } catch { return '' } }

export function isCataloguePartnerDuplicate(record, partners) {
  return partners.some(partner => {
    if (record.gorezBusinessId && record.gorezBusinessId === partner.id) return true
    const phone = phoneKey(partner.phone)
    if (!phone || phone !== phoneKey(record.phone)) return false
    // Both independently verified contact and exact premises/site must agree.
    // Same business names (or a chain's domain alone) are never sufficient.
    return (record.address && addressKey(record.address) === addressKey(partner.address)) ||
      (record.address && addressKey(record.address) === addressKey(businessAddress(partner))) ||
      (record.address && addressKey(record.address) === addressKey([partner.city, partner.address].filter(Boolean).join(', '))) ||
      (record.locationKind === 'service_area' && websiteKey(record.website) === websiteKey(partner.website_url))
  })
}

export function normalizeCatalogueBusinesses(records, intent, { now = Date.now(), partners = [] } = {}) {
  if (intent.cityCode && intent.cityCode !== '68134') return []
  return records.map(raw => approvedCatalogueRecord(raw, now)).filter(Boolean)
    .filter(row => !isCataloguePartnerDuplicate(row, partners))
    .map(row => {
      const services = row.services.filter(service => !intent.category || service.category === intent.category)
        .map((service, index) => ({ id: `${row.id}-${index}`, name: service.name, category: service.category, active: true, price: null, currency: 'EUR' }))
      const matching = matchingServices({ name: row.name, services }, intent, { reviewedCategoryEvidence: true })
      return { id: row.id, source: 'catalogue', name: row.name, category: row.category, businessCategory: row.category,
        cityCode: row.cityCode, city: 'София', neighborhood: row.neighborhood, address: row.address,
        locationKind: row.locationKind, coordinates: row.coordinates ? { latitude: row.coordinates.latitude, longitude: row.coordinates.longitude } : null,
        publicServiceNames: services.map(service => service.name), services: matching,
        website: row.website, phone: row.phone,
        booking: { ...row.booking, verified: true, checkedOn: row.verification.checkedOn, validUntil: row.verification.validUntil },
        provenance: { kind: 'first_party', sourceUrl: row.verification.booking.url, checkedOn: row.verification.checkedOn },
        photos: [], photo: row.photo ? { src: row.photo.src, alt: row.photo.alt } : null, availability: { status: 'external', slots: [] },
      }
    }).filter(row => row.services.length && matchesPartnerLocation(row, intent))
    // Unknown accessibility, payment methods or online sessions are not facts.
    .filter(() => !(intent.requirements || []).some(value => ['card', 'wheelchair', 'online'].includes(value)))
}

export function rankCatalogueBusinesses(partners, catalogue, intent, maxResults = 15) {
  const origin = intent.coordinates || discoveryDistanceOrigin({ cityCode: intent.cityCode || '68134' })
  const locatedDistance = row => distanceKm(origin, row.coordinates) ?? Infinity
  const unique = new Map()
  for (const row of [...partners, ...catalogue]) {
    if (row.source === 'gorez' && intent.date && row.availability?.status === 'none') continue
    if (!unique.has(`${row.source}:${row.id}`)) unique.set(`${row.source}:${row.id}`, {
      ...row, proximityBand: proximityBand(row.coordinates, intent), distanceKm: displayDistanceKm(distanceKm(origin, row.coordinates)),
    })
  }
  const ranked = [...unique.values()].sort((a, b) =>
    Number(a.proximityBand === 'further') - Number(b.proximityBand === 'further') ||
    (locatedDistance(a) - locatedDistance(b) || 0) ||
    Number(b.source === 'gorez') - Number(a.source === 'gorez') ||
    Number(b.booking?.kind === 'form') - Number(a.booking?.kind === 'form') ||
    a.name.localeCompare(b.name, 'bg') || a.id.localeCompare(b.id)
  )
  // Distance is primary even in empty-query browsing. Unknown points remain
  // after located premises; a partner badge never changes the actual km order.
  return ranked.slice(0, Math.min(5000, Math.max(1, maxResults)))
}

export async function searchFreeCatalogue(input, interpretation, deps) {
  const intent = { ...interpretation.intent, locale: input.locale, searchV2: true }
  const warnings = []
  const scope = nearbySearchScope(input, intent), searchIntent = scope.searchIntent
  const [internal, records] = await Promise.all([
    deps.readInternal(searchIntent).then(rows => ({ rows, ok: true })).catch(() => ({ rows: [], ok: false })),
    deps.readCatalogue().catch(() => { warnings.push('catalogue_unavailable'); return [] }),
  ])
  if (!internal.ok) warnings.push('internal_unavailable')
  const candidates = normalizeInternalBusinesses(internal.rows, searchIntent)
  // Eligibility/order must be global, not clipped to the first page. The
  // existing availability verifier still bounds live calendar checks to four.
  const partners = await verifyDiscoveryAvailability(rankCatalogueBusinesses(candidates, [], searchIntent, 5000), searchIntent, deps)
  const catalogue = normalizeCatalogueBusinesses(records, searchIntent, { now: deps.now?.toMillis?.() ?? Date.now(), partners: internal.rows })
  const ranked = rankCatalogueBusinesses(partners, catalogue, searchIntent, 5000)
  const offset = input.catalogueOffset || 0, pageSize = Math.min(15, Math.max(1, deps.config.maxResults))
  const results = ranked.slice(offset, offset + pageSize)
  const cataloguePage = { offset, total: ranked.length, nextOffset: offset + results.length < ranked.length ? offset + results.length : null }
  const externalStatus = intent.cityCode && intent.cityCode !== '68134' ? 'sofia_only' : 'catalogue'
  if (externalStatus === 'sofia_only') warnings.push('catalogue_sofia_only')
  // No Google/AI grants, provider authentication, Places calls or browser keys.
  return { intent, interpretation: interpretation.mode, results, external: null, furtherExternal: null,
    nearbyExpansion: scope.expanded ? { primaryRadiusKm: scope.primaryRadiusKm, outerRadiusKm: scope.outerRadiusKm } : null,
    appointmentClarification: intent.appointmentClarification || null, clarification: null, warnings, externalStatus,
    rankingVersion: CATALOGUE_RANKING_VERSION, checkedAt: new Date().toISOString(), cataloguePage,
  }
}
