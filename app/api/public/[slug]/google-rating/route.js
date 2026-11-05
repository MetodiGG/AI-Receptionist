import 'server-only'

import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { discoveryConfig } from '../../../../../lib/discovery/config.mjs'
import { createBudgetGuard, logDiscoveryUsage } from '../../../../../lib/discovery/budget.mjs'
import { createPartnerRatingHandler } from '../../../../../lib/discovery/partner-ratings.mjs'

export const runtime = 'nodejs'
export async function POST(request, { params }) {
  const config = discoveryConfig(process.env)
  return createPartnerRatingHandler({
    config,
    allowAttempt: request => config.perMinute > 0 && consumeRateLimit(request, { scope: 'partner-google-rating', limit: config.perMinute, windowSeconds: 60, includeUserAgent: false }),
    readBusiness: async slug => {
      const { data, error } = await getSupabaseAdmin().from('businesses').select('id,active,platform_status').eq('slug', slug).eq('active', true).eq('platform_status', 'enabled').maybeSingle()
      if (error) throw error
      return data
    },
    readLink: async businessId => {
      const { data, error } = await getSupabaseAdmin().from('business_place_links').select('business_id,place_id,verified_by,verified_at').eq('business_id', businessId).maybeSingle()
      if (error) throw error
      return data
    },
    claimBudget: (...args) => createBudgetGuard(getSupabaseAdmin(), config, logDiscoveryUsage)(...args),
  })(request, (await params).slug)
}
