import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/service-name-input.js'
const source = await readFile(new URL(filename, import.meta.url), 'utf8')
const { code } = await transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
let activeHarness, id = 0
const fakeReact = { ...React, useId: () => activeHarness.slot(() => `service-qa-${++id}`).value, useState: value => activeHarness.state(value), useRef: value => activeHarness.ref(value), useEffect: (effect, dependencies) => activeHarness.effect(effect, dependencies) }
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
function harness(component, props) {
  const slots = [], pending = []
  let index = 0, dirty = false
  const h = {
    props, tree: null,
    slot(initial) { const at = index++; return slots[at] ?? (slots[at] = { value: initial() }) },
    state(initial) { const slot = h.slot(() => typeof initial === 'function' ? initial() : initial); return [slot.value, next => { const value = typeof next === 'function' ? next(slot.value) : next; if (!Object.is(value, slot.value)) { slot.value = value; dirty = true } }] },
    ref(initial) { return h.slot(() => ({ current: initial })).value },
    effect(effect, dependencies) { const slot = h.slot(() => ({ dependencies: undefined, cleanup: undefined })); if (!slot.value.dependencies || dependencies.some((value, at) => !Object.is(value, slot.value.dependencies[at]))) { slot.value.dependencies = dependencies; pending.push(() => { slot.value.cleanup?.(); slot.value.cleanup = effect() }) } },
    render() { index = 0; dirty = false; activeHarness = h; try { h.tree = component(h.props) } finally { activeHarness = null }; return h.tree },
    flush() { let turns = 0; while (dirty || pending.length) { assert.ok(++turns < 40); while (pending.length) pending.shift()(); if (dirty) h.render() } },
    update(patch, effects = true) { h.props = { ...h.props, ...patch }; h.render(); if (effects) h.flush() },
  }
  h.render(); h.flush(); return h
}
const suggestions = [
  { id: 'hair-colour', name: 'Боядисване на коса', group: 'hair' },
  { id: 'hair-roots', name: 'Боядисване на корени', group: 'hair' },
]
function fixture(patch = {}, search = (query, options) => options.industry === 'beauty' ? suggestions : options.industry === 'auto' ? [{ id: 'car-paint', name: 'Боядисване на автомобил' }] : []) {
  const calls = [], changes = [], module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name === 'react' ? fakeReact : name === '../lib/service-suggestions.mjs' ? { searchServiceSuggestions: (query, options) => { calls.push({ query, options }); return search(query, options) } } : require(name), module, module.exports)
  let h
  h = harness(module.exports.ServiceNameInput, { id: 'service-name', value: '', industry: 'beauty', locale: 'bg', onChange: value => { changes.push(value); h.props = { ...h.props, value } }, ...patch })
  const f = {
    h, calls, changes,
    input: () => elements(h.tree, node => node.type === 'input')[0],
    options: () => elements(h.tree, node => node.props.role === 'option'),
    html: () => renderToStaticMarkup(h.tree),
    change(value) { f.input().props.onChange({ target: { value } }); h.render(); h.flush() },
    focus() { f.input().props.onFocus({}); h.render(); h.flush() },
    key(key, patch = {}) { let prevented = false, stopped = false; f.input().props.onKeyDown({ key, preventDefault() { prevented = true }, stopPropagation() { stopped = true }, ...patch }); h.render(); h.flush(); return { prevented, stopped } },
    blur() { h.tree.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null }); h.render(); h.flush() },
  }
  return f
}

test('local suggestions start at two characters, remain bounded and preserve a free editable input', () => {
  const f = fixture()
  assert.equal(f.input().props.role, 'combobox'); assert.equal(f.input().props.maxLength, 120)
  assert.equal(f.input().props['aria-expanded'], false); assert.equal(f.calls.length, 0)
  f.change('б'); assert.equal(f.calls.length, 0); assert.equal(f.options().length, 0)
  f.change('боя'); assert.equal(f.options().length, 2)
  assert.equal(f.input().props['aria-expanded'], true)
  assert.deepEqual(f.calls.at(-1), { query: 'боя', options: { industry: 'beauty', locale: 'bg', limit: 8 } })
  assert.equal(f.input().props.value, 'боя'); assert.equal(f.input().props['aria-activedescendant'], undefined)
  f.change('Напълно собствена услуга'); f.blur()
  assert.equal(f.input().props.value, 'Напълно собствена услуга')
  assert.equal(f.changes.at(-1), 'Напълно собствена услуга')
})

test('keyboard navigation selects only the active actual name and never submits or commits by default', () => {
  const f = fixture(); f.change('боя')
  assert.deepEqual(f.key('Enter'), { prevented: false, stopped: false })
  assert.equal(f.input().props.value, 'боя')
  assert.equal(f.key('ArrowDown').prevented, true)
  assert.equal(f.options()[0].props['aria-selected'], true)
  assert.equal(f.input().props['aria-activedescendant'], f.options()[0].props.id)
  f.key('ArrowDown'); assert.equal(f.options()[1].props['aria-selected'], true)
  f.key('ArrowDown'); assert.equal(f.options()[0].props['aria-selected'], true)
  f.key('ArrowUp'); assert.equal(f.options()[1].props['aria-selected'], true)
  assert.equal(f.key('Enter').prevented, true)
  assert.equal(f.changes.at(-1), 'Боядисване на корени')
  assert.equal(f.input().props.value, 'Боядисване на корени')
  assert.equal(f.input().props['aria-expanded'], false)
  assert.ok(f.changes.every(value => typeof value === 'string'), 'only names, never price or duration payloads')
})

test('Escape, Tab and blur retain user text; a pointer choice is explicit and avoids mouse blur', () => {
  const f = fixture(); f.change('боя'); f.key('ArrowDown')
  assert.deepEqual(f.key('Escape'), { prevented: true, stopped: true })
  assert.equal(f.input().props.value, 'боя'); assert.equal(f.options().length, 0)
  f.key('ArrowUp'); assert.equal(f.options()[1].props['aria-selected'], true)
  assert.equal(f.key('Tab').prevented, false); assert.equal(f.options().length, 0)
  f.focus(); f.key('ArrowDown'); f.blur()
  assert.equal(f.input().props.value, 'боя'); assert.equal(f.changes.length, 1)
  f.focus(); let prevented = false
  f.options()[0].props.onPointerDown({ pointerType: 'touch', isPrimary: true, preventDefault() { prevented = true } }); assert.equal(prevented, true, 'tap keeps the textbox focused before explicit click')
  assert.equal(f.input().props.value, 'боя', 'pointer down is not a selection; touch scrolling cannot commit a name')
  prevented = false
  f.options()[0].props.onMouseDown({ preventDefault() { prevented = true } }); assert.equal(prevented, true)
  f.options()[0].props.onClick(); f.h.render(); f.h.flush()
  assert.equal(f.input().props.value, 'Боядисване на коса')
})

test('IME composition never intercepts Enter/arrows or displays premature suggestions', () => {
  const f = fixture(); f.change('боя')
  assert.equal(f.key('ArrowDown', { isComposing: true }).prevented, false)
  assert.equal(f.key('Enter', { nativeEvent: { isComposing: true } }).prevented, false)
  f.input().props.onCompositionStart({}); f.h.render(); f.h.flush()
  assert.equal(f.options().length, 0)
  f.change('бояд'); assert.equal(f.options().length, 0)
  assert.equal(f.key('ArrowDown').prevented, false)
  f.input().props.onCompositionEnd({ currentTarget: { value: 'бояд' } }); f.h.render(); f.h.flush()
  assert.equal(f.options().length, 2)
  assert.equal(f.key('Enter', { keyCode: 229 }).prevented, false)
  assert.equal(f.input().props.value, 'бояд')
})

test('category or locale changes hide stale options synchronously without changing text or committing stale names', () => {
  const f = fixture(); f.change('боя'); f.key('ArrowDown')
  f.h.update({ industry: 'auto' }, false)
  assert.equal(f.input().props.value, 'боя'); assert.equal(f.options().length, 0)
  assert.equal(f.key('Enter').prevented, false); assert.deepEqual(f.changes, ['боя'])
  f.focus(); assert.equal(f.options()[0].props.children.props.children, 'Боядисване на автомобил')
  f.h.update({ locale: 'en' }, false); assert.equal(f.options().length, 0)
  f.focus(); assert.match(f.html(), /Suggested service names/)
  assert.equal(f.calls.at(-1).options.locale, 'en')
  f.h.update({ industry: 'unknown' }); f.focus(); assert.equal(f.options().length, 0)
  assert.equal(f.input().props.value, 'боя')
})

test('disabled state, explicit max length and accessible labels are retained without selectable suggestions', () => {
  const f = fixture({ name: 'real-service-name', required: true, 'aria-label': 'Service name', 'aria-describedby': 'price-help', placeholder: 'Your own service', maxLength: 18 })
  f.change('боя'); assert.equal(f.options().length, 1)
  assert.equal(f.input().props.required, true); assert.equal(f.input().props.name, 'real-service-name')
  assert.match(f.input().props['aria-describedby'], /^price-help service-qa-/)
  f.h.update({ disabled: true }); assert.equal(f.input().props.disabled, true); assert.equal(f.options().length, 0)
  assert.equal(f.input().props['aria-expanded'], false); assert.equal(f.input().props['aria-describedby'], 'price-help')
  assert.equal(f.key('ArrowDown').prevented, false)
})

test('many service rows have unique listbox IDs and helper output is capped at eight options', () => {
  const search = () => Array.from({ length: 20 }, (_, index) => ({ id: `name-${index}`, name: `QA service ${index}` }))
  const first = fixture({}, search), second = fixture({ id: 'service-second' }, search)
  first.change('qa'); second.change('qa')
  assert.equal(first.options().length, 8); assert.equal(second.options().length, 8)
  assert.notEqual(first.input().props['aria-controls'], second.input().props['aria-controls'])
  assert.notEqual(first.options()[0].props.id, second.options()[0].props.id)
})

test('signup only changes the existing name field and preserves all imported/pricing/duration payload paths', async () => {
  const signup = await readFile(new URL('../components/business-setup.js', import.meta.url), 'utf8')
  assert.match(signup, /<ServiceNameInput id=\{`service-\$\{index\}`\} className="compact-input" value=\{service.name\} industry=\{business.industry\} locale=\{locale\} disabled=\{saving\} maxLength=\{120\} onChange=\{name => updateList\(setServices, index, 'name', name\)\}/)
  assert.match(signup, /function updateList\(setter, index, field, value\)[\s\S]*?\{ \.\.\.row, \[field\]: value \}/)
  assert.doesNotMatch(source, /fetch\(|supabase|localStorage|price:|duration_min:/)
})

test('screen-reader instructions stay visually hidden inside the compact suggestions panel', async () => {
  const css = await readFile(new URL('../app/service-name-input.css', import.meta.url), 'utf8')
  const hidden = css.match(/\.service-name-input \.visually-hidden\s*\{([^}]+)\}/)?.[1]
  assert.ok(hidden, 'the component defines its own scoped hidden-text utility')
  for (const declaration of ['position: absolute', 'width: 1px', 'height: 1px', 'overflow: hidden', 'clip-path: inset(50%)', 'white-space: nowrap']) assert.ok(hidden.includes(declaration), declaration)
  const f = fixture(); f.change('боя')
  assert.match(f.html(), /class="visually-hidden"/)
  assert.match(f.input().props['aria-describedby'], /service-hint$/)
})
