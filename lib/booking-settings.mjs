import { bookingSettingsSchema, safeBookingUrl } from './booking-mode.mjs'
import { sameOriginRequest } from './profile-management.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'
import { z } from 'zod'
const reply=(body,status=200)=>Response.json(body,{status,headers:PRIVATE_RESPONSE_HEADERS})
export function createBookingSettingsHandler({authenticate,authorize,allowAttempt,verifyDestination,save}) {
 return async(request,id)=>{
  try {
   const user=await authenticate(request)
   if(!user?.id||!user.email_confirmed_at||user.is_anonymous)return reply({error:{code:'UNAUTHORIZED'}},401)
   if(!z.string().uuid().safeParse(id).success)return reply({error:{code:'VALIDATION_ERROR'}},422)
   if(!sameOriginRequest(request)||!await authorize(user,id))return reply({error:{code:'FORBIDDEN'}},403)
   if(!await allowAttempt(request,user.id))return reply({error:{code:'RATE_LIMITED'}},429)
   if(!request.headers.get('content-type')?.startsWith('application/json')||Number(request.headers.get('content-length'))>20000)return reply({error:{code:'VALIDATION_ERROR'}},422)
   const text=await request.text();if(text.length>20000)return reply({error:{code:'VALIDATION_ERROR'}},422)
   const input=bookingSettingsSchema.parse(JSON.parse(text))
   if(input.mode==='external')await verifyDestination(safeBookingUrl(input.url))
   await save({user,id,input:{...input,url:input.mode==='external'?safeBookingUrl(input.url):''}})
   return reply({ok:true})
  }catch(error){const code=['CONTENT_CHANGED','RESTORE_FIRST','INTERNAL_SETUP_REQUIRED','ACKNOWLEDGE_UPCOMING_BOOKINGS'].find(c=>error?.message?.includes(c));return reply({error:{code:code||((error?.name==='ZodError'||error instanceof SyntaxError||error?.message==='UNSAFE_DESTINATION')?'VALIDATION_ERROR':'BOOKING_SETTINGS_UNAVAILABLE')}},code?409:(error?.name==='ZodError'||error instanceof SyntaxError||error?.message==='UNSAFE_DESTINATION')?422:503)}
 }
}
