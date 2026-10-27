import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createGooglePlacesAuthorizer, googlePlacesAuthConfigured, GOOGLE_PLACES_SCOPES } from '../lib/discovery/google-auth.mjs'
import { readVercelRuntimeToken } from '../lib/discovery/google-federation.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { searchGooglePlaces } from '../lib/discovery/google-places.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'

// Synthetic claims/tokens, mocked Google signature verification. No real
// signing key, Vercel identity, CLI login, Google credentials or network calls.
const time = Date.parse('2026-10-26T12:00:00Z'), seconds = time / 1000
const project = 'gorez-test-project', teamId = 'team_SYNTHETIC1234', projectId = 'prj_SYNTHETIC1234'
const config = discoveryConfig({
  DISCOVERY_ENABLED: 'true', VERCEL_ENV: 'preview', GOOGLE_PLACES_AUTH_MODE: 'vercel-oidc',
  GOOGLE_PLACES_PROJECT_ID: project, GOOGLE_WIF_PROJECT_NUMBER: '123456789012',
  GOOGLE_WIF_POOL_ID: 'gorez-preview', GOOGLE_WIF_PROVIDER_ID: 'vercel-preview',
  GOOGLE_WIF_SERVICE_ACCOUNT_EMAIL: `gorez-discovery@${project}.iam.gserviceaccount.com`,
  GOOGLE_WIF_VERCEL_TEAM_SLUG: 'synthetic-team', GOOGLE_WIF_VERCEL_TEAM_ID: teamId,
  GOOGLE_WIF_VERCEL_PROJECT_ID: projectId, GOOGLE_WIF_VERCEL_ENVIRONMENT: 'preview',
  GOOGLE_PLACES_UI_KIT_ENABLED: 'true', GOOGLE_PLACES_UI_KIT_APPROVED: 'true', GOOGLE_MAPS_BROWSER_KEY: 'synthetic-browser-key',
  // Both alternative credentials must stay ignored, even if WIF fails.
  GOOGLE_PLACES_API_KEY: 'must-not-use-key', GOOGLE_PLACES_SERVICE_ACCOUNT_JSON: 'must-not-parse-json',
})
const claims = {
  iss: 'https://oidc.vercel.com/synthetic-team', aud: 'https://vercel.com/synthetic-team',
  sub: 'owner:synthetic-team:project:synthetic-project:environment:preview', owner: 'synthetic-team', owner_id: teamId,
  project: 'synthetic-project', project_id: projectId, environment: 'preview', iat: seconds, nbf: seconds, exp: seconds + 7200,
}
const encoded = value => Buffer.from(JSON.stringify(value)).toString('base64url')
const identity = (patch = {}, header = {}) => `${encoded({ alg: 'RS256', typ: 'JWT', kid: 'synthetic-key', ...header })}.${encoded({ ...claims, ...patch })}.${encoded('synthetic-not-a-real-signature')}`
const noNetwork = () => assert.fail('must not contact a provider or read runtime identity')
const patchTrust = patch => ({ ...config, googleFederation: { ...config.googleFederation, ...patch } })
const stsReply = patch => Response.json({ access_token: 'synthetic-sts-token', token_type: 'Bearer', issued_token_type: 'urn:ietf:params:oauth:token-type:access_token', expires_in: 3600, ...patch })
const accessReply = patch => Response.json({ accessToken: 'synthetic-google-token', expireTime: new Date(time + 900000).toISOString(), ...patch })
function authorizer({ calls = [], now = () => time, getOidcToken = () => identity(), fetcher, ...options } = {}) {
  return createGooglePlacesAuthorizer({ now, getOidcToken, fetcher: fetcher || (async (url, init) => {
    calls.push({ url, init }); return url.includes('sts.googleapis.com') ? stsReply() : accessReply()
  }), ...options })
}
const input = patch => discoveryRequestSchema.parse({ query: 'маникюр в София', ...patch })
const intent = patch => parseIntent(input(patch), DateTime.fromMillis(time))
const request = (body = input(), headers = {}) => new Request('https://www.gorez.co/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
function dependencies(patch = {}) {
  return { config, now: DateTime.fromMillis(time), allowAttempt: async () => true, claimBudget: async () => true,
    authorizeGoogle: authorizer(), fetcher: async () => Response.json({ places: [{ id: 'SYNTHETIC_PLACE' }] }),
    readInternal: async () => [], readLinks: async () => [], getBusiness: noNetwork, getSlots: noNetwork, ...patch }
}

test('WIF is explicit and never auto-selected from ambient Vercel identity', () => {
  const off = discoveryConfig({ VERCEL_OIDC_TOKEN: identity(), GOOGLE_WIF_VERCEL_TEAM_ID: teamId })
  assert.equal(off.googleAuthMode, 'api-key'); assert.equal(off.enabled, false)
  assert.equal(googlePlacesAuthConfigured(off), false); assert.equal(googlePlacesAuthConfigured(config), true)
  assert.equal(config.googleFederation.vercelProjectId, projectId)
})

test('incomplete, cross-project and endpoint-injection WIF config fail before reading identity', async () => {
  const authorize = authorizer({ getOidcToken: noNetwork, fetcher: noNetwork })
  const invalid = [
    ...[
      { projectNumber: '' }, { projectNumber: '001234' }, { projectNumber: 'https://attacker.example' },
      { poolId: '../other' }, { poolId: 'gcp-reserved' }, { poolId: 'a'.repeat(33) },
      { providerId: 'evil?query=1' }, { serviceAccountEmail: 'owner@example.com' },
      { serviceAccountEmail: 'gorez-discovery@other-project.iam.gserviceaccount.com' },
      { serviceAccountEmail: `${config.googleFederation.serviceAccountEmail}/../../attacker` },
      { teamSlug: 'team.example/attack' }, { teamId: '' }, { teamId: 'team_\r\ninjected' },
      { vercelProjectId: '' }, { vercelProjectId: 'not-an-id' }, { environment: '' }, { environment: 'production' },
    ].map(patchTrust),
    { ...config, googleProjectId: '../project' }, { ...config, googleFederation: null },
  ]
  for (const bad of invalid) {
    assert.equal(googlePlacesAuthConfigured(bad), false)
    await assert.rejects(authorize(bad, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
  }
})

test('runtime token reader uses official request context; no CLI refresh or arbitrary file fallback', () => {
  assert.equal(readVercelRuntimeToken({ environment: 'production', context: { headers: { 'x-vercel-oidc-token': 'runtime' } }, env: { VERCEL_OIDC_TOKEN: 'ignored', VERCEL_OIDC_TOKEN_FILE: '/must-not-read' } }), 'runtime')
  assert.equal(readVercelRuntimeToken({ environment: 'development', context: {}, env: { VERCEL_OIDC_TOKEN: 'explicit-local-token' } }), 'explicit-local-token')
  for (const environment of ['production', 'preview']) assert.throws(() => readVercelRuntimeToken({ environment, context: {}, env: { VERCEL_OIDC_TOKEN: 'not-runtime' } }))
  assert.throws(() => readVercelRuntimeToken({ environment: 'development', context: {}, env: { VERCEL_OIDC_TOKEN: 'no-file-fallback', VERCEL_OIDC_TOKEN_FILE: '/must-not-read' } }))
  assert.equal(readVercelRuntimeToken({ environment: 'production', context: { headers: { 'x-vercel-oidc-token': '' } }, env: {} }), '')
})

test('OIDC issuer, audience, immutable team/project and environment are checked before STS', async () => {
  const badClaims = [
    { iss: 'https://oidc.vercel.com' }, { iss: 'https://attacker.example' },
    { aud: 'https://vercel.com/other' }, { aud: ['https://vercel.com/synthetic-team'] },
    { owner_id: 'team_OTHER1234' }, { project_id: 'prj_OTHER1234' },
    { owner: 'other-team' }, { environment: 'development' }, { sub: 'forged-subject' },
    { exp: seconds - 1 }, { exp: seconds + 29 }, { iat: seconds + 61 }, { nbf: seconds + 61 },
    { iat: seconds - 7201 }, { nbf: seconds + 7300 }, { exp: 'tomorrow' },
  ]
  for (const patch of badClaims) await assert.rejects(authorizer({ getOidcToken: () => identity(patch), fetcher: noNetwork })(config, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
  for (const header of [{ alg: 'none' }, { alg: 'HS256' }, { kid: '' }, { typ: 'not-JWT' }]) {
    await assert.rejects(authorizer({ getOidcToken: () => identity({}, header), fetcher: noNetwork })(config, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
  }
})

test('missing, malformed, oversized and leaking runtime identities never reach a provider', async () => {
  for (const value of [undefined, null, '', {}, Promise.resolve('not-supported'), 'a.b.c', 'x'.repeat(16385), 'injected\r\nheader']) {
    await assert.rejects(authorizer({ getOidcToken: () => value, fetcher: noNetwork })(config, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
  }
  await assert.rejects(authorizer({ getOidcToken: () => { throw new Error(`private ${identity()}`) }, fetcher: noNetwork })(config, 'text'), error => {
    assert.equal(error.message, 'GOOGLE_AUTH_UNAVAILABLE'); assert.equal(error.cause, undefined); return true
  })
})

test('a legitimate project rename does not replace the immutable project/owner trust boundary', async () => {
  const renamed = identity({ project: 'renamed_project', sub: 'owner:synthetic-team:project:renamed_project:environment:preview' })
  assert.equal((await authorizer({ getOidcToken: () => renamed })(config, 'text'))['X-Goog-User-Project'], project)
  await assert.rejects(authorizer({ getOidcToken: () => identity({ project_id: 'prj_OTHER1234' }), fetcher: noNetwork })(config, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
})

test('fixed STS audience, no Authorization header, IAM-only exchange scope and 15-minute method-scoped impersonation', async () => {
  const calls = [], authorize = authorizer({ calls })
  assert.deepEqual(await authorize(config, 'text'), { Authorization: 'Bearer synthetic-google-token', 'X-Goog-User-Project': project })
  assert.equal(calls.length, 2)
  const [sts, iam] = calls
  assert.equal(sts.url, 'https://sts.googleapis.com/v1/token'); assert.equal(sts.init.headers.Authorization, undefined)
  const body = new URLSearchParams(sts.init.body)
  assert.deepEqual(Object.fromEntries(body), {
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    audience: '//iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/gorez-preview/providers/vercel-preview',
    scope: 'https://www.googleapis.com/auth/iam', requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt', subject_token: identity(),
  })
  assert.equal(iam.url, `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/gorez-discovery@${project}.iam.gserviceaccount.com:generateAccessToken`)
  assert.equal(iam.init.headers.Authorization, 'Bearer synthetic-sts-token')
  assert.deepEqual(JSON.parse(iam.init.body), { scope: [GOOGLE_PLACES_SCOPES.text], lifetime: '900s' })
  for (const { init } of calls) { assert.equal(init.method, 'POST'); assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store'); assert.ok(init.signal instanceof AbortSignal) }
  assert.doesNotMatch(JSON.stringify(calls), /cloud-platform|must-not-use-key|must-not-parse-json|oauth2.googleapis.com/)
})

test('cached access tokens deduplicate concurrent exchanges, but recheck runtime identity on every request', async () => {
  const calls = []; let reads = 0, value = identity()
  const authorize = authorizer({ calls, getOidcToken: () => { reads++; return value } })
  await Promise.all(Array.from({ length: 12 }, () => authorize(config, 'text')))
  await authorize(config, 'ids'); await authorize(config, 'text')
  assert.equal(calls.length, 2); assert.equal(reads, 14)
  value = identity({ project_id: 'prj_OTHER1234' })
  await assert.rejects(authorize(config, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
  assert.equal(calls.length, 2)
})

test('Text, Nearby and Details have separate scopes and bounded three-entry token caches', async () => {
  const calls = [], authorize = authorizer({ calls })
  await Promise.all([authorize(config, 'text'), authorize(config, 'nearby'), authorize(config, 'details')])
  await authorize(config, 'ids'); await authorize(config, 'nearby'); await authorize(config, 'details')
  assert.equal(calls.length, 6)
  assert.deepEqual(calls.filter(row => row.url.includes('iamcredentials')).map(row => JSON.parse(row.init.body).scope[0]).sort(), [...new Set(Object.values(GOOGLE_PLACES_SCOPES))].sort())
  await assert.rejects(authorize(config, 'toString'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
  assert.equal(calls.length, 6)
})

test('expiry refresh and trust rotation cannot reuse stale Google tokens', async () => {
  let clock = time, count = 0
  const authorize = authorizer({ now: () => clock, fetcher: async url => {
    if (url.includes('sts.googleapis.com')) return stsReply()
    return accessReply({ accessToken: `google-token-${++count}`, expireTime: new Date(clock + 900000).toISOString() })
  } })
  assert.match((await authorize(config, 'text')).Authorization, /token-1$/)
  clock += 839000
  assert.match((await authorize(config, 'text')).Authorization, /token-1$/)
  clock += 1001
  assert.match((await authorize(config, 'text')).Authorization, /token-2$/)
  assert.match((await authorize(patchTrust({ providerId: 'rotated-provider' }), 'text')).Authorization, /token-3$/)
  assert.match((await authorize(config, 'text')).Authorization, /token-4$/)
})

test('a credential rotation while exchange is pending cannot poison the new cache', async () => {
  let resume, count = 0
  const paused = new Promise(resolve => { resume = resolve })
  const authorize = authorizer({ fetcher: async (url, init) => {
    if (url.includes('sts.googleapis.com')) { if (new URLSearchParams(init.body).get('audience').includes('/gorez-preview/')) await paused; return stsReply() }
    return accessReply({ accessToken: `rotation-${++count}` })
  } })
  const old = authorize(config, 'text')
  const rotated = patchTrust({ poolId: 'other-preview' })
  const fresh = await authorize(rotated, 'text')
  resume(); await old
  assert.deepEqual(await authorize(rotated, 'text'), fresh); assert.equal(count, 2)
})

test('development lifetime is allowed only with explicitly development-scoped trust and identity', async () => {
  const development = { ...patchTrust({ environment: 'development' }), environment: 'development' }
  const authorize = authorizer({ getOidcToken: () => identity({ environment: 'development', sub: 'owner:synthetic-team:project:synthetic-project:environment:development', exp: seconds + 43200 }) })
  assert.equal(googlePlacesAuthConfigured(development), true)
  assert.equal((await authorize(development, 'text'))['X-Goog-User-Project'], project)
  await assert.rejects(authorize(config, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
})

test('STS errors, invalid responses and oversized data stop before IAM, with no retry or credential fallback', async () => {
  for (const reply of [
    () => new Response('not-json'), () => new Response('private error', { status: 403 }),
    () => stsReply({ access_token: 'injected\r\nheader' }), () => stsReply({ token_type: 'Other' }),
    () => stsReply({ issued_token_type: 'other' }), () => stsReply({ expires_in: 0 }), () => stsReply({ expires_in: 3601 }),
    () => stsReply({ access_token: 'x'.repeat(12289) }), () => new Response('{}', { headers: { 'content-length': '24577' } }),
  ]) {
    let count = 0
    await assert.rejects(authorizer({ fetcher: async () => { count++; return reply() } })(config, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
    assert.equal(count, 1)
  }
})

test('STS permits the documented 12 KB token without exposing or retaining it in final headers', async () => {
  const authorize = authorizer({ fetcher: async url => url.includes('sts.googleapis.com') ? stsReply({ access_token: 'x'.repeat(12288) }) : accessReply() })
  assert.deepEqual(await authorize(config, 'text'), { Authorization: 'Bearer synthetic-google-token', 'X-Goog-User-Project': project })
})

test('IAM errors, invalid token/expiry and excessive lifetimes fail closed and remain uncacheable', async () => {
  for (const reply of [
    () => new Response('private token error', { status: 401 }), () => new Response('invalid'),
    () => accessReply({ accessToken: 'injected\r\nheader' }), () => accessReply({ accessToken: 'x'.repeat(12289) }),
    () => accessReply({ expireTime: 'not-a-date' }), () => accessReply({ expireTime: new Date(time - 1).toISOString() }),
    () => accessReply({ expireTime: new Date(time + 3600000).toISOString() }),
    () => new Response('{}', { headers: { 'content-length': '16385' } }),
  ]) {
    let count = 0
    const authorize = authorizer({ fetcher: async url => { count++; return url.includes('sts.googleapis.com') ? stsReply() : reply() } })
    for (let attempt = 0; attempt < 2; attempt++) await assert.rejects(authorize(config, 'text'), error => {
      assert.equal(error.message, 'GOOGLE_AUTH_UNAVAILABLE'); assert.equal(error.cause, undefined); assert.equal(error.response, undefined); return true
    })
    assert.equal(count, 4) // Two explicit attempts, never automatic retries.
  }
})

test('both STS and IAM have header/body deadlines without retries', async () => {
  for (const stage of ['sts', 'iam']) for (const reply of [() => new Promise(() => {}), () => new Response(new ReadableStream({ start() {} }))]) {
    let count = 0
    const authorize = authorizer({ timeoutMs: 15, fetcher: async url => {
      count++; return stage === 'iam' && url.includes('sts.googleapis.com') ? stsReply() : reply()
    } })
    await assert.rejects(authorize(config, 'text'), /^Error: GOOGLE_AUTH_UNAVAILABLE$/)
    assert.equal(count, stage === 'sts' ? 1 : 2)
  }
})

test('disabled, missing and exhausted search gates run before runtime identity or Google exchange', async () => {
  for (const [patch, expected] of [
    [{ config: { ...config, uiKitEnabled: false } }, 'disabled'],
    [{ config: { ...config, browserKey: '' } }, 'not_configured'],
    [{ config: patchTrust({ teamId: '' }) }, 'not_configured'],
    [{ claimBudget: async () => false }, 'quota'],
  ]) assert.equal((await searchGooglePlaces(intent(), dependencies({ authorizeGoogle: noNetwork, fetcher: noNetwork, ...patch }))).status, expected)
})

test('feature, rate, cross-site and strict-input gates reject before federation', async () => {
  for (const [patch, req, status] of [
    [{ config: { ...config, enabled: false } }, request(), 404],
    [{ allowAttempt: async () => false }, request(), 429],
    [{}, request(input(), { origin: 'https://attacker.example', 'sec-fetch-site': 'cross-site' }), 403],
    [{}, request({ query: 'маникюр в София', googleFederation: config.googleFederation }), 422],
  ]) assert.equal((await createDiscoveryHandler(dependencies({ authorizeGoogle: noNetwork, fetcher: noNetwork, ...patch }))(req)).status, status)
})

test('successful EEA federation preserves ID-only fields, fixed billing and the limited public widget plan', async () => {
  const calls = [], logs = [], budgets = []
  const result = await discoverBusinesses(input(), dependencies({
    claimBudget: async (...args) => { budgets.push(args); return true }, log: row => logs.push(row),
    fetcher: async (url, init) => { calls.push({ url, init }); return Response.json({ places: [{ id: 'SYNTHETIC_PLACE' }] }) },
  }))
  assert.equal(result.externalStatus, 'ui_kit'); assert.deepEqual(result.external.placeIds, ['SYNTHETIC_PLACE'])
  assert.equal(result.external.browserKey, 'synthetic-browser-key')
  assert.equal(calls[0].init.headers['X-Goog-FieldMask'], 'places.id')
  assert.equal(calls[0].init.headers['X-Goog-User-Project'], project)
  assert.equal(calls[0].init.headers.Authorization, 'Bearer synthetic-google-token')
  assert.equal(calls[0].init.headers['X-Goog-Api-Key'], undefined)
  assert.deepEqual(budgets, [['google', 'ids'], ['google', 'ui_list']])
  assert.doesNotMatch(JSON.stringify({ result, logs }), /synthetic-google-token|synthetic-sts-token|SYNTHETIC1234|gorez-test-project|must-not-use/)
})

test('federation failure preserves internal businesses without leaking errors or using other credentials', async () => {
  const logs = [], result = await discoverBusinesses(input(), dependencies({
    log: row => logs.push(row), fetcher: noNetwork,
    authorizeGoogle: authorizer({ fetcher: async () => { throw new Error(`private ${identity()}`) } }),
    readInternal: async () => [{ id: 'internal-1', name: 'Internal Studio', slug: 'internal', industry: 'beauty', active: true, platform_status: 'enabled', city_ekatte: '68134', address: 'Sofia', services: [{ id: 's1', name: 'Маникюр', active: true, price: 30, currency: 'EUR', duration_min: 60 }] }],
  }))
  assert.equal(result.externalStatus, 'unavailable'); assert.equal(result.external, null)
  assert.equal(result.results.length, 1); assert.equal(result.results[0].source, 'gorez')
  assert.doesNotMatch(JSON.stringify({ result, logs }), /private|eyJ|synthetic-google-token|SYNTHETIC1234|must-not-use/)
})

test('public widgets never import federation/SDK/trust configuration, and runtime reader has no implicit refresh', async () => {
  const client = await readFile(new URL('../components/google-discovery-list.js', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /@vercel\/oidc|google-federation|GOOGLE_WIF|googleFederation|VERCEL_OIDC_TOKEN/)
  const server = await readFile(new URL('../lib/discovery/google-federation.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(server, /getVercelOidcToken\(|readFile\(|exec\(|spawn\(|ExternalAccountClient/)
})
