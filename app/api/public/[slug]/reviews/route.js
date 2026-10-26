import { z } from 'zod'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { publicReviewPage, reviewFailure } from '../../../../../lib/reviews.mjs'

export async function GET(request,{params}) {
  try {
    const {slug}=await params
    if(!/^[a-z0-9-]{2,64}$/.test(slug))return reviewFailure('NOT_FOUND',404)
    if(!await consumeRateLimit(request,{scope:'public-reviews',limit:90,windowSeconds:60}))return reviewFailure('RATE_LIMITED',429)
    const query=new URL(request.url).searchParams,before=query.get('before'),id=query.get('id')
    if((before||id)&&(!z.string().datetime({offset:true}).safeParse(before).success||!z.string().uuid().safeParse(id).success))return reviewFailure('VALIDATION_ERROR',422)
    const db=getSupabaseAdmin(),business=await db.from('businesses').select('id').eq('slug',slug).eq('active',true).eq('platform_status','enabled').maybeSingle()
    if(business.error)throw business.error
    if(!business.data)return reviewFailure('NOT_FOUND',404)
    const {data,error}=await db.rpc('public_business_reviews',{p_business_id:business.data.id,p_before:before||null,p_before_id:id||null})
    if(error)throw error
    if(!data)return reviewFailure('NOT_FOUND',404)
    return Response.json(publicReviewPage(data),{headers:{'Cache-Control':'no-store'}})
  } catch{return reviewFailure('REVIEWS_UNAVAILABLE',503)}
}
