import { discoveryRequestSchema } from './intent.mjs'
import { interpretDiscoveryIntent } from './ai-intent.mjs'
import { normalizeInternalBusinesses, verifyDiscoveryAvailability } from './internal-search.mjs'
import { searchGooglePlaces } from './google-places.mjs'
import { rankDiscoveryResults, RANKING_VERSION } from './ranking.mjs'
import { nearbySearchScope, partitionNearbyPlaceIds } from './nearby.mjs'
import { prioritizeVerifiedBookingIds } from './rail.mjs'
import { googleCardVariantEnabled, signGoogleCardTicket } from './google-card-ticket.mjs'
import { approvedExternalLink } from '../outbound-booking.mjs'
import { publicPartnerPlaceExclusions } from './partner-place-exclusions.mjs'
import { searchFreeCatalogue, CATALOGUE_RANKING_VERSION } from './catalogue-search.mjs'
import { readSofiaCatalogue } from './sofia-catalogue.mjs'
import { z } from 'zod'

export async function discoverBusinesses(raw, deps) {
  const input = discoveryRequestSchema.parse(raw)
  const catalogueMode = deps.config.providerMode === 'catalogue'
  if (!catalogueMode && input.catalogueOffset !== undefined) throw new z.ZodError([{ code: 'custom', path: ['catalogueOffset'], message: 'Pagination is available only for the free catalogue' }])
  const interpretation = await interpretDiscoveryIntent(input, catalogueMode ? { ...deps, config: { ...deps.config, aiEnabled: false, searchV2Enabled: true } } : deps)
  const intent = { ...interpretation.intent, locale: input.locale, searchV2: deps.config.searchV2Enabled === true }
  // The owned catalogue can resolve an actual business name without a model.
  // It must first revalidate scheduling/location, not erase ambiguity blindly.
  if (catalogueMode) return searchFreeCatalogue(input, interpretation, { ...deps, readCatalogue: deps.readCatalogue || readSofiaCatalogue })
  if (intent.clarification) {
    if (deps.config.environment !== 'production') deps.diagnostic?.({ stage: 'clarification', field: intent.clarification.field, providerRequests: 0 })
    return { intent, interpretation: interpretation.mode, results: [], clarification: intent.clarification, warnings: [], externalStatus: 'not_requested', rankingVersion: catalogueMode ? CATALOGUE_RANKING_VERSION : RANKING_VERSION }
  }
  const scope = nearbySearchScope(input, intent), searchIntent = scope.searchIntent
  const warnings = interpretation.warning ? [interpretation.warning] : []
  const [catalogue, google] = await Promise.all([
    deps.readInternal(searchIntent).then(rows => ({ rows, ok: true })).catch(() => ({ rows: [], ok: false })),
    searchGooglePlaces(searchIntent, deps),
  ])
  if (!catalogue.ok) warnings.push('internal_unavailable')
  if (catalogue.rows.length === 100) warnings.push('internal_limit')
  const googleIds = google.placeIds || google.results.map(row => row.placeId)
  let partnerPlaceIds = new Set()
  if (googleIds.length && deps.readPartnerPlaces) {
    try { partnerPlaceIds = publicPartnerPlaceExclusions(await deps.readPartnerPlaces(googleIds.slice(0, 20)), googleIds) }
    catch { warnings.push('matching_unavailable') }
  }
  const candidates = rankDiscoveryResults(normalizeInternalBusinesses(catalogue.rows, searchIntent, { diagnostic: deps.config.environment !== 'production' ? deps.diagnostic : undefined }), [], searchIntent, { maxResults: deps.config.uiKitEnabled ? Math.min(6, deps.config.maxResults) : deps.config.maxResults })
  const internal = await verifyDiscoveryAvailability(candidates, searchIntent, deps)
  let links = []
  if (internal.length && (google.results.length || google.placeIds?.length)) {
    try { links = await deps.readLinks(internal.map(row => row.id)) } catch { warnings.push('matching_unavailable') }
  }
  let results = rankDiscoveryResults(internal, google.results.filter(row => !partnerPlaceIds.has(row.placeId)), searchIntent, { links, maxResults: deps.config.maxResults })
  let external = null, furtherExternal = null, externalStatus = google.status
  if (google.status === 'ui_kit') {
    const groups = partitionNearbyPlaceIds(google, scope)
    groups.nearby = groups.nearby.filter(id => !partnerPlaceIds.has(id))
    groups.further = groups.further.filter(id => !partnerPlaceIds.has(id))
    let bookingLinks = []
    if (deps.readBookablePlaces && google.placeIds?.length) {
      try {
        bookingLinks = await deps.readBookablePlaces(google.placeIds.slice(0, 20))
        groups.nearby = prioritizeVerifiedBookingIds(groups.nearby, bookingLinks)
        groups.further = prioritizeVerifiedBookingIds(groups.further, bookingLinks)
      } catch { /* Unknown booking convenience cannot change relevance/order. */ }
    }
    const nearbyPartners = results.filter(row => row.proximityBand !== 'further')
    const nearBusinessIds = new Set(nearbyPartners.map(row => row.id))
    const nearLinkedIds = new Set(links.filter(link => nearBusinessIds.has(link.business_id)).map(link => link.place_id))
    const placeIds = groups.nearby.filter(id => !nearLinkedIds.has(id)).slice(0, Math.max(0, deps.config.maxResults - nearbyPartners.length))
    const visibleNearIds = new Set(placeIds)
    const conflictingFarPartners = new Set(links.filter(link => visibleNearIds.has(link.place_id)).map(link => link.business_id))
    const fartherPartners = results.filter(row => row.proximityBand === 'further' && !conflictingFarPartners.has(row.id)).slice(0, Math.max(0, deps.config.maxResults - nearbyPartners.length - placeIds.length))
    results = [...nearbyPartners, ...fartherPartners]
    const visiblePartners = new Set(results.map(row => row.id))
    const linkedIds = new Set(links.filter(link => visiblePartners.has(link.business_id)).map(link => link.place_id))
    const furtherIds = groups.further.filter(id => !linkedIds.has(id) && !visibleNearIds.has(id)).slice(0, Math.max(0, deps.config.maxResults - results.length - placeIds.length))
    // Each native widget needs its own budget reservation. The farther widget
    // is mounted only after intentional scrolling/Show more. Reserving early
    // overcounts unused grants conservatively; it never raises the budget.
    const cardsEnabled = googleCardVariantEnabled(deps.config)
    const plan = ids => cardsEnabled ? { mode: 'ui_kit_cards', placeIds: ids, locale: input.locale, cards: ids.map(placeId => {
      const booking = bookingLinks.find(row => row.place_id === placeId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id || '') && approvedExternalLink(row))
      return { placeId, ticket: signGoogleCardTicket(placeId, input.locale, deps.config), ...(booking ? { bookingLinkId: booking.id } : {}) }
    }) } : { mode: 'ui_kit', placeIds: ids, browserKey: deps.config.browserKey, locale: input.locale }
    // The optional individual-card mode claims on EACH visible widget mount,
    // not here. No batch-list reservation or speculative hidden-card charge.
    if (placeIds.length && (cardsEnabled || await deps.claimBudget('google', 'ui_list'))) external = plan(placeIds)
    else if (placeIds.length) externalStatus = 'quota'
    if (furtherIds.length && (cardsEnabled || await deps.claimBudget('google', 'ui_list'))) furtherExternal = plan(furtherIds)
    else if (furtherIds.length) warnings.push('expansion_quota')
    if (!placeIds.length && !furtherIds.length) externalStatus = 'ok'
  }
  // Test/development-only aggregate observations: no query, health text,
  // coordinates, names, provider payloads, contacts or credentials.
  if (deps.config.environment !== 'production') deps.diagnostic?.({ stage: 'results', internalCandidates: catalogue.rows.length, internalEligible: candidates.length, internalAfterAvailability: internal.length, googleCandidates: google.placeIds?.length ?? google.results.length, finalInternal: results.filter(row => row.source === 'gorez').length, finalExternal: external || furtherExternal ? (external?.placeIds.length || 0) + (furtherExternal?.placeIds.length || 0) : results.filter(row => row.source === 'google').length, externalStatus, warnings: [...warnings] })
  const nearbyExpansion = scope.expanded ? { primaryRadiusKm: scope.primaryRadiusKm, outerRadiusKm: scope.outerRadiusKm } : null
  return { intent, interpretation: interpretation.mode, results, external, furtherExternal, nearbyExpansion, appointmentClarification: intent.appointmentClarification || null, clarification: null, warnings, externalStatus, rankingVersion: RANKING_VERSION, checkedAt: new Date().toISOString() }
}
