import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { catalogueStreetAddress, matchCatalogueGeocode, OSM_ATTRIBUTION } from '../lib/discovery/catalogue-geocoding.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueRecordSchema } from '../lib/discovery/catalogue-policy.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'

const row = patch => ({ ...structuredClone(SOFIA_CATALOGUE[0]), coordinates:null, address:'София, ул. Примерна 12А, ет. 2', locationKind:'premises', ...patch })
const candidate = patch => ({ osm_type:'way',osm_id:123,lat:'42.67',lon:'23.29',addresstype:'building',
  boundingbox:['42.6699','42.6701','23.2899','23.2901'],address:{city:'София',country_code:'bg',road:'улица Примерна',house_number:'12A'},...patch })
const checkedOn = '2026-11-06'
const retiredOsmPoints = Object.freeze({
  'sofia-san-krasi-barber': { latitude: 42.7131329, longitude: 23.2480611, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/node/9552185683', addressId: '104973' },
  'sofia-carbox-studio': { latitude: 42.6272014, longitude: 23.3310508, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/way/172804668', addressId: '116434' },
  'sofia-xzona-sport': { latitude: 42.6691113, longitude: 23.2545085, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/way/301894763', addressId: '34754' },
})

test('one-time geocoding requires an actual street and house number, never a district or office invention', () => {
  assert.deepEqual(catalogueStreetAddress(row()), {road:'Примерна',house:'12А',query:'ул. Примерна 12А, София, България',sourceAddress:row().address})
  for (const patch of [
    {locationKind:'service_area'},{coordinates:{latitude:42.67,longitude:23.29}},
    {address:null},{address:'София, Манастирски ливади'},{address:'София, ж.к. Младост 3, бл. 20'},
    {address:'София, ул. Примерна 12–14'},{address:'София, ул. Примерна 12-14'},
    {address:'София, ул. Иван Димитров — Куклата, бл. 51'},
  ]) assert.equal(catalogueStreetAddress(row(patch)),null,JSON.stringify(patch))
})

test('only exact house/street/city/country matches with a bounded building point are accepted', () => {
  const found=matchCatalogueGeocode(row(),[candidate()],checkedOn)
  assert.equal(found.id,row().id); assert.equal(found.coordinates.source,'https://www.openstreetmap.org/way/123')
  assert.equal(found.coordinates.method,'verified_address_geocode'); assert.equal(found.coordinates.attribution,OSM_ATTRIBUTION)
  assert.equal(found.coordinates.sourceAddress,row().address)
  assert.equal(catalogueRecordSchema.safeParse(row({coordinates:found.coordinates})).success,true)
  const badAddress = patch => ({address:{...candidate().address,...patch}})
  for(const patch of [badAddress({house_number:'12Б'}),badAddress({house_number:undefined}),badAddress({road:'Друга'}),
    badAddress({city:'Пловдив'}),badAddress({country_code:'de'}),{osm_type:'unknown'},{osm_id:'not-an-id'},
    {lat:'NaN'},{lon:26.3},{boundingbox:['42','43','23','24']},{boundingbox:undefined},{addresstype:'suburb'},
  ]) assert.equal(matchCatalogueGeocode(row(),[candidate(patch)],checkedOn),null,JSON.stringify(patch))
  assert.equal(matchCatalogueGeocode(row({address:'София, ул. Примерна 12B'}),[candidate(badAddress({house_number:'12В'}))],checkedOn),null,'ambiguous Latin B is not silently remapped')
  assert.equal(matchCatalogueGeocode(row(),[candidate(),candidate({osm_id:124,lat:'42.675'})],checkedOn),null,'conflicting exact-address hits need review')
})

test('address changes, missing attribution and a forged provider URL invalidate stored geocodes', () => {
  const coordinates=matchCatalogueGeocode(row(),[candidate()],checkedOn).coordinates
  for (const patch of [{sourceAddress:'София, ул. Друга 1'},{licence:'unknown'},{attribution:''},{source:'https://maps.google.com/?q=42,23'}]) {
    assert.equal(catalogueRecordSchema.safeParse(row({coordinates:{...coordinates,...patch}})).success,false)
  }
  const normalized=normalizeCatalogueBusinesses([row({coordinates})],{cityCode:'68134',browse:true,requirements:[]},{now:Date.parse(checkedOn)})
  assert.equal(normalized.length,1)
  assert.deepEqual(normalized[0].coordinateAttribution,{label:OSM_ATTRIBUTION,url:'https://www.openstreetmap.org/copyright'})
  assert.deepEqual(Object.keys(normalized[0].coordinates).sort(),['latitude','longitude'],'internal review metadata stays out of public coordinates')
  const firstParty=normalizeCatalogueBusinesses([row({coordinates:{latitude:42.67,longitude:23.29,source:'https://example.org/contacts',method:'first_party_coordinates'}})],{cityCode:'68134',browse:true,requirements:[]},{now:Date.parse(checkedOn)})
  assert.equal(firstParty[0].coordinateAttribution,undefined)
})

test('the automatic address batch can be reproduced offline from its one-time cache; first-party points stay separate', async () => {
  const cache=JSON.parse(await readFile(new URL('../docs/catalogue-geocoding/nominatim-address-cache-20261106.json',import.meta.url),'utf8'))
  const updates=JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/geocodes-v2.json',import.meta.url),'utf8'))
  assert.equal(Object.keys(cache).length,225)
  assert.equal(updates.length,38)
  const official = JSON.parse(await readFile(new URL('../public/catalogue-official-address-points-20261113.json', import.meta.url), 'utf8'))
  for(const update of updates) {
    const record=SOFIA_CATALOGUE.find(item=>item.id===update.id)
    const original={...record,coordinates:null},requested=catalogueStreetAddress(original)
    assert.ok(requested,update.id)
    assert.deepEqual(matchCatalogueGeocode(original,cache[requested.query],checkedOn),update,update.id)
    const retired = retiredOsmPoints[update.id]
    if (!retired) assert.deepEqual(record.coordinates,update.coordinates)
    else {
      const replacement = official.points.find(row => row.id === update.id)
      const { addressId, ...previous } = retired
      assert.deepEqual(replacement.previousCoordinates, previous, update.id)
      assert.deepEqual(Object.fromEntries(Object.keys(previous).map(key => [key, update.coordinates[key]])), previous, update.id)
      assert.equal(replacement.coordinates.addressId, addressId)
      assert.equal(replacement.coordinates.method, 'verified_official_address')
      assert.equal(replacement.coordinates.sourceAddress, record.address)
      assert.equal(replacement.review.decision, 'manually_confirmed_wrong_previous_point')
      assert.deepEqual(record.coordinates, replacement.coordinates)
    }
  }
  assert.ok(SOFIA_CATALOGUE.filter(item=>item.coordinates?.method==='first_party_coordinates').length>=79)
})

test('historical OSM receipts remain byte-identical to the published baseline despite exactly reviewed canonical retirements', async () => {
  const hashes = {
    '../lib/discovery/catalogue-data/geocodes-v2.json': 'b7355229844909b39c4d29fc2647381df7a253e0c2dd60d329abf5432c15da8d',
    '../lib/discovery/catalogue-data/geocodes-v3.json': 'b57eff6ce85167fddc32d0f6246bcbd203b037792982ff40b383d6cd00689d5e',
    '../lib/discovery/catalogue-data/geocodes-v4.json': 'e622c4e60f6814a71589e74dc9bbb6990664f59fc0f168b86e26a30156258b11',
    '../public/catalogue-location-data-20261106.json': 'd1be9552f2f1ad76e88097796d88043108beb40a3cbf596a65fb4d653c38103c',
  }
  for (const [path, hash] of Object.entries(hashes)) assert.equal(createHash('sha256').update(await readFile(new URL(path, import.meta.url))).digest('hex'), hash, path)
  const official = JSON.parse(await readFile(new URL('../public/catalogue-official-address-points-20261113.json', import.meta.url), 'utf8'))
  const corrections = {
    'sofia-in-beauty': { addressId: '113534', previous: null },
    'sofia-san-krasi-barber': { addressId: '104973', previous: { latitude: 42.7131329, longitude: 23.2480611, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/node/9552185683' } },
    'sofia-carbox-studio': { addressId: '116434', previous: { latitude: 42.6272014, longitude: 23.3310508, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/way/172804668' } },
    'sofia-xzona-sport': { addressId: '34754', previous: { latitude: 42.6691113, longitude: 23.2545085, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/way/301894763' } },
    'sofia-rhythm-academy': { addressId: '8313', previous: { latitude: 42.6351614, longitude: 23.3065149, method: 'first_party_coordinates', source: 'https://rhythm-academy.com/' } },
    'sofia-classy-barbershop': { addressId: '34863', previous: { latitude: 42.6673803, longitude: 23.3493594, method: 'first_party_coordinates', source: 'https://www.classy-barbershop.com/' } },
    'sofia-inergy-borovo-reserved-kickboxing': { addressId: '94336', previous: { latitude: 42.668698, longitude: 23.285587, method: 'first_party_coordinates', source: 'https://inergyfitness.com/zanimaniya/kickbox/' } },
  }
  const manual = official.points.filter(row => /^(?:manual_duplicate_disambiguation|manually_confirmed_wrong_previous_point)$/.test(row.review.decision))
  assert.deepEqual(manual.map(row => row.id).sort(), Object.keys(corrections).sort())
  for (const replacement of manual) {
    assert.equal(replacement.coordinates.addressId, corrections[replacement.id].addressId)
    assert.deepEqual(replacement.previousCoordinates, corrections[replacement.id].previous)
    assert.deepEqual(SOFIA_CATALOGUE.find(row => row.id === replacement.id).coordinates, replacement.coordinates)
  }
})

test('the manually reviewed LUX point uses the exact-address hospital building from the existing cache, not the ATM', async () => {
  const cache = JSON.parse(await readFile(new URL('../docs/catalogue-geocoding/nominatim-address-cache-20261106.json',import.meta.url),'utf8'))
  const updates = JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/geocodes-v3.json',import.meta.url),'utf8'))
  const record = SOFIA_CATALOGUE.find(row => row.id === 'sofia-lux-mbal-sveta-sofia-carwash')
  const original = { ...record, coordinates: null }, request = catalogueStreetAddress(original)
  const candidates = cache[request.query]
  assert.equal(updates.length, 1)
  assert.ok(candidates.some(row => row.type === 'atm'))
  const hospital = candidates.filter(row => row.osm_type === 'way' && row.osm_id === 1551254006 && row.category === 'building' && row.type === 'hospital')
  assert.equal(hospital.length, 1)
  assert.deepEqual(matchCatalogueGeocode(original, hospital, checkedOn), updates[0])
  assert.deepEqual(record.coordinates, updates[0].coordinates)
  assert.match(record.address, /България 104, Корпус 2/)
})

test('geocoding remains offline, owner-approved, rate-limited and cached; attribution is visible without extra requests', async () => {
  const script=await readFile(new URL('../scripts/geocode-catalogue-once.mjs',import.meta.url),'utf8')
  assert.match(script,/'approved-one-time'/);assert.match(script,/1100-\(Date\.now\(\)-lastStart\)/)
  assert.match(script,/'User-Agent':'GoRezCatalogueReview/);assert.match(script,/Object\.hasOwn\(cache,key\)/)
  assert.match(script,/stopped without retries/);assert.doesNotMatch(script,/Promise\.all|setInterval|maps\.googleapis/)
  const runtime=await readFile(new URL('../lib/discovery/catalogue-search.mjs',import.meta.url),'utf8')
  assert.doesNotMatch(runtime,/catalogue-geocoding|nominatim/)
  const ui=await readFile(new URL('../components/site-footer.js',import.meta.url),'utf8')
  assert.match(ui,/site-location-credit/); assert.match(ui,/© OpenStreetMap contributors/)
})

test('the attributed OSM layer is offered as machine-readable ODbL data, separate from business menus and partner records', async () => {
  const data = JSON.parse(await readFile(new URL('../public/catalogue-location-data-20261106.json',import.meta.url),'utf8'))
  const updates = [...JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/geocodes-v2.json',import.meta.url),'utf8')), ...JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/geocodes-v3.json',import.meta.url),'utf8')), ...JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/geocodes-v4.json',import.meta.url),'utf8'))]
  assert.equal(data.licence,'ODbL-1.0'); assert.equal(data.licenceUrl,'https://opendatacommons.org/licenses/odbl/1-0/')
  assert.equal(data.attribution,OSM_ATTRIBUTION); assert.deepEqual([...data.points].sort((a,b)=>a.id.localeCompare(b.id)),updates.sort((a,b)=>a.id.localeCompare(b.id)))
  assert.ok(data.points.every(row=>row.coordinates.method==='verified_address_geocode'))
  assert.doesNotMatch(JSON.stringify(data),/"phone"|"booking"|"services"|"email"|"price"/)
  const ui=await readFile(new URL('../components/site-footer.js',import.meta.url),'utf8')
  assert.match(ui,/catalogue-location-data-20261106\.json/)
})
