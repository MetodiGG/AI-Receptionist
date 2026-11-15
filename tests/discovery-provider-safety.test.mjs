import test from 'node:test'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { searchGooglePlaces, googlePlaceDetails } from '../lib/discovery/google-places.mjs'
import { interpretDiscoveryIntent } from '../lib/discovery/ai-intent.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { createBudgetGuard } from '../lib/discovery/budget.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { readFile } from 'node:fs/promises'
import { createGoogleCardGrantHandler } from '../lib/discovery/google-card-grant.mjs'
import { createPartnerRatingHandler } from '../lib/discovery/partner-ratings.mjs'

const legacy = { DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'google', DISCOVERY_AI_ENABLED: 'true', OPENAI_API_KEY: 'fake-legacy-test-only',
  GOOGLE_PLACES_ENABLED: 'true', GOOGLE_PLACES_REST_USE_APPROVED: 'true', GOOGLE_PLACES_BILLING_REGION: 'NON_EEA', GOOGLE_PLACES_API_KEY: 'fake-test-only',
  GOOGLE_PLACES_UI_KIT_ENABLED: 'true', GOOGLE_PLACES_UI_KIT_APPROVED: 'true', GOOGLE_PARTNER_RATINGS_ENABLED: 'true', GOOGLE_DISCOVERY_CARDS_ENABLED: 'true', GOOGLE_PLACES_DETAILS_ENABLED: 'true', GOOGLE_MAPS_BROWSER_KEY: 'fake-browser-test-only' }
const forbidden = () => assert.fail('Disabled providers must not authorize, reserve or make network calls')
const now = DateTime.fromISO('2026-11-14T12:00:00Z')

test('Google/AI stay unavailable even with every legacy flag and both approval gates enabled', () => {
  for (const gates of [{}, { GOOGLE_PLACES_ACTIVATION_APPROVED: 'true' }, { GOOGLE_PLACES_HARD_LIMITS_VERIFIED: 'true' }, { GOOGLE_PLACES_ACTIVATION_APPROVED: 'true', GOOGLE_PLACES_HARD_LIMITS_VERIFIED: 'true' }]) {
    const config = discoveryConfig({ ...legacy, ...gates })
    assert.equal(config.providerMode, 'catalogue')
    for (const flag of ['googleEnabled', 'uiKitEnabled', 'partnerRatingsEnabled', 'googleCardsEnabled', 'detailsEnabled', 'aiEnabled']) assert.equal(config[flag], false, flag)
    for (const field of ['aiKey', 'googleKey', 'googleProjectId', 'googleServiceAccountJson', 'googleCardSecret', 'browserKey']) assert.equal(config[field], '', field)
    assert.ok(Object.values(config.googleFederation).every(value => value === ''))
  }
})

test('catalogue-only runtime does not even read Google credentials or activation flags', () => {
  const env = new Proxy({ DISCOVERY_ENABLED: 'true' }, { get(target, key) {
    if (/^GOOGLE_|^OPENAI_|^DISCOVERY_PROVIDER_MODE$/.test(String(key))) assert.fail(`Provider setting read: ${String(key)}`)
    return target[key]
  } })
  const config = discoveryConfig(env)
  assert.equal(config.providerMode, 'catalogue'); assert.equal(config.enabled, true)
  assert.equal(config.aiEnabled, false); assert.equal(config.googleEnabled, false)
})

test('disabled Google search/details and ambiguous deterministic search make zero billable/authorization/model requests', async () => {
  const config = discoveryConfig({ ...legacy, GOOGLE_PLACES_ACTIVATION_APPROVED: 'true', GOOGLE_PLACES_HARD_LIMITS_VERIFIED: 'true' }), deps = { config, now, claimBudget: forbidden, authorizeGoogle: forbidden, fetcher: forbidden }
  assert.equal((await searchGooglePlaces({ category: 'nails', city: 'София', locale: 'bg' }, deps)).status, 'disabled')
  assert.equal(await googlePlaceDetails('ChIJTEST_ONLY', deps), null)
  assert.equal((await interpretDiscoveryIntent({ query: 'непозната услуга в София', locale: 'bg' }, deps)).mode, 'rules')
  const result = await discoverBusinesses({ query: 'IN Beauty', cityCode: '68134' }, { ...deps, readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE })
  assert.equal(result.results[0].id, 'sofia-in-beauty')
  assert.ok(result.results.every(row => row.source !== 'google'))
  assert.doesNotMatch(JSON.stringify(result), /fake-legacy|fake-browser|fake-test|api\.openai\.com/)
})

test('dormant adapters still fail closed on quota/database errors in explicitly injected offline fixtures', async () => {
  const config = { ...discoveryConfig(legacy), providerMode: 'google', googleEnabled: true, detailsEnabled: true, googleAuthMode: 'api-key', googleKey: 'fake-test-only' }
  for (const rpc of [async () => ({ data: false }), async () => ({ error: Error('unavailable') }), async () => { throw Error('offline') }]) {
    const deps = { config, claimBudget: createBudgetGuard({ rpc }, config), authorizeGoogle: forbidden, fetcher: forbidden }
    assert.equal((await searchGooglePlaces({ category: 'nails', city: 'София', locale: 'bg' }, deps)).status, 'quota')
    assert.equal(await googlePlaceDetails('ChIJTEST_ONLY', deps), null)
  }
  let cost
  const guard = createBudgetGuard({ rpc: async (_name, params) => { cost = params; return { data: false } } }, { ...config, google: { daily: 0, monthly: 0, dailyCost: 0, monthlyCost: 0 } })
  assert.equal(await guard('google', 'text'), false)
  assert.equal(cost.p_daily_limit, 0); assert.equal(cost.p_monthly_cost_limit, 0)
})

test('Google card grants and partner ratings cannot authorize a paid browser widget', async () => {
  const config=discoveryConfig({ ...legacy, GOOGLE_PLACES_ACTIVATION_APPROVED:'true', GOOGLE_PLACES_HARD_LIMITS_VERIFIED:'true' })
  const card=createGoogleCardGrantHandler({config,allowAttempt:forbidden,claimBudget:forbidden})
  assert.equal((await card(new Request('https://gorez.test/api/public/discovery/google-card',{method:'POST',body:'not-json'}))).status,404)
  const rating=createPartnerRatingHandler({config,allowAttempt:forbidden,claimBudget:forbidden,readBusiness:forbidden,readLink:forbidden})
  const response=await rating(new Request('https://gorez.test/api/public/real-partner/google-rating',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale:'bg'})}),'real-partner')
  assert.deepEqual(await response.json(),{plan:null})
})

test('production provider entrypoints use only the hard catalogue config, not an offline Google fixture', async () => {
  for (const file of ['app/api/public/discovery/route.js','app/api/public/discovery/google-card/route.js','app/api/public/[slug]/google-rating/route.js']) {
    const source=await readFile(new URL(`../${file}`,import.meta.url),'utf8')
    assert.match(source,/discoveryConfig\(process\.env\)/,file)
    assert.doesNotMatch(source,/legacyGoogleConfig|helpers\/legacy-google-config/,file)
  }
})

test('example configuration documents ignored legacy Google setup and no model activation path', async () => {
  const example = await readFile(new URL('../.env.example', import.meta.url), 'utf8')
  assert.match(example, /^GOOGLE_PLACES_ACTIVATION_APPROVED=false$/m)
  assert.match(example, /^GOOGLE_PLACES_HARD_LIMITS_VERIFIED=false$/m)
  assert.match(example, /Public discovery hard-disables online/)
  assert.doesNotMatch(example, /Fixed low-cost model|Optional new provider/)
  assert.match(example,/catalogue-only|catalogue only/i)
})
