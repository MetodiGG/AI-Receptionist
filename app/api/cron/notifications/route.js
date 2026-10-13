import { apiError, getSafeError } from '../../../../lib/api-response'
import { processPendingNotifications } from '../../../../lib/notifications'

export async function GET(request) {
  try {
    const expected = process.env.CRON_SECRET
    if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) {
      return apiError('Достъпът е отказан.', 401, 'UNAUTHORIZED')
    }
    const processed = await processPendingNotifications()
    return Response.json({ processed })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}

