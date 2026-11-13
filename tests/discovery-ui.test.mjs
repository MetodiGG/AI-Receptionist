import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { DEFAULT_DISCOVERY_CITY, DISCOVERY_SHORTCUTS, discoveryCategorySelection, discoveryCitySelection, discoverySearchInput, requestDiscoveryLocation } from '../lib/discovery/search-ui.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'
import { normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { DEFAULT_DISCOVERY_RADIUS_KM, DISCOVERY_RADIUS_CHOICES } from '../lib/discovery/defaults.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { categoryById } from '../lib/discovery/categories.mjs'
import { getIndustryLabel } from '../lib/public-locale.mjs'
import { matchingServices } from '../lib/discovery/internal-search.mjs'

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
  assert.equal(request.radiusKm, 2)
  const intent = parseIntent(discoveryRequestSchema.parse(request), now)
  assert.equal(intent.city, null); assert.equal(intent.clarification, null)
  const provider = googleSearchRequest(intent)
  assert.equal(provider.method, 'nearby'); assert.equal(provider.body.locationRestriction.circle.radius, 2000)
  assert.deepEqual(provider.body.locationRestriction.circle.center, { latitude: origin.latitude, longitude: origin.longitude })
  const oneKm = discoverySearchInput({ query: 'автомивка', radiusKm: 1, coordinates: origin })
  assert.equal(googleSearchRequest(parseIntent(discoveryRequestSchema.parse(oneKm), now)).body.locationRestriction.circle.radius, 1000)
})

test('location access is one explicit bounded request with fresh consent, not a background watcher', async () => {
  const calls = [], timestamp = Date.now()
  const result = await requestDiscoveryLocation({ getCurrentPosition(success, failure, options) {
    calls.push(options); success({ coords: { ...origin, accuracy: 25 }, timestamp })
  } })
  assert.deepEqual(result, { ...origin, accuracyMeters: 25, observedAt: timestamp }); assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
})

test('denied, unavailable and timed-out locations are distinct and never return guessed coordinates', async () => {
  for (const [code, expected] of [[1, 'LOCATION_DENIED'], [2, 'LOCATION_UNAVAILABLE'], [3, 'LOCATION_TIMEOUT']]) {
    await assert.rejects(requestDiscoveryLocation({ getCurrentPosition(success, fail) { fail({ code, message: 'private OS message' }) } }), error => error.message === expected)
  }
  for (const coords of [{ latitude: NaN, longitude: 23 }, { latitude: 42.7 }, { latitude: 55, longitude: 23 }, { latitude: 42.7, longitude: 2 }]) {
    await assert.rejects(requestDiscoveryLocation({ getCurrentPosition(success) { success({ coords }) } }), /LOCATION_(?:UNAVAILABLE|OUTSIDE)/)
  }
})

test('permission denial uses the requested BG/EN city-centre fallback message, not technical error instructions', async () => {
  assert.equal(DISCOVERY_COPY.bg.locationDenied, 'Разрешете достъп до Вашата локация за намирането на бизнеси близо до Вас. Ако не е разрешена, ще Ви се показват резултати от центъра на съответния град.')
  assert.equal(DISCOVERY_COPY.en.locationDenied, 'Allow access to your location to find businesses near you. If location access is not allowed, results will be shown from the centre of the selected city.')
  await assert.rejects(requestDiscoveryLocation({getCurrentPosition(success,fail){fail({code:1})}}), /LOCATION_DENIED/)
  for(const locale of ['bg','en']){
    assert.notEqual(DISCOVERY_COPY[locale].locationDenied,DISCOVERY_COPY[locale].locationTimeout)
    assert.notEqual(DISCOVERY_COPY[locale].locationDenied,DISCOVERY_COPY[locale].locationUnavailable)
  }
  const ui=await read('components/discovery-search.js')
  assert.match(ui,/discoveryLocationMessage\(locationError, \{ disabled: home && !locationEnabled && !locating \}, locale\)/)
  assert.match(ui,/setCoordinates\(null\); setLocationError\(failure.message\)/)
  const fallback=discoverySearchInput({query:'Маникюр',cityCode:'56784',cityWasChosen:true,coordinates:null})
  assert.equal(fallback.cityCode,'56784')
  assert.equal(Object.hasOwn(fallback,'coordinates'),false,'no denied user location is guessed or submitted')
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
  const timestamp = Date.now()
  const geo = { getCurrentPosition(success, fail) { if (++attempt === 1) fail({ code: 1 }); else success({ coords: { ...origin, accuracy: 25 }, timestamp }) } }
  await assert.rejects(requestDiscoveryLocation(geo), /LOCATION_DENIED/)
  assert.deepEqual(await requestDiscoveryLocation(geo), { ...origin, accuracyMeters: 25, observedAt: timestamp })
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
  assert.match(ui, /DISCOVERY_SHORTCUTS\.map\(id/)
  assert.match(ui, /<details className="discovery-filters"><summary>\{copy.filters\}/)
  assert.doesNotMatch(ui, /<details className="discovery-filters"[^>]*\bopen\b|discovery-eyebrow/)
  assert.match(ui, /execute\(payload\(\{ coordinates: position, neighborhood: '' \}\)\)/)
  assert.match(ui, /<label>\{copy.radius\}<select value=\{radiusKm\}/)
  assert.match(ui, /DISCOVERY_RADIUS_CHOICES\.map\(radius/)
  const card = await read('components/discovery-business-card.js')
  assert.match(card, /homeBusinessPhoto\(row\)/)
  assert.doesNotMatch(ui, /className="discovery-ranking"|className="discovery-understood"|className="discovery-results"/)
  assert.match(css, /\.client-finder \.discovery-compact \.discovery-form \{ padding: 0; border: 0;/)
  for (const match of css.matchAll(/font-size:\s*(\d+)px/g)) assert.ok(Number(match[1]) >= 16, `small font: ${match[0]}`)
  for (const source of [ui, helper]) assert.doesNotMatch(source, /localStorage|sessionStorage|watchPosition|console\.|trackProductEvent/)
})

test('the placeholder is short while natural-language manicure/date/time examples still parse', async () => {
  assert.equal(DISCOVERY_COPY.bg.placeholder, 'Пиши тук…')
  assert.equal(DISCOVERY_COPY.en.placeholder, 'Type here…')
  const examples = { bg: 'маникюр, утре след 13:00ч.', en: 'manicure, tomorrow after 1:00 pm' }
  for (const locale of ['bg', 'en']) {
    const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query: examples[locale], locale })), now)
    assert.equal(intent.category, 'nails')
    assert.equal(intent.date, '2026-10-28')
    assert.equal(intent.timeFrom, '13:00')
    assert.equal(intent.cityCode, '68134')
    assert.equal(intent.clarification, null)
  }
  const css = await read('app/solar.css')
  assert.match(css, /@media \(max-width: 380px\) \{\s*\.discovery-query \{ display: grid; grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(css, /\.discovery-submit > span:last-child \{ display: inline; \}/)
})

test('five primary shortcuts include a distinct Auto repair without exposing a Fitness option', async () => {
  const ids = DISCOVERY_SHORTCUTS
  assert.equal(new Set(ids).size, 5)
  assert.deepEqual(ids.map(id => categoryById(id).bg), ['Фризьор', 'Маникюр', 'Автомивка', 'Спорт', 'Автосервиз'])
  assert.equal(categoryById('fitness').en, 'Sports')
  assert.equal(categoryById('fitness').icon, 'racket')
  assert.equal(getIndustryLabel('fitness', 'bg'), 'Спорт')
  assert.equal(getIndustryLabel('fitness', 'en'), 'Sports')
  for (const file of ['components/business-setup.js', 'app/dashboard/settings/page.js']) {
    assert.match(await read(file), /<option value="fitness">\{en \? 'Sports' : 'Спорт'\}/)
  }
})

test('both category controls fill the search in BG/EN, including switching a non-empty query', async () => {
  for (const locale of ['bg', 'en']) for (const category of ['auto_repair', 'car_wash', 'hair', 'nails', 'fitness']) {
    for (const previous of ['', 'Маникюр', 'car wash']) {
      const selected = discoveryCategorySelection(previous, category, locale)
      assert.deepEqual(selected, { category, query: categoryById(category)[locale] })
      const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ ...selected, locale })), now)
      assert.equal(intent.category, category); assert.equal(intent.clarification, null)
    }
  }
  assert.deepEqual(discoveryCategorySelection('смяна на масло', ''), { category: '', query: 'смяна на масло' })
  for (const invalid of ['__proto__', 'constructor', 'unknown']) assert.equal(discoveryCategorySelection('existing', invalid).query, 'existing')
  const ui = await read('components/discovery-search.js')
  assert.match(ui, /onClick=\{\(\) => chooseCategory\(id\)\}/)
  assert.match(ui, /onChange=\{event => chooseCategory\(event.target.value\)\}/)
  const handler = ui.slice(ui.indexOf('function chooseCategory('), ui.indexOf('function execute('))
  assert.doesNotMatch(handler, /fetch\(|search\(|locate\(/)
  assert.match(handler, /if \(\(home \|\| coordinates\) && selected.category\) execute\(payload\(selected\)\)/)
  assert.match(ui, /categoryBrowse: home/)
})

test('Sports recognises bookable activities without renaming stored identifiers or replacing a requested activity', () => {
  const sport = categoryById('fitness')
  assert.equal(sport.industry, 'fitness')
  assert.deepEqual(sport.types, ['sports_coaching', 'sports_school', 'yoga_studio', 'tennis_court'])
  for (const query of ['спорт', 'sports', 'personal trainer', 'йога', 'пилатес', 'тенис', 'dance', 'boxing', 'swimming']) {
    const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query })), now)
    assert.equal(intent.category, 'fitness', query)
    assert.equal(intent.clarification, null, query)
    const provider = googleSearchRequest(intent)
    assert.equal(provider.method, 'text')
    assert.doesNotMatch(JSON.stringify(provider.body), /gym|fitness_center/)
    if (['спорт', 'sports'].includes(query)) assert.match(provider.body.textQuery, /^спортни занимания и тренировки, /)
    if (query === 'тенис') assert.match(provider.body.textQuery, /^тенис, /)
  }
  const services = ['Йога', 'Пилатес', 'Тенис', 'Танци', 'Бокс', 'Плуване'].map((name, index) => ({ id: String(index), name, active: true, duration_min: 60 }))
  for (const name of ['пилатес', 'тенис', 'танци', 'бокс', 'плуване']) {
    const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query: name })), now)
    assert.deepEqual(matchingServices({ name: 'QA Studio', services }, intent).map(service => service.name.toLowerCase()), [name])
  }
})

test('two kilometres is the shared form, request and server default; explicit radius choices remain intact', async () => {
  assert.equal(DEFAULT_DISCOVERY_RADIUS_KM, 2)
  assert.deepEqual(DISCOVERY_RADIUS_CHOICES, [1, 2, 3, 5, 10, 25])
  assert.equal(discoverySearchInput({ query: 'маникюр' }).radiusKm, 2)
  assert.equal(discoveryRequestSchema.parse({ query: 'маникюр София' }).radiusKm, 2)
  const ui = await read('components/discovery-search.js')
  assert.match(ui, /initialInput\?\.radiusKm \?\? DEFAULT_DISCOVERY_RADIUS_KM/)
  for (const radiusKm of DISCOVERY_RADIUS_CHOICES) {
    const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query: 'автомивка', coordinates: origin, radiusKm })), now)
    assert.equal(googleSearchRequest(intent).body.locationRestriction.circle.radius, radiusKm * 1000)
  }
  for (const radiusKm of [0, 26, 1.5]) assert.equal(discoveryRequestSchema.safeParse({ query: 'маникюр София', radiusKm }).success, false)
})

test('radius helpers are not visible; location consent, error recovery and accessible privacy information stay available', async () => {
  const ui = await read('components/discovery-search.js'), legal = await read('components/legal-page.js'), footer = await read('components/site-footer.js')
  assert.doesNotMatch(ui, /className="discovery-help"|\{copy\.privacy\}/)
  assert.match(ui, /<span className="sr-only" id=\{compact \? 'home-location-info' : 'location-info'\}>\{copy.locationInfo\}<\/span>/)
  assert.match(ui, /aria-describedby=\{compact \? 'home-location-info' : 'location-info'\}/)
  assert.match(ui, /locationMessage && <p className="discovery-notice" role="status">/)
  assert.match(ui, /locationProvider = requestDiscoveryLocation/)
  assert.match(ui, /locationProvider\(navigator.geolocation/)
  assert.match(footer, /\/privacy\?lang=/)
  assert.match(legal, /Началната страница иска от браузъра разрешение за местоположение при отваряне/)
  assert.match(legal, /Координатите се използват само след разрешение/)
  assert.match(legal, /началната страница автоматично зарежда ограничен подбор от бизнеси/)
  assert.match(legal, /без да изпраща точни координати за него/)
})

test('legacy results keep their registration CTA while the compact homepage moves onboarding to the bottom', async () => {
  const ui = await read('components/discovery-search.js'), route = await read('app/for-businesses/page.js')
  assert.match(ui, /\{!home && !compact && <div className="discovery-partner-entry">/)
  assert.match(ui, /\{home && <DiscoveryHomeBottom locale=\{locale\}\/>\}/)
  assert.match(ui, /<Link className="discovery-business-cta" href=\{`\/for-businesses\?lang=\$\{locale\}`\}/)
  assert.match(ui, /<span>\{copy.registerBusiness\}<\/span>/)
  assert.equal(DISCOVERY_COPY.bg.registerBusiness, 'Регистрирай бизнеса си безплатно')
  assert.equal(DISCOVERY_COPY.en.registerBusiness, 'Register your business for free')
  assert.match(route, /<BusinessOnboarding/)
})

test('registration CTA is larger, truly centred, high contrast and gently glowing in the current Solar theme', async () => {
  const css = await read('app/discovery.css'), solar = await read('app/solar.css')
  assert.match(css, /\.discovery-business-cta \{[^}]*grid-template-columns: 24px minmax\(0, 1fr\) 24px/)
  assert.match(css, /\.discovery-business-cta span \{[^}]*grid-column: 2;[^}]*text-align: center/)
  assert.match(css, /\.discovery-business-cta svg \{ grid-column: 3;/)
  assert.match(css, /font-size: 22px; font-weight: 800/)
  assert.match(css, /\.discovery-business-cta \{ padding: 18px 16px; font-size: 20px;/)
  assert.match(solar, /animation: solar-cta-glow 4s ease-in-out infinite/)
  assert.match(solar, /@media \(prefers-reduced-motion: reduce\) \{[^}]*\.discovery-business-cta \{ animation: none;/)
  assert.match(solar, /\.discovery-search \.discovery-business-cta:focus-visible \{ outline-color: #b94315;/)
  const luminance = hex => hex.match(/\w{2}/g).map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0)
  for (const background of ['242429', '353137', '463029']) assert.ok((luminance('fff7ef') + .05) / (luminance(background) + .05) >= 7)
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
