import { createBusinessApplicationHandler,isReservedApplicationEmail } from '../../../../lib/business-application.mjs'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { requireUser } from '../../../../lib/server-auth'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { after } from 'next/server'
import { randomUUID } from 'node:crypto'
import { readApplicationPhotos, prepareApplicationPhotos } from '../../../../lib/application-photos.mjs'
import { normalizeBusinessImage } from '../../../../lib/image-normalization.mjs'
import { checked, mediaAccess, uploadBusinessMedia } from '../../../../lib/business-media-server'
import { verifyBookingDestination } from '../../../../lib/booking-destination-server'

export const POST=createBusinessApplicationHandler({
  readSubmission:readApplicationPhotos,
  prepareImages:(files,count)=>prepareApplicationPhotos(files,count,normalizeBusinessImage),
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
  save:async ({ownerId,requiresActivation,record,images=[]})=>{
    if(record.business.booking_mode==='external')await verifyBookingDestination(record.business.external_booking_url)
    const db=getSupabaseAdmin()
    const prepared={...record,staff:record.staff.map(person=>({...person,id:randomUUID()}))}
    const {data:leadId,error}=await db.rpc('submit_business_application',{p_owner:ownerId,p_requires_activation:requiresActivation,p_application:prepared})
    if(error)throw error
    // The application is already durable. An image/provider outage must not
    // undo it or ask the user to resubmit a second business/account.
    let photosSaved=0
    try{
      if(images.length){
        const lead=checked(await db.from('partner_leads').select('business_id').eq('id',leadId).single())
        for(const row of images){
          const business=await mediaAccess(lead.business_id)
          if(!business||business.owner_id!==ownerId)throw new Error('WRONG_BUSINESS')
          await uploadBusinessMedia({businessId:business.id,actorId:ownerId,admin:false,revision:business.content_revision,staffId:row.staffIndex===null?null:prepared.staff[row.staffIndex].id,alt:'',image:row.image,mediaId:randomUUID(),application:true})
          photosSaved++
        }
      }
    }catch{ /* Return a truthful partial-photo status, never a duplicate signup. */ }
    return {photosSaved}
  },
  notify:async record=>{
    after(async()=>{
      const recipients=String(process.env.PLATFORM_ADMIN_EMAILS||'').split(',').map(value=>value.trim()).filter(Boolean)
      if(!recipients.length||!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return
      try{await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(8000),body:JSON.stringify({from:process.env.EMAIL_FROM,to:recipients,subject:`GoRez · Business application: ${record.business.name}`,text:[record.business.name,record.business.city,record.email,record.business.phone,`${record.services.length} services · ${record.staff.length} team members`,'Review: https://www.gorez.co/admin?lang=bg'].join('\n')})})}catch{console.error('Business application admin notification unavailable.')}
    })
  },
})
