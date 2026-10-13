import QRCode from 'qrcode'
import { apiError, getSafeError } from '../../../../../lib/api-response'
import { getPublicBusiness } from '../../../../../lib/public-booking'
import { buildPublicBookingUrl, resolvePublicOrigin } from '../../../../../lib/public-url.mjs'
import { consumeRateLimit } from '../../../../../lib/rate-limit'

export async function GET(request, context) {
  try {
    const { slug } = await context.params
    if (!await consumeRateLimit(request, { scope: `qr:${slug}`, limit: 30, windowSeconds: 60 })) return apiError('Твърде много заявки.', 429, 'RATE_LIMITED')
    const business = await getPublicBusiness(slug)
    if (!business) return apiError('Този бизнес не е открит.', 404, 'NOT_FOUND')
    const requestUrl = new URL(request.url)
    const origin = resolvePublicOrigin(process.env.NEXT_PUBLIC_APP_URL, requestUrl.origin)
    const bookingUrl = buildPublicBookingUrl(origin, business.slug)
    const svg = await QRCode.toString(bookingUrl, { type: 'svg', width: 512, margin: 2, color: { dark: '#173e2a', light: '#ffffff' }, errorCorrectionLevel: 'M' })
    const headers = {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    }
    if (requestUrl.searchParams.get('download') === '1') headers['Content-Disposition'] = `attachment; filename="${business.slug}-qr.svg"`
    return new Response(svg, { headers })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}

