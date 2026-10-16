import { z } from 'zod'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'
import { hasRecentPasswordLogin } from './account-deletion.mjs'

export const ADMIN_BUSINESS_ACTIONS = ['publish','suspend','archive','restore','delete']
export const businessActionSchema = z.object({
  action: z.enum(ADMIN_BUSINESS_ACTIONS), revision: z.number().int().nonnegative(),
  confirmation: z.string().min(2).max(64), reason: z.string().trim().min(3).max(500),
  acknowledged: z.literal(true),
}).strict()
export {businessState} from './platform-business-view.mjs'
export const privateJson = (body,status=200) => Response.json(body,{status,headers:PRIVATE_RESPONSE_HEADERS})
const fail = (code,status) => privateJson({error:{code}},status)
export function adminFailure(error) {
  const known = ['BUSINESS_NOT_FOUND','BUSINESS_CHANGED','CONFIRMATION_MISMATCH','RESTORE_FIRST','SETUP_REQUIRED','ARCHIVE_FIRST','UPCOMING_BOOKINGS']
  const code = known.find(code => error?.message?.includes(code))
  return fail(code || 'ADMIN_UNAVAILABLE',code === 'BUSINESS_NOT_FOUND' ? 404 : code ? 409 : 503)
}
export function createAdminBusinessHandlers({ authenticate, isAdmin, read, mutate, allowAttempt }) {
  async function identity(request) {
    const auth = await authenticate(request)
    if (!auth.user) return {error:fail('UNAUTHORIZED',401)}
    if (!auth.user.email_confirmed_at || auth.user.is_anonymous || !isAdmin(auth.user)) return {error:fail('FORBIDDEN',403)}
    return auth
  }
  return {
    async GET(request, id) {
      try {
        const auth = await identity(request)
        if (auth.error) return auth.error
        if (!z.string().uuid().safeParse(id).success) return fail('VALIDATION_ERROR',422)
        const detail = await read(id)
        return detail ? privateJson(detail) : fail('BUSINESS_NOT_FOUND',404)
      } catch(error) { return adminFailure(error) }
    },
    async POST(request,id) {
      try {
        const origin=request.headers.get('origin')
        if ((origin && origin!==new URL(request.url).origin) || request.headers.get('sec-fetch-site')==='cross-site') return fail('FORBIDDEN',403)
        const auth=await identity(request)
        if(auth.error)return auth.error
        if (!z.string().uuid().safeParse(id).success || !request.headers.get('content-type')?.startsWith('application/json')) return fail('VALIDATION_ERROR',422)
        const input=businessActionSchema.safeParse(await request.json().catch(()=>null))
        if(!input.success)return fail('VALIDATION_ERROR',422)
        if(!await allowAttempt(request,auth.user.id))return fail('RATE_LIMITED',429)
        if(input.data.action==='delete') {
          if(!hasRecentPasswordLogin(auth.token))return fail('REAUTH_REQUIRED',403)
          if(auth.user.factors?.some(factor=>factor.status==='verified'))return fail('MFA_REQUIRED',403)
        }
        const result=await mutate({id,actorId:auth.user.id,...input.data})
        return privateJson({result})
      }catch(error){return adminFailure(error)}
    },
  }
}
