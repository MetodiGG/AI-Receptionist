import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as categories from '../lib/discovery/categories.mjs'
import * as subcategories from '../lib/discovery/subcategories.mjs'
import * as rail from '../lib/discovery/rail.mjs'
import * as copy from '../lib/discovery/inline-copy.mjs'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
async function compile(filename, stubs = {}) {
  const { code } = await transform(await read(filename), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(stubs, name) ? stubs[name] : require(name), module, module.exports)
  return module.exports
}
const icon = await compile('components/icon.js')
const imports = {
  './icon': icon,
  '../lib/discovery/categories.mjs': categories, '../lib/discovery/subcategories.mjs': subcategories,
  '../lib/discovery/rail.mjs': rail, '../lib/discovery/inline-copy.mjs': copy,
}
const { InlineDiscoverySummary } = await compile('components/inline-discovery-summary.js', {
  ...imports,
  react: { ...React, useId: () => 'inline-summary-order', useRef: () => ({ current: null }), useState: initial => [initial, () => {}], useEffect() {} },
})
const row = id => ({ id, source: 'catalogue', name: id })
const result = patch => ({ intent: { browse: true }, externalStatus: 'catalogue', results: [row('one'), row('two')], cataloguePage: { offset: 0, total: 200, nextOffset: 15 }, ...patch })
const props = { category: 'education', subcategory: 'education-school', onClearCategory() {}, onClearService() {}, onChangeArea() {} }
const render = patch => renderToStaticMarkup(InlineDiscoverySummary({ ...props, result: result(), ...patch }))
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}

test('compact inline labels preserve matching locale key sets without redundant All-services or sorting copy', () => {
  assert.deepEqual(Object.keys(copy.INLINE_DISCOVERY_COPY.bg).sort(), Object.keys(copy.INLINE_DISCOVERY_COPY.en).sort())
  for (const locale of ['bg', 'en']) for (const key of ['all', 'changeArea', 'sorting', 'sortBrowse', 'sortQuery', 'sortCurrent', 'sortHint']) assert.equal(copy.INLINE_DISCOVERY_COPY[locale][key], undefined)
  for (const locale of ['bg', 'en']) for (const value of Object.values(copy.INLINE_DISCOVERY_COPY[locale])) assert.ok(typeof value === 'string' && value.trim())
})

test('category and service are full localized removable chips with decorative vector crosses', () => {
  for (const locale of ['bg', 'en']) {
    const html = render({ locale })
    const parent = categories.categoryById(props.category)[locale]
    const child = subcategories.subcategoryById(props.subcategory)[locale]
    assert.ok(html.includes(parent)); assert.ok(html.includes(child))
    assert.ok(html.includes(`${copy.INLINE_DISCOVERY_COPY[locale].clearCategory} · ${parent}`))
    assert.ok(html.includes(`${copy.INLINE_DISCOVERY_COPY[locale].clearService} · ${child}`))
    assert.equal((html.match(/class="inline-summary-chip /g) || []).length, 2)
    assert.equal((html.match(/<svg[^>]*aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/g) || []).length, 2)
    assert.doesNotMatch(html, /aria-haspopup|aria-expanded|×|<img|guide-panel|guide-launch/)
  }
})

test('breadcrumb callbacks only clear their own selection; the redundant area action is no longer rendered', () => {
  const called = []
  const tree = InlineDiscoverySummary({ ...props, onClearCategory: () => called.push('category'), onClearService: () => called.push('service'), onChangeArea: () => called.push('area') })
  const buttons = elements(tree, node => node.type === 'button')
  assert.equal(buttons.length, 2)
  for (const button of buttons) { assert.equal(button.props.type, 'button'); button.props.onClick() }
  assert.deepEqual(called, ['category', 'service'])
})

test('unknown/mismatched selections cannot expose a false service chip or picker', () => {
  const all = render({ category: '', subcategory: '' })
  assert.match(all, /Всички категории/); assert.doesNotMatch(all, /inline-summary-chip /)
  const mismatch = render({ subcategory: 'fitness-yoga' })
  assert.match(mismatch, /inline-summary-chip--category/)
  assert.doesNotMatch(mismatch, /Всички услуги в категорията|inline-summary-context/)
  assert.doesNotMatch(mismatch, /inline-summary-chip--service|Йога/)
  const unknown = render({ category: 'not-a-category', subcategory: 'education-school' })
  assert.doesNotMatch(unknown, /inline-summary-chip /)
})

test('counts describe only actual displayed unique rows, never an unverified catalogue total', () => {
  const html = render({ result: result({ results: [row('one'), row('one'), row('two'), { id: 'invalid', source: 'invalid' }], cataloguePage: { offset: 0, total: 999, nextOffset: 15 } }) })
  assert.match(html, /<strong>2<\/strong> показани/)
  assert.match(html, /Има още/)
  assert.doesNotMatch(html, /999|200|свободни|часа|слота/)
  const last = render({ result: result({ cataloguePage: { offset: 0, total: 999, nextOffset: null } }) })
  assert.match(last, /<strong>2<\/strong> показани/); assert.doesNotMatch(last, /Има още/)
})

test('missing, malformed or exhausted paging metadata cannot invent more results or a total', () => {
  for (const cataloguePage of [undefined, { total: 500 }, { nextOffset: 0 }, { nextOffset: -1 }, { nextOffset: '15' }, { nextOffset: Infinity }]) {
    const html = render({ result: result({ results: [], cataloguePage }) })
    assert.match(html, /<strong>0<\/strong> показани/)
    assert.doesNotMatch(html, /Има още|500/)
  }
  assert.match(render({ locale: 'en' }), /<strong>2<\/strong> shown/)
})

test('loading hides stale counts and no-result-yet does not fabricate zero matches', () => {
  const loading = render({ loading: true })
  assert.match(loading, /aria-busy="true"/); assert.match(loading, /Зареждаме…/)
  assert.doesNotMatch(loading, /<strong>2|показани|Има още/)
  const initial = render({ result: null })
  assert.match(initial, /Подходящи бизнеси/); assert.doesNotMatch(initial, /<strong>0/)
})

test('compact breadcrumbs never expose sorting, area pin or All-services context for any actual server ordering', () => {
  for (const [intent, locale] of [
    [{ browse: true }, 'bg'], [{ browse: true }, 'en'],
    [{ browse: false }, 'bg'], [{ service: 'yoga' }, 'en'],
  ]) {
    const tree = InlineDiscoverySummary({ ...props, locale, result: result({ intent }) })
    assert.equal(elements(tree, node => node.type === 'select').length, 0)
    const html = renderToStaticMarkup(tree)
    assert.doesNotMatch(html, /inline-summary-sort|inline-summary-area|inline-summary-context|inline-summary-meta|All services in this category|Всички услуги в категорията/)
    assert.equal(elements(tree, node => node.props.className === 'inline-summary-separator')[0].props['aria-hidden'], 'true')
  }
  assert.doesNotMatch(render({ result: null }), /Автоматична подредба|<select/)
})

test('clarification replaces cards, so even a malformed payload carrying rows cannot advertise them as displayed businesses', () => {
  for (const locale of ['bg', 'en']) for (const nextOffset of [null, 15]) {
    const html = render({ locale, result: result({ clarification: { message: 'Choose a more specific service' }, cataloguePage: { total: 999, nextOffset } }) })
    assert.match(html, new RegExp(`<strong>0<\\/strong> ${copy.INLINE_DISCOVERY_COPY[locale].shown}`))
    assert.doesNotMatch(html, /<strong>2|Има още|More available|999/)
  }
})

test('the decorative breadcrumb separator stays grouped with its service, never orphaned on a wrapped line', () => {
  const tree = InlineDiscoverySummary({ ...props, result: result() })
  const [group] = elements(tree, node => node.props.className === 'inline-summary-service')
  assert.equal(elements(group, node => node.props.className === 'inline-summary-separator').length, 1)
  assert.equal(elements(group, node => node.props.className === 'inline-summary-chip inline-summary-chip--service').length, 1)
  assert.equal(elements(tree, node => node.props.className === 'inline-summary-separator').length, 1)
})

test('summary does not mutate server order or introduce availability requests, counts or sorting parameters', async () => {
  const rows = Object.freeze([Object.freeze(row('z')), Object.freeze(row('a'))])
  const payload = Object.freeze(result({ results: rows }))
  render({ result: payload })
  assert.deepEqual(rows.map(item => item.id), ['z', 'a'])
  const source = await read('components/inline-discovery-summary.js')
  assert.doesNotMatch(source, /\bfetch\s*\(|\.sort\s*\(|\bToday\b|\bДнес\b|startsAt|getSlots|booking_mode|onStage|onSelect/)
  assert.match(source, /orderedRailRows/)
})

async function stickyHarness({ height = 145, viewport = 844, previous = '', priority = '', observerAvailable = true } = {}) {
  const priorWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const priorObserver = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')
  let measuredHeight = height, effect, observerCallback, resizeCallback, disconnected = false, removed = false, observed
  const state = [], properties = new Map(previous ? [['--inline-summary-offset', { value: previous, priority }]] : [])
  const style = {
    getPropertyValue: name => properties.get(name)?.value || '', getPropertyPriority: name => properties.get(name)?.priority || '',
    setProperty: (name, value, priority = '') => properties.set(name, { value, priority }), removeProperty: name => properties.delete(name),
  }
  const shell = { style }, summary = { closest: selector => { assert.equal(selector, '.discovery-home'); return shell }, getBoundingClientRect: () => ({ height: measuredHeight }) }
  const browser = { innerHeight: viewport, addEventListener: (name, callback) => { assert.equal(name, 'resize'); resizeCallback = callback }, removeEventListener: (name, callback) => { assert.equal(name, 'resize'); assert.equal(callback, resizeCallback); removed = true } }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser })
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: observerAvailable ? class {
    constructor(callback) { observerCallback = callback }
    observe(target) { observed = target }
    disconnect() { disconnected = true }
  } : undefined })
  let cleanup
  const restore = () => {
    cleanup?.(); cleanup = null
    if (priorWindow) Object.defineProperty(globalThis, 'window', priorWindow); else delete globalThis.window
    if (priorObserver) Object.defineProperty(globalThis, 'ResizeObserver', priorObserver); else delete globalThis.ResizeObserver
  }
  try {
    const { InlineDiscoverySummary: Component } = await compile('components/inline-discovery-summary.js', {
      ...imports, react: { ...React, useId: () => 'inline-summary-order', useRef: () => ({ current: summary }), useState: initial => [initial, value => state.push(value)], useEffect: callback => { effect = callback } },
    })
    const initial = Component({ ...props, result: result() })
    assert.equal(initial.props['data-sticky-safe'], undefined, 'server/first client render is nonsticky until measured')
    cleanup = effect()
    return {
      state, properties, browser, summary, get observed() { return observed }, get disconnected() { return disconnected }, get removed() { return removed },
      measureHeight(value) { measuredHeight = value; observerCallback?.() }, resize(value) { browser.innerHeight = value; resizeCallback() },
      cleanup() { cleanup?.(); cleanup = null }, notifyAfterCleanup() { observerCallback?.(); resizeCallback?.() }, restore,
    }
  } catch (error) { restore(); throw error }
}

test('presentation-only observation measures safe sticky height and offsets following content by height plus 24px', async () => {
  const fixture = await stickyHarness({ height: 145.2, viewport: 844 })
  try {
    assert.equal(fixture.observed, fixture.summary)
    assert.equal(fixture.state.at(-1), true)
    assert.deepEqual(fixture.properties.get('--inline-summary-offset'), { value: '170px', priority: '' })
    fixture.measureHeight(206)
    assert.equal(fixture.state.at(-1), true)
    assert.equal(fixture.properties.get('--inline-summary-offset').value, '230px')
  } finally { fixture.restore() }
})

test('enlarged text or a short viewport disables sticky and removes the extra scroll offset', async () => {
  const fixture = await stickyHarness()
  try {
    fixture.measureHeight(241)
    assert.equal(fixture.state.at(-1), false)
    assert.equal(fixture.properties.get('--inline-summary-offset').value, '0px')
    fixture.measureHeight(145)
    fixture.resize(400)
    assert.equal(fixture.state.at(-1), false, '145px exceeds thirty percent of a 400px-high viewport')
    assert.equal(fixture.properties.get('--inline-summary-offset').value, '0px')
    fixture.resize(844)
    assert.equal(fixture.state.at(-1), true)
    fixture.measureHeight(0)
    assert.equal(fixture.state.at(-1), false, 'an unmeasurable summary cannot be marked sticky-safe')
  } finally { fixture.restore() }
})

test('sticky observation cleans up listeners, disconnects and restores the prior scoped CSS property', async () => {
  for (const previous of ['', '88px']) {
    const fixture = await stickyHarness({ previous, priority: previous ? 'important' : '' })
    try {
      fixture.cleanup()
      assert.equal(fixture.disconnected, true); assert.equal(fixture.removed, true)
      assert.deepEqual(fixture.properties.get('--inline-summary-offset'), previous ? { value: previous, priority: 'important' } : undefined)
      const states = fixture.state.length
      fixture.notifyAfterCleanup()
      assert.equal(fixture.state.length, states, 'a queued observer callback cannot mutate an unmounted summary')
      assert.deepEqual(fixture.properties.get('--inline-summary-offset'), previous ? { value: previous, priority: 'important' } : undefined)
    } finally { fixture.restore() }
  }
})

test('without ResizeObserver the summary stays safely in normal flow rather than relying on stale measurements', async () => {
  const fixture = await stickyHarness({ observerAvailable: false })
  try {
    assert.equal(fixture.state.at(-1), false)
    assert.equal(fixture.properties.get('--inline-summary-offset').value, '0px')
    fixture.resize(900)
    assert.equal(fixture.state.at(-1), false)
  } finally { fixture.restore() }
})
