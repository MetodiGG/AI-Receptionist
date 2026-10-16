import { apiError, getSafeError } from '../../../../lib/api-response'
import { isPlatformAdmin, requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { privateJson, businessState } from '../../../../lib/platform-admin.mjs'

async function allRows(query) {
  const rows=[]
  for(let offset=0;;offset+=500){
    const {data,error}=await query().range(offset,offset+499)
    if(error)throw error
    rows.push(...(data||[]))
    if(!data||data.length<500)return rows
  }
}

export async function GET(request) {
  try {
    const user = await requireUser(request)
    if (!isPlatformAdmin(user)) return apiError('Достъпът е отказан.', 403, 'FORBIDDEN')
    const supabase = getSupabaseAdmin()
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const [businessRows, appointments, notifications, auditResult] = await Promise.all([
      allRows(()=>supabase.from('businesses').select('id,name,slug,industry,active,platform_status,platform_revision,city,phone,created_at,contact_email').order('created_at', { ascending: false }).order('id')),
      allRows(()=>supabase.from('appointments').select('id,business_id').gte('created_at', since).order('id')),
      allRows(()=>supabase.from('notification_outbox').select('id,business_id,status').gte('created_at', since).order('id')),
      supabase.from('platform_admin_audit').select('id,business_name,business_slug,action,reason,previous_status,next_status,created_at,actor_id').order('created_at',{ascending:false}).order('id').limit(100),
    ])
    if(auditResult.error)throw auditResult.error
    const bookingCounts=new Map(),failedCounts=new Map()
    for(const row of appointments)bookingCounts.set(row.business_id,(bookingCounts.get(row.business_id)||0)+1)
    for(const row of notifications)if(row.status==='failed')failedCounts.set(row.business_id,(failedCounts.get(row.business_id)||0)+1)
    const businesses = businessRows.map((business) => ({
      ...business,
      bookings30d: bookingCounts.get(business.id)||0,
      failedNotifications30d: failedCounts.get(business.id)||0,
    }))
    return privateJson({ businesses, audit:auditResult.data||[], totals: { businesses: businesses.filter(item=>businessState(item)!=='archived').length, active: businesses.filter(item=>businessState(item)==='published').length, archived:businesses.filter(item=>businessState(item)==='archived').length, bookings30d: appointments.length, failedNotifications30d: notifications.filter(item=>item.status==='failed').length } })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}

