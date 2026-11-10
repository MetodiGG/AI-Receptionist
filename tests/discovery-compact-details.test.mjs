import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { compactDiscoveryResponse, compactDiscoveryRow } from '../lib/discovery/preview.mjs'
import { railDirections, railExternalAction, railServiceItems, railCategory } from '../lib/discovery/rail.mjs'
import { businessDetailServices, detailPriceLabel, groupDetailServices } from '../lib/discovery/business-details.mjs'
import { createPublicBusinessDetailsHandler, readPublishedPartnerDetails, PUBLIC_DETAILS_FIELDS } from '../lib/discovery/public-details.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'

const now = Date.parse('2026-11-10T12:00:00Z'), id = '10000000-0000-4000-8000-000000000001'
const request = headers => new Request('https://www.gorez.co/api/public/discovery/business/' + id, { headers })
const rawPartner = patch => ({ id, name: 'Owner business', slug: 'owner-business', active: true, platform_status: 'enabled', industry: 'beauty', address: 'Public address', city: 'София',
  services: [{ id: 's1', name: 'Маникюр', price: 30, currency: 'EUR', duration_min: 60, active: true }, { name: 'Hidden', active: false }],
  customers: [{ email: 'customer-private@example.org' }], appointments: [{ notes: 'private appointment' }], owner_user_id: 'private-owner', billing: 'private-billing',
  website_url: 'https://business.bg/', phone: '+359888000001', ...patch })
const dependencies = patch => ({ config: { enabled: true }, now: () => now, allowAttempt: async () => true,
  findCatalogue: async value => SOFIA_CATALOGUE.find(row => row.id === value), readCataloguePhotos: async () => [], readPartner: async () => rawPartner(), ...patch })
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')

test('compact previews show zero, one, two or many services with a hard maximum of two', () => {
  for (const count of [0, 1, 2, 5, 300]) {
    const services = Array.from({ length: count }, (_, i) => ({ name: `Service ${i}`, price: i + 10, currency: 'EUR' }))
    const row = { source: 'catalogue', services, details: { services } }
    assert.equal(railServiceItems(row).length, Math.min(2, count))
    assert.equal(railServiceItems(compactDiscoveryRow(row)).length, Math.min(2, count))
  }
})

test('representative matching priced services lead; cheap add-ons and unrelated prices do not displace them', () => {
  const row = { source: 'catalogue', services: [{ name: 'Маникюр' }, { name: 'Маникюр с гел лак' }, { name: 'Стикер на нокът' }],
    details: { services: [{ name: 'Маникюр' }, { name: 'Маникюр с гел лак', price: 30 }, { name: 'Стикер на нокът', price: 1 }, { name: 'Педикюр', price: 45 }] } }
  assert.deepEqual(railServiceItems(row).map(service => service.name), ['Маникюр с гел лак', 'Маникюр'])
  assert.equal(railServiceItems(row)[1].price, null)
  assert.equal(detailPriceLabel(railServiceItems(row)[1]), null)
})

test('the HTTP preview drops full menus/photos/hours but preserves category, directions, booking and availability', () => {
  const row = normalizeCatalogueBusinesses([SOFIA_CATALOGUE.find(row => row.id === 'sofia-autocomplex-rs')], { browse: true, searchV2: true, requirements: [] }, { now })[0]
  const compact = compactDiscoveryResponse({ results: [row], cataloguePage: { total: 1 } }).results[0]
  assert.equal(compact.details, undefined)
  assert.equal(compact.publicServiceNames, undefined)
  assert.equal(compact.hours, undefined)
  assert.equal(compact.servicePreview.length, 2)
  assert.equal(compact.services.length, 2)
  assert.equal(compact.detailsRef, row.id)
  assert.equal(railCategory(compact), railCategory(row))
  assert.equal(railDirections(compact), railDirections(row))
  assert.deepEqual(railExternalAction(compact, now), railExternalAction(row, now))
  assert.deepEqual(compact.availability, row.availability)
  assert.ok(JSON.stringify(compact).length < JSON.stringify(row).length / 4)
  const partner = { source: 'gorez', id, services: [] }
  assert.equal(compactDiscoveryResponse({ externalStatus: 'catalogue', results: [partner] }).results[0].googleRatingsEnabled, false)
  assert.equal(compactDiscoveryResponse({ externalStatus: 'ready', results: [partner] }).results[0].googleRatingsEnabled, undefined)
})

test('a full catalogue menu is fetched on open with one optional batched photo read', async () => {
  let photoReads = 0
  const handler = createPublicBusinessDetailsHandler(dependencies({ readCataloguePhotos: async ids => { assert.deepEqual(ids, ['sofia-autocomplex-rs']); photoReads++; return [] } }))
  const response = await handler(request(), 'sofia-autocomplex-rs'), value = await response.json()
  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control'), /no-store/)
  assert.ok(value.business.details.services.length > 150)
  assert.equal(photoReads, 1)
  assert.ok(value.business.details.services.some(service => service.priceKind === 'from'))
})

test('publication, expiry, origin and rate limits fail closed before revealing private details', async () => {
  for (const patch of [{ active: false }, { platform_status: 'suspended' }, { platform_status: 'pending' }, { id: 'another-business' }]) {
    const response = await createPublicBusinessDetailsHandler(dependencies({ readPartner: async () => rawPartner(patch) }))(request(), id)
    assert.equal(response.status, 404)
    assert.doesNotMatch(await response.text(), /Owner business|customer-private/)
  }
  const expired = createPublicBusinessDetailsHandler(dependencies({ now: () => Date.parse('2027-04-01') }))
  assert.equal((await expired(request(), 'sofia-autocomplex-rs')).status, 404)
  const denied = createPublicBusinessDetailsHandler(dependencies({ allowAttempt: async () => false, readPartner: () => assert.fail('must not read') }))
  assert.equal((await denied(request(), id)).status, 429)
  assert.equal((await denied(request({ origin: 'https://attacker.example', 'sec-fetch-site': 'cross-site' }), id)).status, 403)
  for (const bad of ['../', 'sofia-x', 'https://private.example/', '1', 'sofia-' + 'x'.repeat(200)]) assert.equal((await denied(request(), bad)).status, 404)
})

test('owner full details retain all active services without exposing owner, customer, billing or appointment data', async () => {
  const services = Array.from({ length: 60 }, (_, i) => ({ name: `Public service ${i}`, active: true, price: 20, duration_min: 30 }))
  const response = await createPublicBusinessDetailsHandler(dependencies({ readPartner: async () => rawPartner({ services: [...services, { name: 'Hidden', active: false }] }) }))(request(), id)
  const { business } = await response.json()
  assert.equal(business.details.services.length, 60)
  assert.equal(business.details.phone, '+359888000001')
  assert.equal(business.details.sourceUrl, 'https://business.bg/')
  assert.doesNotMatch(JSON.stringify(business), /customer-private|private appointment|private-owner|private-billing|Hidden|owner_user_id|appointments|customers/)
})

test('the partner query is one scoped read with bounded full-menu relationships, never select star', async () => {
  const calls = []
  const query = new Proxy({}, { get: (_, key) => (...args) => { calls.push([key, ...args]); return key === 'maybeSingle' ? Promise.resolve({ data: rawPartner(), error: null }) : query } })
  await readPublishedPartnerDetails({ from: name => { assert.equal(name, 'businesses'); return query } }, id)
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'id' && call[2] === id))
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'platform_status' && call[2] === 'enabled'))
  assert.ok(calls.some(call => call[0] === 'limit' && call[1] === 500 && call[2].referencedTable === 'services'))
  assert.doesNotMatch(PUBLIC_DETAILS_FIELDS, /\*|owner_user_id|customers|appointments|billing/)
})

test('photo storage outages retain factual menu; unsafe links and cross-business media are not introduced', async () => {
  const handler = createPublicBusinessDetailsHandler(dependencies({ readCataloguePhotos: async () => { throw Error('storage unavailable') } }))
  const response = await handler(request(), 'sofia-zona-wash')
  assert.equal(response.status, 200)
  assert.equal((await response.json()).business.photo, null)
  const unsafe = await createPublicBusinessDetailsHandler(dependencies({ readPartner: async () => rawPartner({ website_url: 'javascript:bad()', phone: 'https://attacker/' }) }))(request(), id)
  const { business } = await unsafe.json()
  assert.equal(business.details.sourceUrl, null)
  assert.equal(business.details.phone, null)
})

test('service grouping retains every service once and all new labels have BG/EN translations', () => {
  const services = businessDetailServices({ services: [{ name: 'Hair', category: 'hair' }, { name: 'Nails', category: 'nails' }, { name: 'Other' }] })
  const groups = groupDetailServices(services)
  assert.equal(groups.flatMap(group => group.services).length, 3)
  assert.equal(groups.length, 3)
  for (const key of ['directions', 'reserveAppointment', 'viewDetailsLower', 'servicesPrices', 'detailsError', 'photoUnavailable']) {
    assert.equal(typeof DISCOVERY_COPY.bg[key], 'string'); assert.equal(typeof DISCOVERY_COPY.en[key], 'string')
  }
  assert.equal(DISCOVERY_COPY.bg.viewDetailsLower, 'виж детайли')
  assert.equal(DISCOVERY_COPY.en.directions, 'Get directions')
  assert.match(detailPriceLabel({ price: 30, currency: 'EUR' }, 'bg', { compact: true }), /^30\s*€/u)
  assert.match(detailPriceLabel({ price: 30.5, currency: 'EUR' }, 'bg', { compact: true }), /^30,5\s*€/u)
  assert.equal(detailPriceLabel({ price: 30, priceKind: 'range', currency: 'EUR' }), null, 'an incomplete range cannot silently become a fixed price')
  assert.equal(detailPriceLabel({ price: -2, currency: 'EUR' }), null)
})

test('card has one stretched keyboard-accessible details trigger and only two bottom actions', async () => {
  const card = await read('components/discovery-business-card.js'), css = await read('app/discovery-home.css')
  assert.match(card, /className="home-business-open"[^>]+aria-haspopup="dialog"/)
  assert.match(card, /home-business-details-label/)
  assert.doesNotMatch(card, /home-business-details-link|<h3>.*<button/)
  assert.match(css, /\.home-business-open \{[^}]*inset: 0/)
  assert.match(css, /\.home-business-footer[^}]*z-index: 2/)
  const dialog = await read('components/discovery-business-details.js')
  assert.match(dialog, /\/api\/public\/discovery\/business\//)
  assert.match(dialog, /fetch\(path, /)
  assert.match(dialog, /controller\.abort\(\)/)
  assert.match(dialog, /event\.target\.closest\('dialog'\) === event\.currentTarget/)
  assert.match(dialog, /BusinessPhotoGallery[^>]+autoplay=\{false\}/)
})

test('OSM attribution lives once in the shared footer, not in each rail or details modal', async () => {
  const footer = await read('components/site-footer.js')
  assert.equal((footer.match(/© OpenStreetMap contributors/g) || []).length, 1)
  assert.match(footer, /https:\/\/www\.openstreetmap\.org\/copyright/)
  for (const file of ['components/discovery-home-browse.js', 'components/discovery-business-details.js']) assert.doesNotMatch(await read(file), /© OpenStreetMap contributors|catalogue-location-credit/)
})
