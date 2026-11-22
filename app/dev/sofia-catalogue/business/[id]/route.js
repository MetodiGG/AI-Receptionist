import { discoveryConfig } from '../../../../../lib/discovery/config.mjs'
import { findPublicCatalogueEntry } from '../../../../../lib/discovery/public-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../../../../../lib/discovery/public-details.mjs'

// Local read-only fixture. No database, owner/customer data, paid providers,
// calendar calls, storage or outbound bookings; never available in Production.
export async function GET(request, { params }) {
  if (!discoveryConfig(process.env).devMock) return new Response(null, { status: 404 })
  const { id } = await params
  return createPublicBusinessDetailsHandler({
    config: { enabled: true, environment: 'development' }, allowAttempt: async () => true,
    findCatalogue: findPublicCatalogueEntry, readCataloguePhotos: async () => [], readPartner: async () => null,
  })(request, id)
}
