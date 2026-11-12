import { requireUser,isPlatformAdmin } from '../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { createAdminBusinessHandlers } from '../../../../../lib/platform-admin.mjs'
import { activateApplicationOwner } from '../../../../../lib/business-application-review'
import { scheduleBusinessApprovalEmail } from '../../../../../lib/business-approval-emails'

const handlers=createAdminBusinessHandlers({
  authenticate:async request=>({user:await requireUser(request),token:(request.headers.get('authorization')||'').slice(7)}),
  isAdmin:isPlatformAdmin,
  allowAttempt:(request,id)=>consumeRateLimit(request,{scope:`platform-business:${id}`,limit:20,windowSeconds:900}),
  read:async id=>{
    const db=getSupabaseAdmin()
    const business=await db.from('businesses').select('id,name,slug,booking_mode,external_booking_url,external_booking_consent_at,opening_hours,active,platform_status,platform_revision,content_revision,city,city_ekatte,neighborhood,address,industry,contact_email,phone,created_at,timezone,website_url,privacy_contact_email,booking_terms,default_duration_min,booking_slot_minutes,booking_window_days,minimum_notice_minutes,cancellation_notice_hours,email_notifications_enabled,notification_locale,review_requests_enabled,public_profile,welcome_message,bot_instructions,media_gallery_managed').eq('id',id).maybeSingle()
    if(business.error)throw business.error
    if(!business.data)return null
    const [services,staff,customers,bookings,upcoming,hours,contentAudit]=await Promise.all([
      db.from('services').select('id,name,description,category,duration_min,price,currency,price_details,active,sort_order').eq('business_id',id).order('sort_order').order('name'),
      db.from('staff').select('id,name,email,phone,bio,active,sort_order').eq('business_id',id).order('sort_order').order('name'),
      db.from('customers').select('id',{count:'exact',head:true}).eq('business_id',id),
      db.from('appointments').select('id',{count:'exact',head:true}).eq('business_id',id),
      db.from('appointments').select('id',{count:'exact',head:true}).eq('business_id',id).in('status',['booked','confirmed']).gt('ends_at',new Date().toISOString()),
      db.from('working_hours').select('staff_id,weekday,open_time,close_time,break_start,break_end').eq('business_id',id).order('weekday'),
      db.from('business_content_audit').select('section,actor_kind,reason,created_at').eq('business_id',id).order('created_at',{ascending:false}).limit(20),
    ])
    for(const result of [services,staff,customers,bookings,upcoming,hours,contentAudit])if(result.error)throw result.error
    return {business:business.data,services:services.data,staff:staff.data,hours:hours.data,contentAudit:contentAudit.data,counts:{customers:customers.count,bookings:bookings.count,upcoming:upcoming.count}}
  },
  mutate:async ({id,actorId,action,revision,confirmation,reason})=>{
    if(action==='publish')await activateApplicationOwner(getSupabaseAdmin(),id,{revision,confirmation})
    const {data,error}=await getSupabaseAdmin().rpc('platform_business_action',{p_business_id:id,p_actor_id:actorId,p_action:action,p_revision:revision,p_confirmation:confirmation,p_reason:reason})
    if(error)throw error
    if(action==='publish')scheduleBusinessApprovalEmail(id)
    return data
  },
})
export async function GET(request,context){const {id}=await context.params;return handlers.GET(request,id)}
export async function POST(request,context){const {id}=await context.params;return handlers.POST(request,id)}
