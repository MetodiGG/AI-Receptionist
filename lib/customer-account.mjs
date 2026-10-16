import { z } from 'zod'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'

export const customerEmailSchema = z.string().trim().email().max(180).transform(value => value.toLowerCase())
export const customerSignupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: customerEmailSchema,
  password: z.string().min(8).max(128),
  confirmation: z.string(), consent: z.literal(true),
}).refine(value => value.password === value.confirmation, { path: ['confirmation'] })

export function customerAccountRedirect(origin, locale) {
  const url = new URL('/account', origin)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) throw new Error('Invalid account origin')
  url.searchParams.set('lang', locale === 'en' ? 'en' : 'bg')
  return url.href
}

export async function requestCustomerSignInLink({ auth,email,origin,locale }) {
  const parsed=customerEmailSchema.safeParse(email)
  if(!parsed.success)return {error:'VALIDATION_ERROR'}
  try {
    const {error}=await auth.signInWithOtp({email:parsed.data,options:{shouldCreateUser:false,emailRedirectTo:customerAccountRedirect(origin,locale)}})
    if(error?.status===429)return {error:'RATE_LIMITED'}
    // Do not expose whether an address is registered, or create an account
    // through this sign-in-only action. Mailbox access is still required.
    if(error&&!['user_not_found','email_not_found','signup_disabled','otp_disabled'].includes(error.code))return {error:'UNAVAILABLE'}
    return {accepted:true}
  }catch{return {error:'UNAVAILABLE'}}
}

// Reconstruct the result; never forward arbitrary CRM fields from a DB result.
export function toCustomerBooking(row) {
  const b = row.business || {}, s = row.service || {}
  return { id: row.id, starts_at: row.starts_at, ends_at: row.ends_at, status: row.status,
    cancellation_token: row.cancellation_token,
    business: { name:b.name, slug:b.slug, phone:b.phone, address:b.address, city:b.city, neighborhood:b.neighborhood, timezone:b.timezone, active:b.active },
    service: { name:s.name, price:s.price, currency:s.currency, duration_min:s.duration_min }, staff: { name:row.staff?.name } }
}

const fail = (code,status) => Response.json({ error:{ code } }, { status,headers:PRIVATE_RESPONSE_HEADERS })
export function createCustomerBookingsHandler({ authenticate, allowAttempt, authorizeEmail, list }) {
  return async function GET(request) {
    try {
      const user = await authenticate(request)
      if (!user) return fail('UNAUTHORIZED',401)
      // Only the Auth server's current verified identity counts. Never accept
      // an email/user ID/role supplied in a query, request body or user metadata.
      if (!user.email_confirmed_at || !user.email || user.is_anonymous) return fail('EMAIL_NOT_VERIFIED',403)
      const query = new URL(request.url).searchParams
      if ([...query.keys()].some(key => !['view','page'].includes(key))) return fail('VALIDATION_ERROR',422)
      const view=query.get('view') || 'upcoming', rawPage=query.get('page') || '0'
      if (!['upcoming','past'].includes(view) || !/^\d{1,3}$/.test(rawPage) || Number(rawPage)>500) return fail('VALIDATION_ERROR',422)
      if (!await allowAttempt(request,user.id)) return fail('RATE_LIMITED',429)
      if (!await authorizeEmail(request,user)) return fail('EMAIL_NOT_VERIFIED',403)
      const rows=await list({ accountId:user.id,view,page:Number(rawPage) })
      return Response.json({ bookings:rows.slice(0,20).map(toCustomerBooking),hasMore:rows.length>20 }, { headers:PRIVATE_RESPONSE_HEADERS })
    } catch { return fail('ACCOUNT_UNAVAILABLE',503) }
  }
}
