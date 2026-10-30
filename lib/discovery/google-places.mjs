import { z } from 'zod'
import { categoryById } from './categories.mjs'
import { providerJson } from './http.mjs'
import { authorizeGooglePlaces, googlePlacesAuthConfigured } from './google-auth.mjs'
import { distanceKm } from './internal-search.mjs'

// Pro search SKUs only. Ratings, hours, website, phone, reviews and photos are
// intentionally NOT requested. These would raise the search billing tier.
export const GOOGLE_SEARCH_FIELDS = 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.googleMapsUri,places.businessStatus,places.attributions'
export const GOOGLE_DETAILS_FIELDS = 'id,websiteUri,nationalPhoneNumber,attributions'
export const placeIdSchema = z.string().min(5).max(200).regex(/^[A-Za-z0-9_-]+$/)
const placeSchema = z.object({
  id: placeIdSchema, displayName: z.object({ text: z.string().max(500) }), formattedAddress: z.string().max(1000).optional(),
  location: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).optional(),
  primaryType: z.string().max(100).optional(), googleMapsUri: z.string().max(2000).optional(), businessStatus: z.string().optional(),
  attributions: z.array(z.object({ provider: z.string().max(200).optional(), providerUri: z.string().max(2000).optional() })).max(20).optional(),
})
export function safeProviderUrl(value, mapsOnly = false) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    if (mapsOnly && !['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl'].includes(url.hostname)) return null
    return url.href
  } catch { return null }
}
export function normalizeAttributions(rows = []) {
  return rows.map(row => ({ name: row.provider?.trim(), url: safeProviderUrl(row.providerUri) })).filter(row => row.name)
}
export function normalizeGooglePlaces(data, category, maxResults = 12) {
  if (!Array.isArray(data.places) && data.places !== undefined) throw new Error('INVALID_PLACES_RESPONSE')
  const rows = []
  for (const raw of (data.places || []).slice(0, 20)) {
    const parsed = placeSchema.safeParse(raw)
    if (!parsed.success) throw new Error('INVALID_PLACES_RESPONSE')
    const place = parsed.data
    if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') continue
    const mapsUrl = safeProviderUrl(place.googleMapsUri, true)
    if (!mapsUrl) continue
    rows.push({ id: `google:${place.id}`, source: 'google', placeId: place.id, name: place.displayName.text,
      address: place.formattedAddress || '', coordinates: place.location || null, category, primaryType: place.primaryType || null,
      mapsUrl, attributions: normalizeAttributions(place.attributions), services: [], availability: { status: 'unknown', slots: [] },
    })
  }
  return rows.slice(0, maxResults)
}
export function googleSearchRequest(intent, { maxResults = 12 } = {}) {
  const category = categoryById(intent.category), types = category?.types || []
  // Nearby has no free-text service filter. Use it only for a genuinely exact
  // type query; specific services (e.g. beard, maths or cleaning) use Text.
  const generic = !intent.service || (category?.genericTerms || category?.terms.slice(0, 2) || []).includes(intent.service)
  if (intent.coordinates && !intent.city && !intent.neighborhood && types.length === 1 && generic) return {
    method: 'nearby', url: 'https://places.googleapis.com/v1/places:searchNearby',
    body: { includedTypes: types, maxResultCount: maxResults, languageCode: 'bg', rankPreference: 'DISTANCE', locationRestriction: { circle: { center: intent.coordinates, radius: intent.radiusKm * 1000 } } },
  }
  const body = {
    textQuery: [generic && category?.searchQuery ? category.searchQuery : intent.service || category?.bg, intent.neighborhood, intent.city, 'България'].filter(Boolean).join(', '),
    pageSize: maxResults, languageCode: 'bg', regionCode: 'BG',
    ...(types.length === 1 && (!intent.searchV2 || generic) ? { includedType: types[0], strictTypeFiltering: true } : {}),
    ...(intent.searchV2 && intent.category === 'home_services' ? { includePureServiceAreaBusinesses: true } : {}),
  }
  if (intent.coordinates) body.locationBias = { circle: { center: intent.coordinates, radius: intent.radiusKm * 1000 } }
  return { method: 'text', url: 'https://places.googleapis.com/v1/places:searchText', body }
}
export async function searchGooglePlaces(intent, { config, claimBudget, fetcher, authorizeGoogle = authorizeGooglePlaces, log = () => {} }) {
  // For the Bulgarian/EEA account, fetch only excepted IDs (and coordinates
  // when needed for a real radius). Names/addresses/ratings stay in UI Kit.
  if (config.uiKitEnabled) {
    if (!googlePlacesAuthConfigured(config) || !config.browserKey) return { results: [], status: 'not_configured' }
    const search = googleSearchRequest(intent, config), method = search.method === 'nearby' ? 'nearby' : intent.coordinates ? 'text' : 'ids'
    if (!await claimBudget('google', method)) return { results: [], status: 'quota' }
    try {
      const auth = await authorizeGoogle(config, search.method)
      const data = await providerJson(search.url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth, 'X-Goog-FieldMask': intent.coordinates ? 'places.id,places.location' : 'places.id' }, body: JSON.stringify({ ...search.body, languageCode: intent.locale || 'bg' }) }, { fetcher, maxBytes: 10000 })
      const parsed = z.object({ places: z.array(z.object({ id: placeIdSchema, location: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).optional() })).max(20).default([]) }).parse(data)
      const places = parsed.places.filter(row => !intent.coordinates || (row.location && distanceKm(intent.coordinates, row.location) <= intent.radiusKm))
      log({ provider: 'google', method, status: 'ok' })
      return { results: [], status: 'ui_kit', placeIds: [...new Set(places.map(row => row.id))] }
    } catch { log({ provider: 'google', method, status: 'error' }); return { results: [], status: 'unavailable' } }
  }
  if (!config.googleEnabled) return { results: [], status: 'disabled' }
  if (!googlePlacesAuthConfigured(config)) return { results: [], status: 'not_configured' }
  const search = googleSearchRequest(intent, config)
  if (!await claimBudget('google', search.method)) return { results: [], status: 'quota' }
  const started = Date.now()
  try {
    const auth = await authorizeGoogle(config, search.method)
    const data = await providerJson(search.url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth, 'X-Goog-FieldMask': GOOGLE_SEARCH_FIELDS }, body: JSON.stringify({ ...search.body, languageCode: intent.locale || 'bg' }) }, { fetcher })
    const results = normalizeGooglePlaces(data, intent.category, config.maxResults)
    log({ provider: 'google', method: search.method, status: 'ok', durationMs: Date.now() - started })
    return { results, status: 'ok' }
  } catch {
    log({ provider: 'google', method: search.method, status: 'error', durationMs: Date.now() - started })
    return { results: [], status: 'unavailable' }
  }
}
export async function googlePlaceDetails(placeId, { config, claimBudget, fetcher, authorizeGoogle = authorizeGooglePlaces, log = () => {} }) {
  placeIdSchema.parse(placeId)
  if (!config.googleEnabled || !googlePlacesAuthConfigured(config) || !config.detailsEnabled) return null
  if (!await claimBudget('google', 'details')) return null
  try {
    const auth = await authorizeGoogle(config, 'details')
    const data = await providerJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, { headers: { ...auth, 'X-Goog-FieldMask': GOOGLE_DETAILS_FIELDS } }, { fetcher, maxBytes: 10000 })
    const details = z.object({ id: placeIdSchema, websiteUri: z.string().max(2000).optional(), nationalPhoneNumber: z.string().max(50).optional(), attributions: z.array(z.object({ provider: z.string().optional(), providerUri: z.string().optional() })).max(20).optional() }).parse(data)
    if (details.id !== placeId) return null
    log({ provider: 'google', method: 'details', status: 'ok' })
    return { website: safeProviderUrl(details.websiteUri), phone: details.nationalPhoneNumber || null, attributions: normalizeAttributions(details.attributions) }
  } catch { log({ provider: 'google', method: 'details', status: 'error' }); return null }
}
