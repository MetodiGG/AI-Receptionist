import assert from 'node:assert/strict'
import test from 'node:test'
import { schedulePwaRegistration } from '../components/pwa-register.js'

function browser({ idle = true } = {}) {
  const events = new Map(), idleQueue = new Map(), timers = new Map()
  return {
    events, idleQueue, timers,
    win: {
      addEventListener(name, callback, options) { events.set(name, { callback, options }) },
      removeEventListener(name, callback) { if (events.get(name)?.callback === callback) events.delete(name) },
      ...(idle ? {
        requestIdleCallback(callback, options) { idleQueue.set(1, { callback, options }); return 1 },
        cancelIdleCallback(id) { idleQueue.delete(id) },
      } : {}),
      setTimeout(callback, delay) { timers.set(2, { callback, delay }); return 2 },
      clearTimeout(id) { timers.delete(id) },
    },
  }
}

test('first visits delay shell precaching until window load and idle, with a bounded deadline', () => {
  const { win, events, idleQueue, timers } = browser()
  let registered = 0
  const cleanup = schedulePwaRegistration(win, { readyState: 'loading' }, () => registered++)
  assert.equal(registered, 0)
  assert.equal(idleQueue.size + timers.size, 0)
  assert.deepEqual(events.get('load').options, { once: true })
  events.get('load').callback()
  assert.equal(registered, 0)
  const { callback, options } = idleQueue.get(1)
  assert.equal(options.timeout, 1800)
  callback()
  assert.equal(registered, 1)
  cleanup()
})

test('Safari-style fallback only starts after load, and unmount cancels any pending registration', () => {
  const { win, timers, events } = browser({ idle: false })
  let registered = 0
  const cleanup = schedulePwaRegistration(win, { readyState: 'complete' }, () => registered++)
  assert.equal(events.size, 0)
  const { callback, delay } = timers.get(2)
  assert.equal(delay, 200)
  cleanup()
  assert.equal(timers.size, 0)
  callback()
  assert.equal(registered, 0)
})
