import { apiError, getSafeError } from '../../../../lib/api-response'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { resolvePublicIndustry } from '../../../../lib/public-locale.mjs'
import { businessAddress } from '../../../../lib/business-location.mjs'

export async function GET(request) {
  try {
    if (!await consumeRateLimit(request, { scope: 'business-directory', limit: 120, windowSeconds: 60 })) {
      return apiError('Твърде много заявки. Опитай отново след малко.', 429, 'RATE_LIMITED')
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('businesses')
      .select('id,name,slug,address,city_ekatte,city,neighborhood,phone,industry,theme_color,services(id,name,description,price,currency,duration_min,active,sort_order)')
      .eq('active', true)
      .eq('platform_status', 'enabled')
      .order('name')

    if (error) throw error

    const businesses = (data || []).map((business) => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      address: businessAddress(business),
      city_ekatte: business.city_ekatte, city: business.city, neighborhood: business.neighborhood,
      phone: business.phone,
      industry: resolvePublicIndustry(business),
      theme_color: business.theme_color,
      services: (business.services || [])
        .filter((service) => service.active)
        .sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0) || left.name.localeCompare(right.name))
        .map(({ active: _active, sort_order: _sortOrder, ...service }) => service),
    }))

    return Response.json({ businesses })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
