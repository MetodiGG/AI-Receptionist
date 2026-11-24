import 'server-only'

import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { getAvailableSlots, getPublicBusiness } from '../../../../lib/public-booking'
import { discoveryConfig } from '../../../../lib/discovery/config.mjs'
import { createBudgetGuard, logDiscoveryUsage } from '../../../../lib/discovery/budget.mjs'
import { createDiscoveryHandler } from '../../../../lib/discovery/handler.mjs'
import { hydrateInternalCandidates, readInternalCandidates } from '../../../../lib/discovery/internal-search.mjs'
import { readPublicCataloguePhotos } from '../../../../lib/catalogue-photo-server'
import { currentPublicSofiaPlaceLink, publicSofiaPlaceLinkFields } from '../../../../lib/discovery/partner-ratings.mjs'

export const runtime = 'nodejs'
export async function POST(request) {
  const config = discoveryConfig(process.env)
  const handler = createDiscoveryHandler({
    config, sofiaOnly: true, log: logDiscoveryUsage,
    allowAttempt: request => config.perMinute > 0 && consumeRateLimit(request, { scope: 'ai-discovery', limit: config.perMinute, windowSeconds: 60, includeUserAgent: false }),
    claimBudget: (...args) => createBudgetGuard(getSupabaseAdmin(), config, logDiscoveryUsage)(...args),
    readInternal: (intent, options) => readInternalCandidates(getSupabaseAdmin(), intent, options),
    hydrateInternalCandidates: ids => hydrateInternalCandidates(getSupabaseAdmin(), ids),
    readCataloguePhotos: readPublicCataloguePhotos,
    readLinks: async ids => {
      const { data, error } = await getSupabaseAdmin().from('business_place_links').select(publicSofiaPlaceLinkFields).in('business_id', ids)
      if (error) throw error
      return (data || []).filter(row => currentPublicSofiaPlaceLink(row))
    },
    readPartnerPlaces: async ids => {
      const { data, error } = await getSupabaseAdmin().from('business_place_links')
        .select(publicSofiaPlaceLinkFields)
        .in('place_id', ids).limit(20)
      if (error) throw error
      return (data || []).filter(row => currentPublicSofiaPlaceLink(row))
    },
    readBookablePlaces: async ids => {
      const { data, error } = await getSupabaseAdmin().from('external_booking_links')
        .select('id,place_id,booking_url,verification_status,verified_by,verified_at,last_checked_at,disabled_at')
        .in('place_id', ids).eq('verification_status', 'approved').limit(20)
      if (error) throw error
      return data || []
    },
    getBusiness: getPublicBusiness, getSlots: getAvailableSlots,
  })
  return handler(request)
}
