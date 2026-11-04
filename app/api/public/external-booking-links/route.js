import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { approvedExternalLink,validPlaceId,userNavigationRequest } from '../../../../lib/outbound-booking.mjs'
import { PRIVATE_RESPONSE_HEADERS } from '../../../../lib/booking-safety.mjs'
export async function POST(request){
 const json=(b,s=200)=>Response.json(b,{status:s,headers:PRIVATE_RESPONSE_HEADERS})
 if(!userNavigationRequest(request))return json({error:{code:'FORBIDDEN'}},403)
 if(!await consumeRateLimit(request,{scope:'external-booking-lookup',limit:30,windowSeconds:60,includeUserAgent:false}))return json({error:{code:'RATE_LIMITED'}},429)
 try{if(Number(request.headers.get('content-length'))>1000)return json({error:{code:'VALIDATION_ERROR'}},422);const raw=await request.text();if(raw.length>1000)return json({error:{code:'VALIDATION_ERROR'}},422);const input=JSON.parse(raw);if(!validPlaceId(input.placeId)||Object.keys(input).length!==1)return json({error:{code:'VALIDATION_ERROR'}},422);const db=getSupabaseAdmin();const linked=await db.from('business_place_links').select('business_id').eq('place_id',input.placeId).limit(1);if(linked.error)throw linked.error;if(linked.data?.length)return json({booking:null});const{data:row,error}=await db.from('external_booking_links').select('*').eq('place_id',input.placeId).maybeSingle();if(error)throw error;return json({booking:approvedExternalLink(row)?{id:row.id,label:row.label,verifiedAt:row.verified_at}:null})}catch{return json({booking:null})}
}
