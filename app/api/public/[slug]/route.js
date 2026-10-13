import { apiError, getSafeError } from '../../../../lib/api-response'
import { getPublicBusiness } from '../../../../lib/public-booking'

export async function GET(_request, context) {
  try {
    const { slug } = await context.params
    const business = await getPublicBusiness(slug)
    if (!business) return apiError('Този бизнес не е открит.', 404, 'NOT_FOUND')
    return Response.json({ business })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
