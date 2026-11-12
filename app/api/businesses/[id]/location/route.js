import { requireUser, isPlatformAdmin } from '../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { createRegistrationLocationRequestHandler } from '../../../../../lib/registration-address-lookup.mjs'
import { scheduleRegistrationAddressLookup } from '../../../../../lib/registration-address-server'

export const runtime = 'nodejs'
export const maxDuration = 15
const handler = createRegistrationLocationRequestHandler({
  authenticate: requireUser, isAdmin: isPlatformAdmin,
  readBusiness: async id => { const { data, error } = await getSupabaseAdmin().from('businesses').select('id,owner_id').eq('id', id).maybeSingle(); if (error) throw error; return data },
  allowAttempt: (request, id) => consumeRateLimit(request, { scope: `registration-location:${id}`, limit: 3, windowSeconds: 3600, includeUserAgent: false }),
  schedule: scheduleRegistrationAddressLookup,
})
export async function POST(request, context) { return handler(request, (await context.params).id) }
