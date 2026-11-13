import { z } from 'zod'
import { openingHoursSchema } from './booking-mode.mjs'
import { businessMapsDirectionsUrl, validBusinessDirectionsPoint } from './business-directions.mjs'
import { validRegistrationPoint } from './business-registration-location.mjs'

export const profileDetailsSchema=z.object({
  description:z.object({bg:z.string().trim().max(2000).default(''),en:z.string().trim().max(2000).default('')}).strict().default({bg:'',en:''}),
  payments:z.array(z.enum(['cash','card','bank'])).max(3).default([]),
  brands:z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  latitude:z.number().min(-90).max(90).nullable().default(null),longitude:z.number().min(-180).max(180).nullable().default(null),
}).strict().refine(value=>(value.latitude===null)===(value.longitude===null))
// Write boundary only: a globally valid pair such as 0,0 is not a usable
// Bulgarian business pin. Keep legacy read normalization separate so a bad
// stored pin cannot discard otherwise valid descriptions, payments or brands.
export const profileWriteDetailsSchema = profileDetailsSchema.refine(value =>
  value.latitude === null || validRegistrationPoint(value), { message: 'Choose a valid Bulgarian business point', path: ['latitude'] })
export function publicProfileDetails(business) {
  const value = business?.public_profile
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  // Legacy bad/missing/partial pairs are unknown, never 0 km. Strip only the
  // pin before parsing so valid non-location profile fields remain intact.
  const point = validRegistrationPoint(raw)
    ? { latitude: raw.latitude, longitude: raw.longitude }
    : { latitude: null, longitude: null }
  const parsed = profileDetailsSchema.safeParse({ ...raw, ...point })
  return parsed.success ? parsed.data : profileDetailsSchema.parse({})
}
export function businessLocationAttribution(business) {
  const source = Array.isArray(business?.location_source) ? business.location_source[0] : business?.location_source
  const point = publicProfileDetails(business)
  return source && point.latitude != null && point.longitude != null
    && Number(source.latitude) === point.latitude && Number(source.longitude) === point.longitude
    && source.licence === 'ODbL-1.0' && source.attribution === '© OpenStreetMap contributors'
    && /^https:\/\/www\.openstreetmap\.org\/(?:node|way|relation)\/[1-9]\d{0,19}$/.test(source.source_url || '')
    ? { label: '© OpenStreetMap contributors', sourceUrl: source.source_url, licenceUrl: 'https://www.openstreetmap.org/copyright' } : null
}
export function groupBusinessServices(services,locale='bg') {
  const groups=new Map()
  for(const service of services||[]){const name=service.category?.trim()||(locale==='en'?'Services':'Услуги');if(!groups.has(name))groups.set(name,[]);groups.get(name).push(service)}
  return [...groups].map(([name,services])=>({name,services}))
}
export function businessWeeklyHours(business) {
  const publicHours=openingHoursSchema.safeParse(business.opening_hours)
  if(publicHours.success)return [...publicHours.data].sort((a,b)=>a.weekday-b.weekday).map(d=>({weekday:d.weekday,periods:d.periods.map(p=>`${p.open}–${p.close}`)}))
  const active=new Set((business.staff||[]).map(person=>person.id))
  const minutes=value=>Number(value.slice(0,2))*60+Number(value.slice(3,5))
  const label=value=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`
  return Array.from({length:7},(_,index)=>{
    const weekday=index+1,periods=[]
    for(const row of business.workingHours||[]){if(row.weekday!==weekday||!active.has(row.staff_id))continue
      const open=minutes(row.open_time),close=minutes(row.close_time)
      if(row.break_start&&row.break_end){periods.push([open,minutes(row.break_start)],[minutes(row.break_end),close])}else periods.push([open,close])
    }
    periods.sort((a,b)=>a[0]-b[0]);const merged=[]
    for(const period of periods){if(period[0]>=period[1])continue;const last=merged.at(-1);if(last&&period[0]<=last[1])last[1]=Math.max(last[1],period[1]);else merged.push([...period])}
    return {weekday,periods:merged.map(([start,end])=>`${label(start)}–${label(end)}`)}
  })
}
export function businessDirectionsUrl(business) {
  if(!business.address)return null
  return businessMapsDirectionsUrl(business)
}
export function businessMapUrl(business) {
  const p=publicProfileDetails(business)
  if(!validBusinessDirectionsPoint(p))return null
  const url=new URL('https://www.openstreetmap.org/export/embed.html')
  url.searchParams.set('bbox',[p.longitude-.005,p.latitude-.003,p.longitude+.005,p.latitude+.003].join(','))
  url.searchParams.set('layer','mapnik');url.searchParams.set('marker',`${p.latitude},${p.longitude}`)
  return url.href
}
