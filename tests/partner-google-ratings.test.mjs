import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createPartnerRatingHandler, verifiedPartnerPlaceLink } from '../lib/discovery/partner-ratings.mjs'
import { createPartnerRatingWidget } from '../lib/discovery/partner-rating-widget.mjs'
import { discoveryConfig, PROVIDER_COST_MICROUSD } from '../lib/discovery/config.mjs'
import { createBudgetGuard } from '../lib/discovery/budget.mjs'

const businessId = '10000000-0000-4000-8000-000000000001', actor = '20000000-0000-4000-8000-000000000001'
const link = { business_id: businessId, place_id: 'OFFLINE_VERIFIED_PLACE', verified_by: actor, verified_at: '2026-11-05T10:00:00Z' }
const config = { ...discoveryConfig({}), enabled: true, uiKitEnabled: true, partnerRatingsEnabled: true, browserKey: 'fake-restricted-browser-key' }
const request = (body = { locale: 'bg' }, headers = {}) => new Request('https://www.gorez.co/api/public/test-business/google-rating', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://www.gorez.co', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
function harness(overrides = {}) {
  const calls = []
  const handler = createPartnerRatingHandler({ config, allowAttempt: async () => { calls.push(['limit']); return true }, readBusiness: async slug => { calls.push(['business', slug]); return { id: businessId, active: true, platform_status: 'enabled' } }, readLink: async id => { calls.push(['link', id]); return link }, claimBudget: async (...args) => { calls.push(['budget', ...args]); return true }, ...overrides })
  return { calls, run: (req = request(), slug = 'test-business') => handler(req, slug) }
}

test('partner Google ratings are a separate disabled-by-default opt-in, not an implicit part of discovery enablement', async () => {
  assert.equal(discoveryConfig({ DISCOVERY_ENABLED: 'true', GOOGLE_PLACES_UI_KIT_ENABLED: 'true', GOOGLE_PLACES_UI_KIT_APPROVED: 'true' }).partnerRatingsEnabled, false)
  assert.equal(discoveryConfig({ GOOGLE_PARTNER_RATINGS_ENABLED: 'true' }).partnerRatingsEnabled, true)
  for (const patch of [{ enabled: false }, { uiKitEnabled: false }, { partnerRatingsEnabled: false }, { browserKey: '' }, { devMock: true }]) {
    const h = harness({ config: { ...config, ...patch } })
    assert.deepEqual(await (await h.run()).json(), { plan: null }); assert.equal(h.calls.length, 0)
  }
})

test('the public grant accepts only a slug and locale, never client-selected Place IDs, keys, ratings or billing', async () => {
  const h = harness()
  for (const [req, slug, status] of [[request(), '../private', 404], [request(), 'a'.repeat(65), 404], [request({ locale: 'bg', placeId: 'FORGED_PLACE' }), 'test-business', 422], [request({ locale: 'bg', browserKey: 'FORGED' }), 'test-business', 422], [request({ locale: 'bg', rating: 5 }), 'test-business', 422], [request({ locale: 'bg', monthlyLimit: 99999 }), 'test-business', 422], [request({ locale: 'de' }), 'test-business', 422], [request('{bad'), 'test-business', 422], [request('x'.repeat(257)), 'test-business', 422], [request({ locale: 'bg' }, { 'Content-Type': 'text/plain' }), 'test-business', 422]]) assert.equal((await h.run(req, slug)).status, status)
  assert.equal(h.calls.length, 0)
})

test('cross-origin and cross-site grants cannot consume the rating budget', async () => {
  const h = harness()
  for (const headers of [{ Origin: 'https://attacker.example' }, { 'sec-fetch-site': 'cross-site' }, { 'sec-fetch-site': 'none' }]) assert.equal((await h.run(request({ locale: 'en' }, headers))).status, 403)
  assert.equal(h.calls.length, 0)
})

test('identity requires the exact business ID plus an authenticated reviewer and a valid verified Place ID', () => {
  assert.equal(verifiedPartnerPlaceLink(link, businessId), link.place_id)
  for (const row of [null, { ...link, business_id: actor }, { ...link, verified_by: null }, { ...link, verified_by: 'owner' }, { ...link, verified_at: null }, { ...link, verified_at: 'invalid' }, { ...link, place_id: '<script>' }, { ...link, place_id: 'x'.repeat(201) }]) assert.equal(verifiedPartnerPlaceLink(row, businessId), null)
})

test('unpublished, suspended, missing and unverified businesses never receive a Google rating grant', async () => {
  for (const business of [null, { id: businessId, active: false, platform_status: 'enabled' }, { id: businessId, active: true, platform_status: 'suspended' }]) {
    const h = harness({ readBusiness: async () => business })
    assert.deepEqual(await (await h.run()).json(), { plan: null }); assert.ok(!h.calls.some(row => row[0] === 'budget' || row[0] === 'link'))
  }
  for (const row of [null, { ...link, verified_by: null }, { ...link, business_id: actor }]) {
    const h = harness({ readLink: async () => row })
    assert.deepEqual(await (await h.run()).json(), { plan: null }); assert.ok(!h.calls.some(row => row[0] === 'budget'))
  }
})

test('each granted visible widget reserves exactly one shared Google UI Kit Pro call before issuing only the verified ID', async () => {
  const h = harness(), response = await h.run(request({ locale: 'en' }))
  assert.deepEqual(h.calls, [['limit'], ['business', 'test-business'], ['link', businessId], ['budget', 'google', 'ui_rating']])
  assert.deepEqual(await response.json(), { plan: { mode: 'ui_kit_rating', placeId: link.place_id, browserKey: config.browserKey, locale: 'en' } })
  assert.match(response.headers.get('cache-control'), /private, no-store/)
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(PROVIDER_COST_MICROUSD.ui_rating, 5000)
})

test('quota exhaustion, rate limits and unavailable identity/budget storage fall back without fake stars or secrets', async () => {
  assert.equal((await harness({ allowAttempt: async () => false }).run()).status, 429)
  for (const overrides of [{ claimBudget: async () => false }, { claimBudget: async () => { throw new Error('PRIVATE_BUDGET') } }, { readLink: async () => { throw new Error('PRIVATE_LINK') } }, { readBusiness: async () => { throw new Error('PRIVATE_DB') } }]) {
    const response = await harness(overrides).run(), body = await response.json()
    assert.deepEqual(body, { plan: null }); assert.doesNotMatch(JSON.stringify(body), /PRIVATE|rating|reviewCount/)
  }
})

test('rating reservations use unchanged durable discovery limits and the production/preview budget partition', async () => {
  const calls = [], limits = discoveryConfig({ VERCEL_ENV: 'preview', DISCOVERY_GOOGLE_DAILY_LIMIT: '7', DISCOVERY_GOOGLE_MONTHLY_LIMIT: '50', DISCOVERY_GOOGLE_MONTHLY_MICROUSD: '10000000' })
  const guard = createBudgetGuard({ rpc: async (...args) => { calls.push(args); return { data: true } } }, limits)
  assert.equal(await guard('google', 'ui_rating'), true)
  assert.equal(calls[0][0], 'claim_discovery_budget')
  assert.deepEqual(calls[0][1], { p_environment: 'preview', p_provider: 'google', p_daily_limit: 7, p_monthly_limit: 50, p_daily_cost_limit: 2000000, p_monthly_cost_limit: 10000000, p_cost_microusd: 5000 })
})

test('the native Google widget selects only rating/attribution and does not copy data into GoRez or create a blended score', () => {
  const document = { createElement: tag => ({ tag, attributes: {}, children: [], setAttribute(name, value) { this.attributes[name] = value }, append(...nodes) { this.children.push(...nodes) } }) }
  const widget = createPartnerRatingWidget(document, { mode: 'ui_kit_rating', placeId: link.place_id })
  assert.equal(widget.tag, 'gmp-advanced-place-details')
  assert.deepEqual(widget.children.map(row => row.tag), ['gmp-place-details-place-request', 'gmp-place-rating', 'gmp-place-attribution'])
  assert.equal(widget.children[0].attributes.place, `places/${link.place_id}`)
  assert.equal(widget.children[2].attributes['light-scheme-color'], 'black')
  for (const plan of [null, { mode: 'rest', placeId: link.place_id }, { mode: 'ui_kit_rating', placeId: '<img>' }]) assert.throws(() => createPartnerRatingWidget(document, plan), /INVALID_RATING_PLAN/)
})

test('rating components lazy-load one authorized widget, retain native attribution and keep real GoRez reviews separate', async () => {
  const client = await read('components/partner-google-rating.js'), summary = await read('components/business-reviews.js'), widget = await read('lib/discovery/partner-rating-widget.mjs')
  assert.match(client, /if \(preview \|\|/); assert.match(client, /IntersectionObserver/)
  assert.match(client, /started \|\| !active/); assert.match(client, /setTimeout\(async/)
  assert.match(client, /signal: abort.signal, cache: 'no-store'/); assert.match(client, /widget\?\.remove\(\)/)
  assert.match(client, /loadPlacesLibrary\(plan.browserKey, plan.locale\)/)
  assert.doesNotMatch(client + widget, /shadowRoot|fetchFields|innerHTML|localStorage|sessionStorage|\.rating\b|\.userRatingCount|rating\s*\+/)
  assert.match(summary, /translate="no">GoRez/); assert.match(client, /translate="no">Google Maps/)
  assert.match(summary, /ReviewSummary summary=\{data\?\.summary\}/)
  assert.match(summary, /item.comment && <p>\{item.comment\}/)
  assert.match(await read('components/discovery-business-card.js'), /PartnerReviewSummary slug=\{row.slug\}/)
  assert.match(await read('components/business-profile.js'), /PartnerReviewSummary slug=\{business.slug\} reviews=\{reviews\} locale=\{locale\} preview=\{preview\} compact/)
  assert.equal((summary.slice(summary.indexOf('export function BusinessReviews')).match(/PartnerGoogleRating|PartnerReviewSummary/g) || []).length, 0, 'The review list must not create a second metered widget for the same profile')
})

test('the new public adapter has no provider REST request, accepts only published businesses, and never discloses server secrets', async () => {
  const route = await read('app/api/public/[slug]/google-rating/route.js')
  assert.match(route, /import 'server-only'/)
  assert.match(route, /\.eq\('active', true\)\.eq\('platform_status', 'enabled'\)/)
  assert.match(route, /\.eq\('business_id', businessId\)/)
  assert.match(route, /createBudgetGuard\(getSupabaseAdmin\(\), config, logDiscoveryUsage\)/)
  assert.doesNotMatch(route, /fetch\(|googlePlaceDetails|rating,|OPENAI|API_KEY/)
})

test('Google identity links stay admin-only, with manual exact-branch verification and no auto-match or provider call', async () => {
  const route = await read('app/api/admin/businesses/[id]/discovery/route.js'), editor = await read('components/admin-google-place-link.js')
  assert.match(route, /export async function GET/); assert.match(route, /export async function PUT/)
  assert.equal((route.match(/!isPlatformAdmin\(user\)/g) || []).length, 2)
  assert.match(route, /identityChecked: z.literal\(true\)/)
  assert.match(route, /verified_by: user.id, verified_at: new Date\(\).toISOString\(\)/)
  assert.match(editor, /checked: true|identityChecked: true/)
  assert.match(editor, /exact business and branch, not just a matching name/)
  assert.match(editor, /if \(!preview\) await send/)
  assert.match(await read('components/admin-business-editor.js'), /section === 'google' \? <AdminGooglePlaceLink/)
  assert.doesNotMatch(editor, /googleapis|fetchFields|textSearch|rating:/)
})
