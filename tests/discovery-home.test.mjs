import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat, readdir } from 'node:fs/promises'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { HOME_CATEGORY_IDS, HOME_DISCOVERY_COPY, homeCategories, homeFilterCount, defaultHomeFilters, applyHomeFilters, homeBusinessDistance, homeBusinessPhoto, homeBusinesses } from '../lib/discovery/home.mjs'
import { CATEGORY_IDS } from '../lib/discovery/categories.mjs'
import { discoveryCategorySelection, discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { readDirectoryRows, directoryCoordinates } from '../lib/public-directory.mjs'
import { bookingAction } from '../lib/booking-mode.mjs'
import { DateTime } from 'luxon'
import { containDialogTab } from '../lib/dialog-focus.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const origin = { latitude: 42.6627, longitude: 23.2849, consent: true }
const business = (patch = {}) => ({ id: 'public-fixture', slug: 'public-fixture', name: 'Local Fixture', city_ekatte: '68134', neighborhood: 'Манастирски ливади', industry: 'beauty', booking_mode: 'gorez', services: [{ id: 's', name: 'Маникюр', active: true, price: 25, duration_min: 45 }], coordinates: { ...origin }, photos: [], ...patch })

test('homepage uses the exact bilingual heading and truthful browsing title', () => {
  assert.equal(HOME_DISCOVERY_COPY.bg.title, 'Намери услуга. Запази час.')
  assert.equal(HOME_DISCOVERY_COPY.en.title, 'Find a service. Book a time.')
  assert.equal(HOME_DISCOVERY_COPY.bg.explore, 'Разгледай бизнеси')
  assert.equal(HOME_DISCOVERY_COPY.en.explore, 'Explore Businesses')
  for (const key of Object.keys(HOME_DISCOVERY_COPY.bg)) assert.ok(HOME_DISCOVERY_COPY.en[key], key)
})
test('every thumbnail maps exactly to an existing taxonomy id and usable BG/EN category selection', () => {
  assert.deepEqual([...HOME_CATEGORY_IDS].sort(), [...CATEGORY_IDS].sort())
  assert.equal(new Set(HOME_CATEGORY_IDS).size, HOME_CATEGORY_IDS.length)
  for (const locale of ['bg', 'en']) for (const category of homeCategories(locale)) {
    assert.ok(category.label); assert.equal(discoveryCategorySelection('', category.id, locale).category, category.id)
    assert.ok(discoveryRequestSchema.safeParse(discoverySearchInput(discoveryCategorySelection('', category.id, locale))).success)
    assert.equal(category.photo, `/category-photos/${category.id}-v${category.id === 'other' ? 4 : 2}.webp`)
  }
})
test('all fourteen category images retain the owner attachments, including the distinct Other services picture', async () => {
  const manifest = JSON.parse(await read('docs/homepage-category-photos-2026-11-04.json'))
  const own = manifest.assets.filter(row => row.origin !== 'generated')
  assert.equal(own.length, 14); assert.equal(new Set(own.map(row => row.source)).size, 14)
  assert.match(manifest.mode, /Owner-supplied/)
  const sourceGroups = new Set(own.map(row => row.source.split('/')[0]))
  assert.deepEqual([...sourceGroups].sort(), ['B155FE42-F514-478B-B522-304A41594CED', 'BECF761C-5CAF-4865-95F6-C7A7D56354BD', 'D914A4EC-9A84-4943-A760-068512CDA293'])
  assert.equal(manifest.assets.find(row => row.id === 'fitness').source, 'D914A4EC-9A84-4943-A760-068512CDA293/8-Photo-8.jpg')
  assert.equal(manifest.assets.find(row => row.id === 'home_services').source, 'B155FE42-F514-478B-B522-304A41594CED/1-Photo-1.jpg')
  assert.equal(manifest.assets.find(row => row.id === 'health').source, 'B155FE42-F514-478B-B522-304A41594CED/3-Photo-3.jpg')
  assert.ok((await readdir(new URL('../public/category-photos/', import.meta.url))).every(name => /-v[234]\.webp$/.test(name)))
  const other = manifest.assets.find(row => row.id === 'other')
  assert.equal(other.origin, undefined); assert.equal(other.source, 'BECF761C-5CAF-4865-95F6-C7A7D56354BD/1-Photo-1.jpg')
  assert.notEqual(other.source, manifest.assets.find(row => row.id === 'consulting').source)
})
test('all photographic thumbnails have fixed responsive sizes, stripped metadata and a bounded payload', async () => {
  let total = 0
  for (const category of homeCategories()) for (const [src, size] of [[category.photo, 160], [category.photo2x, 240]]) {
    const path = new URL(`../public${src}`, import.meta.url), metadata = await sharp(path.pathname).metadata()
    assert.equal(metadata.format, 'webp'); assert.equal(metadata.width, size); assert.equal(metadata.height, size)
    assert.equal(metadata.exif, undefined); assert.equal(metadata.xmp, undefined)
    const bytes = (await stat(path)).size; total += bytes; assert.ok(bytes < 30000)
  }
  assert.ok(total < 300000, `thumbnail total: ${total}`)
})
test('filters default to Sofia and 2 km, expose honest active counts and reset without clearing natural language', () => {
  const defaults = defaultHomeFilters(), current = { ...defaults, query: 'Маникюр утре след 13:00 ч.', coordinates: origin, cityWasChosen: true }
  assert.equal(homeFilterCount(defaults), 0)
  assert.equal(homeFilterCount({ cityCode: '56784', neighborhood: 'Център', category: 'nails', radiusKm: 1 }), 4)
  const reset = applyHomeFilters(current, { ...defaults, reset: true })
  assert.equal(reset.radiusKm, 2); assert.equal(reset.cityCode, '68134'); assert.equal(reset.coordinates, null)
  assert.equal(reset.cityWasChosen, false); assert.equal(reset.query, current.query)
})
test('filter application carries only supported choices and choosing a city leaves nearby mode', () => {
  const next = applyHomeFilters({ query: 'test', category: '', cityCode: '68134', cityWasChosen: false, coordinates: origin }, { cityCode: '56784', neighborhood: '', category: 'auto_repair', radiusKm: 1 }, 'bg')
  assert.equal(next.query, 'Автосервиз'); assert.equal(next.coordinates, null); assert.equal(next.cityWasChosen, true)
  assert.equal(discoverySearchInput(next).cityCode, '56784')
  const invalid = applyHomeFilters({ query: 'test' }, { cityCode: 'not-a-city', category: '__proto__', radiusKm: 10000 })
  assert.equal(invalid.cityCode, '68134'); assert.equal(invalid.category, ''); assert.equal(invalid.radiusKm, 2)
})
test('nearby filter changes preserve the authorized origin without adding a city or stale quarter', () => {
  const next = applyHomeFilters({ query: 'Маникюр', coordinates: origin, cityCode: '68134', cityWasChosen: false }, { cityCode: '', neighborhood: 'Стар квартал', category: '', radiusKm: 1 })
  assert.deepEqual(next.coordinates, origin); assert.equal(next.neighborhood, ''); assert.equal(next.radiusKm, 1)
  const request = discoverySearchInput(next)
  assert.deepEqual(request.coordinates, origin); assert.equal(request.cityCode, undefined); assert.equal(request.neighborhood, undefined)
})
test('opening and applying filters cannot replace an ambiguous typed city with a fabricated manual choice', () => {
  const next = applyHomeFilters({ query: 'Маникюр в София и Пловдив', category: '', coordinates: null, cityCode: '68134', cityWasChosen: false }, { cityCode: '', neighborhood: '', category: '', radiusKm: 2 })
  assert.equal(next.cityCode, ''); assert.equal(next.cityWasChosen, false); assert.equal(next.coordinates, null)
  const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput(next)), DateTime.fromISO('2026-11-04T10:00:00Z'))
  assert.equal(intent.clarification.field, 'city')
})
test('natural-language dates, time, locale and API validation still use the existing parser', () => {
  const now = DateTime.fromISO('2026-11-04T10:00:00Z')
  for (const query of ['Маникюр утре след 13:00 ч.', 'Manicure tomorrow after 1 PM']) {
    const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query })), now)
    assert.equal(intent.category, 'nails'); assert.equal(intent.date, '2026-11-05'); assert.equal(intent.timeFrom, '13:00')
  }
})
test('the default carousel includes only public businesses from the established city and does not invent distances', () => {
  const rows = homeBusinesses([business(), business({ id: 'elsewhere', city_ekatte: '56784' }), business({ id: 'inactive', active: false }), business({ id: 'pending', platform_status: 'pending' }), business({ id: 'unsafe', slug: '../private' })])
  assert.equal(rows.length, 1); assert.equal(rows[0].distanceKm, null)
  assert.equal(homeBusinessDistance(business(), null), null); assert.equal(homeBusinessDistance(business(), { ...origin, consent: false }), null)
})
test('nearby carousel respects actual 2 km / 1 km constraints, nearest-first order and unknown-point exclusion', () => {
  const far = business({ id: 'far', coordinates: { latitude: origin.latitude + .025, longitude: origin.longitude } })
  const middle = business({ id: 'middle', coordinates: { latitude: origin.latitude + .014, longitude: origin.longitude } })
  const near = business({ id: 'near', coordinates: { latitude: origin.latitude + .002, longitude: origin.longitude } })
  const rows = [far, middle, business({ id: 'unknown', coordinates: null }), near]
  assert.deepEqual(homeBusinesses(rows, { coordinates: origin }).map(row => row.id), ['near', 'middle'])
  assert.deepEqual(homeBusinesses(rows, { coordinates: origin, radiusKm: 1 }).map(row => row.id), ['near'])
  assert.ok(homeBusinesses(rows, { coordinates: origin })[0].distanceKm > 0)
})
test('manual quarter and service constraints cannot be overridden for partner visibility', () => {
  const vruhbnitsa = business({ id: 'elsewhere', neighborhood: 'Връбница' })
  const wrongService = business({ id: 'wrong', services: [{ id: 'b', name: 'Оформяне на брада', active: true }] })
  assert.deepEqual(homeBusinesses([vruhbnitsa, wrongService, business()], { neighborhood: 'Манастирски ливади', category: 'nails' }).map(row => row.id), ['public-fixture'])
})
test('carousel limits are bounded and alphabetical browsing never fabricates popularity or ratings', () => {
  const rows = Array.from({ length: 30 }, (_, i) => business({ id: `id-${i}`, name: `Business ${String(i).padStart(2, '0')}` }))
  const result = homeBusinesses(rows.reverse(), { limit: 500 })
  assert.equal(result.length, 12); assert.equal(result[0].name, 'Business 00')
  assert.equal(result[0].rating, undefined); assert.equal(result[0].popularityScore, undefined)
})
test('business photographs accept only actual public media paths, never generic category art or copied Google photos', () => {
  const photo = src => homeBusinessPhoto(business({ photos: [{ src }] }))
  assert.ok(photo('/businesses/vesi-studio/interior-20261026.webp'))
  assert.ok(photo('/api/business-media/11111111-1111-4111-8111-111111111111'))
  for (const src of ['/category-photos/hair-v2.webp', '/category-art/hair-v1.webp', 'https://maps.googleapis.com/photo', 'https://example.com/a.jpg', 'javascript:alert(1)']) assert.equal(photo(src), null)
})
test('the directory exposes only valid public coordinate pairs, not guessed locations or null-as-zero coercion', () => {
  assert.deepEqual(directoryCoordinates(origin), { latitude: origin.latitude, longitude: origin.longitude })
  for (const row of [{}, { latitude: null, longitude: null }, { latitude: 42, longitude: null }, { latitude: '42', longitude: '23' }, { latitude: Infinity, longitude: 23 }, { latitude: 91, longitude: 23 }]) assert.equal(directoryCoordinates(row), null)
})
test('public map point selection encodes only two JSON scalars, retaining publication filters and rate-safe own-data reads', async () => {
  let called
  const db = createClient('https://project.example.com', 'test-public-fixture', { global: { fetch: async (url, init) => { called = new URL(url); return Response.json([], { headers: { 'Content-Range': '0-0/0' } }) } } })
  assert.deepEqual(await readDirectoryRows(db), [])
  const fields = called.searchParams.get('select')
  assert.match(fields, /latitude:public_profile->latitude,longitude:public_profile->longitude/)
  assert.doesNotMatch(fields.replace('latitude:public_profile->latitude,longitude:public_profile->longitude,', ''), /public_profile|owner_id|contact_email|customers|appointments|token/)
  assert.equal(called.searchParams.get('active'), 'eq.true'); assert.equal(called.searchParams.get('platform_status'), 'eq.enabled')
})
test('both partner booking modes retain fixed first-party entry points and current booking revalidation', () => {
  assert.equal(bookingAction(business(), 'en').href, '/book/public-fixture?lang=en')
  assert.equal(bookingAction(business({ booking_mode: 'external' }), 'bg').href, '/out/business/public-fixture?lang=bg')
})
test('compact homepage composes existing search with native rails and no hero registration banner', async () => {
  const home = await read('components/home-page.js'), search = await read('components/discovery-search.js')
  assert.match(home, /accountDeleted=\{accountDeleted\} home directoryData=/)
  assert.match(search, /home \? homeCopy\.title : copy\.title/)
  assert.match(search, /!compact && !home && <DiscoveryRouteArt/)
  assert.match(search, /!home && !compact && <div className="discovery-partner-entry"/)
  assert.ok(search.indexOf('title={homeCopy.categories}') < search.indexOf('<DiscoveryHomeBusinesses'))
  assert.equal((search.match(/<DiscoveryHomeBusinesses /g) || []).length, 1)
  assert.doesNotMatch(search, /className="discovery-results"|className="discovery-understood"|className="discovery-source-tabs"/)
  assert.ok(search.indexOf('<DiscoveryHomeBusinesses') < search.indexOf('<DiscoveryHomeBottom'))
})
test('folded-map toggle requests permission on entry, exposes actual on/off state and ignores stale grants', async () => {
  const search = await read('components/discovery-search.js')
  assert.match(search, /aria-haspopup="dialog" aria-expanded=\{filtersOpen\}/)
  assert.match(search, /aria-label=\{locating \? copy.locating : homeCopy.location\}/)
  assert.match(search, /home-inline-location[^\n]*aria-pressed=\{locationEnabled\}[^\n]*<Icon name="map"/)
  assert.match(search, /if \(!automatic && locationEnabled\) \{[\s\S]*?locationVersion.current\+\+[\s\S]*?setCoordinates\(null\)[\s\S]*?return null/)
  assert.match(search, /useState\(home \|\| Boolean\(initialInput\?\.coordinates\)\)/)
  assert.match(search, /locate\(\{ automatic: true, searchAfter: false \}\)/)
  assert.match(search, /onSubmit=\{submit\}/); assert.match(search, /type="submit"/)
  assert.match(search, /if \(searchAfter && canDiscover\(\)\) execute/)
  assert.match(search, /350/); assert.match(search, /controller\.current\?\.abort\(\)/)
  assert.doesNotMatch(search, /watchPosition|localStorage|sessionStorage/)
})
test('turning location off removes coordinates and expansion while retaining the chosen city and service', () => {
  const current = { query: 'Маникюр утре след 13:00 ч.', category: 'nails', locale: 'bg', cityCode: '56784', cityWasChosen: true, coordinates: origin, neighborhood: '', radiusKm: 2, expandNearby: true }
  const enabled = discoverySearchInput(current)
  assert.deepEqual(enabled.coordinates, origin); assert.equal(enabled.expandNearby, true); assert.equal(enabled.cityCode, undefined)
  const disabled = discoverySearchInput({ ...current, coordinates: null, neighborhood: '' })
  assert.equal(disabled.coordinates, undefined); assert.equal(disabled.expandNearby, undefined)
  assert.equal(disabled.cityCode, '56784'); assert.equal(disabled.category, 'nails'); assert.equal(disabled.radiusKm, 2)
  assert.equal(disabled.query, current.query); assert.equal(disabled.locale, current.locale)
  assert.deepEqual(homeBusinesses([business()], { coordinates: null })[0].distanceKm, null)
})
test('the short bilingual placeholder is legible and no applied-options summary appears above the bar', async () => {
  const search = await read('components/discovery-search.js'), css = await read('app/discovery-home.css'), icons = await read('components/icon.js')
  assert.equal(DISCOVERY_COPY.bg.placeholder, 'Пиши тук…'); assert.equal(DISCOVERY_COPY.en.placeholder, 'Type here…')
  assert.match(search, /placeholder=\{copy.placeholder\}/)
  assert.doesNotMatch(search + css, /home-search-origin|home-location-ready/)
  assert.match(search, /title=\{locating \? copy.locating : locationAction\}/)
  assert.match(css, /\.home-inline-location\.is-active \{[^}]*color: #17683f/)
  assert.match(icons, /map: <>[\s\S]*?fill="currentColor" stroke="none"/)
  for (const locale of ['bg', 'en']) for (const key of ['location', 'locationOn', 'locationOff', 'locationEnabled', 'locationDisabled']) assert.ok(HOME_DISCOVERY_COPY[locale][key])
})
test('filter sheet uses native modal focus/keyboard semantics, explicit apply/reset and no network calls', async () => {
  const sheet = await read('components/discovery-filter-sheet.js')
  assert.match(sheet, /node.showModal\(\)/); assert.match(sheet, /onCancel=\{onClose\}/)
  assert.match(sheet, /triggerRef.current\?\.focus/); assert.match(sheet, /aria-labelledby=/)
  assert.match(sheet, /onKeyDown=\{event => containDialogTab/)
  assert.match(sheet, /defaultHomeFilters\(\)/); assert.match(sheet, /onApply\(draft\)/)
  for (const field of ['cityCode', 'neighborhood', 'category', 'radiusKm']) assert.match(sheet, new RegExp(`draft\\.${field}`))
  assert.doesNotMatch(sheet, /fetch\(|google|geolocation|trackProductEvent/)
})
test('dialog Tab cycling covers forward/backward boundaries, hidden fields and WebKit button skipping', () => {
  const focused = [], field = (name, visible = true) => ({ name, tabIndex: 0, getClientRects: () => visible ? [{}] : [], focus: () => focused.push(name) })
  const close = field('close'), city = field('city'), hidden = field('hidden', false), apply = field('apply')
  const dialog = { querySelectorAll: () => [close, city, hidden, apply], ownerDocument: { activeElement: apply }, focus: () => focused.push('dialog') }
  let prevented = 0
  const event = { key: 'Tab', shiftKey: false, preventDefault: () => prevented++ }
  assert.equal(containDialogTab(event, dialog), true); assert.deepEqual(focused, ['close'])
  dialog.ownerDocument.activeElement = close
  containDialogTab({ ...event, shiftKey: true }, dialog); assert.equal(focused.at(-1), 'apply')
  dialog.ownerDocument.activeElement = city
  containDialogTab(event, dialog); assert.equal(focused.at(-1), 'apply')
  assert.equal(containDialogTab({ ...event, key: 'Escape' }, dialog), false)
  assert.equal(prevented, 3)
})
test('native carousels expose real scroll controls and keep all photographic choices reachable without autoplay', async () => {
  const rail = await read('components/discovery-home-rail.js'), css = await read('app/discovery-home.css'), search = await read('components/discovery-search.js')
  assert.match(rail, /node\.scrollBy/); assert.match(rail, /aria-controls=\{id\}/); assert.match(rail, /tabIndex=\{0\}/)
  assert.match(rail, /prefers-reduced-motion/); assert.doesNotMatch(rail, /setInterval|fetch\(|cloneNode/)
  assert.match(css, /overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-inline: contain/)
  assert.match(css, /\.home-discovery-rail > li \{[^}]*scroll-snap-align: start/)
  assert.match(search, /homeCategories\(locale\).map/); assert.match(search, /loading=\{index < 4 \? 'eager' : 'lazy'\}/)
})
test('the single browse rail uses actual photos/reviews and only server-budgeted Google plans', async () => {
  const browse = await read('components/discovery-home-browse.js'), card = await read('components/discovery-business-card.js')
  assert.match(browse, /useDirectory/); assert.match(card, /homeBusinessPhoto\(row\)/)
  assert.match(card, /loading="lazy"/); assert.match(card, /Number.isFinite\(row.distanceKm\)/)
  assert.match(card, /useBusinessReviews\(row.slug/)
  assert.match(card, /OutboundBookingButton business=\{row\}/)
  assert.match(browse, /google\(result\?\.external, 'near-google'\)/)
  assert.doesNotMatch(browse, /fetch\(|googleapis|Most Popular|Най-популярни/)
})
test('the bottom section follows discovery content with the existing locale-aware partner and onboarding routes', async () => {
  const browse = await read('components/discovery-home-browse.js')
  assert.match(browse, /home-discovery-bottom/)
  assert.match(browse, /href=\{`\/partners\?lang=\$\{locale\}`\}/)
  assert.match(browse, /href=\{`\/for-businesses\?lang=\$\{locale\}`\}/)
  assert.equal(HOME_DISCOVERY_COPY.bg.register, 'Регистрирай бизнеса си безплатно')
})
test('development fixture cannot publish fictional businesses, locations or bookings', async () => {
  const page = await read('app/dev/homepage/page.js'), fixture = await read('app/dev/homepage/preview.js')
  assert.match(page, /process.env.NODE_ENV !== 'development' \|\| !discoveryConfig\(process.env\).devMock\) notFound\(\)/)
  assert.match(fixture, /home preview directoryData=/); assert.match(fixture, /ЛОКАЛЕН ПРЕГЛЕД/)
  assert.doesNotMatch(fixture, /fetch\(|\.from\(|signIn|GoogleDiscoveryList|trackProductEvent/)
})
