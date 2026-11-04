import { z } from 'zod'
import { safeBookingUrl } from './booking-mode.mjs'
import { validPlaceId } from './outbound-booking.mjs'
import { sameOriginRequest } from './profile-management.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'
const destination=z.string().refine(v=>Boolean(safeBookingUrl(v))).transform(v=>safeBookingUrl(v))
export const externalLinkDraftSchema=z.object({place_id:z.string().refine(validPlaceId),label:z.string().trim().min(2).max(150),booking_url:destination,official_url:destination,evidence:z.string().trim().min(10).max(1500)}).strict()
export const externalLinkActionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('save'),id:z.string().uuid().nullable(),revision:z.number().int().nonnegative().nullable(),data:externalLinkDraftSchema}).strict(),
 z.object({action:z.enum(['approve','disable','resolve']),id:z.string().uuid(),revision:z.number().int().nonnegative(),data:z.object({confirmation:z.string().refine(validPlaceId),verifiedBusinessAndBookingFlow:z.boolean().optional()}).strict()}).strict(),
])
export function createExternalLinkAdminHandlers({authenticate,isAdmin,allowAttempt,list,verifyDestination,save}) {
 const json=(body,status=200)=>Response.json(body,{status,headers:PRIVATE_RESPONSE_HEADERS})
 async function access(request){const user=await authenticate(request);if(!user?.id||!user.email_confirmed_at||user.is_anonymous)return{error:json({error:{code:'UNAUTHORIZED'}},401)};if(!isAdmin(user))return{error:json({error:{code:'FORBIDDEN'}},403)};if(!await allowAttempt(request,user.id))return{error:json({error:{code:'RATE_LIMITED'}},429)};return{user}}
 return {
  async GET(request){try{const a=await access(request);if(a.error)return a.error;const q=new URL(request.url).searchParams.get('q')||'';if(q.length>256)return json({error:{code:'VALIDATION_ERROR'}},422);return json(await list(q))}catch{return json({error:{code:'LINKS_UNAVAILABLE'}},503)}},
  async POST(request){try{const a=await access(request);if(a.error)return a.error;if(!sameOriginRequest(request))return json({error:{code:'FORBIDDEN'}},403);if(!request.headers.get('content-type')?.startsWith('application/json')||Number(request.headers.get('content-length'))>8000)return json({error:{code:'VALIDATION_ERROR'}},422);const text=await request.text();if(text.length>8000)return json({error:{code:'VALIDATION_ERROR'}},422);const input=externalLinkActionSchema.parse(JSON.parse(text));if(input.action==='save'){await verifyDestination(input.data.booking_url);await verifyDestination(input.data.official_url)}await save(input,a.user.id);return json({ok:true})}catch(e){const code=['LINK_CHANGED','LINK_NOT_FOUND','CONFIRMATION_MISMATCH','VERIFICATION_REQUIRED','PARTNER_PLACE_LINK'].find(c=>e?.message?.includes(c));return json({error:{code:code||(e?.code==='23505'?'PLACE_ID_EXISTS':e?.name==='ZodError'||e instanceof SyntaxError||e?.message==='UNSAFE_DESTINATION'?'VALIDATION_ERROR':'LINKS_UNAVAILABLE')}},code||e?.code==='23505'?409:e?.name==='ZodError'||e instanceof SyntaxError||e?.message==='UNSAFE_DESTINATION'?422:503)}}
 }
}
