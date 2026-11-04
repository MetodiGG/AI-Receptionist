import 'server-only'
import { cache } from 'react'
import { getSupabaseAdmin } from './supabase-admin'
export const readSeoBusiness=cache(async slug=>{
  if(!/^[a-z0-9-]{2,64}$/.test(slug))return null
  const {data,error}=await getSupabaseAdmin().from('businesses').select('name,slug,active,platform_status,industry,address,city,phone,booking_mode').eq('slug',slug).eq('active',true).eq('platform_status','enabled').maybeSingle()
  if(error)throw error
  return data
})
