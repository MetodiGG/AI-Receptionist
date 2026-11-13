import { safeBookingUrl } from '../booking-mode.mjs'
import { categoryById } from './categories.mjs'
import { servicePriceForDisplay } from '../currency-display.mjs'
import { specificServicePhotoKey } from '../specific-service-photo-ids.mjs'

const REVIEW_MS = 90 * 86400000
const immutableDetails = new WeakMap()
const publicServiceId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function currentPublishedFact(fact, now = Date.now()) {
  if (!fact || !safeBookingUrl(fact.sourceUrl) || !/^\d{4}-\d{2}-\d{2}$/.test(fact.checkedOn || '')) return false
  const checked = Date.parse(`${fact.checkedOn}T00:00:00Z`), today = Date.parse(new Date(now).toISOString().slice(0, 10))
  return Number.isFinite(checked) && checked <= today && today - checked <= REVIEW_MS && (!fact.validUntil || fact.validUntil >= new Date(now).toISOString().slice(0, 10))
}

// Only reviewed first-party facts. A minimum price never establishes that a
// service fits a maximum budget, and old prices/hours disappear independently.
export function catalogueBusinessDetails(row, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10), cached = immutableDetails.get(row)
  if (Object.isFrozen(row) && cached?.day === day) return cached.value
  const value = {
    services: row.services.map(service => { const priced = currentPublishedFact(service.price, now); return ({ name: service.name, category: service.category, description: service.description || '',
      price: priced ? service.price.amount : null,
      priceKind: service.price?.kind || 'fixed', currency: service.price?.currency || 'EUR',
      priceMaximum: priced ? service.price.maximum ?? null : null,
      priceUnit: priced ? service.price.unit || '' : '',
      durationMin: service.durationMin && currentPublishedFact({ sourceUrl: service.durationSourceUrl, checkedOn: service.durationCheckedOn }, now) ? service.durationMin : null,
      priceSourceUrl: priced ? service.price.sourceUrl : null,
      priceCheckedOn: priced ? service.price.checkedOn : null,
    }) }),
    hours: currentPublishedFact(row.openingHours, now) ? [...row.openingHours.days].sort((a, b) => a.weekday - b.weekday)
      .map(day => ({ weekday: day.weekday, periods: day.periods.map(period => `${period.open}–${period.close}`), ...(day.byAppointment ? { byAppointment: true } : {}) })) : [],
    hoursSourceUrl: currentPublishedFact(row.openingHours, now) ? row.openingHours.sourceUrl : null,
    checkedOn: row.verification.checkedOn, sourceUrl: row.website,
  }
  // Static source rows are deeply frozen by validateCatalogue. Cache only
  // those, and only for this UTC date; prices/hours can still expire tomorrow.
  if (Object.isFrozen(row) && Object.isFrozen(row.services) && row.services.every(service => Object.isFrozen(service) && (!service.price || Object.isFrozen(service.price)))) {
    for (const service of value.services) Object.freeze(service)
    Object.freeze(value.services)
    for (const day of value.hours) { Object.freeze(day.periods); Object.freeze(day) }
    Object.freeze(value.hours)
    immutableDetails.set(row, { day, value: Object.freeze(value) })
  }
  return value
}

export function businessDetailServices(row) {
  const services = row.details?.services || row.services || []
  return services.filter(service => service && service.active !== false && typeof service.name === 'string' && service.name.trim()).slice(0, 500)
    .map(service => ({ ...(typeof service.id === 'string' && publicServiceId.test(service.id) ? { id: service.id } : {}),
      name: service.name.trim(), category: service.category || null, description: typeof service.description === 'string' ? service.description.slice(0, 2000) : '',
      ...(specificServicePhotoKey(service.illustrativePhotoKey) ? { illustrativePhotoKey: service.illustrativePhotoKey } : {}),
      price: (typeof service.price === 'number' || (typeof service.price === 'string' && service.price.trim() !== '')) && Number.isFinite(Number(service.price)) && Number(service.price) >= 0 ? Number(service.price) : null,
      currency: /^[A-Z]{3}$/.test(service.currency || '') ? service.currency : 'EUR', priceKind: ['from', 'range'].includes(service.priceKind) ? service.priceKind : 'fixed',
      priceMaximum: typeof service.priceMaximum === 'number' && Number.isFinite(service.priceMaximum) && service.priceMaximum >= Number(service.price) ? service.priceMaximum : null,
      priceUnit: typeof service.priceUnit === 'string' ? service.priceUnit.slice(0, 100) : '',
      durationMin: service.durationMin || service.duration_min || null,
      priceSourceUrl: safeBookingUrl(service.priceSourceUrl), priceCheckedOn: service.priceCheckedOn || null,
    }))
}

export function businessDetailHours(row) {
  const days = row.details?.hours || row.hours || []
  // An absent staff schedule is not evidence that a business is closed all week.
  if (!row.details?.hours && !days.some(day => day.periods?.length)) return []
  return days.filter(day => Number.isInteger(day.weekday) && day.weekday >= 1 && day.weekday <= 7 && Array.isArray(day.periods))
    .map(day => ({ weekday: day.weekday, periods: day.periods.filter(period => /^(?:[01]\d|2[0-3]):[0-5]\d–(?:[01]\d|2[0-3]):[0-5]\d$/.test(period)), byAppointment: day.byAppointment === true })).sort((a, b) => a.weekday - b.weekday)
}

export function groupDetailServices(services) {
  const groups = new Map()
  for (const service of services) {
    const category = categoryById(service.category), key = category?.id || ''
    if (!groups.has(key)) groups.set(key, { key, title: category ? { bg: category.bg, en: category.en } : null, services: [] })
    groups.get(key).services.push(service)
  }
  return [...groups.values()]
}

export function detailPriceLabel(service, locale = 'bg', { compact = false } = {}) {
  if (service.price == null || !Number.isFinite(service.price) || service.price < 0) return null
  const converted = service.currency === 'BGN' || service.displayConvertedFrom === 'BGN', display = servicePriceForDisplay(service)
  if (display.price == null || !Number.isFinite(display.price)) return null
  const formatter = new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'bg-BG', { style: 'currency', currency: display.currency || 'EUR', ...(converted ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : compact ? { minimumFractionDigits: 0, maximumFractionDigits: 2 } : {}) })
  const range = service.priceKind === 'range' && Number.isFinite(service.priceMaximum) && service.priceMaximum >= service.price && Number.isFinite(display.priceMaximum)
  if (service.priceKind === 'range' && !range) return null
  const price = range ? (typeof formatter.formatRange === 'function' && !(converted && display.price === display.priceMaximum && service.price !== service.priceMaximum) ? formatter.formatRange(display.price, display.priceMaximum) : `${formatter.format(display.price)}–${formatter.format(display.priceMaximum)}`) : formatter.format(display.price)
  return `${service.priceKind === 'from' ? (locale === 'en' ? 'from ' : 'от ') : ''}${price}${service.priceUnit ? ` / ${service.priceUnit}` : ''}`
}
