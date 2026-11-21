import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { DateTime } from 'luxon'
import * as locations from '../lib/business-location.mjs'
import * as categories from '../lib/discovery/categories.mjs'
import * as locationQuery from '../lib/discovery/location-query.mjs'
import * as copy from '../lib/discovery/copy.mjs'
import * as defaults from '../lib/discovery/defaults.mjs'
import * as searchUi from '../lib/discovery/search-ui.mjs'
import * as home from '../lib/discovery/home.mjs'
import * as labs from '../lib/discovery/laboratories.mjs'
import * as pagination from '../lib/discovery/catalogue-pagination.mjs'
import * as guidedNavigation from '../lib/discovery/guided-navigation.mjs'
import * as guidedCopy from '../lib/discovery/guided-copy.mjs'
import { subcategoriesForCategory } from '../lib/discovery/subcategories.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
async function compile(file) {
  return (await transform(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'), { filename: file, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })).code
}
const code = await compile('components/discovery-search.js')
let activeHarness
const hooks = { ...React, useId: () => 'local-performance', useMemo: fn => fn(), useState: initial => activeHarness.state(initial), useRef: initial => activeHarness.ref(initial), useEffect: (effect, deps) => activeHarness.effect(effect, deps) }
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
function harness(component, props) {
  const slots = [], pending = []
  let index = 0, dirty = false, disposed = false
  const h = {
    props, tree: null,
    invalidate() { dirty = true },
    slot(initial) { const at = index++; return slots[at] ?? (slots[at] = { value: initial() }) },
    state(initial) { const slot = h.slot(() => typeof initial === 'function' ? initial() : initial); return [slot.value, next => { const value = typeof next === 'function' ? next(slot.value) : next; if (!Object.is(value, slot.value)) { slot.value = value; dirty = true } }] },
    ref(initial) { return h.slot(() => ({ current: initial })).value },
    effect(effect, deps) { const slot = h.slot(() => ({ deps: undefined, cleanup: undefined })); if (!deps || !slot.value.deps || deps.some((value, at) => !Object.is(value, slot.value.deps[at]))) { slot.value.deps = deps; pending.push(() => { slot.value.cleanup?.(); slot.value.cleanup = effect() }) } },
    render() { index = 0; dirty = false; activeHarness = h; try { h.tree = component(h.props) } finally { activeHarness = null }; return h.tree },
    flush() { if (disposed) return; let turns = 0; while (dirty || pending.length) { assert.ok(++turns < 40); while (pending.length) pending.shift()(); if (dirty) h.render() } },
    dispose() { disposed = true; pending.length = 0; slots.forEach(slot => slot.value?.cleanup?.()) },
  }
  h.render(); h.flush(); return h
}
const point = { latitude: 42.66, longitude: 23.28, consent: true }
const locatedPoint = () => ({ ...point, accuracyMeters: 25, observedAt: Date.now() })
const response = (id = 'city-row', patch = {}) => ({ results: [{ id, source: 'catalogue', name: 'Local fictional QA result' }], externalStatus: 'catalogue', intent: { cityCode: '68134' }, cataloguePage: { offset: 0, total: 1, nextOffset: null }, ...patch })
const controls = Object.fromEntries(['Icon', 'BrandMark', 'BrandLoading', 'DiscoveryRouteArt', 'BusinessCategoryIcon', 'DiscoveryHomeBusinesses', 'DiscoverySubcategories', 'InlineCategoryGrid', 'InlineDiscoverySummary', 'DiscoveryFilterSheet', 'DiscoveryAutocomplete'].map(name => [name, Object.defineProperty(() => null, 'name', { value: name })]))
function fixture(patch = {}, draft = null, { manualFrames = false, initialUrl, reducedMotion = true, presentSubcategories = true } = {}) {
  const requests = [], permission = [], timers = new Map(), focused = [], navigations = [], drafts = [], listeners = new Map(), analytics = [], historyCalls = []
  let timerId = 0, clears = 0, notifyNavigation = () => {}
  let currentUrl = new URL(initialUrl || `/?lang=${patch.locale || 'bg'}`, 'https://www.gorez.co')
  const historyEntries = [currentUrl.href]; let historyIndex = 0
  const browser = {
    isSecureContext: true, matchMedia: () => ({ matches: reducedMotion }),
    get location() { return currentUrl },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name) },
    history: {
      pushState(_state, _unused, href) { historyCalls.push(['push', href]); currentUrl = new URL(href, currentUrl); historyEntries.splice(++historyIndex, Infinity, currentUrl.href); notifyNavigation() },
      replaceState(_state, _unused, href) { historyCalls.push(['replace', href]); currentUrl = new URL(href, currentUrl); historyEntries[historyIndex] = currentUrl.href; notifyNavigation() },
    },
  }
  const frames = new Map(); let frameId = 0
  const imports = { react: hooks, 'next/link': () => null, 'next/navigation': { useRouter: () => ({ push: value => navigations.push(value) }) }, '../lib/business-location.mjs': locations, '../lib/discovery/categories.mjs': categories, '../lib/discovery/location-query.mjs': locationQuery, '../lib/discovery/copy.mjs': copy, '../lib/discovery/defaults.mjs': defaults, '../lib/discovery/draft.mjs': { peekDiscoveryDraft: () => draft, clearDiscoveryDraft: () => { clears++ }, setDiscoveryDraft: value => drafts.push(value) }, '../lib/discovery/search-ui.mjs': searchUi, '../lib/discovery/results-navigation.mjs': { focusDiscoveryResults: () => focused.push('focus') }, '../lib/discovery/home.mjs': home, '../lib/discovery/laboratories.mjs': labs, '../lib/discovery/catalogue-pagination.mjs': pagination }
  imports['../lib/discovery/results-navigation.mjs'] = {
    focusDiscoveryResults: () => { focused.push('focus'); return true },
    focusDiscoverySubcategories: () => { if (!presentSubcategories) return false; focused.push('subcategories'); return true },
    focusFirstDiscoveryBusiness: () => { focused.push('businesses'); return true },
  }
  Object.assign(imports, {
    '../lib/discovery/guided-navigation.mjs': guidedNavigation,
    '../lib/discovery/guided-copy.mjs': guidedCopy,
    '../lib/search-analytics-client': { trackSearchEvent: event => analytics.push(event) },
  })
  // Next's native-history integration publishes URL context independently of
  // our own popstate listeners, including a cached App Router restoration.
  imports['next/navigation'].useSearchParams = () => new URLSearchParams(currentUrl.search)
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'clearTimeout', 'window', 'navigator', 'requestAnimationFrame', 'cancelAnimationFrame', code)(name => name in imports ? imports[name] : name.startsWith('./') ? controls : require(name), module, module.exports,
    (url, init) => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); requests.push({ url, init, body: JSON.parse(init.body), reject, respond(value = response(), status = 200) { resolve({ ok: status >= 200 && status < 300, json: async () => value }) } }); return promise },
    (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id }, id => timers.delete(id), browser, { geolocation: {} }, fn => { if (!manualFrames) { fn(); return 1 }; const id = ++frameId; frames.set(id, fn); return id }, id => frames.delete(id))
  const h = harness(module.exports.DiscoverySearch, { home: true, locale: 'bg', locationProvider: () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); permission.push({ resolve, reject }); return promise }, ...patch })
  notifyNavigation = () => h.invalidate()
  const f = {
    h, requests, permission, focused, navigations, drafts, analytics, historyCalls,
    frames() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); h.flush() },
    attachPanel(panel) { f.children().props.navigationRef.current = { closest(selector) { assert.equal(selector, '.inline-discovery-panel'); return panel } } },
    attachResultPanel(panel) { f.control('DiscoveryHomeBusinesses').props.headingRef.current = { closest(selector) { assert.equal(selector, '.discovery-search'); return { querySelector(selector) { assert.equal(selector, '.inline-discovery-panel'); return panel } } } } },
    panelTimer() { for (const [id, timer] of [...timers]) if (timer.delay === 220) { timers.delete(id); timer.fn() } h.flush() },
    control: name => elements(h.tree, node => node.type === controls[name])[0],
    grid: () => f.control('InlineCategoryGrid'),
    children: () => f.control('DiscoverySubcategories'),
    summary: () => f.control('InlineDiscoverySummary'),
    chooseCategory(id) { f.grid().props.onSelect(id); h.flush() },
    url: () => currentUrl.href,
    pop(href) { currentUrl = new URL(href, currentUrl); notifyNavigation(); listeners.get('popstate')?.(); h.flush() },
    restoreUrlContext(href) { currentUrl = new URL(href, currentUrl); notifyNavigation(); h.flush() },
    back() { if (historyIndex > 0) { currentUrl = new URL(historyEntries[--historyIndex]); notifyNavigation(); listeners.get('popstate')?.(); h.flush() } },
    forward() { if (historyIndex + 1 < historyEntries.length) { currentUrl = new URL(historyEntries[++historyIndex]); notifyNavigation(); listeners.get('popstate')?.(); h.flush() } },
    query: () => elements(h.tree, node => node.type === 'input' && node.props.id === 'ai-query')[0],
    location: () => elements(h.tree, node => node.type === 'button' && node.props.className?.includes('home-inline-location'))[0],
    entry() { for (const [id, timer] of [...timers]) if (timer.delay === 0) { timers.delete(id); timer.fn() } h.flush() },
    settleQuery() { for (const [id, timer] of [...timers]) if (timer.delay === 350) { timers.delete(id); timer.fn() } h.flush() },
    focus() { listeners.get('focus')?.(); h.flush() },
    debounce() { f.settleQuery() },
    edit(value) { f.query().props.onChange({ target: { value } }); h.flush() },
    toggle() { const promise = f.location().props.onClick(); h.flush(); return promise },
    submit() { elements(h.tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} }); h.flush() },
    category(id) { f.chooseCategory(id) },
    subcategory(id) { f.children().props.onSelect(id); h.flush() },
    clearCategory() { f.summary().props.onClearCategory(); h.flush() },
    clearService() { f.summary().props.onClearService(); h.flush() },
    filters(values) { elements(h.tree, node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog')[0].props.onClick({ currentTarget: {} }); h.flush(); f.control('DiscoveryFilterSheet').props.onApply(values); h.flush() },
    async settle() { for (let i = 0; i < 15; i++) { await Promise.resolve(); h.flush() } },
    async ready() {
      // Explicitly select a guard-test baseline before the zero-delay initial
      // all-category browse. The real initial browse has its own tests below.
      if (!requests.length) f.category('hair')
      f.entry()
      assert.equal(requests.length, 1); requests[0].respond(); await f.settle()
      // Establish an explicitly chosen result as the guard-test baseline.
      // Drain any queued frames before the later action under test.
      if (manualFrames) f.frames()
      focused.length = 0
    },
    clears: () => clears,
    close: () => h.dispose(),
  }
  return f
}

test('a fresh inline homepage immediately browses every category without an invented selection or location prompt', async () => {
  const f = fixture()
  try {
    assert.ok(f.control('DiscoveryHomeBusinesses'))
    assert.equal(f.grid().props.category, '')
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.control('DiscoveryHomeBusinesses').props.loading, true)
    assert.equal(f.children(), undefined)
    assert.equal(f.summary().props.result, null)
    f.entry()
    assert.equal(f.requests.length, 1); assert.equal(f.permission.length, 0)
    assert.deepEqual(f.requests[0].body, { query: '', locale: 'bg', radiusKm: 2, browse: true, cityCode: '68134' })
    assert.equal(f.query().props.disabled, false); assert.equal(f.location().props['aria-pressed'], false)
    assert.equal(f.focused.length, 0); assert.equal(f.permission.length, 0)
    assert.equal(f.analytics.length, 0, 'an unfinished browse is not recorded as a search success')
    f.requests[0].respond(response('all-category-result')); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'all-category-result')
    f.h.render(); f.h.flush(); f.entry()
    assert.equal(f.requests.length, 1, 'ordinary rendering must not repeat the initial browse')
  } finally { f.close() }
})

test('inline category reveals its committed children automatically; child selection reveals only its matching results', async () => {
  for (const locale of ['bg', 'en']) {
    const f = fixture({ locale })
    try {
      f.chooseCategory('hair'); f.entry()
      assert.equal(f.grid().props.category, 'hair')
      assert.ok(f.control('DiscoveryHomeBusinesses'), 'results remain mounted under the inline choices')
      assert.equal(f.children().props.inline, true)
      assert.deepEqual(f.focused, [])
      const child = subcategoriesForCategory('hair', locale)[0]
      f.requests[0].respond(response('hair-parent', { subcategoryOptions: [{ ...child, count: 1 }] })); await f.settle()
      assert.deepEqual(f.focused, ['subcategories'], 'a deliberate category selection reveals its actual children')
      assert.ok(f.children().props.navigationRef)
      assert.deepEqual(f.children().props.options, [{ ...child, count: 1 }])
      f.h.render(); f.h.flush()
      assert.deepEqual(f.focused, ['subcategories'], 'ordinary re-renders do not repeat navigation or skip to background businesses')
      f.focused.length = 0
      f.subcategory(child.id)
      assert.equal(f.requests[1].body.subcategory, child.id)
      assert.deepEqual(f.focused, [])
      f.requests[1].respond(response('child-first', { intent: { cityCode: '68134', subcategory: child.id } })); await f.settle()
      assert.deepEqual(f.focused, ['businesses'])
      assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'child-first')
    } finally { f.close() }
  }
})

test('a fast accepted category waits for its actual opening animation before measuring the scroll destination', async () => {
  const f = fixture({}, null, { manualFrames: true, reducedMotion: false })
  let finish
  const finished = new Promise(resolve => { finish = resolve })
  try {
    f.chooseCategory('hair'); f.entry()
    f.attachPanel({ getAnimations: () => [{ finished }] })
    const child = subcategoriesForCategory('hair')[0]
    f.requests[0].respond(response('hair-current', { subcategoryOptions: [{ ...child, count: 1 }] })); await f.settle()
    assert.deepEqual(f.focused, [], 'do not navigate before the current response commits')
    f.frames()
    assert.deepEqual(f.focused, [], 'do not align against the temporary animated panel height')
    finish(); await f.settle()
    assert.deepEqual(f.focused, ['subcategories'])
    f.h.render(); f.h.flush(); f.frames(); await f.settle()
    assert.deepEqual(f.focused, ['subcategories'], 'the committed navigation is consumed exactly once')
  } finally { finish(); f.close() }
})

test('pending panel completion cannot steal focus after a newer category, typed text, history restore or unmount', async () => {
  for (const action of ['category', 'typing', 'history', 'unmount']) {
    const f = fixture({}, null, { manualFrames: true, reducedMotion: false })
    let finish
    const finished = new Promise(resolve => { finish = resolve })
    try {
      f.chooseCategory('hair'); f.entry()
      f.attachPanel({ getAnimations: () => [{ finished }] })
      f.requests[0].respond(response('hair-current')); await f.settle(); f.frames()
      assert.deepEqual(f.focused, [])
      if (action === 'category') f.chooseCategory('nails')
      if (action === 'typing') f.edit('ново търсене')
      if (action === 'history') f.restoreUrlContext('/?lang=bg&category=fitness')
      if (action === 'unmount') f.close()
      finish(); await f.settle()
      assert.deepEqual(f.focused, [], action)
    } finally { finish(); f.close() }
  }
})

test('older animation APIs get a cancellable settling fallback, while reduced motion never waits for panel animation', async () => {
  for (const reducedMotion of [false, true]) {
    const f = fixture({}, null, { manualFrames: true, reducedMotion })
    try {
      f.chooseCategory('hair'); f.entry()
      f.attachPanel({})
      f.requests[0].respond(response('hair-current')); await f.settle(); f.frames()
      assert.deepEqual(f.focused, reducedMotion ? ['subcategories'] : [])
      f.panelTimer()
      assert.deepEqual(f.focused, ['subcategories'])
    } finally { f.close() }
  }
  const f = fixture({}, null, { manualFrames: true, reducedMotion: false })
  try {
    f.chooseCategory('hair'); f.entry(); f.attachPanel({})
    f.requests[0].respond(response('hair-current')); await f.settle(); f.frames()
    f.edit('ново търсене'); f.panelTimer()
    assert.deepEqual(f.focused, [], 'typing cancels even a fallback timer that was already queued')
  } finally { f.close() }
})

test('a settled category with no real child panel reveals its result or honest empty heading instead', async () => {
  const f = fixture({}, null, { presentSubcategories: false })
  try {
    f.chooseCategory('other'); f.entry()
    assert.deepEqual(f.focused, [], 'pending facets are not a completed destination')
    f.requests[0].respond(response('no-matches', { results: [], subcategoryOptions: [] })); await f.settle()
    assert.deepEqual(f.focused, ['focus'], 'no invented child destination and no fabricated first business')
    assert.deepEqual(f.control('DiscoveryHomeBusinesses').props.result.results, [])
  } finally { f.close() }
})

test('clearing a category waits for its closing panel so the first committed business does not shift after scrolling', async () => {
  const f = fixture({}, null, { manualFrames: true, reducedMotion: false })
  let finish
  const finished = new Promise(resolve => { finish = resolve })
  try {
    await f.ready()
    f.attachResultPanel({ getAnimations: () => [{ finished }] })
    f.clearCategory()
    f.requests[1].respond(response('all-category-current')); await f.settle(); f.frames()
    assert.deepEqual(f.focused, [])
    finish(); await f.settle()
    assert.deepEqual(f.focused, ['businesses'])
  } finally { finish(); f.close() }
})

test('late category responses cannot navigate or overwrite a newer choice; typing cancels queued navigation', async () => {
  const f = fixture()
  try {
    await f.ready()
    f.category('nails'); f.category('fitness')
    assert.equal(f.requests[1].init.signal.aborted, true)
    f.requests[1].respond(response('stale-nails')); await f.settle()
    assert.deepEqual(f.focused, [])
    f.requests[2].respond(response('current-sport')); await f.settle()
    assert.deepEqual(f.focused, ['subcategories'], 'only the latest category reveals its child choices')
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'current-sport')
    f.focused.length = 0
    f.category('hair'); f.edit('ново търсене')
    f.requests[3].respond(response('hair-after-typing')); await f.settle()
    assert.deepEqual(f.focused, [], 'do not steal focus while the visitor is typing')
  } finally { f.close() }
})

test('category loading failures keep inline choices and truthful retry feedback, not fabricated empty results', async () => {
  const f = fixture()
  try {
    await f.ready(); f.chooseCategory('nails')
    f.requests[1].respond({ error: { code: 'SEARCH_UNAVAILABLE' } }, 503); await f.settle()
    assert.deepEqual(f.focused, ['focus'], 'a failed deliberate category request reveals its real error/retry status')
    assert.equal(f.control('DiscoveryHomeBusinesses').props.error, 'SEARCH_UNAVAILABLE')
    assert.ok(f.children())
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result, null)
  } finally { f.close() }
})

test('a queued animation frame is cancelled by a newer request, typing or unmount before it can steal focus', async () => {
  for (const action of ['new-request', 'typing', 'unmount']) {
    const f = fixture({}, null, { manualFrames: true })
    try {
      await f.ready(); f.category('nails'); f.subcategory(subcategoriesForCategory('nails')[0].id)
      f.requests[2].respond(response('nail-result', { intent: { cityCode: '68134', subcategory: subcategoriesForCategory('nails')[0].id } })); await f.settle()
      assert.deepEqual(f.focused, [], 'the real next animation frame has not run yet')
      if (action === 'new-request') f.category('fitness')
      if (action === 'typing') f.edit('ново търсене')
      if (action === 'unmount') f.close()
      f.frames()
      assert.deepEqual(f.focused, [], action)
      if (action === 'new-request') {
        f.subcategory(subcategoriesForCategory('fitness')[0].id)
        f.requests[4].respond(response('sport-result', { intent: { cityCode: '68134', subcategory: subcategoriesForCategory('fitness')[0].id } })); await f.settle(); f.frames()
        assert.deepEqual(f.focused, ['businesses'])
      }
    } finally { f.close() }
  }
})

test('direct typing has no hidden introductory filter, but explicit category choices retain their scope', async () => {
  for (const explicit of [false, true]) {
    const f = fixture()
    try {
      if (explicit) {
        await f.ready()
      } else {
        f.entry()
      }
      f.edit('боядисване'); f.submit()
      assert.equal(f.requests.at(-1).body.category, explicit ? 'hair' : undefined)
      assert.equal(f.requests.at(-1).body.query, 'боядисване')
      assert.equal(f.grid().props.category, explicit ? 'hair' : '')
    } finally { f.close() }
  }
})

test('inline facets replace the previous category context and ignore non-positive or other-parent choices', async () => {
  const f = fixture()
  try {
    f.chooseCategory('hair'); f.entry()
    const children = subcategoriesForCategory('hair').slice(0, 4).map(child => ({ ...child, count: 1 }))
    const other = { ...subcategoriesForCategory('nails')[0], count: 4 }
    f.requests[0].respond(response('hair-business', { subcategoryOptions: [...children, other, { ...children[0], count: 0 }] })); await f.settle()
    assert.deepEqual(f.children().props.options, children)
    assert.ok(f.control('DiscoveryHomeBusinesses'))
    assert.deepEqual(f.focused, ['subcategories'])
    f.chooseCategory('fitness')
    assert.equal(f.requests[1].body.category, 'fitness')
    assert.equal(f.grid().props.category, 'fitness')
    assert.deepEqual(f.children().props.options, [])
  } finally { f.close() }
})

test('an explicitly retained in-memory consented point starts nearby browse immediately, without a new permission prompt', async () => {
  const f = fixture({}, { request: { query: '', cityCode: '56784', coordinates: locatedPoint(), neighborhood: 'Стар квартал' } })
  try {
    f.entry(); assert.equal(f.permission.length, 0)
    assert.deepEqual(f.requests[0].body.coordinates, point)
    assert.equal(f.requests[0].body.cityCode, undefined); assert.equal(f.requests[0].body.neighborhood, undefined)
    assert.equal(f.location().props['aria-pressed'], true); assert.equal(f.clears(), 1)
  } finally { f.close() }
})

test('initial inline URL browsing reuses a fresh consented point without widening its radius or prompting again', () => {
  const f = fixture({}, { request: { query: '', coordinates: locatedPoint(), radiusKm: 3 } }, { initialUrl: '/?category=fitness&radius=3&discover=closed' })
  try {
    f.entry()
    assert.equal(f.requests.length, 1)
    assert.deepEqual(f.requests[0].body.coordinates, point)
    assert.equal(f.requests[0].body.radiusKm, 3)
    assert.equal(f.requests[0].body.expandNearby, undefined)
    assert.equal(f.requests[0].body.category, 'fitness')
    assert.equal(f.permission.length, 0)
    assert.doesNotMatch(f.url(), /latitude|longitude|coordinates|42\.66|23\.28/u)
  } finally { f.close() }
})

test('a malformed or nonconsented memory draft cannot become a visitor location', () => {
  for (const coordinates of [{ ...point, consent: false }, { latitude: 0, longitude: 0, consent: true }, { latitude: '42', longitude: 23, consent: true }]) {
    const f = fixture({}, { request: { query: '', coordinates } })
    try { f.entry(); assert.equal(f.requests[0].body.coordinates, undefined); assert.equal(f.requests[0].body.cityCode, '68134'); assert.equal(f.permission.length, 0); assert.equal(f.location().props['aria-pressed'], false) } finally { f.close() }
  }
})

test('a stalled explicit permission leaves existing results and city controls usable; denial does not refetch the same city', async () => {
  const f = fixture()
  try {
    await f.ready(); const pending = f.toggle()
    assert.equal(f.permission.length, 1); assert.equal(f.query().props.disabled, false)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.loading, false)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'city-row')
    assert.equal(f.location().props['aria-busy'], true)
    f.permission[0].reject(Error('LOCATION_DENIED')); await pending; await f.settle()
    assert.equal(f.requests.length, 1); assert.equal(f.location().props['aria-pressed'], false)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'city-row')
  } finally { f.close() }
})

test('an explicit grant updates one authoritative request with actual coordinates only after consent', async () => {
  const f = fixture()
  try {
    await f.ready(); const pending = f.toggle()
    assert.equal(f.requests.length, 1)
    f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
    assert.equal(f.requests.length, 2); assert.deepEqual(f.requests[1].body.coordinates, point)
    assert.equal(f.requests[1].body.cityCode, undefined); assert.equal(f.requests[1].body.expandNearby, true)
    f.requests[1].respond(response('nearby-row', { intent: { coordinates: point } })); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'nearby-row')
  } finally { f.close() }
})

test('typing and submitting a city search invalidates a pending location grant before it can override the query', async () => {
  const f = fixture()
  try {
    await f.ready(); const pending = f.toggle()
    f.edit('Маникюр в Пловдив'); f.submit()
    assert.equal(f.requests.length, 2); assert.equal(f.requests[1].body.cityCode, undefined)
    assert.equal(parseIntent(discoveryRequestSchema.parse(f.requests[1].body), DateTime.fromISO('2026-11-13T12:00:00Z')).cityCode, '56784')
    assert.equal(f.requests[1].body.coordinates, undefined)
    f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
    assert.equal(f.requests.length, 2); assert.equal(f.query().props.value, 'Маникюр в Пловдив')
    f.requests[1].respond(response('new-city-row', { intent: { cityCode: '56784' } })); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'new-city-row')
  } finally { f.close() }
})

test('a fresh exact-name result supplies the displayed city, without changing a manual city or reusing a stale result', async () => {
  const f = fixture()
  try {
    await f.ready()
    const openFilters = () => { elements(f.h.tree, node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog')[0].props.onClick({ currentTarget: {} }); f.h.flush() }
    const closeFilters = () => { f.control('DiscoveryFilterSheet').props.onClose(); f.h.flush() }
    f.edit('ПЪЗЕЛ · Борово'); f.debounce(); f.submit()
    assert.equal(f.requests[1].body.cityCode, undefined)
    f.requests[1].respond(response('sofia-branch', { intent: { cityCode: '68134' } })); await f.settle()
    openFilters()
    assert.equal(f.control('DiscoveryFilterSheet').props.initialValues.cityCode, '68134', 'use the server-resolved real branch city, not the town word in its name')
    closeFilters()
    f.edit('Маникюр в Пловдив'); f.debounce(); openFilters()
    assert.equal(f.control('DiscoveryFilterSheet').props.initialValues.cityCode, '56784', 'editing the query must not reuse the previous result city')
    closeFilters()
    f.filters({ cityCode: '68134', neighborhood: '', category: '', radiusKm: 2 })
    assert.equal(f.requests[2].body.cityCode, '68134')
    f.requests[2].respond(response('sofia-manual', { intent: { cityCode: '56784' } })); await f.settle()
    openFilters()
    assert.equal(f.control('DiscoveryFilterSheet').props.initialValues.cityCode, '68134', 'manual city remains authoritative even with a conflicting response')
  } finally { f.close() }
})

test('category and explicit city/quarter filter changes defeat late grants and keep the exact requested context', async () => {
  for (const change of ['category', 'filter']) {
    const f = fixture()
    try {
      await f.ready(); const pending = f.toggle()
      if (change === 'category') f.category('nails')
      else f.filters({ cityCode: '56784', neighborhood: 'Център', category: 'nails', radiusKm: 1 })
      assert.equal(f.requests.length, 2); assert.equal(f.requests[1].body.category, 'nails')
      if (change === 'filter') { assert.equal(f.requests[1].body.cityCode, '56784'); assert.equal(f.requests[1].body.neighborhood, 'Център'); assert.equal(f.requests[1].body.radiusKm, 1) }
      f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
      assert.equal(f.requests.length, 2); assert.equal(f.location().props['aria-busy'], false)
      assert.equal(f.requests[1].body.coordinates, undefined)
    } finally { f.close() }
  }
})

test('turning nearby off and unmounting ignore pending grants, without storing or guessing client coordinates', async () => {
  const f = fixture()
  try {
    await f.ready(); const pending = f.toggle(); await f.toggle()
    assert.equal(f.location().props['aria-pressed'], false)
    f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
    assert.ok(f.requests.every(row => !row.body.coordinates))
  } finally { f.close() }
  const second = fixture(); await second.ready(); const pending = second.toggle(); second.close()
  second.permission[0].resolve(locatedPoint()); await pending; await second.settle()
  assert.equal(second.requests.length, 1)
})

test('home suppresses only the redundant directory read; non-home and explicit previews keep their old fallback boundary', async () => {
  const browse = await readFile(new URL('../components/discovery-home-browse.js', import.meta.url), 'utf8')
  assert.match(browse, /directoryEnabled = true/)
  assert.match(browse, /useDirectory\(preview \? data \|\| noDirectory : directoryEnabled \? null : noDirectory\)/)
  const f = fixture({ home: false })
  try { f.entry(); assert.equal(f.requests.length, 0); assert.equal(f.control('DiscoveryHomeBusinesses').props.directoryEnabled, true) } finally { f.close() }
})

test('an expired in-memory point starts city browsing without prompting or submitting old coordinates', () => {
  const f = fixture({}, { request: { query: '', cityCode: '56784', coordinates: { ...locatedPoint(), observedAt: Date.now() - 300001 } } })
  try {
    f.entry()
    assert.equal(f.permission.length, 0)
    assert.equal(f.requests[0].body.coordinates, undefined)
    assert.equal(f.requests[0].body.cityCode, '56784')
    assert.equal(f.location().props['aria-pressed'], false)
  } finally { f.close() }
})

test('foreground expiry clears nearby results and starts a city request, never another permission request', async () => {
  const realNow = Date.now
  let clock = realNow()
  Date.now = () => clock
  const f = fixture()
  try {
    await f.ready(); const pending = f.toggle()
    f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
    f.requests[1].respond(response('nearby-row', { intent: { coordinates: point } })); await f.settle()
    assert.deepEqual(f.control('DiscoveryHomeBusinesses').props.filters.coordinates, point, 'render uses the accepted request origin, not local metadata')
    const focusedBeforeExpiry = f.focused.length
    clock += 300001; f.focus()
    assert.equal(f.permission.length, 1)
    assert.equal(f.location().props['aria-pressed'], false)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result, null)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.filters.coordinates, null)
    assert.equal(f.requests.length, 3); assert.equal(f.requests[2].body.coordinates, undefined)
    assert.equal(f.requests[2].body.cityCode, '68134')
    f.requests[2].respond(response('quiet-city-fallback')); await f.settle()
    assert.equal(f.focused.length, focusedBeforeExpiry, 'background expiry does not scroll or move focus')
  } finally { f.close(); Date.now = realNow }
})

test('a compact control expires its point without a second navigation or permission prompt', async () => {
  const realNow = Date.now
  let clock = realNow()
  Date.now = () => clock
  const f = fixture({ compact: true })
  try {
    const pending = f.toggle(); f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
    assert.equal(f.navigations.length, 1)
    clock += 300001; f.focus()
    assert.equal(f.navigations.length, 1)
    assert.equal(f.permission.length, 1)
    assert.equal(f.location().props['aria-pressed'], false)
    assert.equal(f.requests.length, 0)
  } finally { f.close(); Date.now = realNow }
})

test('a mismatched response origin cannot be displayed as the granted device position', async () => {
  const f = fixture()
  try {
    await f.ready(); const pending = f.toggle()
    f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
    f.requests[1].respond(response('wrong-origin', { intent: { coordinates: { ...point, latitude: point.latitude + .01 } } })); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result, null)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.error, 'SEARCH_UNAVAILABLE')
  } finally { f.close() }
})

test('editing a new city cannot relabel accepted city-centre distances, including a reply using the request city fallback', async () => {
  for (const intent of [{ cityCode: '68134' }, {}]) {
    const f = fixture()
    try {
      f.category('hair'); f.entry(); f.requests[0].respond(response('accepted-sofia', { intent })); await f.settle()
      f.edit('маникюр в Пловдив'); f.settleQuery()
      const rendered = f.control('DiscoveryHomeBusinesses').props
      assert.equal(f.query().props.value, 'маникюр в Пловдив')
      assert.equal(rendered.result.results[0].id, 'accepted-sofia')
      assert.equal(rendered.filters.cityCode, '68134')
      assert.equal(rendered.filters.coordinates, null)
      assert.equal(f.requests.length, 1, 'editing does not silently execute a different-city request')
    } finally { f.close() }
  }
})

test('superseded success/error/finally paths cannot replace a newer request or dismiss its loading state', async () => {
  for (const failure of [false, true]) {
    const f = fixture()
    try {
      await f.ready(); f.category('hair'); f.category('nails')
      assert.equal(f.requests.length, 3)
      if (failure) f.requests[1].reject(Error('RATE_LIMITED'))
      else f.requests[1].respond(response('obsolete-hair'))
      await f.settle()
      assert.equal(f.control('DiscoveryHomeBusinesses').props.loading, true)
      assert.equal(f.control('DiscoveryHomeBusinesses').props.error, '')
      assert.equal(f.control('DiscoveryHomeBusinesses').props.result, null)
      f.requests[2].respond(response('current-nails')); await f.settle()
      assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'current-nails')
    } finally { f.close() }
  }
})

test('an identical in-flight request stays deduplicated while a different context can supersede it', async () => {
  const f = fixture()
  try {
    await f.ready(); f.category('nails'); f.clearService()
    assert.equal(f.requests.length, 2)
    assert.equal(f.requests[1].init.signal.aborted, false)
    f.category('fitness')
    assert.equal(f.requests.length, 3)
    assert.equal(f.requests[1].init.signal.aborted, true)
    f.requests[2].respond(response('current-nails')); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'current-nails')
  } finally { f.close() }
})

test('a late city page cannot append cards after the accepted device-origin request', async () => {
  const f = fixture()
  try {
    f.category('hair'); f.entry(); f.requests[0].respond(response('city-first', { cataloguePage: { offset: 0, total: 2, nextOffset: 1 } })); await f.settle()
    const page = f.control('DiscoveryHomeBusinesses').props.onLoadMore(); f.h.flush()
    const pending = f.toggle(); f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
    f.requests[2].respond(response('nearby-only', { intent: { coordinates: point } })); await f.settle()
    f.requests[1].respond(response('late-city-page', { cataloguePage: { offset: 1, total: 2, nextOffset: null } })); await page; await f.settle()
    assert.deepEqual(f.control('DiscoveryHomeBusinesses').props.result.results.map(row => row.id), ['nearby-only'])
    assert.deepEqual(f.control('DiscoveryHomeBusinesses').props.filters.coordinates, point)
  } finally { f.close() }
})

test('suspended expiry timers cannot submit stale pagination coordinates or accept a page that expires in flight', async () => {
  for (const expireBeforeRequest of [true, false]) {
    const realNow = Date.now
    let clock = realNow()
    Date.now = () => clock
    const f = fixture()
    try {
      await f.ready(); const pending = f.toggle()
      f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
      const intent = { coordinates: point }
      f.requests[1].respond(response('nearby-first', { intent, cataloguePage: { offset: 0, total: 2, nextOffset: 1 } })); await f.settle()
      if (expireBeforeRequest) clock += 300001
      const page = f.control('DiscoveryHomeBusinesses').props.onLoadMore(); f.h.flush()
      if (!expireBeforeRequest) {
        assert.deepEqual(f.requests[2].body.coordinates, point)
        clock += 300001
        f.requests[2].respond(response('expired-nearby-page', { intent, cataloguePage: { offset: 1, total: 2, nextOffset: null } }))
      }
      await page; await f.settle()
      const fallback = f.requests.at(-1)
      assert.equal(fallback.body.coordinates, undefined)
      assert.equal(fallback.body.catalogueOffset, undefined)
      assert.equal(fallback.body.cityCode, '68134')
      assert.equal(f.control('DiscoveryHomeBusinesses').props.result, null)
      assert.equal(f.control('DiscoveryHomeBusinesses').props.filters.coordinates, null)
      assert.equal(f.permission.length, 1, 'no timer/focus or background permission prompt was needed')
      if (expireBeforeRequest) assert.equal(f.requests.length, 3, 'only a city fallback, never a stale page POST')
    } finally { f.close(); Date.now = realNow }
  }
})

test('business autocomplete selections open the canonical native or catalogue profile without a booking request', () => {
  const f = fixture({ compact: true })
  try {
    for (const href of ['/book/qa-partner?lang=bg', '/businesses/catalogue/sofia-qa-external?lang=bg']) {
      f.control('DiscoveryAutocomplete').props.onSelect({ kind: 'business', href }); f.h.flush()
      assert.equal(f.navigations.at(-1), href)
    }
    assert.equal(f.requests.length, 0); assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('service and category autocomplete actions retain real locality and use existing complete discovery requests', async () => {
  const f = fixture()
  try {
    await f.ready(); f.category('hair')
    f.control('DiscoveryAutocomplete').props.onSelect({ kind: 'service', query: 'Маникюр', cityCode: '68134', neighborhood: 'Манастирски ливади' }); f.h.flush()
    assert.deepEqual(f.requests.at(-1).body, { query: 'Маникюр', locale: 'bg', radiusKm: 2, cityCode: '68134', neighborhood: 'Манастирски ливади' })
    assert.equal(f.requests.at(-2).init.signal.aborted, true)
    f.control('DiscoveryAutocomplete').props.onSelect({ kind: 'category', category: 'nails', label: 'Маникюр', cityCode: '68134', neighborhood: 'Люлин' }); f.h.flush()
    assert.deepEqual(f.requests.at(-1).body, { query: '', locale: 'bg', radiusKm: 2, browse: true, category: 'nails', cityCode: '68134', neighborhood: 'Люлин' })
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('nearby service autocomplete keeps the consented origin and typed quarter without requesting another location', async () => {
  const f = fixture()
  try {
    await f.ready(); const pending = f.toggle(); f.permission[0].resolve(locatedPoint()); await pending; await f.settle()
    f.control('DiscoveryAutocomplete').props.onSelect({ kind: 'service', query: 'Маникюр', cityCode: '68134', neighborhood: 'Манастирски ливади' }); f.h.flush()
    assert.equal(f.requests.at(-1).body.query, 'Маникюр Манастирски ливади')
    assert.deepEqual(f.requests.at(-1).body.coordinates, point)
    assert.equal(f.requests.at(-1).body.cityCode, undefined)
    assert.equal(f.permission.length, 1)
  } finally { f.close() }
})

test('compact autocomplete uses the existing in-memory discovery draft and never prefetches bookings', () => {
  const f = fixture({ compact: true })
  try {
    f.control('DiscoveryAutocomplete').props.onSelect({ kind: 'service', query: 'Маникюр', cityCode: '68134', neighborhood: 'Манастирски ливади' }); f.h.flush()
    assert.deepEqual(f.drafts.at(-1).request, { query: 'Маникюр', locale: 'bg', radiusKm: 2, cityCode: '68134', neighborhood: 'Манастирски ливади' })
    assert.equal(f.navigations.at(-1), '/search?lang=bg')
    assert.equal(f.requests.length, 0); assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('photographic child choices preserve browse/location and navigate from committed children to the first result', async () => {
  const f = fixture()
  const options = subcategoriesForCategory('fitness').map(item => ({ ...item, count: 1 }))
  const intent = { cityCode: '68134', category: 'fitness' }
  try {
    await f.ready(); f.chooseCategory('fitness')
    f.requests[1].respond(response('sports-parent', { intent, subcategoryOptions: options })); await f.settle()
    assert.equal(f.children().props.options.length, options.length)
    assert.deepEqual(f.focused, ['subcategories'], 'choosing a category reveals its children, not the business list')
    f.focused.length = 0
    assert.ok(f.control('DiscoveryHomeBusinesses'))
    f.subcategory('fitness-folk-dance')
    assert.deepEqual(f.requests[2].body, { query: '', locale: 'bg', radiusKm: 2, browse: true, category: 'fitness', subcategory: 'fitness-folk-dance', cityCode: '68134' })
    assert.equal(f.summary().props.subcategory, 'fitness-folk-dance')
    assert.equal(f.children().props.options.length, options.length, 'child loading does not hide the accepted parent choices')
    f.requests[2].respond(response('folk-only', { intent: { ...intent, subcategory: 'fitness-folk-dance' }, subcategoryOptions: options })); await f.settle()
    assert.deepEqual(f.focused, ['businesses'])
    f.subcategory('')
    assert.equal(f.requests[3].body.subcategory, undefined)
    assert.equal(f.requests[3].body.category, 'fitness')
    assert.equal(f.requests[3].body.browse, true)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('child filters survive a same-parent location change, but typed text and a new parent clear them', async () => {
  const f = fixture()
  try {
    await f.ready(); f.category('fitness'); f.subcategory('fitness-yoga')
    f.filters({ cityCode: '56784', neighborhood: 'Център', category: 'fitness', radiusKm: 5 })
    assert.equal(f.requests.at(-1).body.subcategory, 'fitness-yoga')
    assert.equal(f.requests.at(-1).body.cityCode, '56784')
    assert.equal(f.requests.at(-1).body.neighborhood, 'Център')
    assert.equal(f.requests.at(-1).body.radiusKm, 5)
    f.edit('народни танци')
    assert.equal(f.summary().props.subcategory, '')
    assert.deepEqual(f.children().props.options, [])
    f.subcategory('fitness-yoga'); f.category('nails')
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.requests.at(-1).body.subcategory, undefined)
    assert.equal(f.requests.at(-1).body.category, 'nails')
    assert.equal(f.requests.at(-1).body.cityCode, '56784')
  } finally { f.close() }
})

test('late or mismatched child responses cannot overwrite the current parent facets or display wrong booking context', async () => {
  const f = fixture()
  const sports = subcategoriesForCategory('fitness').map(item => ({ ...item, count: 1 }))
  const nails = subcategoriesForCategory('nails').map(item => ({ ...item, count: 1 }))
  try {
    await f.ready(); f.category('fitness'); f.subcategory('fitness-folk-dance')
    f.requests[2].respond(response('wrong-child', { intent: { cityCode: '68134', category: 'fitness', subcategory: 'fitness-yoga' }, subcategoryOptions: sports })); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result, null)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.error, 'SEARCH_UNAVAILABLE')
    f.category('nails')
    f.requests[3].respond(response('current-nails', { intent: { cityCode: '68134', category: 'nails' }, subcategoryOptions: nails })); await f.settle()
    f.requests[1].respond(response('late-sports', { intent: { cityCode: '68134', category: 'fitness' }, subcategoryOptions: sports })); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'current-nails')
    assert.ok(f.children().props.options.every(item => item.category === 'nails'))
  } finally { f.close() }
})

test('a direct typed search supersedes the automatic all-category browse without choosing a category', async () => {
  const f = fixture()
  try {
    f.entry(); f.edit('педикюр в Борово'); f.submit()
    assert.equal(f.grid().props.category, '')
    assert.equal(f.requests.length, 2)
    assert.equal(f.requests[0].init.signal.aborted, true)
    assert.equal(f.requests[1].body.query, 'педикюр в Борово')
    assert.equal(f.requests[1].body.category, undefined)
    assert.equal(f.permission.length, 0)
    f.requests[1].respond(response('direct-service')); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'direct-service')
    assert.equal(f.query().props.value, 'педикюр в Борово')
  } finally { f.close() }
})

test('clearing a service during parent loading reuses the identical request and retains deliberate result focus', async () => {
  const f = fixture()
  try {
    f.chooseCategory('nails'); f.entry()
    f.clearService()
    assert.equal(f.requests.length, 1, 'the identical parent/All request is deduplicated')
    assert.equal(f.control('DiscoveryHomeBusinesses').props.loading, true)
    assert.deepEqual(f.focused, [])
    f.requests[0].respond(response('all-nails')); await f.settle()
    assert.deepEqual(f.focused, ['businesses'])
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'all-nails')
  } finally { f.close() }
})

test('clearing the category cancels its pending result and late success cannot restore obsolete filters or move focus', async () => {
  const f = fixture({}, null, { manualFrames: true })
  try {
    f.chooseCategory('nails'); f.entry()
    assert.equal(f.requests.length, 1)
    f.clearCategory()
    assert.equal(f.requests[0].init.signal.aborted, true)
    f.requests[0].respond(response('obsolete-parent')); await f.settle(); f.frames()
    assert.equal(f.grid().props.category, '')
    assert.equal(f.children(), undefined)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.loading, true)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result, null)
    assert.deepEqual(f.focused, [])
    assert.equal(f.analytics.length, 0, 'a cancelled category fetch is not recorded as a successful search/booking')
    assert.equal(f.requests.length, 2)
    assert.equal(f.requests[1].body.category, undefined)
    f.requests[1].respond(response('all-category-current')); await f.settle(); f.frames()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'all-category-current')
    assert.deepEqual(f.focused, ['businesses'])
  } finally { f.close() }
})

test('a valid category/child direct URL restores the actual locale, area and radius without prompting location', async () => {
  const f = fixture({ locale: 'en' }, null, { initialUrl: '/?lang=en&case=portrait&category=fitness&subcategory=fitness-folk-dance&city=56784&neighborhood=Тракия&radius=5' })
  try {
    f.entry()
    assert.equal(f.grid().props.category, 'fitness')
    assert.equal(f.summary().props.subcategory, 'fitness-folk-dance')
    assert.deepEqual(f.requests[0].body, { query: '', locale: 'en', radiusKm: 5, browse: true, category: 'fitness', subcategory: 'fitness-folk-dance', cityCode: '56784', neighborhood: 'Тракия' })
    assert.equal(f.permission.length, 0)
    assert.equal(f.historyCalls.length, 0, 'restoration does not push a duplicate history entry')
    f.requests[0].respond(response('linked-folk', { intent: { cityCode: '56784', neighborhood: 'Тракия', category: 'fitness', subcategory: 'fitness-folk-dance' } })); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'linked-folk')
    assert.deepEqual(f.focused, [], 'refresh does not unexpectedly jump past the restored summary')
  } finally { f.close() }
})

test('changing categories clears incompatible child state and returning to the same category remembers its valid choice', async () => {
  const f = fixture()
  const sports = subcategoriesForCategory('fitness').map(item => ({ ...item, count: 1 }))
  const nails = subcategoriesForCategory('nails').map(item => ({ ...item, count: 1 }))
  try {
    f.chooseCategory('fitness'); f.entry()
    f.requests[0].respond(response('sports-parent', { subcategoryOptions: sports })); await f.settle()
    f.subcategory('fitness-yoga')
    f.requests[1].respond(response('yoga', { intent: { cityCode: '68134', category: 'fitness', subcategory: 'fitness-yoga' }, subcategoryOptions: sports })); await f.settle()
    f.chooseCategory('nails')
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.requests[2].body.subcategory, undefined)
    assert.deepEqual(f.children().props.options, [], 'old sports facets cannot appear under nails')
    f.requests[2].respond(response('nails-parent', { subcategoryOptions: nails })); await f.settle()
    f.chooseCategory('fitness')
    assert.equal(f.summary().props.subcategory, 'fitness-yoga')
    assert.equal(f.requests[3].body.subcategory, 'fitness-yoga', 'restored child state and the actual result request must agree')
    assert.equal(new URL(f.url()).searchParams.get('subcategory'), 'fitness-yoga')
    f.requests[3].respond(response('fresh-sports', { intent: { cityCode: '68134', subcategory: 'fitness-yoga' }, subcategoryOptions: sports })); await f.settle()
    assert.ok(f.children().props.options.every(item => item.category === 'fitness'))
  } finally { f.close() }
})

test('browser Back and Forward restore category and child filters and abort superseded results without adding new history', async () => {
  const f = fixture()
  const options = subcategoriesForCategory('fitness').map(item => ({ ...item, count: 1 }))
  try {
    f.chooseCategory('fitness'); f.entry()
    f.requests[0].respond(response('parent', { subcategoryOptions: options })); await f.settle()
    f.subcategory('fitness-yoga')
    f.requests[1].respond(response('yoga', { intent: { cityCode: '68134', subcategory: 'fitness-yoga' }, subcategoryOptions: options })); await f.settle()
    const pushes = f.historyCalls.length
    f.back()
    assert.equal(f.grid().props.category, 'fitness')
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.requests[2].body.subcategory, undefined)
    f.back()
    assert.equal(f.grid().props.category, '')
    assert.equal(f.requests[2].init.signal.aborted, true)
    f.requests[2].respond(response('obsolete-parent')); await f.settle()
    assert.ok(f.control('DiscoveryHomeBusinesses'))
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result, null)
    assert.equal(f.requests.at(-1).body.category, undefined)
    f.forward()
    assert.equal(f.grid().props.category, 'fitness')
    assert.equal(f.summary().props.subcategory, '')
    f.forward()
    assert.equal(f.summary().props.subcategory, 'fitness-yoga')
    assert.equal(f.requests.at(-1).body.subcategory, 'fitness-yoga')
    assert.equal(f.historyCalls.length, pushes)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('Next URL-context restoration changes filters without depending on a component popstate listener', async () => {
  const f = fixture()
  const options = subcategoriesForCategory('fitness').map(item => ({ ...item, count: 1 }))
  try {
    f.chooseCategory('fitness'); f.entry()
    assert.equal(f.requests.length, 1, 'the local history write does not duplicate the parent fetch')
    const parentUrl = f.url()
    f.requests[0].respond(response('parent', { subcategoryOptions: options })); await f.settle()
    f.subcategory('fitness-yoga')
    assert.equal(f.requests.length, 2, 'the local results URL does not refetch its own action')
    const pushes = f.historyCalls.length
    f.restoreUrlContext(parentUrl)
    assert.equal(f.grid().props.category, 'fitness')
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.requests[1].init.signal.aborted, true)
    assert.equal(f.requests.length, 3)
    assert.equal(f.requests[2].body.category, 'fitness')
    assert.equal(f.requests[2].body.subcategory, undefined)
    f.requests[1].respond(response('late-yoga')); await f.settle()
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result, null)
    f.restoreUrlContext('/?lang=bg')
    assert.equal(f.grid().props.category, '')
    assert.equal(f.children(), undefined)
    assert.equal(f.requests[2].init.signal.aborted, true)
    assert.equal(f.historyCalls.length, pushes)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('unrelated Next URL context and obsolete disclosure stages preserve unsubmitted text and current filters', () => {
  const f = fixture()
  try {
    f.entry(); f.edit('урок по пиано')
    f.restoreUrlContext('/?lang=en&case=long-label')
    assert.equal(f.query().props.value, 'урок по пиано')
    assert.equal(f.grid().props.category, '')
    assert.equal(f.requests.length, 1)
    f.edit('урок по цигулка')
    const changedLocale = new URL(f.url())
    changedLocale.searchParams.set('lang', 'bg'); changedLocale.searchParams.set('case', 'another'); changedLocale.searchParams.set('discover', 'services')
    f.restoreUrlContext(changedLocale.href)
    assert.equal(f.query().props.value, 'урок по цигулка')
    assert.equal(f.grid().props.category, '')
    assert.equal(f.requests.length, 1)
  } finally { f.close() }
})

test('inline selections keep visible typed text as a real constraint and never expand the selected nearby radius', async () => {
  const f = fixture({}, { request: { query: 'индивидуален урок', coordinates: locatedPoint(), radiusKm: 2 } })
  try {
    f.entry()
    f.requests[0].respond(response('initial-nearby', { intent: { coordinates: point } })); await f.settle()
    f.chooseCategory('education')
    assert.equal(f.query().props.value, 'индивидуален урок')
    assert.equal(f.requests[1].body.query, 'индивидуален урок')
    assert.equal(f.requests[1].body.category, 'education')
    assert.equal(f.requests[1].body.radiusKm, 2)
    assert.equal(f.requests[1].body.expandNearby, undefined)
    assert.deepEqual(f.requests[1].body.coordinates, point)
    assert.doesNotMatch(f.url(), /latitude|longitude|coordinates|42\.66|23\.28/u)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('filter navigation records the same city, quarter and radius as its actual submitted request', async () => {
  const f = fixture()
  try {
    await f.ready()
    f.filters({ cityCode: '56784', neighborhood: 'Тракия', category: 'nails', radiusKm: 5 })
    const current = guidedNavigation.readGuidedNavigation(new URL(f.url()).search)
    assert.equal(current.cityCode, '56784')
    assert.equal(current.cityWasChosen, true)
    assert.equal(current.neighborhood, 'Тракия')
    assert.equal(current.radiusKm, 5)
    assert.equal(current.category, f.requests.at(-1).body.category)
    assert.equal(current.query, f.query().props.value)
  } finally { f.close() }
})

test('autocomplete navigation records its newly selected area rather than the previous form closure', async () => {
  const f = fixture()
  try {
    f.entry()
    f.control('DiscoveryAutocomplete').props.onSelect({ kind: 'service', query: 'Маникюр', cityCode: '56784', neighborhood: 'Тракия' }); f.h.flush()
    const current = guidedNavigation.readGuidedNavigation(new URL(f.url()).search)
    assert.equal(current.cityCode, '56784')
    assert.equal(current.neighborhood, 'Тракия')
    assert.equal(current.cityWasChosen, true)
    assert.equal(current.query, 'Маникюр')
    assert.equal(current.category, '')
    assert.equal(f.requests.at(-1).body.cityCode, current.cityCode)
    assert.equal(f.requests.at(-1).body.neighborhood, current.neighborhood)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('inline components stay in category, active children, summary, results order with no disclosure gate', () => {
  const f = fixture()
  const participating = new Map(['InlineCategoryGrid', 'DiscoverySubcategories', 'InlineDiscoverySummary', 'DiscoveryHomeBusinesses'].map(name => [controls[name], name]))
  const order = () => elements(f.h.tree, node => participating.has(node.type)).map(node => participating.get(node.type))
  try {
    assert.deepEqual(order(), ['InlineCategoryGrid', 'InlineDiscoverySummary', 'DiscoveryHomeBusinesses'])
    f.chooseCategory('fitness')
    assert.deepEqual(order(), ['InlineCategoryGrid', 'DiscoverySubcategories', 'InlineDiscoverySummary', 'DiscoveryHomeBusinesses'])
    assert.equal(f.children().props.inline, true)
    assert.equal(f.children().props.onClearCategory, f.summary().props.onClearCategory)
    f.clearCategory()
    assert.deepEqual(order(), ['InlineCategoryGrid', 'InlineDiscoverySummary', 'DiscoveryHomeBusinesses'])
  } finally { f.close() }
})

test('category tile toggles and removable chips navigate only to their committed next content', async () => {
  const f = fixture({}, null, { manualFrames: true })
  try {
    f.chooseCategory('fitness'); f.entry()
    f.requests[0].respond(response('fitness')); await f.settle(); f.frames()
    assert.deepEqual(f.focused, ['subcategories'])
    f.focused.length = 0
    f.chooseCategory('fitness')
    f.requests[1].respond(response('tile-cleared')); await f.settle(); f.frames()
    assert.equal(f.grid().props.category, '')
    assert.deepEqual(f.focused, ['businesses'], 'clearing the category reveals the committed all-category businesses')
    f.focused.length = 0
    f.chooseCategory('nails')
    f.requests[2].respond(response('nails')); await f.settle(); f.frames()
    assert.deepEqual(f.focused, ['subcategories'])
    f.focused.length = 0
    f.clearCategory()
    assert.equal(f.grid().props.category, '')
    assert.equal(f.children(), undefined)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.loading, true)
    assert.deepEqual(f.focused, [], 'do not focus a loading shell after the chip disappears')
    f.requests[3].respond(response('chip-cleared')); await f.settle()
    assert.deepEqual(f.focused, [], 'wait for the actual committed animation frame')
    f.frames()
    assert.deepEqual(f.focused, ['businesses'])
  } finally { f.close() }
})

test('repeating an inline category clears both levels while preserving typed query, city, quarter and radius', async () => {
  const f = fixture({}, {
    request: { query: 'йога за начинаещи', category: 'fitness', subcategory: 'fitness-yoga', cityCode: '56784', neighborhood: 'Тракия', radiusKm: 5 },
    cityWasChosen: true,
  })
  try {
    f.entry()
    f.requests[0].respond(response('initial-yoga', { intent: { cityCode: '56784', subcategory: 'fitness-yoga' } })); await f.settle()
    f.chooseCategory('fitness')
    assert.equal(f.grid().props.category, '')
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.children(), undefined)
    assert.deepEqual(f.requests.at(-1).body, { query: 'йога за начинаещи', locale: 'bg', radiusKm: 5, cityCode: '56784', neighborhood: 'Тракия' })
    assert.equal(f.query().props.value, 'йога за начинаещи')
    const cleared = guidedNavigation.readGuidedNavigation(new URL(f.url()).search)
    assert.equal(cleared.category, '')
    assert.equal(cleared.subcategory, '')
    assert.equal(cleared.stage, 'results')
    f.chooseCategory('fitness')
    assert.equal(f.summary().props.subcategory, 'fitness-yoga')
    assert.equal(f.requests.at(-1).body.subcategory, 'fitness-yoga')
    assert.equal(f.requests.at(-1).body.query, 'йога за начинаещи')
    assert.equal(f.requests.at(-1).body.cityCode, '56784')
    assert.equal(f.requests.at(-1).body.neighborhood, 'Тракия')
    assert.equal(f.requests.at(-1).body.radiusKm, 5)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('removing only a service keeps its parent and geography, and does not later resurrect the cleared child', async () => {
  const f = fixture({}, {
    request: { query: '', category: 'fitness', subcategory: 'fitness-yoga', cityCode: '56784', neighborhood: 'Тракия', radiusKm: 3 },
    cityWasChosen: true,
  })
  try {
    f.entry()
    f.clearService()
    assert.equal(f.grid().props.category, 'fitness')
    assert.equal(f.summary().props.subcategory, '')
    assert.deepEqual(f.requests.at(-1).body, { query: '', locale: 'bg', radiusKm: 3, browse: true, category: 'fitness', cityCode: '56784', neighborhood: 'Тракия' })
    f.chooseCategory('nails'); f.chooseCategory('fitness')
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.requests.at(-1).body.subcategory, undefined)
    assert.equal(f.requests.at(-1).body.category, 'fitness')
    const count = f.requests.length, historyCount = f.historyCalls.length
    f.subcategory(subcategoriesForCategory('nails')[0].id)
    assert.equal(f.requests.length, count, 'a stale other-parent child must not become an inline filter')
    assert.equal(f.historyCalls.length, historyCount)
    f.children().props.onClearCategory(); f.h.flush()
    assert.equal(f.grid().props.category, '')
    assert.equal(f.summary().props.subcategory, '')
  } finally { f.close() }
})

test('Forward restoration of a cleared service also clears category memory from the preceding Back snapshot', () => {
  const f = fixture()
  try {
    f.chooseCategory('fitness'); f.entry(); f.subcategory('fitness-yoga'); f.clearService()
    f.back()
    assert.equal(f.summary().props.subcategory, 'fitness-yoga')
    f.forward()
    assert.equal(f.summary().props.subcategory, '')
    f.chooseCategory('nails'); f.chooseCategory('fitness')
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.requests.at(-1).body.subcategory, undefined)
    assert.equal(f.requests.at(-1).body.category, 'fitness')
  } finally { f.close() }
})

test('empty-state change-service removes only the deepest selected level and change-area opens existing filters', async () => {
  const f = fixture({}, { request: { query: '', category: 'fitness', subcategory: 'fitness-yoga', cityCode: '68134', radiusKm: 5 } })
  try {
    f.entry()
    f.requests[0].respond(response('unused', { results: [], intent: { cityCode: '68134', subcategory: 'fitness-yoga' }, cataloguePage: { offset: 0, total: 0, nextOffset: null } })); await f.settle()
    f.control('DiscoveryHomeBusinesses').props.onChangeService(); f.h.flush()
    assert.equal(f.grid().props.category, 'fitness')
    assert.equal(f.summary().props.subcategory, '')
    assert.equal(f.requests.at(-1).body.category, 'fitness')
    assert.equal(f.requests.at(-1).body.subcategory, undefined)
    f.requests.at(-1).respond(response('unused', { results: [], cataloguePage: { offset: 0, total: 0, nextOffset: null } })); await f.settle()
    f.control('DiscoveryHomeBusinesses').props.onChangeService(); f.h.flush()
    assert.equal(f.grid().props.category, '')
    assert.equal(f.requests.at(-1).body.category, undefined)
    assert.equal(f.summary().props.onChangeArea, f.control('DiscoveryHomeBusinesses').props.onChangeArea)
    const trigger = {}
    f.summary().props.onChangeArea({ currentTarget: trigger }); f.h.flush()
    assert.equal(f.control('DiscoveryFilterSheet').props.triggerRef.current, trigger)
    assert.equal(f.control('DiscoveryFilterSheet').props.initialValues.radiusKm, 5)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('legacy disclosure URLs restore real category and child filters once without controlling inline visibility', () => {
  for (const stage of ['closed', 'categories', 'services', 'results']) {
    const initialUrl = `/?lang=en&category=fitness&subcategory=fitness-yoga&discover=${stage}`
    const f = fixture({ locale: 'en' }, null, { initialUrl })
    try {
      f.entry(); f.h.render(); f.h.flush(); f.entry()
      assert.equal(f.requests.length, 1)
      assert.equal(f.requests[0].body.category, 'fitness')
      assert.equal(f.requests[0].body.subcategory, 'fitness-yoga')
      assert.equal(f.grid().props.category, 'fitness')
      assert.equal(f.summary().props.subcategory, 'fitness-yoga')
      assert.ok(f.children()); assert.ok(f.control('DiscoveryHomeBusinesses'))
      f.edit('йога за начинаещи')
      f.restoreUrlContext(initialUrl.replace(`discover=${stage}`, `discover=${stage === 'closed' ? 'services' : 'closed'}`))
      assert.equal(f.query().props.value, 'йога за начинаещи')
      assert.equal(f.requests.length, 1, 'an obsolete stage change must not restore filters or repeat a search')
      assert.equal(f.historyCalls.length, 0)
    } finally { f.close() }
  }
  const empty = fixture({}, null, { initialUrl: '/?discover=closed' })
  try {
    empty.entry()
    assert.equal(empty.requests.length, 1)
    assert.equal(empty.requests[0].body.category, undefined)
    assert.equal(empty.requests[0].body.browse, true)
    assert.ok(empty.control('DiscoveryHomeBusinesses'))
  } finally { empty.close() }
})

test('URL context restored before the initial timer wins without a duplicate default browse', () => {
  const f = fixture()
  try {
    f.restoreUrlContext('/?category=fitness&subcategory=fitness-yoga&radius=5&discover=categories')
    f.entry()
    assert.equal(f.requests.length, 1)
    assert.equal(f.requests[0].body.category, 'fitness')
    assert.equal(f.requests[0].body.subcategory, 'fitness-yoga')
    assert.equal(f.requests[0].body.radiusKm, 5)
    assert.equal(f.historyCalls.length, 0)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('inline summary receives the identical accepted result metadata without fabricating totals or a page-only sort', async () => {
  const f = fixture()
  try {
    f.entry()
    const accepted = response('server-first', { results: [{ id: 'server-first', source: 'catalogue' }, { id: 'server-second', source: 'catalogue' }], cataloguePage: { offset: 0, total: 101, nextOffset: 2 } })
    f.requests[0].respond(accepted); await f.settle()
    assert.equal(f.summary().props.result, f.control('DiscoveryHomeBusinesses').props.result)
    assert.equal(f.summary().props.result.cataloguePage.total, 101)
    assert.deepEqual(f.summary().props.result.results.map(row => row.id), ['server-first', 'server-second'])
    assert.equal(f.summary().props.loading, false)
    assert.equal('sort' in f.requests[0].body, false)
  } finally { f.close() }
})
