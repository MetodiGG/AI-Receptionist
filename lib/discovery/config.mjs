function integer(env, name, fallback, max) {
  const raw = env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  // Bad configuration closes the budget instead of quietly increasing it.
  return Number.isSafeInteger(value) && value >= 0 && value <= max ? value : 0
}
export function discoveryConfig(env = {}) {
  const environment = env.VERCEL_ENV === 'production' ? 'production' : env.VERCEL_ENV === 'preview' ? 'preview' : env.NODE_ENV === 'production' ? 'production' : 'development'
  // Owner decision 2026-11-15: GoRez uses its own public catalogue only.
  // No environment flag, old approval, credential or missing catalogue result
  // may reactivate Google Places. Reintroduction requires a code change.
  const providerMode = 'catalogue'
  return {
    enabled: env.DISCOVERY_ENABLED === 'true', environment,
    providerMode,
    searchV2Enabled: env.DISCOVERY_SEARCH_V2_ENABLED === 'true',
    // Empty compatibility slots keep dormant adapters harmless without even
    // reading or forwarding provider credentials from the environment.
    googleEnabled: false,
    googleKey: '', googleAuthMode: 'disabled', googleProjectId: '', googleServiceAccountJson: '',
    googleFederation: {
      projectNumber: '', poolId: '', providerId: '', serviceAccountEmail: '',
      teamSlug: '', teamId: '', vercelProjectId: '', environment: '',
    },
    uiKitEnabled: false, partnerRatingsEnabled: false, googleCardsEnabled: false,
    googleCardSecret: '', browserKey: '', detailsEnabled: false,
    // Public discovery in this release is deterministic only. Do not read or
    // forward an old model credential, even when legacy AI flags remain set.
    aiEnabled: false, aiKey: '',
    aiModel: 'gpt-5.6-luna', // Fixed cost envelope; changing models requires a cost review.
    maxResults: Math.max(1, integer(env, 'DISCOVERY_MAX_RESULTS', 15, 15)),
    perMinute: integer(env, 'DISCOVERY_CATALOGUE_REQUESTS_PER_MINUTE', 30, 120),
    google: { daily: integer(env, 'DISCOVERY_GOOGLE_DAILY_LIMIT', 40, 10000), monthly: integer(env, 'DISCOVERY_GOOGLE_MONTHLY_LIMIT', 500, 100000), dailyCost: 2_000_000, monthlyCost: integer(env, 'DISCOVERY_GOOGLE_MONTHLY_MICROUSD', 20_000_000, 30_000_000) },
    ai: { daily: integer(env, 'DISCOVERY_AI_DAILY_LIMIT', 15, 1000), monthly: integer(env, 'DISCOVERY_AI_MONTHLY_LIMIT', 100, 10000), dailyCost: 100_000, monthlyCost: integer(env, 'DISCOVERY_AI_MONTHLY_MICROUSD', 1_000_000, 3_000_000) },
    devMock: environment === 'development' && env.NODE_ENV !== 'production' && env.DISCOVERY_DEV_MOCK === 'true',
  }
}
export const PROVIDER_COST_MICROUSD = { text: 32_000, nearby: 32_000, ids: 1, ui_list: 5_000, ui_rating: 5_000, ui_card: 5_000, ui_contacts: 5_000, details: 20_000, intent: 3_000 }
