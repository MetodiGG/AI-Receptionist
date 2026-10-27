import { categoryById } from './categories.mjs'
import { findCity } from '../business-location.mjs'

export function fictionalDiscoveryBusinesses(intent) {
  const category = categoryById(intent.category), city = findCity(intent.cityCode || '68134')
  return [{ id: '00000000-0000-4000-8000-000000000001', slug: 'qa-fictional-discovery', name: `QA GoRez · ${category.bg}`, industry: category.industry,
    city_ekatte: city.code, city: city.name, neighborhood: intent.neighborhood || 'Център', address: 'Измислен QA адрес · не е истински бизнес',
    services: [{ id: '00000000-0000-4000-8000-000000000002', name: intent.service || category.bg, price: 25, currency: 'EUR', duration_min: 60, active: true }],
    public_profile: { payments: ['card'], latitude: 42.6977, longitude: 23.3219 }, staff: [], workingHours: [],
  }]
}
export function fictionalGoogleResponse() {
  return { places: [{ id: 'QA_FICTIONAL_PLACE_1', displayName: { text: 'QA Външно място · измислен пример' }, formattedAddress: 'Измислен адрес · София', googleMapsUri: 'https://www.google.com/maps/', primaryType: 'beauty_salon', businessStatus: 'OPERATIONAL' }] }
}
