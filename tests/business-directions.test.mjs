import test from 'node:test'
import assert from 'node:assert/strict'
import { businessDirectionsAddress, businessMapsDirectionsUrl, publicBusinessLocation, resolveBusinessDestination } from '../lib/business-directions.mjs'
import { REVIEWED_BUSINESS_DESTINATIONS, REVIEWED_NATIVE_BUSINESS_DESTINATIONS } from '../lib/business-directions-reviewed.mjs'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { businessDisplayAddress } from '../lib/locale/public-content.mjs'
import { nativeVerifiedCoordinates, attachNativeLocationEvidence } from '../lib/native-location-evidence.mjs'
import { coordinatePairFromGeoJson, sameVisitAddress, sofiaBusinessLocality } from '../lib/sofia-location-scope.mjs'
import { sofiaSettlementPointConflict } from '../lib/sofia-settlement-boundaries.mjs'
import { cataloguePublicLocation } from '../lib/discovery/catalogue-public-location.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { compactDiscoveryRow } from '../lib/discovery/preview.mjs'
import { railDirections } from '../lib/discovery/rail.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'

const point = { latitude: 42.703, longitude: 23.32 }
const reported = { id: 'reported-branch-fixture', source: 'catalogue', cityCode: '68134', address: 'бул. Сливница 178Е, София' }
const nativeId = '10000000-0000-4000-8000-000000000001'

test('reported 178Е keeps the exact suffix and boulevard, is not 178 or Latin E, and cannot use text navigation', () => {
  assert.equal(businessDirectionsAddress(reported), reported.address)
  assert.match(businessDisplayAddress(reported, 'en'), /178Е/u)
  for (const other of ['бул. Сливница 178, София', 'бул. Сливница 178E, София', 'ул. Сливница 178Е, София']) {
    assert.equal(sameVisitAddress(other, reported.address), false)
  }
  assert.equal(resolveBusinessDestination({ ...reported, coordinates: point, placeId: 'ChIJ_unrelated_fixture' }).status, 'unverified')
  assert.equal(railDirections(reported), null)
  assert.equal(businessMapUrl(reported), null)
})

test('an attested fixture point wins over a wrong Place ID and binds to the exact branch, address and point', () => {
  const withProof = { ...reported, ...publicBusinessLocation(reported, point), placeId: 'ChIJ_other_branch' }
  const url = new URL(railDirections(withProof))
  assert.equal(url.origin + url.pathname, 'https://www.google.com/maps/dir/')
  assert.equal(url.searchParams.get('api'), '1')
  assert.equal(url.searchParams.get('destination'), '42.703,23.32')
  assert.equal(url.searchParams.has('destination_place_id'), false)
  assert.equal(url.searchParams.has('origin'), false)
  assert.equal(businessDirectionsUrl(withProof), url.href)
  assert.equal(new URL(businessMapUrl(withProof)).searchParams.get('marker'), '42.703,23.32')
  for (const stale of [{ ...withProof, id: 'same-name-other-branch' }, { ...withProof, address: 'бул. Сливница 178E, София' },
    { ...withProof, coordinates: { ...point, latitude: 42.73 } }, { ...withProof, locationBinding: undefined }]) {
    assert.equal(railDirections(stale), null)
  }
})

test('remote, missing, swapped, out-of-range and boundary-conflict coordinates never become routes', () => {
  for (const coordinates of [null, { latitude: 0, longitude: 0 }, { latitude: 42.7 }, { latitude: 23.32, longitude: 42.703 },
    { latitude: 90.1, longitude: 23.3 }, { latitude: '42.7', longitude: '23.3' }, { latitude: 42.49, longitude: 27.47 }]) {
    assert.equal(resolveBusinessDestination(reported, { verifiedCoordinates: coordinates }).href, null)
  }
  const fromGeoJson = coordinatePairFromGeoJson([23.32, 42.703])
  assert.deepEqual(fromGeoJson, point)
  const diana = SOFIA_CATALOGUE.find(row => row.id === 'sofia-diana-tsarigradsko')
  assert.ok(sofiaSettlementPointConflict(diana.coordinates))
  const dto = { ...diana, ...cataloguePublicLocation(diana) }
  assert.equal(dto.locationStatus, 'conflict')
  assert.equal(railDirections(dto), null)
  assert.equal(businessMapUrl(dto), null)
})

test('distinguishes Sofia city from settlements, overseas addresses and businesses without a visit location', () => {
  for (const row of [{ cityCode: '44238', city: 'Лом', address: 'ул. Сливница 178Е' },
    { city: 'София', address: 'с. Бистрица, бул. Сливница 178Е' },
    { city: 'София', country: 'US', address: reported.address },
    { city: 'София област', address: 'бул. Сливница 178Е' }]) {
    assert.notEqual(sofiaBusinessLocality(row), 'sofia')
    assert.equal(resolveBusinessDestination(row, { verifiedCoordinates: point }).href, null)
  }
  assert.equal(sofiaBusinessLocality({ cityCode: '68134', address: 'София, кв. Горна баня, ул. Бук 7' }), 'sofia')
  for (const locationKind of ['service_area', 'mobile', 'online_only']) {
    assert.equal(resolveBusinessDestination({ ...reported, locationKind }, { verifiedCoordinates: point }).status, 'not_visit_location')
  }
})

test('reviewed catalog landmark uses a real destination parameter and no unverified Place ID can route', () => {
  const { id, address, placeId } = REVIEWED_BUSINESS_DESTINATIONS.find(row => row.placeId)
  const url = new URL(businessMapsDirectionsUrl({ id, source: 'catalogue', address }))
  assert.equal(url.searchParams.get('destination'), address + ', България')
  assert.equal(url.searchParams.get('destination_place_id'), placeId)
  assert.equal(url.searchParams.get('api'), '1')
  assert.equal(businessMapsDirectionsUrl({ id, source: 'google', address, placeId }), null)
  assert.equal(businessMapsDirectionsUrl({ id, source: 'catalogue', address: reported.address, placeId }), null)
})

test('native receipts only open for the exact named branch address; old Kerelski 81 does not route to 83', () => {
  assert.equal(new Set(REVIEWED_NATIVE_BUSINESS_DESTINATIONS.map(row => row.id)).size, REVIEWED_NATIVE_BUSINESS_DESTINATIONS.length)
  for (const branch of REVIEWED_NATIVE_BUSINESS_DESTINATIONS) {
    for (const address of branch.addresses) {
      const dto = { source: 'gorez', cityCode: '68134', id: branch.id, address }
      const resolved = resolveBusinessDestination(dto)
      assert.equal(resolved.status, 'verified_sofia', branch.id)
      assert.equal(businessDirectionsUrl(dto), railDirections(dto))
      assert.equal(railDirections({ ...dto, id: nativeId, mapsUrl: 'https://evil.example/' }), null)
      assert.equal(railDirections({ ...dto, address: address + 'А' }), null)
    }
  }
  const kerelski = REVIEWED_NATIVE_BUSINESS_DESTINATIONS.find(row => row.addresses.some(address => address.endsWith(' 83')))
  const old = { id: kerelski.id, source: 'gorez', cityCode: '68134', address: 'София, ж.к Манастирски ливади, ул. Пирин 81' }
  assert.equal(railDirections(old), null)
})

test('native proof requires current matching address snapshot, revision, policy and pin', async () => {
  const proof = { ...point, source_url: 'https://www.openstreetmap.org/node/123', licence: 'ODbL-1.0',
    attribution: '© OpenStreetMap contributors', location_revision: 12, match_version: 2 }
  const partner = { id: nativeId, address: reported.address, city: 'София', city_ekatte: '68134',
    neighborhood: '', public_profile: point }
  const saved = { ...partner, location_revision: 12, location_source: [proof] }
  assert.ok(nativeVerifiedCoordinates(saved))
  assert.equal(nativeVerifiedCoordinates({ ...saved, location_revision: 13 }), null)
  assert.equal(nativeVerifiedCoordinates({ ...saved, location_source: [{ ...proof, match_version: 1 }] }), null)
  assert.equal(nativeVerifiedCoordinates({ ...saved, public_profile: { ...point, longitude: 23.37 } }), null)
  const db = { from: () => ({ select: () => ({ in: () => ({ eq: () => ({ eq: async () => ({ data: [saved] }) }) }) }) }) }
  assert.ok((await attachNativeLocationEvidence(db, [partner]))[0].location_source)
  assert.equal((await attachNativeLocationEvidence(db, [{ ...partner, address: 'ул. Друг адрес 4' }]))[0].location_source, undefined)
})

test('every published catalogue result and its full details agree on the validated destination', async () => {
  const now = Date.parse('2026-11-24T18:00:00Z')
  const rows = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { browse: true, searchV2: true, requirements: [] }, { now })
  const source = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now, allowAttempt: async () => true,
    findCatalogue: async id => source.get(id), readCataloguePhotos: async () => [],
    readPartner: async () => assert.fail('no production read') })
  assert.equal(rows.length, SOFIA_CATALOGUE.filter(row => approvedCatalogueRecord(row, now)).length)
  let verified = 0, withheld = 0
  for (const row of rows) {
    const response = await handler(new Request('https://www.gorez.co/api/public/discovery/business/' + row.id), row.id)
    assert.equal(response.status, 200, row.id)
    const { business: full } = await response.json()
    assert.equal(full.address, row.address, row.id)
    assert.deepEqual(full.coordinates, row.coordinates, row.id)
    const route = railDirections(row)
    assert.equal(railDirections({ ...compactDiscoveryRow(row), ...full }), route, row.id)
    if (route) verified++
    else { withheld++; assert.equal(row.coordinates, null, row.id) }
  }
  assert.ok(verified > 500 && withheld > 200)
})
