import { createCustomerBookingsHandler, readCustomerBookingPresentationContext } from '../../../../lib/customer-account.mjs'
import { requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { ensureCustomerEmailProof } from '../../../../lib/customer-email-proof.mjs'
import { presentPublicBooking } from '../../../../lib/locale/public-content-server.mjs'

export const GET = createCustomerBookingsHandler({
  presentBooking: presentPublicBooking,
  readPresentationContext: rows => readCustomerBookingPresentationContext(getSupabaseAdmin(),rows),
  authenticate: requireUser,
  allowAttempt: (request,id) => consumeRateLimit(request,{ scope:`customer-history:${id}`,limit:60,windowSeconds:600,includeUserAgent:false }),
  authorizeEmail: (request,user) => ensureCustomerEmailProof({request,user,store:{
    async has(id,email) {
      const {data,error}=await getSupabaseAdmin().from('customer_email_verifications').select('user_id').eq('user_id',id).eq('email',email).maybeSingle()
      if(error)throw error
      return Boolean(data)
    },
    async save(proof) {
      const {error}=await getSupabaseAdmin().from('customer_email_verifications').upsert(proof,{onConflict:'user_id,email'})
      if(error)throw error
    },
  }}),
  async list({ accountId,view,page }) {
    const { data,error }=await getSupabaseAdmin().rpc('customer_booking_history',{ account_id:accountId,history_view:view,page_number:page })
    if (error) throw error
    return data || []
  },
})
