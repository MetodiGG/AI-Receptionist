import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryRequestSchema } from '../lib/discovery/intent.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { mergeCataloguePage } from '../lib/discovery/catalogue-pagination.mjs'
import { orderedRailRows, railExternalAction } from '../lib/discovery/rail.mjs'

const now = DateTime.fromISO('2026-11-05T12:00:00Z')
const forbidden = () => assert.fail('No provider, database mutation, paid AI or booking request is allowed')
const deps = patch => ({ config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), now,
  readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE, allowAttempt: async () => true,
  fetcher: forbidden, authorizeGoogle: forbidden, claimBudget: forbidden, getBusiness: forbidden, getSlots: forbidden, ...patch })
const browse = { query: '', browse: true, cityCode: '68134' }

test('expansion is genuinely broad: over 200 distinct records, all existing categories, many independent sources', () => {
  assert.ok(SOFIA_CATALOGUE.length >= 200)
  assert.ok(new Set(SOFIA_CATALOGUE.map(row => new URL(row.website).hostname.replace(/^www\./, ''))).size >= 90)
  assert.equal(new Set(SOFIA_CATALOGUE.map(row => row.category)).size, 14)
  assert.ok(SOFIA_CATALOGUE.filter(row => row.coordinates).length >= 50)
  assert.ok(SOFIA_CATALOGUE.every(row => row.locationKind !== 'service_area' || row.coordinates === null))
  const chain = SOFIA_CATALOGUE.filter(row => row.id.startsWith('sofia-gpoint-'))
  assert.equal(chain.length, 43)
  assert.equal(new Set(chain.map(row => row.address)).size, chain.length)
  assert.ok(chain.every(row => row.coordinates?.source.startsWith('https://cms.gpoint.bg/') && !/Тест|Перник|Пловдив/iu.test(row.name + row.address)))
})

test('every eligible city listing can be reached, 15 at a time, without duplicate cards or provider calls', async () => {
  let result = await discoverBusinesses(browse, deps()), requests = 1
  assert.equal(result.results.length, 15)
  assert.equal(result.cataloguePage.total, SOFIA_CATALOGUE.length)
  while (result.cataloguePage.nextOffset !== null) {
    const page = await discoverBusinesses({ ...browse, catalogueOffset: result.cataloguePage.nextOffset }, deps())
    assert.ok(page.results.length > 0 && page.results.length <= 15)
    result = mergeCataloguePage(result, page)
    assert.ok(++requests <= 20, 'pagination must terminate')
  }
  assert.equal(result.results.length, SOFIA_CATALOGUE.length)
  assert.equal(new Set(result.results.map(row => row.id)).size, SOFIA_CATALOGUE.length)
  assert.equal(orderedRailRows(result.results).length, SOFIA_CATALOGUE.length)
  let previous = -Infinity
  for (const row of result.results) {
    const distance = row.distanceKm ?? Infinity
    assert.ok(distance >= previous, 'city browsing must stay nearest-first across every page')
    previous = distance
  }
  const partnerOnlyPage = result.results.slice(0, 30).map(row => ({ ...row, source: 'gorez' }))
  assert.equal(orderedRailRows(partnerOnlyPage, { preserveOrder: true }).length, 30, 'catalogue mode must also preserve partner-only pages')
  assert.ok(result.results.every(row => railExternalAction(row, now.toMillis())))
  assert.equal((await discoverBusinesses({ ...browse, catalogueOffset: 5000 }, deps())).results.length, 0)
})

test('paging preserves strict services, explicit quarters, actual radii and near-before-far order', async () => {
  const coordinateInput = { ...browse, cityCode: undefined, coordinates: { latitude: 42.67, longitude: 23.29, consent: true }, expandNearby: true }
  let result = await discoverBusinesses(coordinateInput, deps())
  while (result.cataloguePage.nextOffset !== null) result = mergeCataloguePage(result, await discoverBusinesses({ ...coordinateInput, catalogueOffset: result.cataloguePage.nextOffset }, deps()))
  assert.ok(result.results.every(row => row.coordinates && row.distanceKm <= 5))
  const firstFar = result.results.findIndex(row => row.proximityBand === 'further')
  if (firstFar >= 0) assert.ok(result.results.slice(firstFar).every(row => row.proximityBand === 'further'))
  const query = { query: 'лазерна епилация', category: 'beauty', cityCode: '68134', neighborhood: 'Манастирски ливади' }
  const quarter = await discoverBusinesses(query, deps())
  assert.ok(quarter.results.length >= 2, 'both reviewed Manastirski G Point branches must be discoverable by laser epilation')
  assert.ok(quarter.results.every(row => row.neighborhood?.startsWith('Манастирски ливади')))
  assert.ok(quarter.results.every(row => row.services.every(service => /лазер|епилац|обезкосм/iu.test(service.name))))
})

test('new searches recognise published dental, accounting, lessons and reserved martial-arts services, not unrelated businesses', async () => {
  for (const [query, minimum] of [['зъболекар', 7], ['психолог', 2], ['урок по пиано', 2], ['бокс', 2], ['карате', 4], ['ВиК', 1]]) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, deps())
    assert.ok(result.results.length >= minimum, query)
  }
  const accounting = await discoverBusinesses({ query: 'счетоводна консултация', cityCode: '68134' }, deps())
  assert.ok(accounting.results.length > 0)
  assert.ok(accounting.results.every(row => row.services.every(service => /счетовод/iu.test(service.name))))
  const home = await discoverBusinesses({ query: 'за дома', cityCode: '68134' }, deps())
  assert.ok(home.results.length > 0)
  assert.ok(home.results.every(row => row.category === 'home_services' && row.locationKind === 'service_area'))
  assert.equal(home.cataloguePage.total, 21)
  for (const query of ['лазерна епилация', 'laser hair removal']) {
    const laser = await discoverBusinesses({ query, cityCode: '68134' }, deps())
    assert.ok(laser.cataloguePage.total >= 50, query)
  }
  const budget = await discoverBusinesses({ query: 'за дома до 30 евро', cityCode: '68134' }, deps())
  assert.equal(budget.results.length, 0, 'reviewed category evidence must never invent unknown prices')
})

test('bad page offsets fail validation, pages use the same anti-abuse gate, and Google mode cannot page', async () => {
  for (const offset of [-1, 0.5, 5001, '15', null]) assert.equal(discoveryRequestSchema.safeParse({ ...browse, catalogueOffset: offset }).success, false)
  const request = () => new Request('https://www.gorez.co/api/public/discovery', { method: 'POST', headers: { Origin: 'https://www.gorez.co', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...browse, catalogueOffset: 15 }) })
  assert.equal((await createDiscoveryHandler(deps({ allowAttempt: async () => false }))(request())).status, 429)
  const google = deps({ config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'google' }) })
  assert.equal((await createDiscoveryHandler(google)(request())).status, 422)
})

test('page merging rejects a stale/different search, a provider plan or a looping cursor', async () => {
  const first = await discoverBusinesses(browse, deps())
  const second = await discoverBusinesses({ ...browse, catalogueOffset: 15 }, deps())
  assert.deepEqual(orderedRailRows(mergeCataloguePage(first, second).results).slice(0, 15).map(row => row.id), first.results.map(row => row.id), 'appending must not reorder already visible cards')
  for (const patch of [
    { intent: { ...second.intent, category: 'pets' } },
    { externalStatus: 'ui_kit' }, { external: { mode: 'ui_kit' } },
    { cataloguePage: { ...second.cataloguePage, offset: 14 } },
    { cataloguePage: { ...second.cataloguePage, nextOffset: 15 } },
  ]) assert.throws(() => mergeCataloguePage(first, { ...second, ...patch }), /INVALID_CATALOGUE_PAGE/)
  const repeated = mergeCataloguePage(first, { ...second, results: [first.results[0], ...second.results] })
  assert.equal(repeated.results.length, 30)
})

test('UI pagination aborts on a new query/unmount, guards stale responses, and does not scroll back on append', async () => {
  const search = await readFile(new URL('../components/discovery-search.js', import.meta.url), 'utf8')
  assert.match(search, /pageController\.current\?\.abort\(\)/)
  assert.match(search, /version === searchVersion\.current/)
  assert.match(search, /scrollAfterSearch\.current = false/)
  assert.match(search, /mergeCataloguePage\(result, data\)/)
  const rail = await readFile(new URL('../components/discovery-home-rail.js', import.meta.url), 'utf8')
  assert.match(rail, /movingRight && onNearEnd && advance\.current\.consume/)
  const browseSource = await readFile(new URL('../components/discovery-home-browse.js', import.meta.url), 'utf8')
  assert.match(browseSource, /onNearEnd=\{hasMore && !loadingMore && !moreError \? advanceBusinesses/)
  assert.match(browseSource, /resultKey \?\? result\?\.checkedAt/)
  assert.doesNotMatch(browseSource, /Още бизнеси|More businesses|home-more-businesses/)
})
