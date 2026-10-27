import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, verify } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createGooglePlacesAuthorizer, googlePlacesAuthConfigured, GOOGLE_PLACES_SCOPES } from '../lib/discovery/google-auth.mjs'
import { googlePlaceDetails, searchGooglePlaces } from '../lib/discovery/google-places.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'

// Ephemeral synthetic credentials: never real Google keys and never written.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
const project = 'gorez-test-project', token = 'synthetic-access-token'
const account = {
  type: 'service_account', project_id: project,
  client_email: `gorez-discovery@${project}.iam.gserviceaccount.com`,
  private_key: privateKey, private_key_id: 'synthetic-key-id',
  token_uri: 'https://oauth2.googleapis.com/token', universe_domain: 'googleapis.com',
}
const config = discoveryConfig({
  DISCOVERY_ENABLED: 'true', GOOGLE_PLACES_AUTH_MODE: 'oauth', GOOGLE_PLACES_PROJECT_ID: project,
  GOOGLE_PLACES_SERVICE_ACCOUNT_JSON: JSON.stringify(account),
  GOOGLE_PLACES_UI_KIT_ENABLED: 'true', GOOGLE_PLACES_UI_KIT_APPROVED: 'true',
  GOOGLE_MAPS_BROWSER_KEY: 'synthetic-browser-key',
  // A configured legacy key must NOT become an OAuth failure fallback.
  GOOGLE_PLACES_API_KEY: 'legacy-key-must-not-be-used',
})
const now = DateTime.fromISO('2026-10-26T12:00:00Z')
const input = patch => discoveryRequestSchema.parse({ query: 'маникюр в София', ...patch })
const intent = patch => parseIntent(input(patch), now)
const tokenReply = patch => Response.json({ access_token: token, token_type: 'Bearer', expires_in: 3600, ...patch })
const request = (body = input(), headers = {}) => new Request('https://www.gorez.co/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
const noNetwork = () => assert.fail('must not contact any provider')
const jsonWith = patch => JSON.stringify({ ...account, ...patch })
function dependencies(patch = {}) {
  return {
    now, config, allowAttempt: async () => true, claimBudget: async () => true,
    authorizeGoogle: createGooglePlacesAuthorizer({ fetcher: async () => tokenReply() }),
    fetcher: async () => Response.json({ places: [{ id: 'SYNTHETIC_PLACE' }] }),
    readInternal: async () => [], readLinks: async () => [],
    getBusiness: noNetwork, getSlots: noNetwork, ...patch,
  }
}

test('OAuth is explicit, off-by-default and never selected from ambient Google credentials', async () => {
  const off = discoveryConfig({ GOOGLE_APPLICATION_CREDENTIALS: '/must-not-read', GOOGLE_PLACES_SERVICE_ACCOUNT_JSON: JSON.stringify(account) })
  assert.equal(off.enabled, false); assert.equal(off.uiKitEnabled, false); assert.equal(off.googleEnabled, false)
  assert.equal(off.googleAuthMode, 'api-key'); assert.equal(googlePlacesAuthConfigured(off), false)
  const authorize = createGooglePlacesAuthorizer({ fetcher: noNetwork })
  assert.deepEqual(await authorize({ googleKey: 'restricted-test-key' }, 'text'), { 'X-Goog-Api-Key': 'restricted-test-key' })
  for (const googleAuthMode of ['invalid', 'OAuth', ' oauth ']) {
    const invalid = { ...config, googleAuthMode }
    assert.equal(googlePlacesAuthConfigured(invalid), false)
    await assert.rejects(authorize(invalid, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
  }
  await assert.rejects(authorize(config, 'toString'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
})

test('service account validation rejects cross-project, external/delegated and attacker endpoint configuration without network calls', async () => {
  const authorize = createGooglePlacesAuthorizer({ fetcher: noNetwork })
  const invalid = [
    { googleProjectId: '' }, { googleProjectId: 'invalid\r\nheader' }, { googleProjectId: 'other-project' },
    { googleServiceAccountJson: '' }, { googleServiceAccountJson: 'not-json' }, { googleServiceAccountJson: ' '.repeat(32769) },
    ...[
      { type: 'authorized_user' }, { type: 'external_account', credential_source: { url: 'https://attacker.example/' } },
      { project_id: 'other-project' }, { client_email: 'owner@example.com' },
      { client_email: `gorez-discovery@${project}.iam.gserviceaccount.com.attacker.example` },
      { private_key: '/path/to/key' }, { token_uri: 'https://attacker.example/token' }, { universe_domain: 'attacker.example' },
    ].map(patch => ({ googleServiceAccountJson: jsonWith(patch) })),
  ]
  for (const patch of invalid) {
    assert.equal(googlePlacesAuthConfigured({ ...config, ...patch }), false)
    await assert.rejects(authorize({ ...config, ...patch }, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
  }
})

test('official SDK signs a narrow-scope service assertion; transport uses only the fixed bounded OAuth endpoint', async () => {
  const calls = []
  const authorize = createGooglePlacesAuthorizer({ fetcher: async (url, init) => { calls.push({ url, init }); return tokenReply({ refresh_token: 'discard-me', id_token: 'discard-me' }) } })
  const headers = await authorize({ ...config, googleServiceAccountJson: jsonWith({ subject: 'user@example.com', additionalClaims: { scope: 'forged' }, quota_project_id: 'forged-project' }) }, 'text')
  assert.deepEqual(headers, { Authorization: `Bearer ${token}`, 'X-Goog-User-Project': project })
  assert.equal(calls.length, 1)
  const { url, init } = calls[0]
  assert.equal(url, 'https://oauth2.googleapis.com/token'); assert.equal(init.method, 'POST')
  assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store'); assert.ok(init.signal instanceof AbortSignal)
  assert.equal(init.headers['Content-Type'], 'application/x-www-form-urlencoded')
  const body = new URLSearchParams(init.body)
  assert.equal(body.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  const [header, payload, signature] = body.get('assertion').split('.')
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
  assert.equal(JSON.parse(Buffer.from(header, 'base64url').toString()).alg, 'RS256')
  assert.ok(verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, 'base64url')))
  assert.equal(claims.iss, account.client_email); assert.equal(claims.aud, url)
  assert.equal(claims.scope, GOOGLE_PLACES_SCOPES.text); assert.equal(claims.sub, undefined)
  assert.equal(claims.exp - claims.iat, 3600)
  assert.doesNotMatch(JSON.stringify(headers), /legacy-key|PRIVATE KEY|discard-me/)
})

test('tokens are reused, concurrent exchanges deduplicated, and Text/Nearby/Details remain separately scoped', async () => {
  const scopes = [], authorize = createGooglePlacesAuthorizer({ fetcher: async (url, init) => {
    scopes.push(JSON.parse(Buffer.from(new URLSearchParams(init.body).get('assertion').split('.')[1], 'base64url').toString()).scope)
    return tokenReply()
  } })
  await Promise.all(Array.from({ length: 10 }, () => authorize(config, 'text')))
  await authorize(config, 'ids'); await authorize(config, 'text')
  assert.deepEqual(scopes, [GOOGLE_PLACES_SCOPES.text])
  await Promise.all([authorize(config, 'nearby'), authorize(config, 'details')])
  assert.deepEqual(scopes, [GOOGLE_PLACES_SCOPES.text, GOOGLE_PLACES_SCOPES.nearby, GOOGLE_PLACES_SCOPES.details])
  assert.ok(scopes.every(scope => !scope.includes('cloud-platform')))
})

test('documented legacy Google key metadata is accepted without redirecting the token exchange', async () => {
  const calls = [], authorize = createGooglePlacesAuthorizer({ fetcher: async (url, init) => { calls.push({ url, init }); return tokenReply() } })
  const legacy = { ...config, googleServiceAccountJson: jsonWith({ token_uri: 'https://accounts.google.com/o/oauth2/token' }) }
  assert.equal(googlePlacesAuthConfigured(legacy), true)
  assert.deepEqual(await authorize(legacy, 'text'), { Authorization: `Bearer ${token}`, 'X-Goog-User-Project': project })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://oauth2.googleapis.com/token')
  assert.equal(calls[0].init.redirect, 'error')
})

test('near-expiry tokens refresh and credential rotation cannot reuse the old token', async () => {
  let count = 0
  const authorize = createGooglePlacesAuthorizer({ fetcher: async () => tokenReply({ access_token: `synthetic-token-${++count}`, expires_in: 1 }) })
  assert.match((await authorize(config, 'text')).Authorization, /token-1$/)
  assert.match((await authorize(config, 'text')).Authorization, /token-2$/)
  const rotated = { ...config, googleServiceAccountJson: jsonWith({ private_key_id: 'rotated-key-id' }) }
  assert.match((await authorize(rotated, 'text')).Authorization, /token-3$/)
  let longCount = 0
  const cached = createGooglePlacesAuthorizer({ fetcher: async () => tokenReply({ access_token: `long-token-${++longCount}` }) })
  await cached(config, 'text'); await cached(config, 'text'); await cached(rotated, 'text')
  assert.equal(longCount, 2)
})

test('malformed, oversized, refused and leaking token responses fail closed, without retrying or using a legacy key', async () => {
  const badReplies = [
    () => new Response('invalid'), () => Response.json({ error: 'invalid_grant', error_description: privateKey }, { status: 401 }),
    () => tokenReply({ access_token: 'injected\r\nheader' }), () => tokenReply({ expires_in: 0 }),
    () => tokenReply({ expires_in: 3601 }), () => tokenReply({ token_type: 'Other' }),
    () => tokenReply({ access_token: 'x'.repeat(20000) }),
    () => new Response('{}', { headers: { 'content-length': '20000' } }),
  ]
  for (const reply of badReplies) {
    let count = 0
    const authorize = createGooglePlacesAuthorizer({ fetcher: async () => { count++; return reply() } })
    await assert.rejects(authorize(config, 'text'), error => {
      assert.equal(error.message, 'GOOGLE_AUTH_UNAVAILABLE'); assert.equal(error.cause, undefined); assert.equal(error.response, undefined)
      return true
    })
    assert.equal(count, 1)
  }
  const broken = { ...config, googleServiceAccountJson: jsonWith({ private_key: '-----BEGIN PRIVATE KEY-----\nZmFrZQ==\n-----END PRIVATE KEY-----\n' }) }
  await assert.rejects(createGooglePlacesAuthorizer({ fetcher: noNetwork })(broken, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
})

test('OAuth deadline covers both hanging headers and a hanging response body', async () => {
  for (const fetcher of [() => new Promise(() => {}), async () => new Response(new ReadableStream({ start() {} }))]) {
    const authorize = createGooglePlacesAuthorizer({ fetcher, timeoutMs: 20 })
    await assert.rejects(authorize(config, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
  }
})

test('EEA OAuth search has ID-only Places fields and returns only the intended public browser key', async () => {
  const calls = [], budgets = [], logs = []
  const d = dependencies({ claimBudget: async (...args) => { budgets.push(args); return true }, log: row => logs.push(row), fetcher: async (url, init) => { calls.push({ url, init }); return Response.json({ places: [{ id: 'SYNTHETIC_PLACE' }] }) } })
  const result = await discoverBusinesses(input(), d)
  assert.equal(result.externalStatus, 'ui_kit'); assert.deepEqual(result.external.placeIds, ['SYNTHETIC_PLACE'])
  assert.equal(result.external.browserKey, 'synthetic-browser-key')
  assert.deepEqual(budgets, [['google', 'ids'], ['google', 'ui_list']])
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${token}`)
  assert.equal(calls[0].init.headers['X-Goog-User-Project'], project)
  assert.equal(calls[0].init.headers['X-Goog-FieldMask'], 'places.id')
  assert.equal(calls[0].init.headers['X-Goog-Api-Key'], undefined)
  assert.doesNotMatch(JSON.stringify({ result, logs }), /synthetic-access-token|legacy-key|PRIVATE KEY|client_email|gorez-test-project/)
})

test('geolocated Nearby and optional non-EEA Details use OAuth without a server API key', async () => {
  const calls = [], d = dependencies({ config: { ...config, googleKey: '' }, fetcher: async (url, init) => {
    calls.push({ url, init }); return Response.json(url.includes(':searchNearby') ? { places: [{ id: 'NEAR_PLACE', location: { latitude: 42.7, longitude: 23.3 } }] } : { id: 'NEAR_PLACE', websiteUri: 'https://example.com/' })
  } })
  assert.equal((await searchGooglePlaces(intent({ query: 'маникюр около мен', coordinates: { latitude: 42.7, longitude: 23.3, consent: true } }), d)).status, 'ui_kit')
  assert.equal(calls[0].init.headers['X-Goog-FieldMask'], 'places.id,places.location')
  assert.equal(await googlePlaceDetails('NEAR_PLACE', d), null)
  const details = await googlePlaceDetails('NEAR_PLACE', { ...d, config: { ...d.config, googleEnabled: true, detailsEnabled: true } })
  assert.equal(details.website, 'https://example.com/')
  assert.ok(calls.every(call => call.init.headers.Authorization === `Bearer ${token}` && !call.init.headers['X-Goog-Api-Key']))
})

test('disabled, missing and exhausted search paths do not exchange a token or call Places', async () => {
  for (const [patch, expected] of [
    [{ config: { ...config, uiKitEnabled: false } }, 'disabled'],
    [{ config: { ...config, browserKey: '' } }, 'not_configured'],
    [{ config: { ...config, googleServiceAccountJson: '' } }, 'not_configured'],
    [{ config: { ...config, googleAuthMode: 'invalid' } }, 'not_configured'],
    [{ claimBudget: async () => false }, 'quota'],
  ]) {
    const d = dependencies({ authorizeGoogle: noNetwork, fetcher: noNetwork, ...patch })
    assert.equal((await searchGooglePlaces(intent(), d)).status, expected)
  }
  const d = dependencies({ config: { ...config, uiKitEnabled: false, googleEnabled: true, detailsEnabled: true }, claimBudget: async () => false, authorizeGoogle: noNetwork, fetcher: noNetwork })
  assert.equal((await searchGooglePlaces(intent(), d)).status, 'quota')
  assert.equal(await googlePlaceDetails('SYNTHETIC_PLACE', d), null)
})

test('a failed OAuth exchange preserves real internal results and never exposes provider/credential errors', async () => {
  const logs = [], d = dependencies({
    log: row => logs.push(row), fetcher: noNetwork,
    authorizeGoogle: createGooglePlacesAuthorizer({ fetcher: async () => { throw new Error(`private error ${privateKey} ${token}`) } }),
    readInternal: async () => [{ id: 'internal-1', name: 'Internal Studio', slug: 'internal', industry: 'beauty', active: true, platform_status: 'enabled', city_ekatte: '68134', address: 'Sofia', services: [{ id: 's1', name: 'Маникюр', active: true, price: 30, currency: 'EUR', duration_min: 60 }] }],
  })
  const result = await discoverBusinesses(input(), d)
  assert.equal(result.externalStatus, 'unavailable'); assert.equal(result.external, null)
  assert.equal(result.results.length, 1); assert.equal(result.results[0].source, 'gorez')
  assert.doesNotMatch(JSON.stringify({ result, logs }), /PRIVATE KEY|synthetic-access-token|private error|client_email|legacy-key/)
})

test('feature, cross-site, input and rate-limit gates run before OAuth', async () => {
  for (const [patch, req, status] of [
    [{ config: { ...config, enabled: false } }, request(), 404],
    [{}, request(input(), { origin: 'https://attacker.example', 'sec-fetch-site': 'cross-site' }), 403],
    [{}, request({ query: 'маникюр София', googleProjectId: 'attacker-project' }), 422],
    [{ allowAttempt: async () => false }, request(), 429],
  ]) {
    const reply = await createDiscoveryHandler(dependencies({ authorizeGoogle: noNetwork, fetcher: noNetwork, ...patch }))(req)
    assert.equal(reply.status, status)
  }
})

test('the public widget consumes a limited plan, not server OAuth credentials or the auth SDK', async () => {
  const client = await readFile(new URL('../components/google-discovery-list.js', import.meta.url), 'utf8')
  const route = await readFile(new URL('../app/api/public/discovery/route.js', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /google-auth-library|google-auth\.mjs|SERVICE_ACCOUNT|PRIVATE_KEY|googleServiceAccount|googleProjectId|googleAuthMode|process\.env/)
  assert.match(route, /import 'server-only'/); assert.match(route, /runtime = 'nodejs'/)
})
