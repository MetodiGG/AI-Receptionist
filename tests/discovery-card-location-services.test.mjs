import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { businessLocationBadge, distanceBadge, discoveryDistanceOrigin } from '../lib/discovery/distance-origin.mjs'
import { railServiceItems, railDirections } from '../lib/discovery/rail.mjs'
import { businessDetailServices, detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const now = Date.parse('2026-11-06T12:00:00Z')
const rows = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { browse: true, category: null, requirements: [], searchV2: true }, { now })

test('every approved Sofia listing has an honest location label without runtime geocoding', () => {
  assert.equal(rows.length, SOFIA_CATALOGUE.filter(row => approvedCatalogueRecord(row, now)).length)
  for (const row of rows) {
    const badge = businessLocationBadge(row)
    assert.ok(badge?.value, row.name)
    assert.ok(badge?.title, row.name)
    assert.equal(badge.kind, 'unknown')
    assert.equal(badge.value, '— km')
    assert.doesNotMatch(badge.value, /\d|ул\.|бул\.|София/)
    if (!row.coordinates) assert.equal(distanceBadge(discoveryDistanceOrigin({ cityCode: '68134' }), row.coordinates), null)
  }
})

test('address-only examples never substitute a street or quarter for verified kilometres', () => {
  for (const pattern of [/Beauty Studio Marry.*Куклата/iu, /Abi Beauty.*Лозенец/iu]) {
    const row = rows.find(row => pattern.test(row.name))
    assert.ok(row, pattern.source)
    if (row.coordinates) assert.match(distanceBadge(discoveryDistanceOrigin({ cityCode: '68134' }), row.coordinates).value, /\d.+km/)
    else assert.equal(businessLocationBadge(row).value, '— km')
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
  for (const business of [{ locationKind: 'service_area', city: 'София' }, { neighborhood: 'Лозенец', address: 'София, ул. Примерна 8', city: 'София' }, { address: 'Неуточнен', city: 'София' }, {}]) {
    assert.equal(businessLocationBadge(business).value, '— km')
    assert.equal(businessLocationBadge(business, 'en').value, '— km')
  }
  assert.match(businessLocationBadge({ locationKind: 'service_area' }).title, /няма разстояние/)
  assert.match(businessLocationBadge({ locationKind: 'service_area' }, 'en').title, /no fixed premises/)
  assert.equal(businessLocationBadge(null), null)
})

test('matching services lead the vertical menu and prices are joined by service name, never array position', () => {
  const row = { source: 'catalogue', services: [{ name: 'Оформяне на вежди' }], publicServiceNames: ['Маникюр', 'Педикюр', 'Оформяне на вежди'],
    details: { services: [{ name: 'Педикюр', price: 30, currency: 'EUR' }, { name: 'Оформяне на вежди', price: 9.71, currency: 'EUR' }, { name: 'Маникюр', price: null }] } }
  assert.deepEqual(railServiceItems(row).map(row => [row.name, row.price]), [['Оформяне на вежди', 9.71], ['Педикюр', 30]])
  assert.deepEqual(businessDetailServices(row).map(service => [service.name, service.price]), [['Педикюр', 30], ['Оформяне на вежди', 9.71], ['Маникюр', null]], 'the two-row card does not alter the full menu or join prices by array index')
  assert.match(detailPriceLabel(railServiceItems(row)[0]), /9,71/)
  assert.match(detailPriceLabel(railServiceItems(row)[0], 'en'), /€9\.71/)
})

test('menus are bounded, deduplicated, first-party only and retain legitimate zero/from prices', () => {
  const row = { source: 'gorez', services: [{ name: 'First', price: 0 }, { name: ' first ', price: 0 }, { name: 'Second', price: 20, priceKind: 'from' }, { name: 'Hidden', price: 10, active: false }, { name: 'Third' }, { name: 'Fourth' }] }
  const services = railServiceItems(row)
  assert.deepEqual(services.map(row => row.name), ['First', 'Second'])
  assert.equal(services[0].price, 0)
  assert.match(detailPriceLabel(services[1]), /^от 20,00/)
  assert.equal(services.length, 2)
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

test('compact card provides one real distance badge and shared navigation; complete service/price pairs remain in details', async () => {
  const card = await read('components/discovery-business-card.js'), badge = await read('components/discovery-distance-badge.js'), css = await read('app/discovery-home.css')
  assert.match(card, /locale=\{locale\} business=\{row\}/)
  assert.doesNotMatch(card, /fallbackKm=/)
  assert.match(badge, /businessLocationBadge\(business, locale\)/)
  assert.match(badge, /<Icon name="pin"\//)
  assert.doesNotMatch(card, /home-business-services|home-service-price|services.map\(service =>/)
  assert.match(card, /business=\{row\} distanceOnly/)
  const details = await read('components/discovery-business-details.js')
  assert.match(details, /detailPriceLabel\(\{ \.\.\.service, priceUnit: '' \}, locale\)/)
  assert.match(details, /className="service-price-unit">\{serviceDisplayUnit\(service, locale\)\}/)
  assert.match(details, /className="business-details-price"/)
  assert.doesNotMatch(card, /railServiceDescription|<p className="home-business-services"/)
  assert.match(card, /<PublicAction as="a" variant="secondary"[^\n]+>\{copy.directions\}<\/PublicAction>/)
  assert.match(css, /\.home-business-services > li \{[^}]*grid-template-columns: minmax\(0,1fr\) fit-content\(44%\)/)
  assert.match(css, /\.home-service-name \{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere/)
  assert.match(css, /\.home-service-price \{[^}]*white-space: normal/)
  assert.match(css, /\[data-uniform-cards="true"\] \.home-business-actions \{ margin-top: auto/)
})
