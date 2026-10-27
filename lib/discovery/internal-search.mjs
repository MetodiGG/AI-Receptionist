import { DateTime } from 'luxon'
import { businessAddress } from '../business-location.mjs'
import { businessWeeklyHours, publicProfileDetails } from '../business-profile.mjs'
import { categoryById, hasTerm, normalizeSearchText } from './categories.mjs'

export function distanceKm(origin, destination) {
  if (!origin || !destination || !Number.isFinite(destination.latitude) || !Number.isFinite(destination.longitude)) return null
  const rad = value => value * Math.PI / 180
  const lat = rad(destination.latitude - origin.latitude), lon = rad(destination.longitude - origin.longitude)
  const a = Math.sin(lat / 2) ** 2 + Math.cos(rad(origin.latitude)) * Math.cos(rad(destination.latitude)) * Math.sin(lon / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}
export async function readInternalCandidates(db, intent) {
  const category = categoryById(intent.category)
  let query = db.from('businesses')
    .select('id,name,slug,address,city_ekatte,city,neighborhood,industry,public_profile,website_url,services(id,name,description,category,price,currency,duration_min,active),staff(id),workingHours:working_hours(staff_id,weekday,open_time,close_time,break_start,break_end)')
    .eq('active', true).eq('platform_status', 'enabled').eq('services.active', true).eq('staff.active', true)
    .order('id').limit(100).limit(30, { referencedTable: 'services' }).limit(40, { referencedTable: 'staff' }).limit(280, { referencedTable: 'workingHours' })
  if (intent.cityCode) query = query.eq('city_ekatte', intent.cityCode)
  if (category && category.id !== 'other') query = query.eq('industry', category.industry)
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
  { terms: ['гуми', 'tyre', 'tire'], match: ['гуми', 'tyre', 'tire'] },
  { terms: ['водопроводчик', 'plumber'], match: ['водопровод', 'вик', 'plumb'] },
  { terms: ['електротехник', 'electrician'], match: ['електр', 'electric'] },
  { terms: ['почистване', 'cleaning'], match: ['почист', 'clean'] },
  { terms: ['ключар', 'locksmith'], match: ['ключ', 'lock'] },
  { terms: ['математика', 'mathematics'], match: ['математ', 'math'] },
  { terms: ['счетовод', 'accountant'], match: ['счетовод', 'account'] },
]
export function matchingServices(business, intent) {
  const category = categoryById(intent.category), specific = specificServices.find(row => row.terms.some(term => hasTerm(intent.service, term)))
  const nameMatch = category?.terms.some(term => hasTerm(business.name, term))
  return (business.services || []).filter(service => {
    if (service.active === false) return false
    const text = `${service.name} ${service.category || ''} ${service.description || ''}`
    if (specific && !specific.match.some(term => hasTerm(text, term))) return false
    if (!specific && category?.id !== 'other' && !nameMatch && !category?.serviceTerms.some(term => hasTerm(text, term)) && !(intent.service && hasTerm(text, intent.service))) return false
    if (category?.id === 'other' && intent.service && !hasTerm(text, intent.service)) return false
    if (intent.budget) {
      // Unknown prices/currencies are not advertised as within the budget.
      if (service.price == null || (service.currency || 'EUR') !== intent.budget.currency || Number(service.price) > intent.budget.max) return false
    }
    return true
  }).map(({ id, name, price, currency, duration_min }) => ({ id, name, price: price == null ? null : Number(price), currency: currency || 'EUR', durationMin: duration_min }))
}
export function normalizeInternalBusinesses(rows, intent) {
  const category = categoryById(intent.category)
  return rows.filter(row => row.active !== false && (!row.platform_status || row.platform_status === 'enabled'))
    .filter(row => !intent.cityCode || row.city_ekatte === intent.cityCode)
    .filter(row => !category || category.id === 'other' || row.industry === category.industry)
    .filter(row => !intent.neighborhood || normalizeSearchText(row.neighborhood) === normalizeSearchText(intent.neighborhood) || normalizeSearchText(row.neighborhood).startsWith(`${normalizeSearchText(intent.neighborhood)} `))
    .map(row => {
      const profile = publicProfileDetails(row), coordinates = profile.latitude == null ? null : { latitude: profile.latitude, longitude: profile.longitude }
      return { id: row.id, source: 'gorez', slug: row.slug, name: row.name, address: businessAddress(row), city: row.city, neighborhood: row.neighborhood,
        category: intent.category, coordinates, distanceKm: distanceKm(intent.coordinates, coordinates), services: matchingServices(row, intent),
        hours: businessWeeklyHours(row), payments: profile.payments, availability: { status: 'unknown', slots: [] },
      }
    })
    .filter(row => row.services.length && (row.distanceKm === null || row.distanceKm <= intent.radiusKm))
    .filter(row => !intent.requirements.includes('card') || row.payments.includes('card'))
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
    if (index >= maxBusinesses) return row
    try {
      const business = await getBusiness(row.slug)
      if (!business) return null // Publication was revoked after catalogue read.
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
