import 'server-only'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { discoveryConfig } from '../../../../../lib/discovery/config.mjs'
import { SOFIA_CATALOGUE } from '../../../../../lib/discovery/sofia-catalogue.mjs'
import { readPublishedSearchCandidates, readPublishedSearchInventory } from '../../../../../lib/discovery/public-search-inventory.mjs'
import { createDiscoverySuggestionsHandler } from '../../../../../lib/discovery/suggestions.mjs'

export const runtime = 'nodejs'
export async function POST(request) {
  return createDiscoverySuggestionsHandler({
    config: discoveryConfig(process.env), catalogue: SOFIA_CATALOGUE,
    allowAttempt: request => consumeRateLimit(request, { scope: 'discovery-suggestions', limit: 120, windowSeconds: 60, includeUserAgent: false }),
    readInventory: options => readPublishedSearchInventory(getSupabaseAdmin(), options),
    revalidatePartners: ids => readPublishedSearchCandidates(getSupabaseAdmin(), ids),
  })(request)
}
