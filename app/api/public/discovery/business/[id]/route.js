import 'server-only'
import { getSupabaseAdmin } from '../../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../../lib/rate-limit'
import { discoveryConfig } from '../../../../../../lib/discovery/config.mjs'
import { createPublicBusinessDetailsHandler, readPublishedPartnerDetails } from '../../../../../../lib/discovery/public-details.mjs'
import { findCatalogueEntry, readPublicCataloguePhotos } from '../../../../../../lib/catalogue-photo-server'

export const runtime = 'nodejs'
export async function GET(request, { params }) {
  const { id } = await params
  const config = discoveryConfig(process.env)
  return createPublicBusinessDetailsHandler({
    config, findCatalogue: findCatalogueEntry, readCataloguePhotos: readPublicCataloguePhotos,
    readPartner: id => readPublishedPartnerDetails(getSupabaseAdmin(), id),
    allowAttempt: request => config.perMinute > 0 && consumeRateLimit(request, { scope: 'discovery-business-details', limit: config.perMinute, windowSeconds: 60, includeUserAgent: false }),
  })(request, id)
}
