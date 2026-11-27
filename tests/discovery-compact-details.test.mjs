import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { compactDiscoveryResponse, compactDiscoveryRow } from '../lib/discovery/preview.mjs'
import { railDirections, railExternalAction, railServiceItems, railCategory, railServiceDescription, SERVICE_PREVIEW_LIMIT } from '../lib/discovery/rail.mjs'
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

test('compact previews show only actual services with a shared hard maximum of two', () => {
  assert.equal(SERVICE_PREVIEW_LIMIT, 2)
  for (const count of [0, 1, 2, 3, 4, 5, 300]) {
    const services = Array.from({ length: count }, (_, i) => ({ name: `Service ${i}`, price: i + 10, currency: 'EUR' }))
    const row = { source: 'catalogue', services, details: { services } }
    assert.equal(railServiceItems(row).length, Math.min(2, count))
    assert.equal(railServiceItems({ ...row, servicePreview: services }).length, Math.min(2, count), 'older oversized cached previews use the same two-row boundary')
    assert.equal(railServiceItems(compactDiscoveryRow(row)).length, Math.min(2, count))
    assert.equal(compactDiscoveryRow(row).services.length, Math.min(2, count))
    assert.equal(row.services.length, count, 'the full source menu is not truncated')
  }
})

test('representative matching priced services lead; cheap add-ons and unrelated prices do not displace them', () => {
  const row = { source: 'catalogue', services: [{ name: 'Маникюр' }, { name: 'Маникюр с гел лак' }, { name: 'Стикер на нокът' }],
    details: { services: [{ name: 'Маникюр' }, { name: 'Маникюр с гел лак', price: 30 }, { name: 'Стикер на нокът', price: 1 }, { name: 'Педикюр', price: 45 }] } }
  assert.deepEqual(railServiceItems(row).map(service => service.name), ['Маникюр с гел лак', 'Маникюр'])
  assert.equal(railServiceItems(row)[1].price, null)
  assert.equal(detailPriceLabel(railServiceItems(row)[1]), null)
})

test('selected football previews never append tennis from the full menu, including compact HTTP rows', () => {
  for (const source of ['gorez','catalogue']) {
    const row = { source, subcategory: 'fitness-football', services: [{ name: 'Наем на футболно игрище' }],
      publicServiceNames: ['Наем на тенис корт', 'Наем на футболно игрище'],
      details: { services: [{ name: 'Наем на тенис корт', price: 20, currency: 'EUR' }, { name: 'Наем на футболно игрище', price: 70, currency: 'EUR' }] } }
    for (const value of [row, compactDiscoveryRow(row)]) {
      assert.equal(value.subcategory, 'fitness-football')
      assert.deepEqual(railServiceItems(value).map(service => [service.name,service.price]), [['Наем на футболно игрище',70]])
    }
    assert.equal(businessDetailServices(row).length, 2, 'opening details still retains the complete real menu')
    assert.equal(railServiceItems({ ...row, subcategory: undefined }).length, 2, 'unfiltered parent browsing retains the existing preview behavior')
  }
})

test('an unpriced selected service cannot be replaced or supplemented by another activity with a price', () => {
  const row = { source: 'catalogue', subcategory: 'fitness-football', services: [{ name: 'Урок по футбол' }],
    publicServiceNames: ['Урок по тенис','Урок по футбол'], details: { services: [{ name: 'Урок по тенис', price: 30, currency: 'EUR' }, { name: 'Урок по футбол' }] } }
  for (const value of [row,compactDiscoveryRow(row)]) {
    const services = railServiceItems(value)
    assert.equal(services.length, 1)
    assert.equal(services[0].name, 'Урок по футбол')
    assert.equal(services[0].price, null)
    assert.equal(detailPriceLabel(services[0]), null)
  }
})

test('a strict compact preview cannot bypass matched service names through a mixed cached preview array', () => {
  const row = { source: 'gorez', subcategory: 'fitness-football', services: [{ name: 'Урок по футбол' }], servicePreview: [{ name: 'Урок по тенис', price: 40 }, { name: 'Урок по футбол', price: 20 }] }
  assert.deepEqual(railServiceItems(row).map(service => [service.name,service.price]), [['Урок по футбол',20]])
  assert.deepEqual(railServiceItems({ ...row, services: [] }), [])
  assert.equal(railServiceItems({ ...row, subcategory: undefined }).length, 2)
})

test('strict compaction retains the original objects for the representative matched services, even when they are not first', () => {
  const services = Array.from({ length: 5 }, (_, index) => ({ id: `10000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`, name: `Урок по футбол ${index+1}`, price: index < 3 ? null : 10+index, currency: 'EUR' }))
  const row = { source: 'gorez', id, subcategory: 'fitness-football', services, details: { services: [...services,{ name: 'Урок по тенис', price: 25 }] } }
  const expected = railServiceItems(row)
  const compact = compactDiscoveryRow(row)
  assert.deepEqual(compact.servicePreview.map(service => service.name), expected.map(service => service.name))
  assert.deepEqual(railServiceItems(compact).map(service => service.name), expected.map(service => service.name))
  assert.deepEqual(compact.services.map(service => service.id), [services[3].id,services[4].id])
  for (const [index, service] of [services[3],services[4]].entries()) assert.equal(compact.services[index], service, 'compaction retains the original service object, not a synthetic ID/name pair')
  assert.equal(row.services.length, 5, 'the complete matched source inventory remains unchanged')
})

test('strict same-name price conflicts stay unpriced after compaction while retaining a real matched identifier', () => {
  const services = [{ id, name: 'Подстригване', price: 20 }, { id: '10000000-0000-4000-8000-000000000002', name: 'Подстригване', price: 35 }]
  const row = { source: 'gorez', id, subcategory: 'hair-cut', services, details: { services } }
  const compact = compactDiscoveryRow(row)
  assert.equal(compact.services[0].id, id)
  assert.equal(compact.servicePreview.length, 1)
  assert.equal(compact.servicePreview[0].price, null)
  assert.equal(railServiceItems(compact)[0].price, null)
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

test('two-row compaction preserves zero, from, ranges, units and missing prices in representative matching pairs', () => {
  const services = [
    { id, name: 'First actual service', price: 0, currency: 'EUR' },
    { id: '10000000-0000-4000-8000-000000000002', name: 'Second actual service', price: 20, priceKind: 'from', currency: 'EUR', priceUnit: 'visit' },
    { id: '10000000-0000-4000-8000-000000000003', name: 'Third actual service', price: 10.23, priceMaximum: 15.34, priceKind: 'range', currency: 'EUR' },
    { id: '10000000-0000-4000-8000-000000000004', name: 'Fourth actual service', price: null, currency: 'EUR' },
    { id: '10000000-0000-4000-8000-000000000005', name: 'Fifth actual service', price: null, currency: 'EUR' },
  ]
  for (const [pairIndex, selected] of [services.slice(0,2), services.slice(2,4)].entries()) {
    const row = { source: 'gorez', id, category: 'hair', services: selected, details: { services } }
    const compact = compactDiscoveryRow(row)
    assert.equal(railServiceDescription(row, 'en'), selected.map(service => service.name).join(' · '))
    for (const value of [row, compact]) {
      const preview = railServiceItems(value)
      assert.deepEqual(preview.map(service => service.id), selected.map(service => service.id))
      if (pairIndex === 0) {
        assert.equal(preview[0].price, 0)
        assert.match(detailPriceLabel(preview[1], 'en'), /^from €20\.00 \/ visit$/)
      } else {
        assert.match(detailPriceLabel(preview[0], 'en'), /10\.23.*15\.34/)
        assert.equal(detailPriceLabel(preview[1], 'en'), null)
      }
    }
    assert.equal(businessDetailServices(row).length, 5, 'full details preserve all actual services outside the two-row preview')
  }
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

test('public partner details preserve the stable reviewed activity cover ID through their thin allowlist', async () => {
  const response = await createPublicBusinessDetailsHandler(dependencies())(request(), id)
  const { business } = await response.json()
  assert.equal(response.status, 200)
  assert.equal(business.illustrativeCoverPhotoKey, 'classic-manicure')
  assert.equal(business.businessCategory, 'nails')
  assert.equal(business.publicServiceNames, undefined, 'the image ID does not require duplicating the public menu')
  assert.doesNotMatch(JSON.stringify(business), /customer-private|private appointment|private-owner|private-billing|owner_user_id/)
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
  assert.equal(DISCOVERY_COPY.en.directions, 'Directions')
  assert.match(detailPriceLabel({ price: 30, currency: 'EUR' }, 'bg', { compact: true }), /^30\s*€/u)
  assert.match(detailPriceLabel({ price: 30.5, currency: 'EUR' }, 'bg', { compact: true }), /^30,5\s*€/u)
  assert.equal(detailPriceLabel({ price: 30, priceKind: 'range', currency: 'EUR' }), null, 'an incomplete range cannot silently become a fixed price')
  assert.equal(detailPriceLabel({ price: -2, currency: 'EUR' }), null)
})

test('compact card has one stretched keyboard-accessible details trigger and one shared two-action group', async () => {
  const card = await read('components/discovery-business-card.js'), css = await read('app/discovery-home.css')
  assert.match(card, /className="home-business-open"[^>]+aria-haspopup="dialog"/)
  assert.match(card, /home-business-service-preview/)
  assert.doesNotMatch(card, /home-business-inline-details/)
  assert.match(card, /<PublicActionPair className="home-business-actions">/)
  assert.doesNotMatch(card, /home-business-details-link|<h3>.*<button/)
  assert.match(css, /\.home-business-open \{[^}]*inset: 0/)
  assert.match(css, /\.home-business-footer[^}]*z-index: 2/)
  const dialog = await read('components/discovery-business-details.js')
  const request = await read('lib/discovery/detail-request.mjs')
  assert.match(request, /\/api\/public\/discovery\/business\//)
  assert.match(request, /fetcher\(path \+ encodeURIComponent\(id\) \+ '\?photos=1',/)
  assert.match(request, /controller\.abort\(\)/)
  assert.match(dialog, /business: next, status: nextStatus/)
  assert.match(dialog, /event\.target\.closest\('dialog'\) === event\.currentTarget/)
  assert.match(dialog, /BusinessPhotoGallery[^>]+autoplay=\{false\}/)
})

test('OSM attribution lives once in the shared footer, not in each rail or details modal', async () => {
  const footer = await read('components/site-footer.js')
  assert.equal((footer.match(/© OpenStreetMap contributors/g) || []).length, 1)
  assert.match(footer, /https:\/\/www\.openstreetmap\.org\/copyright/)
  for (const file of ['components/discovery-home-browse.js', 'components/discovery-business-details.js']) assert.doesNotMatch(await read(file), /© OpenStreetMap contributors|catalogue-location-credit/)
})
