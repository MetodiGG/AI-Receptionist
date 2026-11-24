import { apiError, getSafeError } from '../../../../lib/api-response'
import { getPublicBusiness, toPublicBusiness } from '../../../../lib/public-booking'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { presentPublicBusiness } from '../../../../lib/locale/public-content-server.mjs'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { attachNativeLocationEvidence } from '../../../../lib/native-location-evidence.mjs'

export async function GET(request, context) {
  try {
    const { slug } = await context.params
    if (!await consumeRateLimit(request, { scope: `business:${slug}`, limit: 120, windowSeconds: 60 })) {
      return apiError('Твърде много заявки. Опитай отново след малко.', 429, 'RATE_LIMITED')
    }
    const business = await getPublicBusiness(slug)
    if (!business) return apiError('Този бизнес не е открит.', 404, 'NOT_FOUND')
    const [withNavigation] = await attachNativeLocationEvidence(getSupabaseAdmin(), [business])
    return Response.json({ business: presentPublicBusiness(toPublicBusiness(withNavigation)) },{headers:{'Cache-Control':'private, no-store'}})
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
