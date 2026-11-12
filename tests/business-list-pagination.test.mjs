import assert from 'node:assert/strict'
import test from 'node:test'
import { createBusinessListAdvanceGate, observeBusinessListEnd } from '../lib/discovery/list-pagination.mjs'

test('advance gate suppresses synchronous observer/manual duplicates for one generation and cursor', () => {
  const gate = createBusinessListAdvanceGate(), calls = []
  const load = () => calls.push('page')
  const first = JSON.stringify(['search-1', 'cursor-1'])
  assert.equal(gate.request(first, load), true)
  assert.equal(gate.request(first, load), false)
  assert.equal(gate.request(first, () => calls.push('changed-callback')), false)
  assert.deepEqual(calls, ['page'])
  assert.equal(gate.request(JSON.stringify(['search-1', 'cursor-2']), load), true)
  assert.equal(gate.request(JSON.stringify(['search-2', 'cursor-1']), load), true)
  assert.deepEqual(calls, ['page', 'page', 'page'])
})

test('advance gate refuses missing loaders without consuming the later valid request', () => {
  const gate = createBusinessListAdvanceGate(), calls = []
  for (const load of [undefined, null, {}, false]) assert.equal(gate.request('generation:cursor', load), false)
  assert.equal(gate.request('generation:cursor', () => calls.push('loaded')), true)
  assert.deepEqual(calls, ['loaded'])
})

test('advance gate locks before invoking the loader so a reentrant event cannot fan out', () => {
  const gate = createBusinessListAdvanceGate()
  let calls = 0
  assert.equal(gate.request('key', () => { calls++; assert.equal(gate.request('key', () => calls++), false) }), true)
  assert.equal(calls, 1)
})

function observerEnvironment() {
  const records = []
  return {
    records,
    IntersectionObserver: class {
      constructor(callback, options) { this.callback = callback; this.options = options; this.observed = []; this.disconnected = 0; records.push(this) }
      observe(node) { this.observed.push(node) }
      disconnect() { this.disconnected++ }
    },
  }
}

test('IntersectionObserver watches only the list sentinel in normal document flow and stops after cleanup', () => {
  const env = observerEnvironment(), node = {}, other = {}, calls = []
  const dispose = observeBusinessListEnd(node, () => calls.push('next'), env)
  assert.equal(env.records.length, 1)
  const observer = env.records[0]
  assert.deepEqual(observer.options, { root: null, rootMargin: '400px 0px', threshold: 0 })
  assert.deepEqual(observer.observed, [node])
  observer.callback([{ target: other, isIntersecting: true }, { target: node, isIntersecting: false }])
  assert.equal(calls.length, 0)
  observer.callback([{ target: node, isIntersecting: true }])
  assert.deepEqual(calls, ['next'])
  dispose()
  assert.equal(observer.disconnected, 1)
  observer.callback([{ target: node, isIntersecting: true }])
  assert.deepEqual(calls, ['next'], 'late browser callbacks cannot advance an unmounted list')
})

test('observer setup is inert when the sentinel or action is absent', () => {
  const env = observerEnvironment()
  for (const [node, advance] of [[null, () => assert.fail()], [{}, undefined]]) {
    const dispose = observeBusinessListEnd(node, advance, env)
    assert.equal(typeof dispose, 'function'); dispose()
  }
  assert.equal(env.records.length, 0)
})

function fallbackEnvironment() {
  const listeners = new Map(), callbacks = new Map(), cancelled = []
  let next = 0
  const env = {
    innerHeight: 800, listeners, callbacks, cancelled,
    addEventListener(type, callback, options) { listeners.set(type, { callback, options }) },
    removeEventListener(type, callback) { if (listeners.get(type)?.callback === callback) listeners.delete(type) },
    requestAnimationFrame(callback) { const id = ++next; callbacks.set(id, callback); return id },
    cancelAnimationFrame(id) { cancelled.push(id); callbacks.delete(id) },
    flush() {
      const pending = [...callbacks]; callbacks.clear()
      for (const [, callback] of pending) callback()
    },
  }
  return env
}

test('fallback coalesces ordinary vertical scroll/resize in one animation frame and observes viewport proximity', () => {
  const env = fallbackEnvironment(), calls = []
  let rect = { top: 1201, bottom: 1300 }, measurements = 0
  const node = { getBoundingClientRect() { measurements++; return rect } }
  const dispose = observeBusinessListEnd(node, () => calls.push('next'), env)
  assert.deepEqual([...env.listeners.keys()].sort(), ['resize', 'scroll'])
  assert.deepEqual(env.listeners.get('scroll').options, { passive: true })
  assert.equal(env.callbacks.size, 1, 'initial proximity check is queued')
  const scroll = env.listeners.get('scroll').callback, resize = env.listeners.get('resize').callback
  scroll(); scroll(); resize()
  assert.equal(env.callbacks.size, 1)
  env.flush()
  assert.equal(measurements, 1); assert.equal(calls.length, 0)
  rect = { top: 1200, bottom: 1300 }
  scroll(); resize(); env.flush()
  assert.equal(measurements, 2); assert.deepEqual(calls, ['next'])
  rect = { top: -200, bottom: -1 }
  scroll(); env.flush()
  assert.equal(calls.length, 1, 'a sentinel already above the viewport does not request more')
  rect = { top: -100, bottom: 0 }
  resize(); env.flush()
  assert.equal(calls.length, 2, 'the intersecting lower boundary is included')
  dispose()
  assert.equal(env.listeners.size, 0)
})

test('fallback cleanup cancels a pending frame and ignores saved late frame/listener callbacks', () => {
  const env = fallbackEnvironment()
  let measurements = 0, calls = 0
  const dispose = observeBusinessListEnd({ getBoundingClientRect() { measurements++; return { top: 0, bottom: 10 } } }, () => calls++, env)
  const frame = [...env.callbacks.values()][0]
  const scroll = env.listeners.get('scroll').callback
  const resize = env.listeners.get('resize').callback
  dispose()
  assert.equal(env.listeners.size, 0)
  assert.equal(env.callbacks.size, 0)
  assert.deepEqual(env.cancelled, [1])
  frame(); scroll(); resize(); env.flush()
  assert.equal(measurements, 0); assert.equal(calls, 0)
})

test('fallback and gate together request once even when a visible sentinel is measured repeatedly', () => {
  const env = fallbackEnvironment(), gate = createBusinessListAdvanceGate()
  let calls = 0
  const dispose = observeBusinessListEnd({ getBoundingClientRect: () => ({ top: 100, bottom: 110 }) }, () => gate.request('search-1:page-2', () => calls++), env)
  env.flush()
  for (let index = 0; index < 4; index++) { env.listeners.get('scroll').callback(); env.flush() }
  assert.equal(calls, 1)
  dispose()
})

function guardedEnvironment(withObserver) {
  const env = { ...fallbackEnvironment(), scrollY: 0, ...(withObserver ? observerEnvironment() : {}) }
  env.fire = (type, event = {}) => env.listeners.get(type)?.callback({ isTrusted: true, ...event })
  return env
}

for (const withObserver of [true, false]) {
  const mode = withObserver ? 'IntersectionObserver' : 'fallback'
  function observeGuarded() {
    const env = guardedEnvironment(withObserver), calls = [], node = { getBoundingClientRect: () => ({ top: 100, bottom: 110 }) }
    const dispose = observeBusinessListEnd(node, () => calls.push('next'), env, { requireScrollIntent: true })
    if (withObserver) env.records[0].callback([{ target: node, isIntersecting: true }])
    else env.flush()
    return { env, calls, node, dispose }
  }
  test(`${mode}: initial visibility and programmatic document scrolling cannot request a paid further batch`, () => {
    const h = observeGuarded()
    assert.deepEqual(h.calls, [])
    h.env.scrollY = 600; h.env.fire('scroll'); h.env.flush()
    assert.deepEqual(h.calls, [])
    h.env.fire('wheel', { deltaY: 10, isTrusted: false })
    h.env.scrollY = 900; h.env.fire('scroll'); h.env.flush()
    assert.deepEqual(h.calls, [], 'a synthetic wheel is not genuine intent')
    h.env.fire('wheel', { deltaY: -10 })
    h.env.fire('wheel', { deltaY: 10, ctrlKey: true })
    h.env.fire('touchstart', { touches: [{ clientY: 100 }] })
    h.env.fire('touchmove', { touches: [{ clientY: 120 }] })
    h.env.fire('keydown', { key: ' ', shiftKey: true })
    h.env.scrollY = 1200; h.env.fire('scroll'); h.env.flush()
    assert.deepEqual(h.calls, [], 'upward gestures, zoom and Shift+Space do not authorize downward expansion')
    h.dispose()
  })
  test(`${mode}: remembers initial visible state and requires more than120px after downward wheel intent`, () => {
    const h = observeGuarded()
    h.env.scrollY = 500; h.env.fire('scroll'); h.env.flush()
    h.env.fire('wheel', { deltaY: 100 })
    h.env.scrollY = 620; h.env.fire('scroll'); h.env.flush()
    assert.deepEqual(h.calls, [], 'exactly120px does not pass the strict threshold')
    h.env.scrollY = 621; h.env.fire('scroll'); h.env.flush()
    assert.deepEqual(h.calls, ['next'], 'no second intersection event is needed when the initial sentinel was visible')
    h.dispose()
  })
  test(`${mode}: downward touch and each non-editable paging key qualify only after document movement`, () => {
    for (const intent of ['touch', 'PageDown', 'ArrowDown', 'End', ' ']) {
      const h = observeGuarded()
      if (intent === 'touch') {
        h.env.fire('touchstart', { touches: [{ clientY: 200 }] })
        h.env.fire('touchmove', { touches: [{ clientY: 150 }] })
      } else h.env.fire('keydown', { key: intent, target: { closest: () => null } })
      assert.deepEqual(h.calls, [])
      h.env.scrollY = 121; h.env.fire('scroll'); h.env.flush()
      assert.deepEqual(h.calls, ['next'], intent)
      h.dispose()
    }
  })
  test(`${mode}: editable-field keyboard events never authorize automatic expansion`, () => {
    const h = observeGuarded()
    for (const key of ['PageDown', 'ArrowDown', 'End', ' ']) {
      h.env.fire('keydown', { key, target: { closest: () => ({ tagName: 'INPUT' }) } })
      h.env.fire('keydown', { key, target: { isContentEditable: true, closest: () => null } })
    }
    h.env.scrollY = 500; h.env.fire('scroll'); h.env.flush()
    assert.deepEqual(h.calls, [])
    h.env.fire('keydown', { key: 'PageDown', target: { closest: () => null } })
    h.env.scrollY = 621; h.env.fire('scroll'); h.env.flush()
    assert.deepEqual(h.calls, ['next'])
    h.dispose()
  })
  test(`${mode}: guarded cleanup removes every listener and ignores late gesture/scroll/observer callbacks`, () => {
    const h = observeGuarded()
    assert.deepEqual([...h.env.listeners.keys()].sort(), ['keydown', ...(withObserver ? [] : ['resize']), 'scroll', 'touchmove', 'touchstart', 'wheel'].sort())
    const saved = [...h.env.listeners.values()].map(record => record.callback)
    if (!withObserver) { h.env.fire('scroll'); saved.push(...h.env.callbacks.values()) }
    h.dispose()
    assert.equal(h.env.listeners.size, 0); assert.equal(h.env.callbacks.size, 0)
    h.env.scrollY = 999
    for (const callback of saved) callback({ isTrusted: true, key: 'End', deltaY: 10, touches: [{ clientY: 0 }], target: { closest: () => null } })
    if (withObserver) {
      assert.equal(h.env.records[0].disconnected, 1)
      h.env.records[0].callback([{ target: h.node, isIntersecting: true }])
    }
    h.env.flush()
    assert.deepEqual(h.calls, [])
  })
}

test('the explicit keyboard load action can use the advance gate without satisfying the observer gesture guard', () => {
  const env = guardedEnvironment(true), gate = createBusinessListAdvanceGate(), node = {}, calls = []
  const load = () => gate.request('paid:page2', () => calls.push('requested'))
  const dispose = observeBusinessListEnd(node, load, env, { requireScrollIntent: true })
  env.records[0].callback([{ target: node, isIntersecting: true }])
  assert.deepEqual(calls, [])
  load()
  assert.deepEqual(calls, ['requested'])
  dispose()
})
