import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { auditCatalogueLocations } from '../scripts/audit-catalogue-locations.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

const address = 'София, ул. Публичен адрес 2'
const firstParty = { latitude: 42.68, longitude: 23.32, method: 'first_party_coordinates', source: 'https://example.org/contact', sourceAddress: address }
const row = (id, coordinates, extra = {}) => ({ id, name: 'Public venue', cityCode: '68134', neighborhood: null, address, website: 'https://example.org/', category: 'other', locationKind: 'premises', coordinates, ...extra })
const osm = { ...firstParty, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/node/123', checkedOn: '2026-11-13', licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' }
const official = { ...firstParty, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL, checkedOn: '2026-11-13', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  addressId: '123456', sourceCityCode: '68134', sourceNeighborhood: null, sourceWebsite: 'https://example.org/' }

test('source metadata distinguishes raw, usable, owner-published and address-checked points', () => {
  const legacy = { ...firstParty }; delete legacy.sourceAddress
  const rows = [row('first', firstParty), row('legacy', legacy), row('osm', osm), row('official', official, { category: 'education' }), row('unknown', null), row('mobile', null, { address: null, locationKind: 'service_area' })]
  const before = JSON.stringify(rows)
  const report = auditCatalogueLocations(rows, { boundCoordinates: current => current.coordinates })
  assert.equal(report.counts.total, 6)
  assert.equal(report.counts.rawLocated, 4)
  assert.equal(report.counts.rawUnlocated, 2)
  assert.equal(report.counts.usableLocated, 4)
  assert.equal(report.counts.heldCoordinates, 0)
  assert.equal(report.counts.firstPartyPublished, 2)
  assert.equal(report.counts.firstPartyExplicitAddressBound, 1)
  assert.equal(report.counts.firstPartyLegacySnapshotBound, 1)
  assert.equal(report.counts.osmAddressCheckedMetadata, 1)
  assert.equal(report.counts.officialAddressPoints, 1)
  assert.equal(report.counts.officialAddressCheckedMetadata, 1)
  assert.equal(report.coordinateSourceCount, 3)
  assert.equal(report.counts.serviceArea, 1)
  assert.deepEqual(report.coordinateMethods, { first_party_coordinates: 2, verified_address_geocode: 1, verified_official_address: 1 })
  assert.equal(report.records[0].evidenceClass, 'owner_published_not_independently_address_checked')
  assert.equal(report.records[2].evidenceClass, 'independently_address_checked_source_metadata')
  assert.equal(report.records[3].evidenceClass, 'official_municipal_address_checked_source_metadata')
  assert.equal(report.records[3].coordinateBinding, 'official_exact_address_metadata')
  assert.equal(report.records[3].coordinates.addressId, official.addressId)
  assert.equal(report.records[3].coordinates.sourceWebsite, official.sourceWebsite)
  assert.equal(report.byBusinessCategory.education.officialAddressCheckedMetadata, 1)
  assert.equal(report.byBusinessCategory.other.firstPartyPublished, 2)
  assert.equal(report.coordinateEvidenceClasses.official_municipal_address_checked_source_metadata, 1)
  assert.equal(report.spatialAccuracyVerifiedByThisAudit, false)
  assert.ok(report.records.every(item => item.spatialAccuracyVerifiedByThisAudit === false))
  assert.match(report.limitations.join(' '), /do not establish geographic accuracy/)
  assert.deepEqual(report.issues, [])
  assert.equal(JSON.stringify(rows), before)
})

test('unbound or moved source points are held without inventing replacement coordinates', () => {
  const legacy = { ...firstParty }; delete legacy.sourceAddress
  const report = auditCatalogueLocations([row('legacy', legacy), row('moved-first', firstParty, { address: address + 'A' }), row('moved-osm', osm, { address: address + 'A' })])
  assert.equal(report.counts.rawLocated, 3)
  assert.equal(report.counts.usableLocated, 0)
  assert.equal(report.counts.heldCoordinates, 3)
  assert.equal(report.counts.firstPartyUnbound, 2)
  assert.equal(report.counts.osmAddressBindingMismatches, 1)
  assert.ok(report.records[0].issues.includes('first_party_point_unbound'))
  assert.ok(report.records[1].issues.includes('first_party_source_address_mismatch'))
  assert.ok(report.records[2].issues.includes('osm_source_address_mismatch'))
  assert.ok(report.records.every(item => item.usableForDistance === false))
})

test('finite types, Sofia bounds and mobile premises are audited separately', () => {
  const rows = [row('string', { ...firstParty, latitude: '42.68' }), row('zero', { ...firstParty, latitude: 0, longitude: 0 }), row('swapped', { ...firstParty, latitude: 23.32, longitude: 42.68 }), row('mobile', firstParty, { locationKind: 'service_area' }), row('unknown-method', { ...firstParty, method: 'guessed' })]
  const report = auditCatalogueLocations(rows, { boundCoordinates: current => current.coordinates })
  assert.equal(report.counts.invalidNumericPoints, 1)
  assert.equal(report.counts.outsideSofiaBounds, 2)
  assert.equal(report.counts.serviceAreasWithCoordinates, 1)
  assert.equal(report.counts.unknownCoordinateMethod, 1)
  assert.equal(report.counts.usableLocated, 0)
  assert.equal(report.counts.heldCoordinates, 5)
  assert.ok(report.records.find(item => item.id === 'mobile').issues.includes('service_area_has_coordinates'))
})

test('OSM provenance metadata is required and a resolver cannot create or rewrite source points', () => {
  const report = auditCatalogueLocations([row('bad-osm', { ...osm, licence: null }), row('rewrite', firstParty), row('invent', null)], {
    boundCoordinates: current => current.id === 'rewrite' ? { ...current.coordinates, latitude: 42.69 } : current.id === 'invent' ? firstParty : current.coordinates,
  })
  assert.equal(report.counts.osmAddressCheckedMetadata, 0)
  assert.equal(report.counts.usableLocated, 0)
  assert.ok(report.records[0].issues.includes('osm_source_metadata_incomplete'))
  assert.ok(report.records[1].issues.includes('binding_resolver_changed_source_point'))
  assert.ok(report.records[2].issues.includes('binding_resolver_created_point'))
})

test('official points require exact address, city, quarter and website binding rather than accepting stale context', () => {
  for (const change of [{ address: address + 'A' }, { cityCode: '56784' }, { neighborhood: 'Борово' }, { website: 'https://moved.example.org/' }]) {
    const report = auditCatalogueLocations([row('moved-official', official, change)], { boundCoordinates: current => current.coordinates })
    assert.equal(report.counts.officialAddressPoints, 1)
    assert.equal(report.counts.officialAddressCheckedMetadata, 0)
    assert.equal(report.counts.usableLocated, 0)
    assert.equal(report.counts.heldCoordinates, 1)
    assert.equal(report.records[0].evidenceClass, 'unknown')
    assert.ok(report.records[0].issues.includes(change.address ? 'official_source_address_mismatch' : 'official_source_context_mismatch'))
  }
})

test('official source, licence, attribution, positive RN identity and valid date metadata all fail closed', () => {
  for (const change of [{ source: 'https://example.org/not-official' }, { licence: 'ODbL-1.0' }, { attribution: 'Different publisher' }, { addressId: '0' }, { addressId: 123 }, { addressId: '' }, { checkedOn: '2026-02-30' }, { checkedOn: undefined }]) {
    const report = auditCatalogueLocations([row('bad-official', { ...official, ...change })], { boundCoordinates: current => current.coordinates })
    assert.equal(report.counts.officialSourceMetadataIncomplete, 1, JSON.stringify(change))
    assert.equal(report.counts.officialAddressCheckedMetadata, 0)
    assert.equal(report.counts.usableLocated, 0)
    assert.ok(report.records[0].issues.includes('official_source_metadata_incomplete'))
  }
  for (const change of [{ sourceCityCode: undefined }, { sourceNeighborhood: undefined }, { sourceWebsite: undefined }]) {
    const report = auditCatalogueLocations([row('incomplete-official-context', { ...official, ...change })])
    assert.equal(report.counts.officialContextBindingMismatches, 1)
    assert.equal(report.records[0].usableForDistance, false)
  }
})

test('official points cannot locate a service area or survive a resolver rewrite of the original RN/source metadata', () => {
  const mobile = auditCatalogueLocations([row('mobile-official', official, { locationKind: 'service_area' })])
  assert.equal(mobile.counts.serviceAreasWithCoordinates, 1)
  assert.equal(mobile.counts.usableLocated, 0)
  assert.ok(mobile.records[0].issues.includes('service_area_has_coordinates'))
  const rewritten = auditCatalogueLocations([row('rewritten-official', official)], { boundCoordinates: current => ({ ...current.coordinates, addressId: '999999' }) })
  assert.equal(rewritten.counts.officialAddressCheckedMetadata, 0)
  assert.equal(rewritten.counts.usableLocated, 0)
  assert.ok(rewritten.records[0].issues.includes('binding_resolver_changed_source_point'))
  assert.equal(rewritten.records[0].coordinates.addressId, official.addressId)
})

test('missing addresses cannot turn absent sourceAddress fields into an explicit address binding', () => {
  const point = { ...firstParty }; delete point.sourceAddress
  const report = auditCatalogueLocations([row('missing-address', point, { address: undefined })])
  assert.equal(report.counts.firstPartyExplicitAddressBound, 0)
  assert.equal(report.counts.firstPartyLegacySnapshotBound, 0)
  assert.equal(report.counts.firstPartyUnbound, 1)
  assert.equal(report.counts.usableLocated, 0)
  assert.ok(report.records[0].issues.includes('premises_address_missing'))
})

test('JSON rows allowlist public venue/source facts and never serialize unrelated private payloads', () => {
  const secret = 'PRIVATE_FIXTURE_DO_NOT_EMIT'
  const report = auditCatalogueLocations([row('public', firstParty, { owner_user_id: secret, customers: [{ email: secret }], public_profile: { private: secret }, services: [{ notes: secret }] })])
  assert.doesNotMatch(JSON.stringify(report), /PRIVATE_FIXTURE_DO_NOT_EMIT|owner_user_id|customers|public_profile|services/)
  assert.deepEqual(Object.keys(report.records[0]).sort(), ['id', 'name', 'cityCode', 'neighborhood', 'address', 'locationKind', 'category', 'coordinates', 'coordinateBinding', 'usableForDistance', 'evidenceClass', 'spatialAccuracyVerifiedByThisAudit', 'issues'].sort())
})

test('audit helper contains no network, write, credential or production adapter', async () => {
  const source = await readFile(new URL('../scripts/audit-catalogue-locations.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /fetch\s*\(|https?\.request|writeFile|appendFile|createWriteStream|supabase|process\.env|child_process|exec\s*\(/)
  assert.match(source, /RAW_SOFIA_CATALOGUE/)
  assert.match(source, /catalogueBoundCoordinates/)
})

test('all actual source rows are audited before filtering and agree with the bound public inventory', async () => {
  const { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } = await import('../lib/discovery/sofia-catalogue.mjs')
  const { catalogueBoundCoordinates } = await import('../lib/discovery/catalogue-coordinate-binding.mjs')
  const before = JSON.stringify(RAW_SOFIA_CATALOGUE)
  const report = auditCatalogueLocations(RAW_SOFIA_CATALOGUE, { boundCoordinates: catalogueBoundCoordinates })
  assert.equal(report.counts.total, RAW_SOFIA_CATALOGUE.length)
  assert.equal(report.counts.total, SOFIA_CATALOGUE.length)
  assert.equal(report.counts.rawLocated + report.counts.rawUnlocated, report.counts.total)
  assert.equal(report.counts.usableLocated, SOFIA_CATALOGUE.filter(item => item.coordinates).length)
  assert.equal(report.counts.firstPartyPublished + report.counts.osmAddressCheckedMetadata + report.counts.officialAddressCheckedMetadata, report.counts.rawLocated)
  assert.equal(report.counts.serviceAreasWithCoordinates, 0)
  assert.equal(report.counts.invalidNumericPoints, 0)
  assert.equal(report.counts.outsideSofiaBounds, 0)
  assert.deepEqual(report.issues, [])
  const inBeauty = report.records.find(item => item.id === 'sofia-in-beauty')
  assert.equal(inBeauty.coordinates.method, 'verified_official_address')
  assert.ok(Math.abs(inBeauty.coordinates.latitude - 42.6852) > .00001 || Math.abs(inBeauty.coordinates.longitude - 23.3245) > .00001)
  assert.equal(inBeauty.usableForDistance, true)
  assert.equal(JSON.stringify(RAW_SOFIA_CATALOGUE), before)
})

test('read-only CLI provides bounded summary or explicit public JSON without credentials', () => {
  const script = new URL('../scripts/audit-catalogue-locations.mjs', import.meta.url)
  for (const detailed of [false, true]) {
    const result = spawnSync(process.execPath, [script.pathname, ...(detailed ? ['--json'] : [])], { encoding: 'utf8', timeout: 10000, maxBuffer: 2 * 1024 * 1024 })
    assert.equal(result.status, 0, result.stderr)
    const report = JSON.parse(result.stdout)
    assert.ok(report.counts.total > 900)
    assert.equal(report.spatialAccuracyVerifiedByThisAudit, false)
    assert.equal(Object.hasOwn(report, 'records'), detailed)
    assert.equal(Object.hasOwn(report, 'coordinateSources'), detailed)
    if (detailed) assert.equal(report.records.length, report.counts.total)
  }
})
