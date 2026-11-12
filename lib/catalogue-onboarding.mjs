import { approvedCatalogueRecord } from './discovery/catalogue-policy.mjs'
import { currentPublishedFact } from './discovery/business-details.mjs'
import { categoryById, normalizeSearchText } from './discovery/categories.mjs'
import { discoveryHeaders, sameSiteRequest } from './discovery/http.mjs'
import { findCity, transliterate } from './business-location.mjs'
import { INDUSTRY_KEYS } from './public-locale.mjs'
import { catalogueRegistrationPoint } from './business-registration-location.mjs'

export const CATALOGUE_ONBOARDING_SEARCH_LIMIT = 8
export const CATALOGUE_ONBOARDING_SERVICE_LIMIT = 40
export const CATALOGUE_ONBOARDING_NAME_LIMIT = 120
const catalogueId = /^sofia-[a-z0-9-]{3,80}$/
const queryKeys = new Set(['q', 'id', 'city', 'lang'])
const names = new WeakMap()

function normalizedName(value) {
  return normalizeSearchText(transliterate(String(value || ''))).normalize('NFKD')
    .replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim()
}

function recordName(row) {
  if (Object.isFrozen(row) && names.has(row)) return names.get(row)
  const value = normalizedName(row.name)
  if (Object.isFrozen(row)) names.set(row, value)
  return value
}

function eligible(raw, now) {
  const row = approvedCatalogueRecord(raw, now)
  // A public draft lookup must not offer an explicitly linked partner as an
  // unclaimed business. Selection never proves ownership or authorizes writes.
  return row && !row.gorezBusinessId ? row : null
}

function oneEditApart(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++edits > 1) return false
    if (a.length >= b.length) i++
    if (b.length >= a.length) j++
  }
  return edits + Number(i < a.length || j < b.length) <= 1
}

function matchScore(name, query) {
  if (name === query) return 0
  if (name.startsWith(query)) return 100
  if (name.includes(query)) return 200
  const words = name.split(' '), tokens = query.split(' ')
  let penalty = 0, fuzzy = false
  for (const token of tokens) {
    if (words.includes(token)) continue
    if (token.length >= 2 && words.some(word => word.startsWith(token))) { penalty++; continue }
    if (token.length >= 3 && words.some(word => word.includes(token))) { penalty += 2; continue }
    if (token.length >= 4 && words.some(word => oneEditApart(word, token))) { penalty += 3; fuzzy = true; continue }
    return null
  }
  return (fuzzy ? 400 : 300) + penalty
}

export function searchCatalogueForOnboarding(records, { query, cityCode } = {}, { now = Date.now(), limit = CATALOGUE_ONBOARDING_SEARCH_LIMIT } = {}) {
  if (typeof query !== 'string' || query.trim().length < 2 || query.trim().length > 120 || (cityCode && !findCity(cityCode))) return []
  const text = normalizedName(query)
  if (text.length < 2 || text.split(' ').length > 20) return []
  const count = Number.isInteger(limit) ? Math.max(0, Math.min(limit, CATALOGUE_ONBOARDING_SEARCH_LIMIT)) : CATALOGUE_ONBOARDING_SEARCH_LIMIT
  return records.map(raw => eligible(raw, now)).filter(row => row && (!cityCode || row.cityCode === cityCode))
    .map(row => ({ row, name: recordName(row), score: matchScore(recordName(row), text) })).filter(item => item.score !== null)
    .sort((a, b) => a.score - b.score || a.name.length - b.name.length || a.name.localeCompare(b.name, 'bg') || a.row.id.localeCompare(b.row.id))
    .slice(0, count).map(({ row }) => ({
      id: row.id, name: row.name, address: row.address, cityCode: row.cityCode, neighborhood: row.neighborhood, category: row.category,
      serviceCount: row.services.length, currentPriceCount: row.services.filter(service => currentPublishedFact(service.price, now)).length,
    }))
}

function publishedPriceLabel(price, locale) {
  const formatter = new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'bg-BG', { style: 'currency', currency: price.currency, minimumFractionDigits: 0, maximumFractionDigits: 20 })
  const amount = price.kind === 'range' ? `${formatter.format(price.amount)}–${formatter.format(price.maximum)}` : formatter.format(price.amount)
  return `${price.kind === 'from' ? (locale === 'en' ? 'from ' : 'от ') : ''}${amount}${price.unit ? ` / ${price.unit}` : ''}`
}

function serviceDraft(service, now, locale) {
  const current = currentPublishedFact(service.price, now), price = service.price
  // Import literal amounts together with their meaning; never ask owners to
  // retype a known fee merely because it is per procedure, FROM or a range.
  const supported = current && ['EUR', 'BGN'].includes(price.currency)
    && price.amount <= 999999.99 && /^\d+(?:\.\d{1,2})?$/.test(String(price.amount))
    && (price.kind !== 'range' || price.maximum <= 999999.99 && /^\d+(?:\.\d{1,2})?$/.test(String(price.maximum)))
  const duration = Number.isInteger(service.durationMin) && service.durationMin >= 5 && service.durationMin <= 1440
    && currentPublishedFact({ sourceUrl: service.durationSourceUrl, checkedOn: service.durationCheckedOn }, now)
  return {
    name: service.name, price: supported ? String(price.amount) : '', duration_min: duration ? String(service.durationMin) : '',
    currency: supported ? price.currency : 'EUR', description: service.description || '',
    price_details: supported ? { kind: price.kind, ...(price.kind === 'range' ? { maximum: price.maximum } : {}), ...(price.unit ? { unit: price.unit } : {}) } : {},
    catalogueHint: {
      ...(current ? { priceLabel: publishedPriceLabel(price, locale) } : {}),
      ...(service.description ? { description: service.description } : {}),
    },
  }
}

export function catalogueOnboardingDetail(records, id, { now = Date.now(), cityCode, locale = 'bg' } = {}) {
  if (!catalogueId.test(id || '') || (cityCode && !findCity(cityCode))) return null
  const row = eligible(records.find(item => item?.id === id), now)
  if (!row || (cityCode && row.cityCode !== cityCode)) return null
  const mappedIndustry = categoryById(row.category)?.industry
  return {
    business: { id: row.id, name: row.name, address: row.address, cityCode: row.cityCode, neighborhood: row.neighborhood,
      industry: INDUSTRY_KEYS.includes(mappedIndustry) ? mappedIndustry : 'other', website: row.website, phone: row.phone,
      ...(row.locationKind==='premises'&&catalogueRegistrationPoint(row.coordinates)?{coordinates:{...row.coordinates}}:{}) },
    // Keep the whole public inventory. The owner chooses at most 40 and fixes
    // overlong names before submitting; never silently omit real services.
    services: row.services.map(service => serviceDraft(service, now, locale)),
    serviceCount: row.services.length, serviceLimit: CATALOGUE_ONBOARDING_SERVICE_LIMIT, serviceNameLimit: CATALOGUE_ONBOARDING_NAME_LIMIT,
  }
}

export function parseCatalogueOnboardingQuery(url) {
  const params = new URL(url).searchParams
  for (const key of params.keys()) if (!queryKeys.has(key) || params.getAll(key).length !== 1) return null
  const id = params.get('id'), query = params.get('q'), cityCode = params.get('city')?.trim(), locale = params.get('lang') ?? 'bg'
  if (!['bg', 'en'].includes(locale) || (cityCode != null && (!/^\d{5}$/.test(cityCode) || !findCity(cityCode)))) return null
  if ((id === null) === (query === null)) return null
  if (id !== null) return catalogueId.test(id) ? { id, cityCode, locale } : null
  const text = query.trim()
  return text.length >= 2 && text.length <= 120 ? { query: text, cityCode, locale } : null
}

// Static lookup intentionally never calls the shared DB-backed rate limiter.
// This bounded process-local limiter is best-effort on multi-instance hosts;
// it is an abuse guard, not authorization or a distributed usage quota.
export function createCatalogueOnboardingRateLimiter({ now = Date.now, limit = 60, windowMs = 60000, maxKeys = 10000 } = {}) {
  const attempts = new Map()
  let nextSweep = 0
  return key => {
    const time = now()
    if (time >= nextSweep) {
      for (const [id, value] of attempts) if (value.resetAt <= time) attempts.delete(id)
      nextSweep = time + windowMs
    }
    let value = attempts.get(key)
    if (!value || value.resetAt <= time) {
      if (!value && attempts.size >= maxKeys) return false
      value = { count: 0, resetAt: time + windowMs }
      attempts.set(key, value)
    }
    if (value.count >= limit) return false
    value.count++
    return true
  }
}

export function createCatalogueOnboardingHandler({ catalogue, allowAttempt, now = Date.now, development = false }) {
  const reply = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { ...discoveryHeaders, ...extra } })
  return async request => {
    if (!sameSiteRequest(request, { development })) return reply({ error: { code: 'FORBIDDEN' } }, 403)
    try {
      if (!await allowAttempt(request)) return reply({ error: { code: 'RATE_LIMITED' } }, 429, { 'Retry-After': '60' })
      const input = parseCatalogueOnboardingQuery(request.url)
      if (!input) return reply({ error: { code: 'INVALID_REQUEST' } }, 400)
      const records = typeof catalogue === 'function' ? await catalogue() : catalogue
      if (!Array.isArray(records)) throw new Error('Catalogue unavailable')
      const options = { now: now(), cityCode: input.cityCode, locale: input.locale }
      if (input.id) {
        const detail = catalogueOnboardingDetail(records, input.id, options)
        return detail ? reply(detail) : reply({ error: { code: 'NOT_FOUND' } }, 404)
      }
      return reply({ businesses: searchCatalogueForOnboarding(records, input, options) })
    } catch { return reply({ error: { code: 'LOOKUP_UNAVAILABLE' } }, 503, { 'Retry-After': '30' }) }
  }
}
