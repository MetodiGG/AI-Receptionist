import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as profileUi from '../lib/business-profile-ui.mjs'
import * as profileData from '../lib/business-profile.mjs'
import { SITE_ORIGIN } from '../lib/seo.mjs'

const { profileShareUrl, shareProfileLink, profileServicePrice, eligibleProfileStaff, profileBookingContextKey, scrollToProfileBooking } = profileUi
const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()

async function compileComponent(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const { code } = await transform(source, {
    filename: path,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  })
  return code
}

function evaluateComponent(code, stubs = {}) {
  const componentModule = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name in stubs ? stubs[name] : require(name), componentModule, componentModule.exports)
  return componentModule.exports
}

const { Icon } = evaluateComponent(await compileComponent('../components/icon.js'))
const profileCode = await compileComponent('../components/business-profile.js')
const stubs = {
  './icon': { Icon },
  './business-photo-gallery': { BusinessPhotoGallery: ({ businessName }) => React.createElement('div', { 'data-photo-gallery': businessName }) },
  './business-category-icon': { BusinessCategoryIcon: () => React.createElement('svg', { 'data-category-art': true, 'aria-hidden': true }) },
  './service-thumbnail': { ServiceThumbnail: ({ service }) => React.createElement('span', { 'data-service-thumbnail': service.id, 'aria-hidden': true }) },
  '../lib/business-profile.mjs': profileData,
  '../lib/business-profile-ui.mjs': profileUi,
  '../lib/business-photos.mjs': { getStaffPhoto: () => null },
}
const { BusinessProfileHeader, BusinessDirectionsLink, BusinessServiceList, BusinessProfileInformation } = evaluateComponent(profileCode, stubs)
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const visibleText = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const business = {
  id: 'business-actual', slug: 'actual-studio', name: 'Actual Studio', industry: 'beauty',
  address: 'ул. Примерна 7, София', phone: '+359888123456', website_url: 'https://studio.example.com',
  public_profile: { description: { bg: 'Реално описание', en: 'Actual description' }, payments: ['cash', 'card'], brands: ['Actual Brand'], latitude: 42.712345, longitude: 23.334567 },
  services: [
    { id: 'service-first', name: 'Първа услуга', category: 'Грижа', duration_min: 30, price: 0, currency: 'EUR', description: 'Публикувани условия' },
    { id: 'service-second', name: 'Second service', category: 'Грижа', duration_min: null, price: null, currency: 'USD' },
  ],
  staff: [{ id: 'staff-first', name: 'Actual Person', bio: 'Публикувана биография' }, { id: 'staff-second', name: 'Second Person' }],
  staffServices: [{ service_id: 'service-first', staff_id: 'staff-first' }],
  opening_hours: Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, periods: index < 5 ? [{ open: '09:00', close: '18:00' }] : [] })),
}

test('mode state is not keyed by language/mode; in-flight submissions and previews cannot use the new controls to bypass safety', async () => {
  const booking = await readFile(new URL('../components/public-booking-page.js', import.meta.url), 'utf8')
  const chat = await readFile(new URL('../components/guided-booking-chat.js', import.meta.url), 'utf8')
  assert.doesNotMatch(booking, /key=\{`\$\{mode\}-\$\{locale\}`\}/)
  assert.match(booking, /key=\{profileBookingContextKey\(business\)\}/)
  assert.match(booking, /onBusyChange=\{setBusy\}/)
  assert.match(booking, /onShowBooking=\{\(\) => \{ if \(!busy\) setMode\('booking'\) \}\}/)
  assert.match(chat, /className="booking-text-button" disabled=\{sending\} onClick=\{onShowBooking\}/)
  assert.match(booking, /if \(preview\) \{ setError\(/)
  assert.match(chat, /if \(preview\) \{ setError\(/)
  for (const source of [booking, chat]) assert.match(source, /if \(!preview\) trackProductEvent\('booking_started'/)
  assert.match(chat, /profileServicePrice\(item, locale\)/)
  assert.doesNotMatch(chat, /Number\(value \|\| 0\)/)
})

function elements(node, predicate, result = []) {
  if (Array.isArray(node)) { for (const child of node) elements(child, predicate, result); return result }
  if (!React.isValidElement(node)) return result
  if (predicate(node)) result.push(node)
  elements(node.props.children, predicate, result)
  return result
}

test('profile prices keep missing or invalid prices unknown and preserve actual zero', () => {
  for (const price of [null, undefined, '', '  ', true, false, {}, NaN, Infinity, -1, 'not-a-price']) {
    assert.equal(profileServicePrice({ price }), 'Уточни с бизнеса')
    assert.equal(profileServicePrice({ price }, 'en'), 'Ask the business')
  }
  assert.match(profileServicePrice({ price: 0, currency: 'EUR' }), /0,00/)
  assert.match(profileServicePrice({ price: 0, currency: 'EUR' }, 'en'), /0\.00/)
  assert.doesNotMatch(profileServicePrice({ price: 0, currency: 'EUR' }), /Уточни/)
  assert.equal(profileServicePrice({ price: 10, currency: 'INVALID' }), 'Уточни с бизнеса')
})

test('profile prices preserve currency, numeric strings, from, ranges and units', () => {
  assert.equal(profileServicePrice({ price: '25.5', currency: 'USD' }, 'en'), new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'USD' }).format(25.5))
  const from = { price: 20, currency: 'EUR', priceKind: 'from', priceUnit: 'посещение' }
  assert.match(profileServicePrice(from), /^от 20,00/)
  assert.match(profileServicePrice(from, 'en'), /^from /)
  assert.match(profileServicePrice(from), /\/ посещение$/)
  const range = profileServicePrice({ price: 20, priceMaximum: 40, currency: 'EUR', priceKind: 'range' })
  assert.match(range, /20,00/)
  assert.match(range, /40,00/)
  assert.equal(profileServicePrice({ price: 20, priceMaximum: 10, priceKind: 'range' }), 'Уточни с бизнеса')
})

test('sharing uses the configured canonical public origin and only a supported language parameter', () => {
  const url = new URL(profileShareUrl('actual-studio', 'en'))
  assert.equal(url.origin, new URL(SITE_ORIGIN).origin)
  assert.equal(url.pathname, '/book/actual-studio')
  assert.deepEqual([...url.searchParams], [['lang', 'en']])
  assert.equal(url.hash, '')
  assert.equal(new URL(profileShareUrl('actual-studio', 'unsupported')).search, '?lang=bg')
  // Query characters in a value remain part of the encoded path, never become
  // copied preview, booking-token, search, embed or private-session parameters.
  const encoded = new URL(profileShareUrl('actual?token=private&embed=1#preview', 'en&token=private'))
  assert.equal(encoded.origin, new URL(SITE_ORIGIN).origin)
  assert.deepEqual([...encoded.searchParams], [['lang', 'bg']])
  assert.equal(encoded.hash, '')
  assert.equal(decodeURIComponent(encoded.pathname), '/book/actual?token=private&embed=1#preview')
})

test('native profile sharing passes only the real title and canonical URL, without using the clipboard', async () => {
  const payload = { title: business.name, url: profileShareUrl(business.slug, 'en') }
  const calls = []
  const result = await shareProfileLink(payload, {
    share: async value => calls.push(value),
    clipboard: { writeText: () => assert.fail('a successful native share must not copy unexpectedly') },
  })
  assert.equal(result, 'shared')
  assert.deepEqual(calls, [payload])
})

test('cancelling native sharing does not copy a link or request manual copying', async () => {
  const result = await shareProfileLink({ title: business.name, url: profileShareUrl(business.slug) }, {
    share: async () => { throw Object.assign(new Error('User cancelled'), { name: 'AbortError' }) },
    clipboard: { writeText: () => assert.fail('cancelling share must not mutate the clipboard') },
  })
  assert.equal(result, 'cancelled')
})

test('missing or denied native sharing falls back to copying the exact canonical link', async () => {
  const url = profileShareUrl(business.slug, 'en')
  for (const share of [undefined, async () => { throw Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }) }]) {
    const copied = []
    const result = await shareProfileLink({ title: business.name, url }, { share, clipboard: { writeText: async value => copied.push(value) } })
    assert.equal(result, 'copied')
    assert.deepEqual(copied, [url])
  }
})

test('manual copying is requested when native sharing and clipboard access are unavailable or denied', async () => {
  const payload = { title: business.name, url: profileShareUrl(business.slug) }
  for (const browserNavigator of [
    undefined,
    {},
    { clipboard: {} },
    { clipboard: { writeText: async () => { throw new Error('Clipboard denied') } } },
    { share: async () => { throw new Error('Share denied') }, clipboard: { writeText: async () => { throw new Error('Clipboard denied') } } },
  ]) assert.equal(await shareProfileLink(payload, browserNavigator), 'manual')
})

test('eligible profile specialists retain source identifiers and service mapping semantics', () => {
  assert.deepEqual(eligibleProfileStaff(business, 'service-first').map(person => person.id), ['staff-first'])
  assert.deepEqual(eligibleProfileStaff(business, 'service-second').map(person => person.id), ['staff-first', 'staff-second'])
  assert.equal(eligibleProfileStaff(business, ''), business.staff)
  assert.deepEqual(eligibleProfileStaff({}, 'missing'), [])
  assert.deepEqual(eligibleProfileStaff({ ...business, staffServices: [{ service_id: 'service-first', staff_id: 'removed-staff' }] }, 'service-first'), [])
})

test('booking context changes only for actual service, specialist and booking configuration identity', () => {
  const source = { ...business, timezone: 'Europe/Sofia', booking_window_days: 14 }
  const key = profileBookingContextKey(source)
  assert.equal(profileBookingContextKey({ ...source, booking_mode: 'gorez' }), key)
  assert.equal(profileBookingContextKey({
    ...source, name: 'Translated name', address: 'Translated address', locale: 'en',
    services: [...source.services].reverse().map(service => ({ ...service, name: `Translated ${service.name}`, description: 'Translated description', price: 999, currency: 'USD' })),
    staff: [...source.staff].reverse().map(person => ({ ...person, name: 'Translated person', bio: 'Translated biography' })),
    staffServices: [...source.staffServices].reverse(),
  }), key)
  for (const patch of [
    { id: 'another-business' },
    { booking_mode: 'external' },
    { timezone: 'Europe/London' },
    { booking_window_days: 30 },
    { booking_slot_minutes: 10 },
    { minimum_notice_minutes: 60 },
    { workingHours: [{ staff_id: 'staff-first', weekday: 1, open_time: '10:00', close_time: '17:00' }] },
    { services: source.services.map((service, index) => index ? service : { ...service, duration_min: 45 }) },
    { services: source.services.map((service, index) => index ? service : { ...service, id: 'replacement-service' }) },
    { services: source.services.slice(1) },
    { staff: source.staff.slice(1) },
    { staffServices: [{ service_id: 'service-first', staff_id: 'staff-second' }] },
  ]) assert.notEqual(profileBookingContextKey({ ...source, ...patch }), key, JSON.stringify(patch))
  const multipleMappings = { ...source, staffServices: [...source.staffServices, { service_id: 'service-second', staff_id: 'staff-second' }] }
  assert.equal(profileBookingContextKey({ ...multipleMappings, staffServices: [...multipleMappings.staffServices].reverse() }), profileBookingContextKey(multipleMappings))
})

test('explicit booking navigation focuses without a second scroll and offsets the live header', () => {
  const calls = []
  const section = {
    style: {},
    closest: selector => { assert.equal(selector, '.public-booking-page'); return { querySelector: selector => { assert.equal(selector, '.booking-topbar'); return { getBoundingClientRect: () => ({ height: 112 }) } } } },
    focus: options => calls.push(['focus', options]),
    scrollIntoView: options => calls.push(['scroll', options]),
  }
  assert.equal(scrollToProfileBooking(section), true)
  assert.equal(section.style.scrollMarginBlockStart, '128px')
  assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { behavior: 'smooth', block: 'start', inline: 'nearest' }]])
  calls.length = 0
  section.closest = () => null
  assert.equal(scrollToProfileBooking(section, true), true)
  assert.equal(section.style.scrollMarginBlockStart, '16px')
  assert.equal(calls[1][1].behavior, 'instant')
  assert.equal(scrollToProfileBooking(null), false)
})

test('profile header renders only real identity and direct actions, without category or profile navigation', () => {
  const html = render(BusinessProfileHeader, { business, locale: 'bg' })
  assert.match(html, /<h1 id="business-profile-name">Actual Studio<\/h1>/)
  assert.ok(visibleText(html).includes(business.address))
  assert.match(html, /<button type="button" class="profile-share-button"[^>]*aria-label="Сподели"[^>]*>/)
  assert.doesNotMatch(html, /<nav|booking-eyebrow|business-profile-nav|GoRez reviews|GoRez отзиви|Нашият екип|Нашият бизнес|Красота|Beauty|#business-services|#booking-experience/)
  assert.doesNotMatch(html, /<iframe|<script/)
})

test('directions retain exact published coordinates and use the actual homepage folded-map Icon', () => {
  const node = BusinessDirectionsLink({ business, locale: 'en' })
  const href = new URL(node.props.href)
  assert.equal(href.origin, 'https://www.google.com')
  assert.equal(href.pathname, '/maps/dir/')
  assert.equal(href.searchParams.get('api'), '1')
  assert.equal(href.searchParams.get('destination'), '42.712345,23.334567')
  assert.equal(node.props.target, '_blank')
  assert.equal(node.props.rel, 'noopener noreferrer')
  assert.equal(elements(node, item => item.type === Icon && item.props.name === 'map').length, 1)
  const html = render(BusinessDirectionsLink, { business, locale: 'en' })
  assert.ok(html.includes(render(Icon, { name: 'map' })))
  assert.doesNotMatch(html, /<circle|Icon name="pin"/)
  const addressOnly = BusinessDirectionsLink({ business: { ...business, public_profile: {} }, locale: 'bg', address: true })
  assert.equal(new URL(addressOnly.props.href).searchParams.get('destination'), business.address)
  assert.equal(BusinessDirectionsLink({ business: { ...business, address: '' } }), null)
})

test('service calendar actions carry actual service identifiers and selection semantics', () => {
  const selected = []
  const props = { business, locale: 'bg', selectedServiceId: 'service-second', onChoose: id => selected.push(id) }
  const node = BusinessServiceList(props)
  const buttons = elements(node, item => item.type === 'button')
  assert.equal(buttons.length, 2)
  assert.deepEqual(buttons.map(button => button.props['aria-pressed']), [false, true])
  assert.ok(buttons.every(button => button.props.type === 'button' && button.props['aria-controls'] === 'booking-experience'))
  buttons.forEach(button => button.props.onClick())
  assert.deepEqual(selected, ['service-first', 'service-second'])
  const locked = BusinessServiceList({ ...props, disabled: true })
  assert.ok(elements(locked, item => item.type === 'button').every(button => button.props.disabled === true))
  const html = render(BusinessServiceList, props)
  for (const content of ['id="business-services"', 'Първа услуга', 'Second service', '30 мин', '0,00', 'Уточни с бизнеса', 'Публикувани условия', 'data-service-thumbnail="service-first"', 'data-service-thumbnail="service-second"']) assert.ok(html.includes(content), content)
  assert.doesNotMatch(html, /null мин|>0 мин<|<form|type="submit"|business-service-group/)
  assert.equal(elements(node, item => item.type === 'details' && item.props.open).length, 0)
})

test('contact details preserve real information with working hours initially collapsed and no loaded map', () => {
  const html = render(BusinessProfileInformation, { business, locale: 'bg' })
  for (const content of ['Actual Person', 'Публикувана биография', 'Реално описание', 'tel:+359888123456', 'https://studio.example.com', 'Actual Brand', '09:00–18:00', 'Почивен ден']) assert.ok(html.includes(content), content)
  assert.match(html, /<details class="business-weekly-hours profile-hours"><summary>/)
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/)
  assert.match(html, /class="profile-map-toggle"/)
  assert.doesNotMatch(html, /<iframe/)
})

test('map iframe is mounted only after its real show-map button is activated', () => {
  let loaded = false
  const hooked = evaluateComponent(profileCode, { ...stubs, react: { ...React, useState: () => [loaded, next => { loaded = next }] } })
  const before = hooked.BusinessProfileInformation({ business, locale: 'en' })
  assert.equal(elements(before, item => item.type === 'iframe').length, 0)
  const [toggle] = elements(before, item => item.type === 'button' && item.props.className === 'profile-map-toggle')
  assert.ok(toggle)
  toggle.props.onClick()
  const after = hooked.BusinessProfileInformation({ business, locale: 'en' })
  const [frame] = elements(after, item => item.type === 'iframe')
  assert.ok(frame)
  assert.equal(frame.props.src, profileData.businessMapUrl(business))
  assert.equal(frame.props.loading, 'lazy')
  assert.equal(frame.props.referrerPolicy, 'strict-origin-when-cross-origin')
  assert.equal(frame.props.title, `Map: ${business.name}`)
  assert.equal(elements(after, item => item.type === 'button' && item.props.className === 'profile-map-toggle').length, 0)
})

test('booking auto-scroll is invoked only inside the explicit service action, not a mount effect', async () => {
  const source = await readFile(new URL('../components/public-booking-page.js', import.meta.url), 'utf8')
  const start = source.indexOf('function BusinessBookingExperience(')
  assert.ok(start >= 0)
  const experience = source.slice(start, source.indexOf('export default function PublicBookingPage', start))
  const actionStart = experience.indexOf('function chooseService(')
  const actionEnd = experience.indexOf('\n  return ', actionStart)
  assert.ok(actionStart >= 0 && actionEnd > actionStart)
  assert.match(experience.slice(actionStart, actionEnd), /scrollToProfileBooking\(section\.current,/)
  assert.equal((experience.match(/scrollToProfileBooking\(/g) || []).length, 1)
  assert.doesNotMatch(experience.slice(0, actionStart), /scrollIntoView|scrollToProfileBooking\(/)
  assert.doesNotMatch(experience.slice(actionEnd), /scrollIntoView|scrollToProfileBooking\(/)
})
