import { safeBookingUrl } from '../booking-mode.mjs'

const REVIEW_MS = 90 * 86400000
export function currentPublishedFact(fact, now = Date.now()) {
  if (!fact || !safeBookingUrl(fact.sourceUrl) || !/^\d{4}-\d{2}-\d{2}$/.test(fact.checkedOn || '')) return false
  const checked = Date.parse(`${fact.checkedOn}T00:00:00Z`), today = Date.parse(new Date(now).toISOString().slice(0, 10))
  return Number.isFinite(checked) && checked <= today && today - checked <= REVIEW_MS
}

// Only reviewed first-party facts. A minimum price never establishes that a
// service fits a maximum budget, and old prices/hours disappear independently.
export function catalogueBusinessDetails(row, now = Date.now()) {
  return {
    services: row.services.map(service => ({ name: service.name, description: service.description || '',
      price: currentPublishedFact(service.price, now) ? service.price.amount : null,
      priceKind: service.price?.kind || 'fixed', currency: service.price?.currency || 'EUR',
      priceSourceUrl: currentPublishedFact(service.price, now) ? service.price.sourceUrl : null,
      priceCheckedOn: currentPublishedFact(service.price, now) ? service.price.checkedOn : null,
    })),
    hours: currentPublishedFact(row.openingHours, now) ? [...row.openingHours.days].sort((a, b) => a.weekday - b.weekday)
      .map(day => ({ weekday: day.weekday, periods: day.periods.map(period => `${period.open}–${period.close}`), ...(day.byAppointment ? { byAppointment: true } : {}) })) : [],
    hoursSourceUrl: currentPublishedFact(row.openingHours, now) ? row.openingHours.sourceUrl : null,
    checkedOn: row.verification.checkedOn, sourceUrl: row.website,
  }
}

export function businessDetailServices(row) {
  const services = row.details?.services || row.services || []
  return services.filter(service => service && service.active !== false && typeof service.name === 'string' && service.name.trim()).slice(0, 30)
    .map(service => ({ name: service.name.trim(), description: typeof service.description === 'string' ? service.description.slice(0, 2000) : '',
      price: service.price != null && Number.isFinite(Number(service.price)) && Number(service.price) >= 0 ? Number(service.price) : null,
      currency: /^[A-Z]{3}$/.test(service.currency || '') ? service.currency : 'EUR', priceKind: service.priceKind === 'from' ? 'from' : 'fixed',
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

export function detailPriceLabel(service, locale = 'bg') {
  if (service.price == null || !Number.isFinite(service.price)) return null
  const price = new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'bg-BG', { style: 'currency', currency: service.currency || 'EUR' }).format(service.price)
  return `${service.priceKind === 'from' ? (locale === 'en' ? 'from ' : 'от ') : ''}${price}`
}
