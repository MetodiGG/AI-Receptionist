import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await readFile(new URL('../components/discovery-subcategories.js', import.meta.url), 'utf8')
const { code } = await transform(source, { filename: 'discovery-subcategories.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
function loadComponent(react = React) {
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name === 'react' ? react : name === './icon' ? { Icon: () => null } : require(name), module, module.exports)
  return module.exports.DiscoverySubcategories
}
const DiscoverySubcategories = loadComponent()
const options = [
  ['folk', 'Народни танци', 'Folk dance', 'sx-bulgarian-folk-group'],
  ['yoga', 'Йога', 'Yoga', 'yoga-class'],
  ['pilates', 'Пилатес и реформър', 'Pilates and reformer', 'reformer-pilates'],
  ['boxing', 'Бокс и кикбокс', 'Boxing and kickboxing', 'boxing'],
  ['tennis', 'Тенис', 'Tennis', 'tennis'],
].map(([id,bg,en,photo]) => ({ id, category: 'fitness', bg, en, label: bg, photo: `/service-photos/${photo}-v1.webp`, count: 1 }))
const props = { category: 'fitness', title: 'Спорт', options, onSelect() {} }
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
function interactive(patch = {}) {
  const slots = [], calls = []; let index = 0
  const component = loadComponent({ ...React, useId: () => 'subcategory-qa', useEffect() {}, useState(initial) { const at = index++; if (!(at in slots)) slots[at] = initial; return [slots[at], value => { slots[at] = typeof value === 'function' ? value(slots[at]) : value }] } })
  const current = { ...props, onSelect: id => calls.push(id), ...patch }
  const f = { tree: null, calls, render() { index = 0; f.tree = component(current) }, buttons() { return elements(f.tree, node => node.type === 'button') }, click(className) { f.buttons().find(node => node.props.className === className).props.onClick(); f.render() } }
  f.render(); return f
}

test('photo subcategories render only parent choices with positive evidence in both languages', () => {
  for (const locale of ['bg','en']) {
    const html = renderToStaticMarkup(React.createElement(DiscoverySubcategories, { ...props, locale, options: [...options, { ...options[0], id: 'empty', count: 0 }, { ...options[0], id: 'wrong-parent', category: 'hair' }, { ...options[0], id: 'remote-image', photo: 'https://example.com/wrong.jpg' }] }))
    assert.match(html, /class="discovery-subcategories"/)
    assert.match(html, /width="40" height="40" alt="" loading="lazy" decoding="async"/)
    assert.match(html, /aria-pressed="true"/)
    assert.match(html, /aria-expanded="false"/)
    assert.equal((html.match(/class="discovery-subcategory-option"/g) || []).length, 4)
    assert.ok(html.includes(locale === 'en' ? 'Folk dance' : 'Народни танци'))
    assert.doesNotMatch(html, /example\.com|wrong-parent|remote-image|>empty<|<svg|<canvas/)
  }
})
test('More and Less operate locally and selecting a photograph submits its actual stable identifier', () => {
  const f = interactive()
  assert.equal(f.buttons().filter(node => node.props.className === 'discovery-subcategory-option').length, 4)
  f.click('discovery-subcategory-more')
  assert.equal(f.buttons().filter(node => node.props.className === 'discovery-subcategory-option').length, 5)
  assert.equal(f.buttons().find(node => node.props.className === 'discovery-subcategory-more').props['aria-expanded'], true)
  f.buttons().filter(node => node.props.className === 'discovery-subcategory-option')[4].props.onClick()
  assert.deepEqual(f.calls, ['tennis'])
  f.click('discovery-subcategory-more'); f.click('discovery-subcategory-all')
  assert.deepEqual(f.calls, ['tennis',''])
})
test('a restored selection beyond the first four stays visible without forcing an expanded panel', () => {
  const html = renderToStaticMarkup(React.createElement(DiscoverySubcategories, { ...props, selected: 'tennis' }))
  assert.match(html, /aria-pressed="true"[^>]*><img[^>]*tennis-v1.webp/)
  assert.equal((html.match(/class="discovery-subcategory-option"/g) || []).length, 4)
  assert.match(html, /aria-expanded="false"/)
})
test('empty categories do not create decorative panels; retained filters remain clearable after no matches', () => {
  assert.equal(renderToStaticMarkup(React.createElement(DiscoverySubcategories, { ...props, category: '' })), '')
  assert.equal(renderToStaticMarkup(React.createElement(DiscoverySubcategories, { ...props, options: [] })), '')
  const html = renderToStaticMarkup(React.createElement(DiscoverySubcategories, { ...props, options: [], selected: 'folk', selectedLabel: 'Народни танци' }))
  assert.ok(html.includes('Народни танци'))
  assert.match(html, /discovery-subcategory-all/)
  assert.doesNotMatch(html, /discovery-subcategory-grid/)
})
test('loading prevents duplicate picks and failed photos never become unrelated images or emojis', () => {
  const html = renderToStaticMarkup(React.createElement(DiscoverySubcategories, { ...props, loading: true }))
  assert.match(html, /aria-busy="true"/)
  assert.equal((html.match(/ disabled=""/g) || []).length, 5)
  assert.match(source, /onError=\{\(\) => setFailed\(src\)\}/)
  assert.match(source, /is-unavailable" aria-hidden="true"/)
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|https?:\/\/|getCurrentPosition|calendar|emoji-/)
})
test('photo controls wrap labels without horizontal scrolling and retain touch and focus affordances', async () => {
  const css = await readFile(new URL('../app/discovery-subcategories.css', import.meta.url), 'utf8')
  assert.match(css, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(css, /width: 40px; height: 40px/)
  assert.match(css, /flex-wrap: wrap/)
  assert.match(css, /flex: 1 1 min-content; min-width: 0; max-width: 100%; white-space: normal/)
  assert.match(css, /min-height: 44px/)
  assert.match(css, /focus-visible \{ outline: 3px/)
  assert.doesNotMatch(css, /overflow-x: auto|white-space: nowrap|text-overflow: ellipsis|word-break: break-all/)
})
test('public search and its unavailable fallback remove bottom cards but keep header partner access', async () => {
  const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
  for (const file of ['components/discovery-search.js','components/discovery-page.js']) assert.doesNotMatch(await read(file), /DiscoveryHomeBottom|discovery-partner-entry|discovery-business-cta/)
  const nav = await read('components/marketing-navigation.js')
  assert.match(nav, /Become GoRez Partner.*Стани GoRez партньор/)
  assert.match(nav, /Active GoRez partners.*Активни GoRez партньори/)
  const search = await read('components/discovery-search.js')
  assert.ok(search.indexOf('title={homeCopy.categories}') < search.indexOf('<DiscoverySubcategories'))
  assert.ok(search.indexOf('<DiscoverySubcategories') < search.indexOf('<DiscoveryHomeBusinesses'))
  assert.match(search, /input\.subcategory !== data\.intent\?\.subcategory/)
  assert.match(search, /subcategoryScope\.current === facetKey/)
})
