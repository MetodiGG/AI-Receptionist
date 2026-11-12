import { z } from 'zod'
import { leadSubmissionSchema } from './partner-submission.mjs'
import { businessLocationFields, findCity } from './business-location.mjs'
import { scheduleProblem, scheduleRows } from './business-schedule.mjs'
import { PARTNER_CATEGORY_KEYS } from './partner-leads.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'
import { safeBookingUrl, safeBookingPhone, isOffsiteBooking, emptyOpeningHours, openingHoursSchema, publicHoursFromSchedule } from './booking-mode.mjs'
import { profileDetailsSchema } from './business-profile.mjs'
import { applicationServiceSchema } from './service-pricing.mjs'
import { readBoundedApplicationText } from './business-application-limits.mjs'

const text = max => z.string().trim().min(2).max(max)
const duration = z.coerce.number().int().min(5).max(1440)
const day = z.object({weekday:z.number().int().min(1).max(7),enabled:z.boolean(),open:z.string(),close:z.string(),breakEnabled:z.boolean(),breakStart:z.string(),breakEnd:z.string()}).strict()
export const businessApplicationSchema = z.object({
  business:z.object({
    name:text(120),slug:z.string().min(3).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    phone:leadSubmissionSchema.shape.phone,contact_email:leadSubmissionSchema.shape.email,
    address:text(250),timezone:z.enum(['Europe/Sofia','Europe/London','Europe/Berlin']),industry:z.enum(PARTNER_CATEGORY_KEYS),
    city_ekatte:z.string().refine(value=>Boolean(findCity(value))),neighborhood:z.string().trim().max(120),
    default_duration_min:duration.default(45),booking_slot_minutes:z.coerce.number().refine(value=>[5,10,15,20,30,45,60].includes(value)).default(15),
    website_url:z.string().max(2048).default('').refine(v=>!v||Boolean(safeBookingUrl(v))).transform(v=>safeBookingUrl(v)||''),
    booking_mode:z.enum(['gorez','external','phone']).default('gorez'),external_booking_url:z.string().max(2048).default('').transform(v=>safeBookingUrl(v)||v),external_booking_consent:z.boolean().default(false),
    opening_hours:openingHoursSchema.optional(),public_profile:profileDetailsSchema.optional(),booking_terms:z.string().max(5000).default(''),
  }).strict(),
  services:z.array(applicationServiceSchema).min(1).max(40),
  staff:z.array(z.object({name:text(100),bio:z.string().max(2000).optional()}).strict()).max(20).default([]),
  schedule:z.array(day).max(7).default([]).refine(days=>!days.length||(days.length===7&&new Set(days.map(row=>row.weekday)).size===7&&!scheduleProblem(days))),
  account:z.object({email:leadSubmissionSchema.shape.email,password:z.string().max(128)}).strict(),
  locale:z.enum(['bg','en']),consent:z.literal(true),company:z.string().max(0),
}).strict().superRefine((v,ctx)=>{
  if(v.business.booking_mode==='external') {
    if(!v.business.external_booking_consent||!safeBookingUrl(v.business.external_booking_url))ctx.addIssue({code:'custom',path:['business','external_booking_url'],message:'BOOKING_URL_REQUIRED'})
    if(!v.business.opening_hours)ctx.addIssue({code:'custom',path:['business','opening_hours'],message:'OPENING_HOURS_REQUIRED'})
  } else if(v.business.booking_mode==='phone') {
    if(!safeBookingPhone(v.business.phone))ctx.addIssue({code:'custom',path:['business','phone'],message:'BOOKING_PHONE_REQUIRED'})
  } else if(!v.staff.length||v.schedule.length!==7||!v.schedule.some(d=>d.enabled)||v.services.some(s=>s.price==null||s.duration_min==null))ctx.addIssue({code:'custom',path:['schedule'],message:'INTERNAL_SETUP_REQUIRED'})
})

export function applicationRecord(input) {
  const offsite=isOffsiteBooking(input.business)
  return {business:{...input.business,...businessLocationFields(input.business.city_ekatte,input.business.neighborhood),notification_locale:input.locale,opening_hours:offsite?(input.business.opening_hours||emptyOpeningHours()):publicHoursFromSchedule(input.schedule)},
    services:input.services,staff:input.staff,hours:offsite?[]:scheduleRows(input.schedule),email:input.account.email,locale:input.locale}
}
export function isReservedApplicationEmail(email,allowlist='') {
  return allowlist.split(',').map(value=>value.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase())
}
export function platformAdminIdentity(user,allowlist='') {
  return Boolean(user?.email&&user.email_confirmed_at&&!user.is_anonymous&&!user.app_metadata?.gorez_business_application&&isReservedApplicationEmail(user.email,allowlist))
}

const json=(data,status=200)=>Response.json(data,{status,headers:PRIVATE_RESPONSE_HEADERS})
const fail=(code,status)=>json({error:{code}},status)
// Dependencies keep Auth/SQL behavior testable without creating real accounts.
export function createBusinessApplicationHandler({allowAttempt,authenticate,reserved,createAccount,deleteAccount,save,notify,readSubmission,prepareImages}) {
  return async request=>{
    let createdId=null,committed=false
    try {
      const origin=request.headers.get('origin')
      if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return fail('FORBIDDEN',403)
      let value,files=[]
      if(readSubmission&&request.headers.get('content-type')?.startsWith('multipart/form-data')){
        try{({value,files}=await readSubmission(request))}catch{return fail('VALIDATION_ERROR',422)}
      }else{
        if(!request.headers.get('content-type')?.startsWith('application/json'))return fail('VALIDATION_ERROR',422)
        let raw
        try{raw=await readBoundedApplicationText(request)}catch{return fail('VALIDATION_ERROR',422)}
        try{value=JSON.parse(raw)}catch{return fail('VALIDATION_ERROR',422)}
      }
      const input=businessApplicationSchema.safeParse(value)
      if(!input.success)return fail('VALIDATION_ERROR',422)
      if(!await allowAttempt(request))return fail('RATE_LIMITED',429)
      // A portrait is optional and cannot stand in for the business gallery.
      // Count actual uploaded files, never a client-provided photoCount or URL.
      if(!files.some(row=>row.staffIndex===null))return fail('BUSINESS_PHOTO_REQUIRED',422)
      let images=[]
      try{if(files.length)images=await prepareImages(files,input.data.staff.length)}catch{return fail('INVALID_IMAGE',422)}
      if(!images.some(row=>row.staffIndex===null&&row.image))return fail('INVALID_IMAGE',422)
      const user=await authenticate(request),{account}=input.data
      if(request.headers.get('authorization')&&!user)return fail('SIGN_IN_REQUIRED',409)
      if(user&&(!user.email_confirmed_at||user.is_anonymous||user.email?.toLowerCase()!==account.email))return fail('SIGN_IN_REQUIRED',409)
      if(!user&&(account.password.length<10||reserved(account.email)))return fail('SIGN_IN_REQUIRED',409)
      let ownerId=user?.id
      if(!ownerId) {
        const created=await createAccount(account)
        if(!created?.id)return fail('SIGN_IN_REQUIRED',409)
        createdId=ownerId=created.id
      }
      const record=applicationRecord(input.data)
      const saved=await save({ownerId,requiresActivation:Boolean(createdId),record,images})
      committed=true
      // A notification outage must never undo or duplicate an accepted application.
      try{await notify(record)}catch{}
      return json({ok:true,pending:true,...(images.length?{photos:{requested:images.length,saved:saved?.photosSaved||0}}:{})},201)
    } catch(error) {
      return fail(error?.code==='23505'?'ADDRESS_IN_USE':'APPLICATION_UNAVAILABLE',error?.code==='23505'?409:503)
    } finally {
      if(createdId&&!committed){try{await deleteAccount(createdId)}catch{ /* Never delete an existing identity. */ }}
    }
  }
}
