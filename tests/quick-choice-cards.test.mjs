import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as rail from '../lib/discovery/rail.mjs'
import * as home from '../lib/discovery/home.mjs'
import * as prices from '../lib/discovery/business-details.mjs'
import * as presentation from '../lib/discovery/service-presentation.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import * as photoLayout from '../lib/business-photo-layout.mjs'
import * as cataloguePhotos from '../lib/catalogue-photo-view.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import * as bookingButtonContent from './helpers/booking-button-content.mjs'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = 'components/discovery-business-card.js'
const { code } = await transform(await readFile(new URL(`../${filename}`, import.meta.url), 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const Empty = () => null, Details = () => null, Outbound = () => null, Badge = () => null, Thumbnail = () => null, Cover = () => null, Link = () => null
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
const text = node => renderToStaticMarkup(node).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
const nodeClass = (tree, className) => elements(tree, node => node.props.className === className)
const range = { id: '10000000-0000-4000-8000-000000000001', name: 'Подстригване с дълго подробно име без отрязване на буквите', category: 'hair', price: 10.23, priceMaximum: 15.34, priceKind: 'range', currency: 'EUR', priceUnit: 'пакет по уговорка' }
const business = patch => ({ id: 'real-business-id', source: 'gorez', name: 'Дълго име на реален партньор', slug: 'real/branch', industry: 'beauty', category: 'hair', neighborhood: 'Манастирски ливади', address: 'София, ул. Пирин 83', coordinates: { latitude: 42.657, longitude: 23.292 }, services: [range, { id: '10000000-0000-4000-8000-000000000002', name: 'Боядисване на коса', price: null, currency: 'EUR' }, { name: 'Трета реална услуга', price: null }], ...patch })

function fixture(patch = {}) {
  const values = [null, false], refs = [], events = [], props = { row: business(), locale: 'bg', quickChoice: true, ...patch }
  let index = 0, tree
  const stubs = {
    react: { ...React, memo: component => component, useState() { const at = index++; return [values[at], value => { values[at] = value }] }, useRef(value) { const at = index++; return refs[at] ||= { current: value } } },
    'next/link': { __esModule: true, default: Link }, 'next/dynamic': { __esModule: true, default: () => Details },
    './icon': { Icon: ({ name }) => React.createElement('svg', { 'data-icon': name }) }, './brand-logo': { BrandMark: Empty },
    './business-cover-photo': { BusinessCoverPhoto: Cover }, './service-thumbnail': { ServiceThumbnail: Thumbnail },
    './business-reviews': { useBusinessReviews: () => ({}), ReviewSummary: Empty, PartnerReviewSummary: Empty },
    './outbound-booking-button': { OutboundBookingButton: Outbound }, './booking-button-content': bookingButtonContent,
    '../lib/booking-mode.mjs': bookingMode, '../lib/discovery/home.mjs': home, '../lib/discovery/rail.mjs': rail,
    '../lib/discovery/business-details.mjs': prices, '../lib/discovery/service-presentation.mjs': presentation,
    '../lib/business-photo-layout.mjs': photoLayout, './discovery-distance-badge': { DiscoveryDistanceBadge: Badge },
    '../lib/catalogue-photo-view.mjs': cataloguePhotos, '../lib/discovery/copy.mjs': { DISCOVERY_COPY },
    '../lib/search-analytics-client.js': { trackSearchEvent: event => events.push(event) },
  }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name in stubs ? stubs[name] : require(name), module, module.exports)
  const render = () => { index = 0; return tree = module.exports.DiscoveryBusinessCard(props) }
  render()
  return { get tree() { return tree }, events, props, render }
}

for (const locale of ['bg', 'en']) test(`${locale}: Fast Choice uses one identity, one accurate inline distance and one semantic details trigger`, () => {
  const origin = { latitude: 42.66, longitude: 23.29, kind: 'location' }, row = business(), f = fixture({ locale, row, distanceOrigin: origin })
  const identity = nodeClass(f.tree, 'home-business-identity')
  assert.equal(identity.length, 1)
  const heading = nodeClass(f.tree, 'home-business-heading')
  assert.equal(heading.length, 1)
  assert.equal(nodeClass(heading[0], 'home-business-photo').length, 1)
  assert.equal(nodeClass(heading[0], 'home-business-identity').length, 1)
  assert.equal(nodeClass(heading[0], 'home-business-services').length, 0, 'services are below the shared photo/name header')
  assert.equal(nodeClass(heading[0], 'home-business-footer').length, 0, 'actions remain beside the service area, not in the header')
  assert.equal(text(elements(identity, node => node.type === 'h3')[0]), row.name)
  assert.equal(elements(f.tree, node => node.type === Badge).length, 1)
  const badge = elements(identity, node => node.type === Badge)[0]
  assert.equal(badge.props.origin, origin)
  assert.equal(badge.props.destination, row.coordinates)
  assert.equal(elements(nodeClass(f.tree, 'home-business-photo'), node => node.type === Badge).length, 0, 'no location badge covers a tiny photograph')
  assert.equal(nodeClass(f.tree, 'home-business-open').length, 0, 'no invisible overlay blocks the compact actions')
  assert.equal(nodeClass(f.tree, 'home-business-details-label').length, 0)
  const triggers = elements(f.tree, node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog')
  assert.equal(triggers.length, 1)
  assert.equal(triggers[0].props.className, 'home-business-inline-details')
  assert.equal(text(triggers[0]), DISCOVERY_COPY[locale].viewDetailsLower)
  assert.ok(triggers[0].props['aria-label'].includes(row.name))
  const trigger = { focus() {} }
  triggers[0].props.onClick({ currentTarget: trigger }); f.render()
  const details = elements(f.tree, node => node.type === Details)[0]
  assert.equal(details.props.row, row)
  assert.equal(details.props.locale, locale)
  assert.equal(details.props.triggerRef.current, trigger, 'existing dialog returns focus to the exact clicked button')
  assert.deepEqual(f.events, [{ event: 'profile', locale }])
  details.props.onClose(); f.render()
  assert.equal(elements(f.tree, node => node.type === Details).length, 0)
})

test('Fast Choice shows all three actual services without inventing a fourth, preserving ranges, real image inputs, units and missing prices', () => {
  const row = business(), f = fixture({ row }), list = nodeClass(f.tree, 'home-business-services')[0]
  const thumbs = elements(list, node => node.type === Thumbnail)
  assert.equal(thumbs.length, 3)
  assert.equal(thumbs[0].props.service.name, range.name)
  assert.equal(thumbs[0].props.service.id, range.id)
  assert.equal(thumbs[0].props.business, row)
  assert.equal(thumbs[1].props.service.price, null)
  const price = nodeClass(list, 'home-service-price')
  assert.equal(price.length, 1)
  assert.match(text(price[0]), /10,23.*15,34.*€/)
  assert.ok(text(price[0]).includes(range.priceUnit))
  assert.ok(text(list).includes(range.name))
  assert.equal(row.services.length, 3, 'only the preview is compact; the source menu is unchanged')
})

test('real photographs retain top-first framing, curated focal points and whole G Point logos', () => {
  const photographs = [
    [{ src: '/businesses/fixture/interior.webp' }, 'cover', 'center top'],
    [{ src: '/businesses/fixture/interior.webp', position: '50% 68%' }, 'cover', '50% 68%'],
  ]
  for (const [photo, fit, position] of photographs) {
    const image = elements(fixture({ row: business({ photos: [photo] }) }).tree, node => node.type === 'img')[0]
    assert.equal(image.props.style.objectFit, fit); assert.equal(image.props.style.objectPosition, position)
  }
  const row = business({ source: 'catalogue', photo: { src: '/api/catalogue-media/eebc21d3-2f13-42cd-9f81-877eb6bc5736' } })
  const f = fixture({ row }), image = elements(f.tree, node => node.type === 'img')[0]
  assert.equal(image.props.style.objectFit, 'contain'); assert.equal(image.props.style.objectPosition, 'center')
  image.props.onError(); f.render()
  assert.equal(elements(f.tree, node => node.type === Cover)[0].props.business, row, 'failed images retain the existing activity-specific fallback')
})

test('native/external/phone booking and real directions keep their existing trusted routes', () => {
  for (const booking_mode of ['gorez', 'external', 'phone']) {
    const row = business({ booking_mode, phone: '+359888000001' }), f = fixture({ row })
    const footer = nodeClass(f.tree, 'home-business-footer')[0]
    const map = nodeClass(footer, 'home-directions')[0]
    assert.equal(map.props.href, rail.railDirections(row))
    assert.equal(map.props.rel, 'noopener noreferrer')
    if (booking_mode === 'gorez') assert.equal(elements(footer, node => node.type === Link)[0].props.href, '/book/real%2Fbranch?lang=bg')
    else assert.equal(elements(footer, node => node.type === Outbound)[0].props.business, row)
  }
  const f = fixture({ preview: true }), footer = nodeClass(f.tree, 'home-business-footer')[0]
  assert.equal(nodeClass(footer, 'home-reserve')[0].props['aria-disabled'], 'true')
  assert.equal(elements(footer, node => node.type === Link || node.type === Outbound).length, 0)
})

test('non-home callers keep the original gallery overlay, distance location, identity and actions by default', () => {
  const f = fixture({ quickChoice: undefined })
  assert.equal(nodeClass(f.tree, 'home-business-heading').length, 0)
  assert.equal(nodeClass(f.tree, 'home-business-identity').length, 0)
  assert.equal(nodeClass(f.tree, 'home-business-inline-details').length, 0)
  assert.equal(nodeClass(f.tree, 'home-business-open').length, 1)
  assert.equal(elements(nodeClass(f.tree, 'home-business-photo'), node => node.type === Badge).length, 1)
})

test('Fast Choice CSS is homepage-scoped, keeps a vertical list and lets names, prices and actions reflow', async () => {
  const css = await readFile(new URL('../app/quick-choice-cards.css', import.meta.url), 'utf8')
  const selectors = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map(match => match[1].trim()).filter(value => !value.startsWith('@'))
  for (const selector of selectors) assert.ok(selector.startsWith('.customer-home.quick-choice ') || selector.startsWith('html:not([data-theme="dark"]) .customer-home.quick-choice '), selector)
  assert.match(css, /grid-template-columns: minmax\(0,520px\) 154px/)
  assert.match(css, /justify-content: space-between/)
  assert.match(css, /@media \(max-width: 759px\)/)
  assert.match(css, /grid-template-columns: 84px minmax\(0,1fr\)/)
  assert.match(css, /\.home-business-heading > \.home-business-photo \{ grid-column: 1; grid-row: 1;/)
  assert.match(css, /\.home-business-card > \.home-business-services \{ grid-column: 1; grid-row: 2;/)
  assert.match(css, /\.home-business-card > \.home-business-footer \{ grid-column: 2; grid-row: 2;/)
  assert.match(css, /flex: 1 1 min-content/)
  assert.match(css, /min-height: 44px/)
  assert.match(css, /\.home-service-name \{[^}]*overflow: visible;[^}]*word-break: normal/)
  assert.match(css, /\.home-service-price \{[^}]*max-width: 100%;[^}]*white-space: normal/)
  assert.doesNotMatch(css, /object-position:|object-fit:|text-overflow: ellipsis|overflow-x: auto|font-size: 1[0-4]px/)
})
