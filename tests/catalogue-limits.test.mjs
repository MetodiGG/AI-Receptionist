import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { CATALOGUE_MAX_RECORDS, CATALOGUE_PARTNER_CAPACITY, CATALOGUE_MAX_SEARCH_ROWS } from '../lib/discovery/catalogue-limits.mjs'
import { CATALOGUE_MAX_RECORDS as policyMax, validateCatalogue, approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { orderedRailRows } from '../lib/discovery/rail.mjs'
import { discoveryRequestSchema } from '../lib/discovery/intent.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { verifyDiscoveryAvailability } from '../lib/discovery/internal-search.mjs'

const now = DateTime.fromISO('2026-11-11T12:00:00Z')
const browse = { query: '', browse: true, cityCode: '68134' }
const minimalRows = count => Array.from({ length: count }, (_, index) => ({
  id: `probe-${index}`, source: 'catalogue', name: `Probe ${String(index).padStart(5, '0')}`, coordinates: null,
}))

test('shared bounds are client-safe primitives, with room for the existing bounded partners', async () => {
  assert.equal(CATALOGUE_MAX_RECORDS, 20000)
  assert.equal(policyMax, CATALOGUE_MAX_RECORDS)
  assert.equal(CATALOGUE_PARTNER_CAPACITY, 100)
  assert.equal(CATALOGUE_MAX_SEARCH_ROWS, 20100)
  const source = await readFile(new URL('../lib/discovery/catalogue-limits.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /^\s*import\s|node:|server-only|from\s+['"]/m)
  const internal = await readFile(new URL('../lib/discovery/internal-search.mjs', import.meta.url), 'utf8')
  assert.match(internal, /\.order\('id'\)\.limit\(100\)/, 'the independent live partner candidate cap remains 100')
  const admin = await readFile(new URL('../lib/catalogue-photo-server.js', import.meta.url), 'utf8')
  assert.match(admin, /rows\.slice\(offset, offset \+ 40\)/, 'admin photo pages remain 40 rows')
})

test('global ranking and appended catalogue cards retain rows beyond 5000, without enlarging default/provider pages', () => {
  const rows = minimalRows(6001)
  const ranked = rankCatalogueBusinesses([], rows, { cityCode: '68134' }, CATALOGUE_MAX_SEARCH_ROWS)
  assert.equal(ranked.length, 6001)
  assert.equal(ranked.at(-1).id, 'probe-6000')
  assert.equal(rankCatalogueBusinesses([], rows, { cityCode: '68134' }).length, 15)
  assert.equal(orderedRailRows(ranked).length, 6001)
  assert.equal(orderedRailRows(ranked, { preserveOrder: true }).at(-1).id, 'probe-6000')
  const partners = rows.map(row => ({ ...row, source: 'gorez' }))
  assert.equal(orderedRailRows(partners, { preserveOrder: true }).length, 6001)
  assert.equal(orderedRailRows(partners).length, 15, 'non-catalogue rail behavior remains bounded')
  const google = rows.slice(0, 40).map(row => ({ ...row, source: 'google', placeId: row.id }))
  assert.equal(orderedRailRows(google).length, 15)
})

test('public catalogue cursors accept the extended finite range, not malformed or unbounded offsets', () => {
  for (const offset of [0, 5001, 10000, CATALOGUE_MAX_SEARCH_ROWS]) {
    assert.equal(discoveryRequestSchema.safeParse({ ...browse, catalogueOffset: offset }).success, true)
  }
  for (const offset of [-1, 0.5, CATALOGUE_MAX_SEARCH_ROWS + 1, Infinity, NaN, '10000', null]) {
    assert.equal(discoveryRequestSchema.safeParse({ ...browse, catalogueOffset: offset }).success, false)
  }
})

test('late catalogue pages expose their actual tail and total while responses/photos stay at most 15', async () => {
  const seed = SOFIA_CATALOGUE.find(row => approvedCatalogueRecord(row, now.toMillis()))
  assert.ok(seed)
  // A compact fixture just beyond the old bound, not a costly 20000-row run.
  const records = validateCatalogue(Array.from({ length: 6001 }, (_, index) => ({
    ...seed, id: `sofia-page-probe-${String(index).padStart(5, '0')}`,
    name: `Page Probe ${String(index).padStart(5, '0')}`, address: `Test-only address ${index}`,
    locationKind: 'premises', coordinates: null, services: seed.services.slice(0, 1),
  })))
  const forbidden = () => assert.fail('browse must not call providers, budgets, bookings or live availability')
  const photoReads = []
  const dependencies = {
    now, config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), readInternal: async () => [], readCatalogue: async () => records,
    readCataloguePhotos: async ids => { photoReads.push(ids); return [] },
    fetcher: forbidden, claimBudget: forbidden, authorizeGoogle: forbidden, getBusiness: forbidden, getSlots: forbidden,
  }
  for (const offset of [4995, 5000, 5995, CATALOGUE_MAX_SEARCH_ROWS]) {
    const result = await discoverBusinesses({ ...browse, catalogueOffset: offset }, dependencies)
    const count = Math.max(0, Math.min(15, records.length - offset))
    assert.equal(result.cataloguePage.total, 6001)
    assert.equal(result.cataloguePage.offset, offset)
    assert.equal(result.results.length, count)
    assert.equal(result.cataloguePage.nextOffset, offset + count < records.length ? offset + count : null)
    if (count) assert.equal(result.results[0].id, `sofia-page-probe-${String(offset).padStart(5, '0')}`)
    if (offset === 5995) assert.equal(result.results.at(-1).id, 'sofia-page-probe-06000')
    assert.deepEqual(photoReads.at(-1), result.results.map(row => row.id))
    assert.ok(photoReads.at(-1).length <= 15)
  }
})

test('live availability remains at four partner businesses and two real services each', async () => {
  let businesses = 0, slots = 0
  const services = [{ id: 'one', name: 'One' }, { id: 'two', name: 'Two' }]
  const partners = Array.from({ length: CATALOGUE_PARTNER_CAPACITY }, (_, index) => ({
    id: `partner-${index}`, slug: `partner-${index}`, source: 'gorez', booking_mode: 'gorez', services,
    availability: { status: 'unknown', slots: [] },
  }))
  const result = await verifyDiscoveryAvailability(partners, { date: '2026-11-12' }, {
    getBusiness: async () => { businesses++; return { services, timezone: 'Europe/Sofia' } },
    getSlots: async () => { slots++; return [{ startsAt: '2026-11-12T10:00:00Z', endsAt: '2026-11-12T10:30:00Z', staffId: 'staff' }] },
  })
  assert.equal(businesses, 4)
  assert.equal(slots, 8)
  assert.equal(result.length, CATALOGUE_PARTNER_CAPACITY)
  assert.equal(result.filter(row => row.availability.status === 'verified').length, 4)
})
