import { loadPublicServiceMenu } from './helpers/public-service-menu.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as details from '../lib/discovery/business-details.mjs'
import * as rail from '../lib/discovery/rail.mjs'
import * as photoSources from '../lib/catalogue-photo-view.mjs'
import * as presentation from '../lib/discovery/service-presentation.mjs'
import * as copy from '../lib/discovery/copy.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { presentPublicService } from '../lib/locale/public-content-server.mjs'
import { serviceDisplayName } from '../lib/locale/public-content.mjs'

const now = Date.parse('2026-11-15T12:00:00Z'), id = 'split-menu-fixture'
const publicServiceMenu = await loadPublicServiceMenu({ ServiceThumbnail: ({ service, size }) => React.createElement('img', { src: '/service-photos/test.webp', alt: service.name, 'data-size': size }) })

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = 'components/discovery-business-details.js'
const { code } = await transform(await readFile(new URL(`../${filename}`, import.meta.url), 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const Empty = () => null
const stubs = {
  react: { ...React, useState: value => [value, () => {}], useId: () => id, useRef: value => ({ current: value }), useEffect() {} },
  './brand-loading': { BrandLoading: Empty }, './icon': { Icon: Empty }, './business-photo-gallery': { BusinessPhotoGallery: Empty }, './business-cover-photo': { BusinessCoverPhoto: Empty },
  './service-thumbnail': { ServiceThumbnail: ({ service, size }) => React.createElement('img', { src: '/service-photos/test.webp', alt: service.name, 'data-size': size }) },
  '../lib/dialog-focus.mjs': { containDialogTab() {} }, '../lib/discovery/business-details.mjs': details,
  '../lib/discovery/rail.mjs': rail, '../lib/catalogue-photo-view.mjs': photoSources, '../lib/discovery/copy.mjs': copy, '../lib/discovery/service-presentation.mjs': presentation,
}
const module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name === './public-service-menu' ? publicServiceMenu : name in stubs ? stubs[name] : require(name), module, module.exports)
const render = (services, locale = 'bg') => renderToStaticMarkup(React.createElement(module.exports.DiscoveryBusinessDetails, { row: { id: 'sofia-split-fixture', source: 'catalogue', name: 'Public menu fixture', category: 'nails', details: { services } }, locale, preview: true, onClose() {}, triggerRef: { current: null } }))
const section = (html, suffix) => html.match(new RegExp(`<section aria-labelledby="${id}-${suffix}">([\\s\\S]*?)<\\/section>`))?.[1]

test('partition follows actual display validation, preserving zero/from/ranges and original row references without mutation', () => {
  const rows = Object.freeze([
    Object.freeze({ name: 'Missing', price: null }),
    Object.freeze({ name: 'Free real service', price: 0, currency: 'EUR' }),
    Object.freeze({ name: 'From', price: 20, priceKind: 'from', currency: 'EUR' }),
    Object.freeze({ name: 'Range', price: 20, priceMaximum: 35, priceKind: 'range', currency: 'EUR' }),
    Object.freeze({ name: 'Incomplete range', price: 20, priceKind: 'range', currency: 'EUR' }),
    Object.freeze({ name: 'Reversed range', price: 20, priceMaximum: 10, priceKind: 'range', currency: 'EUR' }),
    Object.freeze({ name: 'Invalid amount', price: Infinity, currency: 'EUR' }),
  ])
  for (const locale of ['bg', 'en']) {
    const { unpriced, priced } = details.splitDetailServiceMenu(rows, locale)
    assert.deepEqual(unpriced, [rows[0], rows[4], rows[5], rows[6]])
    assert.deepEqual(priced, [rows[1], rows[2], rows[3]])
    for (const row of rows) assert.equal([...unpriced, ...priced].filter(service => service === row).length, 1)
    assert.equal(rows.length, 7)
  }
  assert.deepEqual(details.splitDetailServiceMenu([]), { unpriced: [], priced: [] })
})

for (const locale of ['bg', 'en']) test(`${locale}: Beauty Studio99 renders general services and every actual tariff once in one Services & Prices section`, () => {
  const row = SOFIA_CATALOGUE.find(row => row.id === 'sofia-beauty-studio-99')
  const services = details.businessDetailServices({ details: details.catalogueBusinessDetails(row, now) }).map(service => presentPublicService(service, row))
  const html = render(services, locale), menu = section(html, 'services')
  assert.ok(menu.includes(`>${renderToStaticMarkup(React.createElement(React.Fragment, null, copy.DISCOVERY_COPY[locale].servicesPrices))}</h3>`))
  assert.equal(section(html, 'prices'), undefined)
  assert.doesNotMatch(html, /business-details-overview/u)
  assert.equal((menu.match(/data-service-price-card=/gu) || []).length, services.length)
  for (const service of services) {
    const name = serviceDisplayName(service, locale)
    assert.ok(menu.includes(renderToStaticMarkup(React.createElement('strong', { className: 'public-service-menu-name' }, name))), name)
  }
  assert.match(menu, locale === 'bg' ? /20,45/ : /20\.45/)
  assert.match(menu, /href="https:\/\/beautystudio99\.com\/"/u)
  assert.equal((menu.match(/class="public-service-menu-unpriced"/gu) || []).length, 2, 'the two actual general services keep an honest unknown price')
})

for (const locale of ['bg', 'en']) test(`${locale}: an all-priced service appears once with its full tariff facts, not a generated duplicate overview`, () => {
  const services = [{ name: 'Actual full service name', category: 'nails', price: 0, currency: 'EUR', durationMin: 35, description: 'Actual published qualification', priceSourceUrl: 'https://example.com/actual-price' }]
  const html = render(services, locale), menu = section(html, 'services')
  assert.equal(section(html, 'prices'), undefined)
  assert.doesNotMatch(menu, /business-details-overview/u)
  assert.equal((menu.match(/class="public-service-menu-name">Actual full service name<\/strong>/gu) || []).length, 1)
  assert.match(menu, /Actual published qualification/u)
  assert.match(menu, /35 (?:min|мин)/u)
  assert.match(menu, /data-size="128"/u)
  assert.match(menu, /href="https:\/\/example\.com\/actual-price"/u)
  assert.match(menu, locale === 'bg' ? /0,00/ : /0\.00/)
})

test('from prices, ranges, long units, source links and online-only qualifications stay visible with each original matching service', () => {
  const online = 'Текуща цена с отстъпка, валидна САМО при онлайн записване, проверена на 10.11.2026. Условията се потвърждават при записване; не е зачеркнатата стара цена.'
  const services = [
    { name: 'General unpriced service', price: null, description: 'Actual general description', durationMin: 20 },
    { name: 'From service', price: 20, priceKind: 'from', currency: 'EUR', priceUnit: 'пакет от 10 посещения', description: online, priceSourceUrl: 'https://example.com/from' },
    { name: 'Range service', price: 10.23, priceMaximum: 15.34, priceKind: 'range', currency: 'EUR', priceSourceUrl: 'https://example.com/range' },
  ]
  const html = render(services), menu = section(html, 'services')
  assert.match(menu, /Actual general description/u)
  assert.match(menu, /20 мин/u)
  assert.match(menu, /From service[\s\S]*href="https:\/\/example\.com\/from"[\s\S]*от 20,00[\s\S]*пакет от 10 посещения[\s\S]*Отстъпка само онлайн/u)
  assert.match(menu, /Range service[\s\S]*href="https:\/\/example\.com\/range"[\s\S]*10,23[\s\S]*15,34/u)
  assert.equal(section(html, 'prices'), undefined)
})

test('missing prices and invalid ranges remain in the single menu without fabricated values or an empty duplicate price section', () => {
  const html = render([{ name: 'Unpublished', price: null, description: 'Actual terms' }, { name: 'Incomplete range', price: 25, priceKind: 'range', currency: 'EUR' }])
  assert.match(section(html, 'services'), /Unpublished[\s\S]*Actual terms[\s\S]*Incomplete range/u)
  assert.equal(section(html, 'prices'), undefined)
  assert.doesNotMatch(html, /class="public-service-menu-price"|25,00|0,00/u)
  assert.equal((html.match(/class="public-service-menu-unpriced"/gu) || []).length, 2)
  const empty = render([])
  assert.match(section(empty, 'services'), /Уточни услугите с бизнеса/u)
  assert.equal(section(empty, 'prices'), undefined)
})
