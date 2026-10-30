import { discoveryRequestSchema } from './intent.mjs'
import { interpretDiscoveryIntent } from './ai-intent.mjs'
import { normalizeInternalBusinesses, verifyDiscoveryAvailability } from './internal-search.mjs'
import { searchGooglePlaces } from './google-places.mjs'
import { rankDiscoveryResults, RANKING_VERSION } from './ranking.mjs'

export async function discoverBusinesses(raw, deps) {
  const input = discoveryRequestSchema.parse(raw)
  const interpretation = await interpretDiscoveryIntent(input, deps)
  const intent = { ...interpretation.intent, locale: input.locale, searchV2: deps.config.searchV2Enabled === true }
  if (intent.clarification) {
    if (deps.config.environment !== 'production') deps.diagnostic?.({ stage: 'clarification', field: intent.clarification.field, providerRequests: 0 })
    return { intent, interpretation: interpretation.mode, results: [], clarification: intent.clarification, warnings: [], externalStatus: 'not_requested', rankingVersion: RANKING_VERSION }
  }
  const warnings = interpretation.warning ? [interpretation.warning] : []
  const [catalogue, google] = await Promise.all([
    deps.readInternal(intent).then(rows => ({ rows, ok: true })).catch(() => ({ rows: [], ok: false })),
    searchGooglePlaces(intent, deps),
  ])
  if (!catalogue.ok) warnings.push('internal_unavailable')
  if (catalogue.rows.length === 100) warnings.push('internal_limit')
  const candidates = rankDiscoveryResults(normalizeInternalBusinesses(catalogue.rows, intent, { diagnostic: deps.config.environment !== 'production' ? deps.diagnostic : undefined }), [], intent, { maxResults: deps.config.uiKitEnabled ? Math.min(6, deps.config.maxResults) : deps.config.maxResults })
  const internal = await verifyDiscoveryAvailability(candidates, intent, deps)
  let links = []
  if (internal.length && (google.results.length || google.placeIds?.length)) {
    try { links = await deps.readLinks(internal.map(row => row.id)) } catch { warnings.push('matching_unavailable') }
  }
  const results = rankDiscoveryResults(internal, google.results, intent, { links, maxResults: deps.config.maxResults })
  let external = null, externalStatus = google.status
  if (google.status === 'ui_kit') {
    const visiblePartners = new Set(results.filter(row => row.source === 'gorez').map(row => row.id))
    const linkedIds = new Set(links.filter(link => visiblePartners.has(link.business_id)).map(link => link.place_id)), placeIds = google.placeIds.filter(id => !linkedIds.has(id)).slice(0, deps.config.maxResults - results.length)
    if (placeIds.length) {
      if (await deps.claimBudget('google', 'ui_list')) external = { mode: 'ui_kit', placeIds, browserKey: deps.config.browserKey, locale: input.locale }
      else externalStatus = 'quota'
    } else externalStatus = 'ok'
  }
  // Test/development-only aggregate observations: no query, health text,
  // coordinates, names, provider payloads, contacts or credentials.
  if (deps.config.environment !== 'production') deps.diagnostic?.({ stage: 'results', internalCandidates: catalogue.rows.length, internalEligible: candidates.length, internalAfterAvailability: internal.length, googleCandidates: google.placeIds?.length ?? google.results.length, finalInternal: results.filter(row => row.source === 'gorez').length, finalExternal: external?.placeIds.length ?? results.filter(row => row.source === 'google').length, externalStatus, warnings: [...warnings] })
  return { intent, interpretation: interpretation.mode, results, external, appointmentClarification: intent.appointmentClarification || null, clarification: null, warnings, externalStatus, rankingVersion: RANKING_VERSION, checkedAt: new Date().toISOString() }
}
