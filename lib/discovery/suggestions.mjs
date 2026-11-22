import { z } from 'zod'
import { findCity } from '../business-location.mjs'
import { visiblePublicServices } from '../public-service-eligibility.mjs'
import { approvedCatalogueRecord } from './catalogue-policy.mjs'
import { isCataloguePartnerDuplicate } from './catalogue-search.mjs'
import { DISCOVERY_CATEGORIES, categoryById } from './categories.mjs'
import { DEFAULT_DISCOVERY_CITY } from './defaults.mjs'
import { matchesNeighborhood } from './internal-search.mjs'
import { discoveryCitiesInQuery, neighborhoodIn } from './location-query.mjs'
import { SERVICE_LEXICON, createServiceEvidenceMatcher, identifySearchService, serviceSearchPhrase } from './service-lexicon.mjs'
import { normalizedSearchKey, searchTextEvidence } from './text-match.mjs'
import { discoveryHeaders, readBoundedJson, sameSiteRequest } from './http.mjs'
import { DISCOVERY_SUGGESTION_LIMIT, DISCOVERY_SUGGESTION_COPY } from './suggestions-ui.mjs'
import { presentPublicService } from '../locale/public-content-server.mjs'
import { serviceDisplayName, postalDisplay } from '../locale/public-content.mjs'
export { DISCOVERY_SUGGESTION_LIMIT, DISCOVERY_SUGGESTION_DEBOUNCE_MS, DISCOVERY_SUGGESTION_COPY } from './suggestions-ui.mjs'
const schema = z.object({ query: z.string().trim().min(2).max(120), locale: z.enum(['bg', 'en']).default('bg'),
  cityCode: z.string().regex(/^\d{5}$/).refine(value => Boolean(findCity(value))).default(DEFAULT_DISCOVERY_CITY),
  neighborhood: z.string().trim().max(120).default(''), category: z.enum(DISCOVERY_CATEGORIES.map(item => item.id)).optional(),
}).strict()
const cachedRows = new WeakMap()
const nativeId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const labelKeys = { service: 'services', business: 'businesses', category: 'categories' }

export function parseDiscoverySuggestionInput(value) { return schema.parse(value) }

function prepared(row, source) {
  if (Object.isFrozen(row) && cachedRows.has(row)) return cachedRows.get(row)
  const value = { row, source, services: (source === 'catalogue' ? row.services : visiblePublicServices(row))
    .filter(service => source === 'catalogue' || service.active === true)
    .filter(service => typeof service.name === 'string' && service.name.trim())
    .map(service => ({ label: service.name.trim(), key: normalizedSearchKey(service.name),
      category: categoryById(service.category)?.id, text: `${service.name} ${service.description || ''} ${service.category || ''}` })) }
  if (Object.isFrozen(row)) cachedRows.set(row, value)
  return value
}

function selectedRows(catalogue, partners, input, now) {
  const publicPartners = (partners || []).filter(row => row.active === true && row.platform_status === 'enabled'
    && nativeId.test(row.id || '') && /^[a-z0-9-]{1,64}$/.test(row.slug || ''))
  const rows = publicPartners.map(row => prepared(row, 'gorez'))
  for (const raw of catalogue || []) {
    const row = approvedCatalogueRecord(raw, now)
    if (row && !isCataloguePartnerDuplicate(row, publicPartners)) rows.push(prepared(row, 'catalogue'))
  }
  return rows.filter(({ row, source }) => (source === 'catalogue' ? row.cityCode : row.city_ekatte) === input.cityCode
    && matchesNeighborhood(row.neighborhood, input.neighborhood))
}

function compare(a, b) { return b.tier - a.tier || b.score - a.score || a.label.localeCompare(b.label, 'bg') || a.id.localeCompare(b.id) }
function bestEvidence(label, query, aliases) {
  const key = normalizedSearchKey(query)
  // Two-letter real brands (e.g. IN Beauty) remain discoverable even when
  // the same token is an English preposition in ordinary sentence matching.
  if (key.length >= 2 && key.length <= 3) {
    const actual = normalizedSearchKey(label)
    if (actual === key) return { tier: 4, score: 100 }
    if (actual.split(' ').includes(key)) return { tier: 3, score: 90 }
    if (actual.split(' ').some(word => word.startsWith(key))) return { tier: 2, score: 78 }
    // Two-letter input cannot safely use edit distance. A cheap normalized
    // prefix check also avoids a full matcher call for every unrelated name.
    if (!aliases) return null
  }
  const match = searchTextEvidence(label, query, { aliases })
  return match ? { tier: match.tier, score: match.score } : null
}

// Only already-public, real inventories provide suggestion evidence. Category
// names and canonical aliases are suggestions, never invented business facts,
// appointment slots, prices, ratings or a claim of popularity.
export function discoverySuggestions({ catalogue = [], partners = [] }, rawInput, { now = Date.now() } = {}) {
  const input = parseDiscoverySuggestionInput(rawInput), copy = DISCOVERY_SUGGESTION_COPY[input.locale]
  const typedCities = discoveryCitiesInQuery(input.query)
  const cityCode = typedCities.length === 1 ? typedCities[0].code : input.cityCode
  const neighborhood = input.neighborhood || neighborhoodIn(input.query.toLocaleLowerCase('bg'), cityCode) || ''
  const rows = selectedRows(catalogue, partners, { ...input, cityCode, neighborhood }, now)
  let query = normalizedSearchKey(input.query)
  for (const place of [neighborhood, ...typedCities.map(city => city.name), ...typedCities.map(city => city.nameEn)].filter(Boolean)) {
    query = query.replace(normalizedSearchKey(place), ' ').trim()
  }
  query = query.replace(/\s+/g, ' ').replace(/\s+(?:v|vav|in)$/u, '').trim()
  const identified = identifySearchService(input.query)
  let serviceQuery = serviceSearchPhrase(input.query, identified, { city: typedCities[0]?.name, neighborhood }) || query
  if (identified?.aliases.some(alias => normalizedSearchKey(alias) === normalizedSearchKey(serviceQuery))) serviceQuery = identified.service
  const matchesService = identified ? createServiceEvidenceMatcher(serviceQuery) : null
  const groups = { service: [], business: [], category: [] }, services = new Map(), presentCategories = new Set()
  for (const item of rows) {
    const { row, source } = item
    const nameEvidence = bestEvidence(row.name, input.query) || bestEvidence(row.name, query)
    if (nameEvidence) groups.business.push({ id: row.id, kind: 'business', label: row.name,
      detail: postalDisplay(row.neighborhood, input.locale) || (input.locale === 'en' ? findCity(cityCode)?.nameEn : findCity(cityCode)?.name) || '',
      source, partner: source === 'gorez', href: source === 'gorez' ? `/book/${row.slug}?lang=${input.locale}` : `/businesses/catalogue/${row.id}?lang=${input.locale}`,
      ...nameEvidence })
    for (const service of item.services) {
      const serviceCategory = service.category || identifySearchService(service.label)?.category
      if (serviceCategory) presentCategories.add(serviceCategory)
      const evidence = !matchesService || matchesService(service.text) ? bestEvidence(service.key, serviceQuery) : null
      if (evidence && !services.has(service.key)) services.set(service.key, {
        id: `service-${service.key}`, kind: 'service', label: service.label, query: service.label,
        presentationCategory: serviceCategory || (source === 'catalogue' ? row.category : input.category),
        cityCode, neighborhood, ...evidence,
      })
    }
    const industryCategories = DISCOVERY_CATEGORIES.filter(category => category.industry === row.industry)
    const category = source === 'catalogue' ? categoryById(row.category) : industryCategories.length === 1 ? industryCategories[0] : null
    if (category && item.services.length) presentCategories.add(category.id)
  }
  // Offer an economical canonical phrase (e.g. Manicure) only when a real
  // service supplies evidence. Dictionary entries alone never create results.
  for (const entry of SERVICE_LEXICON) {
    const evidence = bestEvidence(entry.service, serviceQuery, entry.aliases)
    if (!evidence) continue
    const hasEvidence = createServiceEvidenceMatcher(entry.service)
    if (!rows.some(row => row.services.some(service => hasEvidence(service.text)))) continue
    const key = normalizedSearchKey(entry.service)
    services.set(key, { id: `service-${key}`, kind: 'service', label: input.locale === 'en'
      ? entry.aliases.find(alias => /^[\x20-\x7e]+$/.test(alias) && /[a-z]/i.test(alias)) || entry.service : entry.service,
    query: entry.service, presentationCategory: entry.category, cityCode, neighborhood, ...evidence })
  }
  groups.service = [...services.values()].sort(compare)
  groups.business.sort(compare)
  for (const category of DISCOVERY_CATEGORIES.filter(category => presentCategories.has(category.id))) {
    const evidence = bestEvidence(category[input.locale], query, [category.bg, category.en, ...category.terms])
    if (evidence) groups.category.push({ id: category.id, kind: 'category', category: category.id,
      label: category[input.locale], cityCode, neighborhood, ...evidence })
  }
  groups.category.sort(compare)
  const selected = { service: [], business: [], category: [] }
  // Fairly reserve space for all matching groups, then fill unused slots.
  for (let round = 0, count = 0; count < DISCOVERY_SUGGESTION_LIMIT; round++) {
    let added = false
    for (const kind of ['service', 'business', 'category']) {
      const item = groups[kind][round]
      if (item && count < DISCOVERY_SUGGESTION_LIMIT) { selected[kind].push(item); count++; added = true }
    }
    if (!added) break
  }
  const visible = ['service', 'business', 'category'].filter(kind => selected[kind].length)
    .map(kind => ({ kind, label: copy[labelKeys[kind]], items: selected[kind].map(({ tier, score, presentationCategory, ...item }) => item.kind === 'service'
      ? { ...item, label: serviceDisplayName(presentPublicService({ name: item.label, category: presentationCategory || input.category }), input.locale) } : item) }))
  const total = visible.reduce((sum, group) => sum + group.items.length, 0)
  const alternatives = total ? [] : DISCOVERY_CATEGORIES.filter(category => presentCategories.has(category.id)).slice(0, 4)
    .map(category => ({ id: category.id, kind: 'category', category: category.id, label: category[input.locale], cityCode, neighborhood }))
  return { groups: visible, total, alternatives }
}

export function createDiscoverySuggestionsHandler({ config, catalogue, readInventory, revalidatePartners, allowAttempt, now = Date.now }) {
  const reply = (body, status = 200) => Response.json(body, { status, headers: discoveryHeaders })
  return async request => {
    if (!config.enabled) return reply({ error: { code: 'NOT_FOUND' } }, 404)
    if (!sameSiteRequest(request, { development: config.environment === 'development' })) return reply({ error: { code: 'FORBIDDEN' } }, 403)
    try {
      if (!await allowAttempt(request)) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
      const input = parseDiscoverySuggestionInput(await readBoundedJson(request))
      const typed = discoveryCitiesInQuery(input.query), cityCode = typed.length === 1 ? typed[0].code : input.cityCode
      let partners = [], partial = false
      try { partners = await readInventory({ cityCode }) } catch { partial = true }
      const records = typeof catalogue === 'function' ? await catalogue() : catalogue
      let result = discoverySuggestions({ catalogue: records, partners }, input, { now: now() })
      const ids = result.groups.flatMap(group => group.items).filter(item => item.source === 'gorez').map(item => item.id)
      const categoryIds = new Set([...result.groups.flatMap(group => group.items), ...result.alternatives].filter(item => item.kind === 'category').map(item => item.category))
      // Service/category suggestions can originate from a partner even when
      // its name did not match. Revalidate all matching partner evidence up to
      // the small candidate bound, not only business-name suggestions.
      // Always reserve the emitted business finalists first. Broad category
      // evidence may otherwise fill the bound before a later ID-sorted name.
      const evidenceIds = partners.filter(row => visiblePublicServices(row).some(service =>
        categoryIds.has(service.category || identifySearchService(service.name)?.category)
        || result.groups.some(group => group.items.some(item => item.kind === 'service' && createServiceEvidenceMatcher(item.query)(`${service.name} ${service.description || ''}`)))))
        .map(row => row.id)
      const candidates = [...new Set([...ids, ...evidenceIds])].slice(0, 24)
      if (candidates.length) {
        try { partners = await revalidatePartners(candidates) } catch { partners = []; partial = true }
        result = discoverySuggestions({ catalogue: records, partners }, input, { now: now() })
      } else if (partners.length) {
        // No current partner evidence is needed for this response. Avoid
        // retaining a category solely on an unvalidated cached partner.
        result = discoverySuggestions({ catalogue: records, partners: [] }, input, { now: now() })
      }
      return reply({ ...result, partial })
    } catch (error) {
      return reply({ error: { code: error?.name === 'ZodError' || error instanceof SyntaxError ? 'VALIDATION_ERROR' : 'SUGGESTIONS_UNAVAILABLE' } }, error?.name === 'ZodError' || error instanceof SyntaxError ? 422 : 503)
    }
  }
}
