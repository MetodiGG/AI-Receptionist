// Only already-published GoRez businesses, never external Google listings or
// private onboarding requests. Paginate past Supabase's default row limit.
export async function readDirectoryRows(supabase) {
  const rows = [], pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('businesses')
      .select('id,name,slug,address,city_ekatte,city,neighborhood,phone,industry,theme_color,services(id,name,description,price,currency,duration_min,active,sort_order)')
      .eq('active', true).eq('platform_status', 'enabled')
      .order('name').order('id').range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) return rows
  }
}
