import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRailAdvanceGate } from '../lib/discovery/rail-advance.mjs'
import { rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { discoveryDistanceOrigin } from '../lib/discovery/distance-origin.mjs'

const nearEnd = { scrollLeft: 2800, scrollWidth: 4000, clientWidth: 1000 }
const row = (id, source, latitude, longitude) => ({ id, source, name: id, coordinates: latitude == null ? null : { latitude, longitude } })

test('observation, append and repeated scroll events cannot auto-fetch without a new user advance', () => {
  const gate = createRailAdvanceGate()
  assert.equal(gate.consume(nearEnd), false)
  gate.arm()
  assert.equal(gate.consume(nearEnd), true)
  for (let index = 0; index < 100; index++) assert.equal(gate.consume({ ...nearEnd, scrollLeft: 5800, scrollWidth: 7000 }), false)
  gate.arm()
  assert.equal(gate.consume({ ...nearEnd, scrollLeft: 5800, scrollWidth: 7000 }), true)
})

test('a user advance waits until near the end, resets per query and handles scrollbar overshoot', () => {
  const gate = createRailAdvanceGate()
  gate.arm()
  assert.equal(gate.consume({ ...nearEnd, scrollLeft: 100 }), false)
  assert.equal(gate.consume({ ...nearEnd, scrollLeft: -100 }), false)
  assert.equal(gate.consume({ ...nearEnd, scrollLeft: 9999 }), true)
  gate.arm(); gate.reset()
  assert.equal(gate.consume(nearEnd), false)
})

test('an explicit Next/End action works even if the first page fits without overflow', () => {
  const gate = createRailAdvanceGate(), metrics = { scrollLeft: 0, scrollWidth: 500, clientWidth: 1000 }
  gate.arm()
  assert.equal(gate.consume(metrics), false)
  assert.equal(gate.consume(metrics, { explicit: true }), true)
  assert.equal(gate.consume(metrics, { explicit: true }), false)
})

test('distance beats membership, with a partner advantage only on a real distance tie', () => {
  const coordinates = { latitude: 42.67, longitude: 23.29 }
  const intent = { coordinates, radiusKm: 5, primaryRadiusKm: 2 }
  const rows = rankCatalogueBusinesses([row('farther-partner', 'gorez', 42.68, 23.29)], [row('closest', 'catalogue', 42.6701, 23.29)], intent)
  assert.deepEqual(rows.map(item => item.id), ['closest', 'farther-partner'])
  const tied = rankCatalogueBusinesses([row('partner', 'gorez', 42.671, 23.29)], [row('other', 'catalogue', 42.671, 23.29)], intent)
  assert.equal(tied[0].source, 'gorez')
})

test('city-centre ordering never interleaves categories or puts an unlocated partner before a located business', () => {
  const origin = discoveryDistanceOrigin({ cityCode: '68134' }), intent = { browse: true, cityCode: '68134' }
  const rows = rankCatalogueBusinesses([row('unknown-partner', 'gorez')], [row('further', 'catalogue', origin.latitude + .02, origin.longitude), row('near', 'catalogue', origin.latitude + .001, origin.longitude)], intent)
  assert.deepEqual(rows.map(item => item.id), ['near', 'further', 'unknown-partner'])
  assert.equal(rows[2].distanceKm, null)
})

test('customer copy omits technical no-Google/AI search explanations while local safety labels remain', async () => {
  for (const file of ['components/legal-page.js', 'lib/discovery/copy.mjs', 'app/dev/sofia-catalogue/preview.js', 'app/dev/homepage/preview.js', 'app/dev/business-cards/page.js', 'app/dev/category-art/page.js']) {
    const text = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
    assert.doesNotMatch(text, /без Google(?:\/AI| или AI|, AI)|without a Google or AI request|no Google(?:\/AI| or AI|, AI)|заявки до Google или AI/i, file)
  }
  const preview = await readFile(new URL('../app/dev/sofia-catalogue/preview.js', import.meta.url), 'utf8')
  assert.match(preview, /ЛОКАЛЕН ПРЕГЛЕД/)
  assert.match(preview, /резервациите са изключени/)
})
