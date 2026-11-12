import { z } from 'zod'
import { servicePriceForDisplay } from './currency-display.mjs'

// Destinations are navigation only: never fetched, proxied or followed by GoRez.
// Literal addresses are deliberately disallowed, including encoded IPv4/IPv6.
export function safeBookingUrl(value) {
  if(typeof value!=='string'||value.length>2048||/[\u0000-\u0020\\]/u.test(value))return null
  try {
    const url=new URL(value),host=url.hostname.toLowerCase()
    if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash||!host.includes('.')||host.endsWith('.')||/^\[|^[\d.]+$/.test(host))return null
    if(/(?:^|\.)(localhost|local|internal|test|invalid|example|onion|home|lan|arpa)$/.test(host)||['metadata.google.internal','metadata.google','localhost.localdomain'].includes(host))return null
    if(!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host))return null
    // Never persist private tokens, direct URL redirectors or user-supplied hops.
    for(const key of url.searchParams.keys())if(/^(?:url|redirect|redirect_uri|redirect_url|return_url|next|continue|token|access_token|password)$/i.test(key))return null
    return url.href
  }catch{return null}
}
const clock=z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
// Navigation only: no dial controls, extensions, URLs or inferred country code.
export function safeBookingPhone(value) {
 if(typeof value!=='string'||value.length>32||!/^[+()\d .-]+$/.test(value))return null
 const normalized=value.replace(/[() .-]/g,'')
 return /^\+?\d{7,15}$/.test(normalized)?`tel:${normalized}`:null
}
const period=z.object({open:clock,close:clock}).strict().refine(p=>p.open<p.close)
export const openingHoursSchema=z.array(z.object({weekday:z.number().int().min(1).max(7),periods:z.array(period).max(2)}).strict()).length(7).refine(days=>new Set(days.map(d=>d.weekday)).size===7&&days.every(d=>d.periods.every((p,i)=>!i||p.open>=d.periods[i-1].close)))
export const bookingSettingsSchema=z.object({mode:z.enum(['gorez','external','phone']),url:z.string().max(2048).default(''),consent:z.boolean().default(false),openingHours:openingHoursSchema,revision:z.number().int().nonnegative(),acknowledgeUpcoming:z.boolean().default(false)}).strict().superRefine((v,ctx)=>{if(v.mode==='external'&&(!v.consent||!safeBookingUrl(v.url)))ctx.addIssue({code:'custom',path:['url'],message:'A secure direct booking URL and explicit permission are required.'})})
export const isExternalBooking=business=>business?.booking_mode==='external'
export const isPhoneBooking=business=>business?.booking_mode==='phone'
export const isOffsiteBooking=business=>isExternalBooking(business)||isPhoneBooking(business)
export function assertInternalBooking(business,locale='bg') {
  if(isPhoneBooking(business)) {
   const error=new Error(locale==='en'?'Contact the business by phone to arrange an appointment.':'Свържи се с бизнеса по телефон, за да уговориш час.')
   error.code='PHONE_BOOKING';throw error
  }
  if(!isExternalBooking(business))return
  const error=new Error(locale==='en'?"Check available times on the business's website.":'Провери свободните часове в сайта на бизнеса.')
  error.code='EXTERNAL_BOOKING';throw error
}
export const emptyOpeningHours=()=>Array.from({length:7},(_,i)=>({weekday:i+1,periods:[]}))
export function publicHoursFromSchedule(days) {
  return days.map(d=>({weekday:d.weekday,periods:!d.enabled?[]:d.breakEnabled?[{open:d.open,close:d.breakStart},{open:d.breakEnd,close:d.close}]:[{open:d.open,close:d.close}]}))
}
export function bookingAction(business,locale='bg') {
  const external=isExternalBooking(business),phone=isPhoneBooking(business)
  return {external,phone,href:phone?safeBookingPhone(business.phone):external?`/out/business/${encodeURIComponent(business.slug)}?lang=${locale}`:`/book/${encodeURIComponent(business.slug)}?lang=${locale}`,profileHref:`/book/${encodeURIComponent(business.slug)}?lang=${locale}`}
}
export function servicePriceLabel(value,currency='EUR',locale='bg') {
 const unknown=locale==='en'?'Ask the business':'Уточни с бизнеса'
 if(value==null||typeof value==='string'&&!value.trim()||!Number.isFinite(Number(value))||Number(value)<0)return unknown
 const display=servicePriceForDisplay({price:Number(value),currency})
 return display.price==null?unknown:new Intl.NumberFormat(locale==='en'?'en-IE':'bg-BG',{style:'currency',currency:display.currency}).format(display.price)
}
