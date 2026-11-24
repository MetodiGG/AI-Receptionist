import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { homeCategories, HOME_CATEGORY_IDS } from '../lib/discovery/home.mjs'
import { CATEGORY_IDS } from '../lib/discovery/categories.mjs'
import { DISCOVERY_SUBCATEGORIES, subcategoriesForCategory, subcategorySelection, subcategoryById } from '../lib/discovery/subcategories.mjs'
import { GUIDED_DISCOVERY_COPY } from '../lib/discovery/guided-copy.mjs'
import * as tilePhotoStyle from '../components/discovery-tile-photo-style.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const cssRules = css => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match => ({ selector: match[1].trim(), body: match[2] }))
const rule = (css, selector) => cssRules(css).find(item => item.selector === selector)?.body || ''
const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
await loadBindings()
const filename = 'components/discovery-subcategories.js'
const { code } = await transform(await read(filename), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const module = { exports: {} }
const photoStyles={ overlay:'ai-photo-overlay',hint:'ai-photo-hint' }
new Function('require', 'module', 'exports', code)(name => name === './icon' ? { Icon: () => null } : name === './discovery-tile-photo-style.mjs' ? tilePhotoStyle : name === './discovery-subcategory-photo.module.css' ? photoStyles : require(name), module, module.exports)
const { DiscoverySubcategories } = module.exports
const railFilename = 'components/discovery-home-rail.js'
const { code: railCode } = await transform(await read(railFilename), { filename: railFilename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const railModule = { exports: {} }
new Function('require', 'module', 'exports', railCode)(name => name === './icon' ? { Icon: () => null } : require(name), railModule, railModule.exports)
const { DiscoveryHomeRail } = railModule.exports
const guidedFilename = 'components/guided-service-discovery.js'
const { code: guidedCode } = await transform(await read(guidedFilename), { filename: guidedFilename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const guidedModule = { exports: {} }
new Function('require', 'module', 'exports', guidedCode)(name => {
  if (name === './icon') return { Icon: () => null }
  if (name === './brand-loading') return { BrandLoading: () => null }
  if (name === '../lib/discovery/home.mjs') return { homeCategories }
  if (name === '../lib/discovery/subcategories.mjs') return { subcategoryById }
  if (name === '../lib/discovery/guided-copy.mjs') return { GUIDED_DISCOVERY_COPY }
  if (name === './discovery-subcategory-photo.module.css') return photoStyles
  return require(name)
}, guidedModule, guidedModule.exports)
const { GuidedServiceDiscovery } = guidedModule.exports

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

test('reviewed local photos cover the larger guided thumbnails at genuine2x without cropping or altering the source artwork', async () => {
  const guided = await read('app/guided-discovery.css')
  const guidedPhotoSize = Number(rule(guided, '.guide-photo').match(/(?:^|;)\s*width:\s*(?:min\()?([\d]+)px/)?.[1])
  assert.ok(guidedPhotoSize >= 50)
  const checked = new Map()
  async function metadata(src) {
    if (!checked.has(src)) checked.set(src, await sharp(new URL(`../public${src}`, import.meta.url).pathname).metadata())
    return checked.get(src)
  }
  for (const category of homeCategories()) {
    for (const src of [category.photo, category.photo2x]) {
      const image = await metadata(src)
      assert.equal(image.format, 'webp', src)
      assert.ok(image.width >= guidedPhotoSize * 2 && image.height >= guidedPhotoSize * 2, `${src}: guided photographs retain a genuine2x source`)
    }
    const largerVariant = await metadata(category.photo2x)
    assert.ok(largerVariant.width >= 184 && largerVariant.height >= 184, `${category.id}: larger legacy/mobile 92px photographs also have an adequate 2x source`)
  }
  assert.equal(DISCOVERY_SUBCATEGORIES.length, 113, '104stable choices plus nine separately verified activity refinements')
  for (const child of DISCOVERY_SUBCATEGORIES) {
    const image = await metadata(child.photo)
    assert.equal(image.format, 'webp', child.id)
    assert.ok(image.width >= guidedPhotoSize * 2 && image.height >= guidedPhotoSize * 2, `${child.id}: full-size guided rows have an adequate2x source`)
  }
})

test('legacy non-home subcategory controls keep localized photos and an off-panel selected child exposed to keyboard selection', () => {
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
    if (options.length > 4) assert.ok(html.indexOf('discovery-subcategory-more') < html.indexOf('discovery-subcategory-all'), 'More precedes All in the visual and keyboard order for every parent')
    assert.doesNotMatch(html, /https?:\/\/|<canvas|role="radio"|role="option"/)
  }
})

test('homepage category navigation mounts native inline photo choices and preserves legacy child controls outside home', async () => {
  const search = await read('components/discovery-search.js'), grid = await read('components/inline-category-grid.js'), css = await read('app/inline-discovery.css')
  assert.match(search, /home && !compact && <InlineCategoryGrid/)
  assert.match(search, /const inlinePanelOpen = Boolean\(category\)/)
  assert.match(search, /home && !compact && <InlineDiscoveryPanel open=\{inlinePanelOpen\}>\{inlinePanelOpen \? <DiscoverySubcategories inline/)
  assert.match(search, /home && !compact && <InlineDiscoverySummary/)
  assert.match(search, /!compact && <DiscoveryHomeBusinesses/)
  assert.match(search, /!compact && !home && <DiscoverySubcategories/)
  assert.doesNotMatch(search, /<DiscoveryHomeRail/)
  assert.match(grid, /type="button" className="inline-category-option"/)
  assert.match(grid, /aria-pressed=\{category === item.id\} onClick=\{\(\) => onSelect\(item.id\)\}/)
  assert.match(grid, /<CategoryPhoto category=\{item\}/)
  assert.match(grid, /homeCategories\(language\)\.map\(item =>/)
  assert.match(search, /requestAnimationFrame/)
  assert.match(search, /focusFirstDiscoveryBusiness\(resultHeading.current, reduceMotion\)/)
  assert.match(search, /prefers-reduced-motion: reduce/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.match(grid, /category === item.id && <span className="inline-tile-check" aria-hidden="true"><Icon name="check"/)
  assert.doesNotMatch(grid, /setInterval|cloneNode|autoPlay|✓|✔|✅/)
})

test('guided initial/category/service/result states render only their active photographic selection level in BG and EN', () => {
  const escaped = value => value.replaceAll('&', '&amp;')
  for (const locale of ['bg', 'en']) {
    const copy = GUIDED_DISCOVERY_COPY[locale]
    const closed = renderToStaticMarkup(React.createElement(GuidedServiceDiscovery, { locale }))
    assert.ok(closed.includes(escaped(copy.choose)))
    assert.match(closed, /aria-expanded="false" aria-controls=/)
    assert.match(closed, /<div class="guide-panel" id="[^"]+" hidden=""><\/div>/, 'the collapsed disclosure keeps an empty accessible controls target')
    assert.doesNotMatch(closed, /class="guide-choices"|class="guide-summary"/)
    const parents = renderToStaticMarkup(React.createElement(GuidedServiceDiscovery, { locale, stage: 'categories' }))
    assert.ok(parents.includes(escaped(copy.categories)))
    assert.ok(parents.includes(escaped(copy.close)))
    assert.equal((parents.match(/guide-row--choice has-photo/g) || []).length, 14)
    for (const parent of homeCategories(locale)) {
      assert.ok(parents.includes(parent.photo))
      assert.ok(parents.includes(escaped(parent.label)))
    }
    assert.doesNotMatch(parents, /home-discovery-rail|discovery-subcategory-grid/)
    for (const parent of homeCategories(locale)) {
      const options = subcategoriesForCategory(parent.id, locale).map(child => ({ ...child, count: 1 }))
      const selected = options.at(-1)
      const children = renderToStaticMarkup(React.createElement(GuidedServiceDiscovery, { locale, stage: 'services', category: parent.id, subcategory: selected.id, options }))
      assert.ok(children.includes(escaped(copy.services)))
      assert.ok(children.includes(escaped(copy.all)))
      assert.ok(children.includes(escaped(copy.back)))
      assert.ok(children.includes(escaped(parent.label)))
      assert.equal((children.match(/guide-row--choice has-photo/g) || []).length, options.length, 'all available child choices, not a truncated carousel page')
      assert.match(children, /aria-pressed="true"/)
      for (const child of options) {
        assert.ok(children.includes(child.photo), child.id)
        assert.ok(children.includes(escaped(child.label)), child.id)
      }
      const results = renderToStaticMarkup(React.createElement(GuidedServiceDiscovery, { locale, stage: 'results', category: parent.id, subcategory: selected.id, options }))
      assert.match(results, /class="guide-summary"/)
      assert.ok(results.includes(escaped(copy.changeCategory)))
      assert.ok(results.includes(escaped(copy.changeService)))
      assert.ok(results.includes(escaped(selected.label)))
      assert.match(results, /<div class="guide-panel" id="[^"]+" hidden=""><\/div>/)
      assert.doesNotMatch(results, /class="guide-choices"/)
    }
  }
})

test('guided choices use equal side tracks, stable far-right vector cues, complete labels and a one/two-column vertical grid', async () => {
  const css = await read('app/guided-discovery.css')
  assert.match(rule(css, '.guide-row'), /grid-template-columns:\s*var\(--guide-slot\) minmax\(0, 1fr\) var\(--guide-slot\)/)
  assert.match(css, /grid-template-columns:\s*minmax\(16px,var\(--guide-slot\)\) minmax\(min-content,1fr\) minmax\(16px,var\(--guide-slot\)\)/)
  assert.match(rule(css, '.guide-side--start'), /justify-content:\s*flex-start/)
  assert.match(rule(css, '.guide-side--end'), /justify-content:\s*flex-end/)
  assert.match(rule(css, '.guide-side--end svg'), /width:\s*16px;\s*height:\s*16px/)
  assert.match(rule(css, '.guide-label'), /text-align:\s*center/)
  assert.match(rule(css, '.guide-label'), /white-space:\s*normal;\s*word-break:\s*normal/)
  assert.match(rule(css, '.guide-row[aria-pressed="true"]'), /background:\s*linear-gradient/)
  assert.match(rule(css, '.guided-discovery :is(button:focus-visible)'), /outline:\s*3px/)
  assert.match(css, /@media \(hover:hover\)/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.doesNotMatch(css, /text-overflow:\s*ellipsis|(?:-webkit-)?line-clamp:|word-break:\s*break-all|overflow-x:\s*(?:scroll|auto)|scroll-snap-type|grid-auto-flow:\s*column/)
  const tree = parse(css)
  const mobile = tree.nodes.find(node => node.type === 'rule' && node.selector === '.guide-choices')
  assert.equal(mobile.nodes.find(node => node.prop === 'grid-template-columns').value, 'minmax(0,1fr)')
  const desktop = tree.nodes.find(node => node.type === 'atrule' && node.name === 'media' && node.params === '(min-width: 700px)').nodes.find(node => node.selector === '.guide-choices')
  assert.equal(desktop.nodes.find(node => node.prop === 'grid-template-columns').value, 'repeat(2,minmax(0,1fr))')
})
test('legacy rails keep their localized hidden titles, keyboard focus and arrow relationships where still used', () => {
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

test('legacy capsule CSS keeps its photograph hierarchy and no generated checkmarks', async () => {
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
  assert.match(rule(quick, '.customer-home.quick-choice .discovery-subcategory-option'), /font-size:\s*16px/)
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

test('legacy capsule selection and hover feedback do not scale controls, hide labels or introduce uncontrolled motion', async () => {
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

test('legacy child controls retain their existing responsive columns without moving photos above labels', async () => {
  const base = await read('app/discovery-subcategories.css'), quick = await read('app/quick-choice-home.css')
  const baseGrids = cssRules(base).filter(item => /\.discovery-subcategory-grid$/.test(item.selector))
  assert.ok(baseGrids.length > 0)
  for (const item of baseGrids) assert.match(item.body, /grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/, item.selector)
  const quickTree = parse(quick), gridSelector = '.customer-home.quick-choice .discovery-subcategory-grid'
  const mobile = quickTree.nodes.find(node => node.type === 'rule' && node.selector === gridSelector)
  assert.ok(mobile, 'the base quick-choice grid remains available below the desktop breakpoint')
  assert.equal(mobile.nodes.find(node => node.prop === 'grid-template-columns').value, 'repeat(2,minmax(0,1fr))')
  const desktopMedia = quickTree.nodes.filter(node => node.type === 'atrule' && node.name === 'media' && node.params === '(min-width:760px)')
  const desktop = desktopMedia.flatMap(node => node.nodes).find(node => node.type === 'rule' && node.selector === gridSelector)
  assert.ok(desktop, 'three columns are introduced only in the explicit desktop media query')
  assert.equal(desktop.nodes.find(node => node.prop === 'grid-template-columns').value, 'repeat(3,minmax(0,1fr))')
  assert.equal(desktop.nodes.find(node => node.prop === 'gap').value, '8px 14px')
  const component = await read('components/discovery-subcategories.js')
  assert.match(component, /matchMedia\('\(min-width: 760px\)'\)/, 'the six-choice JS limit and three-column CSS layout share the same 760px boundary')
  for (const css of [base, quick]) {
    assert.match(rule(css, css === base ? '.discovery-subcategory-option' : '.customer-home.quick-choice .discovery-subcategory-option'), /flex-wrap:\s*nowrap/)
    const options = cssRules(css).filter(item => /\.discovery-subcategory-option$/.test(item.selector))
    for (const item of options) {
      const wrapping = item.body.match(/(?:^|;)\s*flex-wrap:\s*([^;]+)/)
      if (wrapping) assert.equal(wrapping[1].trim(), 'nowrap', item.selector)
      assert.doesNotMatch(item.body, /flex-direction:\s*(?:column|row-reverse)|(?:^|;)\s*height:/)
    }
    assert.doesNotMatch(css, /auto-fit|auto-fill|grid-auto-flow:\s*column/)
  }
  assert.match(rule(base, '.discovery-subcategory-photo'), /flex:\s*0 0 var\(--subcategory-photo-size\)/)
  assert.match(rule(base, '.discovery-subcategory-photo'), /align-self:\s*center/, 'a short choice stays photo-and-text aligned when a longer peer stretches its grid row')
  assert.match(rule(base, '.discovery-subcategory-option > span:not(.discovery-subcategory-photo)'), /min-width:\s*0;[^}]*white-space:\s*normal/)
  assert.match(rule(base, '.discovery-subcategory-option > span:not(.discovery-subcategory-photo)'), /text-wrap:\s*balance/, 'multiword labels use balanced lines inside their responsive column')
})
