// Server adapter only. The Node route's server-only boundary keeps this SDK
// and credentials out of the client graph. No ADC, file paths or user OAuth.
import { JWT } from 'google-auth-library'
import { z } from 'zod'
import { providerJson } from './http.mjs'
import { googleProjectIdSchema as projectIdSchema, googleServiceAccountEmail, GOOGLE_PLACES_SCOPES } from './google-auth-config.mjs'
import { createGoogleFederationAuthorizer, googleFederationConfigured } from './google-federation.mjs'

export { GOOGLE_PLACES_SCOPES } from './google-auth-config.mjs'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
// Google's documented key-file examples also use this legacy metadata URI.
// Accept it as metadata only: tokenTransport always calls TOKEN_URL directly.
const TOKEN_METADATA_URIS = [TOKEN_URL, 'https://accounts.google.com/o/oauth2/token']
const JWT_GRANT = 'urn:ietf:params:oauth:grant-type:jwt-bearer'
const accountSchema = z.object({
  type: z.literal('service_account'),
  project_id: projectIdSchema,
  client_email: z.string().max(150),
  private_key: z.string().max(16000).regex(/^-----BEGIN PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]+\r?\n-----END PRIVATE KEY-----\r?\n?$/),
  private_key_id: z.string().max(200).regex(/^[A-Za-z0-9_-]+$/).optional(),
  token_uri: z.enum(TOKEN_METADATA_URIS).optional(),
  universe_domain: z.literal('googleapis.com').optional(),
})
const tokenSchema = z.object({
  access_token: z.string().min(1).max(8192).regex(/^[A-Za-z0-9._~+/-]+=*$/),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().min(1).max(3600),
})

function credentials(config) {
  const project = projectIdSchema.parse(config.googleProjectId)
  const json = config.googleServiceAccountJson
  if (typeof json !== 'string' || !json.length || Buffer.byteLength(json, 'utf8') > 32768) throw new Error('INVALID_CREDENTIALS')
  const account = accountSchema.parse(JSON.parse(json))
  if (account.project_id !== project) throw new Error('INVALID_CREDENTIALS')
  googleServiceAccountEmail(project, account.client_email)
  return { project, account }
}

export function googlePlacesAuthConfigured(config) {
  // Explicit OAuth never falls back to a key, ADC or a developer's login.
  const mode = config.googleAuthMode ?? 'api-key'
  if (mode === 'api-key') return typeof config.googleKey === 'string' && config.googleKey.length > 0 && config.googleKey.length <= 4096 && !/[\r\n]/.test(config.googleKey)
  if (mode === 'vercel-oidc') return googleFederationConfigured(config)
  if (mode !== 'oauth') return false
  try { credentials(config); return true } catch { return false }
}

function tokenTransport(fetcher, timeoutMs) {
  return {
    async request(options) {
      // Let Google's SDK sign the assertion, but keep its HTTP transport under
      // the same bounded/no-redirect/no-retry policy as the Places adapter.
      if (String(options.url) !== TOKEN_URL || options.method !== 'POST' || !(options.data instanceof URLSearchParams)) throw new Error('INVALID_TOKEN_REQUEST')
      const body = options.data
      if (body.get('grant_type') !== JWT_GRANT || !body.get('assertion') || body.toString().length > 20000 || [...body.keys()].some(key => !['grant_type', 'assertion'].includes(key))) throw new Error('INVALID_TOKEN_REQUEST')
      const data = await providerJson(TOKEN_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
      }, { fetcher, timeoutMs, maxBytes: 16384 })
      // Discard unexpected response fields; no refresh/ID tokens are retained.
      return { data: tokenSchema.parse(data) }
    },
  }
}

export function createGooglePlacesAuthorizer({ fetcher = fetch, timeoutMs = 3000, getOidcToken, now } = {}) {
  const authorizeFederation = createGoogleFederationAuthorizer({ fetcher, timeoutMs, getOidcToken, now })
  // At most three scoped clients for the current credential set, per warm
  // process. SDK expiry refresh + in-flight dedup avoid per-search exchanges.
  let currentJson = '', currentProject = ''
  const clients = new Map()
  return async function authorizeGoogle(config, method) {
    try {
      if (!Object.hasOwn(GOOGLE_PLACES_SCOPES, method) || !googlePlacesAuthConfigured(config)) throw new Error('NOT_CONFIGURED')
      if ((config.googleAuthMode ?? 'api-key') === 'api-key') return { 'X-Goog-Api-Key': config.googleKey }
      if (config.googleAuthMode === 'vercel-oidc') return await authorizeFederation(config, method)
      const { account, project } = credentials(config)
      if (currentJson !== config.googleServiceAccountJson || currentProject !== project) {
        clients.clear(); currentJson = config.googleServiceAccountJson; currentProject = project
      }
      const scope = GOOGLE_PLACES_SCOPES[method]
      if (!clients.has(scope)) clients.set(scope, new JWT({
        email: account.client_email, key: account.private_key, keyId: account.private_key_id,
        projectId: project, scopes: [scope], eagerRefreshThresholdMillis: 60000,
        transporter: tokenTransport(fetcher, timeoutMs), useAuthRequestParameters: false,
      }))
      const { token } = await clients.get(scope).getAccessToken()
      if (!token) throw new Error('MISSING_TOKEN')
      return { Authorization: `Bearer ${token}`, 'X-Goog-User-Project': project }
    } catch {
      // SDK errors may contain assertions or provider bodies. Never propagate
      // their message/cause/response to logs, API responses or the browser.
      throw new Error('GOOGLE_AUTH_UNAVAILABLE')
    }
  }
}

export const authorizeGooglePlaces = createGooglePlacesAuthorizer()
