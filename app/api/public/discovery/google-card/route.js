import 'server-only'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { discoveryConfig } from '../../../../../lib/discovery/config.mjs'
import { createBudgetGuard, logDiscoveryUsage } from '../../../../../lib/discovery/budget.mjs'
import { createGoogleCardGrantHandler } from '../../../../../lib/discovery/google-card-grant.mjs'

export const runtime = 'nodejs'
export async function POST(request) {
  const config = discoveryConfig(process.env)
  return createGoogleCardGrantHandler({
    config,
    allowAttempt: request => config.perMinute > 0 && consumeRateLimit(request, { scope: 'google-discovery-card', limit: config.perMinute, windowSeconds: 60, includeUserAgent: false }),
    claimBudget: (...args) => createBudgetGuard(getSupabaseAdmin(), config, logDiscoveryUsage)(...args),
  })(request)
}
