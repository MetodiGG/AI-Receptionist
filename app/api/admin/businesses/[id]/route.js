import { requireUser,isPlatformAdmin } from '../../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { createAdminBusinessHandlers } from '../../../../../lib/platform-admin.mjs'
import { activateApplicationOwner } from '../../../../../lib/business-application-review'

const handlers=createAdminBusinessHandlers({
  authenticate:async request=>({user:await requireUser(request),token:(request.headers.get('authorization')||'').slice(7)}),
  isAdmin:isPlatformAdmin,
  allowAttempt:(request,id)=>consumeRateLimit(request,{scope:`platform-business:${id}`,limit:20,windowSeconds:900}),
  read:async id=>{
    const db=getSupabaseAdmin()
    const business=await db.from('businesses').select('id,name,slug,active,platform_status,platform_revision,city,address,industry,contact_email,phone,created_at').eq('id',id).maybeSingle()
    if(business.error)throw business.error
    if(!business.data)return null
    const [services,staff,customers,bookings,upcoming]=await Promise.all([
      db.from('services').select('id,name,duration_min,price,currency,active').eq('business_id',id).order('name'),
      db.from('staff').select('id,name,active').eq('business_id',id).order('name'),
      db.from('customers').select('id',{count:'exact',head:true}).eq('business_id',id),
      db.from('appointments').select('id',{count:'exact',head:true}).eq('business_id',id),
      db.from('appointments').select('id',{count:'exact',head:true}).eq('business_id',id).in('status',['booked','confirmed']).gt('ends_at',new Date().toISOString()),
    ])
    for(const result of [services,staff,customers,bookings,upcoming])if(result.error)throw result.error
    return {business:business.data,services:services.data,staff:staff.data,counts:{customers:customers.count,bookings:bookings.count,upcoming:upcoming.count}}
  },
  mutate:async ({id,actorId,action,revision,confirmation,reason})=>{
    if(action==='publish')await activateApplicationOwner(getSupabaseAdmin(),id,{revision,confirmation})
    const {data,error}=await getSupabaseAdmin().rpc('platform_business_action',{p_business_id:id,p_actor_id:actorId,p_action:action,p_revision:revision,p_confirmation:confirmation,p_reason:reason})
    if(error)throw error
    return data
  },
})
export async function GET(request,context){const {id}=await context.params;return handlers.GET(request,id)}
export async function POST(request,context){const {id}=await context.params;return handlers.POST(request,id)}
