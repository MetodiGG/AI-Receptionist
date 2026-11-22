import { findCity } from '../business-location.mjs'
import { categoryById } from './categories.mjs'
import { DEFAULT_DISCOVERY_CITY, DEFAULT_DISCOVERY_RADIUS_KM, DISCOVERY_RADIUS_CHOICES } from './defaults.mjs'
import { neighborhoodChoices } from './location-query.mjs'
import { subcategoryById } from './subcategories.mjs'

// URL navigation is a projection of the existing form state, not another
// category/query/location store. Precise consented positions stay in memory.
const stages = new Set(['closed', 'categories', 'services', 'results'])
const navigationKeys = ['q', 'query', 'category', 'subcategory', 'city', 'cityCode', 'neighborhood', 'radius', 'radiusKm', 'discover']
const positionKey = /^(?:latitude|longitude|lat|lng|lon|long|coords|coordinates|origin|locationmetadata|observedat|accuracymeters|consent|nearby|expandnearby)(?:$|[.[\]])/i
const safeQuery = value => typeof value === 'string' && value.length <= 300 && !/[\u0000-\u001f\u007f]/u.test(value) ? value : ''

function paramsFrom(search) {
  if (search instanceof URLSearchParams) return new URLSearchParams(search)
  return new URLSearchParams(typeof search === 'string' ? search.replace(/^\?/, '') : '')
}

// Canonical names win over compatibility aliases. Ambiguous duplicate values
// are ignored rather than silently choosing one of two different filters.
function single(params, key, alias) {
  const actual = params.has(key) ? key : alias
  if (!actual || params.getAll(actual).length !== 1) return undefined
  return params.get(actual)
}

export function readGuidedNavigation(search) {
  const params = paramsFrom(search)
  if (!navigationKeys.some(key => params.has(key))) return null
  const query = safeQuery(single(params, 'q', 'query'))
  const explicitCategory = categoryById(single(params, 'category'))?.id || ''
  const child = subcategoryById(single(params, 'subcategory'))
  const category = explicitCategory || child?.category || ''
  const subcategory = child?.category === category ? child.id : ''
  const cityValue = single(params, 'city', 'cityCode')
  const explicitCity = findCity(cityValue)?.code || ''
  const cityCode = explicitCity || DEFAULT_DISCOVERY_CITY
  const quarterValue = single(params, 'neighborhood')
  // A malformed explicit city cannot lend its quarter to the Sofia fallback.
  const hasCityParameter = params.has('city') || params.has('cityCode')
  const neighborhood = (!hasCityParameter || explicitCity) && neighborhoodChoices(cityCode).includes(quarterValue) ? quarterValue : ''
  const cityWasChosen = Boolean(explicitCity || neighborhood)
  const radiusValue = single(params, 'radius', 'radiusKm')
  const radius = typeof radiusValue === 'string' && /^(?:1|2|3|5|10|25)$/u.test(radiusValue) ? Number(radiusValue) : null
  const radiusKm = DISCOVERY_RADIUS_CHOICES.includes(radius) ? radius : DEFAULT_DISCOVERY_RADIUS_KM
  const requestedStage = single(params, 'discover')
  const hasFilter = Boolean(category || cityWasChosen || neighborhood || radius !== null)
  let stage = stages.has(requestedStage) ? requestedStage : query.trim() || hasFilter ? 'results' : 'closed'
  if (stage === 'services' && !category) stage = 'categories'
  return { query, category, subcategory, cityCode, cityWasChosen, neighborhood, radiusKm, stage }
}

export function serializeGuidedNavigation(currentUrl, selection = {}, stage) {
  let url
  try { url = new URL(currentUrl, 'https://gorez.invalid') } catch { url = new URL('/', 'https://gorez.invalid') }
  if (!['http:', 'https:'].includes(url.protocol)) url = new URL('/', 'https://gorez.invalid')
  const params = new URLSearchParams(url.search)
  for (const key of [...params.keys()]) {
    if (navigationKeys.includes(key) || positionKey.test(key)) params.delete(key)
  }
  const next = new URLSearchParams()
  if (typeof selection.query === 'string') next.set('q', selection.query)
  if (typeof selection.category === 'string') next.set('category', selection.category)
  if (typeof selection.subcategory === 'string') next.set('subcategory', selection.subcategory)
  // Use the actual form city to validate a quarter; serialize an implicit
  // city only when a valid quarter makes it an explicit geographic filter.
  if (typeof selection.cityCode === 'string') next.set('city', selection.cityCode)
  if (typeof selection.neighborhood === 'string') next.set('neighborhood', selection.neighborhood)
  if (DISCOVERY_RADIUS_CHOICES.includes(selection.radiusKm)) next.set('radius', String(selection.radiusKm))
  if (stages.has(stage)) next.set('discover', stage)
  const normalized = readGuidedNavigation(next) || {
    query: '', category: '', subcategory: '', cityCode: DEFAULT_DISCOVERY_CITY,
    neighborhood: '', radiusKm: DEFAULT_DISCOVERY_RADIUS_KM, stage: 'closed',
  }
  if (!stages.has(stage)) {
    const hasSelection = normalized.query.trim() || normalized.category || normalized.neighborhood ||
      selection.cityWasChosen === true && Boolean(findCity(selection.cityCode)) || normalized.radiusKm !== DEFAULT_DISCOVERY_RADIUS_KM
    normalized.stage = hasSelection ? 'results' : 'closed'
  }
  if (normalized.query) params.set('q', normalized.query)
  if (normalized.category) params.set('category', normalized.category)
  if (normalized.subcategory) params.set('subcategory', normalized.subcategory)
  if (selection.cityWasChosen === true && findCity(selection.cityCode) || normalized.neighborhood) params.set('city', normalized.cityCode)
  if (normalized.neighborhood) params.set('neighborhood', normalized.neighborhood)
  if (normalized.radiusKm !== DEFAULT_DISCOVERY_RADIUS_KM) params.set('radius', String(normalized.radiusKm))
  params.set('discover', normalized.stage)
  // Ordinary anchors survive. An old hash containing coordinate parameters
  // is not an anchor we should keep forwarding into navigation history.
  const hash = /(?:^#|[?&])(?:latitude|longitude|lat|lng|lon|coords|coordinates|origin)=/i.test(url.hash) ? '' : url.hash
  const search = params.toString()
  const pathname = url.pathname.startsWith('//') ? '/' + url.pathname.replace(/^\/+/, '') : url.pathname
  return `${pathname}${search ? '?' + search : ''}${hash}`
}
