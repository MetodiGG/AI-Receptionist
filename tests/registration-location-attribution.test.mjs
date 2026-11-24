import test from 'node:test'
import assert from 'node:assert/strict'
import { businessLocationAttribution } from '../lib/business-profile.mjs'
import { businessAddress } from '../lib/business-location.mjs'
import { publicNativeBusinessLocation } from '../lib/native-location-evidence.mjs'
const source = { latitude: 42.665, longitude: 23.282, source_url: 'https://www.openstreetmap.org/way/123', licence: 'ODbL-1.0',
  attribution: '© OpenStreetMap contributors', match_version: 2, location_revision: '4' }
const row = { id: 'osm-credit-test', city: 'София', city_ekatte: '68134', address: 'ул. Пирин 42',
  public_profile: { latitude: 42.665, longitude: 23.282 }, location_revision: '4', location_source: source }
const publicRow = input => ({ ...input, source: 'gorez', address: businessAddress(input), ...publicNativeBusinessLocation(input) })
test('matching public source retains OSM attribution and licence without displaying a claim for manual or stale points', () => {
  const { label, sourceUrl, licenceUrl } = businessLocationAttribution(publicRow(row))
  assert.deepEqual({ label, sourceUrl, licenceUrl }, { label: source.attribution, sourceUrl: source.source_url, licenceUrl: 'https://www.openstreetmap.org/copyright' })
  assert.deepEqual(businessLocationAttribution(publicRow({ ...row, location_source: [source] })), { label, sourceUrl, licenceUrl })
  for (const patch of [{ location_source: null }, { public_profile: {} }, { location_revision: '5' },
    { public_profile: { latitude: 42.666, longitude: 23.282 } }, { location_source: { ...source, match_version: 1 } },
    { location_source: { ...source, licence: 'unknown' } }, { location_source: { ...source, source_url: 'javascript:alert(1)' } }]) {
    assert.equal(businessLocationAttribution(publicRow({ ...row, ...patch })), null)
  }
  assert.equal(businessLocationAttribution({ ...publicRow(row), address: 'София, ул. Пирин 43' }), null)
})
