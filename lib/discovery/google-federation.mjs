// Server adapter only, behind the public Node route's server-only boundary.
// No service-account key, ADC, CLI credential discovery or arbitrary endpoints.
import { getContext } from '@vercel/oidc'
import { z } from 'zod'
import { providerJson } from './http.mjs'
import { googleProjectIdSchema, googleServiceAccountEmail, GOOGLE_PLACES_SCOPES } from './google-auth-config.mjs'

const STS_URL = 'https://sts.googleapis.com/v1/token'
const ACCESS_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:access_token'
const tokenSchema = z.string().min(1).max(12288).regex(/^[A-Za-z0-9._~+/-]+=*$/)
const slugSchema = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/)
const poolSchema = z.string().regex(/^[a-z][a-z0-9-]{2,30}[a-z0-9]$/).refine(value => !value.startsWith('gcp-'))
const environmentSchema = z.enum(['development', 'preview', 'production'])
const federationSchema = z.object({
  projectNumber: z.string().regex(/^[1-9][0-9]{5,19}$/), poolId: poolSchema, providerId: poolSchema,
  serviceAccountEmail: z.string().max(150), teamSlug: slugSchema,
  teamId: z.string().regex(/^team_[A-Za-z0-9]{8,80}$/), vercelProjectId: z.string().regex(/^prj_[A-Za-z0-9]{8,80}$/),
  environment: environmentSchema,
})
const claimsSchema = z.object({
  iss: z.string(), aud: z.string(), sub: z.string().max(500),
  owner: slugSchema, owner_id: z.string(), project: z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/), project_id: z.string(), environment: environmentSchema,
  iat: z.number().int().nonnegative().safe(), nbf: z.number().int().nonnegative().safe(), exp: z.number().int().nonnegative().safe(),
})
const exchangeSchema = z.object({
  access_token: tokenSchema, token_type: z.literal('Bearer'), issued_token_type: z.literal(ACCESS_TOKEN_TYPE),
  expires_in: z.number().int().min(1).max(3600),
})
const accessSchema = z.object({ accessToken: tokenSchema, expireTime: z.iso.datetime({ offset: true, precision: null }) })

function federation(config) {
  const project = googleProjectIdSchema.parse(config.googleProjectId)
  const trust = federationSchema.parse(config.googleFederation)
  googleServiceAccountEmail(project, trust.serviceAccountEmail)
  if (trust.environment !== config.environment) throw new Error('WRONG_ENVIRONMENT')
  return { project, ...trust }
}
export function googleFederationConfigured(config) {
  try { federation(config); return true } catch { return false }
}

// Use the SDK's public request-context API, rather than its automatic CLI
// refresh helper: missing/expired runtime identity must not read a developer's
// login, execute a CLI, write tokens or start an unbudgeted network exchange.
// Deliberately no token-file support; local tokens must be explicitly supplied
// by an approved Vercel development session, never by the HTTP request body.
export function readVercelRuntimeToken({ environment, env = process.env, context = getContext() }) {
  const header = context.headers?.['x-vercel-oidc-token']
  if (header !== undefined) return header
  if (environment !== 'development' || env.VERCEL_OIDC_TOKEN_FILE) throw new Error('RUNTIME_IDENTITY_MISSING')
  return env.VERCEL_OIDC_TOKEN
}

function checkRuntimeToken(token, trust, now) {
  if (typeof token !== 'string' || token.length > 16384 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new Error('INVALID_RUNTIME_IDENTITY')
  const [encodedHeader, encodedClaims] = token.split('.')
  const header = z.object({ alg: z.enum(['RS256', 'ES256']), kid: z.string().min(1).max(200), typ: z.literal('JWT').optional() }).parse(JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')))
  const claims = claimsSchema.parse(JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')))
  const seconds = Math.floor(now / 1000), maxAge = trust.environment === 'development' ? 43200 : 7200
  // This is a fail-fast allowlist, NOT signature verification. Only Google's
  // STS verifies the JWT signature/issuer/audience and the provider condition.
  // Never grant Google IAM trust based solely on this local decode.
  if (!header || claims.iss !== `https://oidc.vercel.com/${trust.teamSlug}` || claims.aud !== `https://vercel.com/${trust.teamSlug}` ||
      claims.owner !== trust.teamSlug || claims.owner_id !== trust.teamId || claims.project_id !== trust.vercelProjectId || claims.environment !== trust.environment ||
      claims.sub !== `owner:${claims.owner}:project:${claims.project}:environment:${claims.environment}` ||
      claims.exp <= seconds + 30 || claims.iat > seconds + 60 || claims.nbf > seconds + 60 || claims.exp <= claims.iat || claims.nbf > claims.exp || claims.exp - claims.iat > maxAge + 60) throw new Error('INVALID_RUNTIME_IDENTITY')
  return token
}

export function createGoogleFederationAuthorizer({ fetcher = fetch, timeoutMs = 3000, getOidcToken = readVercelRuntimeToken, now = Date.now } = {}) {
  let current = null
  async function exchange(trust, subjectToken, scope) {
    // Official RFC 8693 STS + IAM REST flow. Fixed bounded transports avoid
    // automatic retries or credential-source discovery in generic auth clients.
    const sts = exchangeSchema.parse(await providerJson(STS_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        audience: `//iam.googleapis.com/projects/${trust.projectNumber}/locations/global/workloadIdentityPools/${trust.poolId}/providers/${trust.providerId}`,
        scope: 'https://www.googleapis.com/auth/iam', requested_token_type: ACCESS_TOKEN_TYPE,
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt', subject_token: subjectToken,
      }).toString(),
    }, { fetcher, timeoutMs, maxBytes: 24576 }))
    const started = now()
    const access = accessSchema.parse(await providerJson(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${trust.serviceAccountEmail}:generateAccessToken`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sts.access_token}` },
      body: JSON.stringify({ scope: [scope], lifetime: '900s' }),
    }, { fetcher, timeoutMs, maxBytes: 16384 }))
    const expires = Date.parse(access.expireTime)
    if (!Number.isFinite(expires) || expires <= now() + 30000 || expires > started + 960000) throw new Error('INVALID_ACCESS_EXPIRY')
    return { token: access.accessToken, expires }
  }
  return async function authorizeFederation(config, method) {
    try {
      if (!Object.hasOwn(GOOGLE_PLACES_SCOPES, method)) throw new Error('INVALID_SCOPE')
      const trust = federation(config), key = JSON.stringify(trust)
      // Read and check every request, including a cache hit. No raw ID token is
      // retained after exchange; stale or cross-project contexts cannot reuse
      // a cached Google credential. The supplier is synchronous and non-I/O.
      const subjectToken = checkRuntimeToken(getOidcToken({ environment: trust.environment }), trust, now())
      if (!current || current.key !== key) current = { key, tokens: new Map() }
      const state = current, scope = GOOGLE_PLACES_SCOPES[method]
      let entry = state.tokens.get(scope)
      if (!entry?.pending && (!entry?.token || entry.expires <= now() + 60000)) {
        entry = { pending: exchange(trust, subjectToken, scope) }
        state.tokens.set(scope, entry)
      }
      if (entry.pending) {
        try {
          const access = await entry.pending
          if (state.tokens.get(scope) === entry) state.tokens.set(scope, access)
          entry = access
        } catch (error) {
          if (state.tokens.get(scope) === entry) state.tokens.delete(scope)
          throw error
        }
      }
      return { Authorization: `Bearer ${entry.token}`, 'X-Goog-User-Project': trust.project }
    } catch {
      // Provider bodies and SDK errors can contain tokens; never propagate.
      throw new Error('GOOGLE_AUTH_UNAVAILABLE')
    }
  }
}
