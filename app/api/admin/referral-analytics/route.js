import { requireUser, isPlatformAdmin } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createPlatformReferralHandler } from '../../../../lib/platform-referral-analytics.mjs'

export const GET = createPlatformReferralHandler({
  authenticate: requireUser,
  isAdmin: isPlatformAdmin,
  allowAttempt: (request, id) => consumeRateLimit(request, { scope: `platform-referrals:${id}`, limit: 30, windowSeconds: 60 }),
  load: async days => {
    const db = getSupabaseAdmin(), since = new Date(Date.now() - days * 86400000).toISOString()
    const counts = await Promise.all([
      db.from('booking_referral_events').select('id', { count: 'exact', head: true }).eq('event_type', 'profile_view').gte('created_at', since),
      db.from('booking_referral_events').select('id', { count: 'exact', head: true }).eq('event_type', 'outbound_click').not('business_id', 'is', null).gte('created_at', since),
      db.from('booking_referral_events').select('id', { count: 'exact', head: true }).eq('event_type', 'outbound_click').not('external_link_id', 'is', null).gte('created_at', since),
      db.from('appointments').select('id', { count: 'exact', head: true }).in('source', ['web', 'bot']).in('status', ['booked', 'confirmed', 'done']).gte('created_at', since),
      db.from('businesses').select('id', { count: 'exact', head: true }).eq('active', true).eq('platform_status', 'enabled'),
    ])
    for (const result of counts) if (result.error) throw result.error
    return Object.fromEntries(['profileViews', 'partnerOutboundClicks', 'nonpartnerOutboundClicks', 'gorezBookings', 'publishedBusinesses'].map((key, i) => [key, counts[i].count || 0]))
  },
})
