import { z } from 'zod'

export const recoveryRequestSchema = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), locale: z.enum(['bg', 'en']) }).strict()
export const newPasswordSchema = z.object({ password: z.string().min(8).max(128), confirmation: z.string() }).refine((input) => input.password === input.confirmation, { path: ['confirmation'] })

export function recoveryRedirect(origin, locale) {
  const url = new URL('/reset-password', origin)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Invalid recovery origin')
  url.searchParams.set('lang', locale === 'en' ? 'en' : 'bg')
  return url.href
}

const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer' }
const failure = (code, status) => Response.json({ error: { code } }, { status, headers: privateHeaders })

export function createRecoveryRequestHandler({ allowAttempt, sendRecovery, origin }) {
  return async function POST(request) {
    try {
      const caller = request.headers.get('origin')
      if ((caller && caller !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return failure('FORBIDDEN', 403)
      if (!await allowAttempt(request)) return failure('RATE_LIMITED', 429)
      if (!request.headers.get('content-type')?.startsWith('application/json')) return failure('VALIDATION_ERROR', 422)
      const parsed = recoveryRequestSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) return failure('VALIDATION_ERROR', 422)
      const { email, locale } = parsed.data
      const { error } = await sendRecovery(email, { redirectTo: recoveryRedirect(origin, locale) })
      if (error) {
        if (['over_email_send_rate_limit', 'over_request_rate_limit'].includes(error.code) || error.status === 429) return failure('RATE_LIMITED', 429)
        // Account-specific failures must not reveal whether an address is registered.
        if (!['user_not_found', 'email_not_found', 'email_address_not_authorized'].includes(error.code)) return failure('RECOVERY_UNAVAILABLE', 503)
      }
      return Response.json({ accepted: true }, { status: 202, headers: privateHeaders })
    } catch { return failure('RECOVERY_UNAVAILABLE', 503) }
  }
}

export function readRecoveryFragment(hash, now = Date.now()) {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  if (params.get('type') !== 'recovery' || params.has('error') || params.has('error_code')) return null
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  const expiresAt = Number(params.get('expires_at'))
  if (!access_token || !refresh_token || !Number.isFinite(expiresAt) || expiresAt <= now / 1000) return null
  return { access_token, refresh_token }
}

// A normal saved owner session is deliberately not accepted. Only this email
// callback can populate the separate, non-persistent recovery client.
export async function initializePasswordRecovery(auth, href, replaceUrl) {
  const url = new URL(href)
  const credentials = readRecoveryFragment(url.hash)
  const clean = new URL('/reset-password', url.origin)
  clean.searchParams.set('lang', url.searchParams.get('lang') === 'en' ? 'en' : 'bg')
  replaceUrl(`${clean.pathname}${clean.search}`)
  if (!credentials) return false
  try {
    const { data, error } = await auth.setSession(credentials)
    return !error && Boolean(data?.session?.user?.id)
  } catch { return false }
}

export function passwordUpdateError(error) {
  if (error?.code === 'same_password') return 'samePassword'
  if (error?.code === 'weak_password') return 'weakPassword'
  if ([401, 403].includes(error?.status) || ['session_not_found', 'refresh_token_not_found', 'bad_jwt'].includes(error?.code)) return 'expired'
  return 'unavailable'
}
