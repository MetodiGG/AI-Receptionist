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
    slot(initial) { const at = index++; return slots[at] ?? (slots[at] = { value: initial() }) },
    state(initial) { const slot = h.slot(() => typeof initial === 'function' ? initial() : initial); return [slot.value, next => { const value = typeof next === 'function' ? next(slot.value) : next; if (!Object.is(value, slot.value)) { slot.value = value; dirty = true } }] },
    ref(initial) { return h.slot(() => ({ current: initial })).value },
    effect(effect, deps) { const slot = h.slot(() => ({ deps: undefined, cleanup: undefined })); if (!slot.value.deps || deps.some((value, at) => !Object.is(value, slot.value.deps[at]))) { slot.value.deps = deps; pending.push(() => { slot.value.cleanup?.(); slot.value.cleanup = effect() }) } },
    render() { index = 0; dirty = false; activeHarness = h; try { h.tree = component(h.props) } finally { activeHarness = null }; return h.tree },
    flush() { if (disposed) return; let turns = 0; while (dirty || pending.length) { assert.ok(++turns < 40); while (pending.length) pending.shift()(); if (dirty) h.render() } },
    dispose() { disposed = true; pending.length = 0; slots.forEach(slot => slot.value?.cleanup?.()) },
  }
  h.render(); h.flush(); return h
}
const point = { latitude: 42.66, longitude: 23.28, consent: true }
const locatedPoint = () => ({ ...point, accuracyMeters: 25, observedAt: Date.now() })
const response = (id = 'city-row', patch = {}) => ({ results: [{ id, source: 'catalogue', name: 'Local fictional QA result' }], externalStatus: 'catalogue', intent: { cityCode: '68134' }, cataloguePage: { offset: 0, total: 1, nextOffset: null }, ...patch })
const controls = Object.fromEntries(['Icon', 'BrandMark', 'DiscoveryRouteArt', 'BusinessCategoryIcon', 'DiscoveryHomeRail', 'DiscoveryHomeBusinesses', 'DiscoveryHomeBottom', 'DiscoveryFilterSheet'].map(name => [name, Object.defineProperty(() => null, 'name', { value: name })]))
function fixture(patch = {}, draft = null) {
  const requests = [], permission = [], timers = new Map(), focused = [], navigations = [], listeners = new Map()
  let timerId = 0, clears = 0
  const imports = { react: hooks, 'next/link': () => null, 'next/navigation': { useRouter: () => ({ push: value => navigations.push(value) }) }, '../lib/business-location.mjs': locations, '../lib/discovery/categories.mjs': categories, '../lib/discovery/location-query.mjs': locationQuery, '../lib/discovery/copy.mjs': copy, '../lib/discovery/defaults.mjs': defaults, '../lib/discovery/draft.mjs': { peekDiscoveryDraft: () => draft, clearDiscoveryDraft: () => { clears++ }, setDiscoveryDraft() {} }, '../lib/discovery/search-ui.mjs': searchUi, '../lib/discovery/results-navigation.mjs': { focusDiscoveryResults: () => focused.push('focus') }, '../lib/discovery/home.mjs': home, '../lib/discovery/laboratories.mjs': labs, '../lib/discovery/catalogue-pagination.mjs': pagination }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'clearTimeout', 'window', 'navigator', 'requestAnimationFrame', 'cancelAnimationFrame', code)(name => name in imports ? imports[name] : name.startsWith('./') ? controls : require(name), module, module.exports,
    (url, init) => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); requests.push({ url, init, body: JSON.parse(init.body), reject, respond(value = response(), status = 200) { resolve({ ok: status >= 200 && status < 300, json: async () => value }) } }); return promise },
    (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id }, id => timers.delete(id), { isSecureContext: true, matchMedia: () => ({ matches: true }), addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name) } }, { geolocation: {} }, fn => { fn(); return 1 }, () => {})
  const h = harness(module.exports.DiscoverySearch, { home: true, locale: 'bg', locationProvider: () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); permission.push({ resolve, reject }); return promise }, ...patch })
  const f = {
    h, requests, permission, focused, navigations,
    control: name => elements(h.tree, node => node.type === controls[name])[0],
    query: () => elements(h.tree, node => node.type === 'input' && node.props.id === 'ai-query')[0],
    location: () => elements(h.tree, node => node.type === 'button' && node.props.className?.includes('home-inline-location'))[0],
    entry() { for (const [id, timer] of [...timers]) if (timer.delay === 0) { timers.delete(id); timer.fn() } h.flush() },
    settleQuery() { for (const [id, timer] of [...timers]) if (timer.delay === 350) { timers.delete(id); timer.fn() } h.flush() },
    focus() { listeners.get('focus')?.(); h.flush() },
    debounce() { f.settleQuery() },
    edit(value) { f.query().props.onChange({ target: { value } }); h.flush() },
    toggle() { const promise = f.location().props.onClick(); h.flush(); return promise },
    submit() { elements(h.tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} }); h.flush() },
    category(id) { const rail = elements(h.tree, node => node.type === controls.DiscoveryHomeRail && node.props.kind === 'categories')[0]; const item = rail.props.children[home.homeCategories().findIndex(row => row.id === id)]; item.props.children.props.onClick(); h.flush() },
    filters(values) { elements(h.tree, node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog')[0].props.onClick({ currentTarget: {} }); h.flush(); f.control('DiscoveryFilterSheet').props.onApply(values); h.flush() },
    async settle() { for (let i = 0; i < 15; i++) { await Promise.resolve(); h.flush() } },
    async ready() { f.entry(); assert.equal(requests.length, 1); requests[0].respond(); await f.settle() },
    clears: () => clears,
    close: () => h.dispose(),
  }
  return f
}

test('initial homepage starts exactly one immediate city-centre browse without invoking location or scrolling', async () => {
  const f = fixture()
  try {
    assert.equal(f.control('DiscoveryHomeBusinesses').props.loading, true)
    assert.equal(f.control('DiscoveryHomeBusinesses').props.directoryEnabled, false)
    f.entry()
    assert.equal(f.requests.length, 1); assert.equal(f.permission.length, 0)
    assert.deepEqual(f.requests[0].body, { query: '', locale: 'bg', radiusKm: 2, browse: true, cityCode: '68134' })
    f.requests[0].respond(); await f.settle()
    assert.equal(f.control('DiscoveryHomeBusinesses').props.result.results[0].id, 'city-row')
    assert.equal(f.control('DiscoveryHomeBusinesses').props.loading, false)
    assert.equal(f.query().props.disabled, false); assert.equal(f.location().props['aria-pressed'], false)
    assert.equal(f.focused.length, 0); assert.equal(f.permission.length, 0)
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
      f.entry(); f.requests[0].respond(response('accepted-sofia', { intent })); await f.settle()
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
    f.entry(); f.requests[0].respond(response('city-first', { cataloguePage: { offset: 0, total: 2, nextOffset: 1 } })); await f.settle()
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
