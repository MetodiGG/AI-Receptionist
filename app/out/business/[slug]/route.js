import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createOutboundHandler } from '../../../../lib/outbound-booking.mjs'
import { verifyBookingDestination } from '../../../../lib/booking-destination-server'
const handler=createOutboundHandler({verifyDestination:verifyBookingDestination,allowAttempt:request=>consumeRateLimit(request,{scope:'partner-outbound',limit:20,windowSeconds:60,includeUserAgent:false}),resolve:async slug=>{if(!/^[a-z0-9-]{2,64}$/.test(slug))return null;const{data:b,error}=await getSupabaseAdmin().from('businesses').select('id,external_booking_url,external_booking_consent_at').eq('slug',slug).eq('booking_mode','external').eq('active',true).eq('platform_status','enabled').maybeSingle();if(error)throw error;return b?.external_booking_consent_at?{businessId:b.id,url:b.external_booking_url}:null},record:async target=>{const{error}=await getSupabaseAdmin().from('booking_referral_events').insert({...(target.eventId?{id:target.eventId}:{}),business_id:target.businessId,event_type:'outbound_click'});if(error)throw error}})
export async function POST(request,context){return handler(request,(await context.params).slug)}
// No GET redirect or tracking: crawlers/Link prefetch cannot create referrals.
export function GET(){return new Response('Use the booking button on the GoRez business profile.',{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}})}
