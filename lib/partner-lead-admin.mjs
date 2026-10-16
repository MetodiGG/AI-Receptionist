import { z } from 'zod'
import { PARTNER_STATUS_KEYS } from './partner-leads.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'

export const partnerLeadUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(PARTNER_STATUS_KEYS),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(3000).optional(),
}).strict()

const json = (body, status = 200) => Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS })
const fail = (code, status) => json({ error: { code } }, status)

export function createPartnerLeadUpdateHandler({ authenticate, isAdmin, allowAttempt, update }) {
  return async function PATCH(request) {
    try {
      const origin = request.headers.get('origin')
      if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return fail('FORBIDDEN', 403)
      const user = await authenticate(request)
      if (!user) return fail('UNAUTHORIZED', 401)
      if (!user.email_confirmed_at || user.is_anonymous || !isAdmin(user)) return fail('FORBIDDEN', 403)
      if (!request.headers.get('content-type')?.startsWith('application/json')) return fail('VALIDATION_ERROR', 422)
      const input = partnerLeadUpdateSchema.safeParse(await request.json().catch(() => null))
      if (!input.success) return fail('VALIDATION_ERROR', 422)
      if (!await allowAttempt(request, user.id)) return fail('RATE_LIMITED', 429)
      const lead = await update(input.data)
      // A conditional update prevents a stale tab from overwriting another decision.
      if (!lead) return fail('LEAD_CHANGED', 409)
      return json({ lead })
    } catch {
      return fail('ADMIN_UNAVAILABLE', 503)
    }
  }
}
