import { z } from 'zod'
import { discoveryHeaders, readBoundedJson, sameSiteRequest } from './http.mjs'
import { googleCardVariantEnabled, verifyGoogleCardTicket } from './google-card-ticket.mjs'

const requestSchema = z.object({ ticket: z.string().min(1).max(1200), purpose: z.enum(['card', 'contacts']) }).strict()
export function createGoogleCardGrantHandler({ config, allowAttempt, claimBudget, now = () => Date.now() }) {
  const reply = (body, status = 200) => Response.json(body, { status, headers: discoveryHeaders })
  return async request => {
    if (!googleCardVariantEnabled(config)) return reply({ error: { code: 'NOT_FOUND' } }, 404)
    if (!sameSiteRequest(request, { development: config.environment === 'development' })) return reply({ error: { code: 'FORBIDDEN' } }, 403)
    try {
      const input = requestSchema.parse(await readBoundedJson(request, 1600)), identity = verifyGoogleCardTicket(input.ticket, config, now())
      if (!identity) return reply({ error: { code: 'INVALID_PERMIT' } }, 403)
      if (!await allowAttempt(request)) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
      const method = input.purpose === 'card' ? 'ui_card' : 'ui_contacts'
      // Both instantiate UI Kit Pro. Client-selected prices, masks, keys,
      // counts and raw Place IDs are rejected by the strict request schema.
      if (!await claimBudget('google', method)) return reply({ error: { code: 'QUOTA' } }, 429)
      return reply({ plan: { mode: input.purpose === 'card' ? 'ui_kit_card' : 'ui_kit_contacts', ...identity, browserKey: config.browserKey } })
    } catch (error) {
      if (error instanceof SyntaxError || error?.name === 'ZodError') return reply({ error: { code: 'VALIDATION_ERROR' } }, 422)
      return reply({ error: { code: 'UNAVAILABLE' } }, 503)
    }
  }
}
