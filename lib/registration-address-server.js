import 'server-only'
import { after } from 'next/server'
import { getSupabaseAdmin } from './supabase-admin'
import { createRegistrationAddressResolver } from './registration-address-lookup.mjs'

const checked = ({ data, error }) => { if (error) throw error; return data }
export async function resolveRegistrationAddress(businessId) {
  const db = getSupabaseAdmin()
  return createRegistrationAddressResolver({ env: process.env, store: {
    claim: async id => {
      const result = await db.rpc('claim_registration_address_lookup_v2', { p_business: id })
      // The RPC may be unavailable before the schema rollout. Never try the
      // old endpoint, which can be reached by an older, less strict matcher.
      if (result.error?.code === 'PGRST202') return { state: 'review_required' }
      return checked(result)
    },
    finish: async input => checked(await db.rpc('finish_registration_address_lookup_v2', { p_business: input.businessId, p_address_key: input.addressKey, p_claim_token: input.claimToken, p_status: input.status, p_result: input.result, p_retry_after_seconds: input.retryAfterSeconds })),
  } })(businessId)
}

export function scheduleRegistrationAddressLookup(businessId) {
  try { after(async () => { try { await resolveRegistrationAddress(businessId) } catch { console.error('Business address lookup unavailable; manual address review remains available.') } }) }
  catch { console.error('Business address lookup scheduling unavailable; registration remains saved.') }
}
