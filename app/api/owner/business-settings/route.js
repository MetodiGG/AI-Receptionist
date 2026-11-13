import { requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createOwnerBusinessSettingsHandler, saveOwnerBusinessSettings } from '../../../../lib/owner-business-settings.mjs'

export const PATCH = createOwnerBusinessSettingsHandler({
  authenticate: requireUser,
  allowAttempt: (request, ownerId) => consumeRateLimit(request, { scope: `owner-business-settings:${ownerId}`, limit: 20, windowSeconds: 60 }),
  readBusiness: async (businessId, ownerId) => {
    const { data, error } = await getSupabaseAdmin().from('businesses')
      .select('id,owner_id,platform_status,city_ekatte,neighborhood,address,public_profile,timezone,content_revision')
      .eq('id', businessId).eq('owner_id', ownerId).maybeSingle()
    if (error) throw error
    return data
  },
  hasUpcomingBookings: async businessId => {
    const { count, error } = await getSupabaseAdmin().from('appointments').select('id', { count: 'exact', head: true })
      .eq('business_id', businessId).in('status', ['booked', 'confirmed']).gt('ends_at', new Date().toISOString())
    if (error) throw error
    return count > 0
  },
  save: input => saveOwnerBusinessSettings(getSupabaseAdmin(), input),
})
