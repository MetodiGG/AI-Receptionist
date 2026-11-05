import { categoryById } from './categories.mjs'
import { businessArtCategory } from '../category-art.mjs'
import { safeBookingUrl } from '../booking-mode.mjs'
import { validPlaceId, approvedExternalLink } from '../outbound-booking.mjs'

export function railCategory(row, locale = 'bg') {
  return categoryById(row.category || businessArtCategory(row))?.[locale === 'en' ? 'en' : 'bg'] || ''
}

export function railPhone(value) {
  if (typeof value !== 'string' || !/^[+\d\s().-]{5,40}$/.test(value)) return null
  const phone = value.replace(/[\s().-]/g, '')
  return /^\+?\d{5,15}$/.test(phone) ? `tel:${phone}` : null
}

// Only real contact data supplied by an allowed provider/first-party source.
// A generic website is not promoted to a verified appointment booking page.
export function railExternalAction(row) {
  if (row.source !== 'google') return null
  if (row.booking?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.booking.id)) return { kind: 'verified', id: row.booking.id }
  const website = safeBookingUrl(row.website)
  if (website) return { kind: 'website', href: website }
  const phone = railPhone(row.phone)
  return phone ? { kind: 'phone', href: phone } : null
}

export function railDirections(row) {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  if (row.source === 'google') {
    if (!validPlaceId(row.placeId)) return null
    url.searchParams.set('destination', row.placeId)
    url.searchParams.set('destination_place_id', row.placeId)
  } else if (row.coordinates && Number.isFinite(row.coordinates.latitude) && Math.abs(row.coordinates.latitude) <= 90 && Number.isFinite(row.coordinates.longitude) && Math.abs(row.coordinates.longitude) <= 180) {
    url.searchParams.set('destination', `${row.coordinates.latitude},${row.coordinates.longitude}`)
  } else if (row.address?.trim()) url.searchParams.set('destination', [row.name, row.address].filter(Boolean).join(', '))
  else return null
  // Do not transmit the visitor's origin in an outbound link. Maps asks itself.
  return url.href
}

export function orderedRailRows(rows = []) {
  const unique = new Map()
  for (const row of rows) {
    if (!['gorez', 'google'].includes(row?.source) || !row.id) continue
    const key = `${row.source}:${row.source === 'google' ? row.placeId || row.id : row.id}`
    if (!unique.has(key)) unique.set(key, row)
  }
  return [...unique.values()].sort((a, b) =>
    Number(a.proximityBand === 'further') - Number(b.proximityBand === 'further') ||
    Number(b.source === 'gorez') - Number(a.source === 'gorez') ||
    (a.source === 'google' ? ({ verified: 3, website: 2, phone: 1 }[railExternalAction(b)?.kind] || 0) - ({ verified: 3, website: 2, phone: 1 }[railExternalAction(a)?.kind] || 0) : 0) ||
    ((Number.isFinite(a.distanceKm) && Number.isFinite(b.distanceKm)) ? a.distanceKm - b.distanceKm : 0)
  ).slice(0, 15)
}

export function googleRailWidth(count) {
  return Math.min(15, Math.max(1, Number.isSafeInteger(count) ? count : 1))
}

// First-party independently verified booking records, not Google content or a
// guess that every website accepts appointments. Keep each radius band intact.
export function prioritizeVerifiedBookingIds(ids = [], links = [], now = Date.now()) {
  const approved = new Set(links.filter(row => approvedExternalLink(row, now)).map(row => row.place_id))
  return [...ids].sort((a, b) => Number(approved.has(b)) - Number(approved.has(a)))
}
