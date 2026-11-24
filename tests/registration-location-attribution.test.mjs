import test from 'node:test'
import assert from 'node:assert/strict'
import { businessLocationAttribution } from '../lib/business-profile.mjs'
import { publicBusinessLocation } from '../lib/business-directions.mjs'

const point = { latitude: 42.665, longitude: 23.282 }
const source = { ...point, source_url: 'https://www.openstreetmap.org/way/123', licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' }
const raw = {
  id: 'd0000000-0000-4000-8000-000000000002', source: 'gorez', city: 'София', city_ekatte: '68134',
  address: 'София, ул. Пирин 42', public_profile: point, location_source: source,
}
const row = { ...raw, navigationLocation: publicBusinessLocation(raw, point) }

test('matching public source retains OSM attribution and licence only for a currently supported destination', () => {
  assert.deepEqual(businessLocationAttribution(row), { label: source.attribution, sourceUrl: source.source_url, licenceUrl: 'https://www.openstreetmap.org/copyright' })
  assert.deepEqual(businessLocationAttribution({ ...row, location_source: [source] }), businessLocationAttribution(row))
  for (const variant of [
    raw,
    { ...row, location_source: null },
    { ...row, address: 'София, ул. Пирин 42А' },
    { ...row, navigationLocation: { ...row.navigationLocation, coordinates: { ...point, latitude: 42.666 } } },
    { ...row, location_source: { ...source, latitude: 42.666 } },
    { ...row, location_source: { ...source, licence: 'unknown' } },
    { ...row, location_source: { ...source, source_url: 'javascript:alert(1)' } },
  ]) assert.equal(businessLocationAttribution(variant), null)
})
