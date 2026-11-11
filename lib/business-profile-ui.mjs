import { detailPriceLabel } from './discovery/business-details.mjs'
import { SITE_ORIGIN } from './seo.mjs'
import { withServicePricing } from './service-pricing.mjs'

export function profileShareUrl(slug, locale = 'bg') {
  return new URL(`/book/${encodeURIComponent(slug)}?lang=${locale === 'en' ? 'en' : 'bg'}`, SITE_ORIGIN).href
}

export async function shareProfileLink({ title, url }, browserNavigator) {
  if (browserNavigator?.share) {
    try { await browserNavigator.share({ title, url }); return 'shared' }
    catch (error) { if (error?.name === 'AbortError') return 'cancelled' }
  }
  try {
    if (!browserNavigator?.clipboard?.writeText) return 'manual'
    await browserNavigator.clipboard.writeText(url)
    return 'copied'
  } catch { return 'manual' }
}

export function profileServicePrice(service, locale = 'bg') {
  const priced = withServicePricing(service), raw = priced?.price
  const price = (typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '')) && Number.isFinite(Number(raw)) ? Number(raw) : null
  const unknown = locale === 'en' ? 'Ask the business' : 'Уточни с бизнеса'
  try { return detailPriceLabel({ ...priced, price }, locale) || unknown }
  catch { return unknown }
}

export function eligibleProfileStaff(business, serviceId) {
  const staff = business.staff || []
  if (!serviceId) return staff
  const mapped = (business.staffServices || []).filter(row => row.service_id === serviceId).map(row => row.staff_id)
  return mapped.length ? staff.filter(person => mapped.includes(person.id)) : staff
}

export function profileBookingContextKey(business) {
  return JSON.stringify([business.id, business.booking_mode || 'gorez', business.timezone, business.booking_window_days, business.booking_slot_minutes, business.minimum_notice_minutes,
    (business.services || []).map(service => [service.id, service.duration_min]).sort(),
    (business.staff || []).map(person => person.id).sort(),
    (business.staffServices || []).map(row => [row.service_id, row.staff_id]).sort(),
    (business.workingHours || []).map(row => [row.staff_id, row.weekday, row.open_time, row.close_time, row.break_start, row.break_end]).sort()])
}

// Called only from an explicit booking action, never on initial page load.
export function scrollToProfileBooking(section, reduceMotion = false) {
  if (!section) return false
  const header = section.closest('.public-booking-page')?.querySelector('.booking-topbar')
  section.style.scrollMarginBlockStart = `${(header?.getBoundingClientRect().height || 0) + 16}px`
  section.focus({ preventScroll: true })
  section.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start', inline: 'nearest' })
  return true
}
