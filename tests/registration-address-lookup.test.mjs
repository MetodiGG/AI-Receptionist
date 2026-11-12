import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { registrationAddressProvider, createRegistrationAddressResolver, createRegistrationLocationRequestHandler } from '../lib/registration-address-lookup.mjs'

const bid='10000000-0000-4000-8000-000000000001',owner='20000000-0000-4000-8000-000000000001',other='20000000-0000-4000-8000-000000000002'
const business={id:bid,city_ekatte:'68134',city:'София',neighborhood:'',address:'Пирин 42',name:'Private owner business name',phone:'+359889999999',contact_email:'private-owner@example.com'}
const point={latitude:42.6655,longitude:23.2825,source_url:'https://www.openstreetmap.org/way/12345',licence:'ODbL-1.0',attribution:'© OpenStreetMap contributors'}
const candidate={osm_type:'way',osm_id:12345,lat:'42.6655',lon:'23.2825',boundingbox:['42.665','42.666','23.282','23.283'],class:'building',type:'residential',addresstype:'building',place_rank:30,address:{country_code:'bg',city:'София',road:'Пирин',house_number:'42'}}
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')
function resolverFixture({claim={state:'claimed',address_key:'offline-address-key',claim_token:'offline-claim',business},response=()=>new Response(JSON.stringify([candidate])),env={},claimError,finishError}={}){
 const claims=[],finishes=[],requests=[]
 const run=createRegistrationAddressResolver({env,store:{claim:async id=>{claims.push(id);if(claimError)throw claimError;return structuredClone(claim)},finish:async input=>{finishes.push(input);if(finishError)throw finishError;return {state:input.status}}},fetcher:async(url,init)=>{requests.push({url,init});return response(url,init)}})
 return {claims,finishes,requests,run:()=>run(bid)}
}

test('disabled or unsafe configured provider causes no DB claim and no network request',async()=>{
 for(const env of [{REGISTRATION_ADDRESS_LOOKUP_ENABLED:'false'},...['http://nominatim.openstreetmap.org/search','https://user:secret@example.com/search','https://localhost/search','https://127.0.0.1/search','https://service.internal/search','https://example.com/search?q=secret','https://example.com/search#fragment'].map(url=>({REGISTRATION_ADDRESS_GEOCODER_URL:url}))]){
  const f=resolverFixture({env});assert.deepEqual(await f.run(),{state:'disabled'});assert.deepEqual(f.claims,[]);assert.deepEqual(f.requests,[]);assert.deepEqual(f.finishes,[])
 }
 assert.equal(registrationAddressProvider({}).href,'https://nominatim.openstreetmap.org/search')
})
test('already resolved, missing, leased and throttled addresses never contact a provider or overwrite state',async()=>{
 for(const claim of [null,...['missing','manual','matched','no_match','throttled','busy','retry_later'].map(state=>({state}))]){
  const f=resolverFixture({claim});assert.deepEqual(await f.run(),{state:claim?.state||'missing'});assert.deepEqual(f.claims,[bid]);assert.deepEqual(f.requests,[]);assert.deepEqual(f.finishes,[])
 }
})
test('a trusted cache hit goes through conditional finish with no provider request',async()=>{
 const f=resolverFixture({claim:{state:'cached',address_key:'cached-address',claim_token:'cached-claim',result:point}})
 assert.deepEqual(await f.run(),{state:'matched'});assert.equal(f.requests.length,0)
 assert.deepEqual(f.finishes,[{businessId:bid,addressKey:'cached-address',claimToken:'cached-claim',status:'matched',result:point,retryAfterSeconds:null}])
})
test('one bounded request sends only the public address, not the business name or contact/customer data',async()=>{
 const f=resolverFixture();assert.deepEqual(await f.run(),{state:'matched'});assert.equal(f.requests.length,1)
 const {url,init}=f.requests[0],u=new URL(url)
 assert.equal(u.origin,'https://nominatim.openstreetmap.org');assert.equal(u.pathname,'/search')
 assert.deepEqual(Object.fromEntries(u.searchParams),{format:'jsonv2',addressdetails:'1',limit:'5',countrycodes:'bg','accept-language':'bg,en',q:'Пирин 42, София, България'})
 for(const secret of [business.name,business.phone,business.contact_email,owner])assert.equal(url.includes(secret),false)
 assert.equal(init.method,'GET');assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');assert.equal(init.body,undefined)
 assert.equal(init.headers.Accept,'application/json');assert.match(init.headers['User-Agent'],/^GoRez registration address lookup\/1\.0 \(\+https:\/\/www\.gorez\.co; info@gorez\.co\)$/)
 assert.ok(init.signal instanceof AbortSignal);assert.equal(init.signal.aborted,false)
 assert.deepEqual(f.finishes[0],{businessId:bid,addressKey:'offline-address-key',claimToken:'offline-claim',status:'matched',result:point,retryAfterSeconds:null})
})
test('invalid/private or incomplete street text is held for review without geocoding; no-match stays no-match',async()=>{
 for(const address of ['Пирин','Пирин 42, email private@example.com','+359889999999','https://example.com/42']){
  const f=resolverFixture({claim:{state:'claimed',business:{...business,address},address_key:'key',claim_token:'claim'}})
  assert.deepEqual(await f.run(),{state:'no_match'});assert.equal(f.requests.length,0);assert.equal(f.finishes[0].result,null)
 }
 for(const rows of [[],[{...candidate,address:{...candidate.address,house_number:'43'}}]]){
  const f=resolverFixture({response:()=>new Response(JSON.stringify(rows))});assert.deepEqual(await f.run(),{state:'no_match'});assert.equal(f.requests.length,1);assert.equal(f.finishes[0].result,null)
 }
})
test('HTTP limits honor bounded Retry-After, never loop or turn an outage into a matched point',async()=>{
 for(const [status,retryAfter,expected] of [[429,'120',120],[429,'999999',3600],[503,'0',60],[429,'invalid',60],[500,'300',null],[404,'300',null]]){
  const f=resolverFixture({response:()=>new Response('private provider error',{status,headers:{'retry-after':retryAfter}})})
  assert.deepEqual(await f.run(),{state:'failed'});assert.equal(f.requests.length,1);assert.equal(f.finishes[0].retryAfterSeconds,expected);assert.equal(f.finishes[0].result,null)
 }
})
test('timeout, oversized streamed bodies, malformed JSON, invalid array shape and missing streams are safe failed lookups',async()=>{
 for(const response of [()=>{throw new DOMException('Offline timeout','TimeoutError')},()=>new Response('[]',{headers:{'content-length':'131073'}}),()=>new Response('x'.repeat(131073)),()=>new Response('invalid-json'),()=>new Response('{}'),()=>new Response(JSON.stringify(Array(11).fill(candidate))),()=>({ok:true,headers:new Headers(),body:null})]){
  const f=resolverFixture({response});assert.deepEqual(await f.run(),{state:'failed'});assert.equal(f.requests.length,1);assert.equal(f.finishes[0].status,'failed');assert.equal(f.finishes[0].result,null)
 }
})

const request=(body='{}',headers={})=>new Request(`https://www.gorez.co/api/businesses/${bid}/location`,{method:'POST',headers:{origin:'https://www.gorez.co','content-type':'application/json',...headers},body})
function handlerFixture(patch={}){
 const events=[],scheduled=[]
 const deps={authenticate:async()=>{events.push('auth');return{id:owner,email_confirmed_at:'2026-11-12'}},isAdmin:()=>false,readBusiness:async id=>{events.push('read');assert.equal(id,bid);return{id,owner_id:owner}},allowAttempt:async(req,id)=>{events.push('rate');assert.equal(id,owner);return true},schedule:id=>{events.push('schedule');scheduled.push(id)},...patch}
 return{events,scheduled,handler:createRegistrationLocationRequestHandler(deps)}
}
test('location endpoint requires a verified nonanonymous owner/admin, same origin and strict UUID before scheduling',async()=>{
 for(const user of [null,{id:owner},{id:owner,email_confirmed_at:'yes',is_anonymous:true}]){
  const f=handlerFixture({authenticate:async()=>user});assert.equal((await f.handler(request(),bid)).status,401);assert.deepEqual(f.scheduled,[]);assert.deepEqual(f.events,[])
 }
 for(const [req,id,status] of [[request('{}',{origin:'https://untrusted.example'}),bid,403],[request(),'not-a-uuid',422],[request('{}',{'content-type':'text/plain'}),bid,422],[request('{}',{'content-length':'101'}),bid,422]]){
  const f=handlerFixture();assert.equal((await f.handler(req,id)).status,status);assert.deepEqual(f.events,['auth']);assert.deepEqual(f.scheduled,[])
 }
})
test('arbitrary coordinates, addresses, provider URLs, malformed and oversized request bodies are refused without a DB read',async()=>{
 for(const body of ['{','',JSON.stringify({latitude:42.66,longitude:23.28}),JSON.stringify({address:'Пирин42'}),JSON.stringify({url:'https://attacker.example/search'}),`{${' '.repeat(101)}}`]){
  const f=handlerFixture();assert.equal((await f.handler(request(body),bid)).status,422,body);assert.deepEqual(f.events,['auth']);assert.deepEqual(f.scheduled,[])
 }
})
test('only the actual owner or platform admin can request a lookup; quota is checked before dispatch',async()=>{
 for(const readBusiness of [async()=>null,async()=>({id:bid,owner_id:other})]){const f=handlerFixture({readBusiness});assert.equal((await f.handler(request(),bid)).status,404);assert.deepEqual(f.scheduled,[])}
 const limited=handlerFixture({allowAttempt:async()=>false});assert.equal((await limited.handler(request(),bid)).status,429);assert.deepEqual(limited.scheduled,[])
 const ownerFlow=handlerFixture();const response=await ownerFlow.handler(request(),bid)
 assert.equal(response.status,202);assert.deepEqual(await response.json(),{accepted:true});assert.match(response.headers.get('cache-control'),/no-store/);assert.deepEqual(ownerFlow.events,['auth','read','rate','schedule']);assert.deepEqual(ownerFlow.scheduled,[bid])
 const admin=handlerFixture({isAdmin:()=>true,readBusiness:async()=>({id:bid,owner_id:other})});assert.equal((await admin.handler(request(),bid)).status,202);assert.deepEqual(admin.scheduled,[bid])
})

const require=createRequire(import.meta.url),{loadBindings,transform}=require('next/dist/build/swc')
async function serverModule(path,stubs){
 await loadBindings();const {code}=await transform(await read(path),{filename:path,jsc:{parser:{syntax:'ecmascript'}},module:{type:'commonjs'}})
 const mod={exports:{}};new Function('require','module','exports',code)(name=>{if(!(name in stubs))throw Error(`Unexpected server dependency ${name}`);return stubs[name]},mod,mod.exports);return mod.exports
}
test('actual server after wrapper isolates synchronous scheduling and asynchronous lookup failures from accepted registrations',async()=>{
 const afterTasks=[],logs=[],calls=[];let dispatchFailure=false
 const actual=await serverModule('lib/registration-address-server.js',{'server-only':{},'next/server':{after:callback=>{if(dispatchFailure)throw Error('offline scheduler');afterTasks.push(callback)}},'./supabase-admin':{getSupabaseAdmin:()=>({rpc:async()=>({data:null})})},'./registration-address-lookup.mjs':{createRegistrationAddressResolver:()=>async id=>{calls.push(id);throw Error('private database/provider error')}}})
 const original=console.error;console.error=message=>logs.push(message)
 try{
  assert.doesNotThrow(()=>actual.scheduleRegistrationAddressLookup(bid));assert.equal(calls.length,0);await afterTasks[0]();assert.deepEqual(calls,[bid]);assert.equal(logs.length,1);assert.doesNotMatch(logs[0],/private database|provider error/)
  dispatchFailure=true;assert.doesNotThrow(()=>actual.scheduleRegistrationAddressLookup(bid));assert.equal(logs.length,2)
 }finally{console.error=original}
})
test('actual server adapter sends only conditional claim/finish RPC arguments, and disabled lookup performs no DB operation',async()=>{
 const calls=[];const db={rpc:async(name,args)=>{calls.push({name,args});return{data:name==='claim_registration_address_lookup'?{state:'cached',address_key:'key',claim_token:'claim',result:point}:{state:'matched'}}}}
 const actual=await serverModule('lib/registration-address-server.js',{'server-only':{},'next/server':{after(){}},'./supabase-admin':{getSupabaseAdmin:()=>db},'./registration-address-lookup.mjs':{createRegistrationAddressResolver}})
 const previous=process.env.REGISTRATION_ADDRESS_LOOKUP_ENABLED
 try{
  process.env.REGISTRATION_ADDRESS_LOOKUP_ENABLED='false';assert.deepEqual(await actual.resolveRegistrationAddress(bid),{state:'disabled'});assert.deepEqual(calls,[])
  delete process.env.REGISTRATION_ADDRESS_LOOKUP_ENABLED;assert.deepEqual(await actual.resolveRegistrationAddress(bid),{state:'matched'})
  assert.deepEqual(calls,[{name:'claim_registration_address_lookup',args:{p_business:bid}},{name:'finish_registration_address_lookup',args:{p_business:bid,p_address_key:'key',p_claim_token:'claim',p_status:'matched',p_result:point,p_retry_after_seconds:null}}])
 }finally{if(previous===undefined)delete process.env.REGISTRATION_ADDRESS_LOOKUP_ENABLED;else process.env.REGISTRATION_ADDRESS_LOOKUP_ENABLED=previous}
})
test('actual owner request route uses verified ownership, private POST and a three-attempt per-owner hourly limit',async()=>{
 const quotas=[],scheduled=[],attempts=new Map()
 const db={from:table=>{assert.equal(table,'businesses');return{select:fields=>{assert.equal(fields,'id,owner_id');return{eq:(key,id)=>{assert.equal(key,'id');assert.equal(id,bid);return{maybeSingle:async()=>({data:{id:bid,owner_id:owner}})}}}}}}}
 const actual=await serverModule('app/api/businesses/[id]/location/route.js',{'../../../../../lib/server-auth':{requireUser:async()=>({id:owner,email_confirmed_at:'2026-11-12'}),isPlatformAdmin:()=>false},'../../../../../lib/supabase-admin':{getSupabaseAdmin:()=>db},'../../../../../lib/rate-limit':{consumeRateLimit:async(req,config)=>{quotas.push(config);const count=(attempts.get(config.scope)||0)+1;attempts.set(config.scope,count);return count<=config.limit}},'../../../../../lib/registration-address-lookup.mjs':{createRegistrationLocationRequestHandler},'../../../../../lib/registration-address-server':{scheduleRegistrationAddressLookup:id=>scheduled.push(id)}})
 const statuses=[];for(let i=0;i<4;i++)statuses.push((await actual.POST(request(),{params:Promise.resolve({id:bid})})).status)
 assert.deepEqual(statuses,[202,202,202,429]);assert.deepEqual(scheduled,[bid,bid,bid]);assert.deepEqual(quotas,Array.from({length:4},()=>({scope:`registration-location:${owner}`,limit:3,windowSeconds:3600,includeUserAgent:false})))
})
test('actual public signup schedules an address lookup only after durable save, including partial photo failure',async()=>{
 let captured,rpcFailure=false,photoFailure=false;const scheduled=[],sequence=[]
 const db={rpc:async()=>{sequence.push('save');if(rpcFailure)return{error:Error('Offline save failed')};return{data:'offline-lead'}},from:table=>{assert.equal(table,'partner_leads');return{select:()=>({eq:()=>({single:async()=>({data:{business_id:bid}})})})}}}
 await serverModule('app/api/public/business-applications/route.js',{
  '../../../../lib/business-application.mjs':{createBusinessApplicationHandler:deps=>{captured=deps;return()=>{}},isReservedApplicationEmail:()=>false},'../../../../lib/supabase-admin':{getSupabaseAdmin:()=>db},'../../../../lib/server-auth':{requireUser:async()=>null},'../../../../lib/rate-limit':{consumeRateLimit:async()=>true},'next/server':{after(){}},'node:crypto':{randomUUID:()=>other},'../../../../lib/application-photos.mjs':{readApplicationPhotos(){},prepareApplicationPhotos(){}},'../../../../lib/image-normalization.mjs':{normalizeBusinessImage(){}},'../../../../lib/business-media-server':{checked:result=>{if(result.error)throw result.error;return result.data},mediaAccess:async()=>({id:bid,owner_id:owner,content_revision:2}),uploadBusinessMedia:async()=>{sequence.push('photo');if(photoFailure)throw Error('Offline photo failed')}},'../../../../lib/booking-destination-server':{verifyBookingDestination:async()=>{throw Error('No real booking site may be requested')}},'../../../../lib/registration-address-server':{scheduleRegistrationAddressLookup:id=>{sequence.push('schedule');scheduled.push(id)}},
 })
 const input={ownerId:owner,requiresActivation:true,record:{business:{booking_mode:'gorez'},staff:[{name:'Offline staff'}]},images:[{staffIndex:null,image:{offline:true}}]}
 assert.deepEqual(await captured.save(input),{photosSaved:1});assert.deepEqual(sequence,['save','photo','schedule']);assert.deepEqual(scheduled,[bid]);sequence.length=0;scheduled.length=0
 photoFailure=true;assert.deepEqual(await captured.save(input),{photosSaved:0});assert.deepEqual(sequence,['save','photo','schedule']);assert.deepEqual(scheduled,[bid]);scheduled.length=0
 rpcFailure=true;await assert.rejects(captured.save(input),/Offline save failed/);assert.deepEqual(scheduled,[])
})
test('actual approval and admin publication schedule only committed decisions; legacy completion remains nonblocking',async()=>{
 const scheduled=[],lead={business_id:bid,updated_at:'expected',requires_owner_activation:false};let rpcFailure=false
 const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:lead})})})}),rpc:async()=>rpcFailure?{error:Error('Offline publish failed')}:{data:{ok:true}}}
 const review=await serverModule('lib/business-application-review.js',{'server-only':{},'./supabase-admin':{getSupabaseAdmin:()=>db},'./business-approval-emails':{scheduleBusinessApprovalEmail(){}},'./registration-address-server':{scheduleRegistrationAddressLookup:id=>scheduled.push(id)}})
 await review.reviewApplication({id:'lead',status:'active',expectedUpdatedAt:'expected'},owner);assert.deepEqual(scheduled,[bid]);scheduled.length=0
 assert.equal(await review.reviewApplication({id:'lead',status:'active',expectedUpdatedAt:'stale'},owner),null);await review.reviewApplication({id:'lead',status:'declined',expectedUpdatedAt:'expected'},owner);assert.deepEqual(scheduled,[])
 rpcFailure=true;await assert.rejects(review.reviewApplication({id:'lead',status:'active',expectedUpdatedAt:'expected'},owner));assert.deepEqual(scheduled,[]);rpcFailure=false
 let handlers
 await serverModule('app/api/admin/businesses/[id]/route.js',{'../../../../../lib/server-auth':{requireUser:async()=>null,isPlatformAdmin:()=>true},'../../../../../lib/supabase-admin':{getSupabaseAdmin:()=>db},'../../../../../lib/rate-limit':{consumeRateLimit:async()=>true},'../../../../../lib/platform-admin.mjs':{createAdminBusinessHandlers:deps=>{handlers=deps;return{}}},'../../../../../lib/business-application-review':{activateApplicationOwner:async()=>{}},'../../../../../lib/business-approval-emails':{scheduleBusinessApprovalEmail(){}},'../../../../../lib/registration-address-server':{scheduleRegistrationAddressLookup:id=>scheduled.push(id)}})
 await handlers.mutate({id:bid,action:'publish'});assert.deepEqual(scheduled,[bid]);scheduled.length=0;await handlers.mutate({id:bid,action:'suspend'});assert.deepEqual(scheduled,[])
 rpcFailure=true;await assert.rejects(handlers.mutate({id:bid,action:'publish'}));assert.deepEqual(scheduled,[])
 const ui=await read('components/business-setup.js'),dispatch=ui.indexOf('void fetch(`/api/businesses/${createdBusinessId}/location`')
 assert.ok(dispatch>ui.indexOf('if (hoursError) throw hoursError'))
 assert.ok(dispatch<ui.indexOf('onComplete({ business: createdBusiness, services: createdServices'))
 assert.match(ui.slice(dispatch,dispatch+330),/method:'POST'[\s\S]*body:'\{\}'[\s\S]*keepalive:true[\s\S]*\.catch\(\(\)=>\{\}\)/)
})
