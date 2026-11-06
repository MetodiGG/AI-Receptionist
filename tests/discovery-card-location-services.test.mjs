import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { businessLocationBadge, distanceBadge, discoveryDistanceOrigin } from '../lib/discovery/distance-origin.mjs'
import { railServiceItems, railDirections } from '../lib/discovery/rail.mjs'
import { businessDetailServices, detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const now = Date.parse('2026-11-06T12:00:00Z')
const rows = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { browse: true, category: null, requirements: [], searchV2: true }, { now })

test('every approved Sofia listing has an honest location label without runtime geocoding', () => {
  assert.equal(rows.length, 595)
  for (const row of rows) {
    const badge = businessLocationBadge(row)
    assert.ok(badge?.value, row.name)
    assert.ok(badge?.title, row.name)
    assert.ok(['address', 'area', 'unknown'].includes(badge.kind))
    assert.doesNotMatch(badge.value, /\bkm\b|\bкм\b/)
    if (!row.coordinates) assert.equal(distanceBadge(discoveryDistanceOrigin({ cityCode: '68134' }), row.coordinates), null)
  }
})

test('the reported address-only examples show a pin label instead of disappearing or fabricated km', () => {
  for (const pattern of [/Beauty Studio Marry.*Куклата/iu, /Abi Beauty.*Лозенец/iu]) {
    const row = rows.find(row => pattern.test(row.name))
    assert.ok(row, pattern.source)
    assert.equal(row.coordinates, null)
    assert.equal(businessLocationBadge(row).kind, 'address')
    assert.match(railDirections(row), /^https:\/\/www.google.com\/maps\/dir\//)
  }
})

test('exact distances still distinguish device location from the selected city centre', () => {
  const coordinates = { latitude: 42.66, longitude: 23.28, consent: true }
  const centre = discoveryDistanceOrigin({ cityCode: '68134' }), device = discoveryDistanceOrigin({ coordinates })
  assert.equal(distanceBadge(centre, coordinates).suffix, 'от центъра')
  assert.equal(distanceBadge(centre, coordinates, 'en').suffix, 'from centre')
  assert.equal(distanceBadge(device, coordinates).suffix, '')
  assert.equal(distanceBadge(centre, { latitude: null, longitude: null }), null)
})

test('location fallbacks do not invent a fixed address for a service-area business', () => {
  assert.equal(businessLocationBadge({ locationKind: 'service_area', city: 'София' }).value, 'На твой адрес')
  assert.equal(businessLocationBadge({ locationKind: 'service_area', city: 'София' }, 'en').value, 'At your address')
  assert.equal(businessLocationBadge({ neighborhood: 'Лозенец', address: 'София, ул. Примерна 8', city: 'София' }).value, 'Лозенец')
  assert.equal(businessLocationBadge({ neighborhood: 'Неуточнен', address: 'София, ул. Примерна 8', city: 'София' }).value, 'ул. Примерна 8')
  assert.equal(businessLocationBadge({ address: 'Неуточнен', city: 'София' }).value, 'София')
  assert.equal(businessLocationBadge({}).value, 'Уточни адреса')
  assert.equal(businessLocationBadge({}, 'en').value, 'Confirm address')
  assert.equal(businessLocationBadge(null), null)
})

test('matching services lead the vertical menu and prices are joined by service name, never array position', () => {
  const row = { source: 'catalogue', services: [{ name: 'Оформяне на вежди' }], publicServiceNames: ['Маникюр', 'Педикюр', 'Оформяне на вежди'],
    details: { services: [{ name: 'Педикюр', price: 30, currency: 'EUR' }, { name: 'Оформяне на вежди', price: 9.71, currency: 'EUR' }, { name: 'Маникюр', price: null }] } }
  assert.deepEqual(railServiceItems(row).map(row => [row.name, row.price]), [['Оформяне на вежди', 9.71], ['Маникюр', null], ['Педикюр', 30]])
  assert.match(detailPriceLabel(railServiceItems(row)[0]), /9,71/)
  assert.match(detailPriceLabel(railServiceItems(row)[0], 'en'), /€9\.71/)
})

test('menus are bounded, deduplicated, first-party only and retain legitimate zero/from prices', () => {
  const row = { source: 'gorez', services: [{ name: 'First', price: 0 }, { name: ' first ', price: 0 }, { name: 'Second', price: 20, priceKind: 'from' }, { name: 'Hidden', price: 10, active: false }, { name: 'Third' }, { name: 'Fourth' }] }
  const services = railServiceItems(row)
  assert.deepEqual(services.map(row => row.name), ['First', 'Second', 'Third'])
  assert.equal(services[0].price, 0)
  assert.match(detailPriceLabel(services[1]), /^от 20,00/)
  assert.equal(services[2].price, null)
  assert.deepEqual(railServiceItems({ ...row, source: 'google' }), [])
  assert.deepEqual(railServiceItems({ source: 'catalogue' }), [])
  const ambiguous = railServiceItems({ source: 'gorez', services: [{ name: 'Cut', price: 20 }, { name: 'Cut', price: 35 }] })
  assert.equal(ambiguous.length, 1); assert.equal(ambiguous[0].price, null)
})

test('unknown/malformed prices are never displayed as a free service', () => {
  for (const price of [null, undefined, '', ' ', false, true, [], {}, -1, 'unknown', Infinity, NaN]) {
    const [service] = businessDetailServices({ services: [{ name: 'Service', price }] })
    assert.equal(service.price, null, String(price))
    assert.equal(detailPriceLabel(service), null)
  }
})

test('card markup provides one location badge, vertical service/price pairs and customer-friendly navigation', async () => {
  const card = await read('components/discovery-business-card.js'), badge = await read('components/discovery-distance-badge.js'), css = await read('app/discovery-home.css')
  assert.match(card, /fallbackKm=\{nearby \? row.distanceKm : null\} business=\{row\}/)
  assert.match(badge, /businessLocationBadge\(business, locale\)/)
  assert.match(badge, /<Icon name="pin"\//)
  assert.match(card, /<ul className="home-business-services"/)
  assert.match(card, /services.map\(service =>/)
  assert.match(card, /detailPriceLabel\(service, locale\)/)
  assert.match(card, /className="home-service-price"/)
  assert.doesNotMatch(card, /railServiceDescription|<p className="home-business-services"/)
  assert.match(card, /en \? 'Directions' : 'Как да стигна'/)
  assert.match(css, /\.home-business-services > li \{[^}]*grid-template-columns: minmax\(0,1fr\) auto/)
  assert.match(css, /\.home-service-name \{ min-width: 0; overflow-wrap: anywhere/)
  assert.match(css, /\.home-service-price \{[^}]*white-space: nowrap/)
  assert.match(css, /\[data-uniform-cards="true"\] \.home-business-actions \{ margin-top: auto/)
})
