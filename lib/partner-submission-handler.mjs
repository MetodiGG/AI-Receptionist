import { leadSubmissionSchema } from './partner-submission.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'
const json=(body,status=200)=>Response.json(body,{status,headers:PRIVATE_RESPONSE_HEADERS})
const fail=(code,status)=>json({error:{code}},status)
export function createPartnerSubmissionHandler({allowAttempt,save,notify}) {
  return async request=>{
    try{
      const origin=request.headers.get('origin')
      if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return fail('FORBIDDEN',403)
      if(!request.headers.get('content-type')?.startsWith('application/json'))return fail('VALIDATION_ERROR',422)
      if(!await allowAttempt(request))return fail('RATE_LIMITED',429)
      const raw=await request.text()
      if(raw.length>5000)return fail('VALIDATION_ERROR',422)
      let parsed
      try{parsed=JSON.parse(raw)}catch{return fail('VALIDATION_ERROR',422)}
      const input=leadSubmissionSchema.safeParse(parsed)
      if(!input.success)return fail('VALIDATION_ERROR',422)
      const {duplicate}=await save(input.data)
      if(!duplicate)await notify(input.data).catch(()=>{})
      // This acknowledges a saved application, never account activation or delivery.
      return json({ok:true},duplicate?200:201)
    }catch{return fail('APPLICATION_UNAVAILABLE',503)}
  }
}
