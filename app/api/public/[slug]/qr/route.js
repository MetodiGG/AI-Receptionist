import QRCode from 'qrcode'
import { apiError, getSafeError } from '../../../../../lib/api-response'
import { getPublicBusiness } from '../../../../../lib/public-booking'
import { consumeRateLimit } from '../../../../../lib/rate-limit'

export async function GET(request, context) {
  try {
    const { slug } = await context.params
    if (!await consumeRateLimit(request, { scope: `qr:${slug}`, limit: 30, windowSeconds: 60 })) return apiError('Твърде много заявки.', 429, 'RATE_LIMITED')
    const business = await getPublicBusiness(slug)
    if (!business) return apiError('Този бизнес не е открит.', 404, 'NOT_FOUND')
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const svg = await QRCode.toString(`${origin}/book/${business.slug}`, { type: 'svg', width: 512, margin: 2, color: { dark: '#173e2a', light: '#ffffff' }, errorCorrectionLevel: 'M' })
    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}

