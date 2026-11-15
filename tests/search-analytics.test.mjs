import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createSearchMetricHandler, createSearchMetricLimiter, createDurableSearchMetricLimiter, createAdminSearchMetricHandler, searchMetricSchema, summarizeSearchMetrics } from '../lib/search-analytics.mjs'
import { searchAnalyticsTopic, searchLatencyBucket, SEARCH_ANALYTICS_TOPICS } from '../lib/search-analytics-vocabulary.mjs'

const metric = { event: 'search', topic: 'маникюр', locale: 'bg', consent: true, outcome: 'zero', latency: 'normal' }
const request = (body = metric, extra = {}) => new Request('https://gorez.test/api/search-analytics', { method: 'POST', headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) })
test('measurement vocabulary is closed and never records raw, hashed, sensitive or identifying search text', () => {
  assert.equal(searchAnalyticsTopic('manicure'), 'маникюр')
  for (const query of ['невролог Иван +359888123456', 'психолог за тревожност', 'адвокат развод', 'София ул. Пирин 83', 'name@example.com', 'a secret unknown phrase']) {
    assert.equal(searchAnalyticsTopic(query), '__other__')
    assert.equal(SEARCH_ANALYTICS_TOPICS.includes(query), false)
  }
  for (const field of ['query', 'queryHash', 'coordinates', 'businessId', 'sessionId', 'ip', 'url']) assert.equal(searchMetricSchema.safeParse({ ...metric, [field]: 'private' }).success, false)
  assert.equal(searchMetricSchema.safeParse({ ...metric, topic: "');drop table businesses;--" }).success, false)
  assert.equal(searchMetricSchema.safeParse({ ...metric, consent: false }).success, false)
  assert.equal(searchMetricSchema.safeParse({ ...metric, event: 'profile' }).success, false)
})
test('latency is a small closed bucket with exact boundary handling, not a timing trace', () => {
  assert.deepEqual([undefined, -1, 0, 200, 201, 1000, 1001, 3000, 3001].map(searchLatencyBucket),
    ['unknown', 'unknown', 'fast', 'fast', 'normal', 'normal', 'slow', 'slow', 'very_slow'])
})
test('disabled metrics touch neither a limiter, a database nor the request body', async () => {
  const handler = createSearchMetricHandler({ enabled: () => false, allowAttempt: () => assert.fail(), write: () => assert.fail() })
  assert.equal((await handler(request())).status, 204)
})
test('metrics validate origin, exact schema, payload length, consent and rate allowance before writing', async () => {
  const writes = [], handler = createSearchMetricHandler({ enabled: () => true, allowAttempt: () => true, write: row => writes.push(row) })
  assert.equal((await handler(request(metric, { Origin: 'https://elsewhere.test' }))).status, 403)
  assert.equal((await handler(request(metric, { 'Sec-Fetch-Site': 'cross-site' }))).status, 403)
  assert.equal((await handler(request({ ...metric, query: 'private' }))).status, 422)
  assert.equal((await handler(request({ ...metric, topic: 'x'.repeat(2000) }))).status, 422)
  assert.equal((await handler(request(metric, { 'Content-Type': 'text/plain' }))).status, 422)
  assert.equal(writes.length, 0)
  const good = await handler(request())
  assert.equal(good.status, 204); assert.match(good.headers.get('Cache-Control'), /no-store/)
  assert.deepEqual(writes, [metric])
  const denied = createSearchMetricHandler({ enabled: () => true, allowAttempt: () => false, write: () => assert.fail() })
  assert.equal((await denied(request())).status, 429)
})
test('metrics errors do not reveal internals and the global limiter needs no IP or account key', async () => {
  const handler = createSearchMetricHandler({ enabled: () => true, allowAttempt: () => true, write: () => { throw Error('private SQL data') } })
  assert.deepEqual(await (await handler(request())).json(), { error: { code: 'METRICS_UNAVAILABLE' } })
  let time = 0
  const limit = createSearchMetricLimiter({ now: () => time, limit: 2, windowMs: 1000 })
  assert.equal(limit(), true); assert.equal(limit(), true); assert.equal(limit(), false)
  time = 1000; assert.equal(limit(), true)
})
const user = { id: 'test-admin', email_confirmed_at: '2026-11-14' }
test('aggregate measurement also has a durable global bound without IP or account fingerprinting', async () => {
  let calls=0
  const consume=async payload=>{calls++;assert.deepEqual(payload,{input_key:'search-metrics:global',request_limit:180,window_seconds:60});return {data:calls===1}}
  const limited=createDurableSearchMetricLimiter({allowLocal:()=>true,consume})
  assert.equal(await limited(),true);assert.equal(await limited(),false)
  const localDenied=createDurableSearchMetricLimiter({allowLocal:()=>false,consume:()=>assert.fail()})
  assert.equal(await localDenied(),false)
  const failed=createDurableSearchMetricLimiter({allowLocal:()=>true,consume:async()=>({error:{message:'private DB details'}})})
  await assert.rejects(failed,/METRICS_UNAVAILABLE/)
})
test('retention remains scheduled after collection is disabled and preferences require a fresh search purpose', async () => {
  const cron=await readFile(new URL('../app/api/cron/notifications/route.js',import.meta.url),'utf8')
  assert.match(cron,/rpc\('prune_search_metrics'\)/)
  assert.doesNotMatch(cron,/SEARCH_ANALYTICS_ENABLED/)
  const preferences=await readFile(new URL('../components/product-measurement.js',import.meta.url),'utf8')
  assert.match(preferences,/if\(searchEnabled\)setSearchAnalyticsConsent\(true\)/)
  assert.match(preferences,/setSearchAnalyticsConsent\(false\)/)
  assert.match(preferences,/this new purpose/)
})
const adminRequest = path => new Request(`https://gorez.test/api/admin/search-analytics${path || ''}`)
const dependencies = { authenticate: async () => user, isAdmin: () => true, allowAttempt: () => true, enabled: () => true, load: async () => [] }
test('aggregate search reports require a confirmed administrator before any read', async () => {
  for (const [change, expected] of [[{ authenticate: async () => null }, 401], [{ authenticate: async () => ({ ...user, email_confirmed_at: null }) }, 401], [{ isAdmin: () => false }, 403], [{ allowAttempt: () => false }, 429]]) {
    const handler = createAdminSearchMetricHandler({ ...dependencies, ...change, load: () => assert.fail() })
    assert.equal((await handler(adminRequest())).status, expected)
  }
})
test('disabled reports are honest, errors never become invented zero activity, and periods are bounded', async () => {
  const disabled = createAdminSearchMetricHandler({ ...dependencies, enabled: () => false, load: () => assert.fail() })
  assert.deepEqual(await (await disabled(adminRequest())).json(), { enabled: false, days: 30, summary: null })
  for (const path of ['?days=365', '?days=7&days=30', '?query=secret']) assert.equal((await disabled(adminRequest(path))).status, 422)
  const failed = createAdminSearchMetricHandler({ ...dependencies, load: () => { throw Error('private database') } })
  const response = await failed(adminRequest())
  assert.equal(response.status, 503); assert.match(response.headers.get('Cache-Control'), /no-store/)
  assert.deepEqual(await response.json(), { error: { code: 'METRICS_UNAVAILABLE' } })
})
test('reports expose only totals and common topics with at least five events, never individual rows or identities', () => {
  const row = (topic, outcome, count, event = 'search') => ({ topic, outcome, event_count: count, event, latency: 'unknown', private_user: 'must-not-forward' })
  const result = summarizeSearchMetrics([row('маникюр', 'zero', 6), row('подстригване', 'results', 4), row('маникюр', 'business', 2, 'selection'), row('__other__', 'opened', 1, 'profile')])
  assert.deepEqual(result.totals, { searches: 10, zeroResults: 6, errors: 0, suggestionSelections: 2, profileOpens: 1 })
  assert.deepEqual(result.topics, [{ topic: 'маникюр', searches: 6, zeroResults: 6, errors: 0 }])
  assert.doesNotMatch(JSON.stringify(result), /private_user|must-not-forward/)
  assert.throws(() => summarizeSearchMetrics([row('private search text', 'zero', 9)]), /INVALID_METRICS/)
  assert.throws(() => summarizeSearchMetrics([row('маникюр', 'business', 9)]), /INVALID_METRICS/)
  assert.throws(() => summarizeSearchMetrics([row('маникюр', 'zero', 9, 'profile')]), /INVALID_METRICS/)
})
