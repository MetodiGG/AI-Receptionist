import { DateTime } from 'luxon'
import { businessAddress, transliterate } from '../business-location.mjs'
import { businessWeeklyHours, publicProfileDetails } from '../business-profile.mjs'
import { getBusinessPhotos } from '../business-photos.mjs'
import { categoryById, hasTerm, normalizeSearchText } from './categories.mjs'
import { isGenericSearchService, serviceHasEvidence } from './service-lexicon.mjs'
import { isExternalBooking } from '../booking-mode.mjs'
import { businessArtCategory } from '../category-art.mjs'
import { distanceKm, displayDistanceKm } from './distance.mjs'
export { distanceKm, displayDistanceKm } from './distance.mjs'
import { laboratoryServiceEvidence } from './laboratories.mjs'

const neighborhoodKey = value => normalizeSearchText(transliterate(String(value || ''))).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/^(?:zh k|zhk|kv|kvartal|zhilishten kompleks)\s+/u, '')
export function matchesNeighborhood(actual, requested) {
  const expected = neighborhoodKey(requested), value = neighborhoodKey(actual)
  return !expected || Boolean(value && (value === expected || value.startsWith(`${expected} `)))
}
export function withinDiscoveryRadius(coordinates, intent) {
  if (!intent.coordinates) return true
  const distance = distanceKm(intent.coordinates, coordinates)
  return distance !== null && distance <= intent.radiusKm
}
export function matchesPartnerLocation(row, intent) {
  return (!intent.cityCode || row.cityCode === intent.cityCode) && matchesNeighborhood(row.neighborhood, intent.neighborhood) && withinDiscoveryRadius(row.coordinates, intent)
}
export async function readInternalCandidates(db, intent) {
  const category = categoryById(intent.category)
  let query = db.from('businesses')
    .select('id,name,slug,booking_mode,opening_hours,address,phone,city_ekatte,city,neighborhood,industry,public_profile,website_url,media_gallery_managed,media:business_media(id,staff_id,width,height,alt_text,sort_order,active,curated_src),services(id,name,description,category,price,currency,duration_min,active),staff(id),workingHours:working_hours(staff_id,weekday,open_time,close_time,break_start,break_end)')
    .eq('active', true).eq('platform_status', 'enabled').eq('services.active', true).eq('staff.active', true)
    .order('id').limit(100).limit(30, { referencedTable: 'services' }).limit(40, { referencedTable: 'staff' }).limit(280, { referencedTable: 'workingHours' })
  if (intent.cityCode) query = query.eq('city_ekatte', intent.cityCode)
  if (!intent.searchV2 && category && category.id !== 'other') query = query.eq('industry', category.industry)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

const specificServices = [
  { terms: ['маникюр', 'manicure'], match: ['маникюр', 'manicure'] },
  { terms: ['педикюр', 'pedicure'], match: ['педикюр', 'pedicure'] },
  { terms: ['брада', 'beard'], match: ['брада', 'брад', 'beard'] },
  { terms: ['боядисване', 'coloring', 'colouring'], match: ['боядис', 'color', 'colour'] },
  { terms: ['подстриг', 'haircut'], match: ['подстриг', 'haircut', 'причес'] },
  { terms: ['йога', 'yoga'], match: ['йога', 'yoga'] },
  { terms: ['пилатес', 'pilates'], match: ['пилатес', 'pilates'] },
  { terms: ['тенис', 'tennis'], match: ['тенис', 'tennis'] },
  { terms: ['танци', 'dance'], match: ['танц', 'danc'] },
  { terms: ['бокс', 'boxing'], match: ['бокс', 'boxing'] },
  { terms: ['плуване', 'swimming'], match: ['плув', 'swim'] },
  { terms: ['гуми', 'tyre', 'tire'], match: ['гуми', 'tyre', 'tire'] },
  { terms: ['водопроводчик', 'plumber'], match: ['водопровод', 'вик', 'plumb'] },
  { terms: ['електротехник', 'electrician'], match: ['електр', 'electric'] },
  { terms: ['почистване', 'cleaning'], match: ['почист', 'clean'] },
  { terms: ['ключар', 'locksmith'], match: ['ключ', 'lock'] },
  { terms: ['математика', 'mathematics'], match: ['математ', 'math'] },
  { terms: ['счетовод', 'accountant'], match: ['счетовод', 'account'] },
]
export function matchingServices(business, intent, { reviewedCategoryEvidence = false } = {}) {
  const category = categoryById(intent.category), specific = specificServices.find(row => row.terms.some(term => hasTerm(intent.service, term)))
  return (business.services || []).filter(service => {
    if (service.active === false) return false
    if (intent.browse === true && !intent.category) return true
    const text = `${service.name} ${service.category || ''} ${service.description || ''}`
    const laboratory = intent.category === 'other' ? laboratoryServiceEvidence(service, business.name, intent.service) : null
    if (laboratory !== null) { if (!laboratory) return false }
    else if (intent.searchV2) {
      const generic = isGenericSearchService(intent.service, intent.category)
      const reviewedCategory = reviewedCategoryEvidence && generic && service.category === intent.category
      if (!intent.service || (!reviewedCategory && (generic ? ![...(category?.serviceTerms || []), ...(category?.terms || [])].some(term => hasTerm(text, term)) : !serviceHasEvidence(text, intent.service)))) return false
    } else {
    if (specific && !specific.match.some(term => hasTerm(text, term))) return false
    // A business name alone is not evidence that it offers the requested service.
    if (!specific && category?.id !== 'other' && ![...(category?.serviceTerms || []), ...(category?.terms || [])].some(term => hasTerm(text, term)) && !(intent.service && hasTerm(text, intent.service))) return false
    if (category?.id === 'other' && intent.service && !hasTerm(text, intent.service)) return false
    }
    if (intent.durationMin && Number(service.duration_min) !== intent.durationMin) return false
    if (intent.budget) {
      // Unknown prices/currencies are not advertised as within the budget.
      if (service.price == null || (service.currency || 'EUR') !== intent.budget.currency || Number(service.price) > intent.budget.max) return false
    }
    return true
  }).map(({ id, name, price, currency, duration_min }) => ({ id, name, price: price == null ? null : Number(price), currency: currency || 'EUR', durationMin: duration_min }))
}
export function normalizeInternalBusinesses(rows, intent, { diagnostic } = {}) {
  const category = categoryById(intent.category)
  const removed = {}, filter = (name, predicate) => row => { const keep = predicate(row); if (!keep) removed[name] = (removed[name] || 0) + 1; return keep }
  const result = rows.filter(filter('not_public', row => row.active !== false && (!row.platform_status || row.platform_status === 'enabled')))
    .filter(filter('city', row => !intent.cityCode || row.city_ekatte === intent.cityCode))
    .filter(filter('industry', row => intent.searchV2 || !category || category.id === 'other' || row.industry === category.industry))
    .filter(filter('neighborhood', row => matchesNeighborhood(row.neighborhood, intent.neighborhood)))
    .map(row => {
      const profile = publicProfileDetails(row), coordinates = profile.latitude == null ? null : { latitude: profile.latitude, longitude: profile.longitude }
      return { id: row.id, source: 'gorez', slug: row.slug, name: row.name, address: businessAddress(row), cityCode: row.city_ekatte, city: row.city, neighborhood: row.neighborhood,
        booking_mode:row.booking_mode||'gorez',
        category: intent.category || businessArtCategory(row), businessCategory: businessArtCategory(row), industry: row.industry,
        publicServiceNames: (row.services || []).filter(service => service.active !== false && typeof service.name === 'string').slice(0, 30).map(service => service.name),
        coordinates, distanceKm: displayDistanceKm(distanceKm(intent.coordinates, coordinates)), services: matchingServices(row, intent),
        photos: getBusinessPhotos(row), hours: businessWeeklyHours(row), payments: profile.payments, availability: { status: 'unknown', slots: [] },
      }
    })
    // A real-radius search cannot claim an unlocated business is nearby.
    .filter(filter('service_or_budget', row => row.services.length))
    .filter(filter('radius', row => matchesPartnerLocation(row, intent)))
    .filter(filter('payment', row => !intent.requirements.includes('card') || row.payments.includes('card')))
  diagnostic?.({ stage: 'internal_filters', candidates: rows.length, kept: result.length, removed })
  return result
}
export function matchesRequestedTime(slot, intent, zone = 'Europe/Sofia') {
  const local = DateTime.fromISO(slot.startsAt).setZone(zone)
  if (!local.isValid || (intent.date && local.toISODate() !== intent.date)) return false
  const time = local.toFormat('HH:mm')
  return (!intent.timeFrom || time >= intent.timeFrom) && (!intent.timeTo || time <= intent.timeTo)
}
export async function verifyDiscoveryAvailability(rows, intent, { getBusiness, getSlots, checkedAt = () => new Date().toISOString(), maxBusinesses = 4 }) {
  if (!intent.date) return rows
  return Promise.all(rows.map(async (row, index) => {
    if(isExternalBooking(row))return {...row,availability:{status:'external',slots:[]}}
    if (index >= maxBusinesses) return row
    try {
      const business = await getBusiness(row.slug)
      if (!business) return null // Publication was revoked after catalogue read.
      if(isExternalBooking(business))return {...row,booking_mode:'external',availability:{status:'external',slots:[]}}
      const current = row.services.filter(service => business.services.some(item => item.id === service.id))
      const checked = current.slice(0, 2), slots = []
      for (const service of checked) {
        const available = await getSlots({ business, serviceId: service.id, date: intent.date })
        for (const slot of available.filter(slot => matchesRequestedTime(slot, intent, business.timezone)).slice(0, 3)) slots.push({ startsAt: slot.startsAt, endsAt: slot.endsAt, serviceId: service.id, staffId: slot.staffId })
      }
      slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      return { ...row, services: current, availability: { status: slots.length ? 'verified' : checked.length === current.length && current.length ? 'none' : 'unknown', checkedAt: checkedAt(), date: intent.date, serviceIds: checked.map(service => service.id), slots: slots.slice(0, 3), timezone: business.timezone || 'Europe/Sofia' } }
    } catch { return { ...row, availability: { status: 'unknown', slots: [] } } }
  })).then(results => results.filter(Boolean))
}
