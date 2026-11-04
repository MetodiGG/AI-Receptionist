import { z } from 'zod'
import { requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { PRIVATE_RESPONSE_HEADERS } from '../../../../lib/booking-safety.mjs'
export async function GET(request){const json=(b,status=200)=>Response.json(b,{status,headers:PRIVATE_RESPONSE_HEADERS});try{const user=await requireUser(request);if(!user?.id||!user.email_confirmed_at||user.is_anonymous)return json({error:{code:'UNAUTHORIZED'}},401);const id=new URL(request.url).searchParams.get('business_id');if(!z.string().uuid().safeParse(id).success)return json({error:{code:'VALIDATION_ERROR'}},422);if(!await consumeRateLimit(request,{scope:`referral-summary:${user.id}`,limit:30,windowSeconds:60}))return json({error:{code:'RATE_LIMITED'}},429);const{data,error}=await getSupabaseAdmin().rpc('business_referral_summary',{p_business:id,p_actor:user.id});if(error)return json({error:{code:error.code==='42501'?'FORBIDDEN':'ANALYTICS_UNAVAILABLE'}},error.code==='42501'?403:503);return json({summary:data})}catch{return json({error:{code:'ANALYTICS_UNAVAILABLE'}},503)}}
