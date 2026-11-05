import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { createClient } from '@supabase/supabase-js'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { interpretDiscoveryIntent } from '../lib/discovery/ai-intent.mjs'
import { googlePlaceDetails, googleSearchRequest, GOOGLE_SEARCH_FIELDS, normalizeGooglePlaces, searchGooglePlaces } from '../lib/discovery/google-places.mjs'
import { distanceKm, matchingServices, matchesRequestedTime, normalizeInternalBusinesses, readInternalCandidates, verifyDiscoveryAvailability } from '../lib/discovery/internal-search.mjs'
import { rankDiscoveryResults } from '../lib/discovery/ranking.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createBudgetGuard, logDiscoveryUsage } from '../lib/discovery/budget.mjs'
import { providerJson, readBoundedJson, sameSiteRequest } from '../lib/discovery/http.mjs'

const now = DateTime.fromISO('2026-10-26T12:00:00Z')
const input = patch => discoveryRequestSchema.parse({ query: 'маникюр в София', ...patch })
const parse = patch => parseIntent(input(patch), now)
const config = discoveryConfig({ DISCOVERY_ENABLED: 'true', GOOGLE_PLACES_ENABLED: 'true', GOOGLE_PLACES_REST_USE_APPROVED: 'true', GOOGLE_PLACES_BILLING_REGION: 'NON_EEA', GOOGLE_PLACES_API_KEY: 'fake-server-key' })
const business = patch => ({ id: '10000000-0000-4000-8000-000000000001', slug: 'test-studio', name: 'Test Studio', industry: 'beauty', active: true, platform_status: 'enabled', city_ekatte: '68134', city: 'София', neighborhood: 'Младост 1', address: 'Test address', services: [{ id: 's1', name: 'Маникюр', price: 30, currency: 'EUR', duration_min: 60, active: true }], staff: [], workingHours: [], ...patch })
const rawPlace = patch => ({ id: 'TEST_PLACE_1', displayName: { text: 'External Studio' }, formattedAddress: 'Sofia, Bulgaria', googleMapsUri: 'https://www.google.com/maps/place/test', primaryType: 'nail_salon', businessStatus: 'OPERATIONAL', ...patch })
const request = (body = input(), headers = {}) => new Request('https://www.gorez.co/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })
function deps(patch = {}) {
  const calls = { fetch: [], slots: [], budgets: [] }
  return { calls, now, config, allowAttempt: async () => true,
    claimBudget: async (...args) => { calls.budgets.push(args); return true },
    fetcher: async (url, init) => { calls.fetch.push({ url, init }); return Response.json({ places: [rawPlace()] }) },
    readInternal: async () => [business()], readLinks: async () => [],
    getBusiness: async () => ({ timezone: 'Europe/Sofia', services: [{ id: 's1' }] }),
    getSlots: async args => { calls.slots.push(args); return [{ startsAt: '2026-10-27T15:00:00.000Z', endsAt: '2026-10-27T16:00:00.000Z', staffId: 'person' }] },
    ...patch,
  }
}

test('Bulgarian barber request extracts neighbourhood, tomorrow and after 17 without inventing a result', () => {
  const intent = parse({ query: 'Намери ми добър барбершоп в Младост, София, за утре след 17:00.' })
  assert.equal(intent.category, 'barber'); assert.equal(intent.cityCode, '68134'); assert.equal(intent.neighborhood, 'Младост')
  assert.equal(intent.date, '2026-10-27'); assert.equal(intent.timeFrom, '17:00'); assert.equal(intent.clarification, null)
  assert.deepEqual(intent.requirements, ['quality']); assert.equal(intent.budget, null)
})
test('all requested categories work in Bulgarian and English, not just beauty', () => {
  for (const [query, category] of [['фризьор', 'hair'], ['маникюр', 'nails'], ['козметик', 'beauty'], ['автомивка', 'car_wash'], ['детайлинг', 'detailing'], ['автосервиз', 'auto_repair'], ['личен треньор', 'fitness'], ['уроци', 'education'], ['груминг', 'pets'], ['водопроводчик', 'home_services'], ['консултация', 'consulting'], ['barber', 'barber'], ['car repair', 'auto_repair'], ['pet grooming', 'pets'], ['tutor', 'education']]) {
    assert.equal(parse({ query: `${query} в София` }).category, category, query)
  }
  const en = parse({ query: 'A barber in Sofia tomorrow after 5 pm', locale: 'en' })
  assert.equal(en.city, 'София'); assert.equal(en.timeFrom, '17:00'); assert.equal(en.date, '2026-10-27')
})
test('budget is not a time or decimal date; unknown prices are not called affordable', () => {
  for (const amount of ['30', '30.50', '30,50']) {
    const intent = parse({ query: `Намери ми автомивка в София до ${amount} евро.` })
    assert.equal(intent.category, 'car_wash'); assert.equal(intent.budget.currency, 'EUR'); assert.equal(intent.date, null); assert.equal(intent.timeTo, null)
  }
  const intent = parse({ query: 'маникюр в София до 30 евро' })
  assert.equal(matchingServices(business(), intent).length, 1)
  for (const patch of [{ price: 31 }, { price: null }, { price: 20, currency: 'BGN' }]) assert.equal(matchingServices(business({ services: [{ ...business().services[0], ...patch }] }), intent).length, 0)
})
test('Saturday, after-work assumption and manual location work; missing/ambiguous/invalid requests ask one question', () => {
  const intent = parse({ query: 'Искам да запиша кучето си на груминг в събота.', cityCode: '68134' })
  assert.equal(intent.date, '2026-10-31'); assert.equal(intent.category, 'pets'); assert.equal(intent.clarification, null)
  assert.equal(parse({ query: 'маникюр утре след работа', cityCode: '68134' }).timeFrom, '17:00')
  for (const patch of [{ query: 'фризьор близо до мен' }, { query: 'маникюр в Атлантида' }, { query: 'маникюр в София и Пловдив' }, { query: 'барбершоп и автомивка в София' }, { query: 'маникюр в София на 2026-02-30' }, { query: 'маникюр в София след 17:00' }]) assert.ok(parse(patch).clarification?.field)
  assert.equal(parse({ query: 'фризьор близо до мен', coordinates: { latitude: 42.7, longitude: 23.3, consent: true } }).clarification, null)
})
test('request schema rejects arbitrary provider config, unknown cities, unauthorised/out-of-range coordinates and oversize requests', () => {
  for (const patch of [{ query: '' }, { query: 'x'.repeat(301) }, { cityCode: '00000' }, { radiusKm: 100000 }, { coordinates: { latitude: 42.7, longitude: 23.3 } }, { coordinates: { latitude: 0, longitude: 0, consent: true } }, { apiKey: 'forged' }, { fieldMask: '*' }, { budget: 999 }, { neighborhood: 'Младост' }]) assert.equal(discoveryRequestSchema.safeParse({ query: 'маникюр София', ...patch }).success, false)
})
test('model is skipped for ordinary requests; opt-in structured calls have no tools, credentials, coordinates or Google results in the input', async () => {
  let fetched
  const d = deps({ config: { ...config, aiEnabled: true, aiKey: 'fake-model-key' }, fetcher: async (url, init) => {
    fetched = { url, init }
    return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ category: 'hair', service: 'haircut', city: 'София', neighborhood: null, date: '2026-10-27', timeFrom: '18:00', timeTo: null, budget: { max: 1, currency: 'EUR' }, requirements: [] }) }] }], usage: { input_tokens: 100, output_tokens: 40 } })
  } })
  assert.equal((await interpretDiscoveryIntent(input(), d)).mode, 'rules'); assert.equal(fetched, undefined)
  const result = await interpretDiscoveryIntent(input({ query: 'Неясна услуга в София' }), d)
  assert.equal(result.mode, 'model'); assert.equal(result.intent.category, 'hair'); assert.equal(result.intent.date, null); assert.equal(result.intent.budget, null)
  const body = JSON.parse(fetched.init.body)
  assert.equal(body.text.format.strict, true); assert.equal(body.store, false); assert.equal(body.max_output_tokens, 700); assert.equal(body.tools, undefined)
  assert.doesNotMatch(JSON.stringify(body), /fake-model-key|latitude|TEST_PLACE/)
})
test('model failure, refusal, invalid JSON, wrong schema, quota and invented city all fall back or clarify safely', async () => {
  const ambiguous = input({ query: 'Искам неясна услуга' })
  for (const reply of [{ status: 'incomplete' }, { status: 'completed', output: [] }, { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'no' }] }] }, { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: '{"businesses":["invented"]}' }] }] }]) {
    const result = await interpretDiscoveryIntent(ambiguous, deps({ config: { ...config, aiEnabled: true, aiKey: 'test' }, fetcher: async () => Response.json(reply) }))
    assert.equal(result.mode, 'rules'); assert.ok(result.intent.clarification)
  }
  const denied = deps({ config: { ...config, aiEnabled: true, aiKey: 'test' }, claimBudget: async () => false, fetcher: () => assert.fail('must not call model') })
  assert.equal((await interpretDiscoveryIntent(ambiguous, denied)).mode, 'rules')
})
test('Text and Nearby use allowlisted endpoints, bounded result counts and Pro-only masks, not raw scheduling text', async () => {
  const intent = parse({ query: 'барбершоп в София утре след 17:00' }), d = deps()
  const text = googleSearchRequest(intent, config)
  assert.equal(text.method, 'text'); assert.equal(text.body.pageSize, 12); assert.doesNotMatch(text.body.textQuery, /17:00|утре/)
  const nearby = googleSearchRequest(parse({ query: 'барбершоп', coordinates: { latitude: 42.7, longitude: 23.3, consent: true } }), config)
  assert.equal(nearby.method, 'nearby'); assert.equal(nearby.body.maxResultCount, 12); assert.equal(nearby.body.locationRestriction.circle.radius, 2000)
  await searchGooglePlaces(intent, d)
  assert.equal(d.calls.fetch[0].init.headers['X-Goog-FieldMask'], GOOGLE_SEARCH_FIELDS)
  assert.doesNotMatch(GOOGLE_SEARCH_FIELDS, /rating|review|photo|website|phone|opening|\*/i)
  assert.equal(d.calls.fetch[0].init.cache, 'no-store'); assert.equal(d.calls.fetch[0].init.redirect, 'error')
  assert.equal(d.calls.fetch[0].init.headers['X-Goog-Api-Key'], 'fake-server-key')
})
test('EEA never enables the REST catalogue; UI Kit search receives only IDs, including zero registered businesses', async () => {
  assert.equal(discoveryConfig({ GOOGLE_PLACES_ENABLED: 'true', GOOGLE_PLACES_REST_USE_APPROVED: 'true', GOOGLE_PLACES_BILLING_REGION: 'EEA' }).googleEnabled, false)
  const uiConfig = { ...config, googleEnabled: false, uiKitEnabled: true, browserKey: 'restricted-browser-key' }, d = deps({ config: uiConfig, readInternal: async () => [], fetcher: async (url, init) => {
    d.calls.fetch.push({ url, init }); return Response.json({ places: [{ id: 'PLACE_A' }, { id: 'PLACE_B' }] })
  } })
  const result = await discoverBusinesses(input(), d)
  assert.equal(result.externalStatus, 'ui_kit'); assert.equal(result.results.length, 0); assert.deepEqual(result.external.placeIds, ['PLACE_A', 'PLACE_B'])
  assert.equal(d.calls.fetch[0].init.headers['X-Goog-FieldMask'], 'places.id')
  assert.deepEqual(d.calls.budgets, [['google', 'ids'], ['google', 'ui_list']])
  assert.doesNotMatch(JSON.stringify(result), /fake-server-key|External Studio/)
})
test('EEA location filtering uses only permitted coordinates, bills the correct SKU and removes out-of-radius IDs', async () => {
  const d = deps({ config: { ...config, uiKitEnabled: true, browserKey: 'restricted' }, readInternal: async () => [], fetcher: async (url, init) => {
    d.calls.fetch.push({ url, init }); return Response.json({ places: [{ id: 'NEAR_PLACE', location: { latitude: 42.7, longitude: 23.3 } }, { id: 'FAR_PLACE', location: { latitude: 43.9, longitude: 27.9 } }] })
  } })
  const result = await discoverBusinesses(input({ query: 'маникюр около мен', coordinates: { latitude: 42.7, longitude: 23.3, consent: true } }), d)
  assert.deepEqual(result.external.placeIds, ['NEAR_PLACE'])
  assert.equal(d.calls.fetch[0].init.headers['X-Goog-FieldMask'], 'places.id,places.location')
  assert.deepEqual(d.calls.budgets, [['google', 'nearby'], ['google', 'ui_list']])
  assert.doesNotMatch(JSON.stringify(result.external), /latitude|longitude|FAR_PLACE/)
})
test('a model cannot invent a city, date, time or budget to turn an ambiguous request into results', async () => {
  const d = deps({ config: { ...config, aiEnabled: true, aiKey: 'test' }, readInternal: () => assert.fail('no search on invented intent'), fetcher: async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ category: 'hair', service: 'haircut', city: 'София', neighborhood: null, date: '2026-10-27', timeFrom: '17:00', timeTo: null, budget: { max: 25, currency: 'EUR' }, requirements: [] }) }] }] }) })
  const result = await discoverBusinesses(input({ query: 'Искам нова визия' }), d)
  assert.equal(result.clarification.field, 'city'); assert.equal(result.intent.city, null); assert.equal(result.intent.date, null); assert.equal(result.intent.budget, null)
})
test('no key, disabled provider, network failure, invalid JSON and quota do not invent or remove internal results', async () => {
  for (const [patch, status] of [[{ config: { ...config, googleKey: '' } }, 'not_configured'], [{ config: { ...config, googleEnabled: false } }, 'disabled'], [{ claimBudget: async () => false, fetcher: () => assert.fail('quota must stop fetch') }, 'quota'], [{ fetcher: async () => { throw new Error('private provider error') } }, 'unavailable'], [{ fetcher: async () => new Response('invalid') }, 'unavailable']]) {
    const result = await discoverBusinesses(input(), deps(patch))
    assert.equal(result.externalStatus, status); assert.equal(result.results.length, 1); assert.equal(result.results[0].source, 'gorez')
    assert.doesNotMatch(JSON.stringify(result), /private provider error|fake-server-key/)
  }
})
test('zero, one and several registered businesses combine with actual provider data, within one total cap', async () => {
  for (const count of [0, 1, 8]) {
    const result = await discoverBusinesses(input(), deps({ readInternal: async () => Array.from({ length: count }, (_, index) => business({ id: `test-${index}`, slug: `test-${index}` })) }))
    assert.equal(result.results.filter(row => row.source === 'gorez').length, count); assert.equal(result.results.filter(row => row.source === 'google').length, 1)
    assert.ok(result.results.length <= 12); assert.equal(result.results.at(-1).availability.status, 'unknown')
  }
  const empty = await discoverBusinesses(input(), deps({ readInternal: async () => [], fetcher: async () => Response.json({}) }))
  assert.equal(empty.results.length, 0)
})
test('deduplication uses verified IDs only, never a matching business name; Google ratings remain untouched', () => {
  const intent = parse(), internal = normalizeInternalBusinesses([business()], intent), external = normalizeGooglePlaces({ places: [rawPlace({ displayName: { text: business().name }, rating: 5 })] }, 'nails')
  assert.equal(rankDiscoveryResults(internal, external, intent).length, 2)
  assert.equal(rankDiscoveryResults(internal, external, intent, { links: [{ business_id: internal[0].id, place_id: external[0].placeId }] }).length, 1)
  assert.equal(rankDiscoveryResults(internal, [...external, ...external], intent).length, 2)
  assert.equal(external[0].rating, 5)
})
test('UI Kit IDs are deduplicated before rendering and total external plus internal results are capped', async () => {
  const d = deps({ config: { ...config, uiKitEnabled: true, browserKey: 'restricted' }, readInternal: async () => Array.from({ length: 8 }, (_, index) => business({ id: `b${index}` })),
    readLinks: async () => [{ business_id: 'b0', place_id: 'TEST_PLACE_1' }], fetcher: async () => Response.json({ places: [rawPlace(), ...Array.from({ length: 10 }, (_, i) => ({ id: `OTHER_${i}` }))] }) })
  const result = await discoverBusinesses(input(), d)
  assert.equal(result.results.length, 6); assert.equal(result.external.placeIds.length, 6); assert.equal(result.external.placeIds.includes('TEST_PLACE_1'), false)
})
test('external normalization rejects unsafe/malformed URLs, closed places, and never exposes raw payloads', () => {
  const rows = normalizeGooglePlaces({ places: [rawPlace({ googleMapsUri: 'javascript:alert(1)' }), rawPlace({ googleMapsUri: 'https://evil.example/' }), rawPlace({ businessStatus: 'CLOSED_PERMANENTLY' }), rawPlace({ attributions: [{ provider: 'Provider', providerUri: 'javascript:alert(1)' }], secret: 'private' })] }, 'nails')
  assert.equal(rows.length, 1); assert.equal(rows[0].attributions[0].url, null); assert.equal(rows[0].secret, undefined)
  assert.throws(() => normalizeGooglePlaces({ places: [null] }, 'nails'))
})
test('internal queries enforce publication, industry, city and bounded embedded rows in one request', async () => {
  const requests = [], db = createClient('https://database.example', 'test-key', { auth: { persistSession: false }, global: { fetch: async (url) => { requests.push(new URL(url)); return Response.json([]) } } })
  await readInternalCandidates(db, parse())
  assert.equal(requests.length, 1)
  const params = requests[0].searchParams
  for (const [key, value] of [['active', 'eq.true'], ['platform_status', 'eq.enabled'], ['city_ekatte', 'eq.68134'], ['industry', 'eq.beauty'], ['limit', '100'], ['services.limit', '30']]) assert.equal(params.get(key), value)
  assert.doesNotMatch(params.get('select'), /owner_id|contact_email|customer|appointment|cancellation_token/)
})
test('internal filters handle real service relevance, inactive profiles, neighbourhood groups, card payments and unknown distances', () => {
  const intent = parse({ query: 'маникюр в Младост София с карта' })
  assert.equal(normalizeInternalBusinesses([business({ public_profile: { payments: ['card'] } })], intent).length, 1)
  for (const patch of [{ active: false }, { platform_status: 'pending' }, { neighborhood: 'Център' }, { industry: 'auto' }, { services: [{ ...business().services[0], active: false }] }, { public_profile: { payments: ['cash'] } }]) assert.equal(normalizeInternalBusinesses([business(patch)], intent).length, 0)
  assert.equal(distanceKm({ latitude: 42.7, longitude: 23.3 }, null), null)
  assert.equal(distanceKm({ latitude: 42.7, longitude: 23.3 }, { latitude: 42.7, longitude: 23.3 }), 0)
})
test('only real booking checks mark slots verified; changed, suspended or failed availability is never advertised', async () => {
  const intent = parse({ query: 'маникюр в София утре след 17:00' }), rows = normalizeInternalBusinesses([business()], intent), d = deps()
  const verified = await verifyDiscoveryAvailability(rows, intent, d)
  assert.equal(verified[0].availability.status, 'verified'); assert.equal(verified[0].availability.slots[0].startsAt, '2026-10-27T15:00:00.000Z')
  assert.equal(d.calls.slots[0].date, '2026-10-27')
  const changed = await verifyDiscoveryAvailability(rows, intent, deps({ getSlots: async () => [] }))
  assert.equal(changed[0].availability.status, 'none'); assert.equal(changed[0].availability.slots.length, 0)
  assert.equal((await verifyDiscoveryAvailability(rows, intent, deps({ getSlots: async () => { throw Error('offline') } })))[0].availability.status, 'unknown')
  assert.deepEqual(await verifyDiscoveryAvailability(rows, intent, deps({ getBusiness: async () => null })), [])
  assert.equal(matchesRequestedTime({ startsAt: '2026-10-27T14:45:00Z' }, intent), false)
})
test('availability fan-out is bounded, untested services/partners stay unknown, and no request reserves a slot', async () => {
  const intent = parse({ query: 'маникюр в София утре' }), rows = normalizeInternalBusinesses(Array.from({ length: 12 }, (_, i) => business({ id: `b${i}` })), intent), d = deps()
  const result = await verifyDiscoveryAvailability(rows, intent, d)
  assert.equal(d.calls.slots.length, 4); assert.equal(result.filter(row => row.availability.status === 'unknown').length, 8)
  const booking = await readFile(new URL('../lib/public-booking.js', import.meta.url), 'utf8')
  assert.match(booking, /const slots = await getAvailableSlots/); assert.match(booking, /23P01/)
})
test('public discovery endpoint is anonymous by design but rejects cross-site, malformed, oversized, forged and rate-limited requests', async () => {
  for (const [body, headers, patch, status] of [[input(), { origin: 'https://evil.example' }, {}, 403], [input(), { 'sec-fetch-site': 'cross-site' }, {}, 403], ['{', {}, {}, 422], ['x'.repeat(5000), {}, {}, 422], [{ ...input(), apiKey: 'forged' }, {}, {}, 422], [input(), {}, { allowAttempt: async () => false }, 429], [input(), {}, { config: { ...config, enabled: false } }, 404]]) {
    const d = deps({ ...patch, readInternal: () => assert.fail('must not query'), fetcher: () => assert.fail('must not bill') })
    const response = await createDiscoveryHandler(d)(request(body, headers)); assert.equal(response.status, status); assert.match(response.headers.get('cache-control'), /no-store/)
  }
  const response = await createDiscoveryHandler(deps())(request())
  assert.equal(response.status, 200); assert.doesNotMatch(JSON.stringify(await response.json()), /fake-server-key|owner_id/)
})
test('ambiguity and invalid locations cause no paid calls or catalogue scans; unavailable limiter fails closed', async () => {
  const d = deps({ readInternal: () => assert.fail(), fetcher: () => assert.fail() })
  const response = await createDiscoveryHandler(d)(request(input({ query: 'маникюр в Атлантида' })))
  assert.equal(response.status, 200); assert.equal((await response.json()).clarification.field, 'city'); assert.equal(d.calls.budgets.length, 0)
  const failed = await createDiscoveryHandler(deps({ allowAttempt: async () => { throw Error('private error') } }))(request())
  assert.equal(failed.status, 503); assert.doesNotMatch(JSON.stringify(await failed.json()), /private/)
})
test('budget guard atomically reserves persisted counters and never allows a missing/failing migration', async () => {
  const args = [], guard = createBudgetGuard({ rpc: async (...input) => { args.push(input); return { data: true } } }, config)
  assert.equal(await guard('google', 'text'), true); assert.equal(args[0][0], 'claim_discovery_budget'); assert.equal(args[0][1].p_cost_microusd, 32000)
  for (const result of [{ data: null, error: Error('missing migration') }, { data: false }, { data: 'true' }]) assert.equal(await createBudgetGuard({ rpc: async () => result }, config)('google', 'text'), false)
  assert.equal(await guard('google', 'forged'), false)
})
test('production configuration cannot enable mock results, unsafe defaults or unbounded paid usage', () => {
  assert.equal(discoveryConfig({ NODE_ENV: 'production', DISCOVERY_DEV_MOCK: 'true' }).devMock, false)
  assert.equal(discoveryConfig({ VERCEL_ENV: 'preview', DISCOVERY_DEV_MOCK: 'true' }).devMock, false)
  assert.equal(discoveryConfig({ DISCOVERY_GOOGLE_DAILY_LIMIT: 'garbage' }).google.daily, 0)
  assert.equal(discoveryConfig({ DISCOVERY_GOOGLE_MONTHLY_MICROUSD: '9999999999' }).google.monthlyCost, 0)
  assert.equal(discoveryConfig({}).enabled, false); assert.equal(discoveryConfig({}).googleEnabled, false); assert.equal(discoveryConfig({}).aiEnabled, false)
})
test('provider errors and stalled/oversized bodies are bounded; detailed enrichment is optional and never automatic', async () => {
  for (const fetcher of [async () => new Response('error', { status: 500 }), async () => new Response('x'.repeat(100)), () => new Promise(() => {})]) await assert.rejects(providerJson('https://fixed.example', {}, { fetcher, timeoutMs: 10, maxBytes: 20 }))
  assert.equal(await googlePlaceDetails('PLACE_TEST', deps({ config: { ...config, detailsEnabled: false }, fetcher: () => assert.fail() })), null)
})
test('privacy-safe usage logs whitelist metrics and exclude raw queries/coordinates/secrets', () => {
  const lines = [], old = console.info; console.info = line => lines.push(line)
  try { logDiscoveryUsage({ provider: 'google', method: 'text', status: 'ok', query: 'private query', latitude: 42.7, apiKey: 'secret', inputTokens: 12 }) } finally { console.info = old }
  assert.equal(lines.length, 1); assert.doesNotMatch(lines[0], /private query|latitude|secret/); assert.match(lines[0], /inputTokens/)
})

test('request bodies cannot hang indefinitely, and loopback aliasing is development-only', async () => {
  const stalled = new Request('https://www.gorez.co/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: new ReadableStream({}), duplex: 'half' })
  await assert.rejects(readBoundedJson(stalled, 4096, 10), SyntaxError)
  const local = new Request('http://localhost:3005/dev/discovery/search', { headers: { origin: 'http://127.0.0.1:3005', 'sec-fetch-site': 'same-origin' } })
  assert.equal(sameSiteRequest(local), false); assert.equal(sameSiteRequest(local, { development: true }), true)
  assert.equal(sameSiteRequest(new Request('https://www.gorez.co/api', { headers: { origin: 'http://127.0.0.1:3005' } }), { development: true }), false)
})
test('explicit service requirements do not quietly return a different service in the same broad industry', () => {
  const intent = parse({ query: 'електротехник в София' })
  const services = [{ id: 'plumbing', name: 'Водопроводни ремонти', active: true, price: 20, duration_min: 60 }, { id: 'electric', name: 'Електрически ремонти', active: true, price: 30, duration_min: 60 }]
  assert.deepEqual(matchingServices(business({ industry: 'home_services', services }), intent).map(row => row.id), ['electric'])
  assert.equal(parse({ query: 'маникюр в София утре след 25:00' }).clarification.field, 'time')
})
test('frontend submits explicitly, keeps browser coordinates out of storage and URLs, labels mobile button and guards all dev fixtures', async () => {
  const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  const ui = await read('components/discovery-search.js'), widget = await read('components/google-discovery-list.js')
  assert.match(ui, /onSubmit=\{submit\}/); assert.match(ui, /aria-label=\{loading \? copy.searching : copy.search\}/)
  assert.doesNotMatch(ui, /localStorage|sessionStorage|searchParams\.set|watchPosition|trackProductEvent/)
  assert.match(ui, /locationProvider = requestDiscoveryLocation/); assert.match(ui, /locationProvider\(navigator.geolocation/); assert.match(ui, /copy.locationDenied/)
  assert.match(widget, /gmp-advanced-place-list/); assert.match(widget, /gmp-place-attribution/); assert.match(widget, /open-map/)
  const loader = await read('lib/discovery/google-ui-loader.mjs')
  assert.match(widget, /import \{ loadPlacesLibrary \} from/)
  assert.match(loader, /v: 'weekly'/); assert.doesNotMatch(loader, /v: '(?:alpha|beta)'/)
  assert.match(widget, /document.createElement\('gmp-place-media'\)/)
  assert.doesNotMatch(widget, /fetchFields|new .*\.Map|gmp-place-reviews|innerHTML|\.rating|\.displayName|fetch\(|getURI|photoUri/)
  assert.match(await read('app/dev/discovery/page.js'), /\.devMock\) notFound/)
  assert.match(await read('app/dev/discovery/search/route.js'), /\.devMock\) return new Response\(null, \{ status: 404/)
  const admin = await read('app/api/admin/businesses/[id]/discovery/route.js')
  assert.match(admin, /requireUser\(request\)/); assert.match(admin, /!isPlatformAdmin\(user\)/); assert.match(admin, /identityChecked: z.literal\(true\)/)
})
