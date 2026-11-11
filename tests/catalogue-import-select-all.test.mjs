import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { normalizeImportedServices } from '../lib/onboarding-catalogue-draft.mjs'

// Run the real client component's handlers with deterministic hook/DOM refs.
// No network, account, catalogue mutation or booking is involved.
const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/catalogue-import-review.js'
const source = await readFile(new URL(filename, import.meta.url), 'utf8')
const { code } = await transform(source, {
  filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
})
let active
const hooks = {
  ...React,
  useState: initial => active.state(initial),
  useRef: initial => active.ref(initial),
  useEffect: (effect, dependencies) => active.effect(effect, dependencies),
}
const documentFixture = { activeElement: { isConnected: true, focus() {} } }
const compiled = { exports: {} }
new Function('require', 'module', 'exports', 'document', code)(name => {
  if (name === 'react') return hooks
  if (name === '../lib/dialog-focus.mjs') return { containDialogTab: () => {} }
  return require(name)
}, compiled, compiled.exports, documentFixture)
const { CatalogueImportReview } = compiled.exports

function elements(node, predicate, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, result))
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}
function fixture(length = 40, limit = 40) {
  return {
    business: { id: 'fictional-import-qa', name: 'Fictional service import', address: 'Fictional source address' },
    serviceLimit: limit,
    services: Array.from({ length }, (_, index) => ({ id: `source-${index}`, name: `Actual source service ${index}`, price: index === 0 ? '0.00' : `${index}.25`, duration_min: '30', catalogueHint: { priceLabel: `${index} EUR`, requiresPriceConfirmation: false } })),
  }
}
function harness(props = {}) {
  const slots = [], pending = [], confirmed = [], cancelled = []
  let index = 0
  const api = {
    props: { draft: fixture(), locale: 'bg', replace: true, onConfirm: values => confirmed.push(values), onCancel: () => cancelled.push(true), ...props },
    confirmed, cancelled, tree: null,
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
    render() {
      index = 0; active = api
      try { api.tree = CatalogueImportReview(api.props) } finally { active = null }
      for (const element of elements(api.tree, node => node.props.ref)) {
        if (!element.props.ref.current) element.props.ref.current = element.type === 'dialog' ? { showModal() {}, close() {} } : { indeterminate: false }
      }
      while (pending.length) pending.shift()()
      return api.tree
    },
    find(predicate) { return elements(api.tree, predicate) },
    checkboxes() { return api.find(node => node.type === 'input' && node.props.type === 'checkbox') },
    bulk() { return api.checkboxes()[0] },
    rows() { return api.checkboxes().slice(1) },
    selected() { return api.rows().flatMap((node, at) => node.props.checked ? [at] : []) },
    change(node) { assert.equal(Boolean(node.props.disabled), false, 'test must not activate a disabled input'); node.props.onChange({ target: { checked: !node.props.checked } }); api.render() },
    toggleAll() { api.change(api.bulk()) },
    toggle(at) { api.change(api.rows()[at]) },
    confirm() { const button = api.find(node => node.props.className === 'primary-button')[0]; assert.equal(button.props.disabled, false); button.props.onClick(); api.render() },
    text() { return api.find(node => node.type === 'strong').map(node => node.props.children) },
    dispose() { slots.forEach(slot => slot.value?.cleanup?.()) },
  }
  api.render()
  return api
}

for (const locale of ['bg', 'en']) {
  test(`${locale}: forty source services can be deselected and selected in one action with accurate native mixed state`, () => {
    const h = harness({ locale })
    assert.equal(h.rows().length, 40)
    assert.deepEqual(h.selected(), Array.from({ length: 40 }, (_, index) => index))
    assert.equal(h.bulk().props.checked, true)
    assert.equal(h.bulk().props['aria-checked'], true)
    assert.equal(h.bulk().props.ref.current.indeterminate, false)
    assert.ok(h.text().includes(locale === 'en' ? 'Deselect all' : 'Изчисти избора'))
    h.toggleAll()
    assert.deepEqual(h.selected(), [])
    assert.equal(h.bulk().props.checked, false)
    assert.ok(h.text().includes(locale === 'en' ? 'Select all services' : 'Избери всички услуги'))
    assert.equal(h.find(node => node.props.className === 'primary-button')[0].props.disabled, true)
    h.toggle(7)
    assert.deepEqual(h.selected(), [7])
    assert.equal(h.bulk().props['aria-checked'], 'mixed')
    assert.equal(h.bulk().props.ref.current.indeterminate, true)
    h.toggleAll()
    assert.equal(h.selected().length, 40)
    assert.equal(h.bulk().props.ref.current.indeterminate, false)
    h.confirm()
    assert.deepEqual(h.confirmed, [Array.from({ length: 40 }, (_, index) => index)])
    assert.equal(h.bulk().props['aria-controls'], h.find(node => node.type === 'ul')[0].props.id)
    h.dispose()
  })

  test(`${locale}: oversized menus explicitly respect the configured limit and preserve manually chosen later services`, () => {
    const h = harness({ locale, draft: fixture(43) })
    assert.deepEqual(h.selected(), [])
    assert.ok(h.text().includes(locale === 'en' ? 'Select up to 40' : 'Избери до 40'))
    h.toggle(42)
    h.toggle(0)
    h.toggleAll()
    assert.equal(h.selected().length, 40)
    assert.ok(h.selected().includes(42), 'bulk fill must not erase a specific later selection')
    assert.equal(h.rows()[40].props.disabled, true, 'unselected rows are disabled at the real limit')
    assert.equal(h.rows()[42].props.disabled, false, 'chosen rows remain removable')
    h.confirm()
    assert.deepEqual(h.confirmed[0], [...Array.from({ length: 39 }, (_, index) => index), 42])
    h.toggleAll()
    assert.deepEqual(h.selected(), [])
    assert.ok(h.rows().every(node => !node.props.disabled))
    h.dispose()
  })
}

test('empty menus keep bulk and confirmation disabled without replacing or submitting a draft', () => {
  const h = harness({ draft: fixture(0) })
  assert.equal(h.bulk().props.disabled, true)
  assert.equal(h.bulk().props['aria-checked'], false)
  assert.equal(h.bulk().props.ref.current.indeterminate, false)
  assert.deepEqual(h.rows(), [])
  assert.equal(h.find(node => node.props.className === 'primary-button')[0].props.disabled, true)
  assert.deepEqual(h.confirmed, [])
  h.find(node => node.props.className === 'secondary-button')[0].props.onClick()
  assert.deepEqual(h.cancelled, [true])
  assert.deepEqual(h.confirmed, [])
  h.dispose()
})

test('custom limit, replacement warning, qualified prices and source order remain authoritative', () => {
  const draft = fixture(6, 3)
  draft.services[5] = { id: 'source-qualified', name: 'Qualified actual source', price: '99', currency:'EUR',price_details:{kind:'from',unit:'посещение'},duration_min: '45', catalogueHint: { priceLabel: 'от 99 EUR / посещение', description: 'Само при публикуваните условия.', requiresPriceConfirmation: true } }
  const before = structuredClone(draft)
  const h = harness({ draft })
  assert.ok(h.find(node => node.props.className === 'catalogue-replace-note').length)
  assert.ok(h.text().includes('Избери до 3'))
  h.toggle(5); h.toggle(0); h.toggleAll(); h.confirm()
  assert.deepEqual(h.confirmed[0], [0, 1, 5])
  const imported = normalizeImportedServices(draft.services, h.confirmed[0])
  assert.deepEqual(imported.map(service => service.name), ['Actual source service 0', 'Actual source service 1', 'Qualified actual source'])
  assert.equal(imported[0].price, '0.00')
  assert.equal(imported[2].price, '99', 'known amounts no longer require re-entry')
  assert.deepEqual(imported[2].price_details,{kind:'from',unit:'посещение'},'the populated amount does not become a fixed quote')
  assert.equal(imported[2].catalogueHint.description, draft.services[5].catalogueHint.description)
  assert.deepEqual(draft, before, 'only selection indexes change, never actual source facts or identifiers')
  h.dispose()
})

test('bulk selection remains a semantic checkbox inside the existing trapped modal and cannot bypass explicit confirmation', () => {
  assert.match(source, /type="checkbox" checked=\{allSelected\} aria-checked=\{mixed\?'mixed':allSelected\}/)
  assert.match(source, /bulk\.current\.indeterminate=mixed/)
  assert.match(source, /onKeyDown=\{event=>containDialogTab\(event,dialog\.current\)\}/)
  assert.doesNotMatch(source, /fetch\(|supabase|onConfirm\([^)]*draft\.services/)
})

test('published price conditions remain available without any per-price confirmation flag', () => {
  const draft = fixture(1)
  draft.services[0].description = 'Цената е за едно посещение.'
  delete draft.services[0].catalogueHint.requiresPriceConfirmation
  const h = harness({ draft })
  assert.equal(h.find(node => node.type === 'p' && node.props.children === draft.services[0].description).length, 1)
  assert.equal(h.find(node => node.props.className === 'catalogue-import-conditions').length, 1)
  assert.doesNotMatch(source, /Провери цените|Уточни точната си цена/)
  assert.doesNotMatch(source, /requiresPriceConfirmation/)
  h.dispose()
})
