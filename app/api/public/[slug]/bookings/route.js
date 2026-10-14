import { apiError, getSafeError } from '../../../../../lib/api-response'
import { createPublicBooking, getPublicBusiness } from '../../../../../lib/public-booking'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { PRIVATE_RESPONSE_HEADERS, toPublicBooking } from '../../../../../lib/booking-safety.mjs'
import { requireUser } from '../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'

export async function POST(request, context) {
  try {
    const { slug } = await context.params
    const input = await request.json()
    // Only the authenticated owner may label an appointment as a manual one.
    const owner = input?.source === 'manual' ? await requireUser(request) : null
    if (input?.source === 'manual' && !owner) return apiError('Влез в профила си.', 401, 'UNAUTHORIZED')
    if (!await consumeRateLimit(request, { scope: `booking:${slug}`, limit: 10, windowSeconds: 600 })) {
      return apiError('Твърде много опити. Изчакай няколко минути.', 429, 'RATE_LIMITED')
    }
    const business = await getPublicBusiness(slug)
    if (!business) return apiError('Този бизнес не е открит.', 404, 'NOT_FOUND')
    if (owner) {
      const { data, error } = await getSupabaseAdmin().from('businesses').select('id').eq('id', business.id).eq('owner_id', owner.id).maybeSingle()
      if (error) throw error
      if (!data) return apiError('Нямаш достъп до този бизнес.', 403, 'FORBIDDEN')
    }
    const booking = await createPublicBooking({ business, input: { ...input, source: owner ? 'manual' : 'web' } })
    return Response.json({ booking: toPublicBooking(booking) }, { status: 201, headers: PRIVATE_RESPONSE_HEADERS })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
