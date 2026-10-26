import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { createReviewHandlers } from '../../../../../lib/reviews.mjs'

const checked = result => {if(result.error)throw result.error;return result.data}
const handlers=createReviewHandlers({
  lookup:async token=>checked(await getSupabaseAdmin().from('review_invitations').select('available_at,expires_at,used_at,revoked_at,appointment_revision,appointment:appointments(status,ends_at,notification_revision,business:businesses(name,slug,active,platform_status),service:services(name))').eq('token',token).maybeSingle()),
  save:async(token,body)=>checked(await getSupabaseAdmin().rpc('submit_booking_review',{p_token:token,p_body:body})),
  allowAttempt:(request,action)=>consumeRateLimit(request,{scope:`reviews-${action}`,limit:action==='write'?5:40,windowSeconds:60}),
})
export async function GET(request,{params}){return handlers.GET(request,(await params).token)}
export async function POST(request,{params}){return handlers.POST(request,(await params).token)}
