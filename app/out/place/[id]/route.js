import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createOutboundHandler } from '../../../../lib/outbound-booking.mjs'
import { verifyBookingDestination } from '../../../../lib/booking-destination-server'
import { z } from 'zod'
const handler=createOutboundHandler({verifyDestination:verifyBookingDestination,allowAttempt:request=>consumeRateLimit(request,{scope:'nonpartner-outbound',limit:20,windowSeconds:60,includeUserAgent:false}),resolve:async id=>{if(!z.string().uuid().safeParse(id).success)return null;const{data:link,error}=await getSupabaseAdmin().from('external_booking_links').select('*').eq('id',id).maybeSingle();if(error)throw error;if(!link)return null;const linked=await getSupabaseAdmin().from('business_place_links').select('business_id').eq('place_id',link.place_id).limit(1);if(linked.error)throw linked.error;if(linked.data?.length)return null;return {linkId:link.id,url:link.booking_url,link}},record:async target=>{const{error}=await getSupabaseAdmin().from('booking_referral_events').insert({...(target.eventId?{id:target.eventId}:{}),external_link_id:target.linkId,event_type:'outbound_click'});if(error)throw error}})
export async function POST(request,context){return handler(request,(await context.params).id)}
export function GET(){return new Response('Use the verified booking button in GoRez.',{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}})}
