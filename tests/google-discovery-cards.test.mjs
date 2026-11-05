import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { discoveryConfig, PROVIDER_COST_MICROUSD } from '../lib/discovery/config.mjs'
import { googleCardVariantEnabled, signGoogleCardTicket, verifyGoogleCardTicket } from '../lib/discovery/google-card-ticket.mjs'
import { createGoogleCardGrantHandler } from '../lib/discovery/google-card-grant.mjs'
import { createGoogleCardWidget } from '../lib/discovery/google-card-widget.mjs'
import { discoveryDistanceOrigin, distanceBadge, widgetBusinessPoint } from '../lib/discovery/distance-origin.mjs'
import { CITY_REFERENCE_DATA } from '../lib/discovery/city-reference-points.mjs'
import { BULGARIAN_CITIES } from '../lib/bulgarian-cities.mjs'
import { estimateGoogleCardCosts } from '../lib/discovery/google-card-costs.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { createBudgetGuard } from '../lib/discovery/budget.mjs'

const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8')
const now = Date.parse('2026-11-05T12:00:00Z'), placeId = 'QA_FICTIONAL_GOOGLE_PLACE'
const config = { ...discoveryConfig({ DISCOVERY_PROVIDER_MODE: 'google' }), enabled: true, uiKitEnabled: true, googleCardsEnabled: true, googleCardSecret: 'local-only-fake-signing-value-32-characters', browserKey: 'fake-restricted-browser-key', googleKey: 'fake-server-key', searchV2Enabled: true }
const ticket = () => signGoogleCardTicket(placeId, 'bg', config, now)
const request = (body = { ticket: ticket(), purpose: 'card' }, headers = {}) => new Request('https://www.gorez.co/api/public/discovery/google-card', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://www.gorez.co', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })
function harness(patch = {}) {
  const calls = [], handler = createGoogleCardGrantHandler({ config, now: () => now, allowAttempt: async () => { calls.push('limit'); return true }, claimBudget: async (...args) => { calls.push(args); return true }, ...patch })
  return { calls, run: (req = request()) => handler(req) }
}

test('individual Google cards are a separate OFF-by-default option and never weaken the EEA REST gate', async () => {
  assert.equal(discoveryConfig({}).googleCardsEnabled, false)
  for (const patch of [{ enabled: false }, { uiKitEnabled: false }, { googleCardsEnabled: false }, { browserKey: '' }, { googleCardSecret: '' }, { googleCardSecret: 'short' }, { devMock: true }]) {
    const h = harness({ config: { ...config, ...patch } })
    assert.equal(googleCardVariantEnabled({ ...config, ...patch }), false)
    assert.equal((await h.run()).status, 404); assert.deepEqual(h.calls, [])
  }
  assert.equal(discoveryConfig({ GOOGLE_DISCOVERY_CARDS_ENABLED: 'true', GOOGLE_PLACES_BILLING_REGION: 'EEA', GOOGLE_PLACES_ENABLED: 'true', GOOGLE_PLACES_REST_USE_APPROVED: 'true' }).googleEnabled, false)
})
test('search permits bind the exact Place ID, locale, environment and ten-minute lifetime', () => {
  const value = ticket()
  assert.deepEqual(verifyGoogleCardTicket(value, config, now), { placeId, locale: 'bg' })
  assert.equal(verifyGoogleCardTicket(value, { ...config, environment: 'production' }, now), null)
  assert.equal(verifyGoogleCardTicket(value, { ...config, googleCardSecret: 'a'.repeat(32) }, now), null)
  assert.equal(verifyGoogleCardTicket(value, config, now + 600000), null)
  assert.equal(verifyGoogleCardTicket(value, config, now - 20000), null)
  const decoded = JSON.parse(Buffer.from(value.split('.')[0], 'base64url').toString())
  assert.equal(decoded.placeId, placeId); assert.equal(decoded.locale, 'bg'); assert.equal(decoded.expires - decoded.issued, 600)
  assert.doesNotMatch(JSON.stringify(decoded), /latitude|longitude|query|browserKey|Secret|name|phone/)
  for (const bad of ['x'.repeat(1201), value + 'x', `eyJwbGFjZUlkIjoiZm9yZ2VkIn0.${value.split('.')[1]}`, null]) assert.equal(verifyGoogleCardTicket(bad, config, now), null)
  assert.throws(() => signGoogleCardTicket('../bad', 'bg', config, now))
})
test('cross-origin, unsigned, forged, expired and schema-injected grants never touch the budget', async () => {
  const h = harness()
  for (const headers of [{ Origin: 'https://evil.example' }, { 'sec-fetch-site': 'cross-site' }, { 'sec-fetch-site': 'none' }]) assert.equal((await h.run(request(undefined, headers))).status, 403)
  for (const body of [{ ticket: 'forged', purpose: 'card' }, { ticket: signGoogleCardTicket(placeId, 'en', config, now - 601000), purpose: 'card' }]) assert.equal((await h.run(request(body))).status, 403)
  for (const patch of [{ purpose: 'details' }, { placeId: 'INJECTED_PLACE' }, { browserKey: 'injected' }, { fieldMask: '*' }, { cost: 0 }, { dailyLimit: 999999 }, { locale: 'de' }]) assert.equal((await h.run(request({ ticket: ticket(), purpose: 'card', ...patch }))).status, 422)
  for (const bad of ['{', 'x'.repeat(1601)]) assert.equal((await h.run(request(bad))).status, 422)
  assert.deepEqual(h.calls, [])
})
test('every card and contact panel reserves its own Pro event including a deliberate replay/remount', async () => {
  const h = harness(), permit = ticket()
  for (const purpose of ['card', 'contacts', 'card']) {
    const response = await h.run(request({ ticket: permit, purpose }))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { plan: { mode: purpose === 'card' ? 'ui_kit_card' : 'ui_kit_contacts', placeId, locale: 'bg', browserKey: config.browserKey } })
    assert.match(response.headers.get('cache-control'), /private, no-store/)
  }
  assert.deepEqual(h.calls, ['limit', ['google', 'ui_card'], 'limit', ['google', 'ui_contacts'], 'limit', ['google', 'ui_card']])
  assert.equal(PROVIDER_COST_MICROUSD.ui_card, 5000); assert.equal(PROVIDER_COST_MICROUSD.ui_contacts, 5000)
})
test('rate, quota and database failures fail closed without provider requests or disclosing secrets', async () => {
  assert.equal((await harness({ allowAttempt: async () => false }).run()).status, 429)
  assert.equal((await harness({ claimBudget: async () => false }).run()).status, 429)
  const response = await harness({ claimBudget: async () => { throw Error('PRIVATE_SECRET_DATA') } }).run()
  assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /PRIVATE|fake-|32-character/)
})
test('new grant methods retain the existing shared durable counts, cost caps and environment', async () => {
  const calls = [], guard = createBudgetGuard({ rpc: async (...args) => { calls.push(args); return { data: true } } }, { ...config, environment: 'preview' })
  await guard('google', 'ui_card'); await guard('google', 'ui_contacts')
  assert.equal(calls.length, 2)
  for (const [, args] of calls) { assert.equal(args.p_environment, 'preview'); assert.equal(args.p_cost_microusd, 5000); assert.equal(args.p_daily_limit, config.google.daily); assert.equal(args.p_monthly_limit, config.google.monthly); assert.equal(args.p_monthly_cost_limit, config.google.monthlyCost) }
})
test('all registered city centres have a sourced exact EKATTE match without runtime geocoding', () => {
  assert.equal(Object.keys(CITY_REFERENCE_DATA.cities).length, BULGARIAN_CITIES.length)
  assert.deepEqual(CITY_REFERENCE_DATA.unresolved, [])
  for (const city of BULGARIAN_CITIES) { const point = CITY_REFERENCE_DATA.cities[city.code]; assert.equal(point.name, city.name); assert.match(point.source, /^https:\/\/www.wikidata.org\/wiki\/Q\d+$/); assert.ok(point.latitude >= 41 && point.latitude <= 44.5); assert.ok(point.longitude >= 22 && point.longitude <= 29) }
  assert.equal(discoveryDistanceOrigin({ cityCode: 'not-a-city' }), null)
})
test('device consent and city-centre references are explicit, disjoint display origins', () => {
  const coordinates = { latitude: 42.66, longitude: 23.28, consent: true }
  const device = discoveryDistanceOrigin({ coordinates, cityCode: '68134' }), centre = discoveryDistanceOrigin({ cityCode: '68134' })
  assert.deepEqual(device, { kind: 'device', latitude: 42.66, longitude: 23.28 })
  assert.equal(centre.kind, 'city_center'); assert.notEqual(centre.latitude, device.latitude); assert.equal(centre.cityCode, '68134')
  assert.deepEqual(discoveryDistanceOrigin({ coordinates: { ...coordinates, consent: false }, cityCode: '68134' }), centre)
  assert.deepEqual(discoveryDistanceOrigin({ coordinates: { latitude: null, longitude: null, consent: true }, cityCode: '68134' }), centre)
  assert.equal(distanceBadge(centre, coordinates).suffix, 'от центъра')
  assert.equal(distanceBadge(centre, coordinates, 'en').suffix, 'from centre')
  assert.equal(distanceBadge(device, coordinates).suffix, '')
  assert.equal(distanceBadge(centre, null), null); assert.equal(distanceBadge(null, coordinates), null)
  assert.equal(distanceBadge({ ...centre, latitude: null }, coordinates), null)
})
test('distance uses only the documented exact-ID widget point, never a positional list overlay', () => {
  const widget = { place: { id: placeId, location: { lat: () => 42.66, lng: () => 23.28 } } }
  assert.deepEqual(widgetBusinessPoint(widget, placeId), { latitude: 42.66, longitude: 23.28 })
  assert.equal(widgetBusinessPoint(widget, 'OTHER_PLACE'), null)
  assert.equal(widgetBusinessPoint({ place: { id: placeId, location: { lat: null, lng: null } } }, placeId), null)
  assert.equal(widgetBusinessPoint(null, placeId), null)
})
test('native card and contact builders preserve Google content/attribution and never extract names or contacts', () => {
  const document = { createElement: tag => ({ tag, attributes: {}, children: [], setAttribute(key, value) { this.attributes[key] = value }, append(...nodes) { this.children.push(...nodes) } }) }
  const card = createGoogleCardWidget(document, { mode: 'ui_kit_card', placeId }, { nearby: true })
  assert.equal(card.tag, 'gmp-advanced-place-details-compact')
  assert.deepEqual(card.children.map(node => node.tag), ['gmp-place-details-place-request', 'gmp-place-media', 'gmp-place-name', 'gmp-place-type', 'gmp-place-rating', 'gmp-place-attribution'])
  assert.equal(card.children[0].attributes.place, `places/${placeId}`)
  assert.equal(card.children.at(-1).attributes['light-scheme-color'], 'black')
  assert.ok(createGoogleCardWidget(document, { mode: 'ui_kit_card', placeId }).children.some(node => node.tag === 'gmp-place-address'))
  const contact = createGoogleCardWidget(document, { mode: 'ui_kit_contacts', placeId })
  assert.equal(contact.tag, 'gmp-advanced-place-details')
  assert.deepEqual(contact.children.filter(node => node.tag === 'gmp-place-link').map(node => node.attributes.action), ['open-website', 'call'])
  assert.throws(() => createGoogleCardWidget(document, { mode: 'rest', placeId }))
})
test('variant search issues bounded signed IDs but no prepaid list grant, names, ratings or server key', async () => {
  const calls = [], id = '11111111-1111-4111-8111-111111111111'
  const d = { config, claimBudget: async (...args) => { calls.push(args); return true }, readInternal: async () => [], readLinks: async () => [], readBookablePlaces: async () => [{ id, place_id: placeId, booking_url: 'https://example.com/book', verification_status: 'approved', verified_by: 'admin', verified_at: new Date().toISOString(), last_checked_at: new Date().toISOString() }], fetcher: async (_url, options) => { assert.equal(options.headers['X-Goog-FieldMask'], 'places.id'); return Response.json({ places: [{ id: placeId }] }) } }
  const result = await discoverBusinesses({ query: '', browse: true, cityCode: '68134', locale: 'bg' }, d)
  assert.deepEqual(calls, [['google', 'ids']]); assert.equal(result.external.mode, 'ui_kit_cards')
  assert.equal(result.external.cards.length, 1); assert.equal(result.external.cards[0].bookingLinkId, id)
  assert.deepEqual(verifyGoogleCardTicket(result.external.cards[0].ticket, config), { placeId, locale: 'bg' })
  assert.doesNotMatch(JSON.stringify(result.external), /fake-server-key|fake-restricted|latitude|longitude|booking_url|example.com|rating|name/)
})
test('UI Kit cost estimate distinguishes visits from visible widgets and independent per-SKU allowances', () => {
  assert.equal(estimateGoogleCardCosts({ visibleCards: 300, contactOpens: 100, nearbySearches: 100 }).totalUsd, 0)
  assert.equal(estimateGoogleCardCosts({ visibleCards: 9000, nearbySearches: 3000 }).totalUsd, 20)
  assert.equal(estimateGoogleCardCosts({ visibleCards: 9000, contactOpens: 3000, nearbySearches: 3000 }).totalUsd, 35)
  assert.equal(estimateGoogleCardCosts({ nearbySearches: 5001, textProSearches: 5001 }).totalUsd, .064)
  assert.equal(estimateGoogleCardCosts({ visibleCards: 1000, prior: { uiKitPro: 5000 } }).totalUsd, 5)
  assert.equal(estimateGoogleCardCosts({ visibleCards: 1000, prior: { uiKitPro: 100000 } }).totalUsd, 4)
  assert.equal(estimateGoogleCardCosts({ idsOnlySearches: 1000000 }).totalUsd, 0)
  for (const bad of [-1, '100', 1.5, Infinity, NaN]) assert.throws(() => estimateGoogleCardCosts({ visibleCards: bad }))
})
test('clients load only intersecting cards, separately budget contact opens, avoid reusing a stale grant and retain modal keyboard semantics', async () => {
  const client = await read('components/google-business-card.js'), builder = await read('lib/discovery/google-card-widget.mjs'), origin = await read('lib/discovery/distance-origin.mjs')
  assert.match(client, /rootMargin: '0px', threshold: .01/); assert.match(client, /started \|\| !active/)
  assert.match(client, /setTimeout\(async/); assert.match(client, /cache: 'no-store'/)
  assert.match(client, /purpose: 'contacts'/); assert.match(client, /mode !== mode \|\| plan.placeId !== card.placeId/)
  assert.match(client, /event.target !== widget/); assert.match(client, /abort.abort\(\)/)
  assert.match(client, /node\?\.showModal\(\)/); assert.match(client, /onCancel=/); assert.match(client, /focused.focus\(\)/)
  assert.doesNotMatch(client + builder + origin, /shadowRoot|\.fetchFields\s*\(|\.rating\b|\.websiteURI|\.nationalPhone|innerHTML|localStorage|sessionStorage/)
  const source = await read('app/api/public/discovery/google-card/route.js')
  assert.match(source, /import 'server-only'/); assert.doesNotMatch(source, /fetch\(|GOOGLE_PLACES_API_KEY|OPENAI/)
  const preview = await read('app/dev/google-cards/page.js'), fixtures = await read('components/google-card-local-preview.js')
  assert.match(preview, /NODE_ENV !== 'development'\) notFound\(\)/)
  assert.match(preview, /ОФЛАЙН ДЕМО/); assert.doesNotMatch(fixtures, /fetch\(|navigator.geolocation|loadPlacesLibrary\(|<GoogleBusinessCard /)
})
