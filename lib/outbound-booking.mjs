import { safeBookingUrl } from './booking-mode.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'
export const validPlaceId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{10,256}$/.test(value)
export function approvedExternalLink(row,now=Date.now()) {
 const checked=Date.parse(row?.last_checked_at),verified=Date.parse(row?.verified_at)
 return Boolean(row?.verification_status==='approved'&&!row.disabled_at&&row.verified_by&&Number.isFinite(checked)&&Number.isFinite(verified)&&checked<=now&&verified<=now&&checked>=now-90*86400000&&safeBookingUrl(row.booking_url))
}
export function userNavigationRequest(request) {
 return request.method==='POST'&&request.headers.get('origin')===new URL(request.url).origin&&request.headers.get('sec-fetch-site')!=='cross-site'&&!request.headers.has('next-router-prefetch')&&!/prefetch/i.test(request.headers.get('purpose')||request.headers.get('sec-purpose')||'')
}
export function createOutboundHandler({resolve,record,allowAttempt,verifyDestination=async url=>safeBookingUrl(url),now=()=>Date.now()}) {
 return async(request,id)=>{
  const fail=(code,status)=>Response.json({error:{code}},{status,headers:PRIVATE_RESPONSE_HEADERS})
  if(!userNavigationRequest(request))return fail('FORBIDDEN',403)
  try {
   if(!await allowAttempt(request))return fail('RATE_LIMITED',429)
   if(Number(request.headers.get('content-length'))>512)return fail('VALIDATION_ERROR',422)
   const raw=await request.text();if(raw.length>512)return fail('VALIDATION_ERROR',422)
   const eventId=new URLSearchParams(raw).get('eventId')
   const target=await resolve(id)
   if(!target||!safeBookingUrl(target.url))return fail('BOOKING_LINK_UNAVAILABLE',404)
   if(target.link&&!approvedExternalLink(target.link,now()))return fail('BOOKING_LINK_UNAVAILABLE',404)
   // Recheck DNS on navigation as well as on save/approval. No HTTP fetch or
   // redirect following: this endpoint must never become an SSRF proxy.
   await verifyDestination(target.url)
   // Analytics are best effort, anonymous counts only. A storage outage must
   // not block a genuine navigation. No cookies, IP, session IDs or query text.
   let timer
   try{await Promise.race([Promise.resolve().then(()=>record({...target,eventId:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId||'')?eventId:null})),new Promise(resolve=>{timer=setTimeout(resolve,800)})])}catch{}finally{clearTimeout(timer)}
   return new Response(null,{status:303,headers:{...PRIVATE_RESPONSE_HEADERS,'Referrer-Policy':'no-referrer','Location':safeBookingUrl(target.url)}})
  }catch{return fail('BOOKING_LINK_UNAVAILABLE',503)}
 }
}
export function referralStats(events=[],appointments=[]) {
 const views=events.filter(e=>e.event_type==='profile_view').length,clicks=events.filter(e=>e.event_type==='outbound_click').length
 const bookings=appointments.filter(a=>['booked','confirmed','done'].includes(a.status)&&['web','bot'].includes(a.source)).length
 // Outbound clicks also originate in search/directory cards, so profile views
 // alone are not a meaningful denominator. Never manufacture a conversion %.
 return {views,clicks,clickThroughRate:null,bookings}
}
