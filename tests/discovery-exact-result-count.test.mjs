import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { DateTime } from 'luxon'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { readInternalCandidates } from '../lib/discovery/internal-search.mjs'
import { PUBLIC_SEARCH_INDEX_FIELDS, readPublishedSearchInventory } from '../lib/discovery/public-search-inventory.mjs'
import { compactDiscoveryResponse } from '../lib/discovery/preview.mjs'
import { mergeCataloguePage } from '../lib/discovery/catalogue-pagination.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const now = DateTime.fromISO('2026-11-14T12:00:00Z')
const forbidden = () => assert.fail('Counts must not fetch a provider, calendar, media, customer data or submit a booking')
const id = number => `123e4567-e89b-42d3-a456-${String(number).padStart(12, '0')}`
const native = (number, patch = {}) => ({
  id: id(number), slug: `count-public-${number}`, name: `Public count studio ${number}`,
  active: true, platform_status: 'enabled', industry: 'beauty', booking_mode: 'gorez',
  city_ekatte: '68134', city: 'София', address: 'ул. Пример 1', neighborhood: 'Борово',
  public_profile: { description: { bg: '', en: '' }, latitude: 42.67, longitude: 23.29, payments: [] },
  services: [{ id: `service-${number}`, name: 'Маникюр с гел лак', category: 'nails', active: true, price: 30, currency: 'EUR', duration_min: 30 }],
  ...patch,
})
const record = patch => ({
  ...structuredClone(SOFIA_CATALOGUE[0]), id: 'sofia-exact-count-reviewed', name: 'Reviewed count studio',
  category: 'nails', address: 'София, ул. Примерна 83', neighborhood: 'Борово', coordinates: null,
  services: [{ name: 'Маникюр с гел лак', category: 'nails', appointmentModel: 'appointment' }], ...patch,
})
const dependencies = patch => ({
  config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), now,
  readCatalogue: async () => [], readInternal: async () => [],
  getBusiness: forbidden, getSlots: forbidden, fetcher: forbidden, claimBudget: forbidden, ...patch,
})
const browse = patch => ({ query: '', browse: true, category: 'nails', cityCode: '68134', ...patch })

test('the exact number covers the complete current global set before pagination, without rich-hydrating all profiles', async () => {
  const partners = Array.from({ length: 150 }, (_, index) => native(index + 1))
  const reads = [], hydration = []
  const deps = dependencies({
    readInternal: async (intent, options) => { reads.push(options); return partners },
    hydrateInternalCandidates: async ids => { hydration.push(ids); return partners.filter(row => ids.includes(row.id)) },
  })
  const result = await discoverBusinesses(browse(), deps)
  assert.equal(result.results.length, 15)
  assert.equal(result.exactTotal, 150)
  assert.equal(result.cataloguePage.total, 150)
  assert.equal(result.cataloguePage.nextOffset, 15)
  assert.deepEqual(reads, [{ fresh: true }])
  assert.equal(hydration.length, 1)
  assert.equal(hydration[0].length, 15, 'a total never turns page hydration into a rich global scan')
  assert.equal(compactDiscoveryResponse(result).exactTotal, 150)
  const next = await discoverBusinesses(browse({ catalogueOffset: result.cataloguePage.nextOffset }), deps)
  const merged = mergeCataloguePage(result, next)
  assert.equal(merged.results.length, 30)
  assert.equal(merged.exactTotal, 150)
})

test('the existing cached20/current0 revocation and read-error cases never publish20 as an exact total', async () => {
  const partners = Array.from({ length: 20 }, (_, index) => native(index + 1))
  for (const hydrateInternalCandidates of [async () => [], async () => { throw Error('Unavailable current profiles') }]) {
    const result = await discoverBusinesses(browse(), dependencies({ readInternal: async () => partners, hydrateInternalCandidates }))
    assert.equal(result.results.length, 0)
    assert.equal(result.cataloguePage.total, 20, 'historical cursor-inventory semantics remain unchanged')
    assert.equal(result.cataloguePage.nextOffset, 15)
    assert.equal(result.exactTotal, null, 'checking only one consumed page cannot certify the remainder')
  }
})

test('a changed selected child, revoked publication or a removed native row invalidates exact-count confidence', async () => {
  const partners = [native(1), native(2)]
  for (const current of [
    [partners[0]],
    [partners[0], native(2, { platform_status: 'pending' })],
    [partners[0], native(2, { services: [{ id: 'pedicure', name: 'Педикюр', category: 'nails', active: true }] })],
  ]) {
    const result = await discoverBusinesses(browse({ subcategory: 'nails-gel' }), dependencies({
      readInternal: async () => partners, hydrateInternalCandidates: async () => current,
    }))
    assert.equal(result.results.length, 1)
    assert.equal(result.cataloguePage.total, 2)
    assert.equal(result.exactTotal, null)
  }
})

test('source outages and clarification do not become exact zeroes or partial-inventory totals', async () => {
  const catalogue = record()
  const withoutPartners = await discoverBusinesses(browse(), dependencies({
    readInternal: async () => { throw Error('Current native metadata unavailable') }, readCatalogue: async () => [catalogue],
  }))
  assert.equal(withoutPartners.results.length, 1)
  assert.equal(withoutPartners.exactTotal, null)
  const withoutCatalogue = await discoverBusinesses(browse(), dependencies({
    readInternal: async () => [native(1)], readCatalogue: async () => { throw Error('Catalogue unavailable') },
  }))
  assert.equal(withoutCatalogue.results.length, 1)
  assert.equal(withoutCatalogue.exactTotal, null)
  const unclear = await discoverBusinesses({ query: 'Несъществуваща услуга987', cityCode: '68134' }, dependencies())
  assert.ok(unclear.clarification)
  assert.equal(unclear.exactTotal, null)
  const empty = await discoverBusinesses(browse(), dependencies())
  assert.equal(empty.exactTotal, 0, 'successful complete empty snapshots are a real zero')
})

test('counts reuse actual service/category/quarter/city/radius/publication filters and unique business identity', async () => {
  const valid = native(1)
  const partners = [
    valid, valid,
    native(2, { neighborhood: 'Младост' }),
    native(3, { city_ekatte: '56784', public_profile: { latitude: 42.14, longitude: 24.75 } }),
    native(4, { active: false }),
    native(5, { services: [{ id: 'haircut', name: 'Подстригване', category: 'hair', active: true }] }),
    native(6, { public_profile: { latitude: 42.8, longitude: 23.4 } }),
  ]
  const result = await discoverBusinesses(browse({
    cityCode: undefined, coordinates: { latitude: 42.67, longitude: 23.29, consent: true },
    neighborhood: undefined, radiusKm: 1, subcategory: 'nails-gel',
  }), dependencies({ readInternal: async () => partners }))
  assert.equal(result.exactTotal, 2, 'the same nearby Mladost row is eligible with no explicit quarter filter')
  const quarter = await discoverBusinesses(browse({ neighborhood: 'Борово', subcategory: 'nails-gel' }), dependencies({
    readInternal: async () => partners.filter(row => row.id !== id(6)),
  }))
  assert.equal(quarter.exactTotal, 1)
  assert.equal(quarter.results.length, 1)
})

test('dated native results retain bounded existing availability behavior, without claiming a global verified slot count', async () => {
  const partner = native(1)
  const result = await discoverBusinesses({ query: 'маникюр утре', cityCode: '68134' }, dependencies({
    readInternal: async () => [partner], hydrateInternalCandidates: async () => [partner],
    getBusiness: async () => ({ ...partner, timezone: 'Europe/Sofia' }), getSlots: async () => [],
  }))
  assert.equal(result.results.length, 1)
  assert.equal(result.results[0].availability.status, 'none')
  assert.equal(result.exactTotal, null)
})

test('the total reuses native/catalogue identity suppression rather than adding two source counters', async () => {
  const catalogue = record()
  const partner = native(1, { phone: catalogue.phone, address: catalogue.address })
  const result = await discoverBusinesses(browse(), dependencies({
    readCatalogue: async () => [catalogue], readInternal: async () => [partner],
  }))
  assert.equal(result.results.length, 1)
  assert.equal(result.results[0].source, 'gorez')
  assert.equal(result.exactTotal, 1)
})

test('current public metadata refresh replaces the full-search cached snapshot while ordinary autocomplete stays cached', async () => {
  let rows = [native(1)], calls = 0
  const selections = []
  const db = createClient('https://count-fixture.supabase.invalid', 'test-public-placeholder', { global: { fetch: async url => {
    calls++
    const params = new URL(url).searchParams
    selections.push(params.get('select'))
    return Response.json(rows)
  } } })
  assert.deepEqual((await readPublishedSearchInventory(db, { cityCode: '68134' })).map(row => row.id), [id(1)])
  rows = [native(2), native(3)]
  assert.deepEqual((await readPublishedSearchInventory(db, { cityCode: '68134' })).map(row => row.id), [id(1)])
  assert.equal(calls, 1, 'ordinary suggestions still share the30-second city cache')
  const refreshed = await readInternalCandidates(db, { searchV2: true, cityCode: '68134' }, { fresh: true })
  assert.deepEqual(refreshed.map(row => row.id), [id(2), id(3)], 'newly published and newly matching rows are not confined to old candidate IDs')
  assert.equal(calls, 2, 'one current metadata read replaces rather than supplements a rich global scan')
  assert.deepEqual((await readPublishedSearchInventory(db, { cityCode: '68134' })).map(row => row.id), [id(2), id(3)])
  assert.equal(calls, 2)
  assert.ok(selections.every(fields => fields === PUBLIC_SEARCH_INDEX_FIELDS))
  assert.doesNotMatch(PUBLIC_SEARCH_INDEX_FIELDS, /owner_id|contact_email|staff|workingHours|business_media|customers|appointments|token/)
})

test('simultaneous current refreshes share one in-flight public metadata load, with no query or GPS cache key', async () => {
  let calls = 0, release
  const pending = new Promise(resolve => { release = resolve })
  const db = createClient('https://count-coalescing.supabase.invalid', 'test-public-placeholder', { global: { fetch: async () => {
    calls++
    if (calls > 1) await pending
    return Response.json([native(1)])
  } } })
  await readPublishedSearchInventory(db, { cityCode: '68134' })
  const first = readPublishedSearchInventory(db, { cityCode: '68134', fresh: true })
  const second = readPublishedSearchInventory(db, { cityCode: '68134', fresh: true })
  release()
  const [a, b] = await Promise.all([first, second])
  assert.deepEqual(a, b)
  assert.equal(calls, 2)
})

test('page merging clears stale or malformed exact totals instead of keeping first-page confidence', async () => {
  const partners = Array.from({ length: 20 }, (_, index) => native(index + 1))
  const deps = dependencies({ readInternal: async () => partners })
  const first = await discoverBusinesses(browse(), deps)
  const next = await discoverBusinesses(browse({ catalogueOffset: first.cataloguePage.nextOffset }), deps)
  for (const exactTotal of [null, undefined, -1, '20', Infinity, 19]) {
    assert.equal(mergeCataloguePage(first, { ...next, exactTotal }).exactTotal, null)
  }
  assert.equal(mergeCataloguePage(first, next).exactTotal, 20)
})

test('production forwards only the server full-search freshness option; autocomplete retains its existing default adapter', async () => {
  const full = await readFile(new URL('../app/api/public/discovery/route.js', import.meta.url), 'utf8')
  const suggestions = await readFile(new URL('../app/api/public/discovery/suggestions/route.js', import.meta.url), 'utf8')
  assert.match(full, /readInternal: \(intent, options\) => readInternalCandidates\(getSupabaseAdmin\(\), intent, options\)/)
  assert.match(suggestions, /readInventory: options => readPublishedSearchInventory\(getSupabaseAdmin\(\), options\)/)
  assert.doesNotMatch(suggestions, /fresh:\s*true/)
})
