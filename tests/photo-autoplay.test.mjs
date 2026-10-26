import assert from 'node:assert/strict'
import test from 'node:test'
import { createPhotoAutoplay, PHOTO_ROTATION_MS } from '../lib/photo-autoplay.mjs'

function harness() {
  const scheduled = [], cancelled = []; let advanced = 0
  const rotation = createPhotoAutoplay(() => advanced++, { schedule: (callback, delay) => { scheduled.push({ callback, delay }); return scheduled.length }, cancel: id => cancelled.push(id) })
  return { rotation, scheduled, cancelled, advanced: () => advanced }
}

test('photo rotation advances every five seconds without creating duplicate timers', () => {
  const h = harness()
  h.rotation.setEnabled(true); h.rotation.setEnabled(true)
  assert.equal(h.scheduled.length, 1); assert.equal(h.scheduled[0].delay, PHOTO_ROTATION_MS); assert.equal(PHOTO_ROTATION_MS, 5000)
  h.scheduled[0].callback(); assert.equal(h.advanced(), 1)
})

test('pause/hidden/offscreen stops rotation; resuming starts a fresh full interval', () => {
  const h = harness()
  h.rotation.setEnabled(false); assert.equal(h.scheduled.length, 0)
  h.rotation.setEnabled(true); h.rotation.setEnabled(false)
  assert.deepEqual(h.cancelled, [1]); h.scheduled[0].callback(); assert.equal(h.advanced(), 0)
  h.rotation.setEnabled(true); assert.equal(h.scheduled.length, 2)
  h.scheduled[1].callback(); assert.equal(h.advanced(), 1)
})

test('unmount cleanup is idempotent and late observer/timer callbacks cannot restart rotation', () => {
  const h = harness()
  h.rotation.setEnabled(true); h.rotation.dispose(); h.rotation.dispose(); h.rotation.setEnabled(true)
  h.scheduled[0].callback()
  assert.deepEqual(h.cancelled, [1]); assert.equal(h.scheduled.length, 1); assert.equal(h.advanced(), 0)
})
