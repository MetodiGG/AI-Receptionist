import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { buildStagingBootstrap, STAGING_PROJECT_REF } from '../scripts/prepare-staging.mjs'
import { businessContentSchema } from '../lib/business-content.mjs'

const sql=await readFile(new URL('../supabase/migrations/20261030100000_business_content_and_media.sql',import.meta.url),'utf8')
const b='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',owner='20000000-0000-4000-8000-000000000001',admin='20000000-0000-4000-8000-000000000002',person='30000000-0000-4000-8000-000000000001',foreignPerson='30000000-0000-4000-8000-000000000002',service='40000000-0000-4000-8000-000000000001'
let db
const rows=async(query,args=[])=>(await db.query(query,args)).rows
const revision=async()=>Number((await rows('select content_revision from businesses where id=$1',[b]))[0].content_revision)
const edit=async(section,payload,rev)=>db.query('select edit_business_content($1,$2,$3,$4,$5::jsonb,$6)',[b,admin,rev??await revision(),section,JSON.stringify(payload),'Offline owner-requested edit'])
const media=async(action,id,staffId=null,rev,actor=owner,isAdmin=false)=>db.query('select change_business_media($1,$2,$3,$4,$5,$6,$7::jsonb,false)',[b,actor,isAdmin,rev??await revision(),action,id,JSON.stringify({width:100,height:100,bytes:100,staffId,alt:'Offline photo'})])
const uuid=n=>`50000000-0000-4000-8000-${String(n).padStart(12,'0')}`
async function reset(){
  await db.exec('reset role;truncate businesses,business_content_audit,platform_admin_audit,partner_leads cascade')
  await db.query("insert into businesses(id,owner_id,name,slug,active,platform_status,city_ekatte,city,address,industry) values($1,$3,'Local','local',true,'enabled','68134','София','Test 1','other'),($2,$3,'Other','other',true,'enabled','68134','София','Test 2','other')",[b,other,owner])
  await db.query("insert into staff(id,business_id,name) values($1,$3,'Alex'),($2,$4,'Other Alex')",[person,foreignPerson,b,other])
  await db.query("insert into services(id,business_id,name,price,currency,duration_min) values($1,$2,'Hair',25,'EUR',30)",[service,b])
  await db.query("insert into working_hours(business_id,staff_id,weekday,open_time,close_time) select $1,$2,n,'09:00','18:00' from generate_series(1,7) n",[b,person])
}
test.before(async()=>{
  db=new PGlite({extensions:{btree_gist}})
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;grant all on storage.objects to anon,authenticated;
    create policy fixture_broad_storage_policy on storage.objects for all to authenticated,anon using(true) with check(true);`)
  await db.exec((await buildStagingBootstrap(STAGING_PROJECT_REF)).sql)
  await db.exec(sql)
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'owner@example.com',now()),($2,'admin@example.com',now())",[owner,admin])
})
test.after(async()=>{await db?.close()})
test('additive media migration is repeatable, keeps publication/data intact, creates private bucket and no broad permissions',async()=>{
  await reset();const before=await rows('select id,name,owner_id,platform_status,active,content_revision from businesses order by id')
  await db.exec(sql)
  assert.deepEqual(await rows('select id,name,owner_id,platform_status,active,content_revision from businesses order by id'),before)
  assert.equal((await rows("select public from storage.buckets where id='business-media'"))[0].public,false)
  assert.deepEqual(await rows('select * from business_content_audit'),[])
  for(const role of ['anon','authenticated']){
    await db.exec(`set role ${role}`)
    await assert.rejects(edit('services',[],0),/permission denied/)
    await assert.rejects(media('upload',uuid(1),null,0),/permission denied/)
    await assert.rejects(db.query('select * from business_media'),/permission denied/)
    await assert.rejects(db.query('select * from business_content_audit'),/permission denied/)
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('business-media','bypass.webp')"),/row-level security/)
    await db.query("insert into storage.objects(bucket_id,name) values('unrelated-bucket','allowed-by-existing-policy')")
    await db.exec('reset role')
  }
})
test('admin edits preserve identity/publication and update only explicit business information',async()=>{
  await reset()
  const current=(await rows('select * from businesses where id=$1',[b]))[0]
  const payload=businessContentSchema.parse({...Object.fromEntries(['name','slug','phone','contact_email','address','city_ekatte','neighborhood','industry','timezone','website_url','privacy_contact_email','booking_terms','default_duration_min','booking_slot_minutes','booking_window_days','minimum_notice_minutes','cancellation_notice_hours','email_notifications_enabled','notification_locale','review_requests_enabled','public_profile','welcome_message','bot_instructions'].map(key=>[key,current[key]??(['neighborhood','phone','contact_email','website_url','privacy_contact_email','booking_terms','welcome_message','bot_instructions'].includes(key)?'':current[key])])),name:'Corrected Local',default_duration_min:10})
  await db.exec('set role service_role')
  await edit('business',payload)
  await db.exec('reset role')
  const updated=(await rows('select * from businesses where id=$1',[b]))[0]
  assert.equal(updated.name,'Corrected Local');assert.equal(updated.default_duration_min,10)
  assert.equal(updated.owner_id,owner);assert.equal(updated.platform_status,'enabled')
  assert.equal((await rows('select * from business_content_audit'))[0].actor_id,admin)
})
test('owner and child edits advance revisions; stale admin saves fail instead of overwriting them',async()=>{
  await reset();const old=await revision()
  await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await db.query("update services set name='Owner edit' where id=$1",[service]);await db.exec('reset role')
  assert.ok(await revision()>old)
  await assert.rejects(edit('services',[{id:service,name:'Stale',description:'',category:'',duration_min:10,price:30,active:true,sort_order:0}],old),/CONTENT_CHANGED/)
  assert.equal((await rows('select name from services where id=$1',[service]))[0].name,'Owner edit')
  await db.exec('set role authenticated');await db.query('update businesses set content_revision=0 where id=$1',[b]);await db.exec('reset role')
  assert.ok(await revision()>old)
})
test('cross-tenant staff/service references roll back the entire edit and audit',async()=>{
  await reset();const before=await revision()
  await assert.rejects(edit('services',[{id:service,name:'Must roll back',description:'',category:'',duration_min:10,price:30,active:true,sort_order:0},{id:foreignPerson,name:'Wrong',description:'',category:'',duration_min:10,price:30,active:true,sort_order:1}]),/WRONG_BUSINESS/)
  assert.equal((await rows('select name from services where id=$1',[service]))[0].name,'Hair');assert.equal(await revision(),before)
  await assert.rejects(edit('staff',[{id:foreignPerson,name:'Wrong',email:'',phone:'',bio:'',active:true,sort_order:0}]),/WRONG_BUSINESS/)
  assert.equal((await rows('select * from business_content_audit')).length,0)
})
test('service and staff edits retain row IDs; audit insertion failure rolls all changes back',async()=>{
  await reset()
  await edit('services',[{id:service,name:'Hair 10',description:'Local',category:'Hair',duration_min:10,price:12.5,active:true,sort_order:0}])
  assert.equal((await rows('select duration_min from services where id=$1',[service]))[0].duration_min,10)
  await db.exec("create function fail_content_audit() returns trigger language plpgsql as $$begin raise exception 'AUDIT_FAILED';end$$;create trigger fail_content_audit before insert on business_content_audit for each row execute function fail_content_audit()")
  await assert.rejects(edit('staff',[{id:person,name:'Must roll back',email:'',phone:'',bio:'',active:true,sort_order:0}]),/AUDIT_FAILED/)
  assert.equal((await rows('select name from staff where id=$1',[person]))[0].name,'Alex')
  await db.exec('drop trigger fail_content_audit on business_content_audit;drop function fail_content_audit()')
})
test('schedule edits preserve future bookings and use the same per-business serialization lock',async()=>{
  await reset()
  const customer=(await rows("insert into customers(business_id,name,phone) values($1,'Offline','0000000') returning id",[b]))[0].id
  await db.query("insert into appointments(business_id,staff_id,service_id,customer_id,starts_at,ends_at,status) values($1,$2,$3,$4,((now() at time zone 'Europe/Sofia')::date+1+time '10:00') at time zone 'Europe/Sofia',((now() at time zone 'Europe/Sofia')::date+1+time '10:30') at time zone 'Europe/Sofia','booked')",[b,person,service,customer])
  const before=await rows('select starts_at,ends_at,status from appointments')
  await assert.rejects(edit('hours',{staffId:person,hours:[]}),/SCHEDULE_CONFLICT/)
  assert.deepEqual(await rows('select starts_at,ends_at,status from appointments'),before)
  assert.equal((await rows('select * from working_hours where business_id=$1',[b])).length,7)
  const hours=Array.from({length:7},(_,i)=>({weekday:i+1,open_time:'09:00',close_time:'19:00',break_start:null,break_end:null}))
  await edit('hours',{staffId:person,hours})
  assert.equal((await rows('select close_time::text t from working_hours where business_id=$1 limit 1',[b]))[0].t,'19:00:00')
})
test('photo ownership, current portrait, soft hiding/restoration, cover order and stale revisions are enforced atomically',async()=>{
  await reset()
  await assert.rejects(media('upload',uuid(1),foreignPerson),/WRONG_BUSINESS/)
  await assert.rejects(media('upload',uuid(1),null,undefined,admin,false),/WRONG_BUSINESS/)
  const rev=await revision();await media('upload',uuid(1));await assert.rejects(media('hide',uuid(1),null,rev),/CONTENT_CHANGED/)
  await media('upload',uuid(2));await media('cover',uuid(2));assert.equal((await rows('select id from business_media where staff_id is null and active order by sort_order limit 1'))[0].id,uuid(2))
  await media('upload',uuid(3),person);await media('upload',uuid(4),person)
  assert.equal((await rows('select id from business_media where staff_id=$1 and active',[person]))[0].id,uuid(4))
  await media('restore',uuid(3));assert.equal((await rows('select id from business_media where staff_id=$1 and active',[person]))[0].id,uuid(3))
  await media('hide',uuid(1));assert.equal((await rows('select active from business_media where id=$1',[uuid(1)]))[0].active,false)
  assert.equal((await rows('select media_gallery_managed from businesses where id=$1',[b]))[0].media_gallery_managed,true)
  assert.equal((await rows('select * from business_content_audit')).length,7)
})
test('gallery quota is shared across concurrent access paths; hidden photos remain recoverable and non-public',async()=>{
  await reset()
  for(let n=1;n<=12;n++)await media('upload',uuid(n))
  await assert.rejects(media('upload',uuid(13)),/MEDIA_LIMIT/)
  await media('hide',uuid(1));await media('upload',uuid(13));await assert.rejects(media('restore',uuid(1)),/MEDIA_LIMIT/)
  assert.equal((await rows('select count(*)::int n from business_media where active'))[0].n,12)
  assert.equal((await rows('select count(*)::int n from business_media'))[0].n,13)
})
test('photo application keeps its legacy return value and stable team UUIDs; pending photos remain pending',async()=>{
  await reset()
  const payload={business:{name:'New application',slug:'new-application',phone:'+359888123456',contact_email:'owner@example.com',address:'Test 1',timezone:'Europe/Sofia',industry:'other',city_ekatte:'68134',city:'София',neighborhood:'',default_duration_min:10,booking_slot_minutes:15},email:'owner@example.com',locale:'bg',services:[{name:'Hair',price:20,duration_min:10}],staff:[{id:uuid(20),name:'Same Name'},{id:uuid(21),name:'Same Name'}],hours:[{weekday:1,open_time:'09:00',close_time:'18:00',break_start:null,break_end:null}]}
  const lead=(await rows('select submit_business_application($1,false,$2::jsonb) id',[owner,JSON.stringify(payload)]))[0].id
  const created=(await rows('select business_id from partner_leads where id=$1',[lead]))[0].business_id
  assert.deepEqual((await rows('select id from staff where business_id=$1 order by sort_order',[created])).map(row=>row.id),[uuid(20),uuid(21)])
  const rev=Number((await rows('select content_revision from businesses where id=$1',[created]))[0].content_revision)
  await db.query("select change_business_media($1,$2,false,$3,'upload',$4,$5::jsonb,true)",[created,owner,rev,uuid(22),JSON.stringify({width:100,height:100,bytes:100,staffId:uuid(21),alt:''})])
  assert.equal((await rows('select platform_status from businesses where id=$1',[created]))[0].platform_status,'pending')
  assert.equal((await rows('select staff_id from business_media where id=$1',[uuid(22)]))[0].staff_id,uuid(21))
})
test('business deletion queues exact related photo keys but hiding preserves photos for restoration',async()=>{
  await reset();await db.exec('truncate business_media_cleanup')
  await media('upload',uuid(1));await media('hide',uuid(1))
  assert.equal((await rows('select * from business_media_cleanup')).length,0)
  await db.query('delete from businesses where id=$1',[b])
  assert.equal((await rows('select object_key from business_media_cleanup'))[0].object_key,`${b}/${uuid(1)}.webp`)
  assert.equal((await rows('select * from businesses where id=$1',[other])).length,1)
  assert.equal((await rows('select * from auth.users')).length,2)
})
test('migration adopts existing curated photos once; uploads append, hidden state survives reapply and static assets never enter Storage cleanup',async()=>{
  await reset();await db.exec('truncate business_media_cleanup')
  const vesi='450c5c2f-db41-476b-a21e-98cf5ee29194',interior='450c5c2f-db41-476b-a21e-98cf5ee29195',entrance='450c5c2f-db41-476b-a21e-98cf5ee29196'
  await db.query("insert into businesses(id,owner_id,name,slug,active,platform_status,city_ekatte,city,address,industry) values($1,$2,'Existing Vesi','existing-vesi',true,'enabled','68134','София','Existing address','beauty')",[vesi,owner])
  const before=await rows('select id,owner_id,name,slug,address,platform_status,active from businesses where id=$1',[vesi])
  await db.exec(sql)
  assert.deepEqual(await rows('select id,owner_id,name,slug,address,platform_status,active from businesses where id=$1',[vesi]),before)
  assert.deepEqual((await rows('select id,byte_size from business_media where business_id=$1 order by sort_order',[vesi])),[{id:interior,byte_size:174754},{id:entrance,byte_size:221338}])
  const vrev=async()=>Number((await rows('select content_revision from businesses where id=$1',[vesi]))[0].content_revision)
  const vm=async(action,id,image=null)=>db.query('select change_business_media($1,$2,false,$3,$4,$5,$6::jsonb,false)',[vesi,owner,await vrev(),action,id,JSON.stringify(image)])
  await vm('upload',uuid(30),{width:100,height:100,bytes:100,alt:''})
  assert.deepEqual((await rows('select id from business_media where business_id=$1 order by sort_order',[vesi])).map(row=>row.id),[interior,entrance,uuid(30)])
  await vm('hide',interior)
  const savedRev=await vrev();await db.exec(sql)
  assert.equal(await vrev(),savedRev);assert.equal((await rows('select active from business_media where id=$1',[interior]))[0].active,false)
  await assert.rejects(db.query("update business_media set curated_src='https://example.com/not-allowed.webp' where id=$1",[entrance]),/check constraint/)
  await vm('cover',entrance)
  await db.query('delete from businesses where id=$1',[vesi])
  assert.deepEqual((await rows('select object_key from business_media_cleanup')).map(row=>row.object_key),[`${vesi}/${uuid(30)}.webp`])
})
