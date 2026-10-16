import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { createCustomerBookingsHandler,customerAccountRedirect,customerSignupSchema,requestCustomerSignInLink } from '../lib/customer-account.mjs'
import { ensureCustomerEmailProof,validatedTokenHasEmailProof } from '../lib/customer-email-proof.mjs'

const identity={id:'10000000-0000-4000-8000-000000000001',email:'client@example.com',email_confirmed_at:'2026-10-16T10:00:00Z'}
function fixture(user=identity, overrides={}) {
  const calls=[]
  const handler=createCustomerBookingsHandler({authenticate:async()=>user,allowAttempt:async()=>true,authorizeEmail:async()=>true,list:async input=>{calls.push(input);return []},...overrides})
  return {calls,handler,request:query=>new Request(`https://www.gorez.co/api/customer/bookings${query||''}`)}
}
test('customer history rejects guests, anonymous and unverified identities before database access',async()=>{
  for(const [user,status] of [[null,401],[{...identity,email_confirmed_at:null},403],[{...identity,is_anonymous:true},403]]) {
    const f=fixture(user),r=await f.handler(f.request());assert.equal(r.status,status);assert.equal(f.calls.length,0)
    assert.match(r.headers.get('cache-control'),/private, no-store/)
  }
})
test('history identity comes only from Auth, never metadata, URL, email or caller-selected account ID',async()=>{
  const f=fixture({...identity,user_metadata:{id:'another',email:'victim@example.com',role:'admin'}})
  assert.equal((await f.handler(f.request('?view=past&page=2'))).status,200)
  assert.deepEqual(f.calls,[{accountId:identity.id,view:'past',page:2}])
  for(const query of ['?email=victim@example.com','?accountId=another','?view=all','?page=-1','?page=501','?page=1.5','?page=0&extra=true'])assert.equal((await f.handler(f.request(query))).status,422)
})
test('customer API rate limits, redacts failures and whitelists records without CRM notes or contacts',async()=>{
  const limited=fixture(identity,{allowAttempt:async()=>false});assert.equal((await limited.handler(limited.request())).status,429)
  const broken=fixture(identity,{list:async()=>{throw new Error('secret database error')}});assert.equal((await broken.handler(broken.request())).status,503)
  const rows=Array.from({length:21},(_,id)=>({id,notes:'PRIVATE CRM',customer:{phone:'private'},payload:'secret',business:{name:'Salon',owner_id:'private',contact_email:'private'},service:{name:'Haircut'},staff:{name:'Stylist'}}))
  const f=fixture(identity,{list:async()=>rows}),response=await f.handler(f.request()),result=await response.json()
  assert.equal(result.bookings.length,20);assert.equal(result.hasMore,true)
  assert.doesNotMatch(JSON.stringify(result),/PRIVATE|owner_id|contact_email|payload|phone/)
  assert.equal(response.headers.get('referrer-policy'),'no-referrer')
})
test('client registration validates agreement, matching strong passwords and safe localized callback URLs',()=>{
  const valid={name:'Test Client',email:' CLIENT@example.com ',password:'Strong-password-123',confirmation:'Strong-password-123',consent:true}
  assert.equal(customerSignupSchema.parse(valid).email,'client@example.com')
  for(const change of [{consent:false},{password:'short'},{confirmation:'different'},{email:'bad'},{name:''}])assert.equal(customerSignupSchema.safeParse({...valid,...change}).success,false)
  assert.equal(customerAccountRedirect('https://www.gorez.co','en'),'https://www.gorez.co/account?lang=en')
  assert.equal(customerAccountRedirect('http://127.0.0.1:3000','bg'),'http://127.0.0.1:3000/account?lang=bg')
  assert.throws(()=>customerAccountRedirect('http://evil.example','en'))
})

test('email sign-in never creates an account, validates email, hides absent accounts and preserves language',async()=>{
  const calls=[],auth={signInWithOtp:async input=>{calls.push(input);return {error:null}}}
  const input={auth,email:' CLIENT@EXAMPLE.COM ',origin:'https://www.gorez.co',locale:'en'}
  assert.deepEqual(await requestCustomerSignInLink(input),{accepted:true})
  assert.deepEqual(calls[0],{email:'client@example.com',options:{shouldCreateUser:false,emailRedirectTo:'https://www.gorez.co/account?lang=en'}})
  assert.deepEqual(await requestCustomerSignInLink({...input,email:'invalid'}),{error:'VALIDATION_ERROR'});assert.equal(calls.length,1)
  for(const code of ['user_not_found','signup_disabled','otp_disabled'])assert.deepEqual(await requestCustomerSignInLink({...input,auth:{signInWithOtp:async()=>({error:{code,status:422}})}}),{accepted:true})
  assert.deepEqual(await requestCustomerSignInLink({...input,auth:{signInWithOtp:async()=>({error:{status:429}})}}),{error:'RATE_LIMITED'})
  assert.deepEqual(await requestCustomerSignInLink({...input,auth:{signInWithOtp:async()=>({error:{status:500}})}}),{error:'UNAVAILABLE'})
})

test('actual PostgreSQL history is email-verified, tenant-safe, paginated and service-only',async()=>{
  const db=new PGlite()
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz);
      create table businesses(id uuid primary key,name text,slug text,phone text,address text,city text,neighborhood text,timezone text,active boolean);
      create table customers(id uuid primary key,business_id uuid,email text,notes text);
      create table services(id uuid primary key,business_id uuid,name text,price numeric,currency text,duration_min int);
      create table staff(id uuid primary key,business_id uuid,name text);
      create table appointments(id uuid primary key,business_id uuid,customer_id uuid,service_id uuid,staff_id uuid,starts_at timestamptz,ends_at timestamptz,status text,cancellation_token uuid,notes text);
      insert into auth.users values('${identity.id}','client@example.com',now(),null),('10000000-0000-4000-8000-000000000002','victim@example.com',now(),null),('10000000-0000-4000-8000-000000000003','client@example.com',null,null);
      insert into businesses values('20000000-0000-4000-8000-000000000001','Salon','salon',null,'Test address','Sofia',null,'Europe/Sofia',true),('20000000-0000-4000-8000-000000000002','Garage','garage',null,null,null,null,'Europe/Sofia',true);
      insert into customers values('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',' CLIENT@EXAMPLE.COM ','private notes'),('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','victim@example.com','private');
      insert into services values('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Haircut',25,'EUR',45);
      insert into staff values('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Stylist');
      insert into appointments select gen_random_uuid(),'20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',now()+i*interval '1 day',now()+i*interval '1 day'+interval '45 minutes','confirmed',gen_random_uuid(),'private appointment note' from generate_series(1,25) i;
      insert into appointments values(gen_random_uuid(),'20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',now()-interval '2 days',now()-interval '2 days'+interval '45 minutes','done',gen_random_uuid(),'private');
      -- A corrupt cross-tenant customer reference must not expose a row.
      insert into appointments values(gen_random_uuid(),'20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',now()+interval '1 day',now()+interval '2 days','booked',gen_random_uuid(),'private');`)
    const sql=await readFile(new URL('../supabase/migrations/20261016120000_customer_booking_history.sql',import.meta.url),'utf8')
    await db.exec(sql);await db.exec(sql)
    await db.query('insert into customer_email_verifications(user_id,email) values($1,$2)',[identity.id,identity.email])
    const query=async(id,view,page=0)=>(await db.query('select * from customer_booking_history($1,$2,$3)',[id,view,page])).rows
    assert.equal((await query(identity.id,'upcoming')).length,21)
    assert.equal((await query(identity.id,'upcoming',1)).length,5)
    assert.equal((await query(identity.id,'past')).length,1)
    assert.equal((await query('10000000-0000-4000-8000-000000000002','upcoming')).length,0)
    assert.equal((await query('10000000-0000-4000-8000-000000000003','upcoming')).length,0)
    assert.equal((await query(identity.id,'all')).length,0)
    assert.doesNotMatch(JSON.stringify(await query(identity.id,'upcoming')),/private|customer_id|owner_id|email|notes/)
    for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(query(identity.id,'upcoming'),/permission denied/);await db.exec('reset role')}
    await db.exec('set role service_role');assert.equal((await query(identity.id,'upcoming')).length,21);await db.exec('reset role')
    await db.exec('delete from customer_email_verifications');assert.equal((await query(identity.id,'upcoming')).length,0)
    await db.query('update auth.users set email=$1 where id=$2',['new@example.com',identity.id]);assert.equal((await query(identity.id,'upcoming')).length,0)
  } finally {await db.close()}
})

test('legacy auto-confirmation and password login cannot unlock history without a proven email link',async()=>{
  const now=Date.now(),seconds=Math.floor(now/1000)
  const request=changes=>new Request('https://www.gorez.co/api/customer/bookings',{headers:{authorization:`Bearer e30.${Buffer.from(JSON.stringify({sub:identity.id,email:identity.email,exp:seconds+3600,amr:[{method:'otp',timestamp:seconds}],...changes})).toString('base64url')}.signature`}})
  assert.equal(validatedTokenHasEmailProof(request({}),identity,now),true)
  for(const claims of [{amr:[{method:'password',timestamp:seconds}]},{sub:'another'},{email:'victim@example.com'},{exp:seconds-10},{amr:[{method:'otp',timestamp:seconds-1000}]},{amr:[{method:'otp',timestamp:seconds+1000}]}])assert.equal(validatedTokenHasEmailProof(request(claims),identity,now),false)
  const saved=[];const store={has:async()=>false,save:async value=>saved.push(value)}
  assert.equal(await ensureCustomerEmailProof({request:request({amr:[{method:'password',timestamp:seconds}]}),user:identity,store,now}),false)
  assert.equal(saved.length,0)
  assert.equal(await ensureCustomerEmailProof({request:request({}),user:identity,store,now}),true)
  assert.deepEqual(saved[0],{user_id:identity.id,email:identity.email,verified_at:new Date(now).toISOString()})
  const f=fixture(identity,{authorizeEmail:async()=>false});assert.equal((await f.handler(f.request())).status,403);assert.equal(f.calls.length,0)
})
