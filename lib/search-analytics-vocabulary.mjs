import { SERVICE_LEXICON, identifySearchService } from './discovery/service-lexicon.mjs'
import { categoryById } from './discovery/categories.mjs'

// A closed, public service vocabulary, never a free-text search log. Health,
// legal/financial and other potentially sensitive searches share one opaque
// bucket. Unknown text, names, addresses and identifiers are never retained.
const ordinaryCategories = new Set(['barber', 'hair', 'nails', 'beauty', 'car_wash', 'detailing', 'auto_repair', 'fitness', 'education', 'pets', 'home_services'])
export const OTHER_SEARCH_TOPIC = '__other__'
export const SEARCH_ANALYTICS_TOPICS = Object.freeze([OTHER_SEARCH_TOPIC,
  ...new Set(SERVICE_LEXICON.filter(row => ordinaryCategories.has(row.category)).map(row => row.service)),
])
const topics = new Set(SEARCH_ANALYTICS_TOPICS)
export function searchAnalyticsTopic(query) {
  const match = identifySearchService(typeof query === 'string' ? query.slice(0, 500) : '')
  return match && ordinaryCategories.has(match.category) && topics.has(match.service) ? match.service : OTHER_SEARCH_TOPIC
}
export function searchLatencyBucket(durationMs) {
  return !Number.isFinite(durationMs) || durationMs < 0 ? 'unknown' : durationMs <= 200 ? 'fast' : durationMs <= 1000 ? 'normal' : durationMs <= 3000 ? 'slow' : 'very_slow'
}
export function searchAnalyticsTopicLabel(topic, locale = 'bg') {
  if (topic === OTHER_SEARCH_TOPIC || !topics.has(topic)) return locale === 'en' ? 'Other / unspecified service' : 'Друга / неуточнена услуга'
  const entry = SERVICE_LEXICON.find(row => row.service === topic)
  if (locale !== 'en') return topic
  return entry?.aliases.find(alias => /^[a-z][a-z -]+$/i.test(alias)) || categoryById(entry?.category)?.en || 'Other service'
}
