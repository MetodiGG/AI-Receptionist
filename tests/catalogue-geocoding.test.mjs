import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { catalogueStreetAddress, matchCatalogueGeocode, OSM_ATTRIBUTION } from '../lib/discovery/catalogue-geocoding.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueRecordSchema } from '../lib/discovery/catalogue-policy.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'

const row = patch => ({ ...structuredClone(SOFIA_CATALOGUE[0]), coordinates:null, address:'София, ул. Примерна 12А, ет. 2', locationKind:'premises', ...patch })
const candidate = patch => ({ osm_type:'way',osm_id:123,lat:'42.67',lon:'23.29',addresstype:'building',
  boundingbox:['42.6699','42.6701','23.2899','23.2901'],address:{city:'София',country_code:'bg',road:'улица Примерна',house_number:'12A'},...patch })
const checkedOn = '2026-11-06'

test('one-time geocoding requires an actual street and house number, never a district or office invention', () => {
  assert.deepEqual(catalogueStreetAddress(row()), {road:'Примерна',house:'12А',query:'ул. Примерна 12А, София, България',sourceAddress:row().address})
  for (const patch of [
    {locationKind:'service_area'},{coordinates:{latitude:42.67,longitude:23.29}},
    {address:null},{address:'София, Манастирски ливади'},{address:'София, ж.к. Младост 3, бл. 20'},
    {address:'София, ул. Примерна 12–14'},{address:'София, ул. Примерна 12-14'},
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

test('all committed geocodes can be reproduced offline from the one-time cache; first-party points stay separate', async () => {
  const cache=JSON.parse(await readFile(new URL('../docs/catalogue-geocoding/nominatim-address-cache-20261106.json',import.meta.url),'utf8'))
  const updates=JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/geocodes-v2.json',import.meta.url),'utf8'))
  assert.equal(Object.keys(cache).length,225)
  assert.equal(updates.length,38)
  for(const update of updates) {
    const record=SOFIA_CATALOGUE.find(item=>item.id===update.id)
    const original={...record,coordinates:null},requested=catalogueStreetAddress(original)
    assert.ok(requested,update.id)
    assert.deepEqual(matchCatalogueGeocode(original,cache[requested.query],checkedOn),update,update.id)
    assert.deepEqual(record.coordinates,update.coordinates)
  }
  assert.ok(SOFIA_CATALOGUE.filter(item=>item.coordinates?.method==='first_party_coordinates').length>=79)
})

test('geocoding remains offline, owner-approved, rate-limited and cached; attribution is visible without extra requests', async () => {
  const script=await readFile(new URL('../scripts/geocode-catalogue-once.mjs',import.meta.url),'utf8')
  assert.match(script,/'approved-one-time'/);assert.match(script,/1100-\(Date\.now\(\)-lastStart\)/)
  assert.match(script,/'User-Agent':'GoRezCatalogueReview/);assert.match(script,/Object\.hasOwn\(cache,key\)/)
  assert.match(script,/stopped without retries/);assert.doesNotMatch(script,/Promise\.all|setInterval|maps\.googleapis/)
  const runtime=await readFile(new URL('../lib/discovery/catalogue-search.mjs',import.meta.url),'utf8')
  assert.doesNotMatch(runtime,/catalogue-geocoding|nominatim/)
  const ui=await readFile(new URL('../components/discovery-home-browse.js',import.meta.url),'utf8')
  assert.match(ui,/footer=\{osmLocations &&/); assert.match(ui,/© OpenStreetMap contributors/)
})

test('the attributed OSM layer is offered as machine-readable ODbL data, separate from business menus and partner records', async () => {
  const data = JSON.parse(await readFile(new URL('../public/catalogue-location-data-20261106.json',import.meta.url),'utf8'))
  const updates = JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/geocodes-v2.json',import.meta.url),'utf8'))
  assert.equal(data.licence,'ODbL-1.0'); assert.equal(data.licenceUrl,'https://opendatacommons.org/licenses/odbl/1-0/')
  assert.equal(data.attribution,OSM_ATTRIBUTION); assert.deepEqual(data.points,updates)
  assert.ok(data.points.every(row=>row.coordinates.method==='verified_address_geocode'))
  assert.doesNotMatch(JSON.stringify(data),/"phone"|"booking"|"services"|"email"|"price"/)
  const ui=await readFile(new URL('../components/discovery-home-browse.js',import.meta.url),'utf8')
  assert.match(ui,/catalogue-location-data-20261106\.json/)
})
