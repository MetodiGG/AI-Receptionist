import test from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout } from 'node:timers/promises'
import { hydrateInternalCandidates, normalizeInternalBusinesses, readInternalCandidates } from '../lib/discovery/internal-search.mjs'
import { readPublishedSearchInventory } from '../lib/discovery/public-search-inventory.mjs'
import { attachNativeLocationEvidence, publicNativeBusinessLocation } from '../lib/native-location-evidence.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { verifiedNativeFixture } from './helpers/verified-native-location.mjs'

const id = n => `11b04e55-02eb-483a-8bdf-${String(n).padStart(12, '0')}`
const point = { latitude: 42.6906, longitude: 23.3198 }
const service = n => ({ id: String(n).padStart(5, '0'), name: 'Маникюр с гел лак', category: 'nails', price: 30,
  currency: 'EUR', active: true, duration_min: 30 })
const native = (n = 1) => verifiedNativeFixture({ id: id(n), slug: `native-${n}`, name: `Native ${n}`, active: true,
  platform_status: 'enabled', city_ekatte: '68134', city: 'София', neighborhood: 'Център',
  address: 'София, бул. Сливница 178Е', industry: 'beauty', services: [service(n)] }, point)
const intent = { searchV2: true, sofiaOnly: true, cityCode: '68134', browse: true, requirements: [] }
const missing = { code: 'PGRST200', message: "Could not find a relationship between 'businesses' and 'registration_location_sources' in the schema cache" }
const serviceBound = { referencedTable: 'services' }
const withoutEmbed = ({ location_revision, location_source, ...row }) => row
const withoutPoints = n => ({ ...native(n), public_profile: {}, location_source: null })

function fixture({ index = [native()], rich = index, evidence = index, allServices = [], failures = {}, delay = 0,
  requestCost = 80 } = {}) {
  const queries = []
  let simulatedLatency = 0
  const db = {
    from(table) {
      assert.ok(['businesses', 'services'].includes(table), `unexpected schema access: ${table}`)
      const record = { table, constraints: [] }
      const query = {
        select(fields) { record.fields = fields; return query },
        then(resolve, reject) {
          const execute = async () => {
            const embed = record.fields.includes('location_source:registration_location_sources(')
            const base = table === 'services' ? 'services' : record.fields.startsWith('id,address,city,city_ekatte') ? 'evidence'
              : record.fields.includes('workingHours:working_hours') ? 'rich' : 'index'
            record.kind = ['services', 'evidence'].includes(base) ? base : `${base}-${embed ? 'embed' : 'plain'}`
            queries.push(record)
            simulatedLatency += requestCost
            if (delay > 0) await setTimeout(delay)
            if (failures[record.kind]) return { error: failures[record.kind], data: null }
            const cursor = record.constraints.find(([op, column]) => op === 'gt' && column === 'id')?.[2]
            if (base === 'services') return { data: allServices.filter(row => !cursor || row.id > cursor).slice(0, 500), error: null }
            if (base === 'evidence') return { data: evidence, error: null }
            const source = (base === 'index' ? index : rich).filter(row => !cursor || row.id > cursor).slice(0, 500)
            const rows = base === 'index' ? source.map(({ public_profile = {}, ...row }) => ({
              ...row, latitude: public_profile.latitude, longitude: public_profile.longitude, location_kind: public_profile.location_kind,
            })) : source
            return { data: embed ? rows : rows.map(withoutEmbed), error: null }
          }
          return execute().then(resolve, reject)
        },
      }
      for (const operation of ['eq', 'in', 'order', 'limit', 'gt']) query[operation] = (...args) => {
        record.constraints.push([operation, ...args]); return query
      }
      return query
    },
  }
  return { db, queries, elapsed: () => simulatedLatency }
}

test('embedding reads verified points and same business fields in two serialized requests rather than four', async t => {
  const current = fixture({ delay: 6 })
  const previous = fixture({ delay: 6 })
  const started = performance.now()
  const first = await readInternalCandidates(current.db, intent, { fresh: true })
  const final = await hydrateInternalCandidates(current.db, [id(1)])
  const elapsed = performance.now() - started
  // The historical phases first read the matching base projection, then use
  // the actual old location helper for another DB request before continuing.
  const previousStarted = performance.now()
  const oldIndexFields = current.queries[0].fields.split(',location_revision,location_source:')[0]
  const oldRichFields = current.queries[1].fields.split(',location_revision,location_source:')[0]
  const { data: oldIndex } = await previous.db.from('businesses').select(oldIndexFields)
  const oldFirst = (await attachNativeLocationEvidence(previous.db, oldIndex)).map(row => ({ ...row,
    public_profile: { description: '', latitude: row.latitude, longitude: row.longitude, payments: [] },
  }))
  const { data: oldSelected } = await previous.db.from('businesses').select(oldRichFields)
  const oldFinal = await attachNativeLocationEvidence(previous.db, oldSelected)
  const previousElapsed = performance.now() - previousStarted
  assert.deepEqual(first, oldFirst)
  assert.deepEqual(final, oldFinal)
  assert.deepEqual(current.queries.map(row => row.kind), ['index-embed', 'rich-embed'])
  assert.deepEqual(previous.queries.map(row => row.kind), ['index-plain', 'evidence', 'rich-plain', 'evidence'])
  assert.equal(current.elapsed(), 160)
  assert.equal(previous.elapsed(), 320)
  assert.ok(current.queries.every(({ fields }) => !fields.includes('!inner')), 'unlocated businesses must stay eligible')
  const [display] = normalizeInternalBusinesses(final, intent)
  assert.deepEqual(display.coordinates, point)
  assert.equal(display.locationVerified, true)
  assert.match(display.address, /бул\. Сливница 178Е$/u)
  assert.equal(new URL(businessMapsDirectionsUrl(display)).searchParams.get('destination'), '42.6906,23.3198')
  t.diagnostic(`fixture latency budget (80 ms per serialized request): 320 → 160 ms; local timed stubs (6 ms delay): ${previousElapsed.toFixed(1)} → ${elapsed.toFixed(1)} ms`)
})

test('null, revoked or mismatched evidence never triggers another lookup, directions, or a fabricated nearby result', async () => {
  const rows = [native(1), native(2), native(3), native(4), native(5), native(6)]
  rows[0].location_source = null
  rows[1].location_revision++
  rows[2].location_source = { ...rows[2].location_source, latitude: 42.68 }
  rows[3].location_source = { ...rows[3].location_source, match_version: 1 }
  rows[4].public_profile.location_kind = 'service_area'
  rows[5].location_source = { ...rows[5].location_source, source_url: 'https://unverified.example/node/123' }
  const { db, queries } = fixture({ index: rows })
  const sources = [
    await readInternalCandidates(db, intent, { fresh: true }),
    await hydrateInternalCandidates(db, rows.map(row => row.id)),
  ]
  for (const data of sources) {
    assert.deepEqual(data.map(row => publicNativeBusinessLocation(row).locationStatus),
      ['unverified', 'unverified', 'unverified', 'unverified', 'not_visit_location', 'unverified'])
    const display = normalizeInternalBusinesses(data, intent)
    assert.equal(display.length, rows.length, 'listings still appear in city browse without a precise point')
    assert.ok(display.every(row => row.coordinates === null && row.distanceKm === null && businessMapsDirectionsUrl(row) === null))
    assert.deepEqual(normalizeInternalBusinesses(data, { ...intent, coordinates: point, radiusKm: 5 }), [])
  }
  assert.deepEqual(queries.map(row => row.kind), ['index-embed', 'rich-embed'])
})

test('revalidation remains limited to selected active businesses and their complete active menus', async () => {
  const rows = [native(1), native(2), native(3), native(4)]
  const unexpectedRich = native(5)
  const rich = [{ ...rows[0], services: Array.from({ length: 500 }, (_, i) => service(i + 1)) },
    { ...rows[1], platform_status: 'disabled' }, { ...rows[2], active: false },
    { ...rows[3], address: 'бул. Сливница 178', location_revision: 2 }, unexpectedRich]
  const allServices = Array.from({ length: 501 }, (_, i) => service(i + 1))
  allServices.push({ ...service(502), active: false })
  const { db, queries } = fixture({ index: rows, rich, allServices })
  const estimate = await readInternalCandidates(db, intent, { fresh: true })
  const final = await hydrateInternalCandidates(db, [...estimate.map(row => row.id), rows[0].id, 'untrusted'])
  assert.deepEqual(final.map(row => row.id), [id(1), id(4)])
  assert.equal(final[0].services.length, 501)
  assert.equal(final[0].services.at(-1).id, '00501')
  assert.equal(publicNativeBusinessLocation(final[1]).coordinates, null, 'old address revision cannot retain points')
  assert.deepEqual(queries.map(row => row.kind), ['index-embed', 'rich-embed', 'services', 'services'])
  assert.deepEqual(queries[1].constraints, [
    ['in', 'id', [id(1), id(2), id(3), id(4)]], ['eq', 'active', true], ['eq', 'platform_status', 'enabled'],
    ['eq', 'services.active', true], ['eq', 'staff.active', true], ['limit', 15], ['limit', 500, serviceBound],
    ['limit', 40, { referencedTable: 'staff' }], ['limit', 280, { referencedTable: 'workingHours' }],
  ])
  assert.deepEqual(queries[2].constraints, [['eq', 'business_id', id(1)], ['eq', 'active', true], ['order', 'id'], ['limit', 500]])
  assert.deepEqual(queries[3].constraints.at(-1), ['gt', 'id', '00500'])
})

test('recognized missing schema uses the original split read, preserving match and race protection', async () => {
  const stale = { ...native(2), address: 'бул. Сливница 178' }
  const failures = { 'index-embed': missing, 'rich-embed': missing }
  const { db, queries } = fixture({ index: [native(1), native(2)], evidence: [native(1), stale], failures })
  for (const data of [await readInternalCandidates(db, intent, { fresh: true }), await hydrateInternalCandidates(db, [id(1), id(2)])]) {
    assert.deepEqual(data.map(row => publicNativeBusinessLocation(row).coordinates), [point, null])
  }
  assert.deepEqual(queries.map(row => row.kind), ['index-embed', 'index-plain', 'evidence', 'rich-embed', 'rich-plain', 'evidence'])
  const unavailable = fixture({ failures: { ...failures, evidence: { code: '42501', message: 'permission denied for table registration_location_sources' } } })
  const [listing] = await hydrateInternalCandidates(unavailable.db, [id(1)])
  assert.equal(publicNativeBusinessLocation(listing).coordinates, null)
  assert.deepEqual(unavailable.queries.map(row => row.kind), ['rich-embed', 'rich-plain', 'evidence'])
})

test('known optional schema is negotiated once across index pages; unrelated errors are not retried', async () => {
  const optionalColumn = { code: 'PGRST204', message: "Could not find the 'location_revision' column of 'businesses' in the schema cache" }
  const { db, queries } = fixture({ index: Array.from({ length: 501 }, (_, i) => withoutPoints(i + 1)),
    failures: { 'index-embed': optionalColumn } })
  assert.equal((await readPublishedSearchInventory(db, { cityCode: '68134', fresh: true })).length, 501)
  assert.deepEqual(queries.map(row => row.kind), ['index-embed', 'index-plain', 'index-plain'])
  assert.deepEqual(queries[2].constraints.at(-1), ['gt', 'id', id(500)])
  for (const error of [
    { code: 'PGRST200', message: "Could not find a relationship between 'businesses' and 'services'" },
    { code: '42501', message: 'permission denied for table registration_location_sources' },
    { code: '08006', message: 'connection failure' },
  ]) {
    const nativeFailure = fixture({ failures: { 'index-embed': error, 'rich-embed': error } })
    await assert.rejects(readPublishedSearchInventory(nativeFailure.db, { fresh: true }), value => value === error)
    await assert.rejects(hydrateInternalCandidates(nativeFailure.db, [id(1)]), value => value === error)
    assert.deepEqual(nativeFailure.queries.map(row => row.kind), ['index-embed', 'rich-embed'])
  }
})
