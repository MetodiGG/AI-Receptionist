import { discoveryRequestSchema } from './intent.mjs'
import { interpretDiscoveryIntent } from './ai-intent.mjs'
import { normalizeInternalBusinesses, verifyDiscoveryAvailability } from './internal-search.mjs'
import { searchGooglePlaces } from './google-places.mjs'
import { rankDiscoveryResults, RANKING_VERSION } from './ranking.mjs'
import { nearbySearchScope, partitionNearbyPlaceIds } from './nearby.mjs'

export async function discoverBusinesses(raw, deps) {
  const input = discoveryRequestSchema.parse(raw)
  const interpretation = await interpretDiscoveryIntent(input, deps)
  const intent = { ...interpretation.intent, locale: input.locale, searchV2: deps.config.searchV2Enabled === true }
  if (intent.clarification) {
    if (deps.config.environment !== 'production') deps.diagnostic?.({ stage: 'clarification', field: intent.clarification.field, providerRequests: 0 })
    return { intent, interpretation: interpretation.mode, results: [], clarification: intent.clarification, warnings: [], externalStatus: 'not_requested', rankingVersion: RANKING_VERSION }
  }
  const scope = nearbySearchScope(input, intent), searchIntent = scope.searchIntent
  const warnings = interpretation.warning ? [interpretation.warning] : []
  const [catalogue, google] = await Promise.all([
    deps.readInternal(searchIntent).then(rows => ({ rows, ok: true })).catch(() => ({ rows: [], ok: false })),
    searchGooglePlaces(searchIntent, deps),
  ])
  if (!catalogue.ok) warnings.push('internal_unavailable')
  if (catalogue.rows.length === 100) warnings.push('internal_limit')
  const candidates = rankDiscoveryResults(normalizeInternalBusinesses(catalogue.rows, searchIntent, { diagnostic: deps.config.environment !== 'production' ? deps.diagnostic : undefined }), [], searchIntent, { maxResults: deps.config.uiKitEnabled ? Math.min(6, deps.config.maxResults) : deps.config.maxResults })
  const internal = await verifyDiscoveryAvailability(candidates, searchIntent, deps)
  let links = []
  if (internal.length && (google.results.length || google.placeIds?.length)) {
    try { links = await deps.readLinks(internal.map(row => row.id)) } catch { warnings.push('matching_unavailable') }
  }
  let results = rankDiscoveryResults(internal, google.results, searchIntent, { links, maxResults: deps.config.maxResults })
  let external = null, furtherExternal = null, externalStatus = google.status
  if (google.status === 'ui_kit') {
    const groups = partitionNearbyPlaceIds(google, scope)
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
    const plan = ids => ({ mode: 'ui_kit', placeIds: ids, browserKey: deps.config.browserKey, locale: input.locale })
    if (placeIds.length && await deps.claimBudget('google', 'ui_list')) external = plan(placeIds)
    else if (placeIds.length) externalStatus = 'quota'
    if (furtherIds.length && await deps.claimBudget('google', 'ui_list')) furtherExternal = plan(furtherIds)
    else if (furtherIds.length) warnings.push('expansion_quota')
    if (!placeIds.length && !furtherIds.length) externalStatus = 'ok'
  }
  // Test/development-only aggregate observations: no query, health text,
  // coordinates, names, provider payloads, contacts or credentials.
  if (deps.config.environment !== 'production') deps.diagnostic?.({ stage: 'results', internalCandidates: catalogue.rows.length, internalEligible: candidates.length, internalAfterAvailability: internal.length, googleCandidates: google.placeIds?.length ?? google.results.length, finalInternal: results.filter(row => row.source === 'gorez').length, finalExternal: external || furtherExternal ? (external?.placeIds.length || 0) + (furtherExternal?.placeIds.length || 0) : results.filter(row => row.source === 'google').length, externalStatus, warnings: [...warnings] })
  const nearbyExpansion = scope.expanded ? { primaryRadiusKm: scope.primaryRadiusKm, outerRadiusKm: scope.outerRadiusKm } : null
  return { intent, interpretation: interpretation.mode, results, external, furtherExternal, nearbyExpansion, appointmentClarification: intent.appointmentClarification || null, clarification: null, warnings, externalStatus, rankingVersion: RANKING_VERSION, checkedAt: new Date().toISOString() }
}
