import { DateTime } from 'luxon'
import { businessAddress, transliterate } from '../business-location.mjs'
import { businessWeeklyHours, publicProfileDetails } from '../business-profile.mjs'
import { getBusinessPhotos } from '../business-photos.mjs'
import { categoryById, hasTerm, normalizeSearchText } from './categories.mjs'
import { isGenericSearchService, createServiceEvidenceMatcher } from './service-lexicon.mjs'
import { isOffsiteBooking, safeBookingPhone } from '../booking-mode.mjs'
import { businessArtCategory } from '../category-art.mjs'
import { distanceKm, displayDistanceKm } from './distance.mjs'
export { distanceKm, displayDistanceKm } from './distance.mjs'
import { laboratoryServiceEvidence } from './laboratories.mjs'
import { businessNameMatches } from './business-name.mjs'
import { withServicePricing } from '../service-pricing.mjs'
import { servicePriceForDisplay } from '../currency-display.mjs'
import { visiblePublicServices } from '../public-service-eligibility.mjs'

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
    .select('id,name,slug,booking_mode,opening_hours,address,phone,city_ekatte,city,neighborhood,industry,public_profile,website_url,media_gallery_managed,media:business_media(id,staff_id,width,height,alt_text,sort_order,active,curated_src),services(id,name,description,category,price,currency,price_details,duration_min,active),staff(id),workingHours:working_hours(staff_id,weekday,open_time,close_time,break_start,break_end)')
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

// A starting price, unit rate, conditional discount or net estimate is not a
// guarantee that the complete requested visit fits the client's budget.
const singleVisitUnit = /^(?:(?:за|на|една?|1)\s+)?(?:процедура|посещение|сесия|сеанс|procedure|visit|session|appointment)$/iu
const conditionalTotal = /(?:^|[^\p{L}])(?:ориентировъч\p{L}*|indicative|estimate\p{L}*|без\s+ддс|не\s+включва\s+ддс|excl\.?\s*(?:vat|tax)|само\s+при|only\s+(?:when|with|if)|депозит\p{L}*|deposit\p{L}*|аванс\p{L}*|отстъп\p{L}*|discount\p{L}*|промоци\p{L}*|promotion\p{L}*|минимал\p{L}*|minimum|доплащ\p{L}*|surcharge\p{L}*|пакет\p{L}*|package\p{L}*|абонамент\p{L}*|subscription\p{L}*|месеч\p{L}*|monthly)(?:$|[^\p{L}])/iu
export function serviceFitsBudget(service, budget) {
  const source = withServicePricing(service), priced = budget?.currency === 'EUR' ? servicePriceForDisplay(source) : source
  if (!budget || !Number.isFinite(budget.max) || budget.max < 0 || !Number.isFinite(priced.price) || priced.price < 0 || priced.currency !== budget.currency) return false
  if (priced.priceKind === 'from') return false
  if (priced.priceUnit && !singleVisitUnit.test(priced.priceUnit.trim())) return false
  if (conditionalTotal.test(`${priced.name || ''} ${priced.description || ''}`)) return false
  const total = priced.priceKind === 'range' ? priced.priceMaximum : priced.price
  return Number.isFinite(total) && total >= priced.price && total <= budget.max
}

function publicService(service) {
  const priced = withServicePricing(service)
  return { id: priced.id, name: priced.name, description: priced.description, category: priced.category,
    price: priced.price == null ? null : Number(priced.price), currency: priced.currency || 'EUR', durationMin: priced.duration_min,
    ...(priced.priceKind ? { priceKind: priced.priceKind } : {}),
    ...(Number.isFinite(priced.priceMaximum) ? { priceMaximum: priced.priceMaximum } : {}),
    ...(priced.priceUnit ? { priceUnit: priced.priceUnit } : {}),
  }
}
export function matchingServices(business, intent, { reviewedCategoryEvidence = false, serviceEvidence } = {}) {
  const nameMatch = Boolean(intent.businessNameQuery && businessNameMatches(business.name, intent.businessNameQuery))
  if (intent.businessNameQuery && !nameMatch) return []
  const category = categoryById(intent.category), specific = specificServices.find(row => row.terms.some(term => hasTerm(intent.service, term)))
  const matchesEvidence = serviceEvidence || createServiceEvidenceMatcher(intent.service)
  // An ancillary eyebrow/face service must not list a barbershop in a general
  // beauty-studio browse. A specific request (e.g. eyebrow shaping) may still
  // match its real published service, shown with the actual barbershop type.
  if (category?.id === 'beauty' && (intent.browse === true || isGenericSearchService(intent.service, 'beauty')) && (business.businessCategory || businessArtCategory(business)) === 'barber') return []
  return visiblePublicServices(business).filter(service => {
    if (service.active === false) return false
    const allServiceBrowse = intent.browse === true && !intent.category
    const text = `${service.name} ${service.category || ''} ${service.description || ''}`
    const laboratory = intent.category === 'other' ? laboratoryServiceEvidence(service, business.name, intent.service) : null
    if (nameMatch || allServiceBrowse) { /* A real name/browse selects its public services; price/duration checks still apply below. */ }
    else if (laboratory !== null) { if (!laboratory) return false }
    else if (intent.searchV2) {
      const categoryBrowse = intent.browse === true && Boolean(category)
      const generic = categoryBrowse || isGenericSearchService(intent.service, intent.category)
      const reviewedCategory = reviewedCategoryEvidence && generic && service.category === intent.category
      const otherCategory = categoryBrowse && category.id === 'other' && (business.businessCategory === 'other' || business.industry === 'other' || service.category === 'other')
      if ((!intent.service && !categoryBrowse) || (!reviewedCategory && !otherCategory && (generic ? ![...(category?.serviceTerms || []), ...(category?.terms || [])].some(term => hasTerm(text, term)) : !matchesEvidence(text)))) return false
    } else {
    if (specific && !specific.match.some(term => hasTerm(text, term))) return false
    // A business name alone is not evidence that it offers the requested service.
    if (!specific && category?.id !== 'other' && ![...(category?.serviceTerms || []), ...(category?.terms || [])].some(term => hasTerm(text, term)) && !(intent.service && hasTerm(text, intent.service))) return false
    if (category?.id === 'other' && intent.service && !hasTerm(text, intent.service)) return false
    }
    if (intent.durationMin && Number(service.duration_min) !== intent.durationMin) return false
    if (intent.budget) {
      if (!serviceFitsBudget(service, intent.budget)) return false
    }
    return true
  }).map(publicService)
}
export function normalizeInternalBusinesses(rows, intent, { diagnostic, detailLimit = 30 } = {}) {
  const category = categoryById(intent.category)
  const serviceEvidence = createServiceEvidenceMatcher(intent.service)
  const removed = {}, filter = (name, predicate) => row => { const keep = predicate(row); if (!keep) removed[name] = (removed[name] || 0) + 1; return keep }
  const result = rows.filter(filter('not_public', row => row.active !== false && (!row.platform_status || row.platform_status === 'enabled')))
    .filter(filter('city', row => !intent.cityCode || row.city_ekatte === intent.cityCode))
    .filter(filter('industry', row => intent.searchV2 || !category || category.id === 'other' || row.industry === category.industry))
    .filter(filter('neighborhood', row => matchesNeighborhood(row.neighborhood, intent.neighborhood)))
    .map(row => {
      const visibleServices = visiblePublicServices(row)
      const profile = publicProfileDetails(row), coordinates = profile.latitude == null ? null : { latitude: profile.latitude, longitude: profile.longitude }
      return { id: row.id, source: 'gorez', slug: row.slug, name: row.name, address: businessAddress(row), cityCode: row.city_ekatte, city: row.city, neighborhood: row.neighborhood,
        booking_mode:row.booking_mode||'gorez',
        ...(row.booking_mode==='phone'?{phone:safeBookingPhone(row.phone)?row.phone:null}:{}),
        category: intent.category || businessArtCategory(row), businessCategory: businessArtCategory(row), industry: row.industry,
        publicServiceNames: visibleServices.filter(service => service.active !== false && typeof service.name === 'string').slice(0, 30).map(service => service.name),
        coordinates, distanceKm: displayDistanceKm(distanceKm(intent.coordinates, coordinates)), services: matchingServices(row, intent, { serviceEvidence }),
        photos: getBusinessPhotos(row), hours: businessWeeklyHours(row), payments: profile.payments, availability: { status: 'unknown', slots: [] },
        details: { description: profile.description, services: visibleServices.filter(service => service.active !== false).slice(0, Math.min(500, detailLimit)).map(publicService) },
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
    if(isOffsiteBooking(row))return {...row,availability:{status:row.booking_mode==='phone'?'phone':'external',slots:[]}}
    if (index >= maxBusinesses) return row
    try {
      const business = await getBusiness(row.slug)
      if (!business) return null // Publication was revoked after catalogue read.
      if(isOffsiteBooking(business))return {...row,booking_mode:business.booking_mode,...(business.booking_mode==='phone'?{phone:safeBookingPhone(business.phone)?business.phone:null}:{}),availability:{status:business.booking_mode==='phone'?'phone':'external',slots:[]}}
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
