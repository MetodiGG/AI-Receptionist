import { discoveryConfig } from '../../../../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../../../../lib/discovery/handler.mjs'

export async function POST(request) {
  if (!discoveryConfig(process.env).devMock) return new Response(null, { status: 404 })
  const forbidden = () => { throw new Error('LOCAL_CATALOGUE_HAS_NO_PROVIDERS_OR_BOOKINGS') }
  return createDiscoveryHandler({
    config: { ...discoveryConfig({}), enabled: true }, allowAttempt: async () => true,
    claimBudget: forbidden, fetcher: forbidden,
    readInternal: async () => [], getBusiness: forbidden, getSlots: forbidden,
  })(request)
}
