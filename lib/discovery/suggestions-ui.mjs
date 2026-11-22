import { CATALOGUE_ID_PATTERN } from './catalogue-cities.mjs'

// Small browser-only contracts. Never import the catalogue, server schema,
// Supabase adapter or suggestion index into the search input's client bundle.
export const DISCOVERY_SUGGESTION_LIMIT = 8
export const DISCOVERY_SUGGESTION_DEBOUNCE_MS = 250
export const DISCOVERY_SUGGESTION_COPY = {
  bg: { services: 'Услуги', businesses: 'Бизнеси', categories: 'Категории', all: 'Виж всички резултати', loading: 'Търсим предложения…', empty: 'Няма точни предложения. Опитай пълно търсене.', unavailable: 'Предложенията временно не са достъпни. Пълното търсене остава достъпно.', retry: 'Опитай пак', related: 'Разгледай категории', partner: 'Партньор на GoRez', partial: 'Предложенията от партньори временно не са достъпни.' },
  en: { services: 'Services', businesses: 'Businesses', categories: 'Categories', all: 'See all results', loading: 'Finding suggestions…', empty: 'No exact suggestions. Try a full search.', unavailable: 'Suggestions are temporarily unavailable. You can still run a full search.', retry: 'Retry', related: 'Explore categories', partner: 'GoRez Partner', partial: 'Partner suggestions are temporarily unavailable.' },
}

function validBusinessHref(value) {
  if (typeof value !== 'string') return false
  if (/^\/book\/[a-z0-9-]{1,64}\?lang=(?:bg|en)$/.test(value)) return true
  const catalogue = /^\/businesses\/catalogue\/([^/?#]+)\?lang=(?:bg|en)$/.exec(value)
  return Boolean(catalogue && CATALOGUE_ID_PATTERN.test(catalogue[1]))
}

export function validSuggestionResponse(body) {
  const valid = item => item && typeof item.id === 'string' && typeof item.label === 'string' && item.label.length > 0 && item.label.length <= 200
    && (item.kind === 'business' ? validBusinessHref(item.href)
      : item.kind === 'service' ? typeof item.query === 'string' && item.query.length >= 2 && item.query.length <= 200
        : item.kind === 'category' && /^[a-z_]+$/.test(item.category || ''))
  return body && Array.isArray(body.groups) && body.groups.length <= 3 && body.groups.every(group =>
    ['service', 'business', 'category'].includes(group.kind) && typeof group.label === 'string' && Array.isArray(group.items)
    && group.items.every(item => valid(item) && item.kind === group.kind))
    && body.groups.reduce((sum, group) => sum + group.items.length, 0) <= DISCOVERY_SUGGESTION_LIMIT
    && Array.isArray(body.alternatives) && body.alternatives.length <= 4 && body.alternatives.every(item => valid(item) && item.kind === 'category')
}

// Keystroke results live only in this mounted input, not local/session storage
// or a global user-query cache. Exact short repeats avoid another request.
export function createSuggestionInteractionCache({ now = Date.now, ttlMs = 20000, maxKeys = 20 } = {}) {
  const rows = new Map()
  return {
    get(key) {
      const row = rows.get(key)
      if (!row || row.expiresAt <= now()) { rows.delete(key); return null }
      rows.delete(key); rows.set(key, row)
      return row.value
    },
    set(key, value) {
      rows.delete(key); rows.set(key, { value, expiresAt: now() + ttlMs })
      while (rows.size > maxKeys) rows.delete(rows.keys().next().value)
    },
    clear() { rows.clear() },
  }
}
