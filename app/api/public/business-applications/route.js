import { createBusinessApplicationHandler,isReservedApplicationEmail } from '../../../../lib/business-application.mjs'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { requireUser } from '../../../../lib/server-auth'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { after } from 'next/server'

export const POST=createBusinessApplicationHandler({
  allowAttempt:request=>consumeRateLimit(request,{scope:'business-application',limit:3,windowSeconds:3600,includeUserAgent:false}),
  authenticate:requireUser,
  reserved:email=>isReservedApplicationEmail(email,process.env.PLATFORM_ADMIN_EMAILS),
  createAccount:async ({email,password})=>{
    // Admin creation sends no confirmation email. Login stays locked until review.
    const {data,error}=await getSupabaseAdmin().auth.admin.createUser({email,password,email_confirm:false,app_metadata:{gorez_business_application:true}})
    if(error){if(['email_exists','email_exists_in_another_user','email_address_not_authorized','user_already_exists'].includes(error.code)||error.status===422)return null;throw error}
    return data.user
  },
  deleteAccount:async id=>{
    const db=getSupabaseAdmin()
    // A lost RPC response may hide a successful commit. Never cascade-delete it.
    const existing=await db.from('businesses').select('id').eq('owner_id',id).limit(1)
    if(existing.error)throw existing.error
    if(existing.data?.length)return
    const {error}=await db.auth.admin.deleteUser(id);if(error)throw error
  },
  save:async ({ownerId,requiresActivation,record})=>{
    const {error}=await getSupabaseAdmin().rpc('submit_business_application',{p_owner:ownerId,p_requires_activation:requiresActivation,p_application:record})
    if(error)throw error
  },
  notify:async record=>{
    after(async()=>{
      const recipients=String(process.env.PLATFORM_ADMIN_EMAILS||'').split(',').map(value=>value.trim()).filter(Boolean)
      if(!recipients.length||!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return
      try{await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(8000),body:JSON.stringify({from:process.env.EMAIL_FROM,to:recipients,subject:`GoRez · Business application: ${record.business.name}`,text:[record.business.name,record.business.city,record.email,record.business.phone,`${record.services.length} services · ${record.staff.length} team members`,'Review: https://www.gorez.co/admin?lang=bg'].join('\n')})})}catch{console.error('Business application admin notification unavailable.')}
    })
  },
})
