import 'server-only'

import { getSupabaseAdmin } from './supabase-admin'

export async function trackEvent({ businessId, eventType, source = 'web', sessionKey, metadata = {} }) {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('analytics_events').insert({
      business_id: businessId,
      event_type: eventType,
      source,
      session_key: sessionKey || null,
      metadata,
    })
    if (error) throw error
  } catch (error) {
    // Analytics must never prevent a customer from viewing or booking.
    console.error('Analytics event was not recorded.', error)
  }
}

