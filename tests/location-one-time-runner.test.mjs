import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { LOCATION_REVIEW_APPROVAL, MAX_LOCATION_REVIEW_REQUESTS, locationReviewTargets, locationReviewQuery, main } from '../scripts/check-catalogue-locations-once.mjs'

const directory = 'https://www.gorez.co/api/public/businesses'
const checkedOn = '2026-11-13'
const snapshot = businesses => ({ source: directory, observedOn: checkedOn, businesses })
const catalogue = (number = 1, patch = {}) => {
  const address = `София, ул. Измислена ${number}`
  return {
    id: `sofia-offline-one-time-${number}`, name: `Offline public venue ${number}`, cityCode: '68134', neighborhood: null,
    address, locationKind: 'premises', category: 'beauty', coordinates: { latitude: 42.665, longitude: 23.282, method: 'first_party_coordinates', source: 'https://example.org/contact', sourceAddress: address },
    website: 'https://example.org/', phone: '+359888000000', services: [{ name: 'Публична услуга', category: 'beauty', appointmentModel: 'appointment' }],
    booking: { kind: 'form', url: 'https://example.org/book' },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact: 'https://example.org/contact', booking: { url: 'https://example.org/book', excerpt: 'Book this synthetic appointment service.' } },
    ...patch,
  }
}
const native = patch => ({ id: '10000000-0000-4000-8000-000000000001', name: 'Offline public native venue', cityCode: '68134', neighborhood: 'Манастирски ливади', address: 'София, Манастирски ливади, ул. Измислена 7', coordinates: { latitude: 42.665, longitude: 23.282 }, ...patch })

test('one-time target selection accepts already located approved public source points, not arbitrary missing or geocoded rows', () => {
  const first = catalogue(), inBeauty = catalogue(2, { id: 'sofia-in-beauty', coordinates: null }), retired = catalogue(3, { id: 'sofia-san-krasi-barber', coordinates: null })
  const geocoded = catalogue(4, { coordinates: { ...catalogue(4).coordinates, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/node/12345', checkedOn, licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' } })
  const absent = catalogue(5, { coordinates: null })
  const rows = locationReviewTargets([first, inBeauty, retired, geocoded, absent], snapshot([]))
  assert.deepEqual(rows.map(row => row.id), ['sofia-in-beauty', first.id, 'sofia-san-krasi-barber'])
  assert.equal(rows[1].coordinates.latitude, first.coordinates.latitude, 'original business points are comparison evidence, not a new device origin')
  assert.ok(rows.every(row => row.source === 'catalogue'))
})

test('draft, expired, future, excluded general clinic and service-area rows never enter public address requests', () => {
  const good = catalogue()
  const rows = [good,
    catalogue(2, { verification: { ...good.verification, status: 'draft' } }),
    catalogue(3, { verification: { ...good.verification, checkedOn: '2026-08-01', validUntil: '2026-10-30' } }),
    catalogue(4, { verification: { ...good.verification, checkedOn: '2026-11-14' } }),
    catalogue(5, { id: 'sofia-balance-clinic' }),
    catalogue(6, { locationKind: 'service_area', address: null, coordinates: null }),
    catalogue(7, { locationKind: 'service_area' }),
  ]
  assert.deepEqual(locationReviewTargets(rows, snapshot([])).map(row => row.id), [good.id])
})

test('native evidence is a dated public-directory location-only snapshot and cannot carry unrelated account data into targets', () => {
  const source = native({ phone: '+359899123456', email: 'private-fixture@example.org', owner_id: 'private-owner', customers: ['private-customer'] })
  const before = JSON.stringify(source)
  const rows = locationReviewTargets([catalogue()], snapshot([source, native({ id: '10000000-0000-4000-8000-000000000002', coordinates: null })]))
  const selected = rows.find(row => row.source === 'gorez')
  assert.equal(selected.coordinates.source, directory)
  assert.equal(selected.coordinates.sourceAddress, source.address)
  assert.equal(selected.locationKind, 'premises')
  assert.doesNotMatch(JSON.stringify(selected), /private-fixture|private-owner|private-customer|owner_id|customers|899123456/)
  assert.equal(JSON.stringify(source), before)
  for (const bad of [{ ...snapshot([]), source: 'https://example.org/private' }, { ...snapshot([]), observedOn: '2026-11-14' }, { ...snapshot([]), businesses: {} }, snapshot(Array.from({ length: 21 }, () => native()))]) {
    assert.throws(() => locationReviewTargets([catalogue()], bad), /dated public-directory/)
  }
  for (const bad of [{ id: 'not-uuid' }, { cityCode: '56784' }, { coordinates: { latitude: 0, longitude: 0 } }, { coordinates: { latitude: '42.665', longitude: 23.282 } }]) {
    assert.throws(() => locationReviewTargets([catalogue()], snapshot([native(bad)])), /Invalid public native/)
  }
})

test('the immutable approval ceiling is 165 unique public records and cannot be expanded by duplicates or an empty cohort', () => {
  assert.equal(LOCATION_REVIEW_APPROVAL, 'public-address-integrity-20261113')
  assert.equal(MAX_LOCATION_REVIEW_REQUESTS, 165)
  const rows = Array.from({ length: 165 }, (_, index) => catalogue(index + 1))
  assert.equal(locationReviewTargets(rows, snapshot([])).length, 165)
  assert.throws(() => locationReviewTargets([...rows, catalogue(166)], snapshot([])), /limited to 165/)
  assert.throws(() => locationReviewTargets([catalogue(), catalogue()], snapshot([])), /limited to 165/)
  assert.throws(() => locationReviewTargets([], snapshot([])), /limited to 165/)
})

test('query formation includes only the public business address, not phone, email, free text or precise device fields', () => {
  const row = { ...catalogue(), phone: '+359899123456', email: 'private-fixture@example.org', query: 'private free text', visitor: { latitude: 43.123456, longitude: 25.654321 }, latitude: 43.123456, longitude: 25.654321, consent: true, accuracyMeters: 15, observedAt: Date.now() }
  const query = locationReviewQuery(row)
  assert.equal(query, 'ул. Измислена 1, София, България')
  assert.doesNotMatch(query, /899123456|private-fixture|private free text|43\.123456|25\.654321|accuracy|observedAt|consent/)
  const blockAddress = 'София, ж.к. Левски Г, бл. 2Б, М1-30'
  assert.equal(locationReviewQuery({ ...row, address: blockAddress, neighborhood: 'Левски Г' }), blockAddress + ', България')
})

test('unsafe source address text is rejected before it can become a literal external query', () => {
  for (const address of ['', 'x'.repeat(251), 'София, ул. Примерна 1\nsecret', 'София, owner@example.org', 'София, https://example.org/private', 'София, 42.665,23.282']) {
    assert.throws(() => locationReviewQuery({ ...catalogue(), address }), /Invalid public address/, address)
    assert.throws(() => locationReviewTargets([catalogue()], snapshot([native({ address })])), /Invalid public native/)
  }
})

test('missing explicit approval, relative paths and shared output paths cannot implicitly start network or writes', async () => {
  const previous = globalThis.fetch
  let networkCalls = 0
  globalThis.fetch = async () => { networkCalls++; assert.fail('This test must never perform a network request') }
  try {
    for (const args of [[], ['--offline'], ['--dry-run'], ['--approved-one-time'], ['--approved-one-time', '--native', 'relative.json', '--cache', '/tmp/unused-cache', '--output', '/tmp/unused-report'], ['--approved-one-time', '--native', '/tmp/same', '--cache', '/tmp/same', '--output', '/tmp/other']]) {
      await assert.rejects(main(args), /Explicit one-time approval/)
    }
    assert.equal(networkCalls, 0)
  } finally { globalThis.fetch = previous }
})

test('the completed target manifest pins all original public points, queries and identities with its exact approval hash', async () => {
  const manifest = JSON.parse(await readFile(new URL('../docs/catalogue-geocoding/approved-location-targets-20261113.json', import.meta.url), 'utf8'))
  assert.equal(manifest.approval, LOCATION_REVIEW_APPROVAL)
  assert.equal(manifest.maximumRequests, 165)
  assert.equal(manifest.targetCount, 165)
  assert.equal(manifest.records.length, 165)
  assert.equal(new Set(manifest.records.map(row => row.id)).size, 165)
  assert.equal(manifest.networkClosed, true)
  assert.equal(manifest.identity, '4e5ff0791b538c7f411be181e5f42772487e3972fba3f35f65c010a354124b03')
  const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
  assert.equal(hash(manifest.records), manifest.identity)
  for (const field of ['id', 'address', 'query', 'coordinates']) {
    const changed = structuredClone(manifest.records)
    changed[0][field] = field === 'coordinates' ? { latitude: 42.665, longitude: 23.282 } : `${changed[0][field]} changed`
    assert.notEqual(hash(changed), manifest.identity, field)
  }
  const allowed = new Set(['id', 'name', 'source', 'cityCode', 'neighborhood', 'address', 'locationKind', 'coordinates', 'query'])
  for (const row of manifest.records) {
    assert.ok(Object.keys(row).every(field => allowed.has(field)))
    assert.equal(row.cityCode, '68134')
    assert.equal(row.locationKind, 'premises')
    assert.ok(['gorez', 'catalogue'].includes(row.source))
    assert.doesNotMatch(row.query, /@|https?:|\d{2}\.\d+\s*[,;]\s*\d{2}\.\d+/)
  }
  const original = manifest.records.find(row => row.id === 'sofia-autoxpert')
  assert.equal(original.coordinates.latitude, 42.656535)
  assert.equal(original.coordinates.longitude, 23.327307)
  assert.equal(manifest.records.find(row => row.id === 'sofia-in-beauty').coordinates, null)
})

test('completed network approval rejects even well-formed live invocations before any cache read or fetch', async () => {
  const previous = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; assert.fail('Completed one-time approval cannot make another request') }
  try {
    await assert.rejects(main(['--approved-one-time', '--native', '/tmp/never-read-one-time-native.json', '--cache', '/tmp/never-read-one-time-cache.json', '--output', '/tmp/never-written-one-time-report.json']), /completed; only offline reclassification/)
    assert.equal(calls, 0)
  } finally { globalThis.fetch = previous }
})

test('runner revalidates the ledger inside the exclusive lock and reclassifies frozen records, never current enriched points', async () => {
  const source = await readFile(new URL('../scripts/check-catalogue-locations-once.mjs', import.meta.url), 'utf8')
  const mainSource = source.slice(source.indexOf('export async function main'))
  assert.match(mainSource, /const targets = approvedTargets\.records/)
  assert.doesNotMatch(mainSource, /locationReviewTargets\(SOFIA_CATALOGUE/)
  assert.match(mainSource, /createHash\('sha256'\)\.update\(JSON\.stringify\(targets\)\)/)
  const lockAt = mainSource.indexOf("await open(lockPath, 'wx')")
  const reloadAt = mainSource.indexOf('cache = await loadCache()', lockAt)
  const loopAt = mainSource.indexOf('for (const row of targets)', lockAt)
  const fetchAt = mainSource.indexOf('await fetch(', lockAt)
  assert.ok(lockAt >= 0 && reloadAt > lockAt && loopAt > reloadAt && fetchAt > reloadAt)
  assert.match(mainSource, /allowed\.get\(entry\.id\) !== entry\.query/)
  assert.match(mainSource, /Object\.keys\(value\.lookups\)\.some\(query => !allowedQueries\.has\(query\)\)/)
  assert.match(mainSource, /cache\.networkClosed = true/)
})
