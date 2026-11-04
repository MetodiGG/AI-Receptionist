import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'

// Counts only, never customer rows, query text, coordinates or external sales.
export function createPlatformReferralHandler({ authenticate, isAdmin, allowAttempt, load }) {
  const json = (value, status = 200) => Response.json(value, { status, headers: PRIVATE_RESPONSE_HEADERS })
  return async request => {
    try {
      const user = await authenticate(request)
      if (!user?.id || !user.email_confirmed_at || user.is_anonymous) return json({ error: { code: 'UNAUTHORIZED' } }, 401)
      if (!isAdmin(user)) return json({ error: { code: 'FORBIDDEN' } }, 403)
      if (!await allowAttempt(request, user.id)) return json({ error: { code: 'RATE_LIMITED' } }, 429)
      const days = new URL(request.url).searchParams.get('days') || '30'
      if (!['7', '30'].includes(days)) return json({ error: { code: 'VALIDATION_ERROR' } }, 422)
      return json({ days: Number(days), summary: await load(Number(days)) })
    } catch { return json({ error: { code: 'ANALYTICS_UNAVAILABLE' } }, 503) }
  }
}
