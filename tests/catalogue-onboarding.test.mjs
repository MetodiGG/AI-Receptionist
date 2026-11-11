import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  searchCatalogueForOnboarding, catalogueOnboardingDetail, parseCatalogueOnboardingQuery,
  createCatalogueOnboardingHandler, createCatalogueOnboardingRateLimiter,
} from '../lib/catalogue-onboarding.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const now = Date.parse('2026-11-11T12:00:00Z')
const sourceUrl = 'https://salon.example.com/services'
const price = (extra = {}) => ({ amount: 25, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn: '2026-11-11', ...extra })
const service = (extra = {}) => ({ name: 'Маникюр', category: 'nails', appointmentModel: 'appointment', price: price(), ...extra })
const record = (extra = {}) => ({
  id: 'sofia-onboarding-salon', name: 'Салон Веси', cityCode: '68134', neighborhood: 'Борово',
  address: 'ул. „Родопски извор“ 10', locationKind: 'premises', coordinates: null, category: 'nails',
  website: 'https://salon.example.com/', phone: '+359888123456', services: [service()],
  booking: { kind: 'phone', phone: '+359888123456' },
  verification: { status: 'approved', checkedOn: '2026-11-11', validUntil: '2027-01-01',
    booking: { url: 'https://salon.example.com/contacts', excerpt: 'Обадете се, за да запазите своя час.' }, contact: 'https://salon.example.com/contacts' },
  ...extra,
})
const lookup = (records, extra = {}) => createCatalogueOnboardingHandler({ catalogue: records, now: () => now, allowAttempt: () => true, ...extra })
const request = (query, headers) => new Request(`https://www.gorez.co/api/public/catalogue-onboarding?${query}`, { headers })

test('name lookup ranks exact, prefix, substring, reordered tokens, then a bounded one-letter typo', () => {
  const businesses = [
    ['sofia-onboarding-typo', 'G Poinx'], ['sofia-onboarding-words', 'Point G'], ['sofia-onboarding-substring', 'Studio G Point'],
    ['sofia-onboarding-prefix', 'G Point Studio'], ['sofia-onboarding-exact', 'G Point'], ['sofia-onboarding-unrelated', 'Another salon'],
  ].map(([id, name]) => record({ id, name }))
  assert.deepEqual(searchCatalogueForOnboarding(businesses, { query: '  G POINT ' }, { now }).map(row => row.id), [
    'sofia-onboarding-exact', 'sofia-onboarding-prefix', 'sofia-onboarding-substring', 'sofia-onboarding-words', 'sofia-onboarding-typo',
  ])
  assert.equal(searchCatalogueForOnboarding([record()], { query: 'salon vesi' }, { now })[0].name, 'Салон Веси')
  assert.equal(searchCatalogueForOnboarding([record({ name: 'Café — Vesi' })], { query: 'cafe vesi' }, { now }).length, 1)
})

test('search is bounded, name-specific, city-validated and returns only its compact allowlist', () => {
  const businesses = Array.from({ length: 15 }, (_, i) => record({ id: `sofia-onboarding-${i}name`, name: `Салон ${i}` }))
  const rows = searchCatalogueForOnboarding(businesses, { query: 'Салон', cityCode: '68134' }, { now, limit: 500 })
  assert.equal(rows.length, 8)
  assert.deepEqual(Object.keys(rows[0]).sort(), ['id', 'name', 'address', 'cityCode', 'neighborhood', 'category', 'serviceCount', 'currentPriceCount'].sort())
  assert.equal(searchCatalogueForOnboarding(businesses, { query: 'Салон' }, { now, limit: 5 }).length, 5)
  for (const query of ['', 'a', 'a'.repeat(121), '!!!']) assert.deepEqual(searchCatalogueForOnboarding(businesses, { query }, { now }), [])
  assert.deepEqual(searchCatalogueForOnboarding(businesses, { query: 'Салон', cityCode: '00000' }, { now }), [])
  assert.deepEqual(searchCatalogueForOnboarding(businesses, { query: 'Салон', cityCode: '56784' }, { now }), [])
  assert.deepEqual(searchCatalogueForOnboarding([record()], { query: 'Родопски извор' }, { now }), [])
})

test('public eligibility rejects stale, future, rejected, linked-partner, excluded-clinic and unsafe rows', () => {
  const base = record()
  const variants = [
    record({ verification: { ...base.verification, status: 'draft' } }),
    record({ verification: { ...base.verification, status: 'rejected' } }),
    record({ verification: { ...base.verification, checkedOn: '2026-12-01' } }),
    record({ verification: { ...base.verification, checkedOn: '2026-08-12', validUntil: '2026-11-10' } }),
    record({ gorezBusinessId: '123e4567-e89b-42d3-a456-426614174000' }),
    record({ id: 'sofia-balance-clinic' }), record({ website: 'javascript:alert(1)' }),
    record({ booking: { kind: 'form', url: 'https://localhost.local/path' } }), record({ privateAccountId: 'do-not-expose' }),
  ]
  for (const row of variants) {
    assert.deepEqual(searchCatalogueForOnboarding([row], { query: 'Салон' }, { now }), [])
    assert.equal(catalogueOnboardingDetail([row], row.id, { now }), null)
  }
})

test('detail maps the real native industry, preserves names and contains no ownership or booking configuration', () => {
  for (const [category, industry] of [['nails', 'beauty'], ['hair', 'beauty'], ['barber', 'beauty'], ['beauty', 'beauty'], ['car_wash', 'auto'], ['auto_repair', 'auto'], ['detailing', 'auto'], ['education', 'education']]) {
    const row = record({ category })
    const draft = catalogueOnboardingDetail([row], row.id, { now })
    assert.equal(draft.business.industry, industry)
    assert.deepEqual(Object.keys(draft.business).sort(), ['id', 'name', 'address', 'cityCode', 'neighborhood', 'industry', 'website', 'phone'].sort())
    assert.equal(draft.business.website, row.website)
    assert.equal(draft.business.phone, row.phone)
    for (const forbidden of ['verification', 'coordinates', 'booking', 'booking_mode', 'staff', 'openingHours', 'photo', 'gorezBusinessId', 'ownerId']) assert.equal(forbidden in draft.business, false)
  }
})

test('only actual fixed scalar EUR can autofill; zero remains a real price', () => {
  const row = record({ services: [service({ price: price({ amount: 0 }) }), service({ name: 'Педикюр', price: price({ amount: 32.5 }) })] })
  const draft = catalogueOnboardingDetail([row], row.id, { now })
  assert.deepEqual(draft.services.map(item => item.price), ['0', '32.5'])
  assert.deepEqual(draft.services.map(item => item.duration_min), ['', ''])
  assert.equal(draft.services[0].catalogueHint.requiresPriceConfirmation, undefined)
  assert.match(draft.services[0].catalogueHint.priceLabel, /0/)
})

test('from, range, BGN, hourly/package/unit and conditional fees stay context, never fabricated fixed EUR visits', () => {
  const variants = [
    service({ price: price({ kind: 'from' }) }), service({ price: price({ kind: 'range', maximum: 40 }) }),
    service({ price: price({ currency: 'BGN', amount: 50 }) }), service({ price: price({ unit: 'час' }) }),
    service({ name: 'Пакет 5 процедури' }), service({ name: 'Месечен абонамент' }),
    service({ description: 'Тарифата е без ДДС.' }), service({ description: 'Промоционална цена само при онлайн записване.' }),
    service({ description: 'Публикуваната сума е за 4 посещения.' }), service({ price: price({ amount: 25.123 }) }),
    service({ price: price({ amount: 1000000 }) }), service({ price: price({ amount: 25.000000000000004 }) }),
    service({ description: 'Цената не включва ДДС.' }), service({ description: 'Ориентировъчна цена след оглед.' }),
  ]
  const row = record({ services: variants }), draft = catalogueOnboardingDetail([row], row.id, { now })
  for (const item of draft.services) {
    assert.equal(item.price, '')
    assert.equal(item.catalogueHint.requiresPriceConfirmation, true)
    assert.ok(item.catalogueHint.priceLabel)
  }
  assert.match(draft.services[0].catalogueHint.priceLabel, /^от /)
  assert.match(catalogueOnboardingDetail([row], row.id, { now, locale: 'en' }).services[0].catalogueHint.priceLabel, /^from /)
  assert.match(draft.services[1].catalogueHint.priceLabel, /25.*–.*40/)
  assert.match(draft.services[2].catalogueHint.priceLabel, /50/)
  assert.match(draft.services[3].catalogueHint.priceLabel, /\/ час$/)
  assert.match(draft.services[9].catalogueHint.priceLabel, /25,123/)
  assert.equal(draft.services[6].catalogueHint.description, variants[6].description)
})

test('current price counts are independent of convertible prices and expired price labels disappear', () => {
  const row = record({ services: [
    service(), service({ price: price({ kind: 'from' }) }), service({ price: price({ currency: 'BGN' }) }),
    service({ price: price({ checkedOn: '2026-08-01' }) }), service({ price: price({ checkedOn: '2026-11-12' }) }),
    service({ price: price({ checkedOn: '2026-11-01', validUntil: '2026-11-10' }) }), service({ price: undefined }),
  ] })
  const result = searchCatalogueForOnboarding([row], { query: 'Салон' }, { now })[0]
  assert.equal(result.serviceCount, 7)
  assert.equal(result.currentPriceCount, 3)
  const draft = catalogueOnboardingDetail([row], row.id, { now })
  for (const item of draft.services.slice(3)) {
    assert.equal(item.price, '')
    assert.equal(item.catalogueHint.priceLabel, undefined)
    assert.equal(item.catalogueHint.requiresPriceConfirmation, true)
  }
})

test('duration needs current real evidence and native-model range; no 45-minute default', () => {
  const evidence = { durationSourceUrl: sourceUrl, durationCheckedOn: '2026-11-11' }
  const row = record({ services: [
    service(), service({ ...evidence, durationMin: 35 }), service({ ...evidence, durationMin: 5 }),
    service({ ...evidence, durationMin: 1440 }), service({ ...evidence, durationMin: 3 }),
    service({ ...evidence, durationMin: 60, durationCheckedOn: '2026-08-01' }),
    service({ ...evidence, durationMin: 60, durationCheckedOn: '2026-11-12' }),
  ] })
  assert.deepEqual(catalogueOnboardingDetail([row], row.id, { now }).services.map(item => item.duration_min), ['', '35', '5', '1440', '', '', ''])
  assert.equal(catalogueOnboardingDetail([record({ services: [service({ durationMin: 45 })] })], row.id, { now }), null)
})

test('full public inventory is retained with explicit submission limits, not silently sliced to40 or truncated to120', () => {
  const row = record({ services: Array.from({ length: 42 }, (_, i) => service({ name: i ? `Услуга ${i}` : 'Дълго име '.repeat(18).trim() })) })
  const draft = catalogueOnboardingDetail([row], row.id, { now })
  assert.equal(draft.services.length, 42)
  assert.equal(draft.serviceCount, 42)
  assert.equal(draft.serviceLimit, 40)
  assert.equal(draft.serviceNameLimit, 120)
  assert.equal(draft.services[0].name, row.services[0].name)
  assert.deepEqual(Object.keys(draft.services[0]).sort(), ['name', 'price', 'duration_min', 'catalogueHint'].sort())
  assert.equal(catalogueOnboardingDetail([row], row.id, { now, cityCode: '56784' }), null)
})

test('query parser allows exactly one lookup mode, known optional city and BG/EN locale', () => {
  assert.deepEqual(parseCatalogueOnboardingQuery(request('q=%20Vesi%20&city=68134&lang=en').url), { query: 'Vesi', cityCode: '68134', locale: 'en' })
  assert.deepEqual(parseCatalogueOnboardingQuery(request('id=sofia-onboarding-salon').url), { id: 'sofia-onboarding-salon', cityCode: undefined, locale: 'bg' })
  for (const query of ['', 'q=x', `q=${'a'.repeat(121)}`, 'q=Vesi&id=sofia-onboarding-salon', 'q=Vesi&q=Other', 'q=Vesi&city=00000', 'q=Vesi&city=68134&city=56784', 'id=private-business-uuid', 'q=Vesi&lang=de', 'q=Vesi&lang=', 'q=Vesi&owner=true', 'q=Vesi&city=']) {
    assert.equal(parseCatalogueOnboardingQuery(request(query).url), null, query)
  }
})

test('handler returns no-store search/detail DTOs, localized context and safe not-found/validation errors', async () => {
  const row = record({ services: [service({ price: price({ kind: 'from' }) })] }), handler = lookup([row])
  const search = await handler(request('q=Vesi&city=68134'))
  assert.equal(search.status, 200)
  assert.match(search.headers.get('cache-control'), /no-store/)
  assert.equal(search.headers.get('x-content-type-options'), 'nosniff')
  assert.equal((await search.json()).businesses[0].id, row.id)
  const detail = await handler(request(`id=${row.id}&lang=en`))
  assert.match((await detail.json()).services[0].catalogueHint.priceLabel, /^from /)
  assert.equal((await handler(request('q=x'))).status, 400)
  assert.equal((await handler(request('id=sofia-not-a-real-business'))).status, 404)
  assert.deepEqual(await (await handler(request('q=Vesi&city=56784'))).json(), { businesses: [] })
})

test('handler rate limit, same-site boundary and recoverable technical errors never access catalogue accidentally', async () => {
  let reads = 0
  const read = () => { reads++; throw Error('secret-database-name-should-not-leak') }
  const denied = await lookup(read, { allowAttempt: () => false })(request('q=Vesi'))
  assert.equal(denied.status, 429)
  assert.equal(denied.headers.get('retry-after'), '60')
  assert.equal(reads, 0)
  assert.deepEqual(await denied.json(), { error: { code: 'RATE_LIMITED' } })
  const forbidden = await lookup(read)(request('q=Vesi', { origin: 'https://elsewhere.example.com', 'sec-fetch-site': 'cross-site' }))
  assert.equal(forbidden.status, 403)
  assert.equal(reads, 0)
  const invalid = await lookup(read)(request('q=x'))
  assert.equal(invalid.status, 400)
  assert.equal(reads, 0)
  const failed = await lookup(read)(request('q=Vesi'))
  assert.equal(failed.status, 503)
  assert.equal(failed.headers.get('retry-after'), '30')
  assert.deepEqual(await failed.json(), { error: { code: 'LOOKUP_UNAVAILABLE' } })
  assert.equal(reads, 1)
})

test('local limiter is bounded, isolates keys and resets without timers, DB or network', () => {
  let time = now
  const consume = createCatalogueOnboardingRateLimiter({ now: () => time, limit: 2, windowMs: 60000, maxKeys: 2 })
  assert.equal(consume('hashed-ip-one'), true)
  assert.equal(consume('hashed-ip-one'), true)
  assert.equal(consume('hashed-ip-one'), false)
  assert.equal(consume('hashed-ip-two'), true)
  assert.equal(consume('new-key-beyond-memory-bound'), false)
  time += 60000
  assert.equal(consume('new-key-beyond-memory-bound'), true)
  assert.equal(consume('hashed-ip-one'), true)
})

test('real catalogue static lookup works without network and route keeps the full inventory server-only', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = () => { throw Error('No network permitted') }
  try {
    const row = SOFIA_CATALOGUE.find(item => !item.gorezBusinessId && catalogueOnboardingDetail(SOFIA_CATALOGUE, item.id, { now }))
    assert.ok(row)
    const response = await lookup(SOFIA_CATALOGUE)(request(`id=${row.id}`))
    assert.equal(response.status, 200)
    const payload = await response.json()
    assert.equal(payload.business.id, row.id)
    assert.equal(payload.services.length, row.services.length)
    assert.equal(JSON.stringify(payload).includes('verification'), false)
    const route = readFileSync(new URL('../app/api/public/catalogue-onboarding/route.js', import.meta.url), 'utf8')
    assert.match(route, /import 'server-only'/)
    assert.match(route, /runtime = 'nodejs'/)
    assert.match(route, /SOFIA_CATALOGUE/)
    assert.doesNotMatch(route, /supabase|consumeRateLimit|fetch\(|POST|createClient/)
  } finally { globalThis.fetch = originalFetch }
})
