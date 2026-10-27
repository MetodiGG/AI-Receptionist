import { discoveryRequestSchema } from './intent.mjs'
import { discoverBusinesses } from './search.mjs'
import { discoveryHeaders, readBoundedJson, sameSiteRequest } from './http.mjs'

export function createDiscoveryHandler(deps) {
  const reply = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { ...discoveryHeaders, ...headers } })
  return async request => {
    if (!deps.config.enabled) return reply({ error: { code: 'NOT_FOUND' } }, 404)
    if (!sameSiteRequest(request, { development: deps.config.environment === 'development' })) return reply({ error: { code: 'FORBIDDEN' } }, 403)
    try {
      if (!await deps.allowAttempt(request)) return reply({ error: { code: 'RATE_LIMITED' } }, 429, { 'Retry-After': '60' })
      const input = discoveryRequestSchema.parse(await readBoundedJson(request))
      return reply(await discoverBusinesses(input, deps))
    } catch (error) {
      if (error?.name === 'ZodError' || error instanceof SyntaxError) return reply({ error: { code: 'VALIDATION_ERROR' } }, 422)
      return reply({ error: { code: 'SEARCH_UNAVAILABLE' } }, 503)
    }
  }
}
