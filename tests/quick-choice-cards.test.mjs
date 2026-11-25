import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import * as rail from '../lib/discovery/rail.mjs'
import * as home from '../lib/discovery/home.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import * as photoLayout from '../lib/business-photo-layout.mjs'
import * as cataloguePhotos from '../lib/catalogue-photo-view.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { withVerifiedDirections } from './helpers/pr81-verified-directions.mjs'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = 'components/discovery-business-card.js'
const { code } = await transform(await readFile(new URL('../' + filename, import.meta.url), 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const Empty = () => null, Details = () => null, Outbound = () => null, Badge = () => null, Cover = () => null, Link = () => null, Thumbnail = () => null
const Action = () => null, Pair = () => null
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
const nodeClass = (tree, className) => elements(tree, node => node.props.className === className)
const business = patch => ({ id: 'real-business-id', source: 'gorez', name: 'Дълго име на реален партньор', slug: 'real/branch', industry: 'beauty', category: 'hair', neighborhood: 'Манастирски ливади', address: 'София, ул. Пирин 83', coordinates: { latitude: 42.657, longitude: 23.292 }, services: [{ id: 'service-id', name: 'Мъжко подстригване', price: 18, currency: 'EUR' }], ...patch })
function fixture(patch = {}) {
  const values = [null, false], refs = [], events = [], props = { row: business(), locale: 'bg', quickChoice: true, ...patch }
  let index = 0, tree
  const stubs = {
    react: { ...React, memo: component => component, useState() { const at = index++; return [values[at], value => { values[at] = value }] }, useRef(value) { const at = index++; return refs[at] ||= { current: value } } },
    'next/link': { __esModule: true, default: Link }, 'next/dynamic': { __esModule: true, default: () => Details },
    './icon': { Icon: Empty }, './brand-logo': { BrandMark: Empty }, './business-cover-photo': { BusinessCoverPhoto: Cover },
    './outbound-booking-button': { OutboundBookingButton: Outbound }, './public-action': { PublicAction: Action, PublicActionPair: Pair },
    './service-thumbnail': { ServiceThumbnail: Thumbnail },
    '../lib/booking-mode.mjs': bookingMode, '../lib/discovery/home.mjs': home, '../lib/discovery/rail.mjs': rail,
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

for (const locale of ['bg', 'en']) test(`${locale}: compact card shows service names and prices followed by one visible Details action, with a true photo-overlay distance`, () => {
  const origin = { latitude: 42.66, longitude: 23.29, kind: 'location' }, row = business(), before = structuredClone(row)
  const f = fixture({ locale, row, distanceOrigin: origin })
  const identity = nodeClass(f.tree, 'home-business-identity')[0]
  assert.equal(elements(identity, node => node.type === 'h3')[0].props.children, row.name)
  for (const removed of ['home-business-category', 'home-business-neighborhood', 'home-business-services', 'home-business-reviews', 'home-business-booking-hint']) assert.equal(nodeClass(f.tree, removed).length, 0)
  assert.equal(nodeClass(f.tree,'home-business-service-preview').length,1)
  const [detailsButton] = nodeClass(identity, 'home-business-open')
  assert.equal(detailsButton.props.children, locale === 'en' ? 'View details' : 'Виж детайли')
  assert.equal(identity.props.children.at(-1), detailsButton, 'nothing else follows the single preview action')
  assert.equal(elements(identity, node => node.type === Thumbnail || node.type === Pair || node.type === Action || node.type === Outbound).length, 0)
  assert.equal(elements(identity, node => node.type === Badge).length, 0)
  const badge = elements(nodeClass(f.tree, 'home-business-photo'), node => node.type === Badge)[0]
  assert.equal(badge.props.origin, origin); assert.equal(badge.props.destination, row.coordinates)
  assert.equal(badge.props.distanceOnly, true, 'unknown coordinates cannot be shown as a made-up numeric distance')
  assert.deepEqual(row, before, 'preview presentation never changes the complete service menu or source data')
})

for (const locale of ['bg', 'en']) test(`${locale}: one native whole-card details target opens once, preserves focus and does not emit booking analytics`, () => {
  const f = fixture({ locale }), triggers = elements(f.tree, node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog')
  assert.equal(triggers.length, 1); assert.equal(triggers[0].props.className, 'home-business-open')
  assert.ok(triggers[0].props['aria-label'].includes(f.props.row.name))
  assert.equal(elements(triggers[0], node => node.type === Action || node.type === Outbound).length, 0, 'links/forms are never nested inside a button')
  assert.deepEqual(f.events, [])
  const trigger = { focus() {} }
  triggers[0].props.onClick({ currentTarget: trigger }); f.render()
  const details = elements(f.tree, node => node.type === Details)[0]
  assert.equal(details.props.row, f.props.row); assert.equal(details.props.locale, locale)
  assert.equal(details.props.triggerRef.current, trigger)
  assert.deepEqual(f.events, [{ event: 'profile', locale }])
  nodeClass(f.tree, 'home-business-open')[0].props.onClick({ currentTarget: trigger }); f.render()
  assert.equal(f.events.length, 1, 'an already open card cannot create duplicate profile events')
  details.props.onClose(); f.render()
  assert.equal(elements(f.tree, node => node.type === Details).length, 0)
  const inert = fixture({ locale, preview: true })
  nodeClass(inert.tree, 'home-business-open')[0].props.onClick({ currentTarget: trigger }); inert.render()
  assert.deepEqual(inert.events, [], 'local preview never records real profile or booking activity')
})

test('real portrait, landscape and logo previews retain original image metadata and use full contain', () => {
  for (const photo of [{ src: '/businesses/fixture/portrait.webp', width: 600, height: 900 }, { src: '/businesses/fixture/landscape.webp', position: '50% 68%', width: 1200, height: 600 }]) {
    const before = structuredClone(photo), f = fixture({ row: business({ photos: [photo] }) })
    const image = elements(f.tree, node => node.type === 'img')[0]
    assert.equal(image.props.src, photo.src); assert.equal(image.props.style.objectFit, 'contain'); assert.equal(image.props.style.objectPosition, 'center')
    assert.deepEqual(photo, before)
  }
  const row = business({ source: 'catalogue', photo: { src: '/api/catalogue-media/eebc21d3-2f13-42cd-9f81-877eb6bc5736' } })
  const f = fixture({ row }), image = elements(f.tree, node => node.type === 'img')[0]
  assert.equal(image.props.style.backgroundColor, '#fff')
  assert.equal(elements(f.tree, node => node.type === Cover).length, 0, 'real uploads do not receive the AI disclosure')
  image.props.onError(); f.render()
  assert.equal(elements(f.tree, node => node.type === Cover)[0].props.business, row)
})

for (const locale of ['bg', 'en']) test(`${locale}: native, external, phone and hydrated details actions retain exact destinations and eligibility`, () => {
  const openMenu = f => {
    nodeClass(f.tree, 'home-business-open')[0].props.onClick({ currentTarget: {} }); f.render()
    return elements(f.tree, node => node.type === Details)[0]
  }
  for (const booking_mode of ['gorez', 'external', 'phone']) {
    const row = withVerifiedDirections(business({ booking_mode, phone: '+359888000001' })), f = fixture({ row, locale })
    assert.equal(elements(f.tree, node => node.type === Action || node.type === Outbound).length, 0)
    const details = openMenu(f), footerActions = details.props.actions(row)
    const map = elements(footerActions, node => node.type === Action && node.props.variant === 'secondary')[0]
    assert.equal(map.props.href, rail.railDirections(row)); assert.equal(map.props.rel, 'noopener noreferrer')
    assert.equal(map.props.children, locale==='en'?DISCOVERY_COPY[locale].directions:'Упъти')
    if (booking_mode === 'gorez') {
      const book = elements(footerActions, node => node.type === Action && node.props.variant === 'primary')[0]
      assert.equal(book.props.as, Link); assert.equal(book.props.href, `/book/real%2Fbranch?lang=${locale}`)
    } else assert.equal(elements(footerActions, node => node.type === Outbound)[0].props.business, row)
    const hydrate = business({ slug: 'updated', booking_mode: 'phone', phone: '+359888000002' })
    const footer = details.props.actions(hydrate)
    assert.equal(elements(footer, node => node.type === Outbound)[0].props.business, hydrate, 'details use freshly hydrated action state, not stale card destinations')
  }
  for (const [kind, href] of [['phone', 'tel:+359888000001'], ['form', 'https://salon.bg/book']]) {
    const row = business({ source: 'catalogue', phone: '+359888000001', booking: { verified: true, kind, phone: '+359888000001', url: 'https://salon.bg/book', checkedOn: '2020-01-01', validUntil: '2099-01-01' } })
    const book = elements(openMenu(fixture({ row, locale })).props.actions(row), node => node.type === Action && node.props.variant === 'primary')[0]
    assert.equal(book.props.href, href)
    assert.ok(book.props['aria-label'].includes(locale === 'en' ? kind === 'phone' ? 'Call to book' : 'business website' : kind === 'phone' ? 'по телефона' : 'сайта на бизнеса'))
  }
  const unverified = business({ source: 'catalogue', phone: null, website: 'https://salon.bg/' })
  assert.equal(elements(openMenu(fixture({ row: unverified, locale })).props.actions(unverified), node => node.type === Action && node.props.variant === 'primary').length, 0)
  const preview = fixture({ locale, preview: true }), footer = openMenu(preview).props.actions(preview.props.row)
  assert.equal(elements(footer, node => node.type === Outbound).length, 0)
  for (const item of elements(footer, node => node.type === Action)) { assert.equal(item.props.as, 'span'); assert.equal(item.props['aria-disabled'], 'true'); assert.equal(item.props.href, undefined) }
})

for(const locale of ['bg','en'])test(`${locale}: real service names, ranges and base units stay paired without price prose in the preview`,()=>{
  const services=[
    {name:'Гел лак с укрепване и сваляне на материал',price:25,currency:'EUR',priceKind:'from',priceUnit:'пакет 2 посещения',
      description:'Материалите не са включени.',presentationEn:{name:'Gel polish with strengthening and product removal',unit:'package of 2 visits',description:'Materials are not included.'}},
    {name:'Педикюр',price:30,priceMaximum:50,priceKind:'range',currency:'EUR',
      description:'Меню за посочения салон; вариантът и специалистът се потвърждават при записване.',presentationEn:{name:'Pedicure'}},
    {name:'Трета услуга',price:999,currency:'EUR'},
  ]
  const row=business({services}),before=structuredClone(row),f=fixture({row,locale})
  const names=nodeClass(f.tree,'home-business-preview-name'),prices=nodeClass(f.tree,'home-business-preview-price')
  assert.equal(names.length,2);assert.equal(prices.length,2)
  assert.deepEqual(names.map(node=>node.props.children),locale==='en'?[services[0].presentationEn.name,'Pedicure']:[services[0].name,'Педикюр'])
  assert.match(prices[0].props.children,locale==='en'?/^from €25/u:/^от 25/u)
  assert.match(prices[1].props.children,/30.*50/u)
  assert.doesNotMatch(prices.map(node=>node.props.children).join(' '),/999/u)
  assert.equal(prices[0].props.children.split(' / ')[1],locale==='en'?'package of 2 visits':'пакет 2 посещения')
  for (const hidden of ['unit','description','condition','chevron']) assert.equal(nodeClass(f.tree,`home-business-preview-${hidden}`).length,0)
  assert.equal(elements(nodeClass(f.tree,'home-business-service-preview'),node=>['a','button','form'].includes(node.type)).length,0,'preview rows open only the existing whole-card details target')
  assert.deepEqual(row,before)
})

test('strict subcategory preview never fills its second row with a different service or guesses an unknown price',()=>{
  const match={name:'Оформяне на вежди',price:null,category:'beauty'},unrelated={name:'Педикюр',price:40,category:'nails'}
  const row=business({subcategory:'brows',services:[match],servicePreview:[match,unrelated],details:{services:[match,unrelated]}})
  const f=fixture({row})
  assert.deepEqual(nodeClass(f.tree,'home-business-preview-name').map(node=>node.props.children),[match.name])
  assert.equal(nodeClass(f.tree,'home-business-preview-price').length,0)
  assert.equal(elements(f.tree,node=>node.type===Thumbnail).length,0)
  assert.deepEqual(f.events,[])
  const empty=fixture({row:business({services:[]})})
  assert.equal(nodeClass(empty.tree,'home-business-service-preview').length,0)
  assert.equal(nodeClass(empty.tree,'home-business-open').length,1,'unpriced or empty menus can still be opened')
})

for(const locale of ['bg','en'])test(`${locale}: a preview mutes supporting text but preserves the complete menu and qualifications`,()=>{
  const prose={
    bg:'Оформяме косата с плавни линии и меко движение, като съчетаваме естествения цвят с фин завършек. Прическата подчертава индивидуалния стил и създава лекота, а внимателното измиване и подсушаване допълват усещането за свежа коса.',
    en:'We shape the hair with flowing lines and soft movement, combining its natural colour with a refined finish. The hairstyle expresses individual style and creates a light feel, while careful washing and drying complete the fresh look.',
  }
  const condition={bg:'Цената не включва материали; доплащането се уточнява предварително.',en:'The price excludes materials; additional charges are agreed in advance.'}
  const service={name:'Подстригване',price:20,currency:'EUR',priceUnit:'пакет 2 посещения',description:prose.bg+' '+condition.bg,
    presentationEn:{name:'Haircut',unit:'package of 2 visits',description:prose.en+' '+condition.en}}
  const row=business({services:[service]}),before=structuredClone(row),f=fixture({row,locale})
  const paragraphs=nodeClass(f.tree,'home-business-preview-description').map(node=>node.props.children)
  assert.deepEqual(paragraphs,[],'long source prose is opened through the existing whole-card details action')
  const warnings=elements(f.tree,node=>node.props['data-service-has-conditions']===true)
  assert.equal(warnings.length,0)
  assert.equal(nodeClass(f.tree,'home-business-preview-price')[0].props.children.split(' / ')[1],locale==='en'?'package of 2 visits':'пакет 2 посещения')
  assert.equal(elements(nodeClass(f.tree,'home-business-service-preview'),node=>['button','details','a','summary'].includes(node.type)).length,0,'the existing card click is the only preview disclosure action')
  nodeClass(f.tree,'home-business-open')[0].props.onClick({currentTarget:{}});f.render()
  assert.equal(elements(f.tree,node=>node.type===Details)[0].props.row,row)
  assert.deepEqual(row,before,'full narrative and qualifications remain untouched for the complete menu')
  const unknown='Авторът описва особеностите на подхода с внимание към контекста и запазва всички важни пояснения за човека, който ще чете този необичаен свободен текст. Обяснението продължава с неясно формулирани допълнения, които нямат предварително проверена структура.'
  const fallback=fixture({row:business({services:[{...service,description:unknown}]}),locale:'bg'})
  assert.equal(nodeClass(fallback.tree,'home-business-preview-description').length,0)
  assert.equal(fallback.props.row.services[0].description,unknown)
  const narrative=fixture({row:business({services:[{...service,description:prose.bg}]}),locale:'bg'})
  assert.equal(elements(narrative.tree,node=>node.props['data-service-has-conditions']===true).length,0,'plain narrative is not mislabeled as a pricing qualification')
})

test('compact preview CSS reserves contained media, puts distance top-right, keeps disclosure readable and actions above the details target', async () => {
  const css = await readFile(new URL('../app/premium-discovery-cards.css', import.meta.url), 'utf8')
  const baseCss = await readFile(new URL('../app/discovery-home.css', import.meta.url), 'utf8')
  assert.match(css, /aspect-ratio: 4 \/ 3/); assert.match(css, /object-fit: contain/)
  assert.match(css, /\.home-business-photo > \.home-distance-badge \{[^}]*right: 10px;[^}]*left: auto/s)
  assert.match(css, /\.home-business-actions \{[^}]*z-index: 2;[^}]*pointer-events: auto/s)
  assert.match(baseCss, /\.home-business-open::after \{[^}]*z-index: 1;[^}]*inset: 0/)
  assert.match(css, /\.business-category-cover-label \{[^}]*font-size: 11px;[^}]*opacity: 1/s)
  assert.doesNotMatch(css, /home-reserve|home-directions|booking-button-content|text-overflow: ellipsis/)
})
