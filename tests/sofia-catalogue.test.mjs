import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueRecordSchema, approvedCatalogueRecord, validateCatalogue, EXCLUDED_GENERAL_CLINIC_IDS } from '../lib/discovery/catalogue-policy.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses, isCataloguePartnerDuplicate } from '../lib/discovery/catalogue-search.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { railDirections, railExternalAction, orderedRailRows } from '../lib/discovery/rail.mjs'
import { distanceBadge, discoveryDistanceOrigin } from '../lib/discovery/distance-origin.mjs'
import { createPartnerRatingHandler } from '../lib/discovery/partner-ratings.mjs'
import { createGoogleCardGrantHandler } from '../lib/discovery/google-card-grant.mjs'
import { currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { NEIGHBORHOOD_20261111_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261111.mjs'

const now = DateTime.fromISO('2026-11-11T12:00:00Z'), clock = now.toMillis()
const noProvider = () => assert.fail('Free catalogue must never call Google, AI, auth or a paid budget')
const deps = patch => ({ config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), now, allowAttempt: async () => true,
  readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE,
  claimBudget: noProvider, fetcher: noProvider, authorizeGoogle: noProvider,
  readPartnerPlaces: noProvider, readLinks: noProvider, readBookablePlaces: noProvider,
  getBusiness: noProvider, getSlots: noProvider, ...patch })
const input = patch => discoveryRequestSchema.parse({ query: 'маникюр', cityCode: '68134', ...patch })
const intent = patch => ({ ...parseIntent(input(patch), now, { v2: true }), searchV2: true })
const record = patch => ({ ...structuredClone(SOFIA_CATALOGUE[0]), ...patch })
const business = patch => ({ id: '10000000-0000-4000-8000-000000000001', name: 'QA partner', slug: 'qa-partner', city_ekatte: '68134', city: 'София', industry: 'pets', active: true, platform_status: 'enabled', neighborhood: 'Борово', address: 'QA address', public_profile: { latitude: 42.67, longitude: 23.29 }, services: [{ id: 's1', name: 'Груминг за кучета', active: true, duration_min: 60 }], ...patch })

test('free catalogue is the default and closes every metered flag even with old credentials configured', () => {
  const config = discoveryConfig({ DISCOVERY_ENABLED: 'true', GOOGLE_PLACES_ENABLED: 'true', GOOGLE_PLACES_REST_USE_APPROVED: 'true', GOOGLE_PLACES_BILLING_REGION: 'NON_EEA', GOOGLE_PLACES_UI_KIT_ENABLED: 'true', GOOGLE_PLACES_UI_KIT_APPROVED: 'true', GOOGLE_DISCOVERY_CARDS_ENABLED: 'true', GOOGLE_PARTNER_RATINGS_ENABLED: 'true', GOOGLE_PLACES_DETAILS_ENABLED: 'true', DISCOVERY_AI_ENABLED: 'true', OPENAI_API_KEY: 'fake', GOOGLE_MAPS_BROWSER_KEY: 'fake' })
  assert.equal(config.providerMode, 'catalogue')
  for (const key of ['googleEnabled', 'uiKitEnabled', 'partnerRatingsEnabled', 'googleCardsEnabled', 'detailsEnabled', 'aiEnabled']) assert.equal(config[key], false, key)
  assert.equal(config.perMinute, 30); assert.equal(config.maxResults, 15)
  assert.equal(discoveryConfig({ DISCOVERY_CATALOGUE_REQUESTS_PER_MINUTE: '999999' }).perMinute, 0)
  assert.equal(discoveryConfig({ DISCOVERY_PROVIDER_MODE: 'typo' }).providerMode, 'catalogue')
})
test('even an injected stale config cannot bypass the catalogue no-provider branch', async () => {
  for (const query of ['маникюр', 'unrecognised service', 'джу джицу', 'груминг утре след 13:00']) {
    const result = await discoverBusinesses(input({ query }), deps({ config: { ...deps().config, aiEnabled: true, aiKey: 'fake', googleEnabled: true, uiKitEnabled: true, googleCardsEnabled: true, partnerRatingsEnabled: true } }))
    assert.equal(result.external ?? null, null); assert.equal(result.furtherExternal ?? null, null)
    assert.doesNotMatch(JSON.stringify(result), /browserKey|fake|ui_kit|places\.googleapis|model/)
  }
})
test('100 concurrent local searches consume no Google/model grants or provider requests', async () => {
  const responses = await Promise.all(Array.from({ length: 100 }, (_, index) => discoverBusinesses(input({ query: index % 2 ? 'маникюр' : 'груминг' }), deps())))
  assert.equal(responses.length, 100)
  assert.ok(responses.every(response => response.externalStatus === 'catalogue' && response.results.length > 0 && response.external === null))
})
test('the expanded individually sourced catalogue is committed; records are not synthetic ratings or partner accounts', () => {
  assert.ok(validateCatalogue(SOFIA_CATALOGUE).length >= 200)
  for (const row of SOFIA_CATALOGUE) {
    if (EXCLUDED_GENERAL_CLINIC_IDS.includes(row.id)) assert.equal(approvedCatalogueRecord(row, clock), null, row.id)
    else assert.ok(approvedCatalogueRecord(row, clock), row.id)
    assert.match(row.verification.booking.url, /^https:\/\//)
    const evidenceHost=new URL(row.verification.booking.url).hostname.replace(/^www\./, ''), ownerHost=new URL(row.website).hostname.replace(/^www\./, '')
    const explicitProviderReview = NEIGHBORHOOD_20261111_REVIEWS.find(review => review.id === row.id &&
      review.bookingReview === 'provider_booking_reviewed' && review.bookingEntry === row.verification.booking.url &&
      review.reviewedUrls.includes(row.website) && review.reviewedUrls.includes(row.verification.booking.url))
    assert.ok(evidenceHost===ownerHost || evidenceHost.endsWith(`.${ownerHost}`) || explicitProviderReview,row.id)
    assert.doesNotMatch(JSON.stringify(row), /rating|reviewCount|placeId|maps\.google|googleusercontent|gstatic|demo|fixture/i)
  }
})
test('bad destinations, fake eligibility, arbitrary fields and unlicensed photos fail closed', () => {
  for (const url of ['javascript:alert(1)', 'http://business.bg/', 'https://localhost/', 'https://127.0.0.1/', 'https://[::1]/', 'https://business.bg/?redirect=https://elsewhere.bg', 'https://user:pass@business.bg/']) {
    assert.equal(catalogueRecordSchema.safeParse(record({ booking: { kind: 'form', url } })).success, false, url)
  }
  for (const patch of [{ rating: 5 }, { placeId: 'CACHED_GOOGLE' }, { photo: { src: '/catalogue-media/test.webp', alt: 'Test photo' } }, { booking: { kind: 'phone', phone: '+359888000000' } }, { cityCode: '56784' }]) assert.equal(catalogueRecordSchema.safeParse(record(patch)).success, false)
  for (const [category, model] of [['car_wash', 'self_service'], ['fitness', 'gym_entry'], ['home_services', 'retail'], ['other', 'walk_in_lab']]) {
    assert.equal(catalogueRecordSchema.safeParse(record({ services: [{ name: 'Not an appointment', category, appointmentModel: model }] })).success, false)
  }
  for (const [category, name] of [['fitness', 'Обикновен достъп до фитнес'], ['home_services', 'Магазин за материали'], ['other', 'Лабораторни изследвания']]) {
    assert.equal(catalogueRecordSchema.safeParse(record({ services: [{ name, category, appointmentModel: 'appointment' }] })).success, false)
  }
  for (const [category, name, appointmentModel] of [['car_wash', 'Автомивка на самообслужване', 'appointment'], ['fitness', 'Gym entry', 'individual_training'], ['home_services', 'Магазин за материали', 'home_visit']]) {
    assert.equal(catalogueRecordSchema.safeParse(record({ services: [{ category, name, appointmentModel }] })).success, false)
  }
})
test('draft, rejected, future and expired records cannot appear and never auto-renew', () => {
  for (const patch of [{ status: 'draft' }, { status: 'rejected' }, { checkedOn: '2026-11-12', validUntil: '2027-02-03' }, { checkedOn: '2026-08-01', validUntil: '2026-10-01' }]) assert.equal(approvedCatalogueRecord(record({ verification: { ...record().verification, ...patch } }), clock), null)
  assert.equal(approvedCatalogueRecord(record(), Date.parse('2027-02-04')), null)
  assert.throws(() => validateCatalogue([record(), record()]), /Duplicate catalogue/)
})
test('BG and EN natural language find only actual appointment services with one booking action', async () => {
  for (const [query, expected] of [['маникюр', 'El Gato'], ['manicure', 'El Gato'], ['бръснарница', 'Cut N’Chill by R. Yankoff'], ['детайлинг', 'Nebula Detailing Studio'], ['автомивка', 'AUTOSTEAMCLEAN · мобилна автомивка'], ['bjj', 'Twisted Jiu Jitsu · Хладилника'], ['груминг', 'Мокро Носле'], ['ремонт на апартамент', 'Софийски Ремонти']]) {
    const result = await discoverBusinesses(input({ query }), deps())
    assert.ok(result.results.some(row => row.name === expected), query)
    assert.ok(result.results.every(row => row.source === 'catalogue' && row.availability.status === 'external' && !row.availability.slots.length))
    assert.ok(result.results.every(row => railExternalAction(row, clock)), query)
  }
})
test('no slots, budgets or prices are invented for external appointments, including a date/time search', async () => {
  const result = await discoverBusinesses(input({ query: 'маникюр утре след 13:00' }), deps())
  assert.equal(result.intent.date, '2026-11-12'); assert.equal(result.intent.timeFrom, '13:00')
  assert.ok(result.results.length)
  for (const row of result.results) {
    assert.equal(row.availability.status, 'external'); assert.deepEqual(row.availability.slots, [])
    const record = SOFIA_CATALOGUE.find(source => source.id === row.id)
    for (const service of row.services) {
      const published = record.services.find(source => source.name === service.name)?.price
      assert.equal(service.price, published?.kind === 'fixed' && !published.unit && currentPublishedFact(published, clock) ? published.amount : null, 'a budget price must come from this actual current service, not a per-nail/per-unit tariff')
    }
  }
  const priced = await discoverBusinesses(input({ query: 'маникюр до 20 евро' }), deps())
  assert.ok(priced.results.length)
  const narra=await discoverBusinesses(input({query:'маникюр до 20 евро'}),deps({readCatalogue:async()=>SOFIA_CATALOGUE.filter(row=>row.id==='sofia-narra-beauty')}))
  assert.ok(narra.results.some(row=>row.id==='sofia-narra-beauty'),'a previously priced record remains budget-eligible even when newer closer listings fill page one')
  assert.ok(priced.results.every(row => row.services.every(service => service.price !== null && service.price <= 20)))
  const noPrices = SOFIA_CATALOGUE.filter(row => row.services.every(service => !service.price))
  assert.equal((await discoverBusinesses(input({ query: 'маникюр до 20 евро' }), deps({ readCatalogue: async () => noPrices }))).results.length, 0, 'unknown prices never qualify for a budget')
})
test('sports vocabulary covers martial arts and does not substitute a different sport or an ordinary gym', async () => {
  for (const query of ['бокс', 'кикбокс', 'карате', 'кунг фу', 'мма', 'таекуондо', 'джудо', 'борба', 'айкидо', 'муай тай']) {
    assert.equal(intent({ query }).category, 'fitness', query)
    const result = await discoverBusinesses(input({ query }), deps())
    assert.ok(result.results.every(row => row.services.some(service => service.name && !/фитнес карта|достъп до фитнес/iu.test(service.name))), query)
    assert.ok(result.results.every(row => row.category === 'fitness'), query)
  }
  const boxing = await discoverBusinesses(input({ query: 'бокс' }), deps())
  assert.ok(boxing.results.length)
  assert.ok(boxing.results.every(row => row.services.every(service => /бокс/iu.test(service.name))))
  const noOtherSport = await discoverBusinesses(input({ query: 'бокс' }), deps({ readCatalogue: async () => SOFIA_CATALOGUE.filter(row => row.id.startsWith('sofia-twisted-')) }))
  assert.equal(noOtherSport.results.length, 0)
  assert.ok((await discoverBusinesses(input({ query: 'джу джицу' }), deps())).results.length)
})
test('nearby filters are strict, unknown coordinates do not become zero km; city fallback says from centre', async () => {
  const coordinates = { latitude: 42.67, longitude: 23.29, consent: true }
  const near = await discoverBusinesses(input({ query: 'груминг', cityCode: undefined, coordinates }), deps())
  for (const name of ['Мокро Носле', 'Kaya Grooming']) assert.ok(near.results.some(row => row.name === name), name)
  assert.ok(near.results.every(row => row.distanceKm <= 2 && row.coordinates))
  const city = await discoverBusinesses(input({ query: 'маникюр' }), deps())
  const origin = discoveryDistanceOrigin({ cityCode: city.intent.cityCode })
  assert.equal(distanceBadge(origin, city.results[0].coordinates).suffix, 'от центъра')
  assert.equal(distanceBadge(origin, null), null)
  assert.equal(normalizeCatalogueBusinesses([record()], intent({ query: 'груминг', neighborhood: 'Връбница' }), { now: clock }).length, 0)
})
test('zero, one and several GoRez partners are retained and only eligible nearby partners receive priority', async () => {
  for (const partners of [[], [business()], [business(), business({ id: 'p2', slug: 'p2' }), business({ id: 'far', public_profile: { latitude: 42.75, longitude: 23.4 } })]]) {
    const result = await discoverBusinesses(input({ query: 'груминг', cityCode: undefined, coordinates: { latitude: 42.67, longitude: 23.29, consent: true } }), deps({ readInternal: async () => partners }))
    assert.equal(result.results.filter(row => row.source === 'gorez').length, Math.min(partners.length, 2))
    if (partners.length) assert.equal(result.results[0].source, 'gorez')
    assert.ok(result.results.some(row => row.source === 'catalogue'))
  }
})
test('internal availability is checked against the existing booking service and a newly occupied slot removes the partner', async () => {
  const result = await discoverBusinesses(input({ query: 'груминг утре след 13:00' }), deps({ readInternal: async () => [business()], getBusiness: async () => ({ services: [{ id: 's1' }], timezone: 'Europe/Sofia' }), getSlots: async () => [] }))
  assert.equal(result.results.some(row => row.source === 'gorez'), false)
  assert.ok(result.results.some(row => row.source === 'catalogue'))
})
test('duplicate matching never relies on names, the same contact at different branches is preserved', () => {
  const row = record(), partner = { id: business().id, name: row.name, phone: row.phone, address: row.address }
  assert.equal(isCataloguePartnerDuplicate(row, [partner]), true)
  assert.equal(isCataloguePartnerDuplicate(row, [{ ...partner, city: 'София', neighborhood: 'Манастирски ливади', address: 'ул. Пирин 85' }]), true)
  assert.equal(isCataloguePartnerDuplicate(row, [{ name: row.name }]), false)
  assert.equal(isCataloguePartnerDuplicate(row, [{ ...partner, address: 'София, different location' }]), false)
  assert.equal(isCataloguePartnerDuplicate({ ...row, gorezBusinessId: partner.id }, [{ id: partner.id }]), true)
  const rs = SOFIA_CATALOGUE.find(item => item.id === 'sofia-autocomplex-rs')
  assert.equal(rs.gorezBusinessId, '6b57b901-acd8-494b-a992-2cec551b4b00')
  assert.equal(isCataloguePartnerDuplicate(rs, [{ id: rs.gorezBusinessId, address: 'Owner address spelling differs' }]), true)
})
test('unknown cities/unsupported services never trigger a paid fallback; partner database outage still allows catalogue results', async () => {
  const unsupported = await discoverBusinesses(input({ query: 'маникюр', cityCode: '56784' }), deps())
  assert.equal(unsupported.results.length, 0); assert.equal(unsupported.externalStatus, 'sofia_only')
  const failed = await discoverBusinesses(input(), deps({ readInternal: async () => { throw Error('database offline') } }))
  assert.ok(failed.results.length); assert.ok(failed.warnings.includes('internal_unavailable'))
  const empty = await discoverBusinesses(input(), deps({ readCatalogue: async () => [] }))
  assert.deepEqual(empty.results, [])
})
test('one card rail preserves safe actions, city distances and finite horizontal result counts without Google plans', async () => {
  const result = await discoverBusinesses(input({ query: '', browse: true }), deps())
  assert.equal(result.results.length, 15)
  assert.equal(orderedRailRows(result.results).length, 15)
  for (const row of result.results) {
    const action = railExternalAction(row, clock)
    assert.ok(['form', 'phone'].includes(action.kind))
    assert.ok(row.booking.kind === 'form' ? action.href.startsWith('https:') : action.href.startsWith('tel:'))
    const directions = railDirections(row)
    if (directions) { assert.equal(new URL(directions).searchParams.get('origin'), null); assert.equal(new URL(directions).searchParams.get('key'), null) }
  }
  assert.equal(railExternalAction({ ...result.results[0], booking: { ...result.results[0].booking, validUntil: '2026-01-01' } }, clock), null)
})
test('farther expansion is explicitly bounded and never moves a distant partner ahead of nearer catalogue rows', () => {
  const searchIntent = { ...intent({ query: 'груминг', cityCode: undefined, coordinates: { latitude: 42.67, longitude: 23.29, consent: true } }), radiusKm: 5, primaryRadiusKm: 2 }
  const rows = rankCatalogueBusinesses([{ id: 'far', name: 'Far', source: 'gorez', coordinates: { latitude: 42.7, longitude: 23.29 } }], [{ id: 'near', name: 'Near', source: 'catalogue', coordinates: { latitude: 42.67, longitude: 23.29 } }], searchIntent)
  assert.deepEqual(rows.map(row => row.id), ['near', 'far']); assert.equal(rows[1].proximityBand, 'further')
})
test('same-site, request validation and configurable abuse limits still protect free searches', async () => {
  const request = (body, origin = 'https://www.gorez.co') => new Request('https://www.gorez.co/api/public/discovery', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal((await createDiscoveryHandler(deps())(request(input(), 'https://attacker.bg'))).status, 403)
  assert.equal((await createDiscoveryHandler(deps())(request({ ...input(), providerMode: 'google' }))).status, 422)
  const denied = await createDiscoveryHandler(deps({ allowAttempt: async () => false }))(request(input()))
  assert.equal(denied.status, 429); assert.equal(denied.headers.get('Retry-After'), '60')
})
test('paid widget endpoints stay closed in catalogue mode before any provider budget or database read', async () => {
  const request = () => new Request('https://www.gorez.co/api/public/discovery/google-card', { method: 'POST', headers: { Origin: 'https://www.gorez.co', 'Content-Type': 'application/json' }, body: '{}' })
  const config = deps().config
  assert.equal((await createGoogleCardGrantHandler({ config, allowAttempt: noProvider, claimBudget: noProvider })(request())).status, 404)
  const ratingRequest = new Request('https://www.gorez.co/api/public/some-business/google-rating', { method: 'POST', headers: { Origin: 'https://www.gorez.co', 'Content-Type': 'application/json' }, body: '{"locale":"bg"}' })
  assert.deepEqual(await (await createPartnerRatingHandler({ config, allowAttempt: async () => true, readBusiness: noProvider, readLink: noProvider, claimBudget: noProvider })(ratingRequest, 'some-business')).json(), { plan: null })
})
test('UI keeps real catalogue cards in the existing rail with illustrative covers, a common reserve label and aligned buttons', async () => {
  const card = await readFile(new URL('../components/discovery-business-card.js', import.meta.url), 'utf8')
  const css = await readFile(new URL('../app/discovery-home.css', import.meta.url), 'utf8')
  assert.match(card, /BusinessCoverPhoto/); assert.match(card, /internal && <span className="home-business-partner"/)
  assert.match(card, /Резервирай час/); assert.match(css, /\[data-uniform-cards="true"\] \.home-business-card \{ height: 100%/)
  assert.match(css, /\[data-uniform-cards="true"\] \.home-business-actions \{ margin-top: auto/)
  assert.match(css, /\.home-business-actions > \.home-reserve:only-child \{ grid-column: 2/)
  const browse = await readFile(new URL('../components/discovery-home-browse.js', import.meta.url), 'utf8')
  assert.match(browse, /uniformCards=\{!result\?\.external && !result\?\.furtherExternal\}/)
})
