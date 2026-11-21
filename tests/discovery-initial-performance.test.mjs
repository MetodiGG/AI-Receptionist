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
const controls = Object.fromEntries(['Icon', 'BrandMark', 'BrandLoading', 'DiscoveryRouteArt', 'BusinessCategoryIcon', 'DiscoveryHomeRail', 'DiscoveryHomeBusinesses', 'DiscoverySubcategories', 'GuidedServiceDiscovery', 'DiscoveryFilterSheet', 'DiscoveryAutocomplete'].map(name => [name, Object.defineProperty(() => null, 'name', { value: name })]))
function fixture(patch = {}, draft = null, { manualFrames = false, initialUrl } = {}) {
  const requests = [], permission = [], timers = new Map(), focused = [], navigations = [], drafts = [], listeners = new Map(), analytics = [], historyCalls = []
  let timerId = 0, clears = 0, notifyNavigation = () => {}
  let currentUrl = new URL(initialUrl || `/?lang=${patch.locale || 'bg'}`, 'https://www.gorez.co')
  const historyEntries = [currentUrl.href]; let historyIndex = 0
  const browser = {
    isSecureContext: true, matchMedia: () => ({ matches: true }),
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
    focusDiscoverySubcategories: () => { focused.push('subcategories'); return true },
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
    control: name => elements(h.tree, node => node.type === controls[name])[0],
    guide: () => elements(h.tree, node => node.type === controls.GuidedServiceDiscovery)[0],
    stage(value) { f.guide().props.onStage(value); h.flush() },
    chooseCategory(id) { f.guide().props.onCategory(id); h.flush() },
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
    // Async/search safety fixtures explicitly choose the parent and All.
    // The All row is actionable during parent loading; identical input is
    // deduplicated. Stage-specific interaction tests use chooseCategory().
    category(id) { f.chooseCategory(id); f.subcategory('') },
    subcategory(id) { f.guide().props.onService(id); h.flush() },
    filters(values) { elements(h.tree, node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog')[0].props.onClick({ currentTarget: {} }); h.flush(); f.control('DiscoveryFilterSheet').props.onApply(values); h.flush() },
    async settle() { for (let i = 0; i < 15; i++) { await Promise.resolve(); h.flush() } },
    async ready() {
      f.entry(); if (!requests.length) { f.stage('categories'); f.category('hair') }
      assert.equal(requests.length, 1); requests[0].respond(); await f.settle()
      // Establish an explicitly chosen result as the guard-test baseline.
      // Its successful focus is not a later action under test.
      if (manualFrames) f.frames()
      focused.length = 0
    },
    clears: () => clears,
    close: () => h.dispose(),
  }
  return f
}

test('a normal homepage is compact with no invented category, automatic search, location prompt or results', async () => {
  const f = fixture()
  try {
    assert.equal(f.control('DiscoveryHomeBusinesses'), undefined)
    assert.equal(f.guide().props.stage, 'closed')
    assert.equal(f.guide().props.category, '')
    assert.equal(f.guide().props.subcategory, '')
    assert.equal(f.guide().props.loading, false)
    f.entry()
    assert.equal(f.requests.length, 0); assert.equal(f.permission.length, 0)
    assert.equal(f.query().props.disabled, false); assert.equal(f.location().props['aria-pressed'], false)
    assert.equal(f.focused.length, 0); assert.equal(f.permission.length, 0)
    f.stage('categories')
    assert.equal(f.guide().props.stage, 'categories')
    assert.equal(f.control('DiscoveryHomeBusinesses'), undefined)
    assert.equal(f.requests.length, 0, 'opening choices does not execute a hidden search')
    assert.equal(f.analytics.length, 0, 'picker navigation is not a reservation, redirect or search event')
  } finally { f.close() }
})

test('category replaces the active panel immediately; choosing a child displays and focuses only its committed matches', async () => {
  for (const locale of ['bg', 'en']) {
    const f = fixture({ locale })
    try {
      f.entry(); f.stage('categories'); f.chooseCategory('hair')
      assert.equal(f.guide().props.stage, 'services')
      assert.equal(f.guide().props.category, 'hair')
      assert.equal(f.control('DiscoveryHomeBusinesses'), undefined, 'parent results stay out of the service selection panel')
      assert.deepEqual(f.focused, [])
      const child = subcategoriesForCategory('hair', locale)[0]
      f.requests[0].respond(response('hair-parent', { subcategoryOptions: [{ ...child, count: 1 }] })); await f.settle()
      assert.deepEqual(f.focused, [], 'the active picker owns its heading focus, not a background result shell')
      assert.ok(f.guide().props.navigationRef)
      assert.deepEqual(f.guide().props.options, [{ ...child, count: 1 }])
      f.h.render(); f.h.flush()
      assert.deepEqual(f.focused, [], 'ordinary re-renders do not scroll to background businesses')
      f.subcategory(child.id)
      assert.equal(f.guide().props.stage, 'results')
      assert.equal(f.requests[1].body.subcategory, child.id)
      assert.deepEqual(f.focused, [])
      f.requests[1].respond(response('child-first', { intent: { cityCode: '68134', subcategory: child.id } })); await f.settle()
      assert.deepEqual(f.focused, ['businesses'])
      assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'child-first')
    } finally { f.close() }
  }
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
    assert.deepEqual(f.focused, ['businesses'])
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'current-sport')
    f.category('hair'); f.edit('ново търсене')
    f.requests[3].respond(response('hair-after-typing')); await f.settle()
    assert.deepEqual(f.focused, ['businesses'], 'do not steal focus while the visitor is typing')
  } finally { f.close() }
})

test('category loading failures remain in the active service panel with retry feedback, not fabricated empty results', async () => {
  const f = fixture()
  try {
    await f.ready(); f.chooseCategory('nails')
    f.requests[1].respond({ error: { code: 'SEARCH_UNAVAILABLE' } }, 503); await f.settle()
    assert.deepEqual(f.focused, [])
    assert.equal(f.guide().props.stage, 'services')
    assert.equal(f.guide().props.error, 'SEARCH_UNAVAILABLE')
    assert.equal(f.control('DiscoveryHomeBusinesses'), undefined)
  } finally { f.close() }
})

test('a queued animation frame is cancelled by a newer request, typing or unmount before it can steal focus', async () => {
  for (const action of ['new-request', 'typing', 'unmount']) {
    const f = fixture({}, null, { manualFrames: true })
    try {
      await f.ready(); f.category('nails')
      f.requests[1].respond(response('nail-result')); await f.settle()
      assert.deepEqual(f.focused, [], 'the real next animation frame has not run yet')
      if (action === 'new-request') f.category('fitness')
      if (action === 'typing') f.edit('ново търсене')
      if (action === 'unmount') f.close()
      f.frames()
      assert.deepEqual(f.focused, [], action)
      if (action === 'new-request') {
        f.requests[2].respond(response('sport-result')); await f.settle(); f.frames()
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
      assert.equal(f.guide().props.category, explicit ? 'hair' : '')
    } finally { f.close() }
  }
})

test('category facets replace the previous context while only the service-selection panel is expanded', async () => {
  const f = fixture()
  try {
    f.entry(); f.stage('categories'); f.chooseCategory('hair')
    const children = subcategoriesForCategory('hair').slice(0, 4).map(child => ({ ...child, count: 1 }))
    f.requests[0].respond(response('hair-business', { subcategoryOptions: children })); await f.settle()
    assert.deepEqual(f.guide().props.options, children)
    assert.equal(f.control('DiscoveryHomeBusinesses'), undefined)
    assert.equal(f.guide().props.stage, 'services')
    assert.equal(f.focused.length, 0)
    f.chooseCategory('fitness')
    assert.equal(f.requests[1].body.category, 'fitness')
    assert.equal(f.guide().props.category, 'fitness')
    assert.deepEqual(f.guide().props.options, [])
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
      f.entry(); f.stage('categories'); f.category('hair'); f.requests[0].respond(response('accepted-sofia', { intent })); await f.settle()
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
    await f.ready(); f.category('hair'); f.category('hair')
    assert.equal(f.requests.length, 2)
    assert.equal(f.requests[1].init.signal.aborted, false)
    f.category('nails')
    assert.equal(f.requests.length, 3)
    assert.equal(f.requests[1].init.signal.aborted, true)
    f.requests[2].respond(response('current-nails')); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'current-nails')
  } finally { f.close() }
})

test('a late city page cannot append cards after the accepted device-origin request', async () => {
  const f = fixture()
  try {
    f.entry(); f.stage('categories'); f.category('hair'); f.requests[0].respond(response('city-first', { cataloguePage: { offset: 0, total: 2, nextOffset: 1 } })); await f.settle()
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
    assert.equal(f.guide().props.options.length, options.length)
    assert.deepEqual(f.focused, [], 'choosing a category reveals its children, not the business list')
    assert.equal(f.guide().props.stage, 'services')
    assert.equal(f.control('DiscoveryHomeBusinesses'), undefined)
    f.subcategory('fitness-folk-dance')
    assert.deepEqual(f.requests[2].body, { query: '', locale: 'bg', radiusKm: 2, browse: true, category: 'fitness', subcategory: 'fitness-folk-dance', cityCode: '68134' })
    assert.equal(f.guide().props.subcategory, 'fitness-folk-dance')
    assert.equal(f.guide().props.options.length, options.length, 'child loading does not hide the accepted parent choices')
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
    assert.equal(f.guide().props.subcategory, '')
    assert.deepEqual(f.guide().props.options, [])
    f.subcategory('fitness-yoga'); f.category('nails')
    assert.equal(f.guide().props.subcategory, '')
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
    assert.ok(f.guide().props.options.every(item => item.category === 'nails'))
  } finally { f.close() }
})

test('a direct search from the compact initial homepage remains usable without completing any guided step', async () => {
  const f = fixture()
  try {
    f.entry(); f.edit('педикюр в Борово'); f.submit()
    assert.equal(f.guide().props.stage, 'results')
    assert.equal(f.guide().props.category, '')
    assert.equal(f.requests.length, 1)
    assert.equal(f.requests[0].body.query, 'педикюр в Борово')
    assert.equal(f.requests[0].body.category, undefined)
    assert.equal(f.permission.length, 0)
    f.requests[0].respond(response('direct-service')); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'direct-service')
    assert.equal(f.query().props.value, 'педикюр в Борово')
  } finally { f.close() }
})

test('All services during parent loading reuses one request but retains the deliberate results focus', async () => {
  const f = fixture()
  try {
    f.entry(); f.stage('categories'); f.chooseCategory('nails')
    assert.equal(f.guide().props.stage, 'services')
    f.subcategory('')
    assert.equal(f.requests.length, 1, 'the identical parent/All request is deduplicated')
    assert.equal(f.guide().props.stage, 'results')
    assert.equal(f.control('DiscoveryHomeBusinesses').props.loading, true)
    assert.deepEqual(f.focused, [])
    f.requests[0].respond(response('all-nails')); await f.settle()
    assert.deepEqual(f.focused, ['businesses'])
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'all-nails')
  } finally { f.close() }
})

test('closing the picker cancels its pending result and a late success cannot reopen it or move focus', async () => {
  const f = fixture({}, null, { manualFrames: true })
  try {
    f.entry(); f.stage('categories'); f.chooseCategory('nails')
    assert.equal(f.requests.length, 1)
    f.stage('closed')
    assert.equal(f.requests[0].init.signal.aborted, true)
    f.requests[0].respond(response('obsolete-parent')); await f.settle(); f.frames()
    assert.equal(f.guide().props.stage, 'closed')
    assert.equal(f.guide().props.loading, false)
    assert.equal(f.control('DiscoveryHomeBusinesses'), undefined)
    assert.deepEqual(f.focused, [])
    assert.equal(f.analytics.length, 0, 'a cancelled picker fetch is not recorded as a successful search/booking')
    f.stage('categories')
    assert.equal(f.guide().props.stage, 'categories')
    assert.equal(f.requests.length, 1, 'reopening category choices makes no additional request')
  } finally { f.close() }
})

test('a valid category/child direct URL restores the actual locale, area and radius without prompting location', async () => {
  const f = fixture({ locale: 'en' }, null, { initialUrl: '/?lang=en&case=portrait&category=fitness&subcategory=fitness-folk-dance&city=56784&neighborhood=Тракия&radius=5' })
  try {
    f.entry()
    assert.equal(f.guide().props.stage, 'results')
    assert.equal(f.guide().props.category, 'fitness')
    assert.equal(f.guide().props.subcategory, 'fitness-folk-dance')
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
    f.entry(); f.stage('categories'); f.chooseCategory('fitness')
    f.requests[0].respond(response('sports-parent', { subcategoryOptions: sports })); await f.settle()
    f.subcategory('fitness-yoga')
    f.requests[1].respond(response('yoga', { intent: { cityCode: '68134', category: 'fitness', subcategory: 'fitness-yoga' }, subcategoryOptions: sports })); await f.settle()
    f.stage('categories'); f.chooseCategory('nails')
    assert.equal(f.guide().props.subcategory, '')
    assert.equal(f.requests[2].body.subcategory, undefined)
    assert.deepEqual(f.guide().props.options, [], 'old sports facets cannot appear under nails')
    f.requests[2].respond(response('nails-parent', { subcategoryOptions: nails })); await f.settle()
    f.stage('categories'); f.chooseCategory('fitness')
    assert.equal(f.guide().props.stage, 'services')
    assert.equal(f.guide().props.subcategory, 'fitness-yoga')
    assert.equal(f.requests[3].body.subcategory, undefined, 'facet refresh is still for the full parent scope')
    assert.equal(new URL(f.url()).searchParams.get('subcategory'), 'fitness-yoga')
    f.requests[3].respond(response('fresh-sports', { subcategoryOptions: sports })); await f.settle()
    assert.ok(f.guide().props.options.every(item => item.category === 'fitness'))
  } finally { f.close() }
})

test('browser Back and Forward restore each active step and abort superseded results without adding new history', async () => {
  const f = fixture()
  const options = subcategoriesForCategory('fitness').map(item => ({ ...item, count: 1 }))
  try {
    f.entry(); f.stage('categories'); f.chooseCategory('fitness')
    f.requests[0].respond(response('parent', { subcategoryOptions: options })); await f.settle()
    f.subcategory('fitness-yoga')
    f.requests[1].respond(response('yoga', { intent: { cityCode: '68134', subcategory: 'fitness-yoga' }, subcategoryOptions: options })); await f.settle()
    const pushes = f.historyCalls.length
    f.back()
    assert.equal(f.guide().props.stage, 'services')
    assert.equal(f.guide().props.category, 'fitness')
    assert.equal(f.guide().props.subcategory, '')
    assert.equal(f.requests[2].body.subcategory, undefined)
    f.back()
    assert.equal(f.guide().props.stage, 'categories')
    assert.equal(f.guide().props.category, '')
    assert.equal(f.requests[2].init.signal.aborted, true)
    f.requests[2].respond(response('obsolete-parent')); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses'), undefined)
    f.back()
    assert.equal(f.guide().props.stage, 'closed')
    f.forward()
    assert.equal(f.guide().props.stage, 'categories')
    f.forward()
    assert.equal(f.guide().props.stage, 'services')
    f.forward()
    assert.equal(f.guide().props.stage, 'results')
    assert.equal(f.guide().props.subcategory, 'fitness-yoga')
    assert.equal(f.requests.at(-1).body.subcategory, 'fitness-yoga')
    assert.equal(f.historyCalls.length, pushes)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('Next URL-context restoration changes the active step without depending on a component popstate listener', async () => {
  const f = fixture()
  const options = subcategoriesForCategory('fitness').map(item => ({ ...item, count: 1 }))
  try {
    f.entry(); f.stage('categories'); f.chooseCategory('fitness')
    assert.equal(f.requests.length, 1, 'the local history write does not duplicate the parent fetch')
    const servicesUrl = f.url()
    f.requests[0].respond(response('parent', { subcategoryOptions: options })); await f.settle()
    f.subcategory('fitness-yoga')
    assert.equal(f.requests.length, 2, 'the local results URL does not refetch its own action')
    const pushes = f.historyCalls.length
    f.restoreUrlContext(servicesUrl)
    assert.equal(f.guide().props.stage, 'services')
    assert.equal(f.guide().props.category, 'fitness')
    assert.equal(f.guide().props.subcategory, '')
    assert.equal(f.requests[1].init.signal.aborted, true)
    assert.equal(f.requests.length, 3)
    assert.equal(f.requests[2].body.category, 'fitness')
    assert.equal(f.requests[2].body.subcategory, undefined)
    f.requests[1].respond(response('late-yoga')); await f.settle()
    assert.equal(f.guide().props.stage, 'services')
    assert.equal(f.control('DiscoveryHomeBusinesses'), undefined)
    f.restoreUrlContext('/?lang=bg')
    assert.equal(f.guide().props.stage, 'closed')
    assert.equal(f.requests[2].init.signal.aborted, true)
    assert.equal(f.historyCalls.length, pushes)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})

test('unrelated Next URL context changes preserve unsubmitted search text and current guide state', () => {
  const f = fixture()
  try {
    f.entry(); f.edit('урок по пиано')
    f.restoreUrlContext('/?lang=en&case=long-label')
    assert.equal(f.query().props.value, 'урок по пиано')
    assert.equal(f.guide().props.stage, 'closed')
    assert.equal(f.requests.length, 0)
    f.stage('categories'); f.edit('урок по цигулка')
    const changedLocale = new URL(f.url())
    changedLocale.searchParams.set('lang', 'bg'); changedLocale.searchParams.set('case', 'another')
    f.restoreUrlContext(changedLocale.href)
    assert.equal(f.query().props.value, 'урок по цигулка')
    assert.equal(f.guide().props.stage, 'categories')
    assert.equal(f.requests.length, 0)
  } finally { f.close() }
})

test('guided selections keep the visible typed query as a real constraint and never expand the selected nearby radius', async () => {
  const f = fixture({}, { request: { query: 'индивидуален урок', coordinates: locatedPoint(), radiusKm: 2 } })
  try {
    f.entry()
    f.requests[0].respond(response('initial-nearby', { intent: { coordinates: point } })); await f.settle()
    f.stage('categories'); f.chooseCategory('education')
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
    assert.equal(f.requests[0].body.cityCode, current.cityCode)
    assert.equal(f.requests[0].body.neighborhood, current.neighborhood)
    assert.equal(f.permission.length, 0)
  } finally { f.close() }
})
