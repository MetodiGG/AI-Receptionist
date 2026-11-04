import { z } from 'zod'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { userNavigationRequest } from '../../../../../lib/outbound-booking.mjs'
export async function POST(request,context) {
 if(!userNavigationRequest(request))return new Response(null,{status:403})
 if(!await consumeRateLimit(request,{scope:'profile-view',limit:30,windowSeconds:60,includeUserAgent:false}))return new Response(null,{status:429})
 try{const{slug}=await context.params;if(!/^[a-z0-9-]{2,64}$/.test(slug)||Number(request.headers.get('content-length'))>100)return new Response(null,{status:422});const raw=await request.text();if(raw.length>100)return new Response(null,{status:422});const input=z.object({id:z.string().uuid()}).strict().parse(JSON.parse(raw));const db=getSupabaseAdmin();const{data:b,error}=await db.from('businesses').select('id').eq('slug',slug).eq('active',true).eq('platform_status','enabled').maybeSingle();if(error)throw error;if(!b)return new Response(null,{status:404});await db.from('booking_referral_events').upsert({id:input.id,business_id:b.id,event_type:'profile_view'},{onConflict:'id',ignoreDuplicates:true});return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})}catch{return new Response(null,{status:204})}
}
