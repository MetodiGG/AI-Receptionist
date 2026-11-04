import { requireUser,isPlatformAdmin } from '../../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../../lib/rate-limit'
import { createBookingSettingsHandler } from '../../../../../../lib/booking-settings.mjs'
import { verifyBookingDestination } from '../../../../../../lib/booking-destination-server'
const handler=createBookingSettingsHandler({authenticate:requireUser,authorize:user=>isPlatformAdmin(user),allowAttempt:(request,id)=>consumeRateLimit(request,{scope:`admin-booking-settings:${id}`,limit:30,windowSeconds:60}),verifyDestination:verifyBookingDestination,save:async({user,id,input:v})=>{const{error}=await getSupabaseAdmin().rpc('save_booking_settings',{p_business:id,p_actor:user.id,p_admin:true,p_revision:v.revision,p_mode:v.mode,p_url:v.url,p_consent:v.consent,p_hours:v.openingHours,p_acknowledge:v.acknowledgeUpcoming});if(error)throw error}})
export async function PATCH(request,context){return handler(request,(await context.params).id)}
