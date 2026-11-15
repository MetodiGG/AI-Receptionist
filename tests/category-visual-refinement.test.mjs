import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { homeCategories, HOME_CATEGORY_IDS } from '../lib/discovery/home.mjs'
import { CATEGORY_IDS } from '../lib/discovery/categories.mjs'
import { DISCOVERY_SUBCATEGORIES, subcategoriesForCategory, subcategorySelection } from '../lib/discovery/subcategories.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const cssRules = css => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match => ({ selector: match[1].trim(), body: match[2] }))
const rule = (css, selector) => cssRules(css).find(item => item.selector === selector)?.body || ''
const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = 'components/discovery-subcategories.js'
const { code } = await transform(await read(filename), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name === './icon' ? { Icon: () => null } : require(name), module, module.exports)
const { DiscoverySubcategories } = module.exports

test('all fourteen photographic parent choices retain their exact taxonomy IDs, BG/EN labels and own activity children', () => {
  assert.equal(HOME_CATEGORY_IDS.length, 14)
  assert.deepEqual([...HOME_CATEGORY_IDS].sort(), [...CATEGORY_IDS].sort())
  for (const locale of ['bg', 'en']) {
    assert.deepEqual(homeCategories(locale).map(category => category.id), HOME_CATEGORY_IDS)
    for (const category of homeCategories(locale)) {
      assert.ok(category.label.trim(), `${locale}:${category.id}`)
      assert.match(category.photo, /^\/category-photos\/[a-z0-9_-]+\.webp$/)
      const children = subcategoriesForCategory(category.id, locale)
      assert.ok(children.length > 0, `${category.id} must retain photo subcategories`)
      for (const child of children) {
        assert.equal(child.category, category.id)
        assert.ok(child.label.trim())
        assert.equal(subcategorySelection('', category.id, child.id, locale).subcategory, child.id)
        assert.match(child.photo, /^\/service-photos\/[a-z0-9-]+\.webp$/)
      }
    }
  }
})

test('existing local photos exceed 2x resolution for 40px parent and 34px child thumbnails', async () => {
  const checked = new Map()
  async function metadata(src) {
    if (!checked.has(src)) checked.set(src, await sharp(new URL(`../public${src}`, import.meta.url).pathname).metadata())
    return checked.get(src)
  }
  for (const category of homeCategories()) {
    for (const src of [category.photo, category.photo2x]) {
      const image = await metadata(src)
      assert.equal(image.format, 'webp', src)
      assert.ok(image.width >= 80 && image.height >= 80, `${src}: 40px at 2x requires 80px`)
    }
    const largerVariant = await metadata(category.photo2x)
    assert.ok(largerVariant.width >= 184 && largerVariant.height >= 184, `${category.id}: larger legacy/mobile 92px photographs also have an adequate 2x source`)
  }
  assert.equal(DISCOVERY_SUBCATEGORIES.length, 104, 'presentation refinement must not remove or manufacture activity choices')
  for (const child of DISCOVERY_SUBCATEGORIES) {
    const image = await metadata(child.photo)
    assert.equal(image.format, 'webp', child.id)
    assert.ok(image.width >= 90 && image.height >= 90, `${child.id}: 34px quick and 45px base children both have an adequate 2x source`)
  }
})

test('every parent retains localized native photo buttons and an off-panel selected child stays exposed to keyboard selection', () => {
  for (const locale of ['bg', 'en']) for (const category of homeCategories(locale)) {
    const options = subcategoriesForCategory(category.id, locale).map(child => ({ ...child, count: 1 }))
    const selected = options.at(-1)
    const html = renderToStaticMarkup(React.createElement(DiscoverySubcategories, { category: category.id, title: category.label, options, selected: selected.id, locale, onSelect() {} }))
    assert.match(html, /<button type="button" class="discovery-subcategory-option" aria-pressed="true"/)
    assert.match(html, /aria-expanded="false" aria-controls=/)
    assert.ok(html.includes(selected.photo), `${locale}:${selected.id} selected photograph remains visible`)
    assert.ok(html.includes(selected.label.replaceAll('&', '&amp;')), `${locale}:${selected.id} selected label remains readable`)
    assert.equal((html.match(/class="discovery-subcategory-option"/g) || []).length, Math.min(4, options.length))
    assert.doesNotMatch(html, /https?:\/\/|<canvas|role="radio"|role="option"/)
  }
})

test('main category refinement keeps real native selection, horizontal keyboard navigation and reduced-motion scrolling', async () => {
  const search = await read('components/discovery-search.js'), rail = await read('components/discovery-home-rail.js')
  const mainCategories = search.slice(search.indexOf('homeCategories(locale).map'), search.indexOf('</DiscoveryHomeRail>', search.indexOf('homeCategories(locale).map')))
  assert.match(mainCategories, /<button type="button" disabled=\{loading\}/)
  assert.match(mainCategories, /aria-pressed=\{category === item\.id\}/)
  assert.match(mainCategories, /onClick=\{\(\) => chooseCategory\(item\.id\)\}/)
  assert.match(mainCategories, /src=\{item\.photo\}/)
  assert.match(mainCategories, /srcSet=\{`\$\{item\.photo\} 160w, \$\{item\.photo2x\} 240w`\}/)
  assert.match(rail, /onKeyDown=\{onKeyDown\} tabIndex=\{0\}/)
  assert.match(rail, /aria-controls=\{id\}/)
  assert.match(rail, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(rail, /setInterval|cloneNode|autoPlay/)
})

test('parent and child photographs keep their hierarchy inside unframed capsules without checkmarks', async () => {
  const quick = await read('app/quick-choice-home.css'), base = await read('app/discovery-home.css'), child = await read('app/discovery-subcategories.css')
  assert.match(rule(quick, '.customer-home.quick-choice .home-categories'), /--category-photo-size:\s*40px/)
  assert.match(rule(quick, '.customer-home.quick-choice .discovery-subcategories'), /--subcategory-photo-size:\s*34px/)
  const parentTile = rule(quick, '.customer-home.quick-choice .home-categories .home-discovery-rail button')
  assert.match(parentTile, /border:\s*1px solid transparent/)
  assert.match(parentTile, /border-radius:\s*999px/)
  assert.match(parentTile, /min-height:\s*56px/)
  assert.match(rule(quick, '.customer-home.quick-choice .home-categories button > span'), /font-size:\s*16px/)
  assert.match(rule(base, '.home-categories .home-discovery-rail button'), /border-radius:\s*999px/)
  assert.match(rule(child, '.discovery-subcategory-option'), /border-radius:\s*999px/)
  assert.match(rule(base, '.home-categories .home-discovery-rail button.selected'), /background-color:/)
  const categoryRules = [...cssRules(base), ...cssRules(quick), ...cssRules(child)].filter(item => /\.home-categories|\.discovery-subcategory/.test(item.selector))
  for (const item of categoryRules) {
    assert.doesNotMatch(item.selector, /(?:button|\.discovery-subcategory-(?:option|all|more))[^,{]*::(?:before|after)/, `no generated checkmarks on controls: ${item.selector}`)
    assert.doesNotMatch(item.body, /text-decoration:\s*underline|outline:\s*3px(?![^;]*#984419)/, item.selector)
    assert.doesNotMatch(item.body, /border-bottom(?:-color|-width)?:/, item.selector)
    if (/(?:button|\.discovery-subcategory-(?:option|all|more))/.test(item.selector) && !/img|\bsvg\b|::before|::after/.test(item.selector)) {
      for (const shadow of item.body.matchAll(/(?:^|;)\s*box-shadow:\s*([^;]+)/g)) assert.equal(shadow[1].trim(), 'none', `no framed highlight: ${item.selector}`)
      for (const border of item.body.matchAll(/(?:^|;)\s*border-color:\s*([^;]+)/g)) assert.equal(border[1].trim(), 'transparent', `no visible capsule border: ${item.selector}`)
      for (const border of item.body.matchAll(/(?:^|;)\s*border:\s*([^;]+)/g)) assert.match(border[1].trim(), /^(?:0|none|1px solid transparent)$/, item.selector)
    }
  }
})

test('selection and hover feedback never scale controls, hide labels or introduce uncontrolled motion', async () => {
  const base = await read('app/discovery-home.css'), quick = await read('app/quick-choice-home.css'), child = await read('app/discovery-subcategories.css')
  const relevant = [...cssRules(base), ...cssRules(quick), ...cssRules(child)].filter(item => /\.home-categories|\.discovery-subcategory/.test(item.selector))
  for (const item of relevant) {
    assert.doesNotMatch(item.body, /text-overflow:\s*ellipsis|(?:-webkit-)?line-clamp:|word-break:\s*break-all|transition:\s*all|animation:/, item.selector)
    // Only the More chevron may rotate; selection never moves a control.
    if (!/::before|::after|\bsvg\b/.test(item.selector)) {
      for (const transform of item.body.matchAll(/(?:^|;)\s*transform:\s*([^;]+)/g)) assert.equal(transform[1].trim(), 'none', item.selector)
    }
    if (/button\.selected|option\[aria-pressed="true"\]/.test(item.selector) && !/::before|::after/.test(item.selector)) {
      assert.doesNotMatch(item.body, /(?:^|;)\s*(?:padding|border-width|font-size):/, `selected styling must not change layout: ${item.selector}`)
    }
  }
  assert.match(base, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/)
  assert.match(base, /\.home-categories \.home-discovery-rail button:focus-visible\s*\{[^}]*outline:\s*3px/)
  assert.match(base, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.home-categories[^}]*transition:\s*none/)
  assert.match(child, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*transition:\s*none/)
})
