import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as categories from '../lib/discovery/categories.mjs'
import * as home from '../lib/discovery/home.mjs'
import * as inlineCopy from '../lib/discovery/inline-copy.mjs'
import { subcategoriesForCategory } from '../lib/discovery/subcategories.mjs'
import * as tilePhotoStyle from '../components/discovery-tile-photo-style.mjs'

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
    './discovery-tile-photo-style.mjs': tilePhotoStyle,
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
function textContent(node) {
  if (Array.isArray(node)) return node.map(textContent).join('')
  if (React.isValidElement(node)) return node.props['aria-hidden'] ? '' : textContent(node.props.children)
  return typeof node === 'string' || typeof node === 'number' ? String(node) : ''
}
const options = Array.from({ length: 8 }, (_, index) => ({ id: `fitness-real-${index}`, category: 'fitness', bg: `Реална услуга с пълно име ${index}`, en: `Actual service with full name ${index}`, photo: '/service-photos/yoga-class-v1.webp', count: index === 7 ? 314 : index + 1 }))

for (const locale of ['bg', 'en']) test(`${locale}: fourteen persistent category tiles use full taxonomy names, existing photos and exact identifiers`, () => {
  const calls = [], Component = load('inline-category-grid', directReact).InlineCategoryGrid
  const tree = Component({ locale, category: 'barber', onSelect: id => calls.push(id) })
  const buttons = classed(tree, 'inline-category-option')
  assert.equal(buttons.length, home.HOME_CATEGORY_IDS.length)
  assert.equal(buttons.filter(button => button.props['aria-pressed']).length, 1)
  for (const [index, button] of buttons.entries()) {
    assert.equal(classed(button, 'inline-category-label')[0].props.children, categories.categoryById(home.HOME_CATEGORY_IDS[index])[locale])
    const source = home.homeCategories(locale)[index].photo
    assert.deepEqual(classed(button, 'inline-category-photo-frame')[0].props.style, tilePhotoStyle.discoveryTilePhotoStyle(source))
    button.props.onClick()
  }
  assert.deepEqual(calls, home.HOME_CATEGORY_IDS)
  buttons[3].props.onClick()
  assert.equal(calls.at(-1), 'barber', 'the parent, not the presentation component, owns deselection')
  const html = render(InlineCategoryGrid, { locale, category: 'barber', onSelect() {} })
  assert.equal((html.match(/class="inline-category-option"/g) || []).length, 14)
  assert.equal((html.match(/class="inline-category-photo"/g) || []).length, 14)
  assert.equal((html.match(/class="inline-category-photo-frame"/g) || []).length, 14)
  assert.equal((html.match(/class="inline-category-caption"/g) || []).length, 14)
  assert.equal((html.match(/data-icon="chevronDown"/g) || []).length, 14)
  assert.equal((html.match(/data-icon="check"/g) || []).length, 1)
  assert.ok(html.includes(categories.categoryById('barber')[locale]))
  assert.match(html, /\/category-photos\/hair-v2\.webp/)
  assert.doesNotMatch(html, /guide-|home-rail|aria-expanded|tabindex|Back|Назад/)
})

test('category photos keep 160w/240w variants, opt only the five approved scenes into 640w, and remember actual primary-source failure and aspect ratios', () => {
  let failed = null
  const Component = load('inline-category-grid', {
    ...directReact, useState: () => [failed, value => { failed = typeof value === 'function' ? value(failed) : value }],
  }).InlineCategoryGrid
  const tree = Component({ locale: 'bg', onSelect() {} })
  const photo = elements(tree, node => typeof node.type === 'function' && node.type.name === 'CategoryPhoto')[0]
  assert.ok(photo)
  const categories = home.homeCategories('bg')
  for (const category of categories) {
    const image = photo.type({ category })
    assert.equal(image.type, 'img')
    const source = category.photoLarge || category.photo2x
    assert.equal(image.props.src, source)
    assert.equal(image.props.srcSet, `${category.photo} 160w, ${category.photo2x} 240w${category.photoLarge ? `, ${category.photoLarge} 640w` : ''}`)
    assert.equal(image.props.sizes, '(max-width:699px)50vw,(max-width:999px)33vw,280px')
    assert.equal(image.props.width, 240); assert.equal(image.props.height, category.id === 'beauty' ? 360 : 240)
    const expectedStyle = category.id === 'beauty' ? { objectFit: 'cover', objectPosition: '50% 0%' } : undefined
    assert.deepEqual(image.props.style, expectedStyle, 'only the selected Beauty portrait receives deliberate top framing; square category scenes retain complete-source containment')
    assert.equal(image.props.alt, ''); assert.equal(image.props.loading, 'lazy'); assert.equal(image.props.decoding, 'async')
    image.props.onError()
    assert.equal(failed, source)
    const unavailable = photo.type({ category })
    assert.equal(unavailable.type, 'span')
    assert.equal(unavailable.props.className, 'inline-category-photo is-unavailable')
    assert.equal(unavailable.props['aria-hidden'], 'true')
    assert.equal(elements(unavailable, node => node.type === 'img').length, 0, 'failure must not invent an unrelated fallback image')
  }
})

for (const locale of ['bg', 'en']) test(`${locale}: inline children show evidence-backed tiles and a compact parent action, without a redundant All row`, () => {
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
  assert.equal(buttons.length, options.length)
  assert.equal(classed(tree, 'inline-service-all').length, 0)
  const grid = classed(tree, 'inline-service-grid')[0]
  assert.equal(classed(classed(tree, 'inline-subcategories-header')[0], 'inline-selected-parent').length, 1, 'the parent action shares the heading row where it fits')
  assert.equal(classed(tree, 'inline-service-photo-frame').length, options.length)
  assert.deepEqual(classed(tree, 'inline-service-photo-frame').map(node => node.props.style), options.map(option => tilePhotoStyle.discoveryTilePhotoStyle(option.photo)))
  assert.equal(buttons.filter(button => button.props['aria-pressed']).length, 1)
  assert.equal(classed(tree, 'inline-selected-parent')[0].props.children[1].props.children, categories.categoryById('fitness')[locale])
  assert.equal(elements(tree, node => node.type === 'h2')[0].props.children, copy.services)
  assert.deepEqual(classed(tree, 'inline-service-count').map(textContent), options.map(option => `${option.count} ${option.count === 1 ? copy.business : copy.businesses}`))
  assert.equal(textContent(classed(tree, 'inline-service-count')[0]), `1 ${copy.business}`)
  assert.ok(classed(tree, 'inline-service-count').every(node => !node.props['aria-hidden']), 'visible localized count text is also its accessible name')
  assert.deepEqual(classed(grid, 'inline-service-label').map(node => node.props.children), options.map(option => option[locale]))
  for (const button of buttons) button.props.onClick()
  assert.deepEqual(calls, options.map(option => option.id))
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
  assert.ok(html.includes(`<span class="inline-service-count">314 ${copy.businesses}</span>`))
  assert.doesNotMatch(html, /subcategory-more|Show less|More \(|По-малко|Още \(|zero-count|negative-count|missing-count|wrong-parent|wrong-photo/)
})

test('photo focal helpers affect only exact approved source positioning, never image paths or caller data', async () => {
  for (const family of ['hair', 'consulting', 'home_services', 'health', 'education', 'other']) {
    const category = home.homeCategories('bg').find(option => option.id === family)
    assert.ok(category)
    for (const source of [category.photo, category.photo2x]) assert.deepEqual(tilePhotoStyle.discoveryTilePhotoStyle(source), { '--inline-photo-position': '50% 0%' })
  }
  for (const source of ['/category-photos/pets-v2.webp', '/category-photos/pets-2x-v2.webp']) assert.deepEqual(tilePhotoStyle.discoveryTilePhotoStyle(source), { '--inline-photo-position': '50% 0%' }, 'the historical dog source keeps its reviewed focal metadata')
  for (const source of ['/category-photos/pets-v3.webp', '/category-photos/pets-2x-v3.webp', '/category-photos/pets-large-v3.webp']) assert.deepEqual(tilePhotoStyle.discoveryTilePhotoStyle(source), { '--inline-photo-position': 'center' }, 'the new dog has genuine source headroom and needs no crop-position hack')
  for (const [source, position] of [
    ['/service-photos/womens-haircut-v1.webp', '50% 0%'],
    ['/service-photos/kids-haircut-v1.webp', '50% 0%'],
    ['/service-photos/formal-updo-v1.webp', '55% 0%'],
    ['/service-photos/sx-career-consultation-v1.webp', '50% 0%'],
  ]) assert.deepEqual(tilePhotoStyle.discoveryTilePhotoStyle(source), { '--inline-photo-position': position })
  const caller = { src: '/category-photos/hair-v2.webp' }, before = structuredClone(caller)
  for (const source of [undefined, '', caller, '/service-photos/gel-manicure-v1.webp', '/category-photos/hair-v2.webp?replacement=1', 'https://example.test/category-photos/hair-v2.webp']) {
    assert.deepEqual(tilePhotoStyle.discoveryTilePhotoStyle(source), { '--inline-photo-position': 'center' })
  }
  assert.deepEqual(caller, before)
  const first = tilePhotoStyle.discoveryTilePhotoStyle('/category-photos/hair-v2.webp')
  first['--inline-photo-position'] = '0 0'
  assert.deepEqual(tilePhotoStyle.discoveryTilePhotoStyle('/category-photos/hair-v2.webp'), { '--inline-photo-position': '50% 0%' })
  const source = await readFile(new URL('../components/discovery-tile-photo-style.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /fetch\(|https?:\/\/|localStorage|sessionStorage|process\.|node:|getCurrentPosition|trackSearchEvent|trackProductEvent/)
})

test('loading has one real status, inert placeholders and usable known choices without a redundant All row or invented counts', () => {
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
    assert.equal(buttons.length, choices.length)
    assert.ok(buttons.every(button => !button.props.disabled))
    assert.equal(classed(tree, 'inline-service-all').length, 0)
    assert.deepEqual(calls, [])
    const copy = inlineCopy.INLINE_DISCOVERY_COPY.bg
    assert.deepEqual(classed(tree, 'inline-service-count').map(textContent), choices.map(option => `${option.count} ${option.count === 1 ? copy.business : copy.businesses}`))
  }
})

for (const locale of ['bg', 'en']) test(`${locale}: no child or exactly one child is highlighted, with clearing delegated to the compact breadcrumb`, () => {
  const Component = load('discovery-subcategories', directReact).DiscoverySubcategories
  const choices = subcategoriesForCategory('nails', locale).map((option, index) => ({ ...option, count: index + 1 }))
  assert.ok(choices.some(option => option.id === 'nails-gel'))
  for (const selected of ['', 'nails-gel']) {
    const calls = [], tree = Component({ category: 'nails', options: choices, selected, locale, inline: true, onSelect: id => calls.push(id), onClearCategory() {} })
    const tiles = classed(tree, 'inline-service-tile')
    assert.equal(classed(tree, 'inline-service-all').length, 0)
    assert.equal(tiles.filter(button => button.props['aria-pressed']).length, selected ? 1 : 0)
    const selectedTile = tiles.find(button => button.props['aria-pressed'])
    if (selectedTile) {
      assert.equal(classed(selectedTile, 'inline-service-label')[0].props.children, choices.find(option => option.id === selected)[locale])
      selectedTile.props.onClick()
      assert.deepEqual(calls, ['nails-gel'])
    }
    const html = render(DiscoverySubcategories, { category: 'nails', options: choices, selected, locale, inline: true, onSelect() {}, onClearCategory() {} })
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, selected ? 1 : 0)
    assert.equal((html.match(/data-icon="check"/g) || []).length, selected ? 1 : 0)
  }
})

for (const locale of ['bg', 'en']) test(`${locale}: long-word safety is derived from every actual full localized service label without changing IDs or selections`, () => {
  const Component = load('discovery-subcategories', directReact).DiscoverySubcategories
  for (const category of home.HOME_CATEGORY_IDS) {
    const choices = subcategoriesForCategory(category, locale).map(option => ({ ...option, count: 1 }))
    const before = structuredClone(choices), calls = []
    const tree = Component({ category, options: choices, locale, inline: true, onSelect: id => calls.push(id), onClearCategory() {} })
    const grid = classed(tree, 'inline-service-grid')[0]
    const labels = choices.map(option => option[locale] || option.label)
    assert.equal(grid.props['data-long-label'], labels.some(label => /\p{L}{14,}/u.test(label)) ? 'true' : undefined, `${locale}:${category}`)
    const tiles = classed(tree, 'inline-service-tile')
    assert.deepEqual(classed(grid, 'inline-service-label').map(textContent), labels, 'all complete original names remain visible; no shortened display mapping')
    for (const tile of tiles) tile.props.onClick()
    assert.deepEqual(calls, choices.map(option => option.id))
    assert.equal(tiles.filter(button => button.props['aria-pressed']).length, 0)
    assert.deepEqual(choices, before)
  }
})

test('long-word safety uses Unicode word length, the visible locale and accepted choices only', () => {
  const Component = load('discovery-subcategories', directReact).DiscoverySubcategories
  const short = { ...options[0], bg: 'Къса услуга', en: 'Short service', label: 'Fallback service' }
  const flag = (locale, choices) => classed(Component({ category: 'fitness', options: choices, locale, inline: true, onSelect() {}, onClearCategory() {} }), 'inline-service-grid')[0].props['data-long-label']
  assert.equal(flag('bg', [{ ...short, bg: 'Ж'.repeat(13) }]), undefined)
  assert.equal(flag('bg', [{ ...short, bg: 'Ж'.repeat(14) }]), 'true')
  assert.equal(flag('en', [{ ...short, en: 'A'.repeat(13) }]), undefined)
  assert.equal(flag('en', [{ ...short, en: 'A'.repeat(14) }]), 'true')
  assert.equal(flag('bg', [{ ...short, en: 'A'.repeat(20) }]), undefined, 'an untranslated alternate-language value cannot mark the visible short label')
  assert.equal(flag('en', [{ ...short, bg: 'Ж'.repeat(20) }]), undefined)
  assert.equal(flag('bg', [{ ...short, bg: 'Дълго име от няколко къси думи' }]), undefined)
  assert.equal(flag('en', [{ ...short, en: '12345678901234567890' }]), undefined)
  assert.equal(flag('bg', [{ ...short, bg: '', label: 'Ж'.repeat(14) }]), 'true', 'a real visible fallback label follows the same rule')
  assert.equal(flag('bg', [short, { ...short, id: 'hidden-zero', bg: 'Ж'.repeat(20), count: 0 }, { ...short, id: 'hidden-parent', category: 'hair', bg: 'Ж'.repeat(20) }]), undefined)
  for (const locale of ['bg', 'en']) {
    const realFlag = category => classed(Component({ category, options: subcategoriesForCategory(category, locale).map(option => ({ ...option, count: 1 })), locale, inline: true, onSelect() {}, onClearCategory() {} }), 'inline-service-grid')[0].props['data-long-label']
    assert.equal(realFlag('nails'), undefined, `${locale}: fitting nail labels retain two columns`)
    if (locale === 'bg') assert.equal(realFlag('auto_repair'), 'true')
    assert.equal(realFlag('other'), 'true')
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
