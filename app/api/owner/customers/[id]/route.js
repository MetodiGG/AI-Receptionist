import { z } from 'zod'
import { requireUser } from '../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { eraseCustomerData } from '../../../../../lib/customer-erasure.mjs'
import { PRIVATE_RESPONSE_HEADERS } from '../../../../../lib/booking-safety.mjs'
import { apiError, getSafeError } from '../../../../../lib/api-response'

export async function DELETE(request, context) {
  try {
    const user = await requireUser(request)
    if (!user) return apiError('Sign in to delete a client.', 401, 'UNAUTHORIZED')
    const { id } = await context.params
    const customerId = z.string().uuid().parse(id)
    const supabase = getSupabaseAdmin()
    const { data: customer, error } = await supabase.from('customers').select('id,business_id').eq('id', customerId).maybeSingle()
    if (error) throw error
    if (!customer) return apiError('Client not found.', 404, 'NOT_FOUND')
    const { data: business, error: businessError } = await supabase.from('businesses').select('id').eq('id', customer.business_id).eq('owner_id', user.id).maybeSingle()
    if (businessError) throw businessError
    // Do not disclose whether an ID belongs to another owner.
    if (!business) return apiError('Client not found.', 404, 'NOT_FOUND')
    await eraseCustomerData(supabase, business.id, customer.id)
    return Response.json({ deleted: true }, { headers: PRIVATE_RESPONSE_HEADERS })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
