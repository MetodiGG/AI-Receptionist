import test from 'node:test'
import assert from 'node:assert/strict'

test('search events are optional, consented, privacy-respecting and never send the raw query or a tracking key', async () => {
  const keys = ['NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED', 'NEXT_PUBLIC_SEARCH_ANALYTICS_ENABLED']
  const prior = keys.map(key => process.env[key]), oldFetch = globalThis.fetch, storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage'), navDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const stored = new Map(), sent = []
  for (const key of keys) process.env[key] = 'true'
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) } })
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} })
  globalThis.fetch = (...args) => { sent.push(args); return Promise.resolve(new Response(null, { status: 204 })) }
  try {
    const client = await import('../lib/search-analytics-client.js?unit')
    const consent = await import('../lib/product-events-client.js')
    const searchConsent = await import('../lib/search-analytics-consent.mjs')
    const input = { event: 'search', query: 'manicure for name@example.com +359888123456', locale: 'bg', durationMs: 300, resultCount: 0 }
    client.trackSearchEvent(input); assert.equal(sent.length, 0)
    consent.setProductMeasurementConsent(true)
    client.trackSearchEvent(input); assert.equal(sent.length, 0, 'existing click consent must not authorize a new search purpose')
    searchConsent.setSearchAnalyticsConsent(true)
    client.trackSearchEvent(input)
    assert.equal(sent.length, 1)
    const [path, options] = sent[0], payload = JSON.parse(options.body)
    assert.equal(path, '/api/search-analytics'); assert.equal(options.credentials, 'omit')
    assert.equal(options.referrerPolicy, 'no-referrer')
    assert.deepEqual(payload, { event: 'search', topic: 'маникюр', locale: 'bg', consent: true, outcome: 'zero', latency: 'normal' })
    assert.doesNotMatch(options.body, /@|359|query|flow|businessId|coordinates|session|hash/)
    navigator.globalPrivacyControl = true; client.trackSearchEvent(input); assert.equal(sent.length, 1)
    navigator.globalPrivacyControl = false; navigator.doNotTrack = '1'; client.trackSearchEvent(input); assert.equal(sent.length, 1)
    navigator.doNotTrack = undefined; searchConsent.setSearchAnalyticsConsent(false); client.trackSearchEvent(input); assert.equal(sent.length, 1)
    searchConsent.setSearchAnalyticsConsent(true)
    navigator.doNotTrack = undefined; consent.setProductMeasurementConsent(false); client.trackSearchEvent(input); assert.equal(sent.length, 1)
    consent.setProductMeasurementConsent(true); process.env.NEXT_PUBLIC_SEARCH_ANALYTICS_ENABLED = 'false'; client.trackSearchEvent(input); assert.equal(sent.length, 1)
  } finally {
    globalThis.fetch = oldFetch
    for (const [index, key] of keys.entries()) if (prior[index] === undefined) delete process.env[key]; else process.env[key] = prior[index]
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor); else delete globalThis.localStorage
    if (navDescriptor) Object.defineProperty(globalThis, 'navigator', navDescriptor); else delete globalThis.navigator
  }
})
