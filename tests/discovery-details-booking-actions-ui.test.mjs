import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import * as rail from '../lib/discovery/rail.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { renderToStaticMarkup } from 'react-dom/server'
import * as bookingButtonContent from './helpers/booking-button-content.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/discovery-business-card.js'
const { code } = await transform(await readFile(new URL(filename, import.meta.url), 'utf8'), {
  filename,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
const Link = () => null
const LazyDetails = () => null
const OutboundBookingButton = () => null
const Empty = () => null

function elements(node, predicate, found = []) {
  if (Array.isArray(node)) for (const child of node) elements(child, predicate, found)
  else if (React.isValidElement(node)) {
    if (predicate(node)) found.push(node)
    elements(node.props.children, predicate, found)
  }
  return found
}

// Execute the real client card, exposing its lazy-details render callback.
// Deterministic hooks never run effects, imports, requests or form submission.
function detailsActions(row, locale) {
  let stateIndex = 0
  const states = [null, true]
  const stubs = {
    './booking-button-content': bookingButtonContent,
    react: { ...React, memo: component => component, useRef: value => ({ current: value }), useState: () => {
      assert.ok(stateIndex < states.length, 'unexpected state; update the explicit card harness')
      return [states[stateIndex++], () => assert.fail('render must not update state')]
    } },
    'next/link': { __esModule: true, default: Link },
    'next/dynamic': { __esModule: true, default: () => LazyDetails },
    './icon': { Icon: Empty }, './brand-logo': { BrandMark: Empty },
    './business-cover-photo': { BusinessCoverPhoto: Empty }, './service-thumbnail': { ServiceThumbnail: Empty },
    './business-reviews': { useBusinessReviews: () => assert.fail('review component is not mounted'), ReviewSummary: Empty, PartnerReviewSummary: Empty },
    './outbound-booking-button': { OutboundBookingButton },
    '../lib/booking-mode.mjs': bookingMode,
    '../lib/discovery/home.mjs': { homeBusinessPhoto: () => null },
    '../lib/discovery/rail.mjs': rail,
    '../lib/discovery/business-details.mjs': { detailPriceLabel: () => null },
    '../lib/discovery/service-presentation.mjs': { servicePresentation: () => ({ description: '', conditions: [] }) },
    '../lib/business-photo-layout.mjs': { businessPhotoStyle: () => ({}) },
    './discovery-distance-badge': { DiscoveryDistanceBadge: Empty },
    '../lib/catalogue-photo-view.mjs': { isCataloguePhotoSource: () => false },
    '../lib/discovery/copy.mjs': { DISCOVERY_COPY },
  }
  const componentModule = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name in stubs ? stubs[name] : require(name), componentModule, componentModule.exports)
  const tree = componentModule.exports.DiscoveryBusinessCard({ row, locale })
  assert.equal(stateIndex, states.length)
  const details = elements(tree, node => node.type === LazyDetails)
  assert.equal(details.length, 1)
  assert.equal(typeof details[0].props.actions, 'function')
  return details[0].props.actions
}

const phone = '+359888000001', newPhone = '+359888000002'
const day = new Date().toISOString().slice(0, 10)
const validUntil = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
const reviewed = booking => ({ ...booking, verified: true, checkedOn: day, validUntil })
const fixture = patch => ({ id: 'sofia-callback-fixture', source: 'catalogue', name: 'Old preview name', category: 'beauty', services: [], phone,
  address: 'София, ул. Стар адрес 1', website: 'https://business.bg/', booking: reviewed({ kind: 'phone', phone }), ...patch })
const reserveNodes = tree => elements(tree, node => node.props.className === 'home-reserve')

test('actual details action callback uses the refreshed catalogue form/phone/cleared state and current name in BG and EN', () => {
  for (const locale of ['bg', 'en']) {
    const row = fixture(), actions = detailsActions(row, locale)
    const fresh = { ...row, name: 'Fresh business name', address: 'София, ул. Нов адрес 9', phone: null,
      booking: reviewed({ kind: 'form', url: 'https://booking.business.bg/current-form' }) }
    let reserves = reserveNodes(actions(fresh))
    assert.equal(reserves.length, 1)
    assert.equal(reserves[0].type, 'a')
    assert.equal(reserves[0].props.href, fresh.booking.url)
    assert.equal(reserves[0].props.target, '_blank')
    assert.equal(renderToStaticMarkup(reserves[0]).replace(/<[^>]*>/g, ''), DISCOVERY_COPY[locale].reserveAppointment)
    assert.ok(reserves[0].props['aria-label'].includes(fresh.name))
    assert.ok(!reserves[0].props['aria-label'].includes(row.name))

    const phoneOnly = { ...fresh, name: 'Fresh phone venue', phone: newPhone, booking: reviewed({ kind: 'phone', phone: newPhone }) }
    reserves = reserveNodes(actions(phoneOnly))
    assert.equal(reserves.length, 1)
    assert.equal(reserves[0].props.href, `tel:${newPhone}`)
    assert.equal(reserves[0].props.target, undefined)
    assert.ok(reserves[0].props['aria-label'].includes(phoneOnly.name))
    assert.equal(reserveNodes(actions({ ...fresh, booking: null, phone: null })).length, 0, 'no stale preview phone/form survives a cleared fresh booking')
    assert.equal(row.booking.phone, phone, 'the original preview was not mutated')
  }
})

test('native-to-external details actions pass the exact fresh partner to the protected outbound component', () => {
  for (const locale of ['bg', 'en']) {
    const row = fixture({ source: 'gorez', slug: 'old-native-slug', booking_mode: 'gorez' })
    const fresh = { ...row, name: 'Updated external partner', slug: 'current-external-slug', booking_mode: 'external' }
    const tree = detailsActions(row, locale)(fresh)
    const outbound = elements(tree, node => node.type === OutboundBookingButton)
    assert.equal(outbound.length, 1)
    assert.equal(outbound[0].props.business, fresh, 'never pass stale row to approval-protected external navigation')
    assert.equal(outbound[0].props.locale, locale)
    assert.equal(elements(tree, node => node.type === Link).length, 0)
  }
})

test('external-to-native details actions use the fresh encoded slug and no stale outbound component', () => {
  for (const locale of ['bg', 'en']) {
    const row = fixture({ source: 'gorez', slug: 'old-external-slug', booking_mode: 'external' })
    const fresh = { ...row, name: 'Updated native partner', slug: 'current/branch?query=value', booking_mode: 'gorez' }
    const tree = detailsActions(row, locale)(fresh)
    const links = elements(tree, node => node.type === Link)
    assert.equal(links.length, 1)
    assert.equal(links[0].props.href, `/book/${encodeURIComponent(fresh.slug)}?lang=${locale}`)
    assert.equal(links[0].props.prefetch, false)
    assert.ok(!links[0].props.href.includes(row.slug))
    assert.equal(elements(tree, node => node.type === OutboundBookingButton).length, 0)
  }
})
