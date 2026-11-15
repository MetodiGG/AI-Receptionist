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
test('nested navigation keeps the parent context accessible and places All and More after the photographic activity choices', () => {
  for (const locale of ['bg', 'en']) {
    const title = locale === 'en' ? 'Sport' : 'Спорт'
    const f = interactive({ locale, title })
    assert.equal(f.tree.type, 'section')
    assert.equal(f.tree.props['aria-label'], locale === 'en' ? 'Sport subcategories' : 'Подкатегории · Спорт')
    const headings = elements(f.tree, node => node.type === 'h3')
    assert.equal(headings.length, 1)
    assert.equal(headings[0].props.className, 'sr-only')
    assert.equal(headings[0].props.children, title)
    const list = elements(f.tree, node => node.type === 'ul')[0]
    const footer = elements(f.tree, node => node.props.className === 'discovery-subcategory-controls')
    assert.equal(footer.length, 1)
    const buttons = elements(footer[0], node => node.type === 'button')
    assert.deepEqual(buttons.map(node => node.props.className), ['discovery-subcategory-all', 'discovery-subcategory-more'])
    assert.equal(elements(list, node => node.type === 'button').length, 4)
    assert.equal(elements(footer[0], node => node.props.className === 'discovery-subcategory-option').length, 0)
    const more = buttons[1]
    assert.equal(more.props['aria-controls'], list.props.id)
    assert.equal(more.props['aria-expanded'], false)
    assert.equal(buttons[0].props.children, locale === 'en' ? 'All' : 'Всички')
    const html = renderToStaticMarkup(React.createElement(DiscoverySubcategories, { ...props, locale, title }))
    assert.ok(html.indexOf('discovery-subcategory-grid') < html.indexOf('discovery-subcategory-controls'))
    f.click('discovery-subcategory-more')
    assert.equal(elements(f.tree, node => node.props.className === 'discovery-subcategory-controls').length, 1)
    assert.equal(f.buttons().filter(node => node.props.className === 'discovery-subcategory-option').length, 5)
  }
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
test('photo controls wrap text beside a fixed image in an adaptive grid without horizontal scrolling', async () => {
  const css = await readFile(new URL('../app/discovery-subcategories.css', import.meta.url), 'utf8')
  assert.match(css, /grid-template-columns: repeat\(auto-fit,minmax\(min\(100%,216px\),1fr\)\)/)
  assert.match(css, /--subcategory-photo-size: 45px/)
  assert.match(css, /width: var\(--subcategory-photo-size\); height: var\(--subcategory-photo-size\)/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*font-size: 15px/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*flex-wrap: nowrap/)
  assert.match(css, /flex: 1 1 min-content; min-width: 0; max-width: 100%; white-space: normal/)
  assert.match(css, /min-height: 44px/)
  assert.match(css, /focus-visible \{ outline: 3px/)
  const nested = css.match(/\.discovery-subcategories \{([^}]+)\}/)?.[1] || ''
  assert.match(nested, /border-inline-start: 2px solid #d5b18b80/)
  assert.match(nested, /padding-inline-start: 12px/)
  assert.match(nested, /background: transparent/)
  assert.match(css, /\.discovery-subcategory-controls \{[^}]*display: flex;[^}]*justify-content: space-between/)
  assert.doesNotMatch(css, /grid-template-columns: repeat\([24],|\.discovery-subcategory-heading/)
  assert.doesNotMatch(css, /overflow-x: auto|white-space: nowrap|text-overflow: ellipsis|word-break: break-all/)
})
test('quick-choice child choices remain visually nested, with larger photographs and responsive grid columns', async () => {
  const css = await readFile(new URL('../app/quick-choice-home.css', import.meta.url), 'utf8')
  assert.match(css, /\.discovery-subcategories \{ --subcategory-photo-size:44px; --subcategory-option-padding:5px/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*flex-wrap:nowrap;[^}]*min-height:56px;[^}]*border-radius:999px;[^}]*font-size:17px/)
  assert.match(css, /\.discovery-subcategory-photo \{ flex-basis:var\(--subcategory-photo-size\); width:var\(--subcategory-photo-size\); height:var\(--subcategory-photo-size\)/)
  assert.match(css, /\.discovery-subcategory-grid \{ display:grid; grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,216px\),1fr\)\)/)
  assert.match(css, /\.discovery-subcategory-grid > li \{[^}]*min-width:0/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*border:1px solid transparent/)
  assert.match(css, /\.discovery-subcategory-option\[aria-pressed="true"\] \{[^}]*background-color:/)
  const option = css.match(/\.discovery-subcategory-option \{([^}]*)\}/)?.[1] || ''
  assert.doesNotMatch(option, /(?:^|;)\s*height\s*:/)
})
test('selected subcategories use unframed capsules and native pressed states without generated checkmarks, including All', async () => {
  const css = await readFile(new URL('../app/discovery-subcategories.css', import.meta.url), 'utf8')
  const quick = await readFile(new URL('../app/quick-choice-home.css', import.meta.url), 'utf8')
  assert.match(css, /\.discovery-subcategory-photo \{[^}]*align-self: flex-start/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*border-radius: 999px/)
  assert.match(css, /\.discovery-subcategory-all,\.discovery-subcategory-more \{[^}]*border-radius: 999px/)
  for (const sourceCss of [css, quick]) {
    assert.doesNotMatch(sourceCss, /\.discovery-subcategor(?:y-(?:option|all|more)|ies button)[^,{]*::(?:before|after)/)
    const selected = [...sourceCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(match => /\.discovery-subcategory-(?:option|all|more)/.test(match[1]))
    for (const [, selector, declarations] of selected) {
      for (const shadow of declarations.matchAll(/(?:^|;)\s*box-shadow:\s*([^;]+)/g)) assert.equal(shadow[1].trim(), 'none', selector)
      for (const border of declarations.matchAll(/(?:^|;)\s*border-color:\s*([^;]+)/g)) assert.equal(border[1].trim(), 'transparent', selector)
    }
  }
  const html = renderToStaticMarkup(React.createElement(DiscoverySubcategories, { ...props, selected: 'folk' }))
  assert.match(html, /aria-pressed="true"[^>]*><img[^>]*sx-bulgarian-folk-group/)
  assert.doesNotMatch(html, /✓|✔|check-badge|selected-check/)
  const all = renderToStaticMarkup(React.createElement(DiscoverySubcategories, props))
  assert.match(all, /class="discovery-subcategory-all" aria-pressed="true"/)
  assert.doesNotMatch(all, /✓|✔|check-badge|selected-check/)
})
test('subcategory feedback is pointer-aware, explicitly eased, keyboard-visible and reduced-motion safe without moving controls', async () => {
  const base = await readFile(new URL('../app/discovery-subcategories.css', import.meta.url), 'utf8')
  const quick = await readFile(new URL('../app/quick-choice-home.css', import.meta.url), 'utf8')
  assert.match(base, /transition: background-color 220ms ease, color 220ms ease/)
  assert.doesNotMatch(base, /transition:\s*all|animation:/)
  assert.match(base, /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*\.discovery-subcategory-option:hover:not\(:disabled\)/)
  assert.match(quick, /@media \(hover:hover\) and \(pointer:fine\)[\s\S]*\.discovery-subcategories :is\([^}]+\):hover:not\(:disabled\)/)
  assert.match(base, /\.discovery-subcategory-option:active:not\(:disabled\)[^}]+background-color:/)
  const pressed = base.match(/\.discovery-subcategory-option:active[^}]+\}/)?.[0]
  assert.doesNotMatch(pressed, /transform|padding|border-width|font-size/)
  assert.match(base, /focus-visible \{ outline: 3px solid #984419; outline-offset: 3px/)
  assert.match(base, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.discovery-subcategories :is\(button,svg\) \{ transition: none/)
  assert.match(quick, /@media \(prefers-reduced-motion:reduce\)[\s\S]*\.customer-home.quick-choice \.discovery-subcategories :is\(button,svg\) \{ transition:none/)
  assert.doesNotMatch(base, /text-decoration:\s*underline/)
  assert.match(base, /\.discovery-subcategory-more\[aria-expanded="true"\] svg \{ transform: rotate\(180deg\)/)
  const selected = base.match(/\.discovery-subcategory-option\[aria-pressed="true"\] \{([^}]+)\}/)?.[1]
  assert.match(selected, /background-color:/)
  assert.doesNotMatch(selected, /background:|background-image:/)
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
