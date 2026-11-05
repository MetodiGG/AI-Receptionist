function integer(env, name, fallback, max) {
  const raw = env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  // Bad configuration closes the budget instead of quietly increasing it.
  return Number.isSafeInteger(value) && value >= 0 && value <= max ? value : 0
}
export function discoveryConfig(env = {}) {
  const environment = env.VERCEL_ENV === 'production' ? 'production' : env.VERCEL_ENV === 'preview' ? 'preview' : env.NODE_ENV === 'production' ? 'production' : 'development'
  // Catalogue is the safe default. Google is a separate explicit opt-in, not
  // an automatic paid fallback when an area/category has too few records.
  const providerMode = env.DISCOVERY_PROVIDER_MODE === 'google' ? 'google' : 'catalogue'
  const metered = providerMode === 'google'
  return {
    enabled: env.DISCOVERY_ENABLED === 'true', environment,
    providerMode,
    searchV2Enabled: env.DISCOVERY_SEARCH_V2_ENABLED === 'true',
    // An EEA discovery app is NOT automatically a permitted REST use. Owner
    // approval is not a substitute for Google's contractual permission.
    googleEnabled: metered && env.GOOGLE_PLACES_ENABLED === 'true' && env.GOOGLE_PLACES_REST_USE_APPROVED === 'true' && env.GOOGLE_PLACES_BILLING_REGION === 'NON_EEA',
    googleKey: env.GOOGLE_PLACES_API_KEY || '',
    // Explicit modes only. Invalid modes fail closed; OAuth never uses the key.
    googleAuthMode: env.GOOGLE_PLACES_AUTH_MODE || 'api-key',
    googleProjectId: env.GOOGLE_PLACES_PROJECT_ID || '',
    googleServiceAccountJson: env.GOOGLE_PLACES_SERVICE_ACCOUNT_JSON || '',
    googleFederation: {
      projectNumber: env.GOOGLE_WIF_PROJECT_NUMBER || '', poolId: env.GOOGLE_WIF_POOL_ID || '',
      providerId: env.GOOGLE_WIF_PROVIDER_ID || '', serviceAccountEmail: env.GOOGLE_WIF_SERVICE_ACCOUNT_EMAIL || '',
      teamSlug: env.GOOGLE_WIF_VERCEL_TEAM_SLUG || '', teamId: env.GOOGLE_WIF_VERCEL_TEAM_ID || '',
      vercelProjectId: env.GOOGLE_WIF_VERCEL_PROJECT_ID || '', environment: env.GOOGLE_WIF_VERCEL_ENVIRONMENT || '',
    },
    uiKitEnabled: metered && env.GOOGLE_PLACES_UI_KIT_ENABLED === 'true' && env.GOOGLE_PLACES_UI_KIT_APPROVED === 'true',
    partnerRatingsEnabled: metered && env.GOOGLE_PARTNER_RATINGS_ENABLED === 'true',
    // Separate cost-reviewed opt-in. No environment is enabled by this change.
    googleCardsEnabled: metered && env.GOOGLE_DISCOVERY_CARDS_ENABLED === 'true',
    googleCardSecret: env.GOOGLE_DISCOVERY_CARD_SECRET || '',
    browserKey: env.GOOGLE_MAPS_BROWSER_KEY || '',
    detailsEnabled: metered && env.GOOGLE_PLACES_DETAILS_ENABLED === 'true',
    aiEnabled: metered && env.DISCOVERY_AI_ENABLED === 'true', aiKey: env.OPENAI_API_KEY || '',
    aiModel: 'gpt-5.6-luna', // Fixed cost envelope; changing models requires a cost review.
    maxResults: Math.max(1, integer(env, 'DISCOVERY_MAX_RESULTS', metered ? 12 : 15, 15)),
    perMinute: metered ? integer(env, 'DISCOVERY_REQUESTS_PER_MINUTE', 8, 30) : integer(env, 'DISCOVERY_CATALOGUE_REQUESTS_PER_MINUTE', 30, 120),
    google: { daily: integer(env, 'DISCOVERY_GOOGLE_DAILY_LIMIT', 40, 10000), monthly: integer(env, 'DISCOVERY_GOOGLE_MONTHLY_LIMIT', 500, 100000), dailyCost: 2_000_000, monthlyCost: integer(env, 'DISCOVERY_GOOGLE_MONTHLY_MICROUSD', 20_000_000, 30_000_000) },
    ai: { daily: integer(env, 'DISCOVERY_AI_DAILY_LIMIT', 15, 1000), monthly: integer(env, 'DISCOVERY_AI_MONTHLY_LIMIT', 100, 10000), dailyCost: 100_000, monthlyCost: integer(env, 'DISCOVERY_AI_MONTHLY_MICROUSD', 1_000_000, 3_000_000) },
    devMock: environment === 'development' && env.NODE_ENV !== 'production' && env.DISCOVERY_DEV_MOCK === 'true',
  }
}
export const PROVIDER_COST_MICROUSD = { text: 32_000, nearby: 32_000, ids: 1, ui_list: 5_000, ui_rating: 5_000, ui_card: 5_000, ui_contacts: 5_000, details: 20_000, intent: 3_000 }
