import { z } from 'zod'
import { registrationAddressQuery, matchRegistrationAddress } from './registration-address-match.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'
import { sameOriginRequest } from './profile-management.mjs'

export function registrationAddressProvider(env = {}) {
  if (env.REGISTRATION_ADDRESS_LOOKUP_ENABLED === 'false') return null
  try {
    const url = new URL(env.REGISTRATION_ADDRESS_GEOCODER_URL || 'https://nominatim.openstreetmap.org/search')
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !/^[a-z0-9.-]+$/i.test(url.hostname)
      || !url.hostname.includes('.') || /^(?:\d+\.){3}\d+$/.test(url.hostname) || /(?:^|\.)(?:localhost|local|internal)$/.test(url.hostname)) return null
    return url
  } catch { return null }
}

async function boundedCandidates(response) {
  if (Number(response.headers?.get('content-length')) > 131072) throw Error('GEOCODER_RESPONSE_TOO_LARGE')
  if (!response.body?.getReader) throw Error('GEOCODER_RESPONSE_INVALID')
  const reader = response.body.getReader(), chunks = []
  let length = 0
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength; if (length > 131072) throw Error('GEOCODER_RESPONSE_TOO_LARGE'); chunks.push(value) }
  } finally { await reader.cancel().catch(() => {}) }
  const bytes = new Uint8Array(length); let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  const value = JSON.parse(new TextDecoder().decode(bytes))
  if (!Array.isArray(value) || value.length > 10) throw Error('GEOCODER_RESPONSE_INVALID')
  return value
}

// Called only after a durable signup or an explicit verified owner/admin
// action. Never called by client search, autocomplete, cron or a page render.
// The store provides the global DB lease/cache across serverless instances.
export function createRegistrationAddressResolver({ store, env = {}, fetcher = fetch }) {
  return async businessId => {
    const provider = registrationAddressProvider(env)
    if (!provider) return { state: 'disabled' }
    const claim = await store.claim(businessId)
    if (!claim || !['claimed', 'cached'].includes(claim.state)) return { state: claim?.state || 'missing' }
    const finish = (status, result = null, retryAfterSeconds = null) => store.finish({ businessId, addressKey: claim.address_key, claimToken: claim.claim_token, status, result, retryAfterSeconds })
    if (claim.state === 'cached') return finish('matched', claim.result)
    const requested = registrationAddressQuery(claim.business)
    if (!requested) return finish('no_match')
    provider.searchParams.set('format', 'jsonv2'); provider.searchParams.set('addressdetails', '1')
    provider.searchParams.set('limit', '5'); provider.searchParams.set('countrycodes', 'bg')
    provider.searchParams.set('accept-language', 'bg,en'); provider.searchParams.set('q', requested.query)
    try {
      const response = await fetcher(provider.href, { method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/json', 'User-Agent': 'GoRez registration address lookup/1.0 (+https://www.gorez.co; info@gorez.co)' } })
      if (!response.ok) {
        const seconds = Number(response.headers?.get('retry-after'))
        return finish('failed', null, response.status === 429 || response.status === 503 ? (Number.isFinite(seconds) && seconds > 0 ? Math.min(3600, Math.ceil(seconds)) : 60) : null)
      }
      const match = matchRegistrationAddress(claim.business, await boundedCandidates(response))
      return finish(match ? 'matched' : 'no_match', match)
    } catch { return finish('failed') }
  }
}

// No caller-supplied address, coordinates, provider URL or generic search.
export function createRegistrationLocationRequestHandler({ authenticate, isAdmin, readBusiness, allowAttempt, schedule }) {
  return async (request, businessId) => {
    const json = (body, status) => Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS })
    try {
      const user = await authenticate(request)
      if (!user?.id || !user.email_confirmed_at || user.is_anonymous) return json({ error: { code: 'UNAUTHORIZED' } }, 401)
      if (!sameOriginRequest(request)) return json({ error: { code: 'FORBIDDEN' } }, 403)
      if (!z.uuid().safeParse(businessId).success || !request.headers.get('content-type')?.startsWith('application/json') || Number(request.headers.get('content-length')) > 100) return json({ error: { code: 'VALIDATION_ERROR' } }, 422)
      let value, length = 0, text = ''
      try {
        if (!request.body) throw Error('INVALID_BODY')
        const reader = request.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true })
        try {
          while (true) { const chunk = await reader.read(); if (chunk.done) break; length += chunk.value.byteLength; if (length > 100) { await reader.cancel(); throw Error('INVALID_BODY') }; text += decoder.decode(chunk.value, { stream: true }) }
          value = JSON.parse(text + decoder.decode())
        } finally { reader.releaseLock() }
      } catch { return json({ error: { code: 'VALIDATION_ERROR' } }, 422) }
      if (!z.object({}).strict().safeParse(value).success) return json({ error: { code: 'VALIDATION_ERROR' } }, 422)
      const business = await readBusiness(businessId)
      if (!business || (business.owner_id !== user.id && !isAdmin(user))) return json({ error: { code: 'NOT_FOUND' } }, 404)
      if (!await allowAttempt(request, user.id)) return json({ error: { code: 'RATE_LIMITED' } }, 429)
      schedule(businessId)
      return json({ accepted: true }, 202)
    } catch { return json({ error: { code: 'LOCATION_UNAVAILABLE' } }, 503) }
  }
}
