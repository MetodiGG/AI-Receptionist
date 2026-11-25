import test from 'node:test'
import assert from 'node:assert/strict'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import { loadPublicServiceMenu } from './helpers/public-service-menu.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { presentPublicService } from '../lib/locale/public-content-server.mjs'
const { PublicServiceMenu } = await loadPublicServiceMenu({
  ServiceThumbnail: ({ service, size, className, shownBusinessPhoto }) => React.createElement('img', { src: '/service-photos/test.webp', alt: service.name, className, 'data-size': size, 'data-shown-business-photo': shownBusinessPhoto?.src }),
})
const render = (services, props = {}) => renderToStaticMarkup(React.createElement(PublicServiceMenu, { services, business: { category: 'nails' }, ...props }))
const escape = value => renderToStaticMarkup(React.createElement(React.Fragment, null, value))
const withoutDetails = html => html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gu, '')
const summaries = html => [...html.matchAll(/<summary\b[^>]*>[\s\S]*?<\/summary>/gu)].map(([match]) => match)

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

test('price amounts, range, source and translated units stay visible; short qualifications are behind a labelled disclosure', () => {
  const services = [{
    name: 'Actual full service name', category: 'nails', price: 15, priceMaximum: 25, priceKind: 'range', currency: 'EUR',
    priceUnit: 'пакет 2 посещения', presentationEn: { name: 'Actual full service name', unit: 'package of 2 visits' },
    priceSourceUrl: 'https://example.test/real-menu', durationMin: 45,
    description: 'Materials are not included; excluding VAT. Total package of 2 visits. This price requires advance confirmation.',
  }]
  const html = render(services, { locale: 'en' }), visible = withoutDetails(html)
  for (const phrase of ['package of 2 visits', '45 min']) assert.ok(visible.includes(phrase), phrase)
  const [summary] = summaries(html)
  assert.equal(summaries(html).length, 1)
  assert.match(summary, /data-service-condition-control="true"[^>]*>[\s\S]*Conditions apply/u)
  assert.doesNotMatch(visible, /Conditions apply/u)
  assert.doesNotMatch(html, /View details/u)
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
  const narrative = 'Hair styling creates a balanced shape and soft movement. The hairstyle uses flowing layers to frame the face and adds natural texture through careful brushing. Colour and styling create a natural shape.'
  const html = render([{ name: 'A complete unusually long service name without abbreviation or removed words', price: 25, currency: 'EUR', description: narrative }], { locale: 'en' })
  assert.match(html, /<details class="public-service-menu-more" data-service-more="true">/u)
  assert.match(html, /View details/u)
  assert.match(html, /Hide details/u)
  assert.equal(summaries(html).length, 1)
  assert.doesNotMatch(html, /Conditions apply|data-service-condition-control/u)
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/u)
  assert.ok(withoutDetails(html).includes('A complete unusually long service name without abbreviation or removed words'))
  assert.ok(html.includes(escape(narrative)), 'the full original long description is available contiguously inside the disclosure')
  assert.ok(!withoutDetails(html).includes('Hair styling creates a balanced shape'), 'long prose is folded, not repeated above the control')
  assert.doesNotMatch(html, /aria-expanded=|<button|<form|fetch\(/u)
})

for (const locale of ['bg', 'en']) test(`${locale}: an approved folded long qualification uses a single Conditions apply action and retains complete structured pricing`, () => {
  const bg = 'Материалите и допълнителните консумативи не са включени в тази цена. Общата цена е за пакет от 2 посещения и се потвърждава предварително с бизнеса. При промяна на условията се свържете със специалиста преди посещение. Цената е без ДДС.'
  const en = 'Materials and additional consumables are not included in this price. The total price is for a package of 2 visits and is confirmed with the business in advance. If the conditions change, contact the specialist before the visit. The price excludes VAT.'
  const online = 'Текуща цена с отстъпка, валидна САМО при онлайн записване, проверена на 10.11.2026. Условията се потвърждават при записване; не е зачеркнатата стара цена. '
  const service = { name: 'Actual qualified service', category: 'nails', price: 15, priceMaximum: 25, priceKind: 'range', currency: 'EUR',
    priceUnit: 'пакет 2 посещения', durationMin: 45, description: online + bg,
    presentationEn: { name: 'Actual qualified service', unit: 'package of 2 visits', description: en } }
  const html = render([service], { locale }), visible = withoutDetails(html), original = locale === 'en' ? en : bg
  assert.ok(original.length > 180)
  assert.equal(summaries(html).length, 1)
  assert.match(summaries(html)[0], /data-service-condition-control="true"/u)
  assert.ok(summaries(html)[0].includes(DISCOVERY_COPY[locale].hasConditions))
  assert.ok(!visible.includes(DISCOVERY_COPY[locale].hasConditions), 'the conditions affordance must not have a duplicate, non-interactive label')
  const onlineCondition = locale === 'en' ? 'Online-only discount' : 'Отстъпка само онлайн'
  assert.ok(!visible.includes(onlineCondition), 'only the qualification warning is visible before opening the disclosure')
  assert.ok(visible.includes(locale === 'en' ? 'package of 2 visits' : 'пакет 2 посещения'))
  assert.ok(visible.includes(locale === 'en' ? '45 min' : '45 мин'))
  assert.ok(visible.includes(locale === 'en' ? '€15.00' : '15,00'))
  assert.ok(visible.includes(locale === 'en' ? '€25.00' : '25,00'))
  assert.ok(!visible.includes(locale === 'en' ? 'Materials and additional' : 'Материалите и допълнителните'))
  const disclosure = html.match(/<details\b[^>]*data-service-more="true"[^>]*>([\s\S]*?)<\/details>/u)?.[1]
  assert.ok(disclosure?.includes(escape(original)), 'no qualification clause is truncated, summarized or discarded')
  assert.ok(disclosure?.includes(onlineCondition), 'the structured qualification stays in the same disclosure')
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/u)
})

test('a condition-only card still provides the details control and keeps its exact price visible', () => {
  const original = 'Тарифа само за посочения обект; при записване уточнете правилния салон.'
  const html = render([{ name: 'Услуга с цена за обекта', price: 12, currency: 'EUR', description: original }])
  const visible = withoutDetails(html)
  assert.match(visible, /12,00/u)
  assert.doesNotMatch(visible, /Тарифа за този обект|Има условия/u)
  assert.equal(summaries(html).length, 1)
  assert.match(html, /<summary data-service-condition-control="true">[\s\S]*Има условия[\s\S]*<li>Тарифа за този обект<\/li>[\s\S]*<\/details>/u)
  assert.doesNotMatch(html, /Виж детайли/u)
  assert.equal((html.match(/Тарифа за този обект/gu) || []).length, 1)
})

test('the gallery gives every nonempty description a disclosure and does not add an empty control', () => {
  for (const [locale, label] of [['bg', 'Виж детайли'], ['en', 'View details']]) {
    for (const description of ['Short detail.', 'A'.repeat(180), 'A'.repeat(181)]) {
      const html = render([{ name: 'Boundary service', description, price: null }], { locale })
      assert.ok(!withoutDetails(html).includes(description))
      assert.ok(html.includes('<p>' + escape(description) + '</p>'))
      assert.ok(html.includes(label))
      assert.match(html, /<summary>[\s\S]*Boundary service.*<\/summary>/u)
    }
    assert.doesNotMatch(render([{name: 'No details', description: ' ', price: 12}], { locale }), /data-service-more=/u)
  }
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

test('one-service sizing is applied independently per group, with only the actual cover passed through', () => {
  const nails = { name: 'Маникюр', category: 'nails', price: 20, currency: 'EUR' }
  const hair = { name: 'Мъжко подстригване', category: 'hair', price: 40, currency: 'EUR' }
  const cover = { src: '/business-cover-photos/reviewed-cover.webp' }
  const html = render([nails, hair, { ...hair, name: 'Дамско подстригване' }], { shownBusinessPhoto: cover })
  assert.equal((html.match(/data-service-price-gallery="true"/gu) || []).length, 2)
  assert.equal((html.match(/data-service-single="true"/gu) || []).length, 1)
  assert.match(html, /data-service-single="true">[\s\S]*?(<\/ul>)/u)
  assert.equal((html.match(/data-shown-business-photo="\/business-cover-photos\/reviewed-cover\.webp"/gu) || []).length, 3)
  assert.doesNotMatch(render([nails], { business: { category: 'nails', photo: cover } }), /data-shown-business-photo/u, 'the menu cannot infer the displayed cover from the business object')
})

test('photo/card typography and native disclosures remain contained, accessible, dark-theme aware and reduced-motion safe without clipping names/prices', async () => {
  const css = await readFile(new URL('../components/public-service-menu.module.css', import.meta.url), 'utf8')
  assert.match(css, /width: 100%; height: auto; aspect-ratio: 4 \/ 3/u)
  assert.match(css, /object-fit: cover; object-position: center/u)
  assert.match(css, /data-service-gallery-photo="provided"[^\n]+object-fit: contain/u)
  assert.match(css, /@container service-gallery \(min-width: 16\.5rem\).*repeat\(2,minmax\(0,1fr\)\)/u)
  assert.match(css, /@container service-gallery \(min-width: 46rem\)\s*\{\s*\.grid:has\(> \.card:nth-child\(3\)\)\s*\{\s*grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/u)
  assert.match(css, /\.grid:not\(:has\(> \.card:nth-child\(3\)\)\)\s*\{\s*max-width: 43rem; margin-inline: auto/u)
  assert.match(css, /\n\.grid\[data-service-single\] \{ grid-template-columns: minmax\(0,27rem\); justify-content: center; \}/u, 'a lone card uses a dedicated, capped and centered column even on mobile')
  assert.match(css, /\.more \{[^}]*margin-block-start: 5px/u, 'the disclosure has room below the price')
  assert.match(css, /inset-inline-start: 4px; inset-block-end: 4px;[\s\S]*font-size: 11px/u)
  assert.match(css, /\.more > summary[\s\S]*min-height: 44px/u)
  assert.match(css, /summary:focus-visible[\s\S]*outline: 2px/u)
  assert.match(css, /html\[data-theme="dark"\]/u)
  assert.match(css, /prefers-reduced-motion:reduce/u)
  assert.match(css, /\.grid \{[^\n]+grid-template-columns: minmax\(0,1fr\)/u, 'cards fall back to one column when the container is narrow')
  assert.doesNotMatch(css, /text-overflow:\s*ellipsis|line-clamp|word-break:\s*break-all/u)
  for (const [foreground, background] of [['705b4a', 'fffdf9'], ['8c3f1b', 'fffdf9'], ['d2bda9', '352820'], ['ffc49b', '352820']]) {
    const lum = hex => {
      const channels = hex.match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
    }
    const levels = [lum(foreground), lum(background)].sort((a, b) => b - a)
    assert.ok((levels[0] + .05) / (levels[1] + .05) >= 4.5, foreground + '/' + background)
  }
})

test('the real gallery labels generated photos only, keeps business-provided art unlabelled and never invents an unrelated image', async () => {
  const { PublicServiceMenu: actualMenu } = await loadPublicServiceMenu()
  const business = { id: 'e5b029ba-3586-485b-ac19-978a8386922d', category: 'beauty' }
  const services = [
    { id: 'ddb089f1-4fb3-422f-8fae-5b1689c1a0da', name: 'Апарат за лице “Меган”', price: 10 },
    { name: 'Почистване на лице', price: 30, category: 'beauty' },
    { name: 'Неописана бъдеща услуга', price: 40 },
  ]
  const html = renderToStaticMarkup(React.createElement(actualMenu, { services, business }))
  const cards = [...html.matchAll(/<li\b[^>]*data-service-price-card[^>]*>([\s\S]*?)<\/li>/gu)].map(match => match[1])
  assert.equal(cards.length, 3)
  const [real, generated, unknown] = services.map(service => cards.find(card => card.includes(escape(service.name))))
  assert.match(real, /data-service-gallery-photo="provided".*partner-megan-supplied-v1\.webp/u)
  assert.doesNotMatch(real, /data-service-gallery-ai|AI илюстрация/u)
  assert.match(generated, /data-service-gallery-photo="illustration".*data-service-gallery-ai="true">AI илюстрация/u)
  assert.doesNotMatch(unknown, /<img|data-service-gallery-ai|appointment-workspace/u)
})
