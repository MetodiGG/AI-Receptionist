import test from 'node:test'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'
import { readFile } from 'node:fs/promises'
import { DISCOVERY_CATEGORIES } from '../lib/discovery/categories.mjs'
import { discoveryCategorySelection, discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { rankCatalogueBusinesses, normalizeCatalogueBusinesses, LOCAL_PARTNER_PRIORITY_KM } from '../lib/discovery/catalogue-search.mjs'
import { matchingServices, normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { discoveryDistanceOrigin } from '../lib/discovery/distance-origin.mjs'

const now = DateTime.fromISO('2026-11-06T12:00:00Z')
const forbidden = () => assert.fail('No paid provider or live booking is allowed')
const deps = patch => ({ config: discoveryConfig({ DISCOVERY_ENABLED:'true' }), now,
  readInternal:async()=>[],readCatalogue:async()=>SOFIA_CATALOGUE,fetcher:forbidden,claimBudget:forbidden,getBusiness:forbidden,getSlots:forbidden,...patch })
const origin = { latitude:42.67,longitude:23.29 }
const makeRow = (id, source, northKm, extra = {}) => ({id,name:id,source,coordinates:{latitude:origin.latitude+northKm/111.195,longitude:origin.longitude},...extra})
const intent = { coordinates:origin,radiusKm:5,primaryRadiusKm:2 }

test('each explicit category choice browses real matching records in BG and EN, including Other', async () => {
  for (const locale of ['bg','en']) for (const category of DISCOVERY_CATEGORIES) {
    const selected = discoveryCategorySelection('previous query',category.id,locale)
    assert.equal(selected.query,category[locale], 'visible text stays filled')
    const input = discoverySearchInput({...selected,locale,cityCode:'68134',categoryBrowse:true})
    assert.equal(input.browse,true); assert.equal(input.query,'')
    assert.equal('categoryBrowse' in input,false,'UI-only control must not become an unvalidated API option')
    const result = await discoverBusinesses(input,deps())
    assert.equal(result.clarification,null); assert.equal(result.externalStatus,'catalogue')
    assert.ok(result.cataloguePage.total>0,`${locale}: ${category.id} must not be silently empty`)
    assert.ok(result.results.every(row=>row.services.length),category.id)
    if (category.id==='other') assert.ok(result.results.every(row=>row.businessCategory==='other'))
    if (category.id==='beauty') assert.ok(result.results.every(row=>row.businessCategory!=='barber'))
  }
})

test('a specific written service is not broadened into a generic category browse', () => {
  for(const query of ['педикюр утре','маникюр до 20 евро','оформяне на вежди','бокс за начинаещи']) {
    const input=discoverySearchInput({query,category:query.includes('бокс')?'fitness':'nails',categoryBrowse:true})
    assert.equal(input.query,query); assert.equal(input.browse,undefined)
  }
  assert.equal(discoverySearchInput({query:'Друга услуга',category:'other'}).browse,undefined,'ordinary API callers do not silently change modes')
})

test('singular and plural English lesson searches both match the corresponding published Bulgarian service', async () => {
  for (const query of ['guitar lesson', 'guitar lessons', 'piano lesson', 'piano lessons']) {
    const result = await discoverBusinesses({query,cityCode:'68134',locale:'en'},deps())
    assert.equal(result.intent.category,'education'); assert.ok(result.results.length>0,query)
    assert.ok(result.results.some(row=>row.id==='sofia-po-noti'),query)
    assert.ok(result.results.every(row=>row.services.some(service=>query.startsWith('guitar')?/китар/iu.test(service.name):/пиано/iu.test(service.name))),query)
  }
})

test('barbershops do not masquerade as beauty studios through an ancillary eyebrow service', () => {
  const services=[{id:'hair',name:'Мъжко подстригване',category:'barber',active:true},{id:'brow',name:'Оформяне на вежди',category:'beauty',active:true}]
  const barber={id:'p',slug:'p',name:'Local Barbershop',industry:'beauty',active:true,platform_status:'enabled',city_ekatte:'68134',services,public_profile:{latitude:origin.latitude,longitude:origin.longitude}}
  const beauty={category:'beauty',service:'красота',browse:true,searchV2:true,cityCode:'68134',requirements:[]}
  assert.deepEqual(matchingServices(barber,beauty),[])
  assert.deepEqual(normalizeInternalBusinesses([barber],beauty),[])
  const raw={...SOFIA_CATALOGUE.find(row=>row.category==='barber'),services:services.map(({name,category})=>({name,category,appointmentModel:'appointment'}))}
  assert.deepEqual(normalizeCatalogueBusinesses([raw],beauty,{now:now.toMillis()}),[])
  assert.ok(normalizeCatalogueBusinesses([raw],{...beauty,category:'barber',service:'бръснар'},{now:now.toMillis()}).length)
  assert.ok(matchingServices(barber,{...beauty,browse:false,service:'оформяне на вежди'}).length,'a specific real service is not hidden by generic business browsing')
  assert.ok(matchingServices({...barber,name:'Beauty Studio',services:[services[1]]},beauty).length,'real beauty studios remain eligible')
})

test('a relevant partner within one kilometre precedes a slightly nearer non-partner', () => {
  assert.equal(LOCAL_PARTNER_PRIORITY_KM,1)
  const rows=rankCatalogueBusinesses([makeRow('local-partner','gorez',.85)], [makeRow('nearest','catalogue',.05),makeRow('next','catalogue',.3)],intent)
  assert.deepEqual(rows.map(row=>row.id),['local-partner','nearest','next'])
  assert.ok(rows[0].distanceKm>rows[1].distanceKm,'actual displayed distances must not be manipulated')
})

test('the priority cutoff uses unrounded distance, never promotes unknown/farther points or exceeds an explicit radius', () => {
  const rows=rankCatalogueBusinesses([makeRow('inside','gorez',.999),makeRow('outside','gorez',1.001),{id:'unknown',name:'unknown',source:'gorez',coordinates:null}], [makeRow('closest','catalogue',.02)],intent)
  assert.deepEqual(rows.map(row=>row.id),['inside','closest','outside','unknown'])
  const strict=rankCatalogueBusinesses([makeRow('beyond-request','gorez',.8)],[makeRow('close','catalogue',.1)],{...intent,radiusKm:.5,primaryRadiusKm:.5})
  assert.equal(strict[0].id,'close','ranking alone cannot grant priority outside the requested band')
})

test('multiple local partners keep their distance order and city-centre browsing does not pretend to know visitor convenience', () => {
  const partners=[makeRow('b','gorez',.8),makeRow('a','gorez',.2)]
  assert.deepEqual(rankCatalogueBusinesses(partners,[makeRow('n','catalogue',.01)],intent).map(row=>row.id),['a','b','n'])
  const centre=discoveryDistanceOrigin({cityCode:'68134'})
  const point=(id,source,delta)=>({id,name:id,source,coordinates:{latitude:centre.latitude+delta,longitude:centre.longitude}})
  assert.deepEqual(rankCatalogueBusinesses([point('partner','gorez',.005)],[point('closer','catalogue',.001)],{cityCode:'68134'}).map(row=>row.id),['closer','partner'])
})

test('local partner convenience never bypasses category, named neighbourhood, actual radius or occupied slots', async () => {
  const partner={id:'p',slug:'p',name:'Nearby Nails',city_ekatte:'68134',neighborhood:'Борово',industry:'beauty',public_profile:{latitude:origin.latitude,longitude:origin.longitude},services:[{id:'s',name:'Маникюр',active:true,price:20,duration_min:45,currency:'EUR'}]}
  const input={query:'маникюр',coordinates:{...origin,consent:true}}
  const result=await discoverBusinesses(input,deps({readInternal:async()=>[partner,{...partner,id:'far',slug:'far',public_profile:{latitude:42.8,longitude:23.4}}]}))
  assert.equal(result.results[0].id,'p'); assert.equal(result.results.some(row=>row.id==='far'),false)
  const wrong=await discoverBusinesses({...input,query:'автосервиз'},deps({readInternal:async()=>[partner]}))
  assert.equal(wrong.results.some(row=>row.id==='p'),false)
  const quarter=await discoverBusinesses({query:'маникюр',cityCode:'68134',neighborhood:'Връбница'},deps({readInternal:async()=>[partner]}))
  assert.equal(quarter.results.some(row=>row.id==='p'),false)
  const occupied=await discoverBusinesses({...input,query:'маникюр утре'},deps({readInternal:async()=>[partner],getBusiness:async()=>({services:partner.services,timezone:'Europe/Sofia'}),getSlots:async()=>[]}))
  assert.equal(occupied.results.some(row=>row.id==='p'),false)
})

test('the home category control executes Other as well as all other selections', async () => {
  const source=await readFile(new URL('../components/discovery-search.js',import.meta.url),'utf8')
  assert.match(source,/categoryBrowse: home/)
  assert.doesNotMatch(source,/selected\.category && !\(home && selected\.category === 'other'\)/)
})
