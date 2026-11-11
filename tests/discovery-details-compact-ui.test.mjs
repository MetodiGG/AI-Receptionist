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

// Runtime render checks follow the existing business-directions component test.
// Hooks are explicit; effects never execute, so this test cannot fetch a real
// profile, contact a provider or create a customer booking.
function renderDetails({ row, full = null, locale = 'bg', status = 'ready', actions }) {
  const states = [full, status, 0]
  let stateIndex = 0, photoNoteCalls = 0
  const stubs = {
    react: {
      ...React,
      useState: () => {
        assert.ok(stateIndex < states.length, 'unexpected state; update the explicit safe render harness')
        return [states[stateIndex++], () => assert.fail('render must not update hook state')]
      },
      useRef: value => ({ current: value }),
      useId: () => 'compact-details-fixture',
      useEffect: () => {},
    },
    './icon': { Icon: ({ name }) => React.createElement('span', { 'data-icon': name }) },
    './business-photo-gallery': { BusinessPhotoGallery: () => React.createElement('div', { 'data-gallery': true }) },
    './business-cover-photo': { BusinessCoverPhoto: () => React.createElement('div', { 'data-cover': true }) },
    './service-thumbnail': {
      ServiceThumbnail: () => React.createElement('span', { 'data-service-thumbnail': true }),
      IllustrativeServicePhotoNote: () => {
        photoNoteCalls++
        return React.createElement('p', { 'data-photo-disclaimer': true }, 'PHOTO_NOTE_SHOULD_NOT_RENDER_IN_DETAILS')
      },
    },
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
  const html = renderToStaticMarkup(tree)
  return { tree, html, photoNoteCalls }
}

function elements(node, predicate, result = []) {
  if (Array.isArray(node)) for (const child of node) elements(child, predicate, result)
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}
const hasClass = (node, name) => String(node.props.className || '').split(/\s+/).includes(name)
const preview = source => ({
  id: source === 'catalogue' ? 'sofia-compact-details-fixture' : '10000000-0000-4000-8000-000000000001',
  source, name: 'Compact details fixture', category: 'nails',
  address: 'София, ул. Стар адрес 1',
  coordinates: { latitude: 42.61, longitude: 23.21 },
  detailsRef: 'fixture', services: [],
  phone: '+359888000001', website: 'https://contacts.example.com/old-business',
  booking: { kind: 'phone', phone: '+359888000001' },
})
const freshDetails = row => ({
  id: row.id, source: row.source, name: row.name, category: row.category,
  address: 'София, ул. Обновен адрес 29', city: 'София', cityCode: '68134',
  locationKind: 'premises', coordinates: null,
  details: {
    phone: '+359888000002', sourceUrl: 'https://contacts.example.com/fresh-business',
    services: [{ name: 'Маникюр', category: 'nails', price: 25, currency: 'EUR', priceSourceUrl: 'https://prices.example.com/actual-menu' }],
    hours: [
      { weekday: 1, periods: ['09:30–13:00', '14:00–18:30'] },
      { weekday: 2, periods: [], byAppointment: true },
      { weekday: 3, periods: [] },
    ],
    hoursSourceUrl: 'https://hours.example.com/weekly-schedule',
  },
})

for (const locale of ['bg', 'en']) {
  test(`${locale}: working hours use a closed native disclosure and preserve actual weekly content`, () => {
    const row = preview('catalogue'), full = freshDetails(row), copy = DISCOVERY_COPY[locale]
    const { tree } = renderDetails({ row, full, locale })
    const disclosures = elements(tree, node => node.type === 'details' && hasClass(node, 'business-details-hours-toggle'))
    assert.equal(disclosures.length, 1)
    const disclosure = disclosures[0]
    assert.ok(disclosure.props.open == null || disclosure.props.open === false, 'hours start collapsed')
    const summaries = elements(disclosure, node => node.type === 'summary')
    assert.equal(summaries.length, 1, 'native summary is the semantic keyboard control')
    assert.equal(disclosure.props['aria-expanded'], undefined, 'native details state must not be duplicated')
    assert.equal(summaries[0].props['aria-expanded'], undefined)
    const summaryHtml = renderToStaticMarkup(summaries[0])
    assert.ok(summaryHtml.includes(copy.openingHours), 'localized opening-hours label')
    assert.match(summaryHtml, /data-icon="chevronDown"/)
    const schedules = elements(disclosure, node => node.type === 'dl' && hasClass(node, 'business-details-hours'))
    assert.equal(schedules.length, 1, 'schedule is inside the collapsed disclosure')
    const scheduleHtml = renderToStaticMarkup(schedules[0])
    assert.ok(scheduleHtml.includes(copy.weekdays[0]))
    assert.ok(scheduleHtml.includes(copy.weekdays[1]))
    assert.ok(scheduleHtml.includes(copy.weekdays[2]))
    assert.ok(scheduleHtml.includes('09:30–13:00 / 14:00–18:30'), 'real split opening periods survive')
    assert.ok(scheduleHtml.includes(copy.byAppointment), 'appointment-only day survives')
    assert.ok(scheduleHtml.includes(copy.closedDay), 'actual closed day survives')
    assert.equal(elements(tree, node => node.type === 'h3').filter(node => renderToStaticMarkup(node).includes(copy.openingHours)).length, 0, 'no duplicate large opening-hours heading')
  })

  test(`${locale}: compact details omit contact panels, hours source links and the photo-note paragraph`, () => {
    for (const kind of ['catalogue', 'gorez']) {
      const row = preview(kind), full = freshDetails(row), copy = DISCOVERY_COPY[locale]
      const { tree, html, photoNoteCalls } = renderDetails({ row, full, locale })
      assert.equal(elements(tree, node => hasClass(node, 'business-details-contact')).length, 0)
      assert.equal(elements(tree, node => node.type === 'h3').filter(node => renderToStaticMarkup(node).includes(copy.contactLabel)).length, 0)
      assert.ok(!html.includes('tel:+359888000001') && !html.includes('tel:+359888000002'))
      assert.ok(!html.includes('https://contacts.example.com/old-business'))
      assert.ok(!html.includes('https://contacts.example.com/fresh-business'))
      assert.ok(!html.includes('https://hours.example.com/weekly-schedule'))
      assert.ok(!html.includes(copy.hoursSource))
      assert.equal(photoNoteCalls, 0, 'the illustrative-photo paragraph is not rendered even with real services')
      assert.ok(!html.includes('PHOTO_NOTE_SHOULD_NOT_RENDER_IN_DETAILS'))
      assert.ok(html.includes('https://prices.example.com/actual-menu'), 'legitimate service price provenance stays intact')
      assert.ok(html.includes('data-service-thumbnail'), 'service thumbnails stay intact')
    }
  })

  test(`${locale}: compact current address is followed by fresh ready-state booking/navigation actions`, () => {
    const row = preview('catalogue'), full = freshDetails(row), calls = []
    const { tree, html } = renderDetails({ row, full, locale, actions: business => {
      calls.push(business)
      return React.createElement('a', { href: rail.railDirections(business), 'data-current-action': true }, 'CURRENT_ACTION_FIXTURE')
    } })
    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0], { ...row, ...full })
    assert.equal(calls[0].coordinates, null, 'fresh null coordinate clears stale preview')
    const addresses = elements(tree, node => node.type === 'section' && hasClass(node, 'business-details-address'))
    assert.equal(addresses.length, 1)
    assert.ok(renderToStaticMarkup(addresses[0]).includes(full.address))
    const footers = elements(tree, node => node.type === 'footer')
    assert.equal(footers.length, 1)
    const links = elements(footers[0], node => node.type === 'a')
    assert.equal(links.length, 1)
    assert.equal(new URL(links[0].props.href).searchParams.get('destination'), `${full.address}, България`)
    assert.ok(html.indexOf('business-details-address') < html.indexOf('<footer>'), 'footer follows current address metadata')
    assert.ok(!html.includes(row.address), 'stale preview address is not visible')
    assert.equal(footers[0].props.style?.minHeight, undefined, 'no inline fixed minimum-height footer spacer')
  })
}

test('missing published hours remain unknown inside the closed disclosure, not fabricated as closed all week', () => {
  for (const locale of ['bg', 'en']) {
    const row = preview('catalogue'), full = freshDetails(row)
    full.details.hours = []
    const { tree } = renderDetails({ row, full, locale })
    const disclosure = elements(tree, node => node.type === 'details' && hasClass(node, 'business-details-hours-toggle'))[0]
    assert.ok(disclosure)
    assert.ok(disclosure.props.open == null || disclosure.props.open === false)
    const html = renderToStaticMarkup(disclosure)
    assert.ok(html.includes(DISCOVERY_COPY[locale].unpublishedHours))
    assert.equal(elements(disclosure, node => node.type === 'dl').length, 0)
  }
})

for (const status of ['loading', 'missing', 'error']) {
  test(`${status}: compact details never reveal old metadata/actions before a fresh successful response`, () => {
    const row = preview('catalogue'), calls = []
    const { tree, html } = renderDetails({ row, status, actions: business => {
      calls.push(business)
      return React.createElement('a', { href: '#stale-action' }, 'STALE_ACTION_FIXTURE')
    } })
    assert.equal(calls.length, 0)
    assert.equal(elements(tree, node => node.type === 'footer').length, 0)
    assert.equal(elements(tree, node => hasClass(node, 'business-details-address')).length, 0)
    assert.ok(!html.includes(row.address) && !html.includes('STALE_ACTION_FIXTURE'))
  })
}
