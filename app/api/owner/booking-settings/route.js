import { requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createBookingSettingsHandler } from '../../../../lib/booking-settings.mjs'
import { verifyBookingDestination } from '../../../../lib/booking-destination-server'
const checked=r=>{if(r.error)throw r.error;return r.data}
const handler=createBookingSettingsHandler({authenticate:requireUser,authorize:async(user,id)=>Boolean(checked(await getSupabaseAdmin().from('businesses').select('id').eq('id',id).eq('owner_id',user.id).maybeSingle())),allowAttempt:(request,id)=>consumeRateLimit(request,{scope:`booking-settings:${id}`,limit:15,windowSeconds:60}),verifyDestination:verifyBookingDestination,save:async({user,id,input:v})=>{checked(await getSupabaseAdmin().rpc('save_booking_settings',{p_business:id,p_actor:user.id,p_admin:false,p_revision:v.revision,p_mode:v.mode,p_url:v.url,p_consent:v.consent,p_hours:v.openingHours,p_acknowledge:v.acknowledgeUpcoming}))}})
export async function PATCH(request){return handler(request,new URL(request.url).searchParams.get('business_id'))}
