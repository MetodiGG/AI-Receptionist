import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { publicPartnerPlaceExclusions } from '../lib/discovery/partner-place-exclusions.mjs'
import { railScrollState, railScrollTarget, renderedGooglePlaceIds } from '../lib/discovery/rail-scroll.mjs'
import { compareExternalRatings, orderedRailRows } from '../lib/discovery/rail.mjs'
import { laboratorySearchService, laboratoryShortcuts } from '../lib/discovery/laboratories.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { interpretDiscoveryIntent } from '../lib/discovery/ai-intent.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'
import { matchingServices } from '../lib/discovery/internal-search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const id = '10000000-0000-4000-8000-000000000001', admin = '20000000-0000-4000-8000-000000000001', placeId = 'QA_LINKED_PARTNER_PLACE'
const link = patch => ({ business_id: id, place_id: placeId, verified_by: admin, verified_at: '2026-11-01T12:00:00Z', business: { id, active: true, platform_status: 'enabled' }, ...patch })

test('external exclusions require exact admin-reviewed IDs and public active businesses, never matching names', () => {
  assert.deepEqual([...publicPartnerPlaceExclusions([link()], [placeId])], [placeId])
  for (const row of [link({ verified_by: null }), link({ verified_at: '2030-01-01' }), link({ business: { id, active: false, platform_status: 'enabled' } }), link({ business: { id, active: true, platform_status: 'suspended' } }), link({ business: { id: admin, active: true, platform_status: 'enabled' } }), link({ place_id: 'A_DIFFERENT_BRANCH' })]) assert.equal(publicPartnerPlaceExclusions([row], [placeId]).size, 0)
})
test('a public partner outside the selected category/page is still excluded from the Google list by exact ID', async () => {
  const d = { config: { ...discoveryConfig({ DISCOVERY_PROVIDER_MODE: 'google' }), enabled: true, uiKitEnabled: true, googleKey: 'fake-key', browserKey: 'fake-restricted-key', searchV2Enabled: true }, claimBudget: async () => true, readInternal: async () => [], readLinks: async () => [], readPartnerPlaces: async ids => { assert.deepEqual(ids, [placeId, 'QA_UNLINKED_PLACE']); return [link()] }, fetcher: async () => Response.json({ places: [{ id: placeId }, { id: 'QA_UNLINKED_PLACE' }] }) }
  const result = await discoverBusinesses({ query: '', browse: true, cityCode: '68134' }, d)
  assert.equal(result.results.length, 0)
  assert.deepEqual(result.external.placeIds, ['QA_UNLINKED_PLACE'])
  assert.doesNotMatch(JSON.stringify(result), /QA_LINKED_PARTNER_PLACE/)
})
test('all-linked Google results leave no empty widget reservation or duplicate entry', async () => {
  const calls = [], result = await discoverBusinesses({ query: '', browse: true, cityCode: '68134' }, { config: { ...discoveryConfig({ DISCOVERY_PROVIDER_MODE: 'google' }), enabled: true, uiKitEnabled: true, googleKey: 'fake-key', browserKey: 'fake-restricted-key' }, claimBudget: async (...args) => { calls.push(args); return true }, readInternal: async () => [], readPartnerPlaces: async () => [link()], fetcher: async () => Response.json({ places: [{ id: placeId }] }) })
  assert.deepEqual(calls, [['google', 'ids']]); assert.equal(result.external, null)
})
test('clamped native carousel controls cannot target blank space past the last card, including Safari elastic offsets', () => {
  const metrics = { scrollLeft: 0, clientWidth: 300, scrollWidth: 1200 }
  assert.deepEqual(railScrollState(metrics), { left: 0, max: 900, start: true, end: false })
  assert.equal(railScrollTarget(metrics, 1), 240)
  assert.equal(railScrollTarget({ ...metrics, scrollLeft: 850 }, 1), 900)
  assert.equal(railScrollTarget({ ...metrics, scrollLeft: 9000 }, 1), 900)
  assert.equal(railScrollTarget({ ...metrics, scrollLeft: -200 }, -1), 0)
  assert.deepEqual(railScrollState({ ...metrics, scrollLeft: 950 }), { left: 900, max: 900, start: false, end: true })
  assert.equal(railScrollTarget({ scrollWidth: 250, clientWidth: 300, scrollLeft: 0 }, 1), 0)
  assert.equal(railScrollState({}).max, 0)
})
test('native Google width counts only actually rendered, unique and expected IDs after load', () => {
  assert.deepEqual(renderedGooglePlaceIds({ places: [{ id: 'a' }, { id: 'a' }, { id: 'unknown' }, { id: 'b' }] }, ['a', 'b', 'failed']), ['a', 'b'])
  assert.deepEqual(renderedGooglePlaceIds({ places: [] }, ['failed']), [])
  assert.equal(renderedGooglePlaceIds({}, ['pending']), null)
})
test('allowed numeric external ratings descend inside their proximity band; unknown/invalid ratings go last', () => {
  const place = (id, rating, reviewCount = 0, proximityBand = 'nearby') => ({ id, placeId: id, source: 'google', rating, reviewCount, proximityBand })
  const rows = [place('low', 4), place('high', 4.9, 20), place('unknown', undefined), place('far-high', 5, 100, 'further'), place('high-more', 4.9, 40)]
  assert.deepEqual(orderedRailRows(rows).map(row => row.id), ['high-more', 'high', 'low', 'unknown', 'far-high'])
  assert.equal(compareExternalRatings(place('invalid', 8), place('missing', undefined)), 0)
  assert.equal(compareExternalRatings(place('lowest', 1), place('missing', undefined)), -1)
})
test('all requested laboratory names and generic BG/EN phrases resolve to Other without fabricating business data', () => {
  for (const [query, brand] of [['Genica', 'Genica'], ['Геника', 'Genica'], ['Synevo', 'Synevo'], ['синево', 'Synevo'], ['Cibalab', 'Cibalab'], ['Цибалаб', 'Cibalab'], ['Ramus', 'Ramus'], ['Рамус', 'Ramus'], ['кръвни изследвания', null], ['medical laboratory', null]]) {
    const input = discoveryRequestSchema.parse({ query, locale: 'bg', cityCode: '68134' }), intent = parseIntent(input, undefined, { v2: true })
    assert.equal(intent.category, 'other', query); assert.equal(intent.clarification, null, query)
    assert.equal(intent.service, `медицинска лаборатория${brand ? ` ${brand}` : ''}`, query)
    const request = googleSearchRequest({ ...intent, searchV2: true })
    assert.equal(request.body.includedType, 'medical_lab'); assert.equal(request.body.strictTypeFiltering, true)
    if (brand) assert.ok(request.body.textQuery.includes(brand))
    assert.equal('availability' in intent, false)
  }
  assert.equal(laboratorySearchService('photographer'), null)
  assert.equal(laboratorySearchService('genically'), null)
  assert.deepEqual(laboratoryShortcuts().map(row => row.label), ['Лаборатории за изследвания', 'Genica', 'Synevo', 'Cibalab', 'Ramus'])
})
test('laboratory discovery drops clinical narratives from provider text and never calls the AI provider', async () => {
  const input = discoveryRequestSchema.parse({ query: 'Искам Synevo, имам болка и таен резултат ABC', cityCode: '68134' })
  const interpreted = await interpretDiscoveryIntent(input, { config: { searchV2Enabled: true, aiEnabled: true, aiKey: 'fake' }, fetcher: () => assert.fail('no AI'), claimBudget: () => assert.fail('no AI budget') })
  assert.equal(interpreted.mode, 'rules')
  const request = googleSearchRequest({ ...interpreted.intent, searchV2: true })
  assert.equal(request.body.textQuery, 'медицинска лаборатория Synevo, София, България')
})
test('laboratory aliases also work when Search 2.0 is rolled back, without bypassing explicit categories or ambiguity', () => {
  for (const query of ['Genica', 'Синево', 'Цибалаб', 'Рамус', 'кръвни изследвания']) {
    const input = discoveryRequestSchema.parse({ query, cityCode: '68134' }), intent = parseIntent(input)
    assert.equal(intent.category, 'other', query)
    assert.equal(intent.clarification, null, query)
    assert.equal(googleSearchRequest(intent).body.includedType, 'medical_lab', query)
  }
  const explicit = parseIntent(discoveryRequestSchema.parse({ query: 'Genica', category: 'nails', cityCode: '68134' }))
  assert.equal(explicit.category, 'nails')
  const ambiguous = parseIntent(discoveryRequestSchema.parse({ query: 'маникюр и лаборатория', cityCode: '68134' }))
  assert.equal(ambiguous.clarification?.field, 'category')
})
test('internal laboratory bookings require actual active laboratory services and exact requested brand evidence', () => {
  const business = { name: 'Genica', services: [{ id: 'blood', name: 'Пълна кръвна картина', active: true }, { id: 'urine', name: 'Изследване на урина', active: false }, { id: 'other', name: 'Консултация' }] }
  const intent = { category: 'other', service: 'медицинска лаборатория Genica', searchV2: true }
  assert.deepEqual(matchingServices(business, intent).map(row => row.id), ['blood'])
  assert.equal(matchingServices({ ...business, name: 'Another clinic' }, intent).length, 0)
  assert.equal(matchingServices({ ...business, services: [{ id: 'no-evidence', name: 'Годишна карта' }] }, intent).length, 0)
})
test('scroll performance is frame-coalesced, provider bundles load on demand and route shells cannot call providers', async () => {
  const rail = await read('components/discovery-home-rail.js'), browse = await read('components/discovery-home-browse.js'), css = await read('app/discovery-home.css')
  assert.match(rail, /if \(frame.current !== null\) return/); assert.match(rail, /requestAnimationFrame/)
  assert.match(rail, /current.start === start && current.end === end \? current/)
  assert.match(browse, /dynamic\(\(\) => import\('\.\/google-business-card'\)/)
  assert.match(css, /overscroll-behavior-x: none/)
  const loading = await read('components/public-route-loading.js')
  assert.match(loading, /role="status"/); assert.doesNotMatch(loading, /fetch\(|<Discovery|<Google|useEffect|supabase/i)
  assert.match(await read('components/discovery-search.js'), /home && category === 'other'/)
})
