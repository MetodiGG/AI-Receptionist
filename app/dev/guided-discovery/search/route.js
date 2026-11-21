import { discoveryConfig } from '../../../../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../../../../lib/discovery/handler.mjs'
import snapshot from '../../../../tests/fixtures/guided-public-partners-20261121.json'

// Local metadata-only adapter to the ACTUAL search/filter/pagination pipeline.
// Production cannot enable this route. Every booking/slot/provider call fails.
export async function POST(request) {
  if (!discoveryConfig(process.env).devMock) return new Response(null, { status: 404 })
  const forbidden = () => { throw Error('LOCAL_PREVIEW_HAS_NO_BOOKING_OR_PROVIDER_ACCESS') }
  const response = await createDiscoveryHandler({
    config: { ...discoveryConfig({}), enabled: true, searchV2Enabled: true }, allowAttempt: async () => true,
    claimBudget: forbidden, fetcher: forbidden, getBusiness: forbidden, getSlots: forbidden,
    readInternal: async () => snapshot.businesses.map(row => ({
      ...row, active: true, platform_status: 'enabled', public_profile: row.coordinates || {},
      services: row.services.map(service => ({ ...service, active: true })),
    })),
  })(request)
  const body = await response.json()
  if (Array.isArray(body.results)) body.results = body.results.map(row => {
    const partner = snapshot.businesses.find(partner => partner.id === row.id)
    if (!partner) return row
    // Keep the actual matching/preview rows untouched. Only the local details
    // dialog receives the original full public menu, as production fetches it.
    return { ...row, details: { ...row.details, services: partner.services },
      ...(snapshot.localPhotos[row.id] ? { photos: snapshot.localPhotos[row.id] } : {}) }
  })
  return Response.json(body, { status: response.status, headers: response.headers })
}
