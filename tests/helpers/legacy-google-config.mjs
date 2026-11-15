import { discoveryConfig as catalogueOnlyConfig } from '../../lib/discovery/config.mjs'

// OFFLINE TEST FIXTURE ONLY. Preserve coverage of archived Google adapters
// with synthetic credentials, injected transports and fake budget stores.
// Nothing in app/, components/, hooks/ or lib/ may import this fixture. Real
// runtime configuration remains unconditionally catalogue-only regardless of
// old environment flags. This helper never reads process.env or makes requests.
function integer(env, name, fallback, maximum) {
  const raw = env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  return Number.isSafeInteger(value) && value >= 0 && value <= maximum ? value : 0
}

export function legacyGoogleConfig(env = {}) {
  const base = catalogueOnlyConfig(env)
  const metered = env.DISCOVERY_PROVIDER_MODE === 'google' && env.GOOGLE_PLACES_ACTIVATION_APPROVED === 'true' && env.GOOGLE_PLACES_HARD_LIMITS_VERIFIED === 'true'
  return {
    ...base, providerMode: metered ? 'google' : 'catalogue',
    googleEnabled: metered && env.GOOGLE_PLACES_ENABLED === 'true' && env.GOOGLE_PLACES_REST_USE_APPROVED === 'true' && env.GOOGLE_PLACES_BILLING_REGION === 'NON_EEA',
    googleKey: env.GOOGLE_PLACES_API_KEY || '', googleAuthMode: env.GOOGLE_PLACES_AUTH_MODE || 'api-key',
    googleProjectId: env.GOOGLE_PLACES_PROJECT_ID || '', googleServiceAccountJson: env.GOOGLE_PLACES_SERVICE_ACCOUNT_JSON || '',
    googleFederation: {
      projectNumber: env.GOOGLE_WIF_PROJECT_NUMBER || '', poolId: env.GOOGLE_WIF_POOL_ID || '',
      providerId: env.GOOGLE_WIF_PROVIDER_ID || '', serviceAccountEmail: env.GOOGLE_WIF_SERVICE_ACCOUNT_EMAIL || '',
      teamSlug: env.GOOGLE_WIF_VERCEL_TEAM_SLUG || '', teamId: env.GOOGLE_WIF_VERCEL_TEAM_ID || '',
      vercelProjectId: env.GOOGLE_WIF_VERCEL_PROJECT_ID || '', environment: env.GOOGLE_WIF_VERCEL_ENVIRONMENT || '',
    },
    uiKitEnabled: metered && env.GOOGLE_PLACES_UI_KIT_ENABLED === 'true' && env.GOOGLE_PLACES_UI_KIT_APPROVED === 'true',
    partnerRatingsEnabled: metered && env.GOOGLE_PARTNER_RATINGS_ENABLED === 'true', googleCardsEnabled: metered && env.GOOGLE_DISCOVERY_CARDS_ENABLED === 'true',
    googleCardSecret: env.GOOGLE_DISCOVERY_CARD_SECRET || '', browserKey: env.GOOGLE_MAPS_BROWSER_KEY || '',
    detailsEnabled: metered && env.GOOGLE_PLACES_DETAILS_ENABLED === 'true', aiEnabled: false, aiKey: '',
    maxResults: Math.max(1, integer(env, 'DISCOVERY_MAX_RESULTS', metered ? 12 : 15, 15)),
    perMinute: metered ? integer(env, 'DISCOVERY_REQUESTS_PER_MINUTE', 8, 30) : integer(env, 'DISCOVERY_CATALOGUE_REQUESTS_PER_MINUTE', 30, 120),
  }
}
