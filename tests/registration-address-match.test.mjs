import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { registrationAddressQuery, matchRegistrationAddress } from '../lib/registration-address-match.mjs'

const business = patch => ({id:'offline-only-business',city_ekatte:'68134',city:'София',neighborhood:'Манастирски ливади',address:'Пирин 42',...patch})
const candidate = patch => ({osm_type:'node',osm_id:123456,lat:'42.6650291',lon:'23.2825296',boundingbox:['42.6649291','42.6651291','23.2824296','23.2826296'],class:'amenity',type:'beauty',addresstype:'amenity',place_rank:30,
  address:{country_code:'bg',city:'София',road:'ул. Пирин',house_number:'42',suburb:'Манастирски ливади'},...patch})
const addressCandidate = address => candidate({address:{...candidate().address,...address}})
const expected = {latitude:42.6650291,longitude:23.2825296,source_url:'https://www.openstreetmap.org/node/123456',licence:'ODbL-1.0',attribution:'© OpenStreetMap contributors'}

test('query builder supports plain, adjacent-number, quoted, prefixed and full legacy street addresses', () => {
  for(const address of ['Пирин42','Пирин 42','ул.Пирин42','ул. Пирин 42','улица „Пирин“ № 42','София, Манастирски ливади, ул. Пирин 42','гр. София, кв. Манастирски ливади, Пирин42','гр.София кв.Манастирски ливади ул.Пирин42']) {
    assert.deepEqual(registrationAddressQuery(business({address})),{street:'Пирин',house:'42',city:'София',query:'Пирин 42, Манастирски ливади, София, България'},address)
  }
  assert.deepEqual(registrationAddressQuery(business({address:'София, Манастирски ливади, Пирин42',neighborhood:''})),{street:'Пирин',house:'42',city:'София',query:'Пирин 42, Манастирски ливади, София, България'})
  assert.equal(registrationAddressQuery(business({address:'бул. България 102'})).street,'България')
  assert.equal(registrationAddressQuery(business({address:'6-ти септември 12'})).street,'6-ти септември')
  assert.equal(registrationAddressQuery(business({address:'Ултро 42'})).street,'Ултро','do not confuse a street name starting ул with a prefix')
  assert.equal(registrationAddressQuery(business({address:'Пирин 42 А'})).house,'42А')
})

test('only public address fields enter the query, with no business identity or contact fields', () => {
  const input=business({name:'Private owner name',email:'private@example.com',phone:'+359888123456',id:'private-business-id',address:'Пирин 42, офис 2'})
  const query=registrationAddressQuery(input)
  assert.equal(query.query,'Пирин 42, Манастирски ливади, София, България')
  assert.deepEqual(Object.keys(query).sort(),['city','house','query','street'])
  assert.doesNotMatch(JSON.stringify(query),/Private|private|example|359|офис/u)
})

test('unknown, ambiguous, block-only, incomplete and private/confidential addresses never produce a provider query', () => {
  for(const address of ['',null,42,'Пирин','42','№42','No.42','ул. Пирин','ж.к. Младост 1, бл. 42','бл. 42','блок42','Квартал Борово 42','София 1000','Пирин 42-44','Пирин 42–44','Пирин 42/1','Пирин 42.5','Пирин 0','Пирин 42, тел. 0888123456','Пирин 42, owner@example.com','Пирин 42 +359 888 123 456','Пирин 42, ап. 3','Пирин 42, apartment 3','P.O. Box 42','пощенска кутия 42','Пирин 42, ЕГН 1234567890','Пирин 42\nconfidential note','<script>42</script>','Пирин 42, https://example.com/']) {
    assert.equal(registrationAddressQuery(business({address})),null,String(address))
  }
  for(const patch of [{city_ekatte:'00000'},{city:'Варна'},{neighborhood:'owner@example.com'},{neighborhood:'+359888123456'},{address:'Варна, ул. Пирин 42'},{address:'София, Борово, ул. Пирин 42'}])assert.equal(registrationAddressQuery(business(patch)),null,JSON.stringify(patch))
})

test('exact building/POI match returns only numeric coordinates and recorded OSM source/licence', () => {
  assert.deepEqual(matchRegistrationAddress(business(),[candidate()]),expected)
  assert.deepEqual(matchRegistrationAddress(business(),[candidate({osm_type:'way',osm_id:'987654',class:'building',type:'yes',addresstype:'building'})]),{...expected,source_url:'https://www.openstreetmap.org/way/987654'})
  assert.deepEqual(matchRegistrationAddress(business(),[candidate({osm_type:'relation',osm_id:'987654',category:'building',class:undefined,type:'commercial',addresstype:'building',place_rank:28})]),{...expected,source_url:'https://www.openstreetmap.org/relation/987654'})
})

test('exact city/street/house matching accepts official BG and Latin forms, prefixes, titles and A suffix only', () => {
  for(const city of ['София','Sofia','Sofiya','гр. София'])assert.deepEqual(matchRegistrationAddress(business(),[addressCandidate({city,road:'Pirin',suburb:'Manastirski livadi'})]),expected)
  assert.deepEqual(matchRegistrationAddress(business({address:'ул. Проф. Стоян Киркович 42'}),[addressCandidate({road:'улица Професор Стоян Киркович'})]),expected)
  assert.deepEqual(matchRegistrationAddress(business({address:'Пирин 42а'}),[addressCandidate({house_number:'42A'})]),expected)
  for(const [requested,received] of [['42Б','42B'],['42В','42B'],['42','42A'],['42','042'],['42','42-44']])assert.equal(matchRegistrationAddress(business({address:`Пирин ${requested}`}),[addressCandidate({house_number:received})]),null,`${requested} / ${received}`)
})

test('matcher works for other Bulgarian cities without a Sofia coordinate box', () => {
  const varna=business({city_ekatte:'10135',city:'Варна',neighborhood:'Бриз',address:'Цар Борис III 12'})
  const hit=candidate({lat:'43.211375',lon:'27.91108',boundingbox:['43.211275','43.211475','27.91098','27.91118'],address:{country_code:'bg',city:'Varna',road:'Tsar Boris III',house_number:'12',suburb:'Бриз'}})
  assert.deepEqual(registrationAddressQuery(varna),{street:'Цар Борис III',house:'12',city:'Варна',query:'Цар Борис III 12, Бриз, Варна, България'})
  assert.deepEqual(matchRegistrationAddress(varna,[hit]),{...expected,latitude:43.211375,longitude:27.91108})
  const byala=business({city_ekatte:'07598',city:'Бяла',neighborhood:'',address:'Черноморска 12'})
  const byalaHit={...hit,address:{country_code:'bg',town:'Byala',state:'Област Варна',road:'Черноморска',house_number:'12'}}
  assert.ok(matchRegistrationAddress(byala,[byalaHit]))
  assert.equal(matchRegistrationAddress(byala,[{...byalaHit,address:{...byalaHit.address,state:'Област Русе'}}]),null,'same-name towns require the matching region')
  assert.equal(matchRegistrationAddress(byala,[{...byalaHit,address:{...byalaHit.address,state:undefined}}]),null,'a duplicate city name alone is insufficient')
})

test('different country, city, street, house and reliable quarter contradictions are not exact matches', () => {
  for(const address of [{country_code:'ro'},{country_code:'BG'},{city:'Варна'},{city:undefined},{road:'Родопски извор'},{road:undefined},{house_number:'44'},{house_number:undefined},{suburb:'Борово'},{quarter:'Лозенец'}])assert.equal(matchRegistrationAddress(business(),[addressCandidate(address)]),null,JSON.stringify(address))
  assert.deepEqual(matchRegistrationAddress(business(),[addressCandidate({city_district:'Красно село'})]),expected,'administrative district is not a neighbourhood contradiction')
  assert.deepEqual(matchRegistrationAddress(business(),[addressCandidate({suburb:'Неизвестен микрорайон'})]),expected,'a finer unrecognized subdivision does not silently contradict the selected neighbourhood')
})

test('generic street/city results, interpolation, low precision and malformed identities fail closed', () => {
  for(const patch of [
    {class:'highway',type:'residential',addresstype:'road'},{class:'place',type:'city',addresstype:'city'},
    {type:'interpolation'},{type:'houses'},{osm_type:'way',class:'place',type:'house',addresstype:'house'},
    {extratags:{'addr:interpolation':'all'}},{place_rank:26},{place_rank:'3e1'},{place_rank:''},{place_rank:31},{rank_address:27},
    {osm_type:'../../evil'},{osm_id:'12/evil'},{osm_id:0},{osm_id:1.2},{osm_id:9007199254740992},
    {class:undefined,type:undefined,addresstype:undefined},
  ])assert.equal(matchRegistrationAddress(business(),[candidate(patch)]),null,JSON.stringify(patch))
})

test('coordinate pairs and compact point-containing bounding boxes reject partial or malformed data', () => {
  for(const patch of [
    {lat:undefined},{lon:null},{lat:''},{lon:false},{lat:'NaN'},{lon:'Infinity'},{lat:'4.2665e1'},{lat:Infinity},
    {lat:'40.99'},{lat:'44.51'},{lon:'21.99'},{lon:'29.01'},
    {boundingbox:undefined},{boundingbox:[]},{boundingbox:['42','43','23','24']},
    {boundingbox:['42.6652','42.6651','23.2824','23.2826']},
    {boundingbox:['42.6650','42.6651',null,'23.2826']},
    {boundingbox:['42.65','42.6501','23.28','23.2801']},
  ])assert.equal(matchRegistrationAddress(business(),[candidate(patch)]),null,JSON.stringify(patch))
})

test('conflicting exact-address candidates require review rather than the top result', () => {
  const far=candidate({osm_id:234567,lat:'42.6750291',lon:'23.2925296',boundingbox:['42.6749291','42.6751291','23.2924296','23.2926296']})
  assert.equal(matchRegistrationAddress(business(),[candidate(),far]),null)
  assert.equal(matchRegistrationAddress(business(),[far,candidate()]),null)
  const entrance=candidate({osm_id:345678,lat:'42.6650491',lon:'23.2825496'})
  assert.deepEqual(matchRegistrationAddress(business(),[candidate(),entrance]),expected)
  assert.deepEqual(matchRegistrationAddress(business(),[addressCandidate({house_number:'44'}),candidate()]),expected)
  for(const candidates of [undefined,null,{},[],Array(21).fill(candidate())])assert.equal(matchRegistrationAddress(business(),candidates),null)
})

test('module is provider-neutral local code with no network, storage or offline-geocoder import', async () => {
  const source=await readFile(new URL('../lib/registration-address-match.mjs',import.meta.url),'utf8')
  assert.doesNotMatch(source,/fetch\(|https:\/\/nominatim|supabase|localStorage|catalogue-geocoding/u)
})
