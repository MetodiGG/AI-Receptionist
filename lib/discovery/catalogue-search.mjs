import { approvedCatalogueRecord, cataloguePublishedServiceIndex } from './catalogue-policy.mjs'
import { normalizeSearchText } from './categories.mjs'
import { businessAddress, findCity } from '../business-location.mjs'
import { catalogueCity } from './catalogue-cities.mjs'
import { catalogueProvenance } from './catalogue-provenance.mjs'
import { matchingServices, matchesPartnerLocation, normalizeInternalBusinesses, verifyDiscoveryAvailability } from './internal-search.mjs'
import { distanceKm, displayDistanceKm } from './distance.mjs'
import { discoveryDistanceOrigin } from './distance-origin.mjs'
import { nearbySearchScope, proximityBand } from './nearby.mjs'
import { attachSharedCataloguePhotos } from '../catalogue-shared-covers.mjs'
import { OSM_ATTRIBUTION, OSM_COPYRIGHT_URL } from './catalogue-attribution.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from './official-sofia-address-source.mjs'
import { catalogueReviewDay, currentPublishedFact } from './business-details.mjs'
import { catalogueServicePhotoFields, catalogueDetailsWithServicePhotos } from '../catalogue-service-photo-keys.mjs'
import { businessNameMatches, businessNameQuery, exactBusinessNameQuery } from './business-name.mjs'
import { parseIntent } from './intent.mjs'
import { discoveryCitiesInQuery } from './location-query.mjs'
import { createServiceEvidenceMatcher, identifySearchService, isGenericSearchService, serviceSearchPhrase } from './service-lexicon.mjs'
import { CATALOGUE_MAX_SEARCH_ROWS } from './catalogue-limits.mjs'
import { normalizedSearchKey, searchTextEvidence } from './text-match.mjs'
import { createBusinessSearchRelevance } from './relevance.mjs'
import { filterBusinessesBySubcategory, subcategoryOptionsForBusinesses } from './subcategories.mjs'
import { businessActivityPhotoKey } from '../business-cover-photo.mjs'
import { cataloguePublicLocation } from './catalogue-public-location.mjs'
import { isSofiaDiscoveryBusiness } from '../sofia-location-scope.mjs'

export const CATALOGUE_RANKING_VERSION = 'sofia-reviewed-local-partner-v5-subcategories'
export const LOCAL_PARTNER_PRIORITY_KM = 1
const phoneKey = value => String(value || '').replace(/[^+\d]/g, '').replace(/^0(?=\d{8,9}$)/, '+359')
const addressKey = value => normalizeSearchText(value).replace(/[^\p{L}\p{N}]/gu, '')
function websiteKey(value) { try { const url = new URL(value); return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}` } catch { return '' } }
const serviceIndexes = new WeakMap()
const activityPhotoIndexes = new WeakMap()
const catalogueLocality = new WeakMap()
function isSofiaCatalogueRecord(row) {
  // Static, frozen catalogue records cannot move without a new object.
  // Never cache a live partner record or a mutable injected catalogue row.
  if (!row || typeof row !== 'object' || !Object.isFrozen(row)) return isSofiaDiscoveryBusiness(row)
  let accepted = catalogueLocality.get(row)
  if (accepted === undefined) {
    accepted = isSofiaDiscoveryBusiness(row)
    catalogueLocality.set(row, accepted)
  }
  return accepted
}
function catalogueActivityPhotoKey(row) {
  if(!row)return null
  if(Object.isFrozen(row)&&activityPhotoIndexes.has(row))return activityPhotoIndexes.get(row)
  const key=businessActivityPhotoKey({...row,businessCategory:row.category,source:'catalogue',
    services:row.services.map(service=>({...service,...catalogueServicePhotoFields(service,row)}))})
  if(Object.isFrozen(row))activityPhotoIndexes.set(row,key)
  return key
}
function catalogueSearchServices(row, now, day) {
  const previous = serviceIndexes.get(row)
  if (Object.isFrozen(row) && previous?.day === day) return previous.services
  const services = row.services.map((service, index) => { const current = currentPublishedFact(service.price, now); return { id: `${row.id}-${cataloguePublishedServiceIndex(row, index)}`, name: service.name, description: service.description, category: service.category, active: true,
    price: current ? service.price.amount : null, currency: service.price?.currency || 'EUR', priceKind: service.price?.kind || 'fixed',
    duration_min: service.durationMin && currentPublishedFact({ sourceUrl: service.durationSourceUrl, checkedOn: service.durationCheckedOn }, now) ? service.durationMin : undefined,
    priceMaximum: current ? service.price.maximum ?? null : null, priceUnit: current ? service.price.unit || '' : '' } })
  // Cache public immutable facts, not user queries or locations. Date changes
  // revalidate expiry; mutable/test/runtime records are deliberately uncached.
  if (Object.isFrozen(row) && Object.isFrozen(row.services) && row.services.every(Object.isFrozen)) {
    services.forEach(Object.freeze); Object.freeze(services); serviceIndexes.set(row, { day, services })
  }
  return services
}

export function isCataloguePartnerDuplicate(record, partners) {
  return cataloguePartnerMatcher(partners)(record)
}

export function cataloguePartnerMatcher(partners) {
  // Build once per current partner snapshot, not once per catalogue row. The
  // landing list still reads fresh partners before deduplication and counting.
  const ids = new Set(), byPhone = new Map()
  for (const partner of partners) {
    ids.add(partner.id)
    const phone = phoneKey(partner.phone)
    if (!phone) continue
    const matches = byPhone.get(phone) || []
    matches.push({ partner, cityCode: findCity(partner.cityCode || partner.city_ekatte)?.code })
    byPhone.set(phone, matches)
  }
  return record => {
    if (record.gorezBusinessId && ids.has(record.gorezBusinessId)) return true
    if (!byPhone.size) return false
    const matches = byPhone.get(phoneKey(record.phone))
    if (!matches) return false
    let address
    return matches.some(({ partner, cityCode }) => {
      if (cityCode && cityCode !== record.cityCode) return false
      // Both independently verified contact and exact premises/site must agree.
      // Same business names (or a chain's domain alone) are never sufficient.
      if (record.address) {
        address ??= addressKey(record.address)
        if (address === addressKey(partner.address) || address === addressKey(businessAddress(partner)) ||
          address === addressKey([partner.city, partner.address].filter(Boolean).join(', '))) return true
      }
      return record.locationKind === 'service_area' && websiteKey(record.website) === websiteKey(partner.website_url)
    })
  }
}

export function normalizeCatalogueBusinesses(records, intent, { now = Date.now(), partners = [], includeDetails = true, includeServicePhotoFields = true } = {}) {
  if (intent.cityCode && !catalogueCity(intent.cityCode)) return []
  const serviceEvidence = createServiceEvidenceMatcher(intent.service)
  const day = catalogueReviewDay(now)
  if (!day) return []
  const duplicatesPartner = cataloguePartnerMatcher(partners)
  const crossCategory = intent.searchV2 && intent.categoryFilter !== true && intent.browse !== true && !isGenericSearchService(intent.service, intent.category)
  return records.map(raw => approvedCatalogueRecord(raw, now)).filter(Boolean)
    .filter(row => !intent.cityCode || row.cityCode === intent.cityCode)
    .filter(row => intent.sofiaOnly !== true || isSofiaCatalogueRecord(row))
    .filter(row => !duplicatesPartner(row))
    .map(row => {
      const services = catalogueSearchServices(row, now, day)
        // Assign IDs BEFORE filtering. The same real inventory item retains
        // its identifier across a category filter or service search.
        .filter(service => !intent.category || service.category === intent.category || crossCategory ||
          (intent.category === 'other' && service.category === 'health' && intent.browse !== true && Boolean(intent.service)))
      // The shared matching allowlist deliberately strips presentation-only
      // fields. Attach our server-reviewed local key AFTER that boundary;
      // do not widen native/externally supplied public-service fields.
      const matching = matchingServices({ name: row.name, address: row.address, neighborhood: row.neighborhood, businessCategory: row.category, services }, intent, { reviewedCategoryEvidence: true, serviceEvidence })
      if (!matching.length) return null
      return { id: row.id, source: 'catalogue', name: row.name, category: row.category, businessCategory: row.category,
        cityCode: row.cityCode, city: findCity(row.cityCode)?.name || '', neighborhood: row.neighborhood, address: row.address,
        locationKind: row.locationKind, ...cataloguePublicLocation(row),
        ...(row.coordinates?.method === 'verified_address_geocode' ? { coordinateAttribution: { label: OSM_ATTRIBUTION, url: OSM_COPYRIGHT_URL } } : {}),
        ...(row.coordinates?.method === 'verified_official_address' ? { coordinateAttribution: { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL } } : {}),
        publicServiceNames: row.services.map(service => service.name),
        services: includeServicePhotoFields ? matching.map(service => ({ ...service, ...catalogueServicePhotoFields(service, row) })) : matching,
        ...(includeDetails ? { details: catalogueDetailsWithServicePhotos(row, now), illustrativeCoverPhotoKey: catalogueActivityPhotoKey(row) } : {}),
        website: row.website, phone: row.phone,
        booking: { ...row.booking, verified: true, checkedOn: row.verification.checkedOn, validUntil: row.verification.validUntil },
        provenance: catalogueProvenance(row),
        photos: [], photo: row.photo ? { src: row.photo.src, alt: row.photo.alt } : null, availability: { status: 'external', slots: [] },
      }
    }).filter(row => row && matchesPartnerLocation(row, intent))
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
  const relevanceOf = createBusinessSearchRelevance(intent)
  for (const row of [...partners, ...catalogue]) {
    if (!unique.has(`${row.source}:${row.id}`)) unique.set(`${row.source}:${row.id}`, {
      ...row, proximityBand: proximityBand(row.coordinates, intent), distanceKm: displayDistanceKm(distanceKm(origin, row.coordinates)),
      relevance: relevanceOf(row),
    })
  }
  const ranked = [...unique.values()].sort((a, b) =>
    b.relevance.tier - a.relevance.tier ||
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
  const scopeFlags = deps.sofiaOnly ? { sofiaOnly: true } : {}
  let intent = { ...interpretation.intent, ...scopeFlags, locale: input.locale, searchV2: true, categoryFilter: Boolean(input.category) }
  const clarificationReply = value => ({ intent: value, interpretation: interpretation.mode, results: [], exactTotal: null, clarification: value.clarification,
    warnings: [], externalStatus: 'not_requested', rankingVersion: CATALOGUE_RANKING_VERSION })
  if (intent.clarification && !['category', 'city'].includes(intent.clarification.field)) return clarificationReply(intent)
  const warnings = []
  let scope = nearbySearchScope(input, intent), searchIntent = scope.searchIntent
  let catalogueComplete = true
  const records = (await deps.readCatalogue().catch(() => { catalogueComplete = false; warnings.push('catalogue_unavailable'); return [] }))
    .filter(row => !deps.sofiaOnly || isSofiaCatalogueRecord(row))
  // One catalogue snapshot for matching, totals and detail hydration. A
  // request spanning midnight must not pair old matches with a new menu.
  const now = deps.now?.toMillis?.() ?? Date.now()
  // A complete verified business name is an identity, not a bag of service
  // keywords or inferred quarters (e.g. "Учебен център ..."). Resolve only
  // an exact normalized full-name match this way; requests with extra time,
  // budget or location words still use the ordinary guarded interpretation.
  const rawNameQuery = input.browse === true ? null : exactBusinessNameQuery(input.query)
  const exactCatalogueName = rawNameQuery && records.find(row =>
    exactBusinessNameQuery(row.name) === rawNameQuery && approvedCatalogueRecord(row, now))
  // A complete reviewed name can contain several place words, e.g. a brand's
  // "Sofia" and its "Борово" branch. Resolve only that exact identity, never
  // an ordinary ambiguous location query or an explicit city/GPS filter.
  const namedCityHint = exactCatalogueName && !input.cityCode && !input.coordinates
    && discoveryCitiesInQuery(input.query).length > 0
  if (intent.clarification?.field === 'city' && !namedCityHint) return clarificationReply(intent)
  let nameQuery = exactCatalogueName ? rawNameQuery : input.browse === true ? null : businessNameQuery(intent.service || input.query)
  const applyNameIntent = parsed => {
    intent = { ...parsed, ...scopeFlags, category: input.category || null, categoryFilter: Boolean(input.category), service: nameQuery, businessNameQuery: nameQuery, locale: input.locale, searchV2: true }
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
  const internal = await deps.readInternal(searchIntent, { fresh: true }).then(rows => ({ rows, ok: true })).catch(() => ({ rows: [], ok: false }))
  if (!internal.ok) warnings.push('internal_unavailable')
  // Preserve short exact native brands too, without widening partial service
  // queries or re-reading partners in a different geographic context.
  if (rawNameQuery && !exactCatalogueName && (
    records.some(raw => { const row = approvedCatalogueRecord(raw, now); return row && businessNameMatches(row.name, rawNameQuery) }) ||
    normalizeInternalBusinesses(internal.rows, { ...searchIntent, category: null, categoryFilter: false, service: null, browse: true, businessNameQuery: rawNameQuery })
      .some(row => businessNameMatches(row.name, rawNameQuery)))) nameQuery = rawNameQuery
  if (nameQuery && !exactCatalogueName) {
    const fuzzy = !identifySearchService(input.query) && normalizedSearchKey(nameQuery).length >= 6
    const matchesName = row => businessNameMatches(row.name, nameQuery) || fuzzy && searchTextEvidence(row.name, nameQuery)?.kind === 'typo'
    const namedCatalogue = records.filter(matchesName).map(row => approvedCatalogueRecord(row, now)).filter(Boolean)
    // Reuse the public/active/service guards. Never disclose an inactive or
    // unpublished account merely because its name occurs in a raw DB row.
    const namedPartners = normalizeInternalBusinesses(internal.rows, { ...searchIntent, category: null, categoryFilter: false, service: null, browse: true, businessNameQuery: nameQuery, businessNameFuzzy: fuzzy })
      .filter(matchesName)
    if (namedCatalogue.length || namedPartners.length) {
      const category = input.category || namedCatalogue[0]?.category || namedPartners[0].businessCategory
      const parsed = parseIntent({ ...input, category }, deps.now, { v2: true })
      if (parsed.clarification) return clarificationReply({ ...parsed, locale: input.locale, searchV2: true })
      applyNameIntent(parsed)
      intent.businessNameFuzzy = fuzzy
      scope = nearbySearchScope(input, intent); searchIntent = scope.searchIntent
    }
  }
  if (intent.clarification?.field === 'category' && !input.category && !identifySearchService(input.query) && businessNameQuery(input.query)) {
    // New service names need not be pre-programmed in a taxonomy. Resolve only
    // literal evidence in the actual public inventory; unknown text still has
    // no invented result. Address-only discovery shows a business's real menu.
    const literal = serviceSearchPhrase(input.query, null, intent)
    const broad = { ...searchIntent, category: null, categoryFilter: false, service: literal, businessNameQuery: null, browse: false }
    const serviceMatch = literal && (normalizeInternalBusinesses(internal.rows, broad).length || normalizeCatalogueBusinesses(records, broad, { now, includeDetails: false, includeServicePhotoFields: false }).length)
    const addressMatch = !serviceMatch && literal && (
      normalizeInternalBusinesses(internal.rows, { ...broad, browse: true }).some(row => searchTextEvidence(`${row.address || ''} ${row.neighborhood || ''}`, literal, { fuzzy: false })) ||
      records.some(raw => { const row = approvedCatalogueRecord(raw, now); return row && searchTextEvidence(`${row.address || ''} ${row.neighborhood || ''}`, literal, { fuzzy: false }) }))
    if (serviceMatch || addressMatch) {
      const parsed = parseIntent({ ...input, category: 'other' }, deps.now, { v2: true })
      if (parsed.clarification) return clarificationReply({ ...parsed, locale: input.locale, searchV2: true })
      intent = { ...parsed, ...scopeFlags, category: null, categoryFilter: false, service: literal, ...(addressMatch ? { addressQuery: literal } : {}), locale: input.locale, searchV2: true }
      scope = nearbySearchScope(input, intent); searchIntent = scope.searchIntent
    }
  }
  if (intent.clarification) return clarificationReply(intent)
  // Facets describe the complete eligible parent-category inventory in this
  // location/query scope, not just page one or the currently selected child.
  // Counts describe businesses, never verified appointment availability.
  const parentIntent = input.subcategory ? { ...searchIntent, subcategory: null } : searchIntent
  const candidates = normalizeInternalBusinesses(internal.rows, parentIntent)
  // Eligibility/order must be global, not clipped to the first page. The
  // existing availability verifier still bounds live calendar checks to four.
  // Picture IDs are presentation fields, not inputs to matching, facets or
  // ranking. Keep off-page service rows lean and restore the same fields below.
  const catalogue = normalizeCatalogueBusinesses(records, parentIntent, { now, partners: internal.rows, includeDetails: false, includeServicePhotoFields: false })
  const subcategoryOptions = subcategoryOptionsForBusinesses([...candidates,...catalogue], searchIntent.category, input.locale)
  const selectedPartners = filterBusinessesBySubcategory(candidates,input.subcategory)
  const selectedCatalogue = filterBusinessesBySubcategory(catalogue,input.subcategory)
  const eligible = [...selectedPartners, ...selectedCatalogue]
  const uniqueCount = new Set(eligible.map(row => `${row.source}:${row.id}`)).size
  const ranked = rankCatalogueBusinesses(selectedPartners, selectedCatalogue, searchIntent, CATALOGUE_MAX_SEARCH_ROWS)
  // This is a count of matching public businesses, never available slots.
  // It needs complete current source snapshots and an unclipped global rank.
  // Dated native searches perform bounded calendar verification only; do not
  // imply that a global date/availability count has been verified.
  let exactCount = catalogueComplete && internal.ok && eligible.every(row => Boolean(row.id))
    && uniqueCount === ranked.length && !(searchIntent.date && selectedPartners.length)
  const offset = input.catalogueOffset || 0, pageSize = Math.min(15, Math.max(1, deps.config.maxResults))
  let results = ranked.slice(offset, offset + pageSize)
  const consumed = results.length
  const pageIds = new Set(results.map(row => `${row.source}:${row.id}`))
  // Catalogue photos and native detail/availability checks do not depend on
  // one another. Start the bounded read for this page now, but only attach
  // photos to the final set of eligible results after all checks complete.
  const photoIds = results.filter(row => row.source === 'catalogue').map(row => row.id)
  const photoWork = deps.readCataloguePhotos && photoIds.length
    ? Promise.resolve().then(() => deps.readCataloguePhotos(photoIds)).then(photos => ({ photos }), () => null)
    : null
  if (deps.hydrateInternalCandidates && results.some(row => row.source === 'gorez')) {
    try {
      const current = await deps.hydrateInternalCandidates(results.filter(row => row.source === 'gorez').map(row => row.id))
      const visible = new Map(filterBusinessesBySubcategory(normalizeInternalBusinesses(current, searchIntent),input.subcategory).map(row => [row.id, row]))
      results = results.flatMap(row => row.source === 'gorez' ? (visible.has(row.id) ? [{ ...row, ...visible.get(row.id) }] : []) : [row])
    } catch {
      // Do not disclose a stale/revoked native profile from the short index.
      results = results.filter(row => row.source !== 'gorez'); warnings.push('internal_unavailable')
    }
  }
  const checkedPartners = await verifyDiscoveryAvailability(results.filter(row => row.source === 'gorez'), searchIntent, deps)
  const verified = new Map(checkedPartners.map(row => [row.id, row]))
  const returnedCatalogueIds = new Set(results.filter(row => row.source === 'catalogue').map(row => row.id))
  const sourceRows = new Map(records.filter(row => returnedCatalogueIds.has(row.id)).map(raw => approvedCatalogueRecord(raw, now)).filter(Boolean).map(row => [row.id, row]))
  results = results.flatMap(row => {
    if (row.source === 'gorez') return verified.has(row.id) ? [{ ...row, ...verified.get(row.id) }] : []
    const source = sourceRows.get(row.id)
    return source ? [{ ...row, services: row.services.map(service => ({ ...service, ...catalogueServicePhotoFields(service, source) })),
      details: catalogueDetailsWithServicePhotos(source, now), illustrativeCoverPhotoKey: catalogueActivityPhotoKey(source) }] : []
  })
  // A publication/service change or a hydration failure after the snapshot
  // makes its total uncertain. Keep the safe cards and cursor, not a false
  // exact number obtained by subtracting only this page's known removals.
  if (results.length !== pageIds.size || results.some(row => !pageIds.has(`${row.source}:${row.id}`))) exactCount = false
  const exactTotal = exactCount ? ranked.length : null
  // One bounded metadata read for this page, never one call per card. Photo
  // storage outages must not disable otherwise valid catalogue/booking results.
  if (photoWork) {
    try {
      const photoResult = await photoWork
      if (photoResult) results = attachSharedCataloguePhotos(results, photoResult.photos)
      else deps.log?.({ status: 'catalogue_photos_unavailable' })
    } catch { deps.log?.({ status: 'catalogue_photos_unavailable' }) }
  }
  const cataloguePage = { offset, total: ranked.length, nextOffset: offset + consumed < ranked.length ? offset + consumed : null }
  const externalStatus = intent.cityCode && !catalogueCity(intent.cityCode) ? 'sofia_only' : 'catalogue'
  if (externalStatus === 'sofia_only') warnings.push('catalogue_sofia_only')
  // No Google/AI grants, provider authentication, Places calls or browser keys.
  return { intent, interpretation: interpretation.mode, results, exactTotal, external: null, furtherExternal: null,
    nearbyExpansion: scope.expanded ? { primaryRadiusKm: scope.primaryRadiusKm, outerRadiusKm: scope.outerRadiusKm } : null,
    appointmentClarification: intent.appointmentClarification || null, clarification: null, warnings, externalStatus,
    rankingVersion: CATALOGUE_RANKING_VERSION, checkedAt: new Date().toISOString(), cataloguePage, subcategoryOptions,
  }
}
