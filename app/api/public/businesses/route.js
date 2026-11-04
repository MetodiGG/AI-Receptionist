import { apiError, getSafeError } from '../../../../lib/api-response'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { resolvePublicIndustry } from '../../../../lib/public-locale.mjs'
import { businessAddress } from '../../../../lib/business-location.mjs'
import { createServerTiming } from '../../../../lib/server-timing.mjs'
import { getBusinessPhotos } from '../../../../lib/business-photos.mjs'
import { readDirectoryRows, directoryCoordinates } from '../../../../lib/public-directory.mjs'

export async function GET(request) {
  const timing = createServerTiming()
  try {
    if (!await timing.measure('rate_limit', () => consumeRateLimit(request, { scope: 'business-directory', limit: 120, windowSeconds: 60 }))) {
      return apiError('Твърде много заявки. Опитай отново след малко.', 429, 'RATE_LIMITED')
    }

    const supabase = getSupabaseAdmin()
    const data = await timing.measure('directory', () => readDirectoryRows(supabase))

    const businesses = (data || []).map((business) => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      booking_mode:business.booking_mode||'gorez',
      address: businessAddress(business),
      city_ekatte: business.city_ekatte, city: business.city, neighborhood: business.neighborhood,
      coordinates: directoryCoordinates(business),
      phone: business.phone,
      industry: resolvePublicIndustry(business),
      theme_color: business.theme_color,
      photos: getBusinessPhotos(business),
      services: (business.services || [])
        .filter((service) => service.active)
        .sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0) || left.name.localeCompare(right.name))
        .map(({ active: _active, sort_order: _sortOrder, ...service }) => service),
    }))

    return Response.json({ businesses }, { headers: { ...timing.headers(), 'Cache-Control': 'no-store' } })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
