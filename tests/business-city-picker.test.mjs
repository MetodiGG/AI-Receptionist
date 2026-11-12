import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as locations from '../lib/business-location.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/business-location-fields.js'
const source = await readFile(new URL(filename, import.meta.url), 'utf8')
const { code } = await transform(source, {
  filename,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
function component(react = React) {
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'react') return react
    if (name === '../lib/business-location.mjs') return locations
    if (name === './icon') return { Icon: ({ name }) => React.createElement('span', { 'data-icon': name }) }
    return require(name)
  }, module, module.exports)
  return module.exports.BusinessLocationFields
}
function elements(node, predicate, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, result))
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}

// Deterministic local hook/event harness, not a browser or production flow.
// It exercises the actual SWC-compiled component callbacks and effects with
// mock refs/document; no package, remote UI, customer or booking is involved.
let activeHarness
const fakeReact = {
  ...React,
  useState: initial => activeHarness.state(initial),
  useRef: initial => activeHarness.ref(initial),
  useId: () => activeHarness.slot(() => 'city-picker-fixture').value,
  useMemo: factory => factory(),
  useCallback: callback => callback,
  useEffect: (effect, dependencies) => activeHarness.effect(effect, dependencies),
}
function harness(render, props) {
  const slots = [], pending = []
  let index = 0
  const api = {
    props, tree: null,
    slot(initial) { const at = index++; return slots[at] ?? (slots[at] = { value: initial() }) },
    state(initial) { const slot = api.slot(() => typeof initial === 'function' ? initial() : initial); return [slot.value, next => { slot.value = typeof next === 'function' ? next(slot.value) : next }] },
    ref(initial) { return api.slot(() => ({ current: initial })).value },
    effect(effect, dependencies) {
      const slot = api.slot(() => ({ dependencies: undefined, cleanup: undefined }))
      if (!slot.value.dependencies || dependencies.some((value, at) => !Object.is(value, slot.value.dependencies[at]))) {
        slot.value.dependencies = dependencies
        pending.push(() => { slot.value.cleanup?.(); slot.value.cleanup = effect() })
      }
    },
    render() { index = 0; activeHarness = api; try { api.tree = render(api.props); return api.tree } finally { activeHarness = null } },
    flush() { while (pending.length) pending.shift()() },
    dispose() { slots.forEach(slot => slot.value?.cleanup?.()) },
  }
  api.render()
  return api
}
function picker({ cityCode = '', neighborhood = '', locale = 'bg', required = false, neighborhoodRequired = false } = {}) {
  const changes = [], Component = component(fakeReact)
  const parent = harness(Component, { cityCode, neighborhood, locale, required, neighborhoodRequired, onChange: patch => changes.push(patch) })
  const children = elements(parent.tree, node => typeof node.type === 'function')
  const city = children[0]
  const selected = harness(city.type, city.props)
  return { parent, selected, changes, children }
}
const input = h => elements(h.tree, node => node.props.role === 'combobox')[0]
const options = h => elements(h.tree, node => node.props.role === 'option')
const key = (h, value, extra = {}) => {
  const event = { key: value, preventDefault() { this.prevented = true }, stopPropagation() { this.stopped = true }, ...extra }
  input(h).props.onKeyDown(event)
  h.render()
  return event
}
const type = (h, value) => { input(h).props.onChange({ target: { value } }); h.render() }

test('city names rank exactly before prefixes and alphabetical region-only matches in BG and EN', () => {
  for (const locale of ['bg', 'en']) for (const query of ['София', 'Sofia', ' SOFIYA ', 'сОф', 'sof']) {
    assert.equal(locations.searchCities(query, locale)[0].code, '68134', `${locale}/${query}`)
  }
  assert.ok(locations.searchCities('София').length > 1, 'province matches stay available, below the city')
  assert.equal(locations.searchCities('Варна')[0].code, '10135', 'Kavarna and Varna-region towns must not outrank exact Varna')
  assert.equal(locations.searchCities('Шумен')[0].code, '83510')
  assert.equal(locations.searchCities('shumen', 'en')[0].code, '83510')
  const byala = locations.searchCities('Бяла')
  assert.equal(byala.filter(city => city.name === 'Бяла').length, 2)
  assert.ok(byala.slice(0, 2).every(city => city.name === 'Бяла'), 'both exact names outrank Byala Slatina/cherkva')
})

test('normalization supports accents, Cyrillic/transliteration, punctuation and whitespace without mutating canonical cities', () => {
  assert.equal(locations.normalizeLocationQuery('  ЗоНа Б–18  '), 'zona b 18')
  assert.equal(locations.normalizeLocationQuery('ЛЮЛИН  2'), 'lyulin 2')
  assert.equal(locations.normalizeLocationQuery('Крайморие'), 'kraymorie', 'Cyrillic й survives accent normalization')
  assert.equal(locations.searchCities('SÓFIA')[0].code, '68134')
  assert.equal(locations.searchCities('  ВЕЛИКО–ТЪРНОВО ')[0].name, 'Велико Търново')
  assert.deepEqual(locations.searchCities('not-a-real-city'), [])
  const before = JSON.stringify(locations.BULGARIAN_CITIES)
  locations.searchCities('София')
  assert.equal(JSON.stringify(locations.BULGARIAN_CITIES), before)
})

test('all 257 real cities remain reachable by their actual EKATTE, including duplicate names', () => {
  assert.equal(locations.searchCities('').length, 257)
  assert.equal(new Set(locations.searchCities('').map(city => city.code)).size, 257)
  for (const city of locations.BULGARIAN_CITIES) {
    assert.equal(locations.searchCities(city.code)[0].code, city.code)
    assert.ok(locations.searchCities(city.name).some(result => result.code === city.code))
    assert.ok(locations.searchCities(city.nameEn, 'en').some(result => result.code === city.code))
  }
})

for (const locale of ['bg', 'en']) {
  test(`${locale}: SSR exposes a compact labelled editable combobox, canonical value and preserved custom quarter`, () => {
    const html = renderToStaticMarkup(React.createElement(component(), { cityCode: '68134', neighborhood: 'Моят квартал', locale, required: true, onChange: () => {} }))
    assert.equal((html.match(/role="combobox"/g) || []).length, 2)
    assert.ok(html.includes(locale === 'bg' ? 'Град в България' : 'City in Bulgaria'))
    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /aria-autocomplete="list"/)
    assert.match(html, /aria-required="true"/)
    assert.match(html, /aria-labelledby=/)
    assert.ok(html.includes(locale === 'bg' ? 'София · обл. София' : 'Sofia · Sofiya'))
    assert.ok(html.includes('value="Моят квартал"'), 'unknown/custom quarter remains editable, not discarded')
    assert.ok(!html.includes('<details') && !html.includes('type="radio"'), 'no old nested disclosure/radio scrolling UI')
    assert.ok(!html.includes('role="listbox"'), 'closed picker does not render 257 unnecessary options')
  })
}

test('typing София directly exposes the real city first; Enter selects its identifier and resets the quarter', () => {
  const { selected: h, changes } = picker({ neighborhood: 'Old area' })
  input(h).props.onFocus(); h.render()
  type(h, 'София')
  assert.match(renderToStaticMarkup(options(h)[0]), /София · обл\./)
  assert.ok(options(h).length > 1)
  key(h, 'Enter')
  assert.deepEqual(changes, [{ city_ekatte: '68134', neighborhood: '' }])
  assert.equal(input(h).props['aria-expanded'], false)
})

test('delayed initial effects preserve an early Sofia query; only a real controlled city change resets the picker', () => {
  const previousDocument = globalThis.document
  globalThis.document = { addEventListener: () => {}, removeEventListener: () => {} }
  const { selected: h, changes } = picker()
  try {
    // Deliberately type before first-mount passive effects flush, as can occur
    // during a fast hydration interaction. The initial prop is still empty.
    type(h, 'София')
    assert.equal(input(h).props.value, 'София')
    h.flush(); h.render()
    assert.equal(input(h).props.value, 'София')
    assert.equal(input(h).props['aria-expanded'], true)
    assert.match(renderToStaticMarkup(options(h)[0]), /София · обл\./)
    key(h, 'Enter')
    assert.deepEqual(changes, [{ city_ekatte: '68134', neighborhood: '' }])

    // Real selection changes from the parent must still invalidate old query
    // and active-option state, rather than keeping stale city suggestions.
    type(h, 'Бургас')
    h.props = { ...h.props, value: '10135' }
    h.render(); h.flush(); h.render()
    assert.equal(input(h).props['aria-expanded'], false)
    assert.ok(input(h).props.value.startsWith('Варна'))
    assert.equal(input(h).props['aria-activedescendant'], undefined)
    assert.equal(changes.length, 1, 'external selection synchronization does not emit an extra change')
  } finally {
    h.dispose()
    globalThis.document = previousDocument
  }
})

test('ArrowDown/ArrowUp, active-descendant and Enter navigate actual filtered options without submitting typed text', () => {
  const { selected: h, changes } = picker({ locale: 'en' })
  type(h, 'Byala')
  assert.equal(input(h).props['aria-activedescendant'], undefined)
  assert.equal(key(h, 'ArrowDown').prevented, true)
  assert.equal(input(h).props['aria-activedescendant'], options(h)[0].props.id)
  assert.match(options(h)[0].props.className, /active/)
  key(h, 'ArrowDown')
  assert.equal(input(h).props['aria-activedescendant'], options(h)[1].props.id)
  key(h, 'ArrowUp')
  assert.equal(input(h).props['aria-activedescendant'], options(h)[0].props.id)
  key(h, 'Enter')
  assert.equal(changes.length, 1)
  assert.equal(locations.findCity(changes[0].city_ekatte).name, 'Бяла')
})

test('unknown text, no-match Enter and IME composition never create an invalid city or an accidental form submission', () => {
  const { parent, selected: h, changes, children } = picker()
  type(h, 'Invented City 99999')
  assert.equal(options(h).length, 0)
  assert.ok(elements(h.tree, node => node.props.role === 'status').length)
  assert.equal(key(h, 'Enter').prevented, true)
  assert.deepEqual(changes, [])
  children[0].props.onChange('made-up-code')
  assert.deepEqual(changes, [], 'parent callback independently checks EKATTE')
  type(h, 'Sofia')
  assert.equal(key(h, 'Enter', { nativeEvent: { isComposing: true } }).prevented, undefined)
  assert.deepEqual(changes, [])
  assert.ok(parent.tree)
})

test('click selection, selected aria state and every city option retain actual identifiers', () => {
  const { selected: h, changes } = picker({ cityCode: '68134' })
  input(h).props.onFocus(); h.render()
  assert.equal(options(h).length, 257)
  const chosen = options(h).filter(node => node.props['aria-selected'])
  assert.equal(chosen.length, 1)
  assert.match(renderToStaticMarkup(chosen[0]), /София/)
  for (const node of options(h)) assert.equal(node.props.tabIndex, -1, 'list items do not become hundreds of Tab stops')
  type(h, '02676')
  options(h)[0].props.onClick(); h.render()
  assert.deepEqual(changes, [{ city_ekatte: '02676', neighborhood: '' }])
})

test('Escape and forward/backward Tab close without selecting or stealing normal Tab traversal', () => {
  const { selected: h, changes } = picker({ cityCode: '68134' })
  type(h, 'Varna')
  const escape = key(h, 'Escape')
  assert.equal(escape.prevented, true)
  assert.equal(escape.stopped, true)
  assert.equal(input(h).props['aria-expanded'], false)
  assert.ok(input(h).props.value.startsWith('София'))
  for (const shiftKey of [false, true]) {
    type(h, 'Varna')
    assert.equal(key(h, 'Tab', { shiftKey }).prevented, undefined)
    assert.equal(input(h).props['aria-expanded'], false)
  }
  assert.deepEqual(changes, [])
})

test('opening focuses search, keyboard movement scrolls only the active option, and outside pointer dismisses safely', () => {
  const previousDocument = globalThis.document, listeners = new Map(), inside = {}, outside = {}
  let focused = 0, scrolled = 0
  globalThis.document = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name) } }
  const { selected: h, changes } = picker({ cityCode: '68134' })
  try {
    const root = elements(h.tree, node => node.props.className === 'checked-select')[0]
    root.props.ref.current = { contains: target => target === inside }
    input(h).props.ref.current = { focus: () => { focused++ } }
    h.flush()
    elements(h.tree, node => node.props.className === 'checked-select-toggle')[0].props.onClick()
    h.render(); h.flush()
    assert.ok(focused > 0)
    type(h, 'Sofia')
    options(h)[0].props.ref({ scrollIntoView: settings => { assert.deepEqual(settings, { block: 'nearest' }); scrolled++ } })
    key(h, 'ArrowDown'); h.flush()
    assert.equal(scrolled, 1)
    listeners.get('pointerdown')({ target: inside }); h.render()
    assert.equal(input(h).props['aria-expanded'], true)
    listeners.get('pointerdown')({ target: outside }); h.render()
    assert.equal(input(h).props['aria-expanded'], false)
    assert.deepEqual(changes, [])
  } finally {
    h.dispose()
    globalThis.document = previousDocument
  }
  assert.equal(listeners.size, 0, 'outside listener is removed on unmount')
})

test('filtering a scrolled picker resets both possible scroll surfaces so first-ranked Sofia is visible', () => {
  const previousDocument = globalThis.document
  globalThis.document = { addEventListener: () => {}, removeEventListener: () => {} }
  const { selected: h } = picker({ cityCode: '68134' })
  try {
    h.flush()
    input(h).props.onFocus(); h.render(); h.flush()
    const panel = { scrollTop: 8000 }, list = { scrollTop: 8000 }
    elements(h.tree, node => node.props.className === 'checked-select-panel')[0].props.ref.current = panel
    elements(h.tree, node => node.props.role === 'listbox')[0].props.ref.current = list
    type(h, 'София'); h.flush()
    assert.equal(panel.scrollTop, 0)
    assert.equal(list.scrollTop, 0)
    assert.match(renderToStaticMarkup(options(h)[0]), /София · обл\./)
  } finally {
    h.dispose()
    globalThis.document = previousDocument
  }
})

test('neighbourhoods search by BG or transliteration and custom text is preserved until city is deliberately changed', () => {
  const { parent, children, changes } = picker({ cityCode: '68134', neighborhood: 'Собствен квартал' })
  const customInput = elements(parent.tree, node => node.type === 'input')[0]
  assert.equal(customInput.props.value, 'Собствен квартал')
  customInput.props.onChange({ target: { value: 'Нов собствен квартал' } })
  assert.deepEqual(changes.shift(), { neighborhood: 'Нов собствен квартал' })
  const areas = harness(children[1].type, children[1].props)
  type(areas, 'mladost')
  assert.ok(options(areas).some(node => renderToStaticMarkup(node).includes('Младост 1')))
  assert.ok(options(areas).some(node => renderToStaticMarkup(node).includes('Друг —')))
  type(areas, 'ЛЮЛИН')
  assert.ok(options(areas).some(node => renderToStaticMarkup(node).includes('Люлин 1')))
  children[0].props.onChange('10135')
  assert.deepEqual(changes.shift(), { city_ekatte: '10135', neighborhood: '' })
  assert.deepEqual(locations.businessLocationFields('68134', ' Нов собствен квартал '), { city_ekatte: '68134', city: 'София', neighborhood: 'Нов собствен квартал' })
})

for (const locale of ['bg', 'en']) test(`${locale}: mandatory quarter is labelled, has no empty choice and still allows a missing custom quarter`, () => {
  const { parent, children } = picker({ cityCode: '68134', locale, required: true, neighborhoodRequired: true })
  const quarter = children[1]
  assert.equal(quarter.props.required, true)
  assert.doesNotMatch(quarter.props.label, /optional|незадължително/)
  assert.equal(quarter.props.options.some(option => option.value === ''), false)
  assert.ok(quarter.props.options.some(option => option.value === '__custom__'))
  const area = harness(quarter.type, quarter.props)
  assert.equal(input(area).props['aria-required'], true)
  quarter.props.onChange('__custom__'); parent.render()
  const customInput = elements(parent.tree, node => node.type === 'input')[0]
  assert.equal(customInput.props.required, true)
  assert.equal(customInput.props['aria-required'], true)
  const optional = picker({ cityCode: '68134', locale }).children[1]
  assert.ok(optional.props.options.some(option => option.value === ''), 'existing admin/location editors remain backward compatible')
  const noCity = picker({ locale, neighborhoodRequired: true })
  assert.equal(noCity.children.length, 1, 'choose the city before its quarters')
})
