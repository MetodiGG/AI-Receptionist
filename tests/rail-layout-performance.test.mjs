import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { observeRailLayout } from '../lib/discovery/rail-layout.mjs'

function harness() {
  let resize, mutation, measures = 0, next = 0
  const observed = [], unobserved = [], disconnected = [], frames = new Map(), events = new Map()
  const env = {
    ResizeObserver: class { constructor(fn) { resize = fn } observe(node) { observed.push(node) } unobserve(node) { unobserved.push(node) } disconnect() { disconnected.push('resize') } },
    MutationObserver: class { constructor(fn) { mutation = fn } observe(node, options) { assert.deepEqual(options, { childList: true }) } disconnect() { disconnected.push('mutation') } },
    requestAnimationFrame(fn) { const id = ++next; frames.set(id, fn); return id },
    cancelAnimationFrame(id) { frames.delete(id) },
    addEventListener(name, fn) { events.set(name, fn) }, removeEventListener(name, fn) { if (events.get(name) === fn) events.delete(name) },
  }
  const node = { children: [{ id: 'a' }, { id: 'b' }] }
  const stop = observeRailLayout(node, () => measures++, env)
  return { node, stop, observed, unobserved, disconnected, frames, events, resize: () => resize(), mutation: () => mutation(), get measures() { return measures }, flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()) } }
}

test('rail measures once per frame and does not re-observe unchanged cards', () => {
  const h = harness()
  assert.equal(h.observed.length, 3); assert.equal(h.frames.size, 1)
  for (let i = 0; i < 100; i++) { h.resize(); h.mutation(); h.events.get('resize')() }
  assert.equal(h.frames.size, 1); assert.equal(h.observed.length, 3); assert.equal(h.unobserved.length, 0)
  h.flush(); assert.equal(h.measures, 1)
  h.resize(); h.flush(); assert.equal(h.measures, 2)
  h.stop()
})

test('append/remove tracks only changed children and cleanup cancels late measurements', () => {
  const h = harness(), removed = h.node.children.shift(), added = { id: 'c' }
  h.node.children.push(added); h.mutation()
  assert.deepEqual(h.unobserved, [removed]); assert.equal(h.observed.at(-1), added)
  assert.equal(h.observed.length, 4); assert.equal(h.frames.size, 1)
  h.stop(); assert.deepEqual(h.disconnected, ['resize', 'mutation']); assert.equal(h.events.size, 0); assert.equal(h.frames.size, 0)
  h.resize(); h.mutation(); h.flush(); assert.equal(h.measures, 0)
})

test('rails still work without observer support through their resize fallback', () => {
  const events = new Map(), frames = [], node = { children: [] }
  let measures = 0
  const stop = observeRailLayout(node, () => measures++, { requestAnimationFrame: fn => (frames.push(fn), frames.length), cancelAnimationFrame() {}, addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name) })
  frames.shift()(); assert.equal(measures, 1)
  events.get('resize')(); frames.shift()(); assert.equal(measures, 2)
  stop(); assert.equal(events.size, 0)
})

test('catalogue rendering skips unchanged cards and loads the Google renderer only on demand', async () => {
  const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  const [card, browse, rail] = await Promise.all(['components/discovery-business-card.js','components/discovery-home-browse.js','components/discovery-home-rail.js'].map(read))
  assert.match(card, /memo\(function DiscoveryBusinessCard/)
  assert.match(browse, /const rows = useMemo/); assert.match(browse, /const distanceOrigin = useMemo/)
  assert.match(browse, /const GoogleDiscoveryList = dynamic\(\(\) => import\('\.\/google-discovery-list'\)/)
  assert.doesNotMatch(browse, /import \{ GoogleDiscoveryList \}/)
  assert.match(rail, /observeRailLayout\(rail\.current, measure, window\)/)
  assert.doesNotMatch(rail, /\[children\]/)
})
