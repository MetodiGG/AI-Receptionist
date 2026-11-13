import { withServicePricing } from './service-pricing.mjs'
import { visiblePublicServices } from './public-service-eligibility.mjs'
import { validBusinessDirectionsPoint } from './business-directions.mjs'

// Only already-published GoRez businesses, never external Google listings or
// private onboarding requests. Paginate past Supabase's default row limit.
export async function readDirectoryRows(supabase) {
  const rows = [], pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('businesses')
      .select('id,name,slug,booking_mode,address,city_ekatte,city,neighborhood,phone,industry,theme_color,latitude:public_profile->latitude,longitude:public_profile->longitude,media_gallery_managed,media:business_media(id,staff_id,width,height,alt_text,sort_order,active,curated_src),services(id,name,description,price,currency,price_details,duration_min,active,sort_order)')
      .eq('active', true).eq('platform_status', 'enabled')
      .order('name').order('id').range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...(data || []).map(row => Array.isArray(row.services) ? { ...row, services: visiblePublicServices(row).map(withServicePricing) } : row))
    if (!data || data.length < pageSize) return rows
  }
}

// Select only the two already-public map-point fields, never the whole profile
// or private owner/contact/customer data. Missing/invalid points stay unknown.
export function directoryCoordinates(row) {
  return validBusinessDirectionsPoint(row)
    ? { latitude: row.latitude, longitude: row.longitude } : null
}
