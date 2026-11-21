import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as categories from '../lib/discovery/categories.mjs'
import * as home from '../lib/discovery/home.mjs'
import * as inlineCopy from '../lib/discovery/inline-copy.mjs'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const sources = new Map()
async function compile(name) {
  const filename = `components/${name}.js`
  const source = await readFile(new URL('../' + filename, import.meta.url), 'utf8')
  sources.set(name, source)
  return transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
}
const compiled = new Map(await Promise.all(['inline-category-grid', 'discovery-subcategories'].map(async name => [name, await compile(name)])))
function load(name, react = React) {
  const module = { exports: {} }, stubs = {
    react, './icon': { Icon: ({ name }) => React.createElement('svg', { 'data-icon': name, 'aria-hidden': true }) },
    '../lib/discovery/categories.mjs': categories, '../lib/discovery/home.mjs': home,
    '../lib/discovery/inline-copy.mjs': inlineCopy,
  }
  new Function('require', 'module', 'exports', compiled.get(name).code)(name => Object.hasOwn(stubs, name) ? stubs[name] : require(name), module, module.exports)
  return module.exports
}
const { InlineCategoryGrid } = load('inline-category-grid')
const { DiscoverySubcategories } = load('discovery-subcategories')
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const directReact = { ...React, useId: () => 'inline-qa', useState: initial => [initial, () => {}], useEffect() {} }
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
const classed = (tree, className) => elements(tree, node => node.props.className?.split(' ').includes(className))
const options = Array.from({ length: 8 }, (_, index) => ({ id: `fitness-real-${index}`, category: 'fitness', bg: `Реална услуга с пълно име ${index}`, en: `Actual service with full name ${index}`, photo: '/service-photos/yoga-class-v1.webp', count: index === 7 ? 314 : index + 1 }))

for (const locale of ['bg', 'en']) test(`${locale}: fourteen persistent category tiles use full taxonomy names, existing photos and exact identifiers`, () => {
  const calls = [], Component = load('inline-category-grid', directReact).InlineCategoryGrid
  const tree = Component({ locale, category: 'barber', onSelect: id => calls.push(id) })
  const buttons = classed(tree, 'inline-category-option')
  assert.equal(buttons.length, home.HOME_CATEGORY_IDS.length)
  assert.equal(buttons.filter(button => button.props['aria-pressed']).length, 1)
  for (const [index, button] of buttons.entries()) {
    assert.equal(classed(button, 'inline-category-label')[0].props.children, categories.categoryById(home.HOME_CATEGORY_IDS[index])[locale])
    button.props.onClick()
  }
  assert.deepEqual(calls, home.HOME_CATEGORY_IDS)
  buttons[3].props.onClick()
  assert.equal(calls.at(-1), 'barber', 'the parent, not the presentation component, owns deselection')
  const html = render(InlineCategoryGrid, { locale, category: 'barber', onSelect() {} })
  assert.equal((html.match(/class="inline-category-option"/g) || []).length, 14)
  assert.equal((html.match(/class="inline-category-photo"/g) || []).length, 14)
  assert.equal((html.match(/class="inline-category-photo-frame"/g) || []).length, 14)
  assert.ok(html.includes(categories.categoryById('barber')[locale]))
  assert.match(html, /\/category-photos\/hair-v2\.webp/)
  assert.doesNotMatch(html, /guide-|home-rail|aria-expanded|data-icon|tabindex|Back|Назад/)
})

for (const locale of ['bg', 'en']) test(`${locale}: inline children show every evidence-backed count, All first, full names and clear-category action`, () => {
  const calls = [], cleared = [], Component = load('discovery-subcategories', directReact).DiscoverySubcategories
  const supplied = [...options,
    { ...options[0], id: 'zero-count', count: 0 },
    { ...options[0], id: 'negative-count', count: -1 },
    { ...options[0], id: 'missing-count', count: undefined },
    { ...options[0], id: 'wrong-parent', category: 'hair' },
    { ...options[0], id: 'wrong-photo', photo: '/unrelated/example.webp' },
  ]
  const before = structuredClone(supplied)
  const tree = Component({ category: 'fitness', title: 'Do not use shortened title', options: supplied, locale, selected: options[7].id, inline: true, onSelect: id => calls.push(id), onClearCategory: () => cleared.push(true) })
  const buttons = classed(tree, 'inline-service-tile'), copy = inlineCopy.INLINE_DISCOVERY_COPY[locale]
  assert.equal(buttons.length, options.length + 1)
  assert.ok(buttons[0].props.className.includes('inline-service-all'))
  assert.equal(classed(buttons[0], 'inline-service-label')[0].props.children, copy.all)
  assert.equal(classed(buttons[0], 'inline-service-count').length, 0)
  assert.equal(elements(buttons[0], node => node.type === 'img').length, 0)
  assert.equal(elements(buttons[0], node => typeof node.type === 'function').length, 0, 'All has no fabricated photographic slot')
  assert.equal(classed(buttons[0], 'inline-service-photo-frame').length, 0)
  assert.equal(classed(tree, 'inline-service-photo-frame').length, options.length)
  assert.equal(buttons.filter(button => button.props['aria-pressed']).length, 1)
  assert.equal(classed(tree, 'inline-selected-parent')[0].props.children[1].props.children, categories.categoryById('fitness')[locale])
  assert.equal(elements(tree, node => node.type === 'h2')[0].props.children, copy.services)
  assert.deepEqual(classed(tree, 'inline-service-count').map(node => node.props.children), options.map(option => option.count))
  assert.equal(classed(tree, 'inline-service-count')[0].props['aria-label'], `1 ${copy.business}`)
  assert.deepEqual(classed(tree, 'inline-service-label').slice(1).map(node => node.props.children), options.map(option => option[locale]))
  for (const button of buttons) button.props.onClick()
  assert.deepEqual(calls, ['', ...options.map(option => option.id)])
  const clear = classed(tree, 'inline-selected-parent')[0]
  assert.equal(clear.type, 'button', 'the complete photo/name chip is a keyboard-accessible clear control')
  assert.equal(clear.props['aria-label'], `${copy.clearCategory} · ${categories.categoryById('fitness')[locale]}`)
  assert.equal(elements(tree, node => node.type === 'button' && node.props.onClick === clear.props.onClick).length, 1, 'only one category-clear control is rendered')
  assert.equal(elements(clear, node => typeof node.type === 'function' && node.props.name === 'close').length, 1)
  assert.equal(classed(tree, 'inline-category-clear').length, 0)
  clear.props.onClick()
  assert.deepEqual(cleared, [true])
  assert.deepEqual(supplied, before)
  const html = render(DiscoverySubcategories, { category: 'fitness', options: supplied, locale, inline: true, onSelect() {}, onClearCategory() {} })
  assert.match(html, /class="discovery-subcategories is-inline"/)
  assert.match(html, /class="inline-service-count" aria-label="314 /)
  assert.doesNotMatch(html, /subcategory-more|Show less|More \(|По-малко|Още \(|zero-count|negative-count|missing-count|wrong-parent|wrong-photo/)
})

test('loading has one real status, inert placeholders and usable All/known choices without invented counts', () => {
  const Component = load('discovery-subcategories', directReact).DiscoverySubcategories
  for (const choices of [[], options]) {
    const calls = []
    const tree = Component({ category: 'fitness', options: choices, inline: true, loading: true, onSelect: id => calls.push(id), onClearCategory() {} })
    assert.equal(elements(tree, node => node.props.role === 'status').length, 1)
    const skeleton = classed(tree, 'inline-services-skeleton')[0]
    assert.equal(skeleton.props['aria-hidden'], 'true')
    assert.equal(elements(skeleton, node => ['button', 'a', 'input'].includes(node.type)).length, 0)
    assert.equal(classed(skeleton, 'inline-service-count').length, 0)
    const buttons = classed(tree, 'inline-service-tile')
    assert.equal(buttons.length, choices.length + 1)
    assert.ok(buttons.every(button => !button.props.disabled))
    buttons[0].props.onClick()
    assert.deepEqual(calls, [''])
    assert.deepEqual(classed(tree, 'inline-service-count').map(node => node.props.children), choices.map(option => option.count))
  }
})

test('settled empty inline menus and invalid parents return nothing, including a stale retained child', () => {
  for (const category of ['', 'unknown-category', 'fitness']) {
    assert.equal(render(DiscoverySubcategories, { category, options: [], selected: 'fitness-retained', selectedLabel: 'Old selection', inline: true, onSelect() {}, onClearCategory() {} }), '')
  }
})

test('the default non-home menu retains its collapsed More/All behavior and loading protection', () => {
  const html = render(DiscoverySubcategories, { category: 'fitness', title: 'Sport', options, loading: true, onSelect() {} })
  assert.equal((html.match(/class="discovery-subcategory-option"/g) || []).length, 4)
  assert.match(html, /class="discovery-subcategory-more"/)
  assert.match(html, /class="discovery-subcategory-all"/)
  assert.equal((html.match(/ disabled=""/g) || []).length, 5)
  assert.doesNotMatch(html, /is-inline|inline-service-tile|inline-category-clear/)
  for (const source of sources.values()) assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|getCurrentPosition|https?:\/\//)
})
