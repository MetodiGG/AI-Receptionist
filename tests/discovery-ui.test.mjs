import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { DEFAULT_DISCOVERY_CITY, discoveryCitySelection, discoverySearchInput, requestDiscoveryLocation } from '../lib/discovery/search-ui.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'
import { normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'

const now = DateTime.fromISO('2026-10-27T18:00:00Z')
const origin = { latitude: 42.6977, longitude: 23.3219, consent: true } // Synthetic city-centre fixture, never a user's location.
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('Sofia is selected initially and a service/time-only request works without a city prompt', () => {
  assert.equal(DEFAULT_DISCOVERY_CITY, '68134')
  const input = discoveryRequestSchema.parse(discoverySearchInput({ query: 'барбершоп за утре в 13:00ч' }))
  const intent = parseIntent(input, now)
  assert.equal(input.cityCode, '68134'); assert.equal(intent.city, 'София')
  assert.equal(intent.date, '2026-10-28'); assert.equal(intent.timeFrom, '13:00')
  assert.equal(intent.clarification, null)
})

test('a city explicitly typed in BG/EN wins over the implicit Sofia default, not a deliberate manual selection', () => {
  for (const query of ['Маникюр в Пловдив', 'A car wash in Plovdiv']) {
    const request = discoverySearchInput({ query })
    assert.equal(request.cityCode, '56784')
    assert.equal(discoveryCitySelection(query), '56784')
    assert.equal(parseIntent(discoveryRequestSchema.parse(request), now).city, 'Пловдив')
    assert.equal(discoverySearchInput({ query, cityWasChosen: true }).cityCode, '68134')
  }
  const request = discoverySearchInput({ query: 'Маникюр в София и Пловдив' })
  assert.equal(request.cityCode, undefined)
  assert.equal(parseIntent(discoveryRequestSchema.parse(request), now).clarification.field, 'city')
})

test('neighbourhood selection cannot leak from the default city into an explicitly typed different city', () => {
  assert.equal(discoverySearchInput({ query: 'Маникюр в Пловдив', neighborhood: 'Младост 1' }).neighborhood, undefined)
  assert.equal(discoverySearchInput({ query: 'Маникюр', neighborhood: 'Младост 1' }).neighborhood, 'Младост 1')
})

test('Near me discards the default city and quarter and searches the consented radius, not Sofia', () => {
  const request = discoverySearchInput({ query: 'автомивка', coordinates: origin, neighborhood: 'Младост 1' })
  assert.equal(request.cityCode, undefined); assert.equal(request.neighborhood, undefined)
  assert.deepEqual(request.coordinates, origin)
  assert.equal(request.radiusKm, 5)
  const intent = parseIntent(discoveryRequestSchema.parse(request), now)
  assert.equal(intent.city, null); assert.equal(intent.clarification, null)
  const provider = googleSearchRequest(intent)
  assert.equal(provider.method, 'nearby'); assert.equal(provider.body.locationRestriction.circle.radius, 5000)
  assert.deepEqual(provider.body.locationRestriction.circle.center, { latitude: origin.latitude, longitude: origin.longitude })
})

test('location access is one explicit bounded request with fresh consent, not a background watcher', async () => {
  const calls = []
  const result = await requestDiscoveryLocation({ getCurrentPosition(success, failure, options) {
    calls.push(options); success({ coords: { ...origin, accuracy: 500 } })
  } })
  assert.deepEqual(result, origin); assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 })
})

test('denied, unavailable and timed-out locations are distinct and never return guessed coordinates', async () => {
  for (const [code, expected] of [[1, 'LOCATION_DENIED'], [2, 'LOCATION_UNAVAILABLE'], [3, 'LOCATION_TIMEOUT']]) {
    await assert.rejects(requestDiscoveryLocation({ getCurrentPosition(success, fail) { fail({ code, message: 'private OS message' }) } }), error => error.message === expected)
  }
  for (const coords of [{ latitude: NaN, longitude: 23 }, { latitude: 42.7 }, { latitude: 55, longitude: 23 }, { latitude: 42.7, longitude: 2 }]) {
    await assert.rejects(requestDiscoveryLocation({ getCurrentPosition(success) { success({ coords }) } }), /LOCATION_(?:UNAVAILABLE|OUTSIDE)/)
  }
})

test('missing/insecure API does not request permission; a stalled callback has a bounded deadline', async () => {
  await assert.rejects(requestDiscoveryLocation(undefined), /LOCATION_UNSUPPORTED/)
  let calls = 0
  await assert.rejects(requestDiscoveryLocation({ getCurrentPosition() { calls++ } }, { secure: false }), /LOCATION_INSECURE/)
  assert.equal(calls, 0)
  await assert.rejects(requestDiscoveryLocation({ getCurrentPosition() { calls++ } }, { deadlineMs: 5 }), /LOCATION_TIMEOUT/)
  assert.equal(calls, 1)
})

test('a later explicit retry can succeed after denial, without retaining a location between requests', async () => {
  let attempt = 0
  const geo = { getCurrentPosition(success, fail) { if (++attempt === 1) fail({ code: 1 }); else success({ coords: origin }) } }
  await assert.rejects(requestDiscoveryLocation(geo), /LOCATION_DENIED/)
  assert.deepEqual(await requestDiscoveryLocation(geo), origin)
  assert.equal(attempt, 2)
})

function business(patch = {}) { return { id: 'fixture-only', name: 'Test nails', slug: 'test', industry: 'beauty', city_ekatte: '68134', services: [{ id: 's', name: 'Маникюр', active: true, duration_min: 60, price: 30 }], workingHours: [], ...patch } }

test('nearby internal businesses need verified coordinates inside the radius; unknown distance is not advertised as nearby', () => {
  const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query: 'маникюр', coordinates: origin })), now)
  assert.equal(normalizeInternalBusinesses([business()], intent).length, 0)
  assert.equal(normalizeInternalBusinesses([business({ public_profile: { latitude: origin.latitude, longitude: origin.longitude } })], intent).length, 1)
  assert.equal(normalizeInternalBusinesses([business({ public_profile: { latitude: 43.2, longitude: 27.9 } })], intent).length, 0)
  const cityOnly = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query: 'маникюр' })), now)
  assert.equal(normalizeInternalBusinesses([business()], cityOnly).length, 1)
})

test('discovery reuses genuine operator photos by stable business ID, never a name or slug match', () => {
  const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query: 'маникюр' })), now)
  const own = normalizeInternalBusinesses([business({ id: '450c5c2f-db41-476b-a21e-98cf5ee29194' })], intent)[0]
  assert.equal(own.photos.length, 2); assert.match(own.photos[0].src, /^\/businesses\/vesi-studio\/interior-/)
  assert.deepEqual(normalizeInternalBusinesses([business({ name: 'ВЕСИ СТУДИО', slug: 'vesi-studio' })], intent)[0].photos, [])
})

test('simple form hides secondary controls and diagnostics, keeps readable text and auto-searches only after explicit location success', async () => {
  const ui = await read('components/discovery-search.js'), css = await read('app/discovery.css'), helper = await read('lib/discovery/search-ui.mjs')
  assert.match(ui, /const shortcuts = \['barber', 'nails', 'car_wash'\]/)
  assert.match(ui, /<details className="discovery-filters"><summary>\{copy.filters\}/)
  assert.doesNotMatch(ui, /<details className="discovery-filters"[^>]*\bopen\b|discovery-eyebrow/)
  assert.match(ui, /execute\(payload\(\{ coordinates: position, neighborhood: '' \}\)\)/)
  assert.match(ui, /BusinessPhotoGallery photos=\{row.photos\}/)
  assert.match(ui, /<details className="discovery-ranking"><summary>\{copy.searchDetails\}/)
  assert.match(css, /\.client-finder \.discovery-compact \.discovery-form \{ padding: 0; border: 0;/)
  for (const match of css.matchAll(/font-size:\s*(\d+)px/g)) assert.ok(Number(match[1]) >= 16, `small font: ${match[0]}`)
  for (const source of [ui, helper]) assert.doesNotMatch(source, /localStorage|sessionStorage|watchPosition|console\.|trackProductEvent/)
})

test('Google photos stay in the same native attributed list with supported typography, no extra Details/Photos calls', async () => {
  const source = await read('components/google-discovery-list.js'), css = await read('app/discovery.css')
  assert.equal((source.match(/document.createElement\('gmp-advanced-place-list'\)/g) || []).length, 1)
  assert.match(source, /document.createElement\('gmp-place-media'\)/)
  assert.match(source, /media.setAttribute\('preferred-size', 'large'\)/)
  assert.match(source, /media.setAttribute\('lightbox-preferred', ''\)/)
  assert.match(source, /list.append\(template, attribution\)/)
  assert.doesNotMatch(source, /fetch\(|fetchFields|getURI|photoUri|innerHTML|shadowRoot|gmp-place-reviews/)
  assert.match(css, /--gmp-mat-font-body-small: 400 16px/)
  assert.match(css, /--gmp-mat-font-title-medium: 650 22px/)
})
