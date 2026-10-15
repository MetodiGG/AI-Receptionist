import { timingSafeEqual } from 'node:crypto'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'

export function authorizedNotificationCron(request, env) {
  const expected = env.CRON_SECRET
  const authorization = request.headers.get('authorization') || ''
  const actual = Buffer.from(authorization)
  const wanted = Buffer.from(`Bearer ${expected || ''}`)
  return Boolean(expected && expected.length >= 32 && actual.length === wanted.length && timingSafeEqual(actual, wanted))
}

export function createNotificationCron({ env, process }) {
  return async (request) => {
    if (!authorizedNotificationCron(request, env)) {
      return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401, headers: PRIVATE_RESPONSE_HEADERS })
    }
    try {
      return Response.json(await process(), { headers: PRIVATE_RESPONSE_HEADERS })
    } catch {
      return Response.json({ error: { code: 'NOTIFICATIONS_UNAVAILABLE' } }, { status: 503, headers: PRIVATE_RESPONSE_HEADERS })
    }
  }
}
