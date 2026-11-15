import test from 'node:test'
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { CATEGORY_IDS } from '../lib/discovery/categories.mjs'
import { DISCOVERY_SUBCATEGORIES, SUBCATEGORY_IDS, subcategoriesForCategory, subcategoryById, matchesSubcategory, businessSubcategoryIds, subcategoryOptionsForBusinesses } from '../lib/discovery/subcategories.mjs'
import { SPECIFIC_SERVICE_PHOTO_IDS } from '../lib/specific-service-photo-ids.mjs'
import { APPROVED_SERVICE_PHOTO_IDS } from '../lib/service-photos.mjs'
import { REVIEWED_PARTNER_SERVICE_PHOTOS } from '../lib/partner-service-photos.mjs'
import { GENERATED_CATALOGUE_SERVICE_PHOTO_IDS } from '../lib/service-photos-catalogue-expansion.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { discoverySearchInput, subcategorySelection } from '../lib/discovery/search-ui.mjs'
import { applyHomeFilters } from '../lib/discovery/home.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { compactDiscoveryResponse } from '../lib/discovery/preview.mjs'
import { mergeCataloguePage } from '../lib/discovery/catalogue-pagination.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'

const now=DateTime.fromISO('2026-11-15T12:00:00Z')
const noProvider=()=>assert.fail('Subcategories must not call Google, models, booking endpoints or metered providers')
const approvedPhotoIds=new Set([...SPECIFIC_SERVICE_PHOTO_IDS,...APPROVED_SERVICE_PHOTO_IDS,...GENERATED_CATALOGUE_SERVICE_PHOTO_IDS,...REVIEWED_PARTNER_SERVICE_PHOTOS.filter(item=>item.source==='illustrative').map(item=>item.photoId)])
const deps=patch=>({config:discoveryConfig({DISCOVERY_ENABLED:'true'}),now,readCatalogue:async()=>SOFIA_CATALOGUE,readInternal:async()=>[],
  claimBudget:noProvider,fetcher:noProvider,authorizeGoogle:noProvider,getBusiness:noProvider,getSlots:noProvider,...patch})
const browse=patch=>discoveryRequestSchema.parse({query:'',browse:true,category:'fitness',cityCode:'68134',...patch})
const folk={id:'folk',name:'Групово занимание по народни танци',category:'fitness',active:true,price:12,currency:'EUR',duration_min:60,illustrativePhotoKey:'sx-bulgarian-folk-group'}
const yoga={id:'yoga',name:'Групова йога практика',category:'fitness',active:true,price:14,currency:'EUR',duration_min:60}
const partner=patch=>({id:'10000000-0000-4000-8000-000000000001',name:'Public dance studio',slug:'public-dance-studio',industry:'fitness',active:true,platform_status:'enabled',
  city_ekatte:'68134',city:'София',neighborhood:'Борово',address:'Тестова улица 2',public_profile:{latitude:42.67,longitude:23.29},services:[folk,yoga],...patch})

test('every existing public category has stable bilingual photographic subcategories, using only approved local artwork',async()=>{
  assert.equal(DISCOVERY_SUBCATEGORIES.length,104)
  assert.equal(new Set(SUBCATEGORY_IDS).size,SUBCATEGORY_IDS.length)
  assert.deepEqual([...new Set(DISCOVERY_SUBCATEGORIES.map(item=>item.category))].sort(),[...CATEGORY_IDS].sort())
  for(const category of CATEGORY_IDS)for(const locale of ['bg','en']){
    const items=subcategoriesForCategory(category,locale)
    assert.ok(items.length>=5,category)
    for(const item of items){
      assert.equal(item.category,category);assert.equal(item.label,item[locale]);assert.ok(item.bg&&item.en)
      assert.match(item.id,/^[a-z][a-z_-]*-[a-z0-9-]+$/)
      assert.match(item.photo,/^\/service-photos\/[a-z0-9-]+-v1\.webp$/)
      const id=item.photo.slice('/service-photos/'.length,-'-v1.webp'.length)
      assert.ok(approvedPhotoIds.has(id),id)
      await access(new URL('../public'+item.photo,import.meta.url))
      assert.equal(item.pattern,undefined,'do not serialize matching rules')
    }
  }
  for(const id of ['__proto__','constructor','fitness-not-real'])assert.equal(subcategoryById(id),undefined)
})
test('membership uses actual services and exact parent scope, not another sport or an unrelated word fragment',()=>{
  for(const name of ['Народни танци','Групови народни танци','Bulgarian folk dance lesson'])assert.ok(matchesSubcategory({name,category:'fitness'},'fitness-folk-dance'))
  for(const name of ['Йога','Тренировка по бокс','Салса и бачата','Програмиране'])assert.equal(matchesSubcategory({name,category:'fitness'},'fitness-folk-dance'),false,name)
  assert.equal(matchesSubcategory({name:'Пилатес на реформър',category:'beauty'},'fitness-pilates'),false)
  assert.ok(matchesSubcategory({name:'Пилатес на реформър',category:'Спорт'},'fitness-pilates'),'free-text native categories retain actual service evidence')
  for(const [category,id,name] of [
    ['other','other-speech-therapy','Изготвяне на договор'],['other','other-speech-therapy','Писмен отговор'],['other','other-speech-therapy','Договорни отношения'],
    ['home_services','home_services-plumbing','Повикване на електротехник'],['home_services','home_services-plumbing','Извикване на техник'],
    ['other','other-photography','Фотоепилация'],['other','other-photography','Фототерапия'],['other','other-photography','Photo epilation'],
    ['education','education-art','Smart start programme'],['other','other-tattoo-piercing','Проверка на статуса'],
    ['consulting','consulting-architecture','Консултация за бизнес проект'],
  ])assert.equal(matchesSubcategory({name,category},id),false,name)
  for(const [category,id,name] of [
    ['other','other-speech-therapy','Терапия на говора'],['home_services','home_services-plumbing','ВиК услуги'],
    ['other','other-photography','Портретна фотография'],['education','education-art','Art lesson'],
  ])assert.ok(matchesSubcategory({name,category},id),name)
  assert.equal(matchesSubcategory({name:'Народни танци',active:false},'fitness-folk-dance'),false)
  assert.deepEqual(businessSubcategoryIds({name:'Boxing gym',services:[folk]},'fitness'),['fitness-folk-dance'])
})
test('generic consultation membership needs explicit relevant professional context and an actual service',()=>{
  assert.ok(matchesSubcategory({name:'Първичен преглед',category:'other'},'other-dental',{name:'Дентален кабинет'}))
  assert.equal(matchesSubcategory({name:'Първичен преглед',category:'other'},'other-dental',{name:'Beauty centre'}),false)
  assert.deepEqual(businessSubcategoryIds({name:'Психолог',services:[]},'other'),[])
})
test('ambiguous names in uncategorised native menus do not cross pet, human, vehicle and home domains',()=>{
  for(const [name,id,business] of [
    ['Почистване на лице','home_services-cleaning',{businessCategory:'beauty'}],
    ['Ремонт на нокът','home_services-renovation',{businessCategory:'nails'}],
    ['Подстригване на куче','hair-cut',{industry:'pets'}],
    ['Подстригване на куче','barber-haircut',{}],
    ['Почистване на уши на куче','beauty-face',{industry:'pets'}],
    ['Боядисване на стена','hair-colour',{industry:'home_services'}],
    ['Боядисване на детайл','hair-colour',{industry:'auto'}],
    ['Боядисване на коса','auto_repair-body-paint',{industry:'beauty'}],
    ['Индивидуална тренировка на куче','fitness-personal-training',{industry:'pets'}],
    ['Консултация за юридическо лице','beauty-face',{industry:'consulting'}],
  ])assert.equal(matchesSubcategory({name,category:'Custom owner label'},id,business),false,name)
  assert.ok(matchesSubcategory({name:'Пилатес на реформър',category:'Custom owner label'},'fitness-pilates',{industry:'beauty',businessCategory:'beauty'}),'a real cross-category service remains discoverable')
  assert.ok(matchesSubcategory({name:'Дамско подстригване на коса',category:'hair'},'hair-cut',{industry:'auto'}),'an explicit actual service category can cross the business industry')
  assert.ok(matchesSubcategory({name:'Удължаване на коса с екстеншъни',category:'hair'},'hair-extensions',{industry:'beauty'}),'the word extension does not contain a wall-work domain cue')
  assert.ok(matchesSubcategory({name:'Почистване на апартамент',category:'Custom owner label'},'home_services-cleaning',{industry:'home_services'}))
})
test('parent and child request IDs are validated together and unsafe unknown IDs fail closed',()=>{
  assert.equal(browse({subcategory:'fitness-folk-dance'}).subcategory,'fitness-folk-dance')
  for(const patch of [{category:'beauty',subcategory:'fitness-folk-dance'},{category:undefined,subcategory:'fitness-folk-dance'},{subcategory:'__proto__'},{subcategory:'<script>'}]){
    assert.equal(discoveryRequestSchema.safeParse({query:'',browse:true,cityCode:'68134',...patch}).success,false)
  }
  const intent=parseIntent(browse({subcategory:'fitness-folk-dance'}),now,{v2:true})
  assert.equal(intent.subcategory,'fitness-folk-dance');assert.equal(intent.category,'fitness');assert.equal(intent.date,null)
})
test('subcategory selection preserves location privacy and uses a parent browse instead of fuzzy free-text widening',()=>{
  for(const locale of ['bg','en']){
    const selected=subcategorySelection('old text','fitness','fitness-folk-dance',locale)
    const request=discoverySearchInput({...selected,locale,categoryBrowse:true,cityCode:'68134',neighborhood:'Борово',cityWasChosen:true})
    assert.equal(request.query,'');assert.equal(request.browse,true);assert.equal(request.subcategory,'fitness-folk-dance')
    assert.equal(request.cityCode,'68134');assert.equal(request.neighborhood,'Борово')
  }
  const coordinates={latitude:42.67,longitude:23.29,consent:true}
  const request=discoverySearchInput({...subcategorySelection('','fitness','fitness-yoga'),categoryBrowse:true,coordinates,expandNearby:true})
  assert.deepEqual(request.coordinates,coordinates);assert.equal(request.cityCode,undefined);assert.equal(request.neighborhood,undefined)
  const current={query:'Спорт',category:'fitness',subcategory:'fitness-yoga',cityCode:'68134',cityWasChosen:true}
  assert.equal(applyHomeFilters(current,{cityCode:'68134',category:'fitness',radiusKm:2}).subcategory,'fitness-yoga')
  assert.equal(applyHomeFilters(current,{cityCode:'68134',category:'nails',radiusKm:2}).subcategory,'')
  assert.equal(applyHomeFilters(current,{cityCode:'68134',category:'fitness',radiusKm:2,reset:true}).subcategory,'')
})
test('facet counts cover all eligible parent results before pagination and ignore the current child filter',async()=>{
  const common=deps({config:{...deps().config,maxResults:1}})
  const result=await discoverBusinesses(browse({subcategory:'fitness-folk-dance'}),common)
  assert.equal(result.results.length,1);assert.ok(result.cataloguePage.total>1)
  assert.ok(result.results.every(row=>row.services.every(service=>matchesSubcategory(service,'fitness-folk-dance',row))))
  const options=new Map(result.subcategoryOptions.map(item=>[item.id,item]))
  assert.ok(options.get('fitness-folk-dance').count>result.results.length)
  assert.ok(options.get('fitness-yoga').count>0);assert.ok(options.get('fitness-boxing').count>0)
  assert.ok(result.subcategoryOptions.every(item=>item.count>0&&item.category==='fitness'))
  const next=await discoverBusinesses(browse({subcategory:'fitness-folk-dance',catalogueOffset:result.cataloguePage.nextOffset}),common)
  assert.deepEqual(next.subcategoryOptions,result.subcategoryOptions)
  const combined=mergeCataloguePage(result,next)
  assert.equal(new Set(combined.results.map(row=>row.source+':'+row.id)).size,combined.results.length)
  const different=await discoverBusinesses(browse({subcategory:'fitness-yoga',catalogueOffset:result.cataloguePage.nextOffset}),common)
  assert.throws(()=>mergeCataloguePage(result,different),/INVALID_CATALOGUE_PAGE/)
  const publicReply=compactDiscoveryResponse(result)
  assert.deepEqual(publicReply.subcategoryOptions,result.subcategoryOptions)
  assert.equal(publicReply.results[0].publicServiceNames,undefined)
  assert.equal(typeof publicReply.results[0].illustrativeCoverPhotoKey,'string')
})
test('city, quarter, radius and publication guards also bound facets; counts are not slots',async()=>{
  const rows=[partner(),partner({id:'disabled',platform_status:'pending'}),partner({id:'other-city',city_ekatte:'56784'}),partner({id:'other-quarter',neighborhood:'Младост'})]
  const result=await discoverBusinesses(browse({neighborhood:'Борово',subcategory:'fitness-folk-dance'}),deps({readCatalogue:async()=>[],readInternal:async()=>rows}))
  assert.equal(result.results.length,1);assert.equal(result.subcategoryOptions.find(item=>item.id==='fitness-folk-dance').count,1)
  assert.equal(result.results[0].availability.status,'unknown');assert.deepEqual(result.results[0].availability.slots,[])
  const none=await discoverBusinesses(browse({cityCode:'56784',subcategory:'fitness-folk-dance'}),deps({readInternal:async()=>[]}))
  assert.deepEqual(none.subcategoryOptions,[])
  const near=await discoverBusinesses(browse({cityCode:undefined,coordinates:{latitude:42.67,longitude:23.29,consent:true},radiusKm:1,subcategory:'fitness-folk-dance'}),deps())
  assert.ok(near.results.every(row=>row.coordinates&&row.distanceKm<=1))
  const all=await discoverBusinesses(browse(),deps())
  const parentCounts=new Map(all.subcategoryOptions.map(item=>[item.id,item.count]))
  assert.ok(near.subcategoryOptions.every(item=>item.count<=parentCounts.get(item.id)))
  assert.deepEqual(subcategoryOptionsForBusinesses([{services:[yoga]}],null),[])
})
test('native hydration retains only the selected actual service and excludes a removed child service',async()=>{
  const common=deps({readCatalogue:async()=>[],readInternal:async()=>[partner()]})
  const result=await discoverBusinesses(browse({subcategory:'fitness-folk-dance'}),{...common,hydrateInternalCandidates:async()=>[partner()]})
  assert.deepEqual(result.results[0].services.map(service=>service.id),['folk'])
  assert.equal(result.results[0].subcategory,'fitness-folk-dance')
  assert.equal(result.results[0].illustrativeCoverPhotoKey,'sx-bulgarian-folk-group','cover comes from complete stable inventory')
  const changed=await discoverBusinesses(browse({subcategory:'fitness-folk-dance'}),{...common,hydrateInternalCandidates:async()=>[partner({services:[yoga]})]})
  assert.deepEqual(changed.results,[])
})
test('date availability uses the existing server only for the selected child service and rechecks revoked child context',async()=>{
  const ids=[]
  const input=discoveryRequestSchema.parse({query:'Народни танци утре',category:'fitness',subcategory:'fitness-folk-dance',cityCode:'68134'})
  const common=deps({readCatalogue:async()=>[],readInternal:async()=>[partner()],hydrateInternalCandidates:async()=>[partner()],
    getBusiness:async()=>({...partner(),timezone:'Europe/Sofia'}),getSlots:async args=>{ids.push(args.serviceId);return[]}})
  const result=await discoverBusinesses(input,common)
  assert.deepEqual(ids,['folk']);assert.equal(result.results[0].availability.status,'none')
  const changed=await discoverBusinesses(input,{...common,getBusiness:async()=>({...partner({services:[yoga]}),timezone:'Europe/Sofia'})})
  assert.deepEqual(changed.results,[])
})
test('the HTTP boundary rejects a mismatched child before any catalogue read and exposes no metered provider',async()=>{
  let reads=0
  const handler=createDiscoveryHandler({...deps({readCatalogue:async()=>{reads++;return[]}}),allowAttempt:async()=>true})
  const request=body=>new Request('https://gorez.co/api/public/discovery',{method:'POST',headers:{'content-type':'application/json',origin:'https://gorez.co','sec-fetch-site':'same-origin'},body:JSON.stringify(body)})
  const invalid=await handler(request({query:'',browse:true,category:'hair',subcategory:'fitness-yoga'}))
  assert.equal(invalid.status,422);assert.equal(reads,0)
  const response=await handler(request({query:'',browse:true,category:'fitness',subcategory:'fitness-yoga',cityCode:'68134'}))
  assert.equal(response.status,200);assert.equal(reads,1)
  const body=await response.json()
  assert.deepEqual(body.subcategoryOptions,[]);assert.equal(body.external,null)
})
