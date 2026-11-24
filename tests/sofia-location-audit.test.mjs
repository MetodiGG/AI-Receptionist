import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { auditPostalComponents, auditSofiaLocations, fetchPublicNativeLocationSnapshot, PUBLIC_PARTNER_DIRECTORY } from '../scripts/audit-sofia-location-integrity.mjs'
import { planSofiaLocationCorrections } from '../scripts/plan-sofia-location-corrections.mjs'
import { RAW_SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { publicBusinessLocation } from '../lib/business-directions.mjs'

const date = '2026-11-24T20:22:20Z'
const business = 'e5b029ba-3586-485b-ac19-978a8386922d'
const other = 'bbbbbbbb-8888-4888-8888-888888888888'
const point = { latitude: 42.704331, longitude: 23.325092 }
const nativeSnapshot = (businesses, scope = 'all_native_businesses') =>
  ({ schemaVersion: 1, scope, capturedAt: date, businesses })
const sofia = { city_ekatte: '68134', city: 'София', neighborhood: 'Център' }

test('audit metadata preserves exact suffix script, street type, grouping and original address', () => {
  assert.deepEqual(auditPostalComponents('бул. „Сливница“ 178Е, София, бл. 12А, вх. Б, ет. 2, офис 4'),
    { streetType: 'boulevard', streetName: 'Сливница', buildingNumber: '178Е', block: '12А', entrance: 'Б', floor: '2', unit: '4' })
  assert.equal(auditPostalComponents('ул. Сливница 178E, София').buildingNumber, '178E')
  assert.equal(auditPostalComponents('ул. Сливница 178E, София').streetType, 'street')
  assert.equal(auditPostalComponents('бул. Сливница 178–180, София').buildingNumber, '178–180')
  assert.equal(auditPostalComponents('До спирката, София').buildingNumber, null)
})

test('the full runtime source contains two candidates at 178, neither at 178Е', () => {
  const report = auditSofiaLocations(RAW_SOFIA_CATALOGUE, { now: Date.parse(date) })
  assert.equal(report.totals.examined, RAW_SOFIA_CATALOGUE.length)
  assert.deepEqual(report.reportedCase.candidates.map(row => row.id).sort(), ['sofia-ax-horca-slivnitsa178', 'sofia-simda-slivnitsa178-dance'])
  assert.deepEqual(report.reportedCase.exactCyrillicSuffixIds, [])
  assert.deepEqual(report.reportedCase.latinSuffixCandidateIds, [])
})

test('the review queue withholds both separate settlement hits and boundary ambiguities without rewriting their addresses', () => {
  const rows = RAW_SOFIA_CATALOGUE.filter(row =>
    ['sofia-autotest-gtp-metro-lyulin', 'sofia-bultraco-honda-astreco40'].includes(row.id))
  const report = auditSofiaLocations(rows, { now: Date.parse(date) })
  assert.equal(report.totals.conflict, 2)
  assert.equal(report.totals.awaiting_review, 2)
  assert.deepEqual(report.review.map(row => row.reason), ['separate_settlement', 'boundary_review'])
  for (const row of report.records) {
    assert.equal(row.originalAddress, rows.find(base => base.id === row.id).address)
    assert.equal(row.currentDirectionsDestination, null)
  }
})

test('public audit retains pending partner status independently, avoids street search, and does not transfer a nearby branch pin', () => {
  const snapshot = nativeSnapshot([
    { ...sofia, id: business, name: 'A different venue', address: 'бул. Сливница 178Е', coordinates: point, active: false, platform_status: 'pending', place_id: 'abcd_efgh' },
    { id: other, name: 'Second branch', city_ekatte: '44238', city: 'Лом', address: 'ул. Сливница 178Е', active: true, platform_status: 'enabled' },
  ])
  const report = auditSofiaLocations([], { nativeSnapshot: snapshot, now: Date.parse(date) })
  assert.deepEqual(report.reportedCase.exactCyrillicSuffixIds, [business])
  const record = report.records.find(row => row.id === business)
  assert.equal(record.originalAddress, 'бул. Сливница 178Е')
  assert.equal(record.currentDirectionsDestination, null)
  assert.equal(record.placeUsedInDirections, false)
  assert.equal(record.publication.sourceStatus, 'pending')
  assert.equal(report.records.find(row => row.id === other).locationStatus, 'outside_sofia')
})

test('the public source adapter uses one fixed read and discards unrelated fields', async () => {
  const raw = { ...sofia, id: business, name: 'Test', address: 'София, бул. Сливница 178Е' }
  const verified = publicBusinessLocation(raw, point)
  let calls = 0
  const snapshot = await fetchPublicNativeLocationSnapshot(async (url, options) => {
    assert.equal(url, PUBLIC_PARTNER_DIRECTORY)
    assert.equal(options.redirect, 'error')
    calls++
    return new Response(JSON.stringify({ businesses: [{ ...raw, ...verified, website: 'https://example.com', internal: 'private' }] }))
  })
  assert.equal(calls, 1)
  assert.equal(snapshot.scope, 'public_native_directory')
  assert.equal(snapshot.businesses[0].internal, undefined)
  assert.equal(auditSofiaLocations([], { nativeSnapshot: snapshot }).records[0].locationStatus, 'verified_sofia')
  snapshot.businesses[0].address = 'София, бул. Сливница 178E'
  assert.equal(auditSofiaLocations([], { nativeSnapshot: snapshot }).records[0].currentDirectionsDestination, null)
  await assert.rejects(fetchPublicNativeLocationSnapshot(async () => new Response('{}', { status: 503 })), /HTTP 503/u)
})

test('native registration-point evidence must bind matching exact raw address and profile values at the reviewed version', () => {
  const row = { ...sofia, id: other, name: 'Registration branch', address: 'бул. Сливница 178Е', coordinates: point, active: true, platform_status: 'enabled' }
  const source = { ...point, match_version: 2, address_key_matches: true, profile_point_matches: true, location_revision_matches: true,
    source_url: 'https://www.openstreetmap.org/node/123', checked_at: date, licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' }
  const run = registration_source => auditSofiaLocations([], { nativeSnapshot: nativeSnapshot([{ ...row, registration_source }]) }).records[0]
  assert.equal(run(source).locationStatus, 'verified_sofia')
  assert.equal(run({ ...source, match_version: 1 }).currentDirectionsDestination, null)
  assert.equal(run({ ...source, address_key_matches: false }).currentDirectionsDestination, null)
  assert.equal(run({ ...source, location_revision_matches: false }).currentDirectionsDestination, null)
  assert.equal(run({ ...source, latitude: 42.705 }).currentDirectionsDestination, null)
})

test('the privileged export is read-only and includes all account states without private content fields', async () => {
  const db = new PGlite()
  try {
    await db.exec(`create table businesses(id uuid primary key,name text,slug text,city text,city_ekatte text,neighborhood text,
      address text,public_profile jsonb,active boolean,platform_status text,content_revision bigint,platform_revision bigint,phone text);
      create table registration_location_sources(business_id uuid,address_key text,latitude numeric,longitude numeric,
        source_url text,checked_at timestamptz,licence text,attribution text);
      create table business_place_links(business_id uuid,place_id text,verified_at timestamptz);
      create table partner_leads(business_id uuid,status text,setup_summary jsonb,email text);`)
    await db.query('insert into businesses values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [
      other, 'Branch', 'branch', 'София', '68134', 'Център', 'бул. Сливница 178Е',
      JSON.stringify({ ...point, private: 'exclude' }), false, 'pending', 5, 7, 'exclude',
    ])
    await db.exec(`insert into registration_location_sources select id,md5(jsonb_build_array(city_ekatte,neighborhood,address)::text),
      42.704331,23.325092,'https://www.openstreetmap.org/node/123',now(),'ODbL-1.0','© OpenStreetMap contributors' from businesses;
      insert into partner_leads select id,'new','{"address":"original"}'::jsonb,'exclude' from businesses;
      insert into partner_leads values (null,'new',null,'exclude');`)
    const before = (await db.query('select * from businesses')).rows
    const sql = await readFile(new URL('../docs/operations/sofia-location-audit-read-only.sql', import.meta.url), 'utf8')
    const results = await db.exec(sql)
    const exportResult = results.flatMap(result => result.rows).find(value => value.location_inventory)?.location_inventory
    assert.ok(exportResult)
    assert.equal(exportResult.contact_only_lead_count, 1)
    const [result] = exportResult.businesses
    assert.equal(result.platform_status, 'pending')
    assert.equal(result.application_address, 'original')
    assert.equal(result.content_revision, '5')
    assert.equal(result.registration_source.address_key_matches, true)
    assert.equal(result.registration_source.profile_point_matches, true)
    assert.equal(result.registration_source.match_version, null)
    assert.equal(result.registration_source.location_revision_matches, false)
    assert.equal(JSON.stringify(exportResult).includes('exclude'), false)
    assert.deepEqual((await db.query('select * from businesses')).rows, before)
  } finally { await db.close() }
})

test('correction dry-run is idempotent and catches newer edits or mismatched evidence', () => {
  const before = { ...sofia, address: 'бул. Сливница 178', coordinates: point, place_id: 'abcd_efgh',
    location_revision: '1', place_verified_at: date }
  const after = { ...sofia, address: 'бул. Сливница 178Е', coordinates: null, place_id: null }
  const decision = { id: other, before, after, expectedContentRevision: '10', evidence: {
    businessId: other, originalAddress: after.address, kind: 'remove_conflicting_point', checkedOn: '2026-11-24',
    sourceUrl: 'https://example.test/venue-confirmation', reason: 'Test-only illustrative evidence, not a real 178Е correction',
  } }
  const comparator = (row, change = decision) => planSofiaLocationCorrections(nativeSnapshot([{ id: other, content_revision: '10', ...row }]), [change])
  const report = comparator(before)
  assert.equal(report.dryRun, true)
  assert.equal(report.affectedIfApproved, 1)
  assert.equal(report.reports[0].rollback.restore.address, 'бул. Сливница 178')
  assert.equal(report.reports[0].rollback.restoreVerificationAutomatically, false)
  assert.equal(comparator({ ...before, content_revision: '11' }).reports[0].status, 'stale')
  assert.equal(comparator({ ...before, location_revision: '2' }).reports[0].status, 'stale')
  assert.equal(comparator({ ...before, place_verified_at: '2026-11-24T20:24:20Z' }).reports[0].status, 'stale')
  assert.equal(comparator({ ...before, address: 'ул. Сливница 178' }).reports[0].status, 'stale')
  assert.equal(comparator({ ...after, content_revision: '11' }).reports[0].status, 'already_applied')
  assert.throws(() => comparator(before, { ...decision, evidence: { ...decision.evidence, originalAddress: 'бул. Сливница 178E' } }), /branch-specific/u)
})
