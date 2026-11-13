// Offline intake/review policy. Never imported by the search request path.
// A crawler finding a number is not a completed source review.
import { createHash } from 'node:crypto'
import { safeBookingUrl } from '../booking-mode.mjs'

export function pricingIdentity(row) {
  return createHash('sha256').update(JSON.stringify([row.id, row.website, row.booking, row.services])).digest('hex')
}
const canonical = value => {
  try { const url = new URL(value); url.hash = ''; return url.href.replace(/\/$/, '') } catch { return '' }
}
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function assessPricingReview(row, review, now = Date.now()) {
  const pending = reason => ({ id: row.id, state: 'pending', reason })
  if (!review) return pending('booking_price_review_required')
  if (review.pricingDecision === 'hold_conflicting_sources') return pending('conflicting_published_prices_require_owner_confirmation')
  if (review.id !== row.id || review.website !== row.website || review.bookingEntry !== (row.booking.kind === 'form' ? row.booking.url : 'phone')) return pending('business_or_booking_target_changed')
  const today = new Date(now).toISOString().slice(0, 10)
  if (!validDate(review.checkedOn) || review.checkedOn > today || Date.parse(`${today}T00:00:00Z`) - Date.parse(`${review.checkedOn}T00:00:00Z`) > 90 * 86400000) return pending('source_review_expired_or_invalid')
  const urls = review.reviewedUrls
  if (!Array.isArray(urls) || !urls.length || urls.some(url => !safeBookingUrl(url)) || !urls.some(url => canonical(url) === canonical(row.website))) return pending('official_site_review_required')
  const bookingReviewed = row.booking.kind === 'phone'
    ? review.bookingReview === 'phone_booking_reviewed'
    : ['owned_booking_reviewed', 'provider_booking_reviewed'].includes(review.bookingReview) && urls.some(url => canonical(url) === canonical(row.booking.url))
  if (!bookingReviewed) return pending('rendered_booking_flow_review_required')
  if (typeof review.notes !== 'string' || review.notes.trim().length < 20) return pending('branch_staff_and_price_conditions_review_required')
  if (review.inventoryIdentity !== pricingIdentity(row)) return pending('reviewed_service_inventory_changed')
  // Owner instruction, 2026-11-13: a public tariff is a bonus, not a condition
  // for adding a verified appointment business. This is NOT a completed price
  // review: require a separate explicit receipt for the actual booking/service
  // pages, keep prices absent, and never treat inaccessible tariffs as absent.
  if (review.pricingDecision === 'not_publicly_listed') {
    if (row.services.some(service => service.price)) return pending('unpublished_price_receipt_contains_prices')
    const search = review.priceSearch
    const bookingUrl = row.booking.kind === 'form' ? row.booking.url : row.verification?.booking?.url
    const inspected = url => safeBookingUrl(url) && urls.some(value => canonical(value) === canonical(url))
    const allowedHosts = new Set([row.website, bookingUrl].filter(Boolean).map(url => new URL(url).hostname.replace(/^www\./, '')))
    const serviceSource = url => inspected(url) && allowedHosts.has(new URL(url).hostname.replace(/^www\./, ''))
    if (search?.outcome !== 'not_published' || !inspected(search.bookingUrl) || canonical(search.bookingUrl) !== canonical(bookingUrl) ||
        !Array.isArray(search.serviceUrls) || !search.serviceUrls.length || search.serviceUrls.length > 20 || !search.serviceUrls.every(serviceSource) ||
        typeof search.notes !== 'string' || search.notes.trim().length < 20) return pending('explicit_unpublished_price_search_required')
    return { id: row.id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: review.checkedOn, reviewedPriceCount: 0 }
  }
  const fresh = row.services.filter(service => service.price && service.price.checkedOn === review.checkedOn && (!service.price.validUntil || service.price.validUntil >= today) && urls.some(url => canonical(url) === canonical(service.price.sourceUrl)))
  if (!fresh.length) return pending('published_sourced_price_required')
  return { id: row.id, state: 'reviewed', checkedOn: review.checkedOn, reviewedPriceCount: fresh.length }
}

export function auditCataloguePricing(records, baseline, reviews, now = Date.now()) {
  const ids = new Set(records.map(row => row.id)), seen = new Set()
  for (const review of reviews) {
    if (!ids.has(review.id) || seen.has(review.id)) throw Error(`Unknown or duplicate pricing review: ${review.id}`)
    seen.add(review.id)
  }
  const byId = new Map(reviews.map(row => [row.id, row])), legacy = new Map(baseline.map(row => [row.id, row.identity]))
  const rows = records.map(row => ({ ...assessPricingReview(row, byId.get(row.id), now),
    legacy: legacy.get(row.id) === pricingIdentity(row), hasPrices: row.services.some(service => service.price),
  }))
  return { records: rows, summary: { total: rows.length, sourceReviewed: rows.filter(row => row.state === 'reviewed').length,
    serviceReviewedWithoutPublicPrices: rows.filter(row => row.state === 'service_reviewed').length,
    pending: rows.filter(row => row.state === 'pending').length, withPrices: rows.filter(row => row.hasPrices).length },
    blocking: rows.filter(row => !['reviewed', 'service_reviewed'].includes(row.state) && !row.legacy).map(({ id, reason }) => ({ id, reason })),
    notice: 'Every new listing or changed service inventory, website or booking target needs a dated source review bound to that inventory. A sourced public price is preferred. Explicitly checked, unpublished tariffs can qualify for service_reviewed only, never price-reviewed; missing prices stay absent. Conflicting or inaccessible tariffs remain pending. Historical baselines are unchanged. Crawler signals are not reviews.' }
}
