import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { nativeLocationReviewPage } from '../lib/native-location-review.mjs'
import { publicNativeBusinessLocation } from '../lib/native-location-evidence.mjs'
import { publicProfileDetails } from '../lib/business-profile.mjs'
import { businessDirectionsAddress, resolveBusinessDestination } from '../lib/business-directions.mjs'

const branch = { id: 'one', name: 'Offline test branch', public_profile: { receptionist_phone: 'private' }, address: 'бул. Сливница 178Е, София',
  city_ekatte: '68134', city: 'София', neighborhood: 'Модерно предградие', location_revision: 4, active: true, platform_status: 'enabled' }

test('native review distinguishes outside, unknown and stale evidence without touching branch approval, and paginates across quiet records', () => {
  const noVisit = { ...branch, id: 'two', public_profile: { location_kind: 'mobile' } }
  const outside = { ...branch, id: 'three', city_ekatte: '44238', city: 'Луковит', address: 'Луковит, ул. Сливница 178' }
  const candidate = { ...branch, id: 'four', place_link: [{ location_revision: 3 }] }
  const result = nativeLocationReviewPage([branch, noVisit, outside, candidate], 3)
  assert.equal(result.examined, 3)
  assert.equal(result.next, outside.id)
  assert.deepEqual(result.unresolved.map(row => [row.id, row.status]), [['one', 'unverified'], ['three', 'outside_sofia']])
  assert.equal(result.unresolved[0].active, true)
  assert.equal(result.unresolved[0].platform_status, 'enabled')
  assert.doesNotMatch(JSON.stringify(result), /private|receptionist|location_revision/)
  assert.equal(nativeLocationReviewPage([candidate], 3).unresolved[0].stalePlace, true)
  assert.equal(nativeLocationReviewPage([candidate], 3).next, null)
})

test('location review is same-site, platform-admin-only, cursor-bounded and contains no write or provider call', async () => {
  const source = await readFile(new URL('../app/api/admin/location-review/route.js', import.meta.url), 'utf8')
  assert.match(source, /!sameSiteRequest\(request\)/u)
  assert.match(source, /!isPlatformAdmin\(user\)/u)
  assert.match(source, /\.order\('id'\)\.limit\(SIZE \+ 1\)/u)
  assert.match(source, /\.gt\('id', cursor\)/u)
  assert.doesNotMatch(source, /fetch\(|\.upsert\(|\.update\(|\.insert\(|\.delete\(|\.rpc\(/u)
})

test('legacy native mobile/online settings suppress their visit address and never remove valid profile text', () => {
  for (const kind of ['mobile', 'service_area', 'online_only']) {
    const business = { ...branch, public_profile: { location_kind: kind, description: { bg: 'Сервиз на адрес' },
      latitude: 42.67, longitude: 23.29 } }
    assert.equal(publicProfileDetails(business).description.bg, 'Сервиз на адрес')
    for (const raw of [business, { ...branch, location_kind: kind, latitude: 42.67, longitude: 23.29 }]) {
      const dto = { ...branch, ...publicNativeBusinessLocation(raw) }
      assert.equal(dto.address, null)
      assert.equal(dto.coordinates, null)
      assert.equal(dto.locationKind, kind)
      assert.equal(dto.locationStatus, 'not_visit_location')
      assert.equal(businessDirectionsAddress({ ...dto, address: branch.address }), null)
      assert.equal(resolveBusinessDestination(dto).href, null)
    }
  }
})
