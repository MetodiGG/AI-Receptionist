const BUSINESS_FIELDS = 'id,name,slug,phone,address,city_ekatte,city,neighborhood,timezone,languages,bot_instructions,welcome_message,booking_window_days,minimum_notice_minutes,cancellation_notice_hours,booking_slot_minutes,theme_color,industry,contact_email,website_url,privacy_contact_email,booking_terms,email_notifications_enabled,embed_enabled'

// One database round trip, not a profile request followed by four more.
// There is deliberately no cross-request cache: publication, services and
// working hours must be checked again before every availability/booking request.
export async function readBookableBusiness(supabase, slug) {
  const { data, error } = await supabase.from('businesses')
    .select(`${BUSINESS_FIELDS},services(id,name,description,price,currency,duration_min,color,sort_order),staff(id,name,bio,sort_order),workingHours:working_hours(staff_id,weekday,open_time,close_time,break_start,break_end),staffServices:staff_services(staff_id,service_id)`)
    .eq('slug', slug).eq('active', true).eq('platform_status', 'enabled')
    .eq('services.active', true).eq('staff.active', true)
    .order('sort_order', { referencedTable: 'services' }).order('name', { referencedTable: 'services' })
    .order('sort_order', { referencedTable: 'staff' }).order('name', { referencedTable: 'staff' })
    .order('weekday', { referencedTable: 'workingHours' })
    .maybeSingle()
  if (error) throw error
  return data
}
