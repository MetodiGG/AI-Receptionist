import { apiError, getSafeError } from '../../../../lib/api-response'
import { isPlatformAdmin, requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { privateJson } from '../../../../lib/platform-admin.mjs'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createPartnerLeadUpdateHandler } from '../../../../lib/partner-lead-admin.mjs'

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

export const PATCH = createPartnerLeadUpdateHandler({
  authenticate: requireUser,
  isAdmin: isPlatformAdmin,
  allowAttempt: (request, id) => consumeRateLimit(request, { scope: `platform-leads:${id}`, limit: 30, windowSeconds: 900 }),
  update: async input => {
    const changes = { status: input.status, updated_at: new Date().toISOString() }
    if (input.notes !== undefined) changes.notes = input.notes || null
    const { data, error } = await getSupabaseAdmin()
      .from('partner_leads')
      .update(changes)
      .eq('id', input.id)
      .eq('updated_at', input.expectedUpdatedAt)
      .select('id,status,notes,updated_at')
      .maybeSingle()
    if (error) throw error
    return data
  },
})
