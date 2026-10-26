import { z } from 'zod'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'

const rating = z.number().int().min(1).max(5)
export const reviewSchema = z.object({
  rating, displayName: z.string().trim().min(2).max(50).regex(/^[^\x00-\x1f<>]+$/u),
  comment: z.string().trim().max(1500).default(''), consent: z.literal(true),
  details: z.object({ quality: rating.optional(), service: rating.optional(), cleanliness: rating.optional(), atmosphere: rating.optional() }).strict().default({}),
}).strict()
export const REVIEW_DIMENSIONS = {
  quality: { bg: 'Качество', en: 'Quality' }, service: { bg: 'Обслужване', en: 'Service' },
  cleanliness: { bg: 'Чистота', en: 'Cleanliness' }, atmosphere: { bg: 'Атмосфера', en: 'Atmosphere' },
}
export const privateReviewJson = (body,status=200) => Response.json(body,{status,headers:PRIVATE_RESPONSE_HEADERS})
export const reviewFailure = (code,status) => privateReviewJson({error:{code}},status)
const validToken = value => z.string().uuid().safeParse(value).success

export function reviewVisit(invitation,now=Date.now()) {
  const a=invitation?.appointment,b=a?.business
  if(![a?.ends_at,invitation?.available_at,invitation?.expires_at].every(value=>Number.isFinite(Date.parse(value))))return null
  if(!a||!b?.active||b.platform_status!=='enabled'||a.status!=='done'||Date.parse(a.ends_at)>now
    ||invitation.revoked_at||Date.parse(invitation.available_at)>now||Date.parse(invitation.expires_at)<=now
    ||a.notification_revision!==invitation.appointment_revision) return null
  return {business:{name:b.name,slug:b.slug},service:a.service?.name||'',endsAt:a.ends_at,submitted:Boolean(invitation.used_at)}
}

export function createReviewHandlers({lookup,save,allowAttempt,now=Date.now}) {
  return {
    async GET(request,token) {
      try {
        if(!validToken(token))return reviewFailure('REVIEW_LINK_UNAVAILABLE',404)
        if(!await allowAttempt(request,'read'))return reviewFailure('RATE_LIMITED',429)
        const visit=reviewVisit(await lookup(token),now())
        return visit?privateReviewJson({visit}):reviewFailure('REVIEW_LINK_UNAVAILABLE',404)
      } catch {return reviewFailure('REVIEWS_UNAVAILABLE',503)}
    },
    async POST(request,token) {
      try {
        if(!validToken(token))return reviewFailure('REVIEW_LINK_UNAVAILABLE',404)
        const origin=request.headers.get('origin')
        if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return reviewFailure('FORBIDDEN',403)
        if(!request.headers.get('content-type')?.startsWith('application/json'))return reviewFailure('VALIDATION_ERROR',422)
        if(!await allowAttempt(request,'write'))return reviewFailure('RATE_LIMITED',429)
        if(Number(request.headers.get('content-length'))>8192)return reviewFailure('VALIDATION_ERROR',422)
        const text=await request.text()
        if(text.length>8192)return reviewFailure('VALIDATION_ERROR',422)
        const parsed=reviewSchema.safeParse(JSON.parse(text))
        if(!parsed.success)return reviewFailure('VALIDATION_ERROR',422)
        await save(token,parsed.data)
        return privateReviewJson({ok:true},201)
      } catch(error) {
        if(error instanceof SyntaxError)return reviewFailure('VALIDATION_ERROR',422)
        if(error?.message?.includes('REVIEW_ALREADY_SUBMITTED'))return reviewFailure('REVIEW_ALREADY_SUBMITTED',409)
        if(error?.message?.includes('REVIEW_LINK_UNAVAILABLE'))return reviewFailure('REVIEW_LINK_UNAVAILABLE',404)
        return reviewFailure('REVIEWS_UNAVAILABLE',503)
      }
    },
  }
}

export function publicReviewPage(result) {
  const items=(result.items||[]).slice(0,10),last=items.at(-1)
  return {summary:result.summary,items,next:result.items?.length>10?{before:last.created_at,id:last.id}:null}
}
