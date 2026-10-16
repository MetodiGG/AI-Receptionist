import { createProductEventHandler } from '../../../lib/product-events.mjs'
import { consumeRateLimit } from '../../../lib/rate-limit'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'

export const POST=createProductEventHandler({
  enabled:()=>process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED==='true',
  allowAttempt:request=>consumeRateLimit(request,{scope:'product-events',limit:30,windowSeconds:600,includeUserAgent:false}),
  write:async ({event,page,locale,flowKey})=>{
    const {error}=await getSupabaseAdmin().from('product_events').upsert({event_type:event,page,locale,flow_key:flowKey},{onConflict:'flow_key,event_type',ignoreDuplicates:true})
    if(error)throw error
  },
})
