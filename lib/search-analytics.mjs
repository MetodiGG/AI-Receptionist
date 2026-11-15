import { z } from 'zod'
import { SEARCH_ANALYTICS_TOPICS, OTHER_SEARCH_TOPIC } from './search-analytics-vocabulary.mjs'
import { discoveryHeaders, readBoundedJson, sameSiteRequest } from './discovery/http.mjs'

const outcomes = ['results', 'zero', 'error', 'service', 'category', 'business', 'all', 'opened']
const latencies = ['fast', 'normal', 'slow', 'very_slow', 'unknown']
const validDimensions = row => row.event === 'search' ? ['results', 'zero', 'error'].includes(row.outcome)
  : row.latency === 'unknown' && (row.event === 'profile' ? row.outcome === 'opened' : row.event === 'selection' && ['service', 'category', 'business', 'all'].includes(row.outcome))
export const searchMetricSchema = z.object({ event: z.enum(['search', 'selection', 'profile']), topic: z.enum(SEARCH_ANALYTICS_TOPICS),
  locale: z.enum(['bg', 'en']), consent: z.literal(true), outcome: z.enum(outcomes), latency: z.enum(latencies) }).strict().refine(validDimensions)

// Global per-instance abuse bound: no user/IP fingerprint is introduced by
// analytics. Counts are opt-in events, not unique users or an audited census.
export function createSearchMetricLimiter({ now = Date.now, limit = 180, windowMs = 60000 } = {}) {
  let start = now(), used = 0
  return () => { const time = now(); if (time - start >= windowMs) { start = time; used = 0 } return ++used <= limit }
}
export function createDurableSearchMetricLimiter({ allowLocal, consume }) {
  return async () => {
    if (!allowLocal()) return false
    // One anonymous deployment-wide bucket, not a request/user fingerprint.
    const { data, error } = await consume({ input_key: 'search-metrics:global', request_limit: 180, window_seconds: 60 })
    if (error) throw new Error('METRICS_UNAVAILABLE')
    return data === true
  }
}
export function createSearchMetricHandler({ enabled, allowAttempt, write }) {
  const reply = (code, status) => Response.json({ error: { code } }, { status, headers: discoveryHeaders })
  return async request => {
    if (!enabled()) return new Response(null, { status: 204, headers: discoveryHeaders })
    if (!sameSiteRequest(request)) return reply('FORBIDDEN', 403)
    try {
      const input = searchMetricSchema.safeParse(await readBoundedJson(request, 1024))
      if (!input.success) return reply('VALIDATION_ERROR', 422)
      if (!await allowAttempt()) return reply('RATE_LIMITED', 429)
      await write(input.data)
      return new Response(null, { status: 204, headers: discoveryHeaders })
    } catch (error) {
      return reply(error instanceof SyntaxError ? 'VALIDATION_ERROR' : 'METRICS_UNAVAILABLE', error instanceof SyntaxError ? 422 : 503)
    }
  }
}

export function summarizeSearchMetrics(rows) {
  if (!Array.isArray(rows)) throw new Error('INVALID_METRICS')
  const totals = { searches: 0, zeroResults: 0, errors: 0, suggestionSelections: 0, profileOpens: 0 }
  const topics = new Map(), latency = Object.fromEntries(latencies.map(key => [key, 0]))
  for (const row of rows) {
    const count = Number(row.event_count)
    if (!Number.isSafeInteger(count) || count < 0 || !SEARCH_ANALYTICS_TOPICS.includes(row.topic) || !outcomes.includes(row.outcome) || !latencies.includes(row.latency) || !validDimensions(row)) throw new Error('INVALID_METRICS')
    if (row.event === 'search') {
      totals.searches += count; totals.zeroResults += row.outcome === 'zero' ? count : 0; totals.errors += row.outcome === 'error' ? count : 0
      latency[row.latency] += count
      const topic = topics.get(row.topic) || { topic: row.topic, searches: 0, zeroResults: 0, errors: 0 }
      topic.searches += count; topic.zeroResults += row.outcome === 'zero' ? count : 0; topic.errors += row.outcome === 'error' ? count : 0; topics.set(row.topic, topic)
    } else if (row.event === 'selection') totals.suggestionSelections += count
    else if (row.event === 'profile') totals.profileOpens += count
    else throw new Error('INVALID_METRICS')
  }
  return { totals, latency, topics: [...topics.values()].filter(row => row.searches >= 5)
    .sort((a, b) => b.zeroResults - a.zeroResults || b.searches - a.searches || a.topic.localeCompare(b.topic, 'bg')).slice(0, 20), minimumTopicEvents: 5,
    otherTopic: OTHER_SEARCH_TOPIC, retentionDays: 30 }
}

export function createAdminSearchMetricHandler({ authenticate, isAdmin, allowAttempt, enabled, load }) {
  const reply = (value, status = 200) => Response.json(value, { status, headers: discoveryHeaders })
  return async request => {
    try {
      const user = await authenticate(request)
      if (!user?.id || !user.email_confirmed_at || user.is_anonymous) return reply({ error: { code: 'UNAUTHORIZED' } }, 401)
      if (!isAdmin(user)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
      if (!await allowAttempt(request, user.id)) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
      const params = new URL(request.url).searchParams, days = params.get('days') || '30'
      if ([...params.keys()].some(key => key !== 'days') || params.getAll('days').length > 1 || !['7', '30'].includes(days)) return reply({ error: { code: 'VALIDATION_ERROR' } }, 422)
      if (!enabled()) return reply({ enabled: false, days: Number(days), summary: null })
      return reply({ enabled: true, days: Number(days), summary: summarizeSearchMetrics(await load(Number(days))) })
    } catch { return reply({ error: { code: 'METRICS_UNAVAILABLE' } }, 503) }
  }
}
