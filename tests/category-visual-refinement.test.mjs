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
const railFilename = 'components/discovery-home-rail.js'
const { code: railCode } = await transform(await read(railFilename), { filename: railFilename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const railModule = { exports: {} }
new Function('require', 'module', 'exports', railCode)(name => name === './icon' ? { Icon: () => null } : require(name), railModule, railModule.exports)
const { DiscoveryHomeRail } = railModule.exports

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

test('existing local photos exceed 2x resolution for enlarged 50px parent and 44px child thumbnails', async () => {
  const checked = new Map()
  async function metadata(src) {
    if (!checked.has(src)) checked.set(src, await sharp(new URL(`../public${src}`, import.meta.url).pathname).metadata())
    return checked.get(src)
  }
  for (const category of homeCategories()) {
    for (const src of [category.photo, category.photo2x]) {
      const image = await metadata(src)
      assert.equal(image.format, 'webp', src)
      assert.ok(image.width >= 100 && image.height >= 100, `${src}: enlarged 50px parents at 2x require 100px`)
    }
    const largerVariant = await metadata(category.photo2x)
    assert.ok(largerVariant.width >= 184 && largerVariant.height >= 184, `${category.id}: larger legacy/mobile 92px photographs also have an adequate 2x source`)
  }
  assert.equal(DISCOVERY_SUBCATEGORIES.length, 104, 'presentation refinement must not remove or manufacture activity choices')
  for (const child of DISCOVERY_SUBCATEGORIES) {
    const image = await metadata(child.photo)
    assert.equal(image.format, 'webp', child.id)
    assert.ok(image.width >= 90 && image.height >= 90, `${child.id}: enlarged 44px quick and existing 45px base children both have an adequate 2x source`)
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
    const context = locale === 'en' ? `${category.label} subcategories` : `Подкатегории · ${category.label}`
    assert.ok(html.includes(`aria-label="${context.replaceAll('&', '&amp;')}"`), `${locale}:${category.id} retains its accessible parent context`)
    assert.ok(html.includes(`<h3 class="sr-only">${category.label.replaceAll('&', '&amp;')}</h3>`), 'the parent heading stays available to assistive technology without visible repetition')
    assert.ok(html.indexOf('discovery-subcategory-grid') < html.indexOf('discovery-subcategory-controls'), 'all activity photos precede the footer controls')
    assert.ok(html.indexOf('discovery-subcategory-controls') < html.indexOf('discovery-subcategory-all'))
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

test('the category title can be visually hidden without removing localized rail names, keyboard focus or arrow relationships', () => {
  for (const [locale, title] of [['bg', 'Категории'], ['en', 'Categories']]) {
    const html = renderToStaticMarkup(React.createElement(DiscoveryHomeRail, { title, locale, kind: 'categories', hideHeading: true },
      homeCategories(locale).map(category => React.createElement('li', { key: category.id }, React.createElement('button', { type: 'button' }, category.label)))))
    const heading = html.match(/<h2 id="([^"]+)" class="sr-only">([^<]+)<\/h2>/)
    assert.ok(heading, locale)
    assert.equal(heading[2], title)
    assert.ok(html.includes(`aria-labelledby="${heading[1]}"`))
    assert.ok(html.includes(`tabindex="0" aria-label="${title}"`))
    assert.equal((html.match(/class="home-discovery-rail"/g) || []).length, 1)
    assert.equal((html.match(/aria-controls=/g) || []).length, 2)
    assert.ok(html.includes(`${locale === 'bg' ? 'Предишни' : 'Previous'} · ${title}`))
    assert.ok(html.includes(`${locale === 'bg' ? 'Следващи' : 'Next'} · ${title}`))
    const businesses = renderToStaticMarkup(React.createElement(DiscoveryHomeRail, { title: 'Visible businesses', locale, kind: 'businesses' }))
    assert.match(businesses, /<h2 id="[^"]+">Visible businesses<\/h2>/)
    assert.doesNotMatch(businesses, /class="sr-only"/)
  }
})

test('parent and child photographs keep their hierarchy inside unframed capsules without checkmarks', async () => {
  const quick = await read('app/quick-choice-home.css'), base = await read('app/discovery-home.css'), child = await read('app/discovery-subcategories.css')
  assert.match(rule(quick, '.customer-home.quick-choice .home-categories'), /--category-photo-size:\s*50px/)
  assert.match(rule(quick, '.customer-home.quick-choice .home-categories img'), /flex:\s*0 0 50px;\s*width:\s*50px;\s*height:\s*50px/)
  assert.match(rule(quick, '.customer-home.quick-choice .discovery-subcategories'), /--subcategory-photo-size:\s*44px/)
  const parentTile = rule(quick, '.customer-home.quick-choice .home-categories .home-discovery-rail button')
  assert.match(parentTile, /border:\s*1px solid transparent/)
  assert.match(parentTile, /border-radius:\s*999px/)
  assert.match(parentTile, /min-height:\s*66px/)
  assert.match(rule(quick, '.customer-home.quick-choice .home-categories button > span'), /font-size:\s*18px/)
  assert.match(rule(quick, '.customer-home.quick-choice .discovery-subcategory-option'), /min-height:\s*56px/)
  assert.match(rule(quick, '.customer-home.quick-choice .discovery-subcategory-option'), /font-size:\s*17px/)
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
