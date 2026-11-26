import test from 'node:test'
import assert from 'node:assert/strict'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import { loadPublicServiceMenu } from './helpers/public-service-menu.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { catalogueBusinessDetails, detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { presentPublicService } from '../lib/locale/public-content-server.mjs'
const { PublicServiceMenu } = await loadPublicServiceMenu({
  ServiceThumbnail: ({ service, size, className }) => React.createElement('img', { src: '/service-photos/test.webp', alt: service.name, className, 'data-size': size }),
})
const render = (services, props = {}) => renderToStaticMarkup(React.createElement(PublicServiceMenu, { services, business: { category: 'nails' }, ...props }))
const escape = value => renderToStaticMarkup(React.createElement(React.Fragment, null, value))
const withoutDetails = html => html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gu, '')
const summaries = html => [...html.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gu)].map(match => match[1])

test('the actual unified menu renders every original service once, including same-name distinct prices, zero, unknown and incomplete ranges', () => {
  const services = [
    { name: 'General service', category: 'nails', price: null },
    { name: 'Same variant', category: 'nails', price: 0, currency: 'EUR' },
    { name: 'Same variant', category: 'nails', price: 20, currency: 'EUR' },
    { name: 'From variant', category: 'nails', price: 30, priceKind: 'from', currency: 'EUR' },
    { name: 'Range variant', category: 'nails', price: 40, priceMaximum: 60, priceKind: 'range', currency: 'EUR' },
    { name: 'Incomplete range', category: 'nails', price: 90, priceKind: 'range', currency: 'EUR' },
  ]
  const before = structuredClone(services), html = render(services)
  assert.deepEqual(services, before)
  assert.equal((html.match(/data-service-price-card=/gu) || []).length, services.length)
  assert.equal((html.match(/class="public-service-menu-name">Same variant<\/strong>/gu) || []).length, 2)
  assert.equal((html.match(/data-size="128"/gu) || []).length, services.length)
  assert.match(html, /от 30,00/u)
  assert.match(html, /40,00[\s\S]*60,00/u)
  assert.match(html, /0,00/u)
  assert.doesNotMatch(html, /90,00|business-details-overview/u)
  assert.equal((html.match(/class="public-service-menu-unpriced"/gu) || []).length, 2)
})

test('price ranges, translated units and source links stay visible while one button retains short substantive conditions', () => {
  const services = [{
    name: 'Actual full service name', category: 'nails', price: 15, priceMaximum: 25, priceKind: 'range', currency: 'EUR',
    priceUnit: 'пакет 2 посещения', presentationEn: { name: 'Actual full service name', unit: 'package of 2 visits' },
    priceSourceUrl: 'https://example.test/real-menu', durationMin: 45,
    description: 'Materials are not included; excluding VAT. Total package of 2 visits. This price requires advance confirmation.',
  }]
  const html = render(services, { locale: 'en' }), visible = withoutDetails(html)
  for (const phrase of ['package of 2 visits', '45 min']) assert.ok(visible.includes(phrase), phrase)
  assert.deepEqual(summaries(html).map(summary => summary.includes('Conditions apply')), [true])
  for (const phrase of ['Materials are not included', 'excluding VAT', 'Total package of 2 visits', 'advance confirmation']) {
    assert.ok(html.includes(phrase), phrase)
    assert.ok(!visible.includes(phrase), phrase)
  }
  assert.match(html, /href="https:\/\/example\.test\/real-menu" target="_blank" rel="noopener noreferrer"/u)
  assert.ok(html.includes(escape(detailPriceLabel(services[0], 'en'))))
  const sourceLabel = html.match(/<a class="public-service-menu-price"[^>]*aria-label="([^"]+)"/u)?.[1]
  assert.ok(sourceLabel?.includes('package of 2 visits'))
  assert.doesNotMatch(sourceLabel, /[а-яѝ]/iu, 'the accessible source-price label uses the same translated unit as the visible price')
  assert.equal((html.match(/data-service-price-card=/gu) || []).length, 1)
})

test('the entire long narrative uses a closed native disclosure while complete names and structured price facts remain visible', () => {
  const narrative = 'We shape the hair with flowing lines and soft movement, combining its natural colour with a refined finish. The hairstyle expresses individual style and creates a light feel, while careful washing and drying complete the fresh look.'
  const html = render([{ name: 'A complete unusually long service name without abbreviation or removed words', price: 25, currency: 'EUR', description: narrative }], { locale: 'en' })
  assert.match(html, /<details class="public-service-menu-more" data-service-more="true">/u)
  assert.match(html, /View details/u)
  assert.doesNotMatch(html, /Read more|Read less|Conditions apply/u)
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/u)
  assert.ok(withoutDetails(html).includes('A complete unusually long service name without abbreviation or removed words'))
  assert.ok(html.includes(escape(narrative)), 'the full original long description is available contiguously inside Read more')
  assert.ok(!withoutDetails(html).includes('We shape the hair with flowing lines'), 'long prose is folded, not repeated above the control')
  assert.doesNotMatch(html, /aria-expanded=|<button|<form|fetch\(/u)
})

for (const locale of ['bg', 'en']) test(`${locale}: one Conditions apply button opens all qualifications and structured prices remain visible`, () => {
  const bg = 'Материалите и допълнителните консумативи не са включени в тази цена. Общата цена е за пакет от 2 посещения и се потвърждава предварително с бизнеса. При промяна на условията се свържете със специалиста преди посещение. Цената е без ДДС.'
  const en = 'Materials and additional consumables are not included in this price. The total price is for a package of 2 visits and is confirmed with the business in advance. If the conditions change, contact the specialist before the visit. The price excludes VAT.'
  const online = 'Текуща цена с отстъпка, валидна САМО при онлайн записване, проверена на 10.11.2026. Условията се потвърждават при записване; не е зачеркнатата стара цена. '
  const service = { name: 'Actual qualified service', category: 'nails', price: 15, priceMaximum: 25, priceKind: 'range', currency: 'EUR',
    priceUnit: 'пакет 2 посещения', durationMin: 45, description: online + bg,
    presentationEn: { name: 'Actual qualified service', unit: 'package of 2 visits', description: en } }
  const html = render([service], { locale }), visible = withoutDetails(html), original = locale === 'en' ? en : bg
  assert.ok(original.length > 180)
  assert.equal(summaries(html).length, 1)
  assert.ok(summaries(html)[0].includes(DISCOVERY_COPY[locale].hasConditions))
  assert.ok(!visible.includes(DISCOVERY_COPY[locale].hasConditions), 'not a separate tag as well as the button')
  assert.doesNotMatch(html, /Read more|Виж повече/u)
  assert.ok(visible.includes(locale === 'en' ? 'package of 2 visits' : 'пакет 2 посещения'))
  assert.ok(visible.includes(locale === 'en' ? '45 min' : '45 мин'))
  assert.ok(visible.includes(locale === 'en' ? '€15.00' : '15,00'))
  assert.ok(visible.includes(locale === 'en' ? '€25.00' : '25,00'))
  assert.ok(!visible.includes(locale === 'en' ? 'Materials and additional' : 'Материалите и допълнителните'))
  const disclosure = html.match(/<details\b[^>]*data-service-more="true"[^>]*>([\s\S]*?)<\/details>/u)?.[1]
  assert.ok(disclosure?.includes(escape(original)), 'no qualification clause is truncated, summarized or discarded')
  assert.ok(disclosure?.includes(locale === 'en' ? 'Online-only discount' : 'Отстъпка само онлайн'), 'short structured qualifications are in the same disclosure')
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/u)
})

test('the actual Alyoga tile does not repeat its individual session or 60 minutes, but retains appointment and pricing terms', () => {
  const business = SOFIA_CATALOGUE.find(row => row.id === 'sofia-alyoga-benkovski')
  const services = catalogueBusinessDetails(business, Date.parse('2026-11-26T12:00:00Z')).services
    .map(row => presentPublicService(row, business))
  assert.equal(services.length, 1)
  const before = JSON.stringify(services)
  for (const locale of ['bg', 'en']) {
    const html = render(services, { locale, business: { ...business, source: 'catalogue' } }), visible = withoutDetails(html)
    assert.match(visible, locale === 'en' ? /Individual Yoga Practice — 60 minutes/u : /Индивидуална йога практика — 60 минути/u)
    assert.match(visible, locale === 'en' ? /35\.79/u : /35,79/u)
    assert.doesNotMatch(visible, /public-service-menu-(?:unit|duration)|индивидуална практика, 60 минути|individual practice, 60 minutes/u)
    assert.equal(summaries(html).length, 1)
    assert.ok(summaries(html)[0].includes(DISCOVERY_COPY[locale].hasConditions))
    assert.match(html, locale === 'en' ? /advance booking|prior booking|by appointment|booked in advance/iu : /предварително записване на отделния телефон/u)
    const expanded = html.match(/<div class="public-service-menu-conditionBody">([\s\S]*?)<\/div>/u)?.[1]
    assert.match(expanded, locale === 'en' ? /Not a semi-private session for two/u : /Не е полуиндивидуална сесия за двама/u)
    assert.doesNotMatch(expanded, /35[.,]79|70\s*(?:лв|BGN)|60\s*(?:минути|minutes)|Публикувана цена|Published price/u)
    assert.doesNotMatch(html, /(?:Виж повече|Read more)/u)
  }
  assert.equal(JSON.stringify(services), before)
})

test('real service thumbnails omit the active hero and retain a distinct local image', async () => {
  const { PublicServiceMenu: RealMenu } = await loadPublicServiceMenu()
  const date = Date.parse('2026-11-26T12:00:00Z')
  const renderBranch = id => {
    const record = SOFIA_CATALOGUE.find(row => row.id === id)
    return renderToStaticMarkup(React.createElement(RealMenu, {
      services: catalogueBusinessDetails(record, date).services.map(service => presentPublicService(service, record)), business: { ...record, source: 'catalogue' },
    }))
  }
  assert.doesNotMatch(renderBranch('sofia-alyoga-benkovski'), /service-thumbnail-image/u)
  assert.match(renderBranch('sofia-nosia-todor-alexandrov17'), /go-nosia-folk-dance-beginners-20261125-v1\.webp/u)
})

test('the exact 180-character disclosure boundary keeps short prose visible and folds the whole longer source without a partial preview', () => {
  const short = 'A'.repeat(180), long = short + 'B'
  const visible = render([{ name: 'Boundary service', description: short, price: null }], { locale: 'en' })
  assert.ok(withoutDetails(visible).includes(short))
  assert.doesNotMatch(visible, /data-service-more=/u)
  const folded = render([{ name: 'Boundary service', description: long, price: null }], { locale: 'en' })
  assert.ok(!withoutDetails(folded).includes(long))
  assert.ok(folded.includes(escape(long)))
  assert.match(folded, /data-service-more="true"/u)
})

test('existing service fragments and source order survive grouping; Bulgarian and English headings/names retain the same services', () => {
  const services = [
    { name: 'Маникюр', category: 'nails', price: 20, currency: 'EUR' },
    { name: 'Педикюр', category: 'nails', price: 30, currency: 'EUR' },
    { name: 'Мъжко подстригване', category: 'hair', price: 40, currency: 'EUR' },
  ].map(row => presentPublicService(row, { category: row.category }))
  const anchors = new Map(services.map((service, index) => [service, 'stable-service-' + index]))
  for (const locale of ['bg', 'en']) {
    const html = render(services, { locale, serviceAnchors: anchors, groupHeading: 'h3' })
    const ids = [...html.matchAll(/id="(stable-service-[^"]+)"/gu)].map(match => match[1])
    assert.deepEqual(ids, ['stable-service-0', 'stable-service-1', 'stable-service-2'])
    assert.equal((html.match(/<h3 class="public-service-menu-groupTitle">/gu) || []).length, 2)
    for (const service of services) assert.ok(html.includes(escape(locale === 'en' ? service.presentationEn.name : service.name)))
  }
})

test('photo/card typography and native disclosures remain contained, accessible, dark-theme aware and reduced-motion safe without clipping names/prices', async () => {
  const css = await readFile(new URL('../components/public-service-menu.module.css', import.meta.url), 'utf8')
  assert.match(css, /width: 128px; height: 128px/u)
  assert.match(css, /object-fit: contain; object-position: center/u)
  assert.match(css, /grid-template-columns: repeat\(auto-fit,minmax\(min\(100%,14rem\),1fr\)\)/u)
  assert.match(css, /\.more > summary[\s\S]*min-height: 44px/u)
  assert.match(css, /summary:focus-visible[\s\S]*outline: 2px/u)
  assert.match(css, /html\[data-theme="dark"\]/u)
  assert.match(css, /prefers-reduced-motion:reduce/u)
  const narrow = css.match(/@media \(max-width:360px\) \{([^\n]+)\}/u)?.[1]
  assert.ok(narrow, 'narrow-screen enlarged-text layout has an explicit local fit rule')
  assert.match(narrow, /\.menu \{ margin-inline: -16px; \}/u)
  assert.match(narrow, /\.card \{ padding-inline: 2px; \}/u)
  assert.doesNotMatch(narrow, /font-size|word-break|overflow-wrap|overflow:/u, 'reclaim gutter space, never shrink text, split words or hide overflow')
  assert.doesNotMatch(css, /text-overflow:\s*ellipsis|line-clamp|word-break:\s*break-all/u)
  for (const [foreground, background] of [
    ['705b4a', 'fffdf9'], ['8c3f1b', 'fffdf9'], ['d2bda9', '352820'], ['ffc49b', '352820'],
    ['8c3f1b', 'fff8ee'], ['8c3f1b', 'f5dfca'], ['ffc49b', '523c2d'], ['ffc49b', '432e24'],
  ]) {
    const lum = hex => {
      const channels = hex.match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
    }
    const levels = [lum(foreground), lum(background)].sort((a, b) => b - a)
    assert.ok((levels[0] + .05) / (levels[1] + .05) >= 4.5, foreground + '/' + background)
  }
})
