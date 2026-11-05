import { categoryById } from './categories.mjs'
import { findCity } from '../business-location.mjs'

export function fictionalDiscoveryBusinesses(intent) {
  const category = categoryById(intent.category || 'beauty'), city = findCity(intent.cityCode || '68134')
  const rows = [{ id: '00000000-0000-4000-8000-000000000001', slug: 'qa-fictional-discovery', name: `QA GoRez · ${category.bg}`, industry: category.industry,
    city_ekatte: city.code, city: city.name, neighborhood: intent.neighborhood || 'Център', address: 'Измислен QA адрес · не е истински бизнес',
    services: [{ id: '00000000-0000-4000-8000-000000000002', name: intent.service || category.bg, price: 25, currency: 'EUR', duration_min: 60, active: true }],
    public_profile: { payments: ['card'], latitude: 42.6977, longitude: 23.3219 }, staff: [], workingHours: [],
  }]
  if (intent.primaryRadiusKm && intent.coordinates) {
    return [1.8, .7, 4.2].map((km, index) => ({ ...rows[0], id: `00000000-0000-4000-8000-00000000000${index + 1}`, slug: `qa-nearby-${index}`, name: `QA GoRez · ${category.bg} · ${km} km`, public_profile: { ...rows[0].public_profile, latitude: intent.coordinates.latitude + km / 6371 * 180 / Math.PI, longitude: intent.coordinates.longitude } }))
  }
  return rows
}
export function fictionalGoogleResponse(searchBody) {
  const origin = searchBody?.locationRestriction?.circle?.center || searchBody?.locationBias?.circle?.center
  if (origin) return { places: [.2, 1.2, 3.1, 5.04].map((km, index) => ({
    id: `QA_FICTIONAL_PLACE_${index}`, displayName: { text: `QA · Demo ${index + 1}` }, formattedAddress: 'Измислен адрес · София', googleMapsUri: 'https://www.google.com/maps/', businessStatus: 'OPERATIONAL', location: { latitude: origin.latitude + km / 6371 * 180 / Math.PI, longitude: origin.longitude },
    ...(index === 0 ? { websiteUri: 'https://example.com/demo-only' } : index === 1 ? { nationalPhoneNumber: '+359000000000' } : {}),
    rating: 4.6, userRatingCount: 12,
  })) }
  return { places: [{ id: 'QA_FICTIONAL_PLACE_1', displayName: { text: 'QA · Demo business' }, formattedAddress: 'Измислен адрес · София', googleMapsUri: 'https://www.google.com/maps/', primaryType: 'beauty_salon', businessStatus: 'OPERATIONAL', websiteUri: 'https://example.com/demo-only', rating: 4.6, userRatingCount: 12 }] }
}
