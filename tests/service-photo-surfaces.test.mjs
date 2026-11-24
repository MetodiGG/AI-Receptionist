import { loadPublicServiceMenu } from './helpers/public-service-menu.mjs'
import test from 'node:test'
import * as brandLoading from './helpers/brand-loading.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as serviceArt from '../lib/service-thumbnail.mjs'
import * as publicPhotoPresentation from '../lib/discovery-photo-presentation.mjs'
import * as businessDetails from '../lib/discovery/business-details.mjs'
import * as discoveryRail from '../lib/discovery/rail.mjs'
import * as discoveryHome from '../lib/discovery/home.mjs'
import * as discoveryCopy from '../lib/discovery/copy.mjs'
import * as cataloguePhotos from '../lib/catalogue-photo-view.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import * as dialogFocus from '../lib/dialog-focus.mjs'
import * as publicLocale from '../lib/public-locale.mjs'
import * as directory from '../lib/directory.mjs'
import * as partnerCategories from '../lib/partner-categories.mjs'
import * as businessCover from '../lib/business-cover-photo.mjs'
import * as servicePresentation from '../lib/discovery/service-presentation.mjs'
import * as photoLayout from '../lib/business-photo-layout.mjs'
import * as bookingButtonContent from './helpers/booking-button-content.mjs'
import * as publicAction from './helpers/public-action.mjs'
import { DirectionsUnavailable } from './helpers/verified-directions.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()

async function load(name, stubs) {
  const filename = `../components/${name}.js`
  const source = await readFile(new URL(filename, import.meta.url), 'utf8')
  const { code } = await transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(key => key === './public-service-menu' ? publicServiceMenu : key === './public-action' ? publicAction : key === './public-action.module.css' ? publicAction.publicActionStyles : Object.hasOwn(stubs, key) ? stubs[key] : key === './brand-loading' ? brandLoading : require(key), module, module.exports)
  return module.exports
}

const noop = () => null
const icon = { Icon: () => createElement('svg', { 'aria-hidden': true }) }
const thumbnail = await load('service-thumbnail', { './icon': icon, '../lib/service-thumbnail.mjs': serviceArt,
  '../lib/discovery-photo-presentation.mjs': publicPhotoPresentation })
const publicServiceMenu = await loadPublicServiceMenu({ ServiceThumbnail: thumbnail.ServiceThumbnail, Icon: icon.Icon })
const cover = await load('business-cover-photo', { '../lib/business-cover-photo.mjs': businessCover,
  '../lib/discovery-photo-presentation.mjs': publicPhotoPresentation })
const shared = {
  './booking-button-content': bookingButtonContent,
  './icon': icon, './service-thumbnail': { ...thumbnail, IllustrativeServicePhotoNote: noop }, './business-cover-photo': cover,
  './business-photo-gallery': { BusinessPhotoGallery: ({ photos, fallback }) => photos?.length ? createElement('div', { 'data-real-cover': photos[0].src }) : fallback },
  './outbound-booking-button': { OutboundBookingButton: noop },
  './directions-unavailable': { DirectionsUnavailable },
  '../lib/booking-mode.mjs': bookingMode, '../lib/discovery/business-details.mjs': businessDetails,
  '../lib/discovery/rail.mjs': discoveryRail, '../lib/discovery/copy.mjs': discoveryCopy,
  '../lib/catalogue-photo-view.mjs': cataloguePhotos,
  '../lib/discovery/service-presentation.mjs': servicePresentation,
  '../lib/business-photo-layout.mjs': photoLayout,
}
const { DiscoveryBusinessCard } = await load('discovery-business-card', {
  ...shared, 'next/link': ({ children, href }) => createElement('a', { href }, children), 'next/dynamic': () => noop,
  './brand-logo': { BrandMark: noop }, './business-reviews': { useBusinessReviews: noop, ReviewSummary: noop, PartnerReviewSummary: noop },
  './discovery-distance-badge': { DiscoveryDistanceBadge: noop }, '../lib/discovery/home.mjs': discoveryHome,
})
const { DiscoveryBusinessDetails } = await load('discovery-business-details', { ...shared, '../lib/dialog-focus.mjs': dialogFocus })
const { BusinessDirectory } = await load('business-directory', {
  ...shared, 'next/link': ({ children, href }) => createElement('a', { href }, children), './directory-filters': { DirectoryFilters: noop },
  './partner-categories': { PartnerCategories: noop }, '../hooks/use-directory': { useDirectory: preview => preview }, '../lib/public-locale.mjs': publicLocale,
  '../lib/directory.mjs': directory, '../lib/partner-categories.mjs': partnerCategories, '../lib/product-events-client': { trackProductEvent: noop },
})

const business = { id: 'fixture-studio', slug: 'fixture-studio', name: 'Fixture Studio', category: 'nails', industry: 'beauty' }
const services = [
  { id: 'manicure', name: 'Manicure', category: 'nails', price: 25, currency: 'EUR', duration_min: 35 },
  { id: 'pedicure', name: 'Pedicure', category: 'nails', price: null, currency: 'EUR', duration_min: 40 },
]
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props))
const serviceRows = html => [...html.matchAll(/<li\b[^>]*data-service-price-card="true"[^>]*>([\s\S]*?)<\/li>/g)].map(([, row]) => row)

test('discovery omits unassigned covers without hiding the menu, and preserves genuine supplied galleries', () => {
  const catalogue = { ...business, source: 'catalogue', category: 'nails', services }
  const card = props => render(DiscoveryBusinessCard, { row: props, locale: 'en', preview: true })
  const details = props => render(DiscoveryBusinessDetails, { row: props, locale: 'bg', preview: true })
  assert.match(card(catalogue), /Manicure/)
  assert.match(details(catalogue), /data-service-price-menu/)
  assert.doesNotMatch(card(catalogue)+details(catalogue), /data-category-cover|Photo unavailable|Снимката не е налична|data-image-kind="ai-illustration"/)
  const partner = { ...catalogue, source: 'gorez', category: 'beauty', businessCategory: 'barber' }
  assert.doesNotMatch(card(partner), /data-category-cover|Photo unavailable/)
  const real = { ...partner, photos: [{ src: '/businesses/fixture-studio/interior.webp' }] }
  assert.match(card(real), /src="\/businesses\/fixture-studio\/interior.webp"/)
  assert.match(details(real), /data-real-cover="\/businesses\/fixture-studio\/interior.webp"/)
  assert.doesNotMatch(card(real) + details(real), /data-category-cover/)
  const directoryHtml = item => render(BusinessDirectory, { locale: 'bg', preview: { businesses: [item], status: 'ready' }, bookingDisabled: true, showFilters: false })
  assert.match(directoryHtml(partner), /data-category-cover="barber"/)
  assert.doesNotMatch(directoryHtml(real), /data-category-cover/)
})

test('compact discovery previews restore up to two original service thumbnails and prices without mutating the full menu', () => {
  const row = { ...business, source: 'catalogue', services }
  const before = structuredClone(row)
  const html = render(DiscoveryBusinessCard, { row, locale: 'en', preview: true })
  assert.match(html,/home-business-service-preview/)
  assert.equal((html.match(/class="home-business-preview-name"/g)||[]).length,2)
  assert.equal((html.match(/class="home-business-preview-price"/g)||[]).length,1)
  assert.equal((html.match(/data-service-photo-unavailable="true"/g)||[]).length,2)
  assert.doesNotMatch(html,/home-business-inline-details/)
  assert.deepEqual(row, before)
  assert.doesNotMatch(render(DiscoveryBusinessCard, { row: { ...row, source: 'google' }, locale: 'en', preview: true }), /home-business-services|service-photo-name/)
})

test('the full catalogue menu retains the service description, duration, and published price link', () => {
  const [first, ...others] = services
  const row = { ...business, source: 'catalogue', details: { services: [{ ...first, priceKind: 'from', description: 'Published service terms', priceSourceUrl: 'https://example.com/prices' }, ...others] } }
  const [manicure, pedicure] = serviceRows(render(DiscoveryBusinessDetails, { row, locale: 'en', preview: true }))
  assert.match(manicure, /data-service-photo-unavailable="true"[\s\S]*class="public-service-menu-name">Manicure<\/strong>/)
  assert.match(manicure, /class="public-service-menu-duration">35 min<\/span>/)
  assert.match(manicure, /<p class="public-service-menu-note">Published service terms<\/p>/)
  assert.match(manicure, /<a class="public-service-menu-price" href="https:\/\/example\.com\/prices"[^>]*><span>from €25\.00<\/span><\/a>/)
  assert.match(pedicure, /data-service-photo-unavailable="true"[\s\S]*class="public-service-menu-name">Pedicure<\/strong>/)
  assert.match(pedicure, /class="public-service-menu-unpriced"/)
  assert.doesNotMatch(pedicure, /class="public-service-menu-price"/)
})

test('G Point logo remains whole and service prices retain compact online-only conditions without audit prose', async () => {
  const name = 'Лазерна епилация · Цяло лице · жени'
  const service = { name, category: 'beauty', price: 30, currency: 'EUR', priceUnit: 'процедура',
    description: 'Текуща цена с отстъпка, валидна САМО при онлайн записване, проверена на 10.11.2026. Условията се потвърждават при записване; не е зачеркнатата стара цена.',
    priceSourceUrl: 'https://gpoint.bg/запазване-час' }
  const row = { id: 'sofia-gpoint-manastirski-zapad', source: 'catalogue', name: 'G Point · Манастирски ливади – Запад', category: 'beauty',
    services: [service], photo: { src: '/api/catalogue-media/eebc21d3-2f13-42cd-9f81-877eb6bc5736', alt: 'G Point' } }
  const card = render(DiscoveryBusinessCard, { row, locale: 'bg', preview: true })
  const details = render(DiscoveryBusinessDetails, { row, locale: 'bg', preview: true })
  assert.match(card, /object-fit:contain;object-position:center;background-color:#fff/)
  assert.ok(card.includes(name),'the first two real relevant services invite the visitor to open the complete menu')
  assert.match(card,/class="home-business-preview-unit">процедура<\/span>/)
  assert.match(card,/Отстъпка само онлайн/)
  for (const html of [card,details]) {
    assert.match(html, /Отстъпка само онлайн/)
    assert.doesNotMatch(html, /проверена на|зачеркнатата|Условията се потвърждават/)
  }
  assert.match(details, /class="public-service-menu-unit">процедура<\/small>/)
  assert.match(details, /<div class="business-details-toolbar"><button[^>]+class="business-details-close"/)
  assert.match(details, /https:\/\/gpoint.bg\//)
  const css = await readFile(new URL('../app/service-photo-surfaces.css', import.meta.url), 'utf8')
  assert.match(css, /\.home-business-card h3, \.home-business-services \.home-service-name \{[^}]*-webkit-line-clamp: unset/)
  assert.match(css, /\.service-price-unit \{[^}]*white-space: normal/)
  assert.match(css, /\.business-details-toolbar \.business-details-close \{ position: static; float: none; margin: 0;/)
})

test('partner cards preserve the service cap, names, durations, and published prices', () => {
  const businesses = [{ ...business, services: [...services, ...[3, 4, 5].map(id => ({ id: String(id), name: `Extra service ${id}`, price: 0, duration_min: 30 }))] }]
  const html = render(BusinessDirectory, { locale: 'en', partners: true, showFilters: false, bookingDisabled: true, preview: { businesses, status: 'ready' } })
  assert.equal([...html.matchAll(/class="directory-service-row"/g)].length, 4)
  assert.match(html, /data-service-photo-unavailable="true".*<div class="directory-service-copy">Manicure<small>35 min<\/small><\/div><\/div><b>€25\.00<\/b>/)
  assert.match(html, /data-service-photo-unavailable="true".*<div class="directory-service-copy">Pedicure<small>40 min<\/small><\/div><\/div><\/div>/)
  assert.match(html, /Extra service 4/)
  assert.doesNotMatch(html, /Extra service 5/)
})
