import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {businessApplicationSchema,applicationRecord,createBusinessApplicationHandler,platformAdminIdentity} from '../lib/business-application.mjs'
import {changeDirectoryFilter,directoryChoices,filterDirectory,EMPTY_DIRECTORY_FILTERS} from '../lib/directory.mjs'
import {readApplicationPhotos} from '../lib/application-photos.mjs'

export const application={business:{name:'Local Test Salon',slug:'local-test-salon',phone:'+359888123456',contact_email:'bookings@example.com',address:'Test Street 1',timezone:'Europe/Sofia',industry:'beauty',city_ekatte:'68134',neighborhood:'Център',default_duration_min:'45',booking_slot_minutes:'15'},services:[{name:'Haircut',price:'25',duration_min:'45'}],staff:[{name:'Test Person'}],schedule:Array.from({length:7},(_,i)=>({weekday:i+1,enabled:i<5,open:'09:00',close:'18:00',breakEnabled:true,breakStart:'12:00',breakEnd:'13:00'})),account:{email:'owner@example.com',password:'Local-test-only-strong'},locale:'bg',consent:true,company:''}
const request=(body=application,headers={})=>{
  if(typeof body==='string'||headers['content-length'])return new Request('https://gorez.example/api/public/business-applications',{method:'POST',headers:{'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)})
  const form=new FormData();form.append('payload',JSON.stringify(body));form.append('photoConsent','true');form.append('gallery_0',new File(['offline-normalizer-fixture'],'photo.png',{type:'image/png'}))
  return new Request('https://gorez.example/api/public/business-applications',{method:'POST',headers,body:form})
}
function harness(options={}) {
  const calls={created:[],deleted:[],saved:[],notified:[]}
  const handler=createBusinessApplicationHandler({readSubmission:readApplicationPhotos,prepareImages:async files=>files.map(row=>({staffIndex:row.staffIndex,image:{width:1,height:1,data:new Uint8Array([1])}})),allowAttempt:async()=>options.allowed!==false,authenticate:async()=>options.user||null,reserved:email=>email==='admin@example.com',createAccount:async account=>{calls.created.push(account);return options.duplicate?null:{id:'new-auth-id'}},deleteAccount:async id=>calls.deleted.push(id),save:async input=>{calls.saved.push(input);if(options.failure)throw Object.assign(Error('private internals'),{code:options.failure});return {photosSaved:input.images.length}},notify:async input=>{calls.notified.push(input);if(options.notificationFailure)throw Error('offline')}})
  return {handler,calls}
}
test('complete setup validates server-side, including real location, full duration and lunch break',()=>{
  const record=applicationRecord(businessApplicationSchema.parse(application))
  assert.equal(record.business.city,'София');assert.equal(record.services[0].duration_min,45);assert.equal(record.hours[0].break_start,'12:00')
  assert.doesNotMatch(JSON.stringify(record),/password|Local-test-only/)
  for(const patch of [{business:{...application.business,owner_id:'forged'}},{business:{...application.business,city_ekatte:'00000'}},{services:[{...application.services[0],duration_min:0}]},{staff:[]},{consent:false},{company:'bot'},{schedule:application.schedule.map(day=>({...day,weekday:1}))},{schedule:application.schedule.map(day=>({...day,breakEnd:'19:00'}))}])assert.equal(businessApplicationSchema.safeParse({...application,...patch}).success,false)
})
test('public setup creates an unconfirmed identity and private application, never a confirmation email or password record',async()=>{
  const h=harness({notificationFailure:true}),response=await h.handler(request())
  assert.equal(response.status,201);assert.deepEqual(await response.json(),{ok:true,pending:true,photos:{requested:1,saved:1}})
  assert.match(response.headers.get('cache-control'),/no-store/)
  assert.equal(h.calls.saved[0].ownerId,'new-auth-id');assert.equal(h.calls.saved[0].requiresActivation,true)
  assert.doesNotMatch(JSON.stringify(h.calls.saved),/password|Local-test-only/);assert.deepEqual(h.calls.deleted,[])
})
test('verified signed-in owners can submit without another password; caller email cannot take over another account',async()=>{
  const user={id:'existing-owner',email:'owner@example.com',email_confirmed_at:'2026-10-25'}
  const h=harness({user}),response=await h.handler(request({...application,account:{email:user.email,password:''}}))
  assert.equal(response.status,201);assert.equal(h.calls.saved[0].ownerId,user.id);assert.equal(h.calls.saved[0].requiresActivation,false);assert.deepEqual(h.calls.created,[])
  for(const account of [{...user,email:'other@example.com'},{...user,email_confirmed_at:null},{...user,is_anonymous:true}]){
    const h=harness({user:account});assert.equal((await h.handler(request())).status,409);assert.deepEqual(h.calls.saved,[])
  }
})
test('cross-site, malformed, oversized, weak, spam, reserved-address and rate-limited attempts cannot create accounts',async()=>{
  for(const [body,headers,options,status] of [['{',{}, {},422],[{...application,company:'spam'},{},{},422],[application,{origin:'https://evil.example'},{},403],[application,{'content-length':'800001'},{},422],[{...application,account:{email:'admin@example.com',password:'long-password'}},{},{},409],[{...application,account:{email:'owner@example.com',password:'short'}},{},{},409],[application,{authorization:'Bearer expired'},{},409],[application,{},{allowed:false},429]]){
    const h=harness(options);assert.equal((await h.handler(request(body,headers))).status,status);assert.equal(h.calls.created.length,0);assert.equal(h.calls.saved.length,0)
  }
})
test('failed SQL removes only the transient identity; duplicate identities and failures never overwrite existing accounts',async()=>{
  const h=harness({failure:'23505'}),response=await h.handler(request())
  assert.equal(response.status,409);assert.deepEqual(h.calls.deleted,['new-auth-id']);assert.equal(h.calls.notified.length,0)
  const existing=harness({user:{id:'existing',email:'owner@example.com',email_confirmed_at:'2026-10-25'},failure:'offline'})
  assert.equal((await existing.handler(request())).status,503);assert.deepEqual(existing.calls.deleted,[])
  const duplicate=harness({duplicate:true});assert.equal((await duplicate.handler(request())).status,409);assert.equal(duplicate.calls.saved.length,0)
})
test('business-application identities cannot become platform admins via email or forged editable metadata',()=>{
  const admin={email:'info@gorez.co',email_confirmed_at:'2026-10-25'}
  assert.equal(platformAdminIdentity(admin,'info@gorez.co'),true)
  for(const patch of [{email_confirmed_at:null},{is_anonymous:true},{app_metadata:{gorez_business_application:true}},{email:'other@example.com',user_metadata:{admin:true}}])assert.equal(platformAdminIdentity({...admin,...patch},'info@gorez.co'),false)
})
test('directory dropdowns cascade across actual services, cities and neighbourhoods without changing source data',()=>{
  const rows=[{name:'A',city:'София',neighborhood:'Център',services:[{name:'Haircut'},{name:'Beard'}]},{name:'B',city:'Пловдив',neighborhood:'Тракия',services:[{name:'haircut'}]},{name:'Legacy',services:[{name:'Diagnostics'}]}]
  const snapshot=JSON.stringify(rows),filters={service:'haircut',city:'София',neighborhood:'Център'}
  const choices=directoryChoices(rows,filters)
  assert.equal(choices.services.length,3);assert.equal(choices.cities.length,2);assert.deepEqual(choices.neighborhoods,['Център'])
  assert.equal(filterDirectory(rows,filters).length,1);assert.equal(filterDirectory(rows,filters)[0].services.length,1)
  assert.equal(JSON.stringify(rows),snapshot)
  assert.deepEqual(changeDirectoryFilter(filters,'service','diagnostics'),{service:'diagnostics',city:'',neighborhood:''})
  assert.deepEqual(changeDirectoryFilter(filters,'city','Пловдив'),{service:'haircut',city:'Пловдив',neighborhood:''})
  assert.equal(filterDirectory(rows,EMPTY_DIRECTORY_FILTERS).length,3);assert.deepEqual(directoryChoices([],EMPTY_DIRECTORY_FILTERS).cities,[])
})
test('AI-only home retains business access, the direct five-step wizard and existing calendar controls',async()=>{
  const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')
  const home=await read('components/home-page.js'),nav=await read('components/marketing-navigation.js'),filters=await read('components/directory-filters.js'),calendar=await read('components/appointment-calendar.js')
  assert.match(home,/<DiscoveryPage/);assert.doesNotMatch(home,/business-start|Добави бизнеса си/)
  assert.match(nav,/href=\{`\/for-businesses\?lang=\$\{locale\}`\}/)
  assert.doesNotMatch(nav,/Добави бизнеса си/);assert.doesNotMatch(filters,/<input|<textarea/)
  assert.equal((filters.match(/<select/g)||[]).length,3);assert.match(calendar,/calendar-filter-menu/);assert.match(calendar,/calendar-mobile-agenda/);assert.doesNotMatch(calendar,/<input/)
  const route=await read('app/api/public/business-applications/route.js')
  assert.match(route,/email_confirm:false/);assert.doesNotMatch(route,/auth\.signUp|password:/)
  const page=await read('app/for-businesses/page.js');assert.match(page,/BusinessOnboarding/)
})
