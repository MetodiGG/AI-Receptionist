import { apiError, getSafeError } from '../../../../../lib/api-response'
import { createPublicBooking, getPublicBusiness } from '../../../../../lib/public-booking'
import { consumeRateLimit } from '../../../../../lib/rate-limit'

export async function POST(request, context) {
  try {
    const { slug } = await context.params
    if (!await consumeRateLimit(request, { scope: `booking:${slug}`, limit: 10, windowSeconds: 600 })) {
      return apiError('Твърде много опити. Изчакай няколко минути.', 429, 'RATE_LIMITED')
    }
    const business = await getPublicBusiness(slug)
    if (!business) return apiError('Този бизнес не е открит.', 404, 'NOT_FOUND')

    const input = await request.json()
    const booking = await createPublicBooking({ business, input })
    return Response.json({ booking }, { status: 201 })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
