import { discoveryConfig } from '../../../../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../../../../lib/discovery/handler.mjs'
import { fictionalDiscoveryBusinesses, fictionalGoogleResponse } from '../../../../lib/discovery/mock.mjs'

export async function POST(request) {
  if (!discoveryConfig(process.env).devMock) return new Response(null, { status: 404 })
  return createDiscoveryHandler({
    config: { ...discoveryConfig({}), enabled: true, searchV2Enabled: discoveryConfig(process.env).searchV2Enabled, googleEnabled: true, googleKey: 'test-only-not-a-key' },
    allowAttempt: async () => true, claimBudget: async () => true,
    fetcher: async (_url, init) => Response.json(fictionalGoogleResponse(JSON.parse(init.body))),
    readInternal: async intent => fictionalDiscoveryBusinesses(intent), readLinks: async () => [],
    getBusiness: async () => ({ timezone: 'Europe/Sofia', services: [{ id: '00000000-0000-4000-8000-000000000002' }] }),
    getSlots: async ({ date }) => { const { DateTime } = await import('luxon'); return [17, 18].map(hour => ({ startsAt: DateTime.fromISO(`${date}T${hour}:00`, { zone: 'Europe/Sofia' }).toUTC().toISO(), endsAt: DateTime.fromISO(`${date}T${hour + 1}:00`, { zone: 'Europe/Sofia' }).toUTC().toISO(), staffId: '00000000-0000-4000-8000-000000000003' })) },
  })(request)
}
