import { SERVICE_SUGGESTION_DATA } from './service-suggestion-data.mjs'

const CYRILLIC = Object.freeze({ а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',ѝ:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sht',ъ:'a',ь:'y',ю:'yu',я:'ya' })
export const MAX_SERVICE_SUGGESTIONS = 12

// One deterministic alphabet for Cyrillic, Latin transliteration and accented
// English. No user-built regular expressions, fuzzy guesses or remote lookup.
export function normalizeServiceSuggestion(value) {
  return typeof value === 'string' ? value.normalize('NFKC').toLowerCase()
    .replace(/[а-яѝ]/g, letter => CYRILLIC[letter] || letter)
    .normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ') : ''
}

const vocabulary = Object.fromEntries(Object.entries(SERVICE_SUGGESTION_DATA).map(([industry, groups]) => [industry,
  groups.flatMap(group => group.services.map(service => ({
    id: `${industry}:${service.id}`, name: { bg: service.bg, en: service.en }, group: { bg: group.bg, en: group.en },
    names: [service.bg, service.en].map(normalizeServiceSuggestion),
    aliases: service.aliases.map(normalizeServiceSuggestion),
  }))),
]))

function matchRank(value, query) {
  if (value === query) return 0
  if (value.startsWith(query)) return 1
  if (value.includes(` ${query}`)) return 2
  return value.includes(query) ? 3 : Infinity
}

export function searchServiceSuggestions(query, options = {}) {
  const industry = options?.industry
  if (typeof industry !== 'string' || !Object.hasOwn(vocabulary, industry)
    || typeof query !== 'string' || query.length > 160 || query.trim().length < 2) return []
  const normalized = normalizeServiceSuggestion(query)
  if (normalized.length < 2) return []
  const locale = options?.locale === 'en' ? 'en' : 'bg'
  const requested = options?.limit ?? 8
  const limit = typeof requested === 'number' && Number.isFinite(requested) ? Math.min(MAX_SERVICE_SUGGESTIONS, Math.max(0, Math.floor(requested))) : 8
  if (!limit) return []
  return vocabulary[industry].map((service, order) => ({ service, order,
    rank: Math.min(...service.names.map(name => matchRank(name, normalized)), ...service.aliases.map(alias => matchRank(alias, normalized))),
  })).filter(row => Number.isFinite(row.rank)).sort((a, b) => a.rank - b.rank || a.order - b.order).slice(0, limit)
    .map(({ service }) => ({ id: service.id, name: service.name[locale], group: service.group[locale] }))
}
