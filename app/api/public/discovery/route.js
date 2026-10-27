import 'server-only'

import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { getAvailableSlots, getPublicBusiness } from '../../../../lib/public-booking'
import { discoveryConfig } from '../../../../lib/discovery/config.mjs'
import { createBudgetGuard, logDiscoveryUsage } from '../../../../lib/discovery/budget.mjs'
import { createDiscoveryHandler } from '../../../../lib/discovery/handler.mjs'
import { readInternalCandidates } from '../../../../lib/discovery/internal-search.mjs'

export const runtime = 'nodejs'
export async function POST(request) {
  const config = discoveryConfig(process.env)
  const handler = createDiscoveryHandler({
    config, log: logDiscoveryUsage,
    allowAttempt: request => config.perMinute > 0 && consumeRateLimit(request, { scope: 'ai-discovery', limit: config.perMinute, windowSeconds: 60, includeUserAgent: false }),
    claimBudget: (...args) => createBudgetGuard(getSupabaseAdmin(), config, logDiscoveryUsage)(...args),
    readInternal: intent => readInternalCandidates(getSupabaseAdmin(), intent),
    readLinks: async ids => {
      const { data, error } = await getSupabaseAdmin().from('business_place_links').select('business_id,place_id').in('business_id', ids)
      if (error) throw error
      return data || []
    },
    getBusiness: getPublicBusiness, getSlots: getAvailableSlots,
  })
  return handler(request)
}
