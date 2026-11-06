import { categoryById, normalizeSearchText } from './categories.mjs'
import { businessArtCategory } from '../category-art.mjs'
import { safeBookingUrl } from '../booking-mode.mjs'
import { validPlaceId, approvedExternalLink } from '../outbound-booking.mjs'
import { businessDetailServices } from './business-details.mjs'

export function railCategory(row, locale = 'bg') {
  const category = railBusinessCategory(row), en = locale === 'en'
  const names = publicServiceNames(row).join(' ')
  if (category === 'nails') {
    const manicure = /маникюр|manicure/iu.test(names), pedicure = /педикюр|pedicure/iu.test(names)
    if (manicure && pedicure) return en ? 'Manicure, pedicure' : 'Маникюр, педикюр'
    if (pedicure && !manicure) return en ? 'Pedicure' : 'Педикюр'
  }
  if (category === 'consulting') {
    if (/счетовод|accountan|bookkeep/iu.test(names)) return en ? 'Accounting consultations' : 'Счетоводни консултации'
    if (/данъч|tax\b/iu.test(names)) return en ? 'Tax consultations' : 'Данъчни консултации'
  }
  return categoryById(category)?.[en ? 'en' : 'bg'] || ''
}

export function railBusinessCategory(row) {
  if (row.source === 'gorez') {
    // Search category is an eligibility filter, not the business's identity.
    if (categoryById(row.businessCategory)) return row.businessCategory
    const inferredIndustry = row.industry || categoryById(row.category)?.industry
    const actual = businessArtCategory({ ...row, industry: inferredIndustry })
    if (actual === 'barber' || actual === 'nails') return actual
  }
  if (row.primaryType === 'barber_shop') return 'barber'
  return row.category || businessArtCategory(row)
}

function publicServiceNames(row) {
  if (!['gorez', 'catalogue'].includes(row.source)) return []
  const names = Array.isArray(row.publicServiceNames) ? row.publicServiceNames : (Array.isArray(row.services) ? row.services : []).filter(service => service && service.active !== false).map(service => service.name)
  return [...new Map(names.filter(name => typeof name === 'string').map(name => name.trim().replace(/\s+/g, ' ')).filter(Boolean).map(name => [normalizeSearchText(name), name])).values()].slice(0, 30)
}

// First-party facts only. A generic consultant is not assigned an invented
// specialty; if the business supplies one, show its actual service wording.
export function railServiceDescription(row, locale = 'bg') {
  const category = railBusinessCategory(row)
  const generic = new Set([railCategory(row, locale), ...['bg', 'en'].map(language => categoryById(category)?.[language])].filter(Boolean).map(normalizeSearchText))
  return publicServiceNames(row).filter(name => !generic.has(normalizeSearchText(name))).slice(0, 2).join(' · ')
}

// Compact, vertical first-party menu. Matching services lead, while the full
// reviewed menu supplies prices (including "from" prices). Never pair a price
// with a different service by array index or invent a price for an unknown one.
export function railServiceItems(row) {
  if (!['gorez', 'catalogue'].includes(row.source)) return []
  const details = businessDetailServices(row)
  const byName = new Map()
  for (const service of details) {
    const key = normalizeSearchText(service.name), existing = byName.get(key)
    byName.set(key, existing && [existing.price, existing.currency, existing.priceKind].join('|') !== [service.price, service.currency, service.priceKind].join('|') ? { ...existing, price: null } : existing || service)
  }
  const matching = (Array.isArray(row.services) ? row.services : []).filter(service => service?.active !== false && typeof service?.name === 'string').map(service => service.name)
  const names = [...matching, ...publicServiceNames(row), ...details.map(service => service.name)]
  const unique = new Map()
  for (const raw of names) {
    const name = raw.trim().replace(/\s+/g, ' '), key = normalizeSearchText(name)
    if (!key || unique.has(key)) continue
    unique.set(key, byName.get(key) || { name, price: null })
  }
  return [...unique.values()].slice(0, 3)
}

export function railPhone(value) {
  if (typeof value !== 'string' || !/^[+\d\s().-]{5,40}$/.test(value)) return null
  const phone = value.replace(/[\s().-]/g, '')
  return /^\+?\d{5,15}$/.test(phone) ? `tel:${phone}` : null
}

// Only real contact data supplied by an allowed provider/first-party source.
// A generic website is not promoted to a verified appointment booking page.
export function railExternalAction(row, now = Date.now()) {
  if (row.source === 'catalogue') {
    const today = new Date(now).toISOString().slice(0, 10)
    if (row.booking?.verified !== true || !row.booking.checkedOn || !row.booking.validUntil || row.booking.checkedOn > today || row.booking.validUntil < today) return null
    if (row.booking.kind === 'form') {
      const href = safeBookingUrl(row.booking.url)
      return href ? { kind: 'form', href } : null
    }
    const href = row.booking.kind === 'phone' && row.booking.phone === row.phone ? railPhone(row.phone) : null
    return href ? { kind: 'phone', href } : null
  }
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

export function orderedRailRows(rows = [], { preserveOrder = false } = {}) {
  const unique = new Map()
  for (const row of rows) {
    if (!['gorez', 'google', 'catalogue'].includes(row?.source) || !row.id) continue
    const key = `${row.source}:${row.source === 'google' ? row.placeId || row.id : row.id}`
    if (!unique.has(key)) unique.set(key, row)
  }
  // Free catalogue ordering is determined globally before pagination. Resorting
  // appended pages here would jump cards under the user's finger and undo the
  // category variety in empty-query city browsing.
  if (preserveOrder || rows.some(row => row?.source === 'catalogue')) return [...unique.values()].slice(0, 5000)
  return [...unique.values()].sort((a, b) =>
    Number(a.proximityBand === 'further') - Number(b.proximityBand === 'further') ||
    Number(b.source === 'gorez') - Number(a.source === 'gorez') ||
    (a.source === 'google' && b.source === 'google' ? compareExternalRatings(a, b) : 0) ||
    (a.source === 'google' ? ({ verified: 3, website: 2, phone: 1 }[railExternalAction(b)?.kind] || 0) - ({ verified: 3, website: 2, phone: 1 }[railExternalAction(a)?.kind] || 0) : 0) ||
    ((Number.isFinite(a.distanceKm) && Number.isFinite(b.distanceKm)) ? a.distanceKm - b.distanceKm : 0)
  ).slice(0, 15)
}

export function googleRailWidth(count) {
  return Math.min(15, Math.max(1, Number.isSafeInteger(count) ? count : 1))
}

// Actual numeric ratings from an authorised data path only. UI Kit IDs have
// no ratings: never scrape the native card to feed this comparator.
export function compareExternalRatings(a, b) {
  const rating = row => Number.isFinite(row.rating) && row.rating >= 1 && row.rating <= 5 ? row.rating : null
  const first = rating(a), second = rating(b)
  if (first === null || second === null) return first === second ? 0 : first === null ? 1 : -1
  const count = row => Number.isSafeInteger(row.reviewCount) && row.reviewCount > 0 ? row.reviewCount : 0
  return second - first || count(b) - count(a)
}

// First-party independently verified booking records, not Google content or a
// guess that every website accepts appointments. Keep each radius band intact.
export function prioritizeVerifiedBookingIds(ids = [], links = [], now = Date.now()) {
  const approved = new Set(links.filter(row => approvedExternalLink(row, now)).map(row => row.place_id))
  return [...ids].sort((a, b) => Number(approved.has(b)) - Number(approved.has(a)))
}
