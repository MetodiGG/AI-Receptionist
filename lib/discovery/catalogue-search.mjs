import { approvedCatalogueRecord } from './catalogue-policy.mjs'
import { normalizeSearchText } from './categories.mjs'
import { businessAddress } from '../business-location.mjs'
import { matchingServices, matchesPartnerLocation, normalizeInternalBusinesses, verifyDiscoveryAvailability } from './internal-search.mjs'
import { distanceKm, displayDistanceKm } from './distance.mjs'
import { discoveryDistanceOrigin } from './distance-origin.mjs'
import { nearbySearchScope, proximityBand } from './nearby.mjs'
import { attachSharedCataloguePhotos } from '../catalogue-shared-covers.mjs'
import { OSM_ATTRIBUTION, OSM_COPYRIGHT_URL } from './catalogue-attribution.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from './official-sofia-address-source.mjs'
import { currentPublishedFact } from './business-details.mjs'
import { catalogueServicePhotoFields, catalogueDetailsWithServicePhotos } from '../catalogue-service-photo-keys.mjs'
import { businessNameMatches, businessNameQuery, exactBusinessNameQuery } from './business-name.mjs'
import { parseIntent } from './intent.mjs'
import { discoveryCitiesInQuery } from './location-query.mjs'
import { createServiceEvidenceMatcher } from './service-lexicon.mjs'
import { CATALOGUE_MAX_SEARCH_ROWS } from './catalogue-limits.mjs'

export const CATALOGUE_RANKING_VERSION = 'sofia-reviewed-local-partner-v4'
export const LOCAL_PARTNER_PRIORITY_KM = 1
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
  const serviceEvidence = createServiceEvidenceMatcher(intent.service)
  return records.map(raw => approvedCatalogueRecord(raw, now)).filter(Boolean)
    .filter(row => !isCataloguePartnerDuplicate(row, partners))
    .map(row => {
      const services = row.services.filter(service => !intent.category || service.category === intent.category ||
        // The existing intent vocabulary files massage under Other, while a
        // reviewed massage clinic may be filed under Therapies. A specific
        // service must still pass published-text matching below; never widen
        // an explicit category browse to unrelated medical services.
        (intent.category === 'other' && service.category === 'health' && intent.browse !== true && Boolean(intent.service)))
        .map((service, index) => { const current = currentPublishedFact(service.price, now); return { id: `${row.id}-${index}`, name: service.name, description: service.description, category: service.category, active: true,
          price: current ? service.price.amount : null, currency: service.price?.currency || 'EUR', priceKind: service.price?.kind || 'fixed',
          priceMaximum: current ? service.price.maximum ?? null : null, priceUnit: current ? service.price.unit || '' : '' } })
      // The shared matching allowlist deliberately strips presentation-only
      // fields. Attach our server-reviewed local key AFTER that boundary;
      // do not widen native/externally supplied public-service fields.
      const matching = matchingServices({ name: row.name, businessCategory: row.category, services }, intent, { reviewedCategoryEvidence: true, serviceEvidence })
        .map(service => ({ ...service, ...catalogueServicePhotoFields(service, row) }))
      return { id: row.id, source: 'catalogue', name: row.name, category: row.category, businessCategory: row.category,
        cityCode: row.cityCode, city: 'София', neighborhood: row.neighborhood, address: row.address,
        locationKind: row.locationKind, coordinates: row.coordinates ? { latitude: row.coordinates.latitude, longitude: row.coordinates.longitude } : null,
        ...(row.coordinates?.method === 'verified_address_geocode' ? { coordinateAttribution: { label: OSM_ATTRIBUTION, url: OSM_COPYRIGHT_URL } } : {}),
        ...(row.coordinates?.method === 'verified_official_address' ? { coordinateAttribution: { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL } } : {}),
        publicServiceNames: row.services.map(service => service.name), services: matching, details: catalogueDetailsWithServicePhotos(row, now),
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
  const distances = new WeakMap()
  const locatedDistance = row => {
    if (!distances.has(row)) distances.set(row, distanceKm(origin, row.coordinates) ?? Infinity)
    return distances.get(row)
  }
  // A small booking-convenience preference, only relative to a permissioned
  // visitor point. City-centre distance is not the visitor's location. All
  // service/quarter/radius/availability eligibility checks still happen first.
  const localPartner = row => row.source === 'gorez' && Boolean(intent.coordinates)
    && locatedDistance(row) <= Math.min(LOCAL_PARTNER_PRIORITY_KM, intent.primaryRadiusKm ?? intent.radiusKm ?? LOCAL_PARTNER_PRIORITY_KM)
  const unique = new Map()
  for (const row of [...partners, ...catalogue]) {
    if (row.source === 'gorez' && intent.date && row.availability?.status === 'none') continue
    if (!unique.has(`${row.source}:${row.id}`)) unique.set(`${row.source}:${row.id}`, {
      ...row, proximityBand: proximityBand(row.coordinates, intent), distanceKm: displayDistanceKm(distanceKm(origin, row.coordinates)),
    })
  }
  const ranked = [...unique.values()].sort((a, b) =>
    Number(localPartner(b)) - Number(localPartner(a)) ||
    Number(a.proximityBand === 'further') - Number(b.proximityBand === 'further') ||
    (locatedDistance(a) - locatedDistance(b) || 0) ||
    Number(b.source === 'gorez') - Number(a.source === 'gorez') ||
    Number(b.booking?.kind === 'form') - Number(a.booking?.kind === 'form') ||
    a.name.localeCompare(b.name, 'bg') || a.id.localeCompare(b.id)
  )
  // Outside the bounded local-partner tier, actual distance remains primary.
  // Unknown points never gain priority or a fabricated nearby distance.
  return ranked.slice(0, Math.min(CATALOGUE_MAX_SEARCH_ROWS, Math.max(1, maxResults)))
}

export async function searchFreeCatalogue(input, interpretation, deps) {
  let intent = { ...interpretation.intent, locale: input.locale, searchV2: true }
  const clarificationReply = value => ({ intent: value, interpretation: interpretation.mode, results: [], clarification: value.clarification,
    warnings: [], externalStatus: 'not_requested', rankingVersion: CATALOGUE_RANKING_VERSION })
  if (intent.clarification && !['category', 'city'].includes(intent.clarification.field)) return clarificationReply(intent)
  const warnings = []
  let scope = nearbySearchScope(input, intent), searchIntent = scope.searchIntent
  const records = await deps.readCatalogue().catch(() => { warnings.push('catalogue_unavailable'); return [] })
  // A complete verified business name is an identity, not a bag of service
  // keywords or inferred quarters (e.g. "Учебен център ..."). Resolve only
  // an exact normalized full-name match this way; requests with extra time,
  // budget or location words still use the ordinary guarded interpretation.
  const rawNameQuery = input.browse === true ? null : exactBusinessNameQuery(input.query)
  const exactCatalogueName = rawNameQuery && records.find(row =>
    exactBusinessNameQuery(row.name) === rawNameQuery && approvedCatalogueRecord(row, deps.now?.toMillis?.() ?? Date.now()))
  // A complete reviewed name can contain several place words, e.g. a brand's
  // "Sofia" and its "Борово" branch. Resolve only that exact identity, never
  // an ordinary ambiguous location query or an explicit city/GPS filter.
  const namedCityHint = exactCatalogueName && !input.cityCode && !input.coordinates
    && discoveryCitiesInQuery(input.query).length > 0
  if (intent.clarification?.field === 'city' && !namedCityHint) return clarificationReply(intent)
  let nameQuery = exactCatalogueName ? rawNameQuery : input.browse === true ? null : businessNameQuery(intent.service || input.query)
  const applyNameIntent = parsed => {
    intent = { ...parsed, category: input.category || null, service: nameQuery, businessNameQuery: nameQuery, locale: input.locale, searchV2: true }
    scope = nearbySearchScope(input, intent); searchIntent = scope.searchIntent
  }
  if (exactCatalogueName) {
    // Only a city inferred from the complete verified name may resolve to
    // that record's actual city. Never override a manual city or GPS point,
    // and a name alone without any city still asks for a city as before.
    const namedCity = !input.cityCode && !input.coordinates && (intent.cityCode || namedCityHint) ? exactCatalogueName.cityCode : null
    const parsed = parseIntent({ ...input, query: '', ...(namedCity ? { cityCode: namedCity } : {}), category: input.category || exactCatalogueName.category }, deps.now, { v2: true })
    if (parsed.clarification) return clarificationReply({ ...parsed, locale: input.locale, searchV2: true })
    applyNameIntent(parsed)
  }
  // Read partners once in the corrected scope; a branch-name quarter must not
  // fetch another city's partners, lose duplicate suppression or lose priority.
  const internal = await deps.readInternal(searchIntent).then(rows => ({ rows, ok: true })).catch(() => ({ rows: [], ok: false }))
  if (!internal.ok) warnings.push('internal_unavailable')
  // Preserve short exact native brands too, without widening partial service
  // queries or re-reading partners in a different geographic context.
  if (!nameQuery && rawNameQuery && normalizeInternalBusinesses(internal.rows,
    { ...searchIntent, category: null, service: null, browse: true }).some(row => exactBusinessNameQuery(row.name) === rawNameQuery)) nameQuery = rawNameQuery
  if (nameQuery && !exactCatalogueName) {
    const now = deps.now?.toMillis?.() ?? Date.now()
    const namedCatalogue = records.filter(row => businessNameMatches(row.name, nameQuery)).map(row => approvedCatalogueRecord(row, now)).filter(Boolean)
    // Reuse the public/active/service guards. Never disclose an inactive or
    // unpublished account merely because its name occurs in a raw DB row.
    const namedPartners = normalizeInternalBusinesses(internal.rows, { ...searchIntent, category: null, service: null, browse: true })
      .filter(row => businessNameMatches(row.name, nameQuery))
    if (namedCatalogue.length || namedPartners.length) {
      const category = input.category || namedCatalogue[0]?.category || namedPartners[0].businessCategory
      const parsed = parseIntent({ ...input, category }, deps.now, { v2: true })
      if (parsed.clarification) return clarificationReply({ ...parsed, locale: input.locale, searchV2: true })
      applyNameIntent(parsed)
    }
  }
  if (intent.clarification) return clarificationReply(intent)
  const candidates = normalizeInternalBusinesses(internal.rows, searchIntent)
  // Eligibility/order must be global, not clipped to the first page. The
  // existing availability verifier still bounds live calendar checks to four.
  const partners = await verifyDiscoveryAvailability(rankCatalogueBusinesses(candidates, [], searchIntent, CATALOGUE_MAX_SEARCH_ROWS), searchIntent, deps)
  const catalogue = normalizeCatalogueBusinesses(records, searchIntent, { now: deps.now?.toMillis?.() ?? Date.now(), partners: internal.rows })
  const ranked = rankCatalogueBusinesses(partners, catalogue, searchIntent, CATALOGUE_MAX_SEARCH_ROWS)
  const offset = input.catalogueOffset || 0, pageSize = Math.min(15, Math.max(1, deps.config.maxResults))
  let results = ranked.slice(offset, offset + pageSize)
  // One bounded metadata read for this page, never one call per card. Photo
  // storage outages must not disable otherwise valid catalogue/booking results.
  if (deps.readCataloguePhotos) {
    try { results = attachSharedCataloguePhotos(results, await deps.readCataloguePhotos(results.filter(row => row.source === 'catalogue').map(row => row.id))) }
    catch { deps.log?.({ status: 'catalogue_photos_unavailable' }) }
  }
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
