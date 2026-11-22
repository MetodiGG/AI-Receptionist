import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DateTime } from 'luxon'
import * as bookingMode from '../lib/booking-mode.mjs'
import * as profileUi from '../lib/business-profile-ui.mjs'
import * as bookingWindow from '../lib/booking-window.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'
import * as content from './helpers/booking-button-content.mjs'
import * as publicAction from './helpers/public-action.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const Empty = () => null
async function load(path, imports) {
  const source = await read(path)
  const { code } = await transform(source, { filename: path, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name === './public-action' ? publicAction : name === './public-action.module.css' ? publicAction.publicActionStyles : Object.hasOwn(imports, name) ? imports[name] : require(name), module, module.exports)
  return module.exports
}
const { OutboundBookingButton } = await load('components/outbound-booking-button.js', {
  '../lib/booking-mode.mjs': bookingMode, './booking-button-content': content,
  './brand-loading': { BrandLoading: Empty },
})
const profileSource = await read('components/public-booking-page.js')
const imports = {
  react: React, 'react-dom': require('react-dom'), luxon: { DateTime },
  '../lib/booking-mode.mjs': bookingMode, '../lib/business-profile-ui.mjs': profileUi,
  '../lib/booking-window.mjs': bookingWindow, '../lib/supabase': { hasSupabaseConfig: false },
  './booking-button-content': content, './outbound-booking-button': { OutboundBookingButton },
  './business-profile': { BusinessServiceList: Empty },
  './monthly-booking-calendar': { MonthlyBookingCalendar: () => assert.fail('no service was selected; no availability calendar should mount') },
  './guided-booking-chat': { GuidedBookingChat: () => assert.fail('the assistant has not been opened') },
}
// Only the real public booking controls/panels are mounted. Effects, customer
// forms, provider SDKs, notifications and production records are never run.
const inertImports = new Proxy({}, { get: () => Empty })
for (const match of profileSource.matchAll(/from ['"]([^'"]+)['"]/g)) if (!Object.hasOwn(imports, match[1])) imports[match[1]] = inertImports
const { BusinessBookingExperience } = await load('components/public-booking-page.js', imports)
const business = {
  id: 'offline-compact-cta', slug: 'offline-compact-cta', name: 'Offline compact CTA fixture',
  timezone: 'Europe/Sofia', phone: '+359 (888) 123-456', services: [], staff: [], workingHours: [],
}
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const bookingLabels = html => [...html.matchAll(/<span class="public-action-label">([^<]*)<\/span>/g)].map(match => match[1])

test('actual BG/EN native, external and phone public controls use short visible labels without shortening headings or legal copy', () => {
  for (const [locale, label] of [['bg', 'Резервирай'], ['en', 'Book']]) {
    assert.equal(DISCOVERY_COPY[locale].reserveAppointment, label)
    assert.equal(DISCOVERY_COPY[locale].directions, locale === 'bg' ? 'Упътване' : 'Directions')
    assert.equal(HOME_DISCOVERY_COPY[locale].reserve, label)
    for (const booking_mode of ['gorez', 'external', 'phone']) {
      const html = render(BusinessBookingExperience, { business: { ...business, booking_mode, booking_terms: 'Real booking terms remain unchanged.' }, locale })
      const labels = bookingLabels(html)
      assert.ok(labels.length > 0, `${locale}/${booking_mode}`)
      assert.ok(labels.every(value => value === label), `${locale}/${booking_mode}: ${labels}`)
      assert.match(html, /Real booking terms remain unchanged\./)
      if (booking_mode === 'gorez') {
        assert.match(html, /aria-pressed="true" aria-controls="profile-native-panel"/)
        assert.ok(html.includes(`<h2>${locale === 'bg' ? 'Резервирай час' : 'Book an appointment'}</h2>`), 'the section heading remains descriptive')
        assert.doesNotMatch(html, /<form\b|href="tel:/)
      } else if (booking_mode === 'phone') {
        assert.match(html, /href="tel:\+359888123456"/)
        assert.doesNotMatch(html, /<form\b|profile-mode-controls|name="eventId"/)
      } else {
        assert.ok(html.includes(`action="/out/business/offline-compact-cta?lang=${locale}" method="post"`))
        assert.match(html, /name="eventId"/)
        assert.doesNotMatch(html, /href="tel:/)
      }
    }
  }
  assert.match(profileSource, /'Confirm booking' : 'Потвърди резервацията'/)
})

// Extract declaration-only rules without depending on formatting or property
// order. Exact selector matching avoids confusing hover/media overrides with
// the shared base geometry. Selector commas inside :is() are not separators.
function rules(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }))
}
function selectorList(selector) {
  const result = []; let depth = 0, start = 0
  for (let index = 0; index < selector.length; index++) {
    if (selector[index] === '(') depth++
    if (selector[index] === ')') depth--
    if (selector[index] === ',' && depth === 0) { result.push(selector.slice(start, index).trim()); start = index + 1 }
  }
  result.push(selector.slice(start).trim())
  return result
}
function declarations(css, selector, predicate = () => true) {
  const found = rules(css).find(rule => selectorList(rule.selector).includes(selector) && predicate(rule.body))
  assert.ok(found, `missing rule: ${selector}`)
  return Object.fromEntries([...found.body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()]))
}

test('shared public booking controls are compact 44px targets with preserved word-width wrapping and understated depth', async () => {
  const css = await read('app/booking-actions.css')
  const shared = declarations(css, '.home-business-actions .home-reserve', body => body.includes('box-sizing:'))
  for (const [key, value] of Object.entries({ 'min-height': '44px', height: 'auto', padding: '7px 10px', 'border-radius': '12px', 'font-size': '15px', 'white-space': 'normal', 'min-width': '0', 'max-width': '100%' })) assert.equal(shared[key], value, key)
  assert.ok(shared['box-shadow'].includes('0 2px 0 var(--action-edge)'))
  const label = declarations(css, '.booking-button-label')
  for (const [key, value] of Object.entries({ flex: '1 1 min-content', 'white-space': 'normal', 'overflow-wrap': 'break-word', 'word-break': 'normal', 'max-width': '100%' })) assert.equal(label[key], value, key)
  assert.equal(declarations(css, '.booking-button-content')['flex-wrap'], 'wrap')
  const icon = declarations(css, '.booking-button-content .booking-calendar-icon')
  assert.equal(icon.width, '24px'); assert.equal(icon.height, '24px')
  const headingIcon = declarations(css, '.booking-calendar-icon')
  assert.equal(headingIcon.width, '30px'); assert.equal(headingIcon.height, '30px'); assert.equal(headingIcon['object-fit'], 'contain')
  const service = declarations(css, '.profile-redesign .profile-service-book', body => /(?:^|;)\s*width:/.test(body))
  assert.equal(service.width, '44px'); assert.equal(service['min-height'], '44px')
  const serviceIcon = declarations(css, '.profile-redesign .profile-service-book .booking-calendar-icon')
  assert.equal(serviceIcon.width, '26px'); assert.equal(serviceIcon.height, '26px')
  assert.equal(declarations(css, '.profile-redesign .profile-mode-controls > button')['min-height'], '44px')
  const map = declarations(css, '.home-business-actions .home-directions > svg')
  assert.equal(map.width, '24px'); assert.equal(map.height, '24px')
  assert.equal(map.flex, '0 0 24px', 'both customer action icons occupy the same fixed-width lane')
  const reserveContent = declarations(css, '.home-business-actions .booking-button-content')
  assert.equal(reserveContent.width, '100%'); assert.equal(reserveContent['justify-content'], 'flex-start')
  const directions = declarations(css, '.home-business-actions .home-directions', body => body.includes('flex-wrap:'))
  assert.equal(directions['justify-content'], 'flex-start'); assert.equal(directions['flex-wrap'], 'wrap')
  const directionsLabel = declarations(css, '.home-business-actions .home-maps-label')
  assert.equal(directionsLabel.flex, '1 1 min-content'); assert.equal(directionsLabel['overflow-wrap'], 'break-word')
  const profileMap = declarations(css, '.profile-redesign .profile-directions .profile-map-icon')
  assert.equal(profileMap.width, '22px'); assert.equal(profileMap.height, '22px', 'the separate profile map treatment is not enlarged')
  assert.match(css, /outline: 3px solid #984419; outline-offset: 4px/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /:is\(:hover,:focus-visible,:active\) \{ transform: none/)
  assert.doesNotMatch(css, /white-space:\s*nowrap|word-break:\s*break-all|text-overflow:\s*ellipsis|overflow:\s*hidden/)
  assert.doesNotMatch(css, /\.dashboard|\.sidebar|\.month-date|\.home-categories|gmp-/)
})

test('Fast Choice CTA compactness stays scoped to direct homepage actions, with safe mobile wrapping and unchanged imagery', async () => {
  const css = await read('app/quick-choice-cards.css')
  const scope = '.customer-home.quick-choice .home-business-card > .home-business-footer'
  const card = declarations(css, '.customer-home.quick-choice .home-business-grid .home-business-card:is([data-source="gorez"],[data-source="catalogue"])')
  assert.equal(card['grid-template-columns'], 'minmax(0,520px) 154px')
  assert.equal(card['justify-content'], 'space-between')
  assert.equal(card.padding, '18px'); assert.equal(card['border-radius'], '16px')
  const actions = declarations(css, `${scope} > .home-business-actions :is(.home-directions,.home-reserve)`)
  for (const [key, value] of Object.entries({ 'min-height': '44px', padding: '8px 10px', 'font-size': '15px', 'border-radius': '12px' })) assert.equal(actions[key], value, key)
  assert.equal(declarations(css, `${scope} > .home-business-actions`).gap, '9px')
  assert.ok(actions['box-shadow'].includes('0 1px 0 var(--action-edge)'), 'Directions uses the quiet one-pixel edge')
  assert.ok(declarations(css, `${scope} > .home-business-actions .home-reserve`)['box-shadow'].includes('0 2px 0 var(--action-edge)'), 'Reserve retains a slightly stronger, restrained edge')
  const calendar = declarations(css, `${scope} .booking-calendar-icon`)
  assert.equal(calendar.width, '24px'); assert.equal(calendar.height, '24px')
  const map = declarations(css, `${scope} .home-directions > svg`)
  assert.equal(map.width, '24px'); assert.equal(map.height, '24px')
  for (const { selector } of rules(css)) assert.ok(selector.startsWith('.customer-home.quick-choice ') || selector.startsWith('html:not([data-theme="dark"]) .customer-home.quick-choice '), selector)
  assert.match(css, /@media \(max-width: 759px\)/)
  assert.match(css, /flex-direction: row; flex-wrap: wrap/)
  assert.match(css, /flex: 1 1 min-content; width: auto/)
  assert.doesNotMatch(css, /(?:^|[;{]\s*)height:\s*44px;|white-space:\s*nowrap|text-overflow:\s*ellipsis|overflow:\s*hidden|object-fit:|object-position:/)
})

test('desktop services sit below the photo header with truly central prices and a separate right-hand CTA column', async () => {
  const css = await read('app/quick-choice-cards.css')
  const card = '.customer-home.quick-choice .home-business-grid .home-business-card'
  const heading = declarations(css, '.customer-home.quick-choice .home-business-heading')
  const photo = declarations(css, '.customer-home.quick-choice .home-business-heading > .home-business-photo')
  const identity = declarations(css, '.customer-home.quick-choice .home-business-identity')
  const footer = declarations(css, `${card} > .home-business-footer`)
  const services = declarations(css, `${card} > .home-business-services`)
  assert.equal(heading['grid-column'], '1 / -1'); assert.equal(heading['grid-row'], '1')
  assert.equal(heading['grid-template-columns'], '104px minmax(0,1fr)')
  assert.equal(heading['column-gap'], '15px'); assert.equal(heading['align-items'], 'center')
  assert.equal(photo['grid-column'], '1'); assert.equal(photo['grid-row'], '1')
  assert.equal(photo.width, '104px'); assert.equal(photo.height, '98px')
  assert.equal(identity['grid-column'], '2'); assert.equal(identity['grid-row'], '1')
  assert.equal(footer['grid-column'], '2'); assert.equal(footer['grid-row'], '2')
  assert.equal(footer.width, '154px'); assert.equal(footer['max-width'], '100%'); assert.equal(footer['justify-self'], 'end')
  assert.equal(services['grid-column'], '1'); assert.equal(services['grid-row'], '2')
  assert.notEqual(photo['grid-row'], services['grid-row'])
  const row = declarations(css, '.customer-home.quick-choice .home-business-services > li')
  assert.equal(row.display, 'grid'); assert.equal(row['grid-template-columns'], 'minmax(0,1fr) 112px'); assert.equal(row.gap, '4px 12px')
  assert.equal(declarations(css, '.customer-home.quick-choice .home-business-services .service-photo-name')['grid-column'], '1')
  const price = declarations(css, '.customer-home.quick-choice .home-business-services .home-service-price')
  assert.equal(price['grid-column'], '2'); assert.equal(price['text-align'], 'center'); assert.equal(price['margin-inline-start'], '0')
  const mobile = css.slice(css.indexOf('@media (max-width: 759px)'))
  assert.equal(declarations(mobile, `${card}:is([data-source="gorez"],[data-source="catalogue"])`)['grid-template-columns'], 'minmax(0,1fr)')
  assert.equal(declarations(mobile, '.customer-home.quick-choice .home-business-heading')['grid-template-columns'], '84px minmax(0,1fr)')
  const mobilePhoto = declarations(mobile, '.customer-home.quick-choice .home-business-heading > .home-business-photo')
  const mobileServices = declarations(mobile, `${card} > .home-business-services`)
  const mobileFooter = declarations(mobile, `${card} > .home-business-footer`)
  assert.equal(mobilePhoto.width, '84px'); assert.equal(mobilePhoto.height, '92px')
  assert.equal(mobilePhoto['grid-row'], '1')
  assert.equal(mobileServices['grid-column'], '1'); assert.equal(mobileServices['grid-row'], '2')
  assert.equal(mobileFooter['grid-column'], '1'); assert.equal(mobileFooter['grid-row'], '3'); assert.equal(mobileFooter.width, '100%')
  assert.equal(declarations(mobile, '.customer-home.quick-choice .home-business-services > li').display, 'flex')
  const mobilePrice = declarations(mobile, '.customer-home.quick-choice .home-business-services .home-service-price')
  assert.equal(mobilePrice['text-align'], 'end'); assert.equal(mobilePrice['margin-inline-start'], 'auto')
  assert.equal(declarations(mobile, `${card}:is([data-source="gorez"],[data-source="catalogue"])`).padding, '14px')
  const mobileActions = declarations(mobile, '.customer-home.quick-choice .home-business-card > .home-business-footer > .home-business-actions')
  assert.equal(mobileActions['flex-wrap'], 'wrap'); assert.equal(mobileActions['flex-direction'], 'row')
  const mobileTarget = declarations(mobile, '.customer-home.quick-choice .home-business-card > .home-business-footer > .home-business-actions > :is(.home-directions,.home-reserve,.outbound-booking-form)')
  assert.equal(mobileTarget.flex, '1 1 min-content', 'real words, not fixed half-width tracks, set the safe Android/text-scaling wrap threshold')
})

test('the approved bounded service lane keeps desktop prices near the rail center without stretching names toward the right-hand actions', async () => {
  const css = await read('app/quick-choice-cards.css')
  const card = declarations(css, '.customer-home.quick-choice .home-business-grid .home-business-card:is([data-source="gorez"],[data-source="catalogue"])')
  const row = declarations(css, '.customer-home.quick-choice .home-business-services > li')
  const [, serviceMaximum, actionWidth] = card['grid-template-columns'].match(/^minmax\(0,(\d+)px\) (\d+)px$/)
  const [, priceWidth] = row['grid-template-columns'].match(/^minmax\(0,1fr\) (\d+)px$/)
  const cardWidth = 960, inset = parseFloat(card.padding) + 1
  const available = cardWidth - inset * 2 - Number(actionWidth) - 24
  const serviceWidth = Math.min(Number(serviceMaximum), available)
  const priceCenter = inset + serviceWidth - Number(priceWidth) / 2
  assert.ok(Math.abs(priceCenter - cardWidth / 2) <= 4, `at the approved 960px rail, price center ${priceCenter} stays by card center ${cardWidth / 2}`)
  assert.ok(serviceWidth + Number(actionWidth) + 24 <= cardWidth - inset * 2)
  assert.equal(card['min-width'], '0', 'narrow desktop service content is allowed to shrink instead of overflowing')
})

test('the approved light action pair uses distinct cream and peach surfaces with readable text and leaves dark-mode variables separate', async () => {
  const css = await read('app/quick-choice-cards.css'), prefix = 'html:not([data-theme="dark"]) .customer-home.quick-choice .home-business-actions '
  const directions = declarations(css, prefix + '.home-directions'), reserve = declarations(css, prefix + '.home-reserve')
  assert.equal(directions['--action-top'], '#fffcf6'); assert.equal(directions['--action-bottom'], '#faeddd')
  assert.equal(reserve['--action-top'], '#ffe7d0'); assert.equal(reserve['--action-bottom'], '#f9c795')
  assert.notEqual(directions['--action-bottom'], reserve['--action-bottom'])
  function luminance(hex) {
    const [r, g, b] = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    return .2126 * r + .7152 * g + .0722 * b
  }
  for (const action of [directions, reserve]) for (const surface of ['--action-top', '--action-bottom']) {
    const values = [luminance(action['--action-ink']), luminance(action[surface])].sort((a, b) => b - a)
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${action['--action-ink']} on ${action[surface]}`)
  }
})
