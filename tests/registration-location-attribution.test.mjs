import test from 'node:test'
import assert from 'node:assert/strict'
import { businessLocationAttribution } from '../lib/business-profile.mjs'
const source = { latitude: 42.665, longitude: 23.282, source_url: 'https://www.openstreetmap.org/way/123', licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' }
const row = { public_profile: { latitude: 42.665, longitude: 23.282 }, location_source: source }
test('matching public source retains OSM attribution and licence without displaying a claim for manual or stale points', () => {
  assert.deepEqual(businessLocationAttribution(row), { label: source.attribution, sourceUrl: source.source_url, licenceUrl: 'https://www.openstreetmap.org/copyright' })
  assert.deepEqual(businessLocationAttribution({ ...row, location_source: [source] }), businessLocationAttribution(row))
  for (const variant of [{ ...row, location_source: null }, { ...row, public_profile: {} }, { ...row, public_profile: { latitude: 42.666, longitude: 23.282 } }, { ...row, location_source: { ...source, licence: 'unknown' } }, { ...row, location_source: { ...source, source_url: 'javascript:alert(1)' } }]) assert.equal(businessLocationAttribution(variant), null)
})
