import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const migration=await readFile(new URL('../supabase/migrations/20261112153000_registration_address_lookup.sql',import.meta.url),'utf8')
const owner='10000000-0000-4000-8000-000000000001'
const first='20000000-0000-4000-8000-000000000001',second='20000000-0000-4000-8000-000000000002',third='20000000-0000-4000-8000-000000000003'
const point={latitude:42.6650291,longitude:23.2825296,source_url:'https://www.openstreetmap.org/way/123456',licence:'ODbL-1.0',attribution:'© OpenStreetMap contributors'}
let db,before
const rows=async(sql,args=[])=>(await db.query(sql,args)).rows
const claim=async(id=first)=>(await rows('select claim_registration_address_lookup($1) as result',[id]))[0].result
const finish=async(c,status='matched',result=point,patch={})=>(await rows('select finish_registration_address_lookup($1,$2,$3,$4,$5::jsonb,$6) as result',[c.business?.id||first,c.address_key,c.claim_token,status,result===null?null:JSON.stringify(result),patch.retryAfter??null]))[0].result
const lookupProfile=async(id=first)=>(await rows('select public_profile from businesses where id=$1',[id]))[0]?.public_profile
async function asRole(role,action){await db.exec(`set role ${role}`);try{return await action()}finally{await db.exec('reset role')}}
const unlock=()=>db.exec("update registration_address_lookup_gate set next_allowed_at='-infinity',locked_until=null,claim_token=null")
async function reset(){
  await db.exec('reset role;truncate registration_address_lookup_cache,registration_location_sources;')
  await db.exec("update registration_address_lookup_gate set next_allowed_at='-infinity',locked_until=null,claim_token=null,requests=0,request_day=(now() at time zone 'UTC')::date")
  await db.query("update businesses set address=case when id=$2 then 'Пирин 44' else 'Пирин 42' end,city_ekatte='68134',city='София',neighborhood='Манастирски ливади',public_profile=$1::jsonb,active=false,platform_status='pending'",[JSON.stringify({description:{bg:'Existing description',en:''},payments:['card'],latitude:null,longitude:null}),second])
}
test.before(async()=>{
  db=new PGlite()
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
    create schema auth;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
    create table businesses(id uuid primary key,owner_id uuid,city_ekatte text,city text,neighborhood text,address text,public_profile jsonb,active boolean,platform_status text);
    alter table businesses enable row level security;
    create policy owner on businesses for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
    create policy published on businesses for select to anon,authenticated using(active and platform_status='enabled');
    revoke all on businesses from anon,authenticated;grant select on businesses to anon;grant select,update on businesses to authenticated;grant all on businesses to service_role;
    create table notification_outbox(id int,status text);insert into notification_outbox values(1,'pending');`)
  for(const id of [first,second,third])await db.query("insert into businesses values($1,$2,'68134','София','Манастирски ливади','Пирин 42','{}',false,'pending')",[id,owner])
  before={businesses:await rows('select * from businesses order by id'),security:await rows("select relrowsecurity,relacl::text from pg_class where oid='businesses'::regclass"),policies:await rows("select policyname,roles,cmd,qual,with_check from pg_policies where tablename='businesses' order by policyname")}
  await db.exec(migration)
})
test.after(async()=>{await db?.close()})

test('additive lookup migration preserves all existing business data, RLS/ACL/policies and visit notifications',async()=>{
  assert.deepEqual(await rows('select * from businesses order by id'),before.businesses)
  assert.deepEqual(await rows("select relrowsecurity,relacl::text from pg_class where oid='businesses'::regclass"),before.security)
  assert.deepEqual(await rows("select policyname,roles,cmd,qual,with_check from pg_policies where tablename='businesses' order by policyname"),before.policies)
  assert.deepEqual(await rows('select * from notification_outbox'),[{id:1,status:'pending'}])
  assert.equal((await rows('select count(*)::int as n from registration_address_lookup_cache'))[0].n,0)
  assert.equal((await rows('select count(*)::int as n from registration_location_sources'))[0].n,0)
})

test('real claim uses persisted address, a private fingerprint, one token and a bounded shared HTTP budget',async()=>{
  await reset()
  const c=await asRole('service_role',()=>claim())
  assert.equal(c.state,'claimed');assert.match(c.address_key,/^[0-9a-f]{32}$/);assert.match(c.claim_token,/^[a-f0-9-]{36}$/)
  assert.deepEqual(c.business,{id:first,city_ekatte:'68134',city:'София',neighborhood:'Манастирски ливади',address:'Пирин 42'})
  const [gate]=await rows('select requests,extract(epoch from next_allowed_at-now()) as spacing,extract(epoch from locked_until-now()) as lease from registration_address_lookup_gate')
  assert.equal(gate.requests,1);assert.ok(Number(gate.spacing)>14&&Number(gate.spacing)<=15);assert.ok(Number(gate.lease)>9&&Number(gate.lease)<=10)
  assert.equal((await claim()).state,'throttled');assert.equal((await claim(second)).state,'throttled')
  assert.equal((await rows('select requests from registration_address_lookup_gate'))[0].requests,1)
})

test('matched finish merges only the actual point, preserves profile data and stores exact source/licence metadata atomically',async()=>{
  await reset();const beforeProfile=await lookupProfile(),c=await claim()
  assert.deepEqual(await asRole('service_role',()=>finish(c)),{state:'matched',applied:true})
  assert.deepEqual(await lookupProfile(),{...beforeProfile,latitude:point.latitude,longitude:point.longitude})
  const [source]=await rows('select business_id,latitude,longitude,source_url,licence,attribution from registration_location_sources')
  assert.equal(source.business_id,first);assert.equal(Number(source.latitude),point.latitude);assert.equal(Number(source.longitude),point.longitude)
  assert.equal(source.source_url,point.source_url);assert.equal(source.licence,'ODbL-1.0');assert.equal(source.attribution,point.attribution)
  assert.equal((await claim()).state,'already_set')
  assert.deepEqual(await finish(c),{state:'stale_claim',applied:false})
  assert.equal((await rows('select claim_token from registration_address_lookup_gate'))[0].claim_token,null)
})

test('same public address reuses the thirty-day cache without another HTTP reservation, even during global cooldown',async()=>{
  await reset();const c=await claim();await finish(c)
  await db.exec("update registration_address_lookup_cache set expires_at=now()+interval '2 days',verified_at=now()-interval '28 days'")
  const beforeCache=(await rows('select expires_at,verified_at from registration_address_lookup_cache'))[0]
  const cached=await claim(third)
  assert.equal(cached.state,'cached');assert.deepEqual(cached.result,point)
  assert.notEqual(cached.claim_token,c.claim_token)
  assert.equal((await rows('select requests from registration_address_lookup_gate'))[0].requests,1)
  assert.deepEqual(await finish(cached,'matched',cached.result),{state:'matched',applied:true})
  assert.equal((await lookupProfile(third)).latitude,point.latitude)
  assert.deepEqual((await rows('select expires_at,verified_at from registration_address_lookup_cache'))[0],beforeCache,'cache reuse must not postpone provider revalidation indefinitely')
  assert.deepEqual((await rows('select checked_at from registration_location_sources where business_id=$1',[third]))[0].checked_at,beforeCache.verified_at)
})

test('a cached finish cannot release another provider claim; a shared address has only one live claim',async()=>{
  await reset();await finish(await claim());await unlock()
  const provider=await claim(second),cached=await claim(third)
  assert.equal(provider.state,'claimed');assert.equal(cached.state,'cached')
  await finish(cached,'matched',cached.result)
  assert.equal((await rows('select claim_token from registration_address_lookup_gate'))[0].claim_token,provider.claim_token)
  await finish(provider,'no_match',null)
  assert.equal((await rows('select claim_token from registration_address_lookup_gate'))[0].claim_token,null)
  await reset()
  const concurrent=await Promise.all([claim(first),claim(third)])
  assert.deepEqual(concurrent.map(c=>c.state).sort(),['claimed','throttled'])
  assert.equal((await rows('select requests from registration_address_lookup_gate'))[0].requests,1)
})

test('a rolled-back finish cannot leave a point, source record or completed cache behind',async()=>{
  await reset();const c=await claim(),beforeProfile=await lookupProfile()
  await db.exec('begin')
  assert.deepEqual(await finish(c),{state:'matched',applied:true})
  assert.equal((await rows('select count(*)::int as n from registration_location_sources'))[0].n,1)
  await db.exec('rollback')
  assert.deepEqual(await lookupProfile(),beforeProfile)
  assert.equal((await rows('select count(*)::int as n from registration_location_sources'))[0].n,0)
  assert.equal((await rows('select status,claim_token from registration_address_lookup_cache'))[0].status,'processing')
  assert.equal((await rows('select claim_token from registration_address_lookup_cache'))[0].claim_token,c.claim_token)
})

test('non-matches and technical failures keep coordinates unknown and cache differently instead of blocking business registration',async()=>{
  for(const [status,low,high] of [['no_match',86390,86400],['failed',290,300]]){
    await reset();const c=await claim();assert.deepEqual(await finish(c,status,null),{state:status,applied:false})
    assert.equal((await lookupProfile()).latitude,null);assert.equal((await claim()).state,'review_required')
    const [cache]=await rows('select extract(epoch from expires_at-now()) as ttl,result from registration_address_lookup_cache')
    assert.ok(Number(cache.ttl)>low&&Number(cache.ttl)<=high);assert.equal(cache.result,null)
  }
})

test('expired cache or claim can be retried only by a subsequent explicit claim; stale token cannot overwrite a newer lookup',async()=>{
  await reset();const old=await claim()
  await db.exec("update registration_address_lookup_cache set locked_until=now()-interval '1 second';update registration_address_lookup_gate set locked_until=now()-interval '1 second',next_allowed_at=now()-interval '1 second'")
  const current=await claim();assert.equal(current.state,'claimed');assert.notEqual(current.claim_token,old.claim_token)
  assert.deepEqual(await finish(old),{state:'stale_claim',applied:false})
  assert.equal((await lookupProfile()).latitude,null);assert.equal((await rows('select claim_token from registration_address_lookup_gate'))[0].claim_token,current.claim_token)
  await finish(current,'failed',null)
  await db.exec("update registration_address_lookup_cache set expires_at=now()-interval '1 second'");await unlock()
  assert.equal((await claim()).state,'claimed')
})

test('a changed address or manual point during lookup is never overwritten, but the old exact-address cache may be retained',async()=>{
  await reset();const old=await claim()
  await db.query("update businesses set address='Пирин 99' where id=$1",[first])
  assert.deepEqual(await finish(old),{state:'stale_address',applied:false});assert.equal((await lookupProfile()).latitude,null)
  assert.equal((await rows('select count(*)::int as n from registration_location_sources'))[0].n,0)
  await reset();const pending=await claim()
  await db.query("update businesses set public_profile=public_profile||'{\"latitude\":42.7,\"longitude\":23.3}'::jsonb where id=$1",[first])
  assert.deepEqual(await finish(pending),{state:'already_set',applied:false});assert.equal((await lookupProfile()).latitude,42.7)
  assert.equal((await rows('select count(*)::int as n from registration_location_sources'))[0].n,0)
})

test('only strict numeric Bulgarian results with authentic OSM source/licence fields can be stored',async()=>{
  await reset();const c=await claim()
  for(const invalid of [null,{...point,latitude:'42.6'},{...point,latitude:0},{...point,longitude:90},{...point,source_url:'https://evil.example/way/1'},{...point,source_url:'https://www.openstreetmap.org/way/1?tracking=yes'},{...point,licence:'none'},{...point,attribution:''},{...point,privateAddress:'must not persist'}])await assert.rejects(finish(c,'matched',invalid),/INVALID_ADDRESS_LOOKUP_RESULT/)
  await assert.rejects(finish(c,'failed',point),/INVALID_ADDRESS_LOOKUP_RESULT/)
  await assert.rejects(finish(c,'failed',null,{retryAfter:3601}),/INVALID_ADDRESS_LOOKUP_RESULT/)
  assert.equal((await lookupProfile()).latitude,null)
  assert.equal((await rows('select count(*)::int as n from registration_location_sources'))[0].n,0)
})

test('provider cooldown is application-wide and daily cap resets only on a new UTC day',async()=>{
  await reset();const c=await claim();await finish(c,'failed',null,{retryAfter:300})
  assert.equal((await claim(second)).state,'throttled')
  assert.ok(Number((await rows('select extract(epoch from next_allowed_at-now()) as n from registration_address_lookup_gate'))[0].n)>299)
  await unlock();await db.exec('update registration_address_lookup_gate set requests=250')
  assert.equal((await claim(second)).state,'throttled')
  await db.exec("update registration_address_lookup_gate set request_day=(now() at time zone 'UTC')::date-1")
  assert.equal((await claim(second)).state,'claimed');assert.equal((await rows('select requests from registration_address_lookup_gate'))[0].requests,1)
})

test('public roles cannot read private lookup records or invoke RPCs, and source rows appear only for published still-matching points',async()=>{
  await reset();await finish(await claim())
  for(const role of ['anon','authenticated'])await asRole(role,async()=>{
    for(const sql of ['select * from registration_address_lookup_cache','select * from registration_address_lookup_gate',`select claim_registration_address_lookup('${first}')`,`select finish_registration_address_lookup('${first}','key',gen_random_uuid(),'failed')`])await assert.rejects(db.query(sql),/permission denied/)
    assert.equal((await rows('select * from registration_location_sources')).length,0)
    await assert.rejects(db.query('delete from registration_location_sources'),/permission denied/)
  })
  await db.query("update businesses set active=true,platform_status='enabled' where id=$1",[first])
  assert.equal((await asRole('anon',()=>rows('select * from registration_location_sources'))).length,1)
  await db.query("update businesses set public_profile=public_profile||'{\"latitude\":42.7}'::jsonb where id=$1",[first])
  assert.equal((await asRole('anon',()=>rows('select * from registration_location_sources'))).length,0)
  await asRole('service_role',async()=>{
    await assert.rejects(db.query("insert into registration_address_lookup_gate(singleton) values(false)"),/permission denied/)
    await assert.rejects(db.query('delete from registration_address_lookup_cache'),/permission denied/)
    await assert.rejects(db.query(`insert into registration_location_sources values('${second}','00000000000000000000000000000000',42.6,23.3,'https://www.openstreetmap.org/node/1','ODbL-1.0','© OpenStreetMap contributors',now())`),/permission denied/)
  })
})

test('future street/city/quarter edits invalidate only the unchanged provider pin while profile-only edits preserve it',async()=>{
  for(const mutation of ["address='Пирин 99'","city_ekatte='10135',city='Варна'","neighborhood='Бояна'"]){
    await reset();await finish(await claim())
    await db.query("update businesses set public_profile=public_profile||'{\"description\":{\"bg\":\"New text\"}}'::jsonb where id=$1",[first])
    assert.equal((await lookupProfile()).latitude,point.latitude)
    assert.equal((await rows('select count(*)::int as n from registration_location_sources'))[0].n,1)
    await db.exec(`update businesses set ${mutation}`)
    assert.equal((await lookupProfile()).latitude,null);assert.equal((await lookupProfile()).longitude,null)
    assert.equal((await lookupProfile()).description.bg,'New text')
    assert.equal((await rows('select count(*)::int as n from registration_location_sources'))[0].n,0)
  }
  await reset();await finish(await claim())
  await db.query("update businesses set address='New venue 1',public_profile=public_profile||'{\"latitude\":42.7,\"longitude\":23.3}'::jsonb where id=$1",[first])
  assert.equal((await lookupProfile()).latitude,42.7);assert.equal((await lookupProfile()).longitude,23.3)
  assert.equal((await rows('select count(*)::int as n from registration_location_sources'))[0].n,0)
  await reset()
  await db.query("update businesses set public_profile='{\"latitude\":42.7,\"longitude\":23.3}'::jsonb where id=$1",[first])
  await db.query("update businesses set address='Manual venue 2' where id=$1",[first])
  assert.equal((await lookupProfile()).latitude,42.7,'a manually sourced point is never rewritten by the new trigger')
})

test('missing, archived, incomplete and malformed businesses require review without consuming provider budget',async()=>{
  await reset()
  assert.equal((await claim('20000000-0000-4000-8000-000000000099')).state,'missing')
  for(const sql of ["address=''","city_ekatte=''","platform_status='archived'","public_profile='[]'::jsonb"]){
    await reset();await db.exec(`update businesses set ${sql}`);assert.equal((await claim()).state,'review_required')
    assert.equal((await rows('select requests from registration_address_lookup_gate'))[0].requests,0)
  }
})

test('reapplying the migration preserves actual matched cache/source records and does not reset the global budget',async()=>{
  await reset();await finish(await claim());const previous={cache:await rows('select * from registration_address_lookup_cache'),source:await rows('select * from registration_location_sources'),gate:await rows('select * from registration_address_lookup_gate'),business:await rows('select * from businesses order by id')}
  await db.exec(migration)
  assert.deepEqual(await rows('select * from registration_address_lookup_cache'),previous.cache)
  assert.deepEqual(await rows('select * from registration_location_sources'),previous.source)
  assert.deepEqual(await rows('select * from registration_address_lookup_gate'),previous.gate)
  assert.deepEqual(await rows('select * from businesses order by id'),previous.business)
  assert.deepEqual(await rows("select relrowsecurity from pg_class where relname in ('registration_address_lookup_cache','registration_address_lookup_gate','registration_location_sources') order by relname"),[{relrowsecurity:true},{relrowsecurity:true},{relrowsecurity:true}])
})
