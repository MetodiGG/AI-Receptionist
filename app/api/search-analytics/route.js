import { createSearchMetricHandler, createSearchMetricLimiter, createDurableSearchMetricLimiter } from '../../../lib/search-analytics.mjs'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'

export const runtime = 'nodejs'
const allowAttempt = createDurableSearchMetricLimiter({ allowLocal: createSearchMetricLimiter(),
  consume: options => getSupabaseAdmin().rpc('consume_api_rate_limit', options) })
export const POST = createSearchMetricHandler({
  enabled: () => process.env.SEARCH_ANALYTICS_ENABLED === 'true' && process.env.NEXT_PUBLIC_SEARCH_ANALYTICS_ENABLED === 'true',
  allowAttempt,
  write: async row => {
    const { error } = await getSupabaseAdmin().rpc('record_search_metric', { p_event: row.event, p_topic: row.topic, p_locale: row.locale, p_outcome: row.outcome, p_latency: row.latency })
    if (error) throw error
  },
})
