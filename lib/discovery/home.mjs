import { categoryById } from './categories.mjs'
import { DEFAULT_DISCOVERY_CITY, discoveryCategorySelection, discoveryCitySelection } from './search-ui.mjs'
import { DEFAULT_DISCOVERY_RADIUS_KM, DISCOVERY_RADIUS_CHOICES } from './defaults.mjs'
import { distanceKm, displayDistanceKm, matchesNeighborhood, matchingServices } from './internal-search.mjs'
import { findCity } from '../business-location.mjs'

// Display choices map one-to-one to the existing search taxonomy. These are
// generic category photographs, never claimed to be pictures of a business.
export const HOME_CATEGORY_IDS = Object.freeze(['hair', 'nails', 'beauty', 'barber', 'auto_repair', 'car_wash', 'fitness', 'education', 'pets', 'home_services', 'health', 'consulting', 'detailing', 'other'])
export function homeCategories(locale = 'bg') {
  return HOME_CATEGORY_IDS.map(id => {
    const version = id === 'other' ? 4 : 2
    return { ...categoryById(id), label: id === 'barber' && locale !== 'en' ? 'Бръснар' : categoryById(id)[locale === 'en' ? 'en' : 'bg'], photo: `/category-photos/${id}-v${version}.webp`, photo2x: `/category-photos/${id}-2x-v${version}.webp` }
  })
}
export const HOME_DISCOVERY_COPY = {
  bg: { title: 'Намери услуга. Запази час.', categories: 'Категории', explore: 'Разгледай бизнеси', reserve: 'Резервирай час', all: 'Виж всички', filters: 'Филтри', close: 'Затвори', apply: 'Приложи', reset: 'Изчисти', location: 'Около мен', locationOn: 'Включи „Около мен“', locationOff: 'Изключи „Около мен“', locationEnabled: 'Местоположението е включено.', locationDisabled: 'Местоположението е изключено. Търсенето е по град.', previous: 'Предишни', next: 'Следващи', noPhoto: 'Без снимка', profile: 'Виж профила', noBusinesses: 'Още няма подходящи бизнеси тук. Опитай друга услуга или район.', unavailable: 'Бизнесите временно не се зареждат. Търсенето остава достъпно.', retry: 'Опитай отново', partners: 'GoRez партньори', partnersHint: 'Разгледай бизнесите в GoRez', business: 'За бизнеса', register: 'Регистрирай бизнеса си безплатно', registerAction: 'Регистрирай бизнеса си', free: 'Безплатно' },
  en: { title: 'Find a service. Book a time.', categories: 'Categories', explore: 'Explore Businesses', reserve: 'Reserve now', all: 'View all', filters: 'Filters', close: 'Close', apply: 'Apply', reset: 'Reset', location: 'Around me', locationOn: 'Turn on nearby search', locationOff: 'Turn off nearby search', locationEnabled: 'Location is on.', locationDisabled: 'Location is off. Searching by city.', previous: 'Previous', next: 'Next', noPhoto: 'No photo', profile: 'View profile', noBusinesses: 'No matching businesses here yet. Try another service or area.', unavailable: 'Businesses could not be loaded. Search is still available.', retry: 'Try again', partners: 'GoRez Partners', partnersHint: 'Explore businesses on GoRez', business: 'For Businesses', register: 'Register your business for free', registerAction: 'Register your business', free: 'Free' },
}
export const defaultHomeFilters = () => ({ cityCode: DEFAULT_DISCOVERY_CITY, neighborhood: '', category: '', radiusKm: DEFAULT_DISCOVERY_RADIUS_KM })
export function homeFilterCount({ cityCode, neighborhood, category, radiusKm }) {
  return Number(Boolean(cityCode && cityCode !== DEFAULT_DISCOVERY_CITY)) + Number(Boolean(neighborhood)) + Number(Boolean(category)) + Number(radiusKm !== DEFAULT_DISCOVERY_RADIUS_KM)
}
export function applyHomeFilters(current, draft, locale = 'bg') {
  const city = findCity(draft.cityCode) ? draft.cityCode : ''
  const coordinates = !draft.reset && !city ? current.coordinates : null
  const category = categoryById(draft.category)?.id || ''
  const selected = discoveryCitySelection(current.query || '', current.cityCode || DEFAULT_DISCOVERY_CITY, current.cityWasChosen)
  // An ambiguous typed place is not nearby mode, and opening/applying the
  // panel must not silently turn it into an explicit choice of Sofia.
  const unresolvedCity = draft.cityCode === '' && !draft.reset && selected === ''
  const cityCode = city || (coordinates || unresolvedCity ? '' : DEFAULT_DISCOVERY_CITY)
  return { query: category && category !== current.category ? discoveryCategorySelection(current.query, category, locale).query : current.query,
    category, cityCode, coordinates, neighborhood: cityCode ? draft.neighborhood || '' : '',
    radiusKm: DISCOVERY_RADIUS_CHOICES.includes(Number(draft.radiusKm)) ? Number(draft.radiusKm) : DEFAULT_DISCOVERY_RADIUS_KM,
    cityWasChosen: draft.reset ? false : current.cityWasChosen || cityCode !== (current.coordinates ? '' : selected) || Boolean(draft.neighborhood),
  }
}

// Coordinates are public business map points, not a city/neighbourhood centre.
// A badge is grounded only in an explicitly consented browser search origin.
export function homeBusinessDistance(row, origin) {
  return origin?.consent === true ? distanceKm(origin, row.coordinates) : null
}
export function homeBusinessPhoto(row) {
  return row.photos?.find(photo => typeof photo?.src === 'string' && (/^\/api\/business-media\/[0-9a-f-]{36}$/i.test(photo.src) || /^\/businesses\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(photo.src))) || null
}
export function homeBusinesses(rows, { cityCode = DEFAULT_DISCOVERY_CITY, coordinates = null, radiusKm = DEFAULT_DISCOVERY_RADIUS_KM, neighborhood = '', category = '', limit = 12 } = {}) {
  const origin = coordinates?.consent === true ? coordinates : null
  return rows.filter(row => row && row.active !== false && (!row.platform_status || row.platform_status === 'enabled') && /^[a-z0-9-]{1,64}$/.test(row.slug || ''))
    .filter(row => origin ? homeBusinessDistance(row, origin) !== null && homeBusinessDistance(row, origin) <= radiusKm : !cityCode || row.city_ekatte === cityCode)
    .filter(row => origin || matchesNeighborhood(row.neighborhood, neighborhood))
    .filter(row => !category || matchingServices(row, { category, service: categoryById(category)?.bg || '', searchV2: true }).length)
    .map(row => ({ ...row, distanceKm: displayDistanceKm(homeBusinessDistance(row, origin)) }))
    // This is browsing, not a popularity/quality score. Never use private
    // customer activity, promotional weights or fabricated ratings here.
    .sort((a, b) => (origin ? homeBusinessDistance(a, origin) - homeBusinessDistance(b, origin) : 0) || a.name.localeCompare(b.name, 'bg') || a.id.localeCompare(b.id))
    .slice(0, Math.min(12, Math.max(0, limit)))
}
