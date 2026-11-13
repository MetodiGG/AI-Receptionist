import test from 'node:test'
import assert from 'node:assert/strict'
import { DISCOVERY_LOCATION_MAX_AGE_MS, DISCOVERY_LOCATION_MAX_ACCURACY_M, discoveryLocationError, discoveryLocationRetryMessage, discoveryPosition, freshDiscoveryLocation, sameDiscoveryOrigin } from '../lib/discovery/geolocation.mjs'
import { requestDiscoveryLocation, discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { discoveryRequestSchema } from '../lib/discovery/intent.mjs'
import { setDiscoveryDraft, peekDiscoveryDraft, clearDiscoveryDraft } from '../lib/discovery/draft.mjs'

// Deliberately synthetic fixtures, never a person's browser coordinates.
const now = Date.parse('2026-11-13T12:00:00Z')
const point = { latitude: 42.660012345, longitude: 23.280054321, consent: true, accuracyMeters: 25, observedAt: now }
const position = patch => ({ coords: { latitude: point.latitude, longitude: point.longitude, accuracy: 25 }, timestamp: now, ...patch })

test('native positions need finite useful accuracy and a recent, nonfuture timestamp', () => {
  assert.deepEqual(discoveryPosition(position(), now), point)
  assert.equal(DISCOVERY_LOCATION_MAX_ACCURACY_M, 250)
  assert.equal(discoveryPosition(position({ coords: { ...position().coords, accuracy: 250 } }), now).accuracyMeters, 250)
  for (const accuracy of [undefined, null, NaN, Infinity, 0, -1, 250.01, 5000]) {
    assert.throws(() => discoveryPosition(position({ coords: { ...position().coords, accuracy } }), now), /LOCATION_INACCURATE/)
  }
  for (const timestamp of [undefined, null, '2026-11-13', NaN, Infinity, 0, now - 60000, now + 1001]) {
    assert.throws(() => discoveryPosition(position({ timestamp }), now), /LOCATION_STALE/)
  }
})

test('a retained permitted point expires at five minutes without rounding or renewing observation time', () => {
  assert.equal(freshDiscoveryLocation(point, now + DISCOVERY_LOCATION_MAX_AGE_MS - 1), point)
  assert.equal(freshDiscoveryLocation(point, now + DISCOVERY_LOCATION_MAX_AGE_MS), null)
  assert.equal(discoveryLocationError({ ...point, observedAt: now + 1001 }, now), 'LOCATION_STALE')
  assert.equal(discoveryLocationError({ ...point, consent: false }, now), 'LOCATION_UNAVAILABLE')
})

test('the API receives exact coordinates only, never ephemeral accuracy or observation metadata', () => {
  const request = discoverySearchInput({ query: 'маникюр', coordinates: point, expandNearby: true })
  assert.deepEqual(request.coordinates, { latitude: point.latitude, longitude: point.longitude, consent: true })
  assert.equal(discoveryRequestSchema.safeParse(request).success, true)
  assert.doesNotMatch(JSON.stringify(request), /accuracy|observedAt/)
})

test('navigation memory preserves a fresh point, then drops stale GPS and quarter while retaining service/manual city', () => {
  try {
    const input = discoverySearchInput({ query: 'маникюр', coordinates: point, expandNearby: true })
    setDiscoveryDraft({ request: { ...input, cityCode: '56784', neighborhood: 'Стар квартал' }, cityWasChosen: true, locationMetadata: { observedAt: now, accuracyMeters: 25 } })
    const fresh = peekDiscoveryDraft(now + 10)
    assert.deepEqual(fresh.request.coordinates, point)
    const expired = peekDiscoveryDraft(now + DISCOVERY_LOCATION_MAX_AGE_MS)
    assert.equal(expired.locationExpired, true)
    assert.equal(expired.request.query, 'маникюр'); assert.equal(expired.request.cityCode, '56784'); assert.equal(expired.cityWasChosen, true)
    for (const key of ['coordinates', 'expandNearby', 'neighborhood']) assert.equal(Object.hasOwn(expired.request, key), false)
    assert.equal(expired.locationMetadata, null)
  } finally { clearDiscoveryDraft() }
})

test('a legacy/coarse/forged navigation point cannot silently regain freshness', () => {
  try {
    for (const metadata of [{}, { observedAt: now, accuracyMeters: 5000 }, { observedAt: now + 1001, accuracyMeters: 25 }]) {
      setDiscoveryDraft({ request: { query: 'маникюр', coordinates: { latitude: point.latitude, longitude: point.longitude, consent: true } }, locationMetadata: metadata })
      assert.equal(peekDiscoveryDraft(now).request.coordinates, undefined)
    }
  } finally { clearDiscoveryDraft() }
})

test('a response must echo the exact submitted origin or remain a city-only response', () => {
  const request = discoverySearchInput({ query: 'маникюр', coordinates: point })
  assert.equal(sameDiscoveryOrigin(request, { coordinates: request.coordinates }), true)
  for (const coordinates of [null, undefined, { latitude: point.latitude + .001, longitude: point.longitude }]) assert.equal(sameDiscoveryOrigin(request, { coordinates }), false)
  assert.equal(sameDiscoveryOrigin({}, { coordinates: null }), true)
  assert.equal(sameDiscoveryOrigin({}, { coordinates: request.coordinates }), false)
  assert.equal(sameDiscoveryOrigin({ cityCode: '68134' }, { cityCode: '56784' }), false)
})

test('native success cannot bypass accuracy/timestamp checks, and late callbacks cannot revive a timed-out position', async () => {
  await assert.rejects(requestDiscoveryLocation({ getCurrentPosition(success) { success({ coords: { latitude: point.latitude, longitude: point.longitude } }) } }), /LOCATION_INACCURATE/)
  let late
  await assert.rejects(requestDiscoveryLocation({ getCurrentPosition(success) { late = success } }, { deadlineMs: 2 }), /LOCATION_TIMEOUT/)
  assert.doesNotThrow(() => late({ coords: { latitude: point.latitude, longitude: point.longitude, accuracy: 25 }, timestamp: Date.now() }))
})

test('new inaccurate/stale messages are localized retry guidance, not permission or precise-distance claims', () => {
  for (const locale of ['bg', 'en']) for (const code of ['LOCATION_INACCURATE', 'LOCATION_STALE']) {
    const message = discoveryLocationRetryMessage(code, locale)
    assert.match(message, locale === 'en' ? /Near me.*city/ : /Около мен.*град/)
    assert.doesNotMatch(message, /0[.,]7|GPS|permission|Разрешете/)
  }
  assert.equal(discoveryLocationRetryMessage('LOCATION_DENIED'), '')
})
