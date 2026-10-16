import { z } from 'zod'
import { apiError, getSafeError } from '../../../../lib/api-response'
import { PARTNER_STATUS_KEYS } from '../../../../lib/partner-leads.mjs'
import { isPlatformAdmin, requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { privateJson } from '../../../../lib/platform-admin.mjs'

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(PARTNER_STATUS_KEYS),
  notes: z.string().trim().max(3000).optional().default(''),
})

async function hasAdminAccess(request) {
  const user = await requireUser(request)
  return isPlatformAdmin(user)
}

export async function GET(request) {
  try {
    if (!await hasAdminAccess(request)) return apiError('Достъпът е отказан.', 403, 'FORBIDDEN')
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('partner_leads')
      .select('id,business_name,contact_name,phone,email,category,city,website_url,status,notes,locale,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(250)
    if (error) throw error
    return privateJson({ leads: data || [] })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}

export async function PATCH(request) {
  try {
    const origin=request.headers.get('origin')
    if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return apiError('Достъпът е отказан.',403,'FORBIDDEN')
    if (!await hasAdminAccess(request)) return apiError('Достъпът е отказан.', 403, 'FORBIDDEN')
    const input = updateSchema.parse(await request.json())
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('partner_leads')
      .update({ status: input.status, notes: input.notes || null, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .select('id,status,notes,updated_at')
      .single()
    if (error) throw error
    return privateJson({ lead: data })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
