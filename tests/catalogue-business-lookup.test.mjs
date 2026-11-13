import * as brandLoading from './helpers/brand-loading.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/catalogue-business-lookup.js'
const source = await readFile(new URL(filename, import.meta.url), 'utf8')
const { code } = await transform(source, {
  filename,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
function loadComponent(react = React) {
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'react') return react
    if (name === './icon') return { Icon: ({ name }) => React.createElement('span', { 'data-icon': name }) }
    return (name === './brand-loading' ? brandLoading : require(name))
  }, module, module.exports)
  return module.exports.CatalogueBusinessLookup
}
function elements(node, predicate, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, result))
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}
const html = node => renderToStaticMarkup(node)
const input = fixture => elements(fixture.h.tree, node => node.props.role === 'combobox')[0]
const options = fixture => elements(fixture.h.tree, node => node.props.role === 'option')
const button = (fixture, className) => elements(fixture.h.tree, node => String(node.props.className || '').split(/\s+/).includes(className))[0]
const status = fixture => elements(fixture.h.tree, node => node.props.role === 'status')[0]
const match = (id, name = `Fixture ${id}`) => ({ id, name, address: `София, тестов адрес ${id}`, serviceCount: 2 })
const detail = (id, name = `Fixture ${id}`) => ({ business: { id, name, address: `София, тестов адрес ${id}` }, services: [{ name: 'Fixture service', price: 20, currency: 'EUR' }] })

// The actual SWC-compiled component runs against deterministic local hooks,
// fake timers, a fake document and a controlled fetch. Fetch intentionally
// ignores AbortSignal so late-response protection is verified independently
// of browser/network cancellation. No network or real registration is possible.
let activeHarness
const fakeReact = {
  ...React,
  useState: initial => activeHarness.state(initial),
  useRef: initial => activeHarness.ref(initial),
  useId: () => activeHarness.slot(() => 'catalogue-lookup-fixture').value,
  useEffect: (effect, dependencies) => activeHarness.effect(effect, dependencies),
}
function hookHarness(component, props) {
  const slots = [], pending = []
  let index = 0, dirty = false, disposed = false
  const h = {
    props, tree: null,
    slot(initial) { const at = index++; return slots[at] ?? (slots[at] = { value: initial() }) },
    state(initial) {
      const slot = h.slot(() => typeof initial === 'function' ? initial() : initial)
      return [slot.value, next => { const value = typeof next === 'function' ? next(slot.value) : next; if (!Object.is(value, slot.value)) { slot.value = value; dirty = true } }]
    },
    ref(initial) { return h.slot(() => ({ current: initial })).value },
    effect(effect, dependencies) {
      const slot = h.slot(() => ({ dependencies: undefined, cleanup: undefined }))
      if (!slot.value.dependencies || dependencies.length !== slot.value.dependencies.length || dependencies.some((value, at) => !Object.is(value, slot.value.dependencies[at]))) {
        slot.value.dependencies = dependencies
        pending.push(() => { slot.value.cleanup?.(); slot.value.cleanup = effect() })
      }
    },
    render() {
      index = 0; dirty = false; activeHarness = h
      try { h.tree = component(h.props) } finally { activeHarness = null }
      return h.tree
    },
    flush() {
      if (disposed) return
      let turns = 0
      while (pending.length || dirty) {
        assert.ok(++turns < 40, 'hook/effect harness must settle, not conceal an update loop')
        while (pending.length) pending.shift()()
        if (dirty) h.render()
      }
    },
    update(patch) { h.props = { ...h.props, ...patch }; h.render(); h.flush() },
    dispose() { if (disposed) return; disposed = true; pending.length = 0; slots.forEach(slot => slot.value?.cleanup?.()) },
  }
  h.render()
  return h
}
function fakeClock() {
  let now = 0, next = 0
  const jobs = new Map()
  return {
    set(callback, milliseconds) { const id = ++next; jobs.set(id, { at: now + milliseconds, callback }); return id },
    clear(id) { jobs.delete(id) },
    advance(milliseconds) {
      const target = now + milliseconds
      while (true) {
        const due = [...jobs.entries()].filter(([, job]) => job.at <= target).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0]
        if (!due) break
        jobs.delete(due[0]); now = due[1].at; due[1].callback()
      }
      now = target
    },
    get size() { return jobs.size },
  }
}
function fixture(patch = {}) {
  const original = { fetch: globalThis.fetch, document: globalThis.document, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }
  const clock = fakeClock(), requests = [], changes = [], selected = [], listeners = new Map(), inside = {}
  globalThis.document = { addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: (name, callback) => { if (listeners.get(name) === callback) listeners.delete(name) } }
  globalThis.setTimeout = (callback, milliseconds) => clock.set(callback, milliseconds)
  globalThis.clearTimeout = id => clock.clear(id)
  globalThis.fetch = (url, init) => {
    assert.match(url, /^\/api\/public\/catalogue-onboarding\?/u, 'only the local mocked endpoint may be requested')
    let resolve, reject
    const promise = new Promise((yes, no) => { resolve = yes; reject = no })
    requests.push({ url, init, respond: (result, ok = true) => resolve({ ok, json: async () => result }), reject,
      respondWithPendingJSON() { let resolveJSON; const json = new Promise(yes => { resolveJSON = yes }); resolve({ ok: true, json: () => json }); return resolveJSON } })
    return promise
  }
  const h = hookHarness(loadComponent(fakeReact), { value: '', cityCode: '', locale: 'bg', onChange: next => changes.push(next), onSelect: result => selected.push(result), ...patch })
  h.tree.props.ref.current = { contains: target => target === inside }
  h.flush()
  const f = {
    h, clock, requests, changes, selected, listeners, inside,
    edit(next) { input(f).props.onChange({ target: { value: next } }); h.flush() },
    type(next) { f.edit(next); h.update({ value: next }) },
    advance(milliseconds) { clock.advance(milliseconds); h.flush() },
    async settle() { for (let step = 0; step < 8; step++) await Promise.resolve(); h.flush() },
    key(key, patch = {}) { const event = { key, preventDefault() { this.prevented = true }, ...patch }; input(f).props.onKeyDown(event); h.flush(); return event },
    async show(rows = [match('A')], query = 'Fixture') { f.type(query); f.advance(280); requests.at(-1).respond({ businesses: rows }); await f.settle() },
    close() { h.dispose(); Object.assign(globalThis, original) },
  }
  return f
}

test('lookup debounces for280ms, cancels the superseded timer and encodes actual query/city/locale', async () => {
  const f = fixture({ cityCode: '68134', locale: 'en' })
  try {
    f.type('Al'); f.advance(279)
    assert.equal(f.requests.length, 0)
    f.type('  Alpha & Co  '); f.advance(279)
    assert.equal(f.requests.length, 0)
    f.advance(1)
    assert.equal(f.requests.length, 1)
    const url = new URL(f.requests[0].url, 'https://local.invalid')
    assert.deepEqual(Object.fromEntries(url.searchParams), { q: 'Alpha & Co', lang: 'en', city: '68134' })
    assert.equal(f.requests[0].init.cache, 'no-store')
    assert.equal(f.requests[0].init.signal.aborted, false)
    assert.match(html(status(f)), /Searching the catalogue/)
  } finally { f.close() }
})

test('an aborted slow search cannot replace newer results or clear the newer loading state', async () => {
  const f = fixture()
  try {
    f.type('Alpha'); f.advance(280)
    const old = f.requests[0]
    f.type('Beta'); f.advance(280)
    assert.equal(old.init.signal.aborted, true)
    old.respond({ businesses: [match('OLD')] }); await f.settle()
    assert.equal(options(f).length, 0)
    assert.match(html(status(f)), /Търсим в каталога/)
    f.requests[1].respond({ businesses: [match('NEW')] }); await f.settle()
    assert.match(html(f.h.tree), /Fixture NEW/)
    assert.doesNotMatch(html(f.h.tree), /Fixture OLD/)
    assert.equal(status(f), undefined)
  } finally { f.close() }
})

test('query edits synchronously clear options and abort detail before the controlled parent value updates', async () => {
  const f = fixture()
  try {
    await f.show([match('A')])
    options(f)[0].props.onClick(); f.h.flush()
    const request = f.requests.at(-1)
    assert.match(request.url, /id=A/)
    assert.match(html(status(f)), /Зареждаме услугите/)
    f.edit('Different name')
    assert.equal(request.init.signal.aborted, true)
    assert.equal(options(f).length, 0)
    assert.equal(status(f), undefined)
    assert.deepEqual(f.changes.at(-1), 'Different name')
    request.respond(detail('A')); await f.settle()
    assert.deepEqual(f.selected, [])
  } finally { f.close() }
})

test('city changes clear old options, abort pending detail and search the same name in the new city', async () => {
  const f = fixture({ cityCode: '68134' })
  try {
    await f.show([match('SOFIA')])
    options(f)[0].props.onClick(); f.h.flush()
    const oldDetail = f.requests.at(-1)
    f.h.update({ cityCode: '10135' })
    assert.equal(options(f).length, 0)
    assert.equal(oldDetail.init.signal.aborted, true)
    assert.equal(status(f), undefined)
    f.advance(280)
    assert.equal(new URL(f.requests.at(-1).url, 'https://local.invalid').searchParams.get('city'), '10135')
    oldDetail.respond(detail('SOFIA')); await f.settle()
    assert.deepEqual(f.selected, [])
    f.requests.at(-1).respond({ businesses: [match('VARNA')] }); await f.settle()
    assert.match(html(f.h.tree), /Fixture VARNA/)
    assert.doesNotMatch(html(f.h.tree), /Fixture SOFIA/)
  } finally { f.close() }
})

test('manual entry aborts pending detail and a late successful response cannot override the manual choice', async () => {
  const f = fixture()
  try {
    await f.show([match('A')], 'My manual name')
    options(f)[0].props.onClick(); f.h.flush()
    const old = f.requests.at(-1)
    button(f, 'catalogue-manual-entry').props.onClick(); f.h.flush()
    assert.equal(old.init.signal.aborted, true)
    assert.equal(options(f).length, 0)
    assert.equal(status(f), undefined)
    old.respond(detail('A')); await f.settle()
    assert.deepEqual(f.selected, [])
    f.h.update({ cityCode: '10135' }); f.advance(1000)
    assert.equal(f.requests.length, 2, 'the explicitly manual name is not immediately searched again')
    assert.equal(input(f).props.value, 'My manual name')
  } finally { f.close() }
})

test('stale detail JSON arriving after a query change is discarded even when fetch itself completed earlier', async () => {
  const f = fixture()
  try {
    await f.show([match('A')])
    options(f)[0].props.onClick(); f.h.flush()
    const resolveJSON = f.requests.at(-1).respondWithPendingJSON()
    await f.settle()
    f.type('New name')
    resolveJSON(detail('A')); await f.settle()
    assert.deepEqual(f.selected, [])
    assert.equal(options(f).length, 0)
    assert.equal(status(f), undefined)
  } finally { f.close() }
})

test('a pending detail uses the latest onSelect callback without restarting or aborting its valid request', async () => {
  const first = [], latest = [], f = fixture({ onSelect: data => first.push(data) })
  try {
    await f.show([match('A')])
    options(f)[0].props.onClick(); f.h.flush()
    const pending = f.requests.at(-1), total = f.requests.length
    f.h.update({ onSelect: data => latest.push(data) })
    assert.equal(pending.init.signal.aborted, false)
    assert.equal(f.clock.size, 0, 'callback identity does not create a duplicate search')
    pending.respond(detail('A', 'Canonical name')); await f.settle()
    assert.deepEqual(first, [])
    assert.equal(latest.length, 1)
    assert.equal(latest[0].business.name, 'Canonical name')
    assert.equal(f.requests.length, total)
    assert.equal(options(f).length, 0)
    f.h.update({ value: 'Canonical name' }); f.advance(1000)
    assert.equal(f.requests.length, total, 'confirmed canonical name does not trigger an immediate follow-up lookup')
  } finally { f.close() }
})

test('remounting a previously loaded canonical name does not fetch again, but editing its name resumes lookup', async () => {
  const f = fixture({ value: 'Previously loaded business', loadedName: 'Previously loaded business', cityCode: '68134' })
  try {
    f.advance(1000)
    assert.equal(f.requests.length, 0)
    assert.equal(f.clock.size, 0)
    assert.equal(options(f).length, 0)
    assert.equal(status(f), undefined)
    f.type('Previously loaded business edited')
    f.advance(279)
    assert.equal(f.requests.length, 0)
    f.advance(1)
    assert.equal(f.requests.length, 1)
    assert.equal(new URL(f.requests[0].url, 'https://local.invalid').searchParams.get('q'), 'Previously loaded business edited')
    f.requests[0].respond({ businesses: [match('EDITED')] }); await f.settle()
    assert.match(html(f.h.tree), /Fixture EDITED/)
    assert.deepEqual(f.selected, [], 'editing a name only suggests, never silently applies a business')
  } finally { f.close() }
})

for (const locale of ['bg', 'en']) {
  test(`${locale}: real SSR uses localized labels and accessible combobox semantics without a fabricated suggestion`, () => {
    const output = html(React.createElement(loadComponent(), { value: 'My company', locale, onChange: () => {}, onSelect: () => {}, disabled: true }))
    assert.match(output, /role="combobox"/)
    assert.match(output, /aria-autocomplete="list"/)
    assert.match(output, /aria-expanded="false"/)
    assert.match(output, /aria-controls="[^"]+-matches"/)
    assert.match(output, /<label for="business-name">/)
    assert.match(output, /disabled=""/)
    assert.ok(output.includes(locale === 'bg' ? 'Име на бизнеса' : 'Business name'))
    assert.ok(output.includes(locale === 'bg' ? 'Напиши името на бизнеса' : 'Enter your business name'))
    assert.ok(!output.includes('role="option"'))
    assert.ok(!output.includes('proof of ownership') && !output.includes('verified owner'))
  })
}

test('localized listbox labels, selected state and keyboard Enter select the actual focused business ID', async () => {
  for (const locale of ['bg', 'en']) {
    const f = fixture({ locale })
    try {
      await f.show([match('A'), match('B'), match('C')])
      const list = elements(f.h.tree, node => node.props.role === 'listbox')[0]
      assert.equal(list.props['aria-label'], locale === 'bg' ? 'Бизнеси в каталога' : 'Businesses in the catalogue')
      assert.equal(input(f).props['aria-controls'], list.props.id)
      assert.equal(f.key('ArrowDown').prevented, true)
      assert.equal(input(f).props['aria-activedescendant'], options(f)[0].props.id)
      assert.equal(options(f)[0].props['aria-selected'], true)
      f.key('ArrowDown')
      assert.equal(options(f)[1].props['aria-selected'], true)
      assert.equal(f.key('Enter').prevented, true)
      assert.equal(new URL(f.requests.at(-1).url, 'https://local.invalid').searchParams.get('id'), 'B')
      assert.ok(options(f).every(node => node.props.disabled), 'detail loading prevents duplicate option submission')
      f.requests.at(-1).respond(detail('B')); await f.settle()
      assert.equal(f.selected.length, 1)
      assert.equal(f.selected[0].business.id, 'B')
    } finally { f.close() }
  }
})

test('ArrowUp from no active suggestion starts at the last option rather than skipping it', async () => {
  const f = fixture()
  try {
    await f.show([match('A'), match('B'), match('C')])
    f.key('ArrowUp')
    assert.equal(options(f).at(-1).props['aria-selected'], true)
    assert.equal(input(f).props['aria-activedescendant'], options(f).at(-1).props.id)
  } finally { f.close() }
})

test('Escape, Tab and outside pointer close suggestions without selecting a business', async () => {
  const f = fixture()
  try {
    await f.show([match('A')])
    f.key('Escape')
    assert.equal(options(f).length, 0)
    input(f).props.onFocus(); f.h.flush()
    assert.equal(options(f).length, 1)
    assert.equal(f.key('Tab').prevented, undefined)
    assert.equal(options(f).length, 0)
    input(f).props.onFocus(); f.h.flush()
    f.listeners.get('pointerdown')({ target: f.inside }); f.h.flush()
    assert.equal(options(f).length, 1)
    f.listeners.get('pointerdown')({ target: {} }); f.h.flush()
    assert.equal(options(f).length, 0)
    assert.deepEqual(f.selected, [])
  } finally { f.close() }
})

test('technical failures keep manual registration possible and Retry starts a new debounced search', async () => {
  for (const locale of ['bg', 'en']) {
    const f = fixture({ locale })
    try {
      f.type('Test name'); f.advance(280)
      f.requests[0].respond({}, false); await f.settle()
      const output = html(status(f))
      assert.ok(output.includes(locale === 'bg' ? 'Каталогът не отговаря' : 'Catalogue unavailable'))
      assert.equal(input(f).props.disabled, false)
      assert.equal(input(f).props['aria-describedby'], status(f).props.id)
      const retry = elements(status(f), node => node.type === 'button')[0]
      assert.ok(html(retry).includes(locale === 'bg' ? 'Опитай пак' : 'Retry'))
      retry.props.onClick(); f.h.flush(); f.advance(279)
      assert.equal(f.requests.length, 1)
      f.advance(1)
      assert.equal(f.requests.length, 2)
      f.requests[1].respond({ businesses: [] }); await f.settle()
      assert.equal(status(f), undefined)
    } finally { f.close() }
  }
})

test('a malformed detail result never calls onSelect and shows a localized retryable error', async () => {
  const f = fixture({ locale: 'en' })
  try {
    await f.show([match('A')])
    options(f)[0].props.onClick(); f.h.flush()
    f.requests.at(-1).respond({ business: { id: 'A' }, services: null }); await f.settle()
    assert.deepEqual(f.selected, [])
    assert.match(html(status(f)), /Could not load this business/)
    assert.ok(!options(f)[0].props.disabled, 'failure releases the loading lock')
  } finally { f.close() }
})

test('short queries and an unmounted debounce never request data; unmount removes the outside listener', () => {
  const f = fixture()
  try {
    f.type(' a '); f.advance(1000)
    assert.equal(f.requests.length, 0)
    f.type('Long enough')
    assert.equal(f.clock.size, 1)
    f.h.dispose(); f.advance(1000)
    assert.equal(f.requests.length, 0)
    assert.equal(f.listeners.size, 0)
    assert.equal(f.clock.size, 0)
  } finally { f.close() }
})

test('unmount aborts a pending detail and ignores a late successful result', async () => {
  const f = fixture()
  try {
    await f.show([match('A')])
    options(f)[0].props.onClick(); f.h.flush()
    const request = f.requests.at(-1)
    f.h.dispose()
    assert.equal(request.init.signal.aborted, true)
    request.respond(detail('A')); await f.settle()
    assert.deepEqual(f.selected, [])
  } finally { f.close() }
})
