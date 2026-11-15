'use client'

import { productMeasurementEnabled, productMeasurementConsent } from './product-events-client.js'
import { searchAnalyticsConsent } from './search-analytics-consent.mjs'
import { searchAnalyticsTopic, searchLatencyBucket } from './search-analytics-vocabulary.mjs'

let windowStart = 0, sent = 0
export function trackSearchEvent({ event, query, locale = 'bg', resultCount = 0, durationMs, failed = false, selection } = {}) {
  if (process.env.NEXT_PUBLIC_SEARCH_ANALYTICS_ENABLED !== 'true' || !productMeasurementEnabled || !productMeasurementConsent() || !searchAnalyticsConsent()) return
  if (typeof navigator !== 'undefined' && (navigator.globalPrivacyControl || ['1', 'yes'].includes(navigator.doNotTrack))) return
  if (!['search', 'selection', 'profile'].includes(event)) return
  if (event === 'selection' && !['service', 'category', 'business', 'all'].includes(selection)) return
  const time = Date.now()
  if (time - windowStart >= 60000) { windowStart = time; sent = 0 }
  if (sent >= 30) return
  sent++
  const payload = { event, topic: searchAnalyticsTopic(query), locale: locale === 'en' ? 'en' : 'bg', consent: true,
    outcome: event === 'search' ? failed ? 'error' : resultCount > 0 ? 'results' : 'zero' : event === 'profile' ? 'opened' : selection,
    latency: event === 'search' ? searchLatencyBucket(durationMs) : 'unknown' }
  // No query (including hashes), result/business IDs, URL, GPS, IP, account,
  // session or flow key. Measurement never blocks search or navigation.
  try { void fetch('/api/search-analytics', { method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {}) } catch { /* optional measurement */ }
}
