import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createAdminBusinessHandlers,businessActionSchema} from '../lib/platform-admin.mjs'
import {businessState,filterAdminBusinesses} from '../lib/platform-business-view.mjs'

const id='10000000-0000-4000-8000-000000000001',actor='20000000-0000-4000-8000-000000000001'
const user={id:actor,email:'admin@example.com',email_confirmed_at:'2026-10-16T00:00:00Z'}
const token=claims=>`header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
const fresh=()=>token({amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)}]})
const input={action:'archive',revision:0,confirmation:'example',reason:'Requested by platform owner',acknowledged:true}
const request=(data=input,headers={})=>new Request(`https://gorez.example/api/admin/businesses/${id}`,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof data==='string'?data:JSON.stringify(data)})
function harness(options={}){
  const operations=[]
  const handlers=createAdminBusinessHandlers({
    authenticate:async()=>({user:options.user===undefined?user:options.user,token:options.token||fresh()}),
    isAdmin:account=>account.email==='admin@example.com',allowAttempt:async()=>options.allowed!==false,
    read:async value=>{operations.push(['read',value]);return options.missing?null:{business:{id:value},counts:{upcoming:0}}},
    mutate:async value=>{operations.push(['mutate',value]);if(options.failure)throw new Error(options.failure);return {id:value.id,deleted:value.action==='delete'}},
  })
  return {...handlers,operations}
}
test('public-facing business state distinguishes unpublished, platform suspension and trash',()=>{
  assert.equal(businessState({active:true,platform_status:'enabled'}),'published')
  assert.equal(businessState({active:false,platform_status:'enabled'}),'unpublished')
  assert.equal(businessState({active:true,platform_status:'pending'}),'pending')
  assert.equal(businessState({active:true,platform_status:'suspended'}),'suspended')
  assert.equal(businessState({active:true,platform_status:'archived'}),'archived')
  const rows=[{name:'Salon',slug:'salon',city:'София',active:true,platform_status:'enabled'},{name:'Garage',slug:'garage',contact_email:'garage@example.com',active:true,platform_status:'archived'}]
  assert.equal(filterAdminBusinesses(rows,'СОФИЯ').length,1)
  assert.equal(filterAdminBusinesses(rows,'@example.com','archived').length,1)
  assert.equal(filterAdminBusinesses(rows,'Garage','published').length,0)
})
test('guest, ordinary owner, unverified and anonymous accounts cannot read or mutate any business',async()=>{
  for(const account of [null,{...user,email:'owner@example.com',user_metadata:{admin:true}},{...user,email_confirmed_at:null},{...user,is_anonymous:true}]){
    const h=harness({user:account})
    assert.equal((await h.GET(new Request('https://gorez.example'),id)).status,account?403:401)
    assert.equal((await h.POST(request(),id)).status,account?403:401)
    assert.deepEqual(h.operations,[])
  }
})
test('business mutations reject malformed bodies, actor injection, missing acknowledgement and cross-origin requests',async()=>{
  for(const body of ['{',{...input,actorId:'attacker'},{...input,acknowledged:false},{...input,revision:-1},{...input,reason:'x'},{...input,action:'deleteUser'}]){
    const h=harness();assert.equal((await h.POST(request(body),id)).status,422);assert.deepEqual(h.operations,[])
  }
  for(const headers of [{origin:'https://attacker.example'},{'sec-fetch-site':'cross-site'}]){
    const h=harness();assert.equal((await h.POST(request(input,headers),id)).status,403);assert.deepEqual(h.operations,[])
  }
  assert.equal(businessActionSchema.safeParse(input).success,true)
})
test('validated administrator identity, not caller input, is the action actor; private responses are never cached',async()=>{
  const h=harness(),response=await h.POST(request(),id)
  assert.equal(response.status,200)
  assert.equal(h.operations[0][1].actorId,actor)
  assert.equal(h.operations[0][1].id,id)
  assert.match(response.headers.get('cache-control'),/private.*no-store/)
  assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow')
  assert.equal((await h.GET(new Request('https://gorez.example'),'invalid')).status,422)
  assert.equal((await harness({missing:true}).GET(new Request('https://gorez.example'),id)).status,404)
})
test('permanent deletion needs recent password authentication and cannot bypass MFA or rate limits',async()=>{
  for(const options of [{token:token({iat:Date.now()/1000,amr:[{method:'otp',timestamp:Date.now()/1000}]})},{token:token({amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)-301}]})},{user:{...user,factors:[{status:'verified'}]}}]){
    const h=harness(options);assert.equal((await h.POST(request({...input,action:'delete'}),id)).status,403);assert.deepEqual(h.operations,[])
  }
  const limited=harness({allowed:false});assert.equal((await limited.POST(request(),id)).status,429);assert.deepEqual(limited.operations,[])
  assert.equal((await harness().POST(request({...input,action:'delete'}),id)).status,200)
})
test('conflicts are actionable and internal error details stay private',async()=>{
  for(const [failure,status,code] of [['BUSINESS_CHANGED',409,'BUSINESS_CHANGED'],['UPCOMING_BOOKINGS',409,'UPCOMING_BOOKINGS'],['BUSINESS_NOT_FOUND',404,'BUSINESS_NOT_FOUND'],['private database password detail',503,'ADMIN_UNAVAILABLE']]){
    const response=await harness({failure}).POST(request(),id)
    assert.equal(response.status,status);assert.deepEqual(await response.json(),{error:{code}})
  }
})
test('client never uses service-role keys, arbitrary return URLs or owner impersonation',async()=>{
  const ui=await readFile(new URL('../components/platform-admin.js',import.meta.url),'utf8')
  assert.doesNotMatch(ui,/SUPABASE_SERVICE_ROLE_KEY|auth\.admin|deleteUser|impersonat/i)
  assert.match(ui,/createReauthenticationClient/)
  assert.match(ui,/data\.user\.id!==session\.user\.id/)
  assert.match(ui,/confirmation!==b\.slug/)
  assert.match(ui,/detail\.counts\.upcoming>0/)
  const account=await readFile(new URL('../components/customer-account.js',import.meta.url),'utf8')
  assert.match(account,/get\('next'\)==='admin'/)
  assert.match(account,/router\.replace\(`\/admin\?lang=/)
  const access=await readFile(new URL('../lib/server-auth.js',import.meta.url),'utf8')
  assert.match(access,/user\.email_confirmed_at/)
  assert.doesNotMatch(access,/user_metadata/)
})
