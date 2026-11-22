import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as publicLocale from '../lib/public-locale.mjs'
import * as partnerCategories from '../lib/partner-categories.mjs'
import * as home from '../lib/discovery/home.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await readFile(new URL('../components/partner-categories.js', import.meta.url), 'utf8')
const { code } = await transform(source, { filename: 'components/partner-categories.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const Link = ({ href, children, className }) => React.createElement('a', { href, className }, children)
const dependencies = {
  'next/link': { __esModule: true, default: Link },
  './icon': { Icon: ({ name }) => React.createElement('svg', { 'data-icon': name, 'aria-hidden': true }) },
  '../lib/public-locale.mjs': publicLocale,
  '../lib/partner-categories.mjs': partnerCategories,
  '../lib/discovery/home.mjs': home,
}
const module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => dependencies[name] || require(name), module, module.exports)
const { PartnerCategories } = module.exports
const inputs = Object.freeze(publicLocale.INDUSTRY_KEYS.map(industry => Object.freeze({ industry })))
const props = locale => ({ categories: partnerCategories.partnerCategories(inputs, locale), locale, total: inputs.length, count: 1 })
const render = (locale, selected = '') => renderToStaticMarkup(React.createElement(PartnerCategories, { ...props(locale), selected }))
const photoFor = (industry, locale) => home.homeCategories(locale).find(category => category.id === (industry === 'auto' ? 'auto_repair' : industry)) || home.homeCategories(locale).find(category => category.id === 'other')

for (const locale of ['bg', 'en']) test(`${locale}: every partner type uses the exact current homepage photograph, preserving labels, counts and industry links`, async () => {
  const html = render(locale)
  assert.equal((html.match(/class="partner-category-photo"/g) || []).length, publicLocale.INDUSTRY_KEYS.length)
  for (const industry of publicLocale.INDUSTRY_KEYS) {
    const image = photoFor(industry, locale)
    assert.ok(html.includes(`src="${image.photo2x}"`), `${industry} must reuse the homepage asset`)
    assert.ok(html.includes(`srcSet="${image.photo} 160w, ${image.photo2x} 240w"`))
    const label = renderToStaticMarkup(React.createElement('span', null, publicLocale.getIndustryLabel(industry, locale))).slice(6, -7)
    assert.ok(html.includes(label))
    assert.ok(html.includes(partnerCategories.partnerCategoryHref(industry, locale).replaceAll('&', '&amp;')))
    await access(new URL('../public' + image.photo, import.meta.url))
    await access(new URL('../public' + image.photo2x, import.meta.url))
  }
  assert.match(html, locale === 'en' ? /1 business/ : /1 бизнес/)
  assert.equal((html.match(/loading="lazy"/g) || []).length, publicLocale.INDUSTRY_KEYS.length)
  assert.equal((html.match(/decoding="async"/g) || []).length, publicLocale.INDUSTRY_KEYS.length)
  assert.equal((html.match(/alt=""/g) || []).length, publicLocale.INDUSTRY_KEYS.length, 'adjacent full labels, not decorative photographs, name category links')
  assert.doesNotMatch(html, /business-category-art|category-art\/|business-art-size/)
})

for (const locale of ['bg', 'en']) test(`${locale}: selected headings and All partners also use photos with unchanged navigation`, () => {
  for (const selected of [...publicLocale.INDUSTRY_KEYS, 'all']) {
    const html = render(locale, selected)
    assert.equal((html.match(/class="partner-category-photo"/g) || []).length, 1)
    assert.ok(html.includes(`src="${photoFor(selected, locale).photo2x}"`))
    assert.match(html, /sizes="64px"/)
    assert.ok(html.includes(`href="${partnerCategories.partnerCategoryHref('', locale).replaceAll('&', '&amp;')}"`))
    assert.match(html, /role="status"/)
  }
})

test('photo frames reserve useful sizes and contain the originals without touching real partner galleries', async () => {
  const css = await readFile(new URL('../app/solar.css', import.meta.url), 'utf8')
  assert.match(css, /\.partner-category-art \{[^}]*width: 88px;[^}]*height: 88px;/)
  assert.match(css, /\.partner-category-art > \.partner-category-photo \{[^}]*width: 100%; height: 100%; object-fit: contain; object-position: center;/)
  assert.match(css, /\.partner-category-selection-heading > \.partner-category-art--heading \{[^}]*width: 64px; height: 64px;/)
  assert.match(css, /\.partner-category-art \{ flex-basis: 72px; width: 72px; height: 72px;/)
  assert.doesNotMatch(source, /BusinessCategoryIcon|categoryArtSource|businessArtCategory|onClick|fetch\(|trackProductEvent|supabase/)
  const root = fileURLToPath(new URL('../', import.meta.url))
  for (const path of ['components/business-directory.js', 'components/business-photo-gallery.js', 'components/partners-page.js', 'lib/partner-categories.mjs']) {
    assert.equal(await readFile(new URL('../' + path, import.meta.url), 'utf8'), execFileSync('git', ['show', `eb36f67:${path}`], { cwd: root, encoding: 'utf8' }), `${path} remains byte-identical: no actual partner media, routing, eligibility or booking/analytics change`)
  }
})
