import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as detailsData from '../lib/discovery/business-details.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import * as rail from '../lib/discovery/rail.mjs'
import * as cataloguePhotos from '../lib/catalogue-photo-view.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/discovery-business-details.js'
const source = await readFile(new URL(filename, import.meta.url), 'utf8')
const { code } = await transform(source, {
  filename,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})

// Use the existing SWC/component test convention with deterministic hook state.
// Effects deliberately do not execute: this is a render regression test, not a
// browser/fetch lifecycle test, and must never request production data/bookings.
function renderDetailsState({ row, full = null, status, locale = 'bg', actions }) {
  let stateIndex = 0
  const states = [full, status, 0]
  const stubs = {
    react: {
      ...React,
      useState: () => {
        assert.ok(stateIndex < states.length, 'unexpected component state; update the explicit test harness')
        return [states[stateIndex++], () => assert.fail('a render must not update hook state')]
      },
      useRef: value => ({ current: value }),
      useId: () => 'directions-regression',
      useEffect: () => {},
    },
    './icon': { Icon: ({ name }) => React.createElement('span', { 'data-icon': name }) },
    './business-photo-gallery': { BusinessPhotoGallery: () => null },
    './business-cover-photo': { BusinessCoverPhoto: () => null },
    './service-thumbnail': { ServiceThumbnail: () => null, IllustrativeServicePhotoNote: () => null },
    '../lib/dialog-focus.mjs': { containDialogTab: () => {} },
    '../lib/discovery/business-details.mjs': detailsData,
    '../lib/booking-mode.mjs': bookingMode,
    '../lib/discovery/rail.mjs': rail,
    '../lib/catalogue-photo-view.mjs': cataloguePhotos,
    '../lib/discovery/copy.mjs': { DISCOVERY_COPY },
    '../lib/discovery/service-presentation.mjs': { servicePresentation: () => ({ description: '', conditions: [] }) },
  }
  const componentModule = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name in stubs ? stubs[name] : require(name), componentModule, componentModule.exports)
  const tree = componentModule.exports.DiscoveryBusinessDetails({ row, locale, actions, onClose: () => {}, triggerRef: { current: null } })
  assert.equal(stateIndex, states.length)
  return tree
}

function elements(node, predicate, result = []) {
  if (Array.isArray(node)) {
    for (const child of node) elements(child, predicate, result)
  } else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}

const preview = source => ({
  id: source === 'catalogue' ? 'sofia-directions-fixture' : '10000000-0000-4000-8000-000000000001',
  source,
  name: 'Directions fixture',
  category: 'beauty',
  address: 'София, ул. Стар адрес 1',
  coordinates: { latitude: 42.61, longitude: 23.21 },
  detailsRef: 'fixture-details',
  services: [],
  booking: { kind: 'phone', phone: '+359888000001' },
})
const refreshed = row => ({
  id: row.id,
  source: row.source,
  name: row.name,
  category: row.category,
  address: 'София, ул. Обновен адрес 29',
  coordinates: null,
  details: { services: [], hours: [] },
})

test('ready details regenerate actions from the exact freshly displayed business, not its stale preview', () => {
  for (const source of ['catalogue', 'gorez']) {
    for (const locale of ['bg', 'en']) {
      const row = preview(source), full = refreshed(row), calls = []
      const tree = renderDetailsState({ row, full, status: 'ready', locale, actions: business => {
        calls.push(business)
        return React.createElement('a', { href: '#fresh-destination', 'data-direction-address': business.address }, business.address)
      } })
      assert.equal(calls.length, 1, `${source}/${locale}: actions render once with fresh details`)
      assert.notEqual(calls[0], row, 'the preview object is not passed to the action renderer')
      assert.deepEqual(calls[0], { ...row, ...full })
      assert.equal(calls[0].address, full.address)
      assert.equal(calls[0].coordinates, null, 'fresh null coordinates must replace the old preview pin')
      assert.deepEqual(calls[0].booking, row.booking, 'unreplaced booking metadata remains available')
      const footers = elements(tree, node => node.type === 'footer')
      assert.equal(footers.length, 1)
      assert.equal(elements(footers[0], node => node.type === 'a')[0].props['data-direction-address'], full.address)
      const html = renderToStaticMarkup(tree)
      assert.ok(html.includes(full.address), 'the address is visible in the actual rendered details')
      assert.ok(!html.includes(row.address), 'the old preview address is absent from the rendered dialog')
      assert.equal(row.address, 'София, ул. Стар адрес 1', 'rendering does not mutate the preview')
    }
  }
})

for (const status of ['loading', 'missing', 'error']) {
  test(`${status} details do not render stale navigation or invoke the action renderer`, () => {
    const row = preview('catalogue'), calls = []
    const tree = renderDetailsState({ row, status, actions: business => {
      calls.push(business)
      return React.createElement('a', { href: '#stale-destination' }, row.address)
    } })
    assert.equal(calls.length, 0)
    assert.equal(elements(tree, node => node.type === 'footer').length, 0)
    const html = renderToStaticMarkup(tree)
    assert.ok(!html.includes('stale-destination'))
    assert.ok(!html.includes(row.address))
    if (status === 'loading') assert.match(html, /aria-busy="true"/)
    if (status === 'error') assert.match(html, /role="alert"/)
  })
}
