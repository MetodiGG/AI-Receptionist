import { Buffer } from 'node:buffer'
import { z } from 'zod'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'

const deletionInput = z.object({ businessId: z.string().uuid(), confirmation: z.literal('DELETE'), acknowledged: z.literal(true) }).strict()
const errorResponse = (code, status) => Response.json({ error: { code } }, { status, headers: PRIVATE_RESPONSE_HEADERS })

// Only inspect claims AFTER authenticate() has validated this exact token with
// Supabase Auth. A recently refreshed token is not a recent password login.
export function hasRecentPasswordLogin(token, now = Date.now()) {
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    const seconds = Math.floor(now / 1000)
    return claims.amr?.some((entry) => entry.method === 'password' && Number.isInteger(entry.timestamp) && entry.timestamp <= seconds + 30 && seconds - entry.timestamp <= 300) === true
  } catch { return false }
}

export async function readOwnedAccount(client, user, now = new Date().toISOString()) {
  const businesses = []
  for (let offset = 0; ; offset += 200) {
    const { data, error } = await client.from('businesses').select('id,name,slug').eq('owner_id', user.id).order('id').range(offset, offset + 199)
    if (error) throw error
    businesses.push(...(data || []))
    if (!data || data.length < 200) break
  }
  let upcomingBookings = 0
  for (let offset = 0; offset < businesses.length; offset += 100) {
    const { count, error } = await client.from('appointments').select('id', { count: 'exact', head: true }).in('business_id', businesses.slice(offset, offset + 100).map((business) => business.id)).in('status', ['booked', 'confirmed']).gt('ends_at', now)
    if (error || count === null) throw error || new Error('Booking count unavailable')
    upcomingBookings += count
  }
  return { email: user.email, businesses, upcomingBookings }
}

export function createAccountDeletionHandlers({ authenticate, getClient, allowAttempt }) {
  return {
    async GET(request) {
      try {
        const { user } = await authenticate(request)
        if (!user) return errorResponse('UNAUTHORIZED', 401)
        const account = await readOwnedAccount(getClient(), user)
        return Response.json({ account }, { headers: PRIVATE_RESPONSE_HEADERS })
      } catch { return errorResponse('ACCOUNT_READ_FAILED', 503) }
    },
    async DELETE(request) {
      try {
        const origin = request.headers.get('origin')
        if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return errorResponse('FORBIDDEN', 403)
        const { user, token } = await authenticate(request)
        if (!user) return errorResponse('UNAUTHORIZED', 401)
        if (!request.headers.get('content-type')?.startsWith('application/json')) return errorResponse('VALIDATION_ERROR', 422)
        const input = deletionInput.safeParse(await request.json().catch(() => null))
        if (!input.success) return errorResponse('VALIDATION_ERROR', 422)
        if (!await allowAttempt(request, user.id)) return errorResponse('RATE_LIMITED', 429)
        if (!hasRecentPasswordLogin(token)) return errorResponse('REAUTH_REQUIRED', 403)
        // Password-only reauthentication must never bypass an enrolled MFA factor.
        if (user.factors?.some((factor) => factor.status === 'verified')) return errorResponse('MFA_REQUIRED', 403)
        const client = getClient()
        const { data: business, error } = await client.from('businesses').select('id').eq('id', input.data.businessId).eq('owner_id', user.id).maybeSingle()
        if (error) throw error
        if (!business) return errorResponse('NOT_FOUND', 404)

        // Delete the verified identity, not an ID supplied by the caller. The
        // existing ON DELETE CASCADE relationships remove all owned businesses
        // and their dependent rows in the same database transaction. Never
        // pre-delete business rows: an Auth failure must not leave half an account.
        const { error: deleteError } = await client.auth.admin.deleteUser(user.id, false)
        if (deleteError) return errorResponse('ACCOUNT_DELETE_FAILED', 503)
        return Response.json({ deleted: true }, { headers: PRIVATE_RESPONSE_HEADERS })
      } catch { return errorResponse('ACCOUNT_DELETE_FAILED', 503) }
    },
  }
}
