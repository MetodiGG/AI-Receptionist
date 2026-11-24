import assert from 'node:assert/strict'
import test from 'node:test'
import { attachNativeLocationEvidence, nativeVerifiedCoordinates } from '../lib/native-location-evidence.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { compactDiscoveryRow } from '../lib/discovery/preview.mjs'

const id = 'd0000000-0000-4000-8000-000000000001'
const point = { latitude: 42.6977, longitude: 23.3219 }
const receipt = { ...point, source_url: 'https://www.openstreetmap.org/node/123', licence: 'ODbL-1.0',
  attribution: '© OpenStreetMap contributors', match_version: 2, location_revision: '7' }
const snapshot = { id, city: 'София', city_ekatte: '68134', neighborhood: 'Център', address: 'ул. „Тест“ 14А',
  ...point, location_kind: null, location_revision: 7, location_source: [receipt] }
const row = { id, source: 'gorez', city: 'София', cityCode: '68134', neighborhood: 'Център',
  address: 'София, Център, ул. „Тест“ 14А', coordinates: point, name: 'Публичен профил', photos: [{ src: '/business.jpg' }],
  services: [{ name: 'Маникюр', price: 15 }], booking_mode: 'gorez' }

function evidenceDb(rows, { error, calls = [] } = {}) {
  const shape = { select(fields) { calls.push(['select', fields]); return this }, in(column, ids) { calls.push(['in', column, ids]); return this },
    eq(column, value) { calls.push(['eq', column, value]); return this },
    then(resolve) { resolve({ data: rows, error }) } }
  return { from(table) { calls.push(['from', table]); return shape } }
}

test('typed proof survives compact discovery and adds only nested navigation data, while catalogue rows are not looked up', async () => {
  const catalogue = { source: 'catalogue', id: 'catalogue-item' }, calls = []
  const [published, external] = await attachNativeLocationEvidence(evidenceDb([snapshot], { calls }), [row, catalogue])
  const { navigationLocation, ...unchanged } = published
  assert.deepEqual(unchanged, row)
  assert.equal(external, catalogue)
  assert.deepEqual(calls.filter(([name]) => name !== 'select'), [['from', 'businesses'], ['in', 'id', [id]], ['eq', 'active', true], ['eq', 'platform_status', 'enabled']])
  assert.doesNotMatch(calls.find(([name]) => name === 'select')[1], /phone|bookings|email|payment/)
  assert.deepEqual(navigationLocation.coordinates, point)
  assert.equal(navigationLocation.locationVerified, true)
  assert.equal(new URL(businessMapsDirectionsUrl(compactDiscoveryRow(published))).searchParams.get('destination'), '42.6977,23.3219')
  assert.doesNotMatch(JSON.stringify(published), /location_revision|match_version|source_url/u)
})

test('detail rows bind the same rendered address as initial result cards without changing the raw address', async () => {
  const raw = { id, city: snapshot.city, city_ekatte: snapshot.city_ekatte, neighborhood: snapshot.neighborhood,
    address: snapshot.address, public_profile: point }
  const [details] = await attachNativeLocationEvidence(evidenceDb([snapshot]), [raw], { addressIsDisplay: false })
  const [card] = await attachNativeLocationEvidence(evidenceDb([snapshot]), [row])
  assert.equal(details.address, snapshot.address)
  assert.deepEqual(details.navigationLocation, card.navigationLocation)
})

test('moved, revision-mismatched, unverified and unavailable sources never become destinations', async () => {
  for (const source of [
    { ...snapshot, address: 'ул. „Тест“ 14' },
    { ...snapshot, location_revision: 8 },
    { ...snapshot, location_source: [{ ...receipt, match_version: 1 }] },
    { ...snapshot, location_source: [{ ...receipt, source_url: 'https://www.openstreetmap.org.evil.example/node/123' }] },
    { ...snapshot, location_source: [{ ...receipt, longitude: 23.3 }] },
    { ...snapshot, location_kind: 'service_area' },
  ]) {
    const [publicRow] = await attachNativeLocationEvidence(evidenceDb([source]), [row])
    assert.equal(businessMapsDirectionsUrl(publicRow), null)
    assert.deepEqual(publicRow.coordinates, point, 'legacy map/distance display property is independent')
  }
  const [unavailable] = await attachNativeLocationEvidence(evidenceDb([], { error: { message: 'offline' } }), [row])
  assert.equal(unavailable.booking_mode, row.booking_mode)
  assert.equal(businessMapsDirectionsUrl(unavailable), null)
  assert.equal(nativeVerifiedCoordinates({ ...snapshot, location_source: [receipt, receipt] }), null)
})
