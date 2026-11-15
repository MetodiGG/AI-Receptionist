import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as ui from '../lib/discovery/suggestions-ui.mjs'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await readFile(new URL('../components/discovery-autocomplete.js', import.meta.url), 'utf8')
const { code } = await transform(source, { filename: 'components/discovery-autocomplete.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
function elements(node, predicate, values = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, values))
  else if (React.isValidElement(node)) { if (predicate(node)) values.push(node); elements(node.props.children, predicate, values) }
  return values
}
let activeHarness
const hooks = { ...React, useId: () => 'qa-autocomplete', useState: initial => activeHarness.state(initial), useRef: initial => activeHarness.ref(initial), useEffect: (effect, deps) => activeHarness.effect(effect, deps) }
const module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name === 'react' ? hooks : name === './icon' ? { Icon: () => null } : name === './brand-loading' ? { BrandLoading: () => null } : name === '../lib/discovery/suggestions-ui.mjs' ? ui : require(name), module, module.exports)
function harness(props) {
  const slots = [], pending = []
  let index = 0, dirty = false
  const h = {
    props, tree: null,
    slot(initial) { const at = index++; return slots[at] ?? (slots[at] = { value: initial() }) },
    state(initial) { const slot = h.slot(() => typeof initial === 'function' ? initial() : initial); return [slot.value, next => { const value = typeof next === 'function' ? next(slot.value) : next; if (!Object.is(value, slot.value)) { slot.value = value; dirty = true } }] },
    ref(initial) { return h.slot(() => ({ current: initial })).value },
    effect(effect, deps) { const slot = h.slot(() => ({ deps: undefined, cleanup: undefined })); if (!slot.value.deps || deps.some((value, at) => !Object.is(value, slot.value.deps[at]))) { slot.value.deps = deps; pending.push(() => { slot.value.cleanup?.(); slot.value.cleanup = effect() }) } },
    render() { index = 0; dirty = false; activeHarness = h; try { h.tree = module.exports.DiscoveryAutocomplete(h.props) } finally { activeHarness = null }; return h.tree },
    flush() { let turns = 0; while (dirty || pending.length) { assert.ok(++turns < 40, 'hooks must settle'); while (pending.length) pending.shift()(); if (dirty) h.render() } },
    update(patch) { h.props = { ...h.props, ...patch }; h.render(); h.flush() },
    dispose() { pending.length = 0; slots.forEach(slot => { slot.value?.cleanup?.(); if (slot.value?.cleanup) slot.value.cleanup = undefined }) },
  }
  h.render(); h.flush(); return h
}
function clock() {
  let time = 0, next = 0
  const jobs = new Map()
  return { set(fn, delay) { const id = ++next; jobs.set(id, { at: time + delay, fn }); return id }, clear(id) { jobs.delete(id) }, advance(delay) { const until = time + delay; for (;;) { const due = [...jobs.entries()].filter(([, row]) => row.at <= until).sort((a, b) => a[1].at - b[1].at)[0]; if (!due) break; jobs.delete(due[0]); time = due[1].at; due[1].fn() }; time = until } }
}
const response = (label = 'Маникюр') => ({ groups: [
  { kind: 'service', label: 'Услуги', items: [{ kind: 'service', id: 'service', label, query: label, cityCode: '68134' }] },
  { kind: 'business', label: 'Бизнеси', items: [{ kind: 'business', id: 'partner', label: 'QA Partner', partner: true, source: 'gorez', href: '/book/qa-partner?lang=bg' }, { kind: 'business', id: 'external', label: 'QA External', partner: false, source: 'catalogue', href: '/businesses/catalogue/sofia-qa-external?lang=bg' }] },
  { kind: 'category', label: 'Категории', items: [{ kind: 'category', id: 'nails', category: 'nails', label: 'Маникюр' }] },
], total: 4, alternatives: [], partial: false })
function fixture(props = {}) {
  const original = { document: globalThis.document, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }
  const time = clock(), requests = [], selections = [], all = [], changes = [], listeners = new Map(), inside = {}, scrolls = []
  globalThis.document = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name) }, getElementById: id => ({ scrollIntoView: options => scrolls.push({ id, options }) }) }
  globalThis.setTimeout = (fn, ms) => time.set(fn, ms); globalThis.clearTimeout = id => time.clear(id)
  const fetcher = (url, init) => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); requests.push({ url, init, respond: (body = response(), ok = true) => resolve({ ok, json: async () => body }), reject, pendingBody() { let complete; const body = new Promise(yes => { complete = yes }); resolve({ ok: true, json: () => body }); return complete } }); return promise }
  const h = harness({ id: 'qa-query', value: '', locale: 'bg', cityCode: '68134', fetcher, onChange: value => changes.push(value), onSelect: item => selections.push(item), onAll: () => all.push(true), ...props })
  h.tree.props.ref.current = { contains: target => target === inside }
  const f = { h, requests, selections, all, changes, listeners, scrolls,
    input: () => elements(h.tree, node => node.props.role === 'combobox')[0],
    options: () => elements(h.tree, node => node.props.role === 'option'),
    html: () => renderToStaticMarkup(h.tree),
    focus() { f.input().props.onFocus(); h.flush() },
    type(value) { f.input().props.onChange({ target: { value } }); h.update({ value }); },
    advance(ms) { time.advance(ms); h.flush() },
    key(key, patch = {}) { const event = { key, preventDefault() { this.prevented = true }, ...patch }; f.input().props.onKeyDown(event); h.flush(); return event },
    async settle() { for (let turn = 0; turn < 12; turn++) { await Promise.resolve(); h.flush() } },
    async show(body = response(), value = 'ма') { f.focus(); f.type(value); f.advance(250); requests.at(-1).respond(body); await f.settle() },
    close() { h.dispose(); Object.assign(globalThis, original) },
  }
  return f
}

test('actual component waits for focus and two characters, debounces250ms and posts only local non-GPS context', async () => {
  const f = fixture()
  try {
    f.type('ма'); f.advance(300); assert.equal(f.requests.length, 0)
    f.focus(); f.type('м'); f.advance(300); assert.equal(f.requests.length, 0)
    f.type('ма'); f.advance(249); assert.equal(f.requests.length, 0)
    f.advance(1); assert.equal(f.requests.length, 1)
    assert.equal(f.requests[0].url, '/api/public/discovery/suggestions')
    assert.equal(f.requests[0].init.method, 'POST')
    assert.deepEqual(JSON.parse(f.requests[0].init.body), { query: 'ма', locale: 'bg', cityCode: '68134', neighborhood: '' })
    assert.equal(f.input().props.disabled, undefined, 'network work never freezes typing')
    f.requests[0].respond(); await f.settle()
    assert.equal(f.input().props['aria-expanded'], true)
    assert.match(f.html(), /Услуги/); assert.match(f.html(), /Бизнеси/); assert.match(f.html(), /Категории/)
    assert.match(f.html(), /Виж всички резултати/)
  } finally { f.close() }
})

test('late ignored-abort responses and slow JSON bodies cannot overwrite a newer query or reopen Escape', async () => {
  const f = fixture()
  try {
    f.focus(); f.type('ма'); f.advance(250); const old = f.requests[0], body = old.pendingBody()
    await f.settle(); f.type('пе'); f.advance(250)
    assert.equal(old.init.signal.aborted, true)
    body(response('OLD')); await f.settle(); assert.doesNotMatch(f.html(), /OLD/)
    f.requests[1].respond(response('NEW')); await f.settle(); assert.match(f.html(), /NEW/)
    f.key('Escape'); assert.equal(f.input().props['aria-expanded'], false)
    assert.equal(f.input().props['aria-activedescendant'], undefined)
  } finally { f.close() }
})

test('Arrow keys, Enter, Escape and IME preserve explicit selection; plain Enter executes complete search', async () => {
  const f = fixture()
  try {
    await f.show()
    const composing = f.key('Enter', { isComposing: true }); assert.equal(composing.prevented, undefined); assert.equal(f.all.length, 0)
    f.key('ArrowDown'); assert.match(f.input().props['aria-activedescendant'], /option-0$/)
    assert.equal(f.options()[0].props['aria-selected'], true)
    assert.deepEqual(f.scrolls.at(-1).options, { block: 'nearest', inline: 'nearest' })
    f.key('Enter'); assert.equal(f.selections[0].kind, 'service'); assert.equal(f.input().props['aria-expanded'], false)
    f.type('но'); f.advance(250); f.requests.at(-1).respond(); await f.settle()
    f.key('Enter'); assert.equal(f.all.length, 1)
    f.type('ти'); f.advance(250); f.requests.at(-1).respond(); await f.settle()
    f.key('ArrowUp'); assert.match(f.input().props['aria-activedescendant'], /option-4$/)
    f.key('Enter'); assert.equal(f.all.length, 2)
  } finally { f.close() }
})

test('touch selection opens only the actual option and does not mislabel an external business as a partner', async () => {
  const f = fixture()
  try {
    await f.show()
    const native = f.options().find(option => renderToStaticMarkup(option).includes('QA Partner'))
    const external = f.options().find(option => renderToStaticMarkup(option).includes('QA External'))
    assert.match(renderToStaticMarkup(native), /Партньор на GoRez/)
    assert.doesNotMatch(renderToStaticMarkup(external), /Партньор на GoRez/)
    let prevented = false
    external.props.onPointerDown({ preventDefault() { prevented = true } }); external.props.onClick(); f.h.flush()
    assert.equal(prevented, true); assert.equal(f.selections[0].href, '/businesses/catalogue/sofia-qa-external?lang=bg')
  } finally { f.close() }
})

test('short repeated terms use mounted interaction cache, while location/locale changes cancel stale work and scope it correctly', async () => {
  const f = fixture()
  try {
    await f.show(); assert.equal(f.requests.length, 1)
    f.type('пе'); f.advance(250); f.requests[1].respond(); await f.settle()
    f.type('ма'); f.advance(250); assert.equal(f.requests.length, 2, 'no duplicate query request')
    f.h.update({ locale: 'en', cityCode: '56784' }); f.advance(250)
    assert.equal(f.requests.length, 3)
    assert.deepEqual(JSON.parse(f.requests[2].init.body), { query: 'ма', locale: 'en', cityCode: '56784', neighborhood: '' })
    f.key('Tab'); assert.equal(f.input().props['aria-expanded'], false)
  } finally { f.close() }
})

test('empty, technical error, retry and timeout states keep full search available and never fabricate suggestions', async () => {
  const f = fixture()
  try {
    await f.show({ groups: [], total: 0, alternatives: [], partial: false })
    assert.match(f.html(), /Няма точни предложения/); assert.equal(f.options().length, 1)
    f.type('ер'); f.advance(250); f.requests.at(-1).respond(null, false); await f.settle()
    assert.match(f.html(), /временно не са достъпни/)
    elements(f.h.tree, node => node.type === 'button' && node.props.children === 'Опитай пак')[0].props.onClick(); f.h.flush(); f.advance(250)
    const pending = f.requests.at(-1); f.advance(5000); await f.settle()
    assert.equal(pending.init.signal.aborted, true); assert.match(f.html(), /временно не са достъпни/)
    f.options().at(-1).props.onClick(); f.h.flush(); assert.equal(f.all.length, 1)
  } finally { f.close() }
})

test('leaving the input cancels suggestions and stops background queries until an explicit refocus', async () => {
  const f = fixture()
  try {
    await f.show()
    f.key('Tab'); f.input().props.onBlur(); f.h.flush()
    f.h.update({ locale: 'en' }); f.advance(500)
    assert.equal(f.requests.length, 1); assert.equal(f.input().props['aria-expanded'], false)
    f.focus(); f.advance(250)
    assert.equal(f.requests.length, 2)
  } finally { f.close() }
})

test('preview and unmount cannot contact production or accept late results', async () => {
  const preview = fixture({ preview: true })
  try { preview.focus(); preview.type('ма'); preview.advance(1000); assert.equal(preview.requests.length, 0) } finally { preview.close() }
  const f = fixture()
  try { f.focus(); f.type('ма'); f.advance(250); f.h.dispose(); assert.equal(f.requests[0].init.signal.aborted, true) } finally { f.close() }
})

test('client boundary remains small and the dev fixture is production-inaccessible with no real booking action', async () => {
  assert.doesNotMatch(source, /sofia-catalogue|catalogue-policy|supabase|googleapis|openai|localStorage|sessionStorage/)
  const css = await readFile(new URL('../app/discovery-autocomplete.css', import.meta.url), 'utf8')
  assert.match(css, /min-width: 0/); assert.match(css, /white-space: normal/); assert.doesNotMatch(css, /text-overflow: ellipsis|word-break: break-all/)
  const page = await readFile(new URL('../app/dev/search-autocomplete/page.js', import.meta.url), 'utf8')
  const fixture = await readFile(new URL('../app/dev/search-autocomplete/preview.js', import.meta.url), 'utf8')
  assert.match(page, /process\.env\.NODE_ENV !== 'development'\) notFound\(\)/)
  assert.match(fixture, /fetcher=\{fetcher\}/); assert.doesNotMatch(fixture, /fetch\(|supabase|router\.push/)
})
