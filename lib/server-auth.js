import 'server-only'

import { getSupabaseAdmin } from './supabase-admin'
import { platformAdminIdentity } from './business-application.mjs'

export async function requireUser(request) {
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) return null
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export function isPlatformAdmin(user) {
  return platformAdminIdentity(user,process.env.PLATFORM_ADMIN_EMAILS)
}

