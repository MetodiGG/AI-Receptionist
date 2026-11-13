import * as brandLoading from './helpers/brand-loading.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as profileData from '../lib/business-profile.mjs'
import * as profileUi from '../lib/business-profile-ui.mjs'
import * as directoryData from '../lib/directory.mjs'
import * as publicLocale from '../lib/public-locale.mjs'
import * as partnerCategories from '../lib/partner-categories.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import * as detailData from '../lib/discovery/business-details.mjs'
import * as rail from '../lib/discovery/rail.mjs'
import * as home from '../lib/discovery/home.mjs'
import * as copy from '../lib/discovery/copy.mjs'
import * as cataloguePhotos from '../lib/catalogue-photo-view.mjs'
import * as presentation from '../lib/discovery/service-presentation.mjs'
import * as photoLayout from '../lib/business-photo-layout.mjs'
import * as bookingButtonContent from './helpers/booking-button-content.mjs'

// Real components/helpers compiled by the existing SWC/SSR convention. Only
// visual/network integrations are inert; SSR never runs effects or bookings.
const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const Empty = () => null
const thumbnail = ({ service, size }) => React.createElement('span', { className: 'service-thumbnail', 'data-service-id': service.id, 'data-size': size, 'aria-hidden': true })
const link = { __esModule: true, default: ({ children, href }) => React.createElement('a', { href }, children) }
const shared = {
  './booking-button-content': bookingButtonContent,
  './icon': { Icon: ({ name }) => React.createElement('svg', { 'aria-hidden': true, 'data-icon': name }) },
  './business-photo-gallery': { BusinessPhotoGallery: Empty },
  './business-cover-photo': { BusinessCoverPhoto: Empty },
  './service-thumbnail': { ServiceThumbnail: thumbnail },
  './outbound-booking-button': { OutboundBookingButton: () => assert.fail('fixture must not create an outbound booking') },
  'next/link': link,
  '../lib/booking-mode.mjs': bookingMode,
  '../lib/business-profile.mjs': profileData,
  '../lib/business-profile-ui.mjs': profileUi,
  '../lib/business-photos.mjs': { getStaffPhoto: () => null },
  '../lib/discovery/business-details.mjs': detailData,
  '../lib/discovery/rail.mjs': rail,
  '../lib/discovery/home.mjs': home,
  '../lib/discovery/copy.mjs': copy,
  '../lib/catalogue-photo-view.mjs': cataloguePhotos,
  '../lib/discovery/service-presentation.mjs': presentation,
  '../lib/business-photo-layout.mjs': photoLayout,
  '../lib/dialog-focus.mjs': { containDialogTab: () => assert.fail('SSR must not run dialog events') },
}

async function load(filename, stubs = {}) {
  const source = await readFile(new URL(`../${filename}`, import.meta.url), 'utf8')
  const { code } = await transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const module = { exports: {} }, imports = { ...shared, ...stubs }
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(imports, name) ? imports[name] : (name === './brand-loading' ? brandLoading : require(name)), module, module.exports)
  return module.exports
}

const { BusinessServiceList } = await load('components/business-profile.js')
const { DiscoveryBusinessDetails } = await load('components/discovery-business-details.js')
const { DiscoveryBusinessCard } = await load('components/discovery-business-card.js', {
  'next/dynamic': { __esModule: true, default: () => Empty },
  './brand-logo': { BrandMark: Empty },
  './business-reviews': { useBusinessReviews: () => ({ summary: { count: 0 }, items: [] }), PartnerReviewSummary: Empty, ReviewSummary: Empty },
  './discovery-distance-badge': { DiscoveryDistanceBadge: Empty },
})
const { BusinessDirectory } = await load('components/business-directory.js', {
  './directory-filters': { DirectoryFilters: Empty },
  './partner-categories': { PartnerCategories: Empty },
  '../hooks/use-directory': { useDirectory: (preview, data) => data || preview || assert.fail('fixture requires supplied directory data') },
  '../lib/public-locale.mjs': publicLocale,
  '../lib/directory.mjs': directoryData,
  '../lib/partner-categories.mjs': partnerCategories,
  '../lib/product-events-client': { trackProductEvent: () => assert.fail('fixture must not emit a booking event') },
})
const previewImports = {
  '../../../components/discovery-business-card': { DiscoveryBusinessCard },
  '../../../components/business-profile': { BusinessServiceList },
  '../../../components/business-directory': { BusinessDirectory },
  '../../../components/service-thumbnail': { ServiceThumbnail: thumbnail },
  '../../../components/icon': shared['./icon'],
  '../../../lib/business-profile-ui.mjs': profileUi,
}
const { ServiceTextPreview, serviceTextFixture, SERVICE_TEXT_NAMES } = await load('app/dev/service-text/preview.js', previewImports)
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props))
const text = html => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

test('service-text fixture is explicitly fictional, development-only and defaults to the three requested complete barber names', async () => {
  const page = await load('app/dev/service-text/page.js', { './preview': { ServiceTextPreview }, 'next/navigation': { notFound: () => { throw new Error('NOT_FOUND') } } })
  const environment = process.env.NODE_ENV
  try {
    for (const mode of ['production', 'test']) {
      process.env.NODE_ENV = mode
      await assert.rejects(() => page.default({ searchParams: Promise.resolve({ lang: 'en', stress: '1' }) }), /NOT_FOUND/)
    }
    process.env.NODE_ENV = 'development'
    const node = await page.default({ searchParams: Promise.resolve({ lang: 'en', stress: '1' }) })
    assert.equal(node.type, ServiceTextPreview)
    assert.deepEqual(node.props, { locale: 'en', stress: true })
    assert.deepEqual((await page.default({ searchParams: Promise.resolve({ lang: 'unsupported' }) })).props, { locale: 'bg', stress: false })
  } finally {
    if (environment === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = environment
  }
  assert.deepEqual(SERVICE_TEXT_NAMES.bg, ['Детско подстригване за момчета', 'Подстригване на коса и брада и оформяне на вежди', 'Кола маска за уши и нос'])
})

for (const locale of ['bg', 'en']) {
  test(`${locale}: fictional input retains ordinary words, identifiers, range/from/zero prices and the256-character stress token`, () => {
    const normal = serviceTextFixture(locale), stress = serviceTextFixture(locale, true)
    assert.deepEqual(normal.services.map(service => service.name), SERVICE_TEXT_NAMES[locale])
    assert.equal(normal.services.length, 3)
    assert.equal(stress.services.length, 4)
    assert.equal(stress.services[3].name.length, 256)
    assert.equal(new Set(stress.services.map(service => service.id)).size, 4)
    assert.deepEqual(normal.services.map(service => service.price), [12, 35, 5])
    assert.deepEqual(normal.services.map(service => service.duration_min), [15, 35, 10])
    assert.ok(normal.services.every(service => service.priceKind === 'fixed' && !service.priceUnit))
    assert.deepEqual(stress.services.slice(0, 3).map(service => service.price), [10.23, 29.9, 0])
    assert.deepEqual(stress.services.slice(0, 3).map(service => service.priceKind), ['range', 'from', 'fixed'])
    assert.equal(stress.services[0].priceMaximum, 15.34)
    assert.equal(stress.services[3].priceMaximum, 1234567.89)
    assert.ok(stress.services.every(service => service.priceUnit && !service.priceSourceUrl))
    assert.equal(stress.address, null)
    assert.equal(stress.coordinates, null)
    assert.equal(stress.booking, undefined)
    assert.equal(stress.detailsRef, undefined, 'details must never fetch this fake business')
  })

  test(`${locale}: actual home/profile/directory/details retain full service names and actual formatted prices without splitting or abbreviating the input`, () => {
    const business = serviceTextFixture(locale, true)
    for (const service of business.services) {
      const row = { ...business, services: [service], details: { services: [service], hours: [] } }
      const html = render(DiscoveryBusinessCard, { row, locale, preview: true })
      assert.ok(text(html).includes(service.name), service.name)
      const price = detailData.detailPriceLabel({ ...service, priceUnit: '' }, locale, { compact: true })
      assert.ok(text(html).includes(price))
      assert.ok(text(html).includes(service.priceUnit))
      assert.doesNotMatch(html, /<a\b|<form\b/, 'preview actions are not links; decorative image preload hints are allowed')
    }
    const profile = render(BusinessServiceList, { business, locale, onChoose: () => {}, selectedServiceId: business.services[1].id })
    const details = render(DiscoveryBusinessDetails, { row: business, locale, preview: true, triggerRef: { current: null }, onClose: () => {}, actions: React.createElement('span', null, 'QA') })
    const directory = render(BusinessDirectory, { locale, preview: { businesses: [business], status: 'ready' }, showFilters: false, bookingDisabled: true })
    for (const service of business.services) {
      for (const html of [profile, details, directory]) assert.ok(text(html).includes(service.name), service.name)
      assert.ok(text(profile).includes(profileUi.profileServicePrice(service, locale)))
      assert.ok(text(details).includes(detailData.detailPriceLabel({ ...service, priceUnit: '' }, locale)))
    }
    assert.match(profile, /aria-pressed="true"/)
    assert.doesNotMatch(directory, /<a\b|<form\b/, 'disabled directory cannot book or navigate; decorative image preload hints are allowed')
  })

  test(`${locale}: complete preview exposes six labelled surfaces and static guided markup without a live booking form`, () => {
    const html = render(ServiceTextPreview, { locale, stress: true })
    for (const surface of ['home', 'profile', 'directory', 'guided-menu', 'guided-options', 'selected-summary']) assert.ok(html.includes(`data-service-text-surface="${surface}"`))
    for (const name of SERVICE_TEXT_NAMES[locale]) assert.ok(text(html).includes(name))
    assert.ok(text(html).includes(serviceTextFixture(locale, true).services[3].name))
    assert.match(html, /class="guided-service-menu"/)
    assert.match(html, /class="guided-option-list"/)
    assert.match(html, /class="booking-summary"/)
    assert.match(html, /class="profile-selected-service"/)
    assert.match(html, /class="guided-booking-summary"/)
    assert.doesNotMatch(html, /<form\b|<a\b|type="submit"/)
    assert.ok(text(html).includes(locale === 'en' ? 'static layout only' : 'само статично оформление'))
  })
}

function elements(node, predicate, found = []) {
  if (Array.isArray(node)) { for (const child of node) elements(child, predicate, found); return found }
  if (!React.isValidElement(node)) return found
  if (predicate(node)) found.push(node)
  elements(node.props.children, predicate, found)
  return found
}

test('service actions preserve each full name in accessible labels and select the correct identifier, not a truncated label', () => {
  const business = serviceTextFixture('bg', true), selected = []
  const node = BusinessServiceList({ business, onChoose: id => selected.push(id) })
  const actions = elements(node, element => element.type === 'button')
  assert.equal(actions.length, business.services.length)
  for (const [index, action] of actions.entries()) {
    assert.ok(action.props['aria-label'].includes(business.services[index].name))
    action.props.onClick()
  }
  assert.deepEqual(selected, business.services.map(service => service.id))
})

test('development preview introduces no fetching, production fixture records, form submission or assistant availability simulation', async () => {
  const source = await readFile(new URL('../app/dev/service-text/preview.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /\bfetch\s*\(|navigator\.|api\/|supabase|trackProductEvent|<form|<GuidedBookingChat|<PublicBookingPage|<MonthlyBookingCalendar/)
  assert.match(source, /DiscoveryBusinessCard row=\{row\} locale=\{locale\} preview/)
  assert.match(source, /BusinessDirectory[^\n]+bookingDisabled/)
  assert.match(source, /onChoose=\{setSelectedServiceId\}/)
  for (const name of ['guided-service-menu', 'guided-option-list', 'guided-booking-summary', 'booking-summary', 'profile-booking-heading', 'profile-selected-service']) {
    const production = await readFile(new URL(`../components/${name.startsWith('guided') ? 'guided-booking-chat' : 'public-booking-page'}.js`, import.meta.url), 'utf8')
    assert.ok(production.includes(`className="${name}"`), `${name} sample must correspond to real production markup`)
  }
})

const surfaceCss = await readFile(new URL('../app/service-photo-surfaces.css', import.meta.url), 'utf8')
const thumbnailCss = await readFile(new URL('../app/service-thumbnail.css', import.meta.url), 'utf8')
const profileCss = await readFile(new URL('../app/business-profile.css', import.meta.url), 'utf8')
function rules(source, selector) {
  return [...source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => match[1].split(',').some(part => part.trim() === selector)).map(match => match[2])
}
function declarations(source, selector) {
  const found = rules(source, selector)
  assert.ok(found.length, `missing layout contract: ${selector}`)
  return Object.fromEntries(found.flatMap(rule => rule.split(';').filter(value => value.trim()).map(value => {
    const index = value.indexOf(':')
    return [value.slice(0, index).trim(), value.slice(index + 1).trim()]
  })))
}
function notClipped(rule, selector) {
  for (const property of ['overflow', 'overflow-x', 'overflow-y']) assert.doesNotMatch(rule[property] || '', /hidden|clip/, `${selector}: ${property}`)
  assert.notEqual(rule['text-overflow'], 'ellipsis', selector)
  assert.ok(!rule['-webkit-line-clamp'] || ['none', 'unset'].includes(rule['-webkit-line-clamp']), selector)
  assert.notEqual(rule['white-space'], 'nowrap', selector)
  assert.doesNotMatch(rule['word-break'] || '', /break-all|break-word/, selector)
  assert.notEqual(rule.hyphens, 'auto', selector)
}

test('natural service-word wrapping is shared across names, native profile and guided summary; emergency token breaking is not the intrinsic sizing policy', () => {
  for (const [source, selector] of [
    [thumbnailCss, '.service-photo-name'],
    [thumbnailCss, '.service-photo-name > :not(.service-thumbnail)'],
    [surfaceCss, '.directory-services .directory-service-copy'],
    [profileCss, '.profile-redesign .profile-service-copy > strong'],
    [thumbnailCss, '.guided-booking-summary strong'],
  ]) {
    const rule = declarations(source, selector)
    assert.equal(rule['overflow-wrap'], 'break-word', selector)
    assert.equal(rule['word-break'], 'normal', selector)
    assert.equal(rule.hyphens, 'manual', selector)
    notClipped(rule, selector)
  }
  for (const selector of ['.home-business-services .home-service-name', '.business-details-service-copy']) {
    const rule = declarations(surfaceCss, selector)
    assert.equal(rule['overflow-wrap'], 'break-word', selector)
    notClipped(rule, selector)
  }
  assert.equal(declarations(thumbnailCss, '.service-photo-name')['min-width'], '0')
  assert.equal(declarations(thumbnailCss, '.service-photo-name > :not(.service-thumbnail)')['min-width'], '0')
})

test('home, details, directory and guided rows move the price before sacrificing an ordinary word or masking text', () => {
  for (const [source, row, group] of [
    [surfaceCss, '.home-business-services > li', '.home-business-services .service-photo-name'],
    [surfaceCss, '.business-details-services > li', '.business-details-services .service-photo-name'],
    [surfaceCss, '.directory-services .directory-service-row', '.directory-services .directory-service-row > .service-photo-name'],
    [thumbnailCss, '.guided-service-menu > li', '.guided-service-menu > li > .service-photo-name'],
    [thumbnailCss, '.guided-option-list button', '.guided-option-list button > .service-photo-name'],
  ]) {
    const layout = declarations(source, row), name = declarations(source, group)
    if (!row.includes('button')) assert.equal(layout.display, 'flex', row)
    assert.equal(layout['flex-wrap'], 'wrap', row)
    assert.equal(layout['min-width'], '0', row)
    assert.equal(name.flex, '1 0 min-content', group)
    assert.equal(name['max-width'], '100%', group)
    notClipped(layout, row)
    notClipped(name, group)
  }
  assert.equal(declarations(surfaceCss, '.business-details-services .business-details-service-description')['flex-basis'], '100%')
  for (const [source, selector] of [
    [surfaceCss, '.home-business-services'], [surfaceCss, '.business-details-services'],
    [surfaceCss, '.directory-services > div'], [thumbnailCss, '.guided-option-list'],
    [surfaceCss, '.directory-services .directory-service-copy'],
    [thumbnailCss, '.guided-service-menu'], [thumbnailCss, '.guided-booking-summary > span'],
    [thumbnailCss, '.profile-redesign .booking-summary .service-photo-name > span:not(.service-thumbnail)'],
    [profileCss, '.profile-redesign .profile-service-copy'],
  ]) assert.equal(declarations(source, selector)['grid-template-columns'], 'minmax(0,1fr)', 'implicit auto tracks cannot expand before emergency token wrapping')
})

test('actual price ranges and qualifications retain emergency wrapping and complete text after row reflow', () => {
  for (const [source, selector] of [
    [surfaceCss, '.home-business-services .home-service-price'],
    [surfaceCss, '.business-details-services .business-details-price'],
    [surfaceCss, '.directory-services .directory-service-row b'],
    [thumbnailCss, '.guided-option-list button > .service-photo-name + b'],
    [thumbnailCss, '.guided-service-menu > li > b'],
    [thumbnailCss, '.profile-redesign .booking-summary > b'],
  ]) {
    const rule = declarations(source, selector)
    assert.equal(rule['min-width'], '0', selector)
    assert.equal(rule['max-width'], '100%', selector)
    assert.equal(rule['overflow-wrap'], 'anywhere', selector)
    assert.equal(rule['margin-inline-start'], 'auto', selector)
    notClipped(rule, selector)
  }
  const unit = declarations(surfaceCss, '.service-price-unit')
  assert.equal(unit['white-space'], 'normal')
  assert.equal(unit['overflow-wrap'], 'anywhere')
  notClipped(unit, 'complete price qualification')
  assert.equal(declarations(thumbnailCss, '.service-thumbnail').flex, 'none', 'preserve the service image')
  assert.equal(declarations(profileCss, '.profile-redesign .profile-service-book')['min-height'], '44px', 'preserve the accessible calendar action')
})

test('narrow native-profile rows dedicate the second column to actions and summaries can wrap instead of squeezing names', () => {
  const mobile = [...profileCss.matchAll(/@media\s*\(max-width:\s*760px\)\s*\{([\s\S]*?)\n\}/g)]
    .map(match => match[1]).find(block => block.includes('.profile-redesign .profile-service-row'))
  assert.ok(mobile, 'native mobile breakpoint must remain explicit')
  const row = declarations(mobile, '.profile-redesign .profile-service-row')
  assert.match(row['grid-template-columns'], /^56px\s+minmax\(0,\s*1fr\)$/)
  const action = declarations(mobile, '.profile-redesign .profile-service-actions')
  assert.equal(action['grid-column'], '2')
  assert.equal(action['max-width'], '100%')
  notClipped(row, 'mobile native service row')
  for (const selector of ['.profile-redesign .booking-summary', '.profile-redesign .profile-selected-service']) {
    const source = selector.includes('selected') ? profileCss : thumbnailCss
    assert.equal(declarations(source, selector)['flex-wrap'], 'wrap')
  }
  assert.match(thumbnailCss, /@media\s*\(max-width:\s*600px\)\s*\{\s*\.guided-booking-summary\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.equal(declarations(profileCss, '.profile-redesign .profile-booking-heading > div')['min-width'], '0', 'the icon cannot force the name wrapper beyond the booking card')
})
