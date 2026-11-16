import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { subcategoriesForCategory } from '../lib/discovery/subcategories.mjs'

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
  const slots = [], calls = [], effects = [], pendingEffects = []; let index = 0, effectIndex = 0
  const component = loadComponent({ ...React, useId: () => 'subcategory-qa', useEffect(callback, dependencies) {
    const at = effectIndex++, previous = effects[at]
    if (!previous || dependencies.some((value, offset) => !Object.is(value, previous.dependencies[offset]))) {
      effects[at] = { callback, dependencies, cleanup: previous?.cleanup }
      pendingEffects.push(at)
    }
  }, useState(initial) { const at = index++; if (!(at in slots)) slots[at] = initial; return [slots[at], value => { slots[at] = typeof value === 'function' ? value(slots[at]) : value }] } })
  const current = { ...props, onSelect: id => calls.push(id), ...patch }
  const f = { tree: null, calls, render() { index = 0; effectIndex = 0; f.tree = component(current) }, buttons() { return elements(f.tree, node => node.type === 'button') }, click(className) { f.buttons().find(node => node.props.className === className).props.onClick(); f.render() }, flushEffects(browser = {}) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
    Object.defineProperty(globalThis, 'window', { configurable: true, value: browser })
    try {
      for (const at of pendingEffects.splice(0)) {
        effects[at].cleanup?.()
        effects[at].cleanup = effects[at].callback()
      }
    } finally { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window }
    f.render()
  }, unmount() { for (const effect of effects) effect.cleanup?.() } }
  f.render(); return f
}

test('responsive collapsed choices hydrate from four to six on desktop, preserve the selected identifier on resize and clean up the media listener', () => {
  for (const locale of ['bg', 'en']) {
    const actualOptions = subcategoriesForCategory('fitness', locale).map(option => ({ ...option, count: 1 }))
    assert.ok(actualOptions.length > 6)
    const selected = actualOptions.at(-1), f = interactive({ locale, options: actualOptions, selected: selected.id })
    const choices = () => f.buttons().filter(node => node.props.className === 'discovery-subcategory-option')
    const labels = () => choices().map(node => elements(node, child => child.type === 'span')[0].props.children)
    assert.equal(choices().length, 4, 'server and first client render share the same safe initial cap')
    const listeners = new Set(), media = { matches: true, addEventListener(type, callback) { assert.equal(type, 'change'); listeners.add(callback) }, removeEventListener(type, callback) { assert.equal(type, 'change'); assert.ok(listeners.delete(callback)) } }
    f.flushEffects({ matchMedia(query) { assert.equal(query, '(min-width: 760px)'); return media } })
    assert.equal(listeners.size, 1)
    assert.equal(choices().length, 6)
    assert.deepEqual(labels(), [...actualOptions.slice(0, 5), selected].map(option => option[locale] || option.label))
    const more = () => f.buttons().find(node => node.props.className === 'discovery-subcategory-more')
    const moreLabel = () => more().props.children[0]
    assert.equal(moreLabel(), locale === 'en' ? `More (${actualOptions.length - 6})` : `Още (${actualOptions.length - 6})`)
    assert.equal(choices().filter(node => node.props['aria-pressed']).length, 1)
    media.matches = false; for (const listener of listeners) listener({ matches: false }); f.render()
    assert.equal(choices().length, 4, 'crossing below 760px restores the mobile cap')
    assert.deepEqual(labels(), [...actualOptions.slice(0, 3), selected].map(option => option[locale] || option.label))
    assert.equal(moreLabel(), locale === 'en' ? `More (${actualOptions.length - 4})` : `Още (${actualOptions.length - 4})`)
    choices().at(-1).props.onClick()
    assert.deepEqual(f.calls, [selected.id], 'resizing never changes the real identifier submitted by a selected photo')
    f.click('discovery-subcategory-more')
    assert.equal(choices().length, actualOptions.length)
    assert.equal(more().props['aria-expanded'], true)
    assert.equal(moreLabel(), locale === 'en' ? 'Show less' : 'По-малко')
    media.matches = true; for (const listener of listeners) listener({ matches: true }); f.render()
    assert.equal(choices().length, actualOptions.length, 'a deliberate expansion remains expanded across resize')
    f.click('discovery-subcategory-more')
    assert.equal(choices().length, 6)
    f.click('discovery-subcategory-all')
    assert.deepEqual(f.calls, [selected.id, ''])
    f.unmount()
    assert.equal(listeners.size, 0)
  }
})

test('without matchMedia a mounted browser retains four truthful choices and the working More action', () => {
  const f = interactive()
  f.flushEffects()
  assert.equal(f.buttons().filter(node => node.props.className === 'discovery-subcategory-option').length, 4)
  f.click('discovery-subcategory-more')
  assert.equal(f.buttons().filter(node => node.props.className === 'discovery-subcategory-option').length, 5)
  f.unmount()
})

test('desktop short menus show only their real choices and keep All without a fabricated sixth item or More count', () => {
  for (const locale of ['bg', 'en']) {
    const f = interactive({ locale })
    f.flushEffects({ matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) })
    assert.equal(f.buttons().filter(node => node.props.className === 'discovery-subcategory-option').length, options.length)
    const footer = elements(f.tree, node => node.props.className === 'discovery-subcategory-controls')[0]
    const controls = elements(footer, node => node.type === 'button')
    assert.deepEqual(controls.map(node => node.props.className), ['discovery-subcategory-all'])
    assert.equal(controls[0].props['aria-pressed'], true)
    f.unmount()
  }
})

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
test('nested navigation keeps the parent context accessible and places More before All after the photographic activity choices', () => {
  for (const locale of ['bg', 'en']) {
    const title = locale === 'en' ? 'Sport' : 'Спорт'
    const f = interactive({ locale, title })
    assert.equal(f.tree.type, 'section')
    assert.equal(f.tree.props.lang, locale, 'native hyphenation uses the visible label language')
    assert.equal(f.tree.props['aria-label'], locale === 'en' ? 'Sport subcategories' : 'Подкатегории · Спорт')
    const headings = elements(f.tree, node => node.type === 'h3')
    assert.equal(headings.length, 1)
    assert.equal(headings[0].props.className, 'sr-only')
    assert.equal(headings[0].props.children, title)
    const list = elements(f.tree, node => node.type === 'ul')[0]
    const footer = elements(f.tree, node => node.props.className === 'discovery-subcategory-controls')
    assert.equal(footer.length, 1)
    const buttons = elements(footer[0], node => node.type === 'button')
    assert.deepEqual(buttons.map(node => node.props.className), ['discovery-subcategory-more', 'discovery-subcategory-all'])
    assert.equal(elements(list, node => node.type === 'button').length, 4)
    assert.equal(elements(footer[0], node => node.props.className === 'discovery-subcategory-option').length, 0)
    const more = buttons[0]
    assert.equal(more.props['aria-controls'], list.props.id)
    assert.equal(more.props['aria-expanded'], false)
    assert.equal(buttons[1].props.children, locale === 'en' ? 'All' : 'Всички')
    const html = renderToStaticMarkup(React.createElement(DiscoverySubcategories, { ...props, locale, title }))
    assert.ok(html.indexOf('discovery-subcategory-grid') < html.indexOf('discovery-subcategory-controls'))
    f.click('discovery-subcategory-more')
    assert.equal(elements(f.tree, node => node.props.className === 'discovery-subcategory-controls').length, 1)
    assert.equal(f.buttons().filter(node => node.props.className === 'discovery-subcategory-option').length, 5)
    const expandedFooter = elements(f.tree, node => node.props.className === 'discovery-subcategory-controls')[0]
    assert.deepEqual(elements(expandedFooter, node => node.type === 'button').map(node => node.props.className), ['discovery-subcategory-more', 'discovery-subcategory-all'])
  }
})
test('All stays present as the only footer control when no additional activity choices exist', () => {
  for (const locale of ['bg', 'en']) for (const count of [0, 4]) {
    const f = interactive({ locale, options: options.slice(0, count), selected: 'folk', selectedLabel: 'Retained real selection' })
    const footer = elements(f.tree, node => node.props.className === 'discovery-subcategory-controls')[0]
    const buttons = elements(footer, node => node.type === 'button')
    assert.equal(buttons.length, 1)
    assert.equal(buttons[0].props.className, 'discovery-subcategory-all')
    assert.equal(buttons[0].props.children, locale === 'en' ? 'All' : 'Всички')
    assert.equal(buttons[0].props['aria-pressed'], false)
    buttons[0].props.onClick()
    assert.deepEqual(f.calls, [''])
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
test('photo controls keep two columns with wrapping text beside fixed images without horizontal scrolling', async () => {
  const css = await readFile(new URL('../app/discovery-subcategories.css', import.meta.url), 'utf8')
  assert.match(css, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(css, /--subcategory-photo-size: 45px/)
  assert.match(css, /width: var\(--subcategory-photo-size\); height: var\(--subcategory-photo-size\)/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*font-size: 15px/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*flex-wrap: nowrap/)
  assert.match(css, /flex: 1 1 min-content; min-width: 0; max-width: 100%; white-space: normal/)
  assert.match(css, /\.discovery-subcategory-option > span:not\(\.discovery-subcategory-photo\) \{[^}]*hyphens: auto/)
  assert.match(css, /\.discovery-subcategory-option > span:not\(\.discovery-subcategory-photo\) \{[^}]*text-wrap: balance/)
  assert.match(css, /min-height: 44px/)
  assert.match(css, /focus-visible \{ outline: 3px/)
  const nested = css.match(/\.discovery-subcategories \{([^}]+)\}/)?.[1] || ''
  assert.match(nested, /border-inline-start: 2px solid #d5b18b80/)
  assert.match(nested, /padding-inline-start: 12px/)
  assert.match(nested, /background: transparent/)
  assert.match(css, /\.discovery-subcategory-controls \{[^}]*display: flex;[^}]*justify-content: space-between/)
  assert.match(css, /\.discovery-subcategory-all \{[^}]*margin-inline-start: auto/)
  assert.doesNotMatch(css, /\.discovery-subcategory-more \{[^}]*margin-inline-start: auto/)
  assert.doesNotMatch(css, /auto-fit|auto-fill|grid-template-columns: repeat\([134],|\.discovery-subcategory-heading/)
  assert.doesNotMatch(css, /overflow-x: auto|white-space: nowrap|text-overflow: ellipsis|word-break: break-all/)
})
test('quick-choice child choices remain nested with large photographs, two mobile columns and three desktop columns', async () => {
  const css = await readFile(new URL('../app/quick-choice-home.css', import.meta.url), 'utf8')
  assert.match(css, /\.discovery-subcategories \{ --subcategory-photo-size:44px; --subcategory-option-padding:5px/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*flex-wrap:nowrap;[^}]*min-height:56px;[^}]*border-radius:999px;[^}]*font-size:16px/)
  assert.match(css, /@media \(max-width:759px\) \{\s*\.customer-home\.quick-choice \.discovery-subcategory-option \{ font-size:15px/)
  assert.match(css, /\.discovery-subcategory-photo \{ flex-basis:var\(--subcategory-photo-size\); width:var\(--subcategory-photo-size\); height:var\(--subcategory-photo-size\)/)
  assert.match(css, /\.discovery-subcategory-grid \{ display:grid; grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(css, /@media \(min-width:760px\) \{[\s\S]*?\.discovery-subcategory-grid \{ grid-template-columns:repeat\(3,minmax\(0,1fr\)\); gap:8px 14px/)
  assert.match(css, /\.discovery-subcategory-grid > li \{[^}]*min-width:0/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*border:1px solid transparent/)
  assert.match(css, /\.discovery-subcategory-option\[aria-pressed="true"\] \{[^}]*background-color:/)
  const option = css.match(/\.discovery-subcategory-option \{([^}]*)\}/)?.[1] || ''
  assert.doesNotMatch(option, /(?:^|;)\s*height\s*:/)
})
test('selected subcategories use unframed capsules and native pressed states without generated checkmarks, including All', async () => {
  const css = await readFile(new URL('../app/discovery-subcategories.css', import.meta.url), 'utf8')
  const quick = await readFile(new URL('../app/quick-choice-home.css', import.meta.url), 'utf8')
  assert.match(css, /\.discovery-subcategory-photo \{[^}]*align-self: center/)
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
