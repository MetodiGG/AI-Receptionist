import test from 'node:test'
import assert from 'node:assert/strict'
import { businessDirectionsAddress, businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { REVIEWED_BUSINESS_DESTINATIONS, REVIEWED_NATIVE_BUSINESS_DESTINATIONS, reviewedBusinessDestination } from '../lib/business-directions-reviewed.mjs'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { compactDiscoveryRow } from '../lib/discovery/preview.mjs'
import { railDirections } from '../lib/discovery/rail.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'

const now = Date.parse('2026-11-11T12:00:00Z')
const destination = row => {
  const value = businessMapsDirectionsUrl(row)
  return value ? new URL(value).searchParams.get('destination') : null
}

test('correct visible street address wins over stale, swapped or zero coordinates', () => {
  for (const coordinates of [{latitude:42.61,longitude:23.11}, {latitude:0,longitude:0}, {latitude:23.3,longitude:42.7}, null]) {
    const row = {name:'Another branch · Services', source:'gorez', city:'София',address:'ул. Пирин 83',coordinates,public_profile:{latitude:0,longitude:0}}
    assert.equal(destination(row), 'София, ул. Пирин 83, България')
    assert.equal(businessDirectionsUrl(row), railDirections(row))
  }
})

test('the two owner-reported regressions use their exact distinct displayed premises', () => {
  for (const [id, address] of [
    ['sofia-kerelski-manastirski-livadi', 'София, Манастирски ливади, ул. Пирин 83'],
    ['sofia-mokro-nosle', 'София, Манастирски ливади, ул. Пирин 85'],
  ]) {
    const row = SOFIA_CATALOGUE.find(row => row.id === id)
    assert.ok(row)
    assert.equal(row.address, address)
    assert.equal(destination(row), address + ', България')
    assert.notEqual(destination(row), `${row.coordinates.latitude},${row.coordinates.longitude}`)
    assert.equal(businessDirectionsUrl(row), railDirections(row))
  }
})

test('reviewed native directions use confirmed business pins without rewriting addresses or distance coordinates', () => {
  assert.equal(REVIEWED_NATIVE_BUSINESS_DESTINATIONS.length, 3)
  assert.equal(new Set(REVIEWED_NATIVE_BUSINESS_DESTINATIONS.map(row => row.id)).size, 3)
  for (const reviewed of REVIEWED_NATIVE_BUSINESS_DESTINATIONS) {
    assert.ok(Object.isFrozen(reviewed))
    assert.ok(Object.isFrozen(reviewed.addresses))
    assert.equal(new URL(reviewed.sourceUrl).protocol, 'https:')
    for (const address of reviewed.addresses) {
      const row = {
        id: reviewed.id, source: 'gorez', city: 'София', cityCode: '68134', address,
        coordinates: { latitude: 42.61, longitude: 23.11 },
        public_profile: { latitude: 42.62, longitude: 23.12 },
      }
      const before = JSON.stringify(row)
      const point = `${reviewed.latitude},${reviewed.longitude}`
      if (reviewed.mapsUrl) assert.equal(businessMapsDirectionsUrl(row), reviewed.mapsUrl)
      else assert.equal(destination(row), point)
      assert.equal(businessDirectionsAddress(row), address + ', България')
      assert.equal(businessDirectionsUrl(row), railDirections(row))
      assert.equal(JSON.stringify(row), before, 'directions must not correct a public DTO or stored distance pin')
    }
  }
  const kerelski = REVIEWED_NATIVE_BUSINESS_DESTINATIONS.find(row => row.id === 'f309d060-d96d-4237-8fa6-00db10b7ac3d')
  assert.deepEqual(kerelski.addresses, [
    'София, ж.к Манастирски ливади, ул. Пирин 81',
    'София, ж.к Манастирски ливади, ул. Пирин 83',
    'София, Манастирски ливади, ул. Пирин 83',
  ])
  assert.deepEqual([kerelski.latitude, kerelski.longitude], [42.66385031216646, 23.284281405717884])
  const aim = REVIEWED_NATIVE_BUSINESS_DESTINATIONS.find(row => row.id === '2ddceca9-1716-4ba2-bf63-2beaf0857afb')
  assert.deepEqual(aim.addresses, ['София, Дианабад, Ул.Русаля'])
  assert.deepEqual([aim.latitude, aim.longitude], [42.665669, 23.347636])
  const autocomplex = REVIEWED_NATIVE_BUSINESS_DESTINATIONS.find(row => row.id === '6b57b901-acd8-494b-a992-2cec551b4b00')
  assert.equal(autocomplex.mapsUrl, 'https://maps.app.goo.gl/uB57z7Nd9Nr5xTmw7')
  assert.equal(autocomplex.latitude, undefined, 'no provider point copied from the owner-selected map link')
})

test('native reviewed pins require exact source, business ID and address and cannot be supplied by callers', () => {
  for (const reviewed of REVIEWED_NATIVE_BUSINESS_DESTINATIONS) {
    const row = { id: reviewed.id, source: 'gorez', city: 'София', address: reviewed.addresses[0] }
    const point = `${reviewed.latitude},${reviewed.longitude}`
    for (const changed of [
      { ...row, id: '00000000-0000-4000-8000-000000000000' },
      { ...row, source: 'catalogue' },
      { ...row, source: undefined },
      { ...row, source: 'unknown' },
      { ...row, address: row.address + 'А' },
      { ...row, address: 'София, ул. Нов адрес 19' },
    ]) {
      assert.equal(reviewedBusinessDestination(changed), null)
      assert.notEqual(destination(changed), point)
      assert.equal(destination(changed), businessDirectionsAddress(changed))
    }
    const injected = {
      ...row, mapsUrl: 'https://evil.example', destination: 'Caller override',
      directionsUrl: 'https://evil.example', reviewedDestination: { latitude: 42.7, longitude: 23.3 },
      latitude: 42.7, longitude: 23.3, coordinates: { latitude: 42.7, longitude: 23.3 },
    }
    if (reviewed.mapsUrl) assert.equal(businessMapsDirectionsUrl(injected), reviewed.mapsUrl)
    else assert.equal(destination(injected), point)
    assert.equal(businessMapsDirectionsUrl({ ...row, locationKind: 'service_area' }), null)
  }
  assert.equal(Object.isFrozen(REVIEWED_NATIVE_BUSINESS_DESTINATIONS), true)
})

test('city and country are explicit, deduplicated, and never confused with boulevard Bulgaria', () => {
  assert.equal(businessDirectionsAddress({address:'ул. Пирин 83',cityCode:'68134'}), 'София, ул. Пирин 83, България')
  assert.equal(businessDirectionsAddress({address:'София, бул. България 73',city:'София'}), 'София, бул. България 73, България')
  assert.equal(businessDirectionsAddress({address:'Sofia, 73 Bulgaria Blvd',city:'София'}), 'Sofia, 73 Bulgaria Blvd, България')
  assert.equal(businessDirectionsAddress({address:'София, ул. Пирин 83, България',city:'София'}), 'София, ул. Пирин 83, България')
  assert.equal(businessDirectionsAddress({address:'Sofia, Pirin83, Bulgaria',cityCode:'68134'}), 'Sofia, Pirin83, Bulgaria')
  assert.equal(businessDirectionsAddress({address:'бл. 731Б',city:'София',neighborhood:'Люлин 7'}), 'София, Люлин 7, бл. 731Б, България')
  assert.equal(businessDirectionsAddress({address:'Пловдив, ул. Примерна 8',city:'Пловдив'}), 'Пловдив, ул. Примерна 8, България')
})

test('coordinate-only fallback rejects invalid points and service areas never route to a fabricated base', () => {
  for (const coordinates of [{latitude:0,longitude:0},{latitude:23.3,longitude:42.7},{latitude:null,longitude:null},{latitude:'42.7',longitude:'23.3'},{latitude:Infinity,longitude:23.3}]) {
    assert.equal(destination({coordinates}), null)
    assert.equal(businessMapUrl({public_profile:coordinates}), null)
  }
  assert.equal(destination({coordinates:{latitude:42.7,longitude:23.3}}), '42.7,23.3')
  assert.equal(destination({locationKind:'service_area',address:'София, служебен склад',coordinates:{latitude:42.7,longitude:23.3}}), null)
})

test('Google exact Place IDs remain exact and do not accept arbitrary supplied navigation URLs', () => {
  const url = new URL(businessMapsDirectionsUrl({source:'google',placeId:'ChIJ_fixture_12345',mapsUrl:'https://evil.example',address:'Wrong branch'}))
  assert.equal(url.searchParams.get('destination_place_id'), 'ChIJ_fixture_12345')
  assert.equal(url.searchParams.get('destination'), 'ChIJ_fixture_12345')
  assert.equal(businessMapsDirectionsUrl({source:'google',placeId:'../bad',address:'София'}), null)
})

test('every catalogue record routes to its postal address, exact reviewed owner destination, or no fabricated mobile base', () => {
  const before = JSON.stringify(SOFIA_CATALOGUE)
  let premises = 0, mobile = 0
  for (const row of SOFIA_CATALOGUE) {
    const href = railDirections(row)
    if (row.locationKind === 'service_area') { assert.equal(href, null, row.id); mobile++; continue }
    premises++
    assert.ok(href, row.id)
    const url = new URL(href), query = url.searchParams.get('destination')
    const reviewed = REVIEWED_BUSINESS_DESTINATIONS.find(value => value.id === row.id && value.address === row.address)
    if (reviewed?.mapsUrl) {
      assert.equal(href, reviewed.mapsUrl, row.id)
      assert.ok(['maps.app.goo.gl','g.page'].includes(url.hostname), row.id)
      assert.equal(url.search, '', row.id)
      continue
    }
    assert.equal(query, reviewed?.latitude ? `${reviewed.latitude},${reviewed.longitude}` : row.address + ', България', row.id)
    assert.equal(url.origin, 'https://www.google.com')
    assert.equal(url.pathname, '/maps/dir/')
    assert.equal(url.searchParams.get('api'), '1')
    assert.deepEqual([...url.searchParams.keys()].sort(), reviewed?.placeId ? ['api','destination','destination_place_id'] : ['api','destination'])
    if (reviewed?.placeId) assert.equal(url.searchParams.get('destination_place_id'), reviewed.placeId)
    assert.ok(href.length < 2048, row.id)
  }
  assert.equal(premises + mobile, SOFIA_CATALOGUE.length)
  assert.ok(premises > 800 && mobile > 100)
  assert.equal(JSON.stringify(SOFIA_CATALOGUE), before, 'navigation never rewrites verified source data')
})

test('reviewed landmark destinations are branch/address-bound and cannot override moved venues or partner profiles', () => {
  assert.equal(REVIEWED_BUSINESS_DESTINATIONS.length, 19)
  assert.equal(new Set(REVIEWED_BUSINESS_DESTINATIONS.map(row => row.id)).size, 19)
  for (const reviewed of REVIEWED_BUSINESS_DESTINATIONS) {
    const raw = SOFIA_CATALOGUE.find(row => row.id === reviewed.id)
    assert.equal(raw.address, reviewed.address, reviewed.id)
    assert.equal(new URL(reviewed.sourceUrl).protocol, 'https:')
    const moved = { ...raw, source:'catalogue', address:'София, ул. Пирин 83' }
    assert.equal(destination(moved), moved.address + ', България', reviewed.id)
    assert.equal(destination({ ...raw, source:'gorez' }), raw.address + ', България', reviewed.id)
    assert.equal(railDirections({ ...raw, source:'catalogue', locationKind:'service_area' }), null)
  }
  for (const [id, latitude, longitude] of [
    ['sofia-niko-09',42.6611919,23.390778],
    ['sofia-tennis-lyulin-6',42.707625017444485,23.256896419547754],
    ['sofia-autotest-gtp-4-kilometar',42.668101430658695,23.36885723387535],
    ['sofia-katerene-europe-private',42.6716059,23.3958986],
  ]) {
    const row = SOFIA_CATALOGUE.find(row => row.id === id)
    assert.deepEqual([row.coordinates.latitude,row.coordinates.longitude],[latitude,longitude])
    assert.equal(row.coordinates.method,'first_party_coordinates')
  }
  assert.equal(SOFIA_CATALOGUE.find(row=>row.id==='sofia-yorki-sofia').address,'София, бул. Инж. Иван Иванов 10, Арт-хотел Симона')
})

test('all published preview and fetched detail routes share the exact same current postal destination', async () => {
  const rows = normalizeCatalogueBusinesses(SOFIA_CATALOGUE,{browse:true,searchV2:true,requirements:[]},{now})
  const source = new Map(SOFIA_CATALOGUE.map(row=>[row.id,row]))
  const handler = createPublicBusinessDetailsHandler({
    config:{enabled:true},now:()=>now,allowAttempt:async()=>true,
    findCatalogue:async id=>source.get(id),readCataloguePhotos:async()=>[],
    readPartner:async()=>assert.fail('static catalogue audit never reads production partners'),
  })
  assert.equal(rows.length, SOFIA_CATALOGUE.filter(row=>approvedCatalogueRecord(row,now)).length)
  for (const row of rows) {
    const response = await handler(new Request('https://www.gorez.co/api/public/discovery/business/'+row.id),row.id)
    assert.equal(response.status,200,row.id)
    const {business:full}=await response.json()
    assert.equal(full.address,row.address,row.id)
    assert.equal(full.locationKind,row.locationKind,row.id)
    assert.deepEqual(full.coordinates,row.coordinates,row.id)
    assert.equal(railDirections({...compactDiscoveryRow(row),...full}),railDirections(row),row.id)
  }
})

test('fresh partner detail location clears a stale preview pin and keeps other public fields private', async () => {
  const id='10000000-0000-4000-8000-000000000001'
  const handler=createPublicBusinessDetailsHandler({
    config:{enabled:true},allowAttempt:async()=>true,
    readPartner:async()=>({id,name:'Updated partner',active:true,platform_status:'enabled',address:'ул. Нов адрес 19',city:'София',city_ekatte:'68134',public_profile:{latitude:null,longitude:null},services:[{name:'Маникюр',active:true}],owner_user_id:'private-owner',customers:[{email:'private-customer'}]}),
  })
  const response=await handler(new Request('https://www.gorez.co/api/public/discovery/business/'+id),id)
  const {business}=await response.json()
  assert.equal(response.status,200)
  assert.equal(business.coordinates,null)
  assert.equal(business.cityCode,'68134')
  assert.equal(destination({...business,coordinates:{latitude:42.61,longitude:23.21}}),'София, ул. Нов адрес 19, България')
  assert.doesNotMatch(JSON.stringify(business),/private-owner|private-customer|owner_user_id|customers/)
})
