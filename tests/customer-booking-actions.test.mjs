import * as brandLoading from './helpers/brand-loading.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as content from './helpers/booking-button-content.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import * as profileData from '../lib/business-profile.mjs'
import * as profileUi from '../lib/business-profile-ui.mjs'
import * as rail from '../lib/discovery/rail.mjs'
import * as discoveryCopy from '../lib/discovery/copy.mjs'
import * as detailsData from '../lib/discovery/business-details.mjs'
import * as publicLocale from '../lib/public-locale.mjs'
import * as partnerCategories from '../lib/partner-categories.mjs'
import * as directoryData from '../lib/directory.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const Empty = () => null
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const artPath = '/booking-art/calendar-3d-v1.webp'
const artCount = html => (html.match(/<img\b[^>]*src="\/booking-art\/calendar-3d-v1\.webp"/g) || []).length
const visible = html => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
async function load(path, stubs = {}) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  const { code } = await transform(source, {
    filename: path, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  })
  const module = { exports: {} }, imports = { './booking-button-content': content, ...stubs }
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(imports, name) ? imports[name] : (name === './brand-loading' ? brandLoading : require(name)), module, module.exports)
  return module.exports
}
function elements(node, predicate, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, result))
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}

const { Icon } = await load('components/icon.js')
const { OutboundBookingButton } = await load('components/outbound-booking-button.js', { '../lib/booking-mode.mjs': bookingMode })
const { BusinessServiceList, BusinessDirectionsLink } = await load('components/business-profile.js', {
  './icon': { Icon }, './business-photo-gallery': { BusinessPhotoGallery: Empty }, './business-cover-photo': { BusinessCoverPhoto: Empty },
  './service-thumbnail': { ServiceThumbnail: Empty }, '../lib/business-profile.mjs': profileData, '../lib/business-profile-ui.mjs': profileUi,
  '../lib/business-photos.mjs': { getStaffPhoto: () => null },
  '../lib/discovery/service-presentation.mjs': { servicePresentation: () => ({ description: '', conditions: [] }) },
})
const business = { id: 'fictional-business', slug: 'fictional-booking-action', name: 'Fictional CTA fixture', address: 'София, ул. Примерна 7', phone: '+359 (888) 123-456', booking_mode: 'phone' }
const Link = { __esModule: true, default: ({ children, href, prefetch: _prefetch, ...props }) => React.createElement('a', { ...props, href }, children) }
const { DiscoveryBusinessCard } = await load('components/discovery-business-card.js', {
  'next/link': Link, 'next/dynamic': { __esModule: true, default: () => Empty }, './icon': { Icon }, './brand-logo': { BrandMark: Empty },
  './business-cover-photo': { BusinessCoverPhoto: Empty }, './service-thumbnail': { ServiceThumbnail: Empty },
  './business-reviews': { useBusinessReviews: () => ({ summary: { count: 0 }, items: [] }), ReviewSummary: Empty, PartnerReviewSummary: Empty },
  './outbound-booking-button': { OutboundBookingButton }, './discovery-distance-badge': { DiscoveryDistanceBadge: Empty },
  '../lib/booking-mode.mjs': bookingMode, '../lib/discovery/home.mjs': { homeBusinessPhoto: () => null }, '../lib/discovery/rail.mjs': rail,
  '../lib/discovery/business-details.mjs': detailsData, '../lib/discovery/copy.mjs': discoveryCopy,
  '../lib/discovery/service-presentation.mjs': { servicePresentation: () => ({ description: '', conditions: [] }) },
  '../lib/business-photo-layout.mjs': { businessPhotoStyle: () => ({}) }, '../lib/catalogue-photo-view.mjs': { isCataloguePhotoSource: () => false },
})
const { BusinessDirectory } = await load('components/business-directory.js', {
  'next/link': Link, './icon': { Icon }, './directory-filters': { DirectoryFilters: Empty },
  './business-photo-gallery': { BusinessPhotoGallery: Empty }, './business-cover-photo': { BusinessCoverPhoto: Empty },
  './service-thumbnail': { ServiceThumbnail: Empty }, './partner-categories': { PartnerCategories: Empty },
  './outbound-booking-button': { OutboundBookingButton }, '../hooks/use-directory': { useDirectory: (_preview, data) => data },
  '../lib/public-locale.mjs': publicLocale, '../lib/directory.mjs': directoryData, '../lib/partner-categories.mjs': partnerCategories,
  '../lib/booking-mode.mjs': bookingMode, '../lib/business-profile-ui.mjs': profileUi,
  '../lib/product-events-client': { trackProductEvent: () => assert.fail('SSR must not emit booking events') },
})
const { GoogleBusinessCard } = await load('components/google-business-card.js', {
  './icon': { Icon }, './discovery-distance-badge': { DiscoveryDistanceBadge: Empty }, './outbound-booking-button': { OutboundBookingButton },
  '../lib/discovery/rail.mjs': rail,
  '../lib/discovery/google-ui-loader.mjs': { loadPlacesLibrary: () => assert.fail('SSR must never load a Google provider') },
  '../lib/discovery/google-card-widget.mjs': { createGoogleCardWidget: () => assert.fail('SSR must never create a Google widget') },
  '../lib/discovery/distance-origin.mjs': { widgetBusinessPoint: () => assert.fail('SSR must never inspect a Google widget') },
})

test('the shared calendar is one local decorative image with explicit dimensions and no action semantics', async () => {
  const icon = content.BookingCalendarIcon({})
  assert.equal(icon.type, 'img'); assert.equal(icon.props.src, artPath)
  assert.equal(icon.props.alt, ''); assert.equal(icon.props['aria-hidden'], 'true')
  assert.equal(icon.props.width, 30); assert.equal(icon.props.height, 30)
  assert.equal(icon.props.onClick, undefined); assert.equal(icon.props.tabIndex, undefined)
  const compact = content.BookingCalendarIcon({ size: 24 })
  assert.equal(compact.props.width, 24); assert.equal(compact.props.height, 24)
  assert.ok((await stat(new URL(`../public${artPath}`, import.meta.url))).size > 0)
  const source = await readFile(new URL('../components/booking-button-content.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /\b(?:fetch|useState|useEffect|useRef)\s*\(/)
})

test('shared booking content keeps complete BG/EN labels and a single decorative icon', () => {
  for (const label of ['Резервирай час', 'Book an appointment']) {
    const html = render(content.BookingButtonContent, { children: label })
    assert.equal(visible(html), label); assert.equal(artCount(html), 1)
    assert.match(html, /alt=""/); assert.match(html, /aria-hidden="true"/)
    assert.doesNotMatch(html, /<a\b|<button\b|<form\b/)
  }
})

test('phone reserve CTA remains one validated tel link, while disabled or malformed destinations remain inert', () => {
  const html = render(OutboundBookingButton, { business, locale: 'bg' })
  assert.equal(artCount(html), 1); assert.match(html, /href="tel:\+359888123456"/)
  assert.equal(visible(html), 'Резервирай час')
  assert.doesNotMatch(html, /<form\b|<button\b|method=|eventId|потвърден/)
  for (const extra of [{ disabled: true }, { business: { ...business, phone: 'javascript:alert(1)' } }]) {
    const inert = render(OutboundBookingButton, { business, locale: 'en', ...extra })
    assert.equal(artCount(inert), 1); assert.match(inert, /aria-disabled="true"/)
    assert.doesNotMatch(inert, /<a\b|<form\b|type="submit"/)
  }
})

test('supplied outbound content is not wrapped in a second calendar or stripped of its complete label', () => {
  for (const booking_mode of ['phone', 'external']) {
    const props = { business: { ...business, booking_mode }, children: React.createElement(content.BookingButtonContent, {}, 'My complete custom booking label') }
    const html = render(OutboundBookingButton, props)
    assert.equal(artCount(html), 1)
    assert.equal(visible(html), 'My complete custom booking label')
  }
  const html = render(OutboundBookingButton, { business, children: React.createElement('span', {}, 'Supplied plain content') })
  assert.equal(artCount(html), 0, 'the caller controls explicitly supplied content')
  assert.equal(visible(html), 'Supplied plain content')
})

test('external and verified-place CTAs retain their protected POST action, hidden event ID and disabled submit behavior', () => {
  for (const [props, path] of [
    [{ business: { ...business, booking_mode: 'external' } }, '/out/business/fictional-booking-action?lang=en'],
    [{ linkId: '10000000-0000-4000-8000-000000000001' }, '/out/place/10000000-0000-4000-8000-000000000001?lang=en'],
  ]) {
    const html = render(OutboundBookingButton, { ...props, locale: 'en', disabled: true })
    assert.match(html, /<form\b[^>]*method="post"/)
    assert.ok(html.includes(`action="${path}"`))
    assert.match(html, /<input[^>]*type="hidden"[^>]*name="eventId"/)
    assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""/)
    assert.equal(artCount(html), 1); assert.equal(visible(html), 'Book an appointment')
  }
})

test('the real outbound submit handler still locks synchronously against duplicate submissions', async () => {
  const states = [], refs = []
  const fakeReact = { ...React, useState: value => [value, next => states.push(next)], useRef: initial => { const ref = { current: initial }; refs.push(ref); return ref }, useEffect: () => {} }
  const { OutboundBookingButton: Controlled } = await load('components/outbound-booking-button.js', { react: fakeReact, '../lib/booking-mode.mjs': bookingMode })
  const form = Controlled({ business: { ...business, booking_mode: 'external' }, locale: 'bg' })
  assert.equal(form.type, 'form'); assert.equal(form.props.method, 'post')
  let prevented = 0
  form.props.onSubmit({ preventDefault() { prevented++ } })
  form.props.onSubmit({ preventDefault() { prevented++ } })
  assert.equal(prevented, 1); assert.deepEqual(states, [true]); assert.equal(refs[0].current, true)
  const disabled = Controlled({ business: { ...business, booking_mode: 'external' }, disabled: true })
  disabled.props.onSubmit({ preventDefault() { prevented++ } })
  assert.equal(prevented, 2)
})

test('real service calendar actions preserve actual identifiers, full accessible labels, selection and disabled state', () => {
  const service = { id: 'actual-service-id', name: 'Подстригване на коса и брада и оформяне на вежди', price: 35, currency: 'EUR', duration_min: 35 }
  const chosen = []
  for (const disabled of [false, true]) {
    const tree = BusinessServiceList({ business: { ...business, services: [service] }, locale: 'bg', selectedServiceId: service.id, onChoose: id => chosen.push(id), disabled })
    const action = elements(tree, node => node.type === 'button' && node.props.className === 'profile-service-book')[0]
    assert.equal(action.props.type, 'button'); assert.equal(action.props.disabled, disabled)
    assert.equal(action.props['aria-pressed'], true); assert.equal(action.props['aria-controls'], 'booking-experience')
    assert.equal(action.props['aria-label'], `Резервирай · ${service.name}`)
    assert.equal(artCount(renderToStaticMarkup(action)), 1)
    if (!disabled) action.props.onClick()
  }
  assert.deepEqual(chosen, [service.id])
})

test('directions retain the exact folded-map source bytes and current business destination', async () => {
  const source = await readFile(new URL('../components/icon.js', import.meta.url), 'utf8')
  const map = source.split('\n').find(line => /^\s*map:/.test(line))
  assert.equal(createHash('sha256').update(map).digest('hex'), '9019629995c7ab3928f73a2e2818464b379c0e5d2a6ec4efb2abe504933bbdba')
  assert.equal(createHash('sha256').update(source).digest('hex'), 'ec3ade456639ebb62a5f5a856b9a9c43daf7b342e4b2fc71e3ea06cd89afed44')
  const tree = BusinessDirectionsLink({ business, locale: 'bg' })
  assert.equal(tree.type, 'a'); assert.equal(tree.props.target, '_blank'); assert.equal(tree.props.rel, 'noopener noreferrer')
  assert.equal(tree.props.href, profileData.businessDirectionsUrl(business))
  assert.match(renderToStaticMarkup(tree), /Как да стигна/)
  assert.equal(elements(tree, node => node.type === Icon && node.props.name === 'map').length, 1)
  assert.equal(artCount(renderToStaticMarkup(tree)), 0, 'do not substitute a calendar for directions')
})

test('actual home partner CTAs show one calendar while retaining native, external, phone and preview destinations', () => {
  const row = { ...business, source: 'gorez', category: 'beauty', services: [] }
  const native = render(DiscoveryBusinessCard, { row: { ...row, booking_mode: 'gorez' }, locale: 'bg' })
  assert.equal(artCount(native), 1); assert.match(native, /href="\/book\/fictional-booking-action\?lang=bg"/)
  assert.doesNotMatch(native, /<form\b|href="tel:/)
  const phone = render(DiscoveryBusinessCard, { row, locale: 'bg' })
  assert.equal(artCount(phone), 1); assert.match(phone, /href="tel:\+359888123456"/); assert.doesNotMatch(phone, /<form\b/)
  const external = render(DiscoveryBusinessCard, { row: { ...row, booking_mode: 'external' }, locale: 'en' })
  assert.equal(artCount(external), 1); assert.match(external, /action="\/out\/business\/fictional-booking-action\?lang=en" method="post"/)
  const preview = render(DiscoveryBusinessCard, { row, locale: 'bg', preview: true })
  assert.equal(artCount(preview), 1); assert.match(preview, /class="home-reserve" aria-disabled="true"/)
  assert.doesNotMatch(preview, /<a\b|<form\b/)
})

test('actual directory CTAs retain native links, safe phone links and protected external forms with a single calendar', () => {
  for (const mode of ['gorez', 'phone', 'external']) {
    const row = { ...business, booking_mode: mode, industry: 'beauty', services: [] }
    const html = render(BusinessDirectory, { locale: 'en', data: { status: 'ready', businesses: [row] }, showFilters: false })
    assert.equal(artCount(html), 1, mode)
    if (mode === 'gorez') { assert.match(html, /href="\/book\/fictional-booking-action\?lang=en"/); assert.doesNotMatch(html, /<form\b/) }
    if (mode === 'phone') { assert.match(html, /href="tel:\+359888123456"/); assert.doesNotMatch(html, /<form\b/) }
    if (mode === 'external') assert.match(html, /action="\/out\/business\/fictional-booking-action\?lang=en" method="post"/)
  }
})

test('GoRez-owned Google booking CTA keeps verified-link POST protection and does not invent an unverified action', () => {
  const card = { placeId: 'ChIJofflinePublicActionFixture', ticket: 'OFFLINE_NOT_EXECUTED', bookingLinkId: '10000000-0000-4000-8000-000000000001' }
  const known = render(GoogleBusinessCard, { card, locale: 'en' })
  assert.equal(artCount(known), 1)
  assert.match(known, /action="\/out\/place\/10000000-0000-4000-8000-000000000001\?lang=en" method="post"/)
  assert.match(known, /class="home-directions"/); assert.match(known, /Google Maps/)
  const unknown = render(GoogleBusinessCard, { card: { ...card, bookingLinkId: null }, locale: 'en' })
  assert.equal(artCount(unknown), 0)
  assert.doesNotMatch(unknown, /class="home-reserve"|<form\b/)
})
