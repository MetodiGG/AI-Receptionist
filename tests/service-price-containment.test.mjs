import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as detailsData from '../lib/discovery/business-details.mjs'
import * as rail from '../lib/discovery/rail.mjs'
import * as home from '../lib/discovery/home.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import * as cataloguePhotos from '../lib/catalogue-photo-view.mjs'
import * as copy from '../lib/discovery/copy.mjs'
import * as presentation from '../lib/discovery/service-presentation.mjs'
import * as photoLayout from '../lib/business-photo-layout.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

// Existing SWC/SSR convention: actual client components and price/data helpers,
// inert visual/third-party stubs, no browser, fetch, booking or effect execution.
const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const Empty = () => null
const thumbnail = ({ size }) => React.createElement('span', { 'data-service-thumbnail-size': size })
const shared = {
  './icon': { Icon: ({ name }) => React.createElement('svg', { 'aria-hidden': true, 'data-icon': name }) },
  './service-thumbnail': { ServiceThumbnail: thumbnail },
  './business-cover-photo': { BusinessCoverPhoto: Empty },
  './business-photo-gallery': { BusinessPhotoGallery: Empty },
  './outbound-booking-button': { OutboundBookingButton: Empty },
  '../lib/booking-mode.mjs': bookingMode,
  '../lib/discovery/business-details.mjs': detailsData,
  '../lib/discovery/rail.mjs': rail,
  '../lib/discovery/copy.mjs': copy,
  '../lib/catalogue-photo-view.mjs': cataloguePhotos,
  '../lib/discovery/service-presentation.mjs': presentation,
  '../lib/business-photo-layout.mjs': photoLayout,
  '../lib/dialog-focus.mjs': { containDialogTab: () => assert.fail('SSR must not run dialog events') },
}
async function load(name, additional = {}) {
  const filename = `../components/${name}.js`
  const source = await readFile(new URL(filename, import.meta.url), 'utf8')
  const { code } = await transform(source, {
    filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  })
  const stubs = { ...shared, ...additional }, module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(stubs, name) ? stubs[name] : require(name), module, module.exports)
  return module.exports
}
const { DiscoveryBusinessCard } = await load('discovery-business-card', {
  'next/link': { __esModule: true, default: ({ children, href }) => React.createElement('a', { href }, children) },
  'next/dynamic': { __esModule: true, default: () => Empty },
  './brand-logo': { BrandMark: Empty },
  './business-reviews': { useBusinessReviews: () => ({ summary: { count: 0 }, items: [] }), ReviewSummary: Empty, PartnerReviewSummary: Empty },
  './discovery-distance-badge': { DiscoveryDistanceBadge: Empty },
  '../lib/discovery/home.mjs': home,
})
const { DiscoveryBusinessDetails } = await load('discovery-business-details')

const css = await readFile(new URL('../app/service-photo-surfaces.css', import.meta.url), 'utf8')
const baseCss = await readFile(new URL('../app/discovery-home.css', import.meta.url), 'utf8')
const withoutComments = value => value.replace(/\/\*[\s\S]*?\*\//g, '')
function rulesFor(source, selector) {
  return [...withoutComments(source).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => match[1].split(',').some(value => value.trim() === selector))
    .map(match => match[2])
}
function declarations(source, selector) {
  const rules = rulesFor(source, selector)
  assert.ok(rules.length, `missing relevant CSS rule: ${selector}`)
  return Object.fromEntries(rules.flatMap(rule => rule.split(';').filter(value => value.trim()).map(value => {
    const separator = value.indexOf(':')
    return [value.slice(0, separator).trim(), value.slice(separator + 1).trim()]
  })))
}
function assertNotClipped(rule, label) {
  assert.doesNotMatch(rule.overflow || '', /hidden|clip/, label)
  assert.doesNotMatch(rule['overflow-x'] || '', /hidden|clip/, label)
  assert.doesNotMatch(rule['text-overflow'] || '', /ellipsis/, label)
  assert.ok(!rule['-webkit-line-clamp'] || ['none', 'unset'].includes(rule['-webkit-line-clamp']), label)
  assert.doesNotMatch(rule.contain || '', /paint/, label)
  assert.ok(!rule['clip-path'], label)
}

test('home and detail price columns have hard shrinkable bounds and wrap instead of masking the complete price', () => {
  for (const selector of ['.home-business-services > li', '.business-details-services > li']) {
    const row = declarations(css, selector)
    assert.match(row['grid-template-columns'], /^minmax\(0,\s*1fr\)\s+minmax\(0,\s*42%\)$/)
    assert.doesNotMatch(row['grid-template-columns'], /fit-content/)
    assertNotClipped(row, selector)
  }
  for (const selector of ['.home-business-services .home-service-price', '.business-details-services .business-details-price']) {
    const rule = declarations(css, selector)
    assert.equal(rule['min-width'], '0')
    assert.equal(rule['max-width'], '100%')
    assert.equal(rule['white-space'], 'normal')
    assert.equal(rule['overflow-wrap'], 'anywhere')
    assert.equal(rule['word-break'], 'normal', 'do not chop every numeric character as the default')
    assertNotClipped(rule, selector)
    assert.doesNotMatch(rulesFor(css, selector).join(' '), /white-space\s*:\s*nowrap/)
  }
  for (const selector of ['.home-business-card', '.home-business-services', '.business-details-services']) {
    assertNotClipped(declarations(baseCss, selector), `${selector}: parent overflow must not hide an escaping price`)
  }
})

test('long unit/minimum/package qualifications and service names remain visible, not ellipsized', () => {
  const unit = declarations(css, '.service-price-unit')
  assert.equal(unit.display, 'block')
  assert.equal(unit['white-space'], 'normal')
  assert.equal(unit['overflow-wrap'], 'anywhere')
  assertNotClipped(unit, 'price qualifier')
  const name = declarations(css, '.home-business-services .home-service-name')
  assert.equal(name['white-space'], 'normal')
  assert.equal(name.overflow, 'visible')
  assertNotClipped(name, 'complete service name')
  assert.equal(declarations(css, '.home-service-copy')['min-width'], '0')
  assert.equal(declarations(css, '.business-details-service-copy')['min-width'], '0')
  assert.match(baseCss, /\.discovery-business-details :is\(button,a\):focus-visible\s*\{[^}]*outline:/, 'source links retain a visible focus style')
})

const sourceUrl = 'https://example.com/actual-price-source'
const longName = 'Комплексна услуга с продължително индивидуално описание и допълнителни квалификации без съкращаване на името'
const longUnit = 'пакет 10 посещения по 90 минути · минимална заявка и допълнителни материали по уговорка'
const singleTokenUnit = 'условие'.repeat(14) + '10'
assert.ok(longUnit.length <= 100 && singleTokenUnit.length === 100, 'exercise the real public unit limit, not malformed oversized input')
const fixture = service => ({
  id: 'sofia-price-containment-fixture', name: 'Price containment fixture', category: 'barber', source: 'catalogue',
  address: 'София, ул. Тестова 1', photos: [], services: [service], details: { services: [service], hours: [] },
})
const escape = value => renderToStaticMarkup(React.createElement(React.Fragment, null, value))
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props))
const textContent = html => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
function renderedPrice(html, className) {
  const match = html.match(new RegExp(`<(strong|a)\\b(?=[^>]*\\bclass="${className}")[^>]*>([\\s\\S]*?)<\\/\\1>`))
  assert.ok(match, `actual component must render the ${className} price`)
  return { tag: match[1], markup: match[0], text: textContent(match[2]) }
}
function assertRenderedService(service, locale) {
  const row = fixture(service)
  const card = render(DiscoveryBusinessCard, { row, locale, preview: true })
  const compact = detailsData.detailPriceLabel({ ...service, priceUnit: '' }, locale, { compact: true })
  assert.equal(renderedPrice(card, 'home-service-price').text, compact + (service.priceUnit || ''))
  assert.ok(card.includes(escape(service.name)), 'the complete service name survives SSR')
  assert.match(card, /data-service-thumbnail-size="32"/)
  for (const linked of [true, false]) {
    const menuService = { ...service, priceSourceUrl: linked ? sourceUrl : null }
    const html = render(DiscoveryBusinessDetails, { row: fixture(menuService), locale, preview: true, triggerRef: { current: null }, onClose: Empty })
    const actual = renderedPrice(html, 'business-details-price')
    const full = detailsData.detailPriceLabel({ ...service, priceUnit: '' }, locale)
    assert.equal(actual.text, full + (service.priceUnit || ''), `${locale}: both detail markup variants retain full price and qualification`)
    assert.equal(actual.tag, linked ? 'a' : 'strong')
    if (linked) {
      assert.ok(actual.markup.includes(`href="${sourceUrl}"`))
      assert.match(actual.markup, /rel="noopener noreferrer"/)
      assert.ok(actual.markup.includes(`aria-label="${escape(detailsData.detailPriceLabel(service, locale))}`))
    }
    assert.ok(html.includes(escape(service.name)))
    assert.match(html, /data-service-thumbnail-size="44"/)
  }
  return renderedPrice(card, 'home-service-price').text
}

const kerelski = SOFIA_CATALOGUE.find(row => row.id === 'sofia-kerelski-manastirski-livadi')
assert.ok(kerelski, 'use the real user-reported source record, not an invented screenshot price')
const haircut = detailsData.catalogueBusinessDetails(kerelski, Date.parse('2026-11-11T12:00:00Z')).services.find(service => service.name === 'Подстригване')
assert.equal(haircut.price, 10.23)
assert.equal(haircut.priceMaximum, 15.34)
assert.equal(haircut.priceKind, 'range')

for (const locale of ['bg', 'en']) {
  test(`${locale}: the real Kerelski haircut range keeps both numeric bounds and currency in cards and both detail variants`, () => {
    const text = assertRenderedService(haircut, locale)
    assert.ok(text.includes(locale === 'bg' ? '10,23' : '10.23'))
    assert.ok(text.includes(locale === 'bg' ? '15,34' : '15.34'))
    assert.ok(text.includes('€'))
  })

  for (const [name, patch] of [
    ['fixed', { price: 25 }],
    ['from', { price: 1234.56, priceKind: 'from' }],
    ['zero', { price: 0 }],
    ['large range', { price: 999999.99, priceMaximum: 1000000, priceKind: 'range' }],
    ['BGN range', { price: 10.23, priceMaximum: 15.34, priceKind: 'range', currency: 'BGN' }],
    ['long unit and name', { price: 10.23, priceMaximum: 15.34, priceKind: 'range', priceUnit: longUnit, name: longName }],
    ['single-token unit at the public limit', { price: 25, priceUnit: singleTokenUnit }],
  ]) {
    test(`${locale}: ${name} labels retain every visible price character without abbreviation`, () => {
      const service = { name: longName, category: 'barber', currency: 'EUR', ...patch }
      const text = assertRenderedService(service, locale)
      assert.doesNotMatch(text, /…|\.\.\./)
      if (name === 'from') assert.ok(text.startsWith(locale === 'bg' ? 'от ' : 'from '))
      if (name === 'zero') assert.ok(text.includes('0'), 'a legitimate zero price must not disappear')
      if (service.priceUnit) assert.ok(text.endsWith(service.priceUnit), 'all published minimum/package conditions remain readable')
    })
  }
}

test('Intl formatRange fallback keeps both repeated currencies and full endpoints in actual SSR markup', { concurrency: false }, () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl.NumberFormat.prototype, 'formatRange')
  try {
    Object.defineProperty(Intl.NumberFormat.prototype, 'formatRange', { value: undefined, writable: true, configurable: true })
    for (const locale of ['bg', 'en']) {
      const formatter = new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'bg-BG', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 })
      const expected = `${formatter.format(10.23)}–${formatter.format(15.34)}`
      const text = assertRenderedService(haircut, locale)
      assert.equal(text, expected)
      assert.equal((text.match(/€/g) || []).length, 2, 'fallback must not drop the upper currency to fit a card')
      assert.ok(text.includes(locale === 'bg' ? '\u00a0' : '€10.23'), 'nonbreaking currency spaces remain intact in the factual label')
    }
  } finally {
    if (descriptor) Object.defineProperty(Intl.NumberFormat.prototype, 'formatRange', descriptor)
    else delete Intl.NumberFormat.prototype.formatRange
  }
})

test('unknown prices are still absent, never replaced by zero or a truncated fake amount', () => {
  for (const locale of ['bg', 'en']) {
    const row = fixture({ name: longName, category: 'barber', price: null, currency: 'EUR' })
    const card = render(DiscoveryBusinessCard, { row, locale, preview: true })
    const details = render(DiscoveryBusinessDetails, { row, locale, preview: true, triggerRef: { current: null }, onClose: Empty })
    assert.doesNotMatch(card, /class="home-service-price"/)
    assert.doesNotMatch(details, /class="business-details-price"/)
    assert.ok(card.includes(escape(longName)) && details.includes(escape(longName)))
  }
})
