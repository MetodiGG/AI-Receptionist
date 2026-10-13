import { apiError, getSafeError } from '../../../../../lib/api-response'
import { getAvailableSlots, getPublicBusiness } from '../../../../../lib/public-booking'
import { consumeRateLimit } from '../../../../../lib/rate-limit'

export async function GET(request, context) {
  try {
    const { slug } = await context.params
    if (!await consumeRateLimit(request, { scope: `availability:${slug}`, limit: 120, windowSeconds: 60 })) {
      return apiError('Твърде много заявки. Опитай отново след малко.', 429, 'RATE_LIMITED')
    }
    const business = await getPublicBusiness(slug)
    if (!business) return apiError('Този бизнес не е открит.', 404, 'NOT_FOUND')

    const url = new URL(request.url)
    const serviceId = url.searchParams.get('service_id')
    const staffId = url.searchParams.get('staff_id') || undefined
    const date = url.searchParams.get('date')
    if (!serviceId || !date) return apiError('Избери услуга и дата.', 422, 'VALIDATION_ERROR')

    const slots = await getAvailableSlots({ business, serviceId, staffId, date })
    return Response.json({ slots, timezone: business.timezone })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
