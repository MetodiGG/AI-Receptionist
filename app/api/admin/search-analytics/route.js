import { requireUser, isPlatformAdmin } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createAdminSearchMetricHandler } from '../../../../lib/search-analytics.mjs'

export const GET = createAdminSearchMetricHandler({
  authenticate: requireUser, isAdmin: isPlatformAdmin,
  enabled: () => process.env.SEARCH_ANALYTICS_ENABLED === 'true' && process.env.NEXT_PUBLIC_SEARCH_ANALYTICS_ENABLED === 'true',
  allowAttempt: (request, id) => consumeRateLimit(request, { scope: `admin-search-metrics:${id}`, limit: 30, windowSeconds: 60, includeUserAgent: false }),
  load: async days => {
    const { data, error } = await getSupabaseAdmin().rpc('search_metrics_summary', { p_days: days })
    if (error) throw error
    return data
  },
})
