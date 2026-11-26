import { safeBookingUrl } from '../booking-mode.mjs'
import { categoryById } from './categories.mjs'
import { servicePriceForDisplay } from '../currency-display.mjs'
import { specificServicePhotoKey } from '../specific-service-photo-ids.mjs'
import { serviceDisplayUnit } from '../locale/public-content.mjs'

const REVIEW_MS = 90 * 86400000
const immutableDetails = new WeakMap()
const publicServiceId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function catalogueReviewDay(now = Date.now()) {
  const date = new Date(now)
  return Number.isFinite(date.valueOf()) ? date.toISOString().slice(0, 10) : null
}

function exactReviewDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const time = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(time) && catalogueReviewDay(time) === value
}

function currentFactOnDay(fact, day, today) {
  if (!fact || !day || !safeBookingUrl(fact.sourceUrl) || !exactReviewDay(fact.checkedOn)) return false
  const checked = Date.parse(fact.checkedOn)
  return checked <= today && today - checked <= REVIEW_MS
    && (fact.validUntil === undefined || (exactReviewDay(fact.validUntil) && fact.validUntil >= day))
}

export function currentPublishedFact(fact, now = Date.now()) {
  const day = catalogueReviewDay(now)
  return currentFactOnDay(fact, day, Date.parse(day))
}

export function currentCatalogueOfferServices(row, day) {
  const review = row?.verification
  if (!day || !review || review.status !== 'approved' || !exactReviewDay(review.checkedOn) || !exactReviewDay(review.validUntil)
    || review.checkedOn > day || review.validUntil < day) return []
  const today = Date.parse(day)
  // A previously priced offer cannot silently become an unpriced service.
  // Its title/description may still promise the expired promotion or cohort.
  // An independently reviewed service without a published tariff is distinct.
  return row.services.filter(service => service.price === undefined || currentFactOnDay(service.price, day, today))
}

// Only reviewed first-party facts. Hide the complete stale tariff-backed
// offer here as well, even if called with the unprojected source inventory.
export function catalogueBusinessDetails(row, now = Date.now()) {
  const day = catalogueReviewDay(now), cached = immutableDetails.get(row)
  if (Object.isFrozen(row) && cached?.day === day) return cached.value
  const services = currentCatalogueOfferServices(row, day), today = Date.parse(day)
  const hoursCurrent = currentFactOnDay(row.openingHours, day, today)
  const value = {
    services: services.map(service => ({ name: service.name, category: service.category, description: service.description || '',
      price: service.price?.amount ?? null,
      priceKind: service.price?.kind || 'fixed', currency: service.price?.currency || 'EUR',
      priceMaximum: service.price?.maximum ?? null,
      priceUnit: service.price?.unit || '',
      durationMin: service.durationMin && currentFactOnDay({ sourceUrl: service.durationSourceUrl, checkedOn: service.durationCheckedOn }, day, today) ? service.durationMin : null,
      priceSourceUrl: service.price?.sourceUrl || null,
      priceCheckedOn: service.price?.checkedOn || null,
    })),
    hours: hoursCurrent ? [...row.openingHours.days].sort((a, b) => a.weekday - b.weekday)
      .map(day => ({ weekday: day.weekday, periods: day.periods.map(period => `${period.open}–${period.close}`), ...(day.byAppointment ? { byAppointment: true } : {}) })) : [],
    hoursSourceUrl: hoursCurrent ? row.openingHours.sourceUrl : null,
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
      ...(service.presentationEn ? { presentationEn: service.presentationEn } : {}),
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

// Present the real general/unpriced menu before the published tariff. Use the
// same authoritative display validation as the visible price, so zero remains
// a price while an incomplete range never moves into a misleading tariff.
export function splitDetailServiceMenu(services, locale = 'bg') {
  const unpriced = [], priced = []
  for (const service of services) (detailPriceLabel(service, locale) === null ? unpriced : priced).push(service)
  return { unpriced, priced }
}

export function detailPriceLabel(service, locale = 'bg', { compact = false } = {}) {
  if (service.price == null || !Number.isFinite(service.price) || service.price < 0) return null
  const converted = service.currency === 'BGN' || service.displayConvertedFrom === 'BGN', display = servicePriceForDisplay(service)
  if (display.price == null || !Number.isFinite(display.price)) return null
  const formatter = new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'bg-BG', { style: 'currency', currency: display.currency || 'EUR', ...(converted ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : compact ? { minimumFractionDigits: 0, maximumFractionDigits: 2 } : {}) })
  const range = service.priceKind === 'range' && Number.isFinite(service.priceMaximum) && service.priceMaximum >= service.price && Number.isFinite(display.priceMaximum)
  if (service.priceKind === 'range' && !range) return null
  const price = range ? (typeof formatter.formatRange === 'function' && !(converted && display.price === display.priceMaximum && service.price !== service.priceMaximum) ? formatter.formatRange(display.price, display.priceMaximum) : `${formatter.format(display.price)}–${formatter.format(display.priceMaximum)}`) : formatter.format(display.price)
  const unit = serviceDisplayUnit(service, locale)
  return `${service.priceKind === 'from' ? (locale === 'en' ? 'from ' : 'от ') : ''}${price}${unit ? ` / ${unit}` : ''}`
}
