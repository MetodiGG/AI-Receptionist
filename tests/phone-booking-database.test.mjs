import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { buildStagingBootstrap,STAGING_PROJECT_REF } from '../scripts/prepare-staging.mjs'
import { emptyOpeningHours,safeBookingPhone } from '../lib/booking-mode.mjs'
const owner='20000000-0000-4000-8000-000000000001',admin='20000000-0000-4000-8000-000000000002',other='20000000-0000-4000-8000-000000000003'
let db,legacy,legacyBefore
const rows=async(sql,args=[])=>(await db.query(sql,args)).rows
const read=name=>readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8')
const input=(patch={})=>({business:{name:'Offline phone application',slug:'offline-phone',phone:'+359 (888) 123-456',contact_email:'owner@example.com',address:'Local only 1',timezone:'Europe/Sofia',industry:'beauty',city_ekatte:'68134',city:'София',neighborhood:'',booking_mode:'phone',opening_hours:emptyOpeningHours(),...patch},email:'owner@example.com',locale:'bg',services:[{name:'Real published range',price:20,currency:'BGN',price_details:{kind:'range',maximum:40,unit:'сеанс'},description:'Публикувани условия',duration_min:null},{name:'Price not published',price:null,duration_min:null}],staff:[],hours:[]})
const submit=async(value=input(),activate=false)=>{const lead=(await rows('select submit_business_application($1,$2,$3::jsonb) id',[owner,activate,JSON.stringify(value)]))[0].id;return (await rows('select business_id from partner_leads where id=$1',[lead]))[0].business_id}
const revision=async bid=>Number((await rows('select content_revision from businesses where id=$1',[bid]))[0].content_revision)
const settings=async(bid,mode,ack=false,actor=owner,rev=null)=>db.query('select save_booking_settings($1,$2,false,$3,$4,$5,$6,$7::jsonb,$8)',[bid,actor,rev??await revision(bid),mode,'https://booking.example.com/slots',mode==='external',JSON.stringify(emptyOpeningHours()),ack])
const reset=()=>db.exec('reset role;truncate businesses,partner_leads,business_content_audit,platform_admin_audit cascade')
test.before(async()=>{
 db=new PGlite({extensions:{btree_gist}})
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;`)
 await db.exec((await buildStagingBootstrap(STAGING_PROJECT_REF)).sql)
 for(const name of ['20261030100000_business_content_and_media.sql','20261104170000_external_booking_modes.sql','20261104171000_external_business_applications.sql','20261111190000_service_price_details.sql'])await db.exec(await read(name))
 await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'owner@example.com',now()),($2,'admin@example.com',now()),($3,'other@example.com',now())",[owner,admin,other])
 legacy=(await rows("insert into businesses(owner_id,name,slug,phone,platform_status) values($1,'Legacy fixture','legacy-fixture','0888123456','pending') returning id",[owner]))[0].id
 await db.query("insert into services(business_id,name,price,duration_min) values($1,'Unchanged service',25,30)",[legacy])
 legacyBefore=await rows('select b.*,to_jsonb(s) service from businesses b join services s on s.business_id=b.id')
 await db.exec(await read('20261112100000_phone_booking_mode.sql'))
})
test.after(async()=>{await db?.close()})
test('additive phone migration changes no legacy data or pricing',async()=>{assert.deepEqual(await rows('select b.*,to_jsonb(s) service from businesses b join services s on s.business_id=b.id'),legacyBefore)})
test('SQL and JS phone validation match, reject dial controls and do not invent country codes',async()=>{
 for(const number of ['+359 (888) 123-456','0888 123 456','1234567','+123456789012345','123','+359888123456;ext=1','tel:+359888123456','+359888123456,1','*1234567#','1234567\n','12+345678','https://example.com',null])assert.equal((await rows('select valid_booking_phone($1) valid',[number]))[0].valid,Boolean(safeBookingPhone(number)),String(number))
})
test('phone application needs no staff or calendar, retains real pricing and remains pending',async()=>{
 await reset();const bid=await submit(),b=(await rows('select * from businesses where id=$1',[bid]))[0]
 assert.equal(b.booking_mode,'phone');assert.equal(b.platform_status,'pending');assert.equal(b.external_booking_url,null);assert.equal(b.external_booking_consent_at,null)
 for(const table of ['staff','working_hours','appointments','customers'])assert.equal((await rows(`select count(*)::int n from ${table} where business_id=$1`,[bid]))[0].n,0)
 const s=await rows('select * from services where business_id=$1 order by sort_order',[bid]);assert.equal(Number(s[0].price),20);assert.equal(s[0].currency,'BGN');assert.deepEqual(s[0].price_details,{kind:'range',maximum:40,unit:'сеанс'});assert.equal(s[0].description,'Публикувани условия');assert.equal(s[1].price,null);assert.equal(s[1].duration_min,null)
 await db.query("select platform_business_action($1,$2,'publish',0,'offline-phone','Offline approval')",[bid,admin]);assert.equal((await rows('select platform_status from businesses where id=$1',[bid]))[0].platform_status,'enabled')
 await assert.rejects(db.query("insert into appointments(business_id,starts_at,ends_at,status) values($1,now(),now()+interval '1 hour','booked')",[bid]),/PHONE_BOOKING/)
 await assert.rejects(db.query("update businesses set phone=null where id=$1",[bid]),/phone_booking_destination_check/)
 await assert.rejects(settings(bid,'gorez'),/INTERNAL_SETUP_REQUIRED/)
})
test('malformed phone applications roll back atomically, including invalid metadata and cross-account identity',async()=>{
 await reset();for(const patch of [{business:{...input().business,phone:'*1234567#'}},{services:[]},{staff:null},{hours:null},{services:[{name:'Invalid range',price:20,price_details:{kind:'range',maximum:10}}]},{email:'other@example.com'}])await assert.rejects(submit({...input(),...patch}))
 assert.equal((await rows('select count(*)::int n from businesses'))[0].n,0);assert.equal((await rows('select count(*)::int n from partner_leads'))[0].n,0)
})
test('phone moderation preserves owner activation, confirmation, revision and archive guards',async()=>{
 await reset();await db.query('update auth.users set email_confirmed_at=null where id=$1',[owner]);const bid=await submit(input(),true)
 await assert.rejects(db.query("select platform_business_action($1,$2,'publish',0,'offline-phone','Offline approval')",[bid,admin]),/OWNER_ACTIVATION_REQUIRED/)
 await db.query('update auth.users set email_confirmed_at=now() where id=$1',[owner]);await assert.rejects(db.query("select platform_business_action($1,$2,'publish',0,'wrong-slug','Offline approval')",[bid,admin]),/CONFIRMATION_MISMATCH/)
 await db.query("select platform_business_action($1,$2,'publish',0,'offline-phone','Offline approval')",[bid,admin]);await assert.rejects(db.query("select platform_business_action($1,$2,'publish',0,'offline-phone','Offline approval')",[bid,admin]),/BUSINESS_CHANGED/)
})
test('switching to phone requires real stored phone, ownership, fresh revision and future-visit acknowledgement; preserves visits',async()=>{
 await reset();const bid=(await rows("insert into businesses(owner_id,name,slug,platform_status) values($1,'Existing native','existing-native','enabled') returning id",[owner]))[0].id
 await assert.rejects(settings(bid,'phone'),/BOOKING_PHONE_REQUIRED/);await db.query("update businesses set phone='0888123456' where id=$1",[bid])
 const sid=(await rows("insert into services(business_id,name,price,duration_min) values($1,'Service',25,30) returning id",[bid]))[0].id,person=(await rows("insert into staff(business_id,name) values($1,'Real specialist') returning id",[bid]))[0].id,customer=(await rows("insert into customers(business_id,name) values($1,'Offline customer') returning id",[bid]))[0].id
 await db.query("insert into working_hours(business_id,staff_id,weekday,open_time,close_time) select $1,$2,d,'09:00','18:00' from generate_series(1,7)d",[bid,person])
 const visit=(await rows("insert into appointments(business_id,staff_id,service_id,customer_id,starts_at,ends_at,status,source) values($1,$2,$3,$4,((current_date+7)+time '10:00') at time zone 'Europe/Sofia',((current_date+7)+time '10:30') at time zone 'Europe/Sofia','confirmed','web') returning *",[bid,person,sid,customer]))[0]
 await assert.rejects(settings(bid,'phone',true,other),/FORBIDDEN/);await assert.rejects(settings(bid,'phone'),/ACKNOWLEDGE_UPCOMING_BOOKINGS/);const old=await revision(bid);await settings(bid,'phone',true);assert.deepEqual((await rows('select * from appointments where id=$1',[visit.id]))[0],visit)
 assert.equal((await rows('select count(*)::int n from working_hours where business_id=$1',[bid]))[0].n,7);await assert.rejects(settings(bid,'external',true,owner,old),/CONTENT_CHANGED/)
 await db.query("update appointments set status='done' where id=$1",[visit.id]);await settings(bid,'gorez',true);assert.equal((await rows('select booking_mode from businesses where id=$1',[bid]))[0].booking_mode,'gorez')
})
test('browser roles cannot invoke write RPCs/private wrappers or change mode; existing tenant RLS remains enabled',async()=>{
 await reset();const bid=await submit();for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await assert.rejects(settings(bid,'external',true,owner,0),/permission denied/);await assert.rejects(db.query("select submit_business_application($1,false,$2::jsonb)",[owner,JSON.stringify(input())]),/permission denied/);await assert.rejects(db.query("select submit_business_application_before_phone($1,false,$2::jsonb)",[owner,JSON.stringify(input())]),/permission denied/);if(role==='authenticated')await assert.rejects(db.query("update businesses set booking_mode='external' where id=$1",[bid]),/BOOKING_SETTINGS_SERVER_ONLY/);await db.exec('reset role')}
 assert.equal((await rows("select relrowsecurity from pg_class where oid='public.businesses'::regclass"))[0].relrowsecurity,true)
})
test('native and external registration delegates remain functional with unchanged prices and rules',async()=>{
 await reset();const external={...input({booking_mode:'external',external_booking_url:'https://booking.example.com/slots',external_booking_consent:true}),services:[{name:'External unknown',price:null,duration_min:null}]};const bid=await submit(external);assert.equal((await rows('select booking_mode from businesses where id=$1',[bid]))[0].booking_mode,'external');await assert.rejects(db.query("insert into appointments(business_id,starts_at,ends_at,status) values($1,now(),now()+interval '1 hour','booked')",[bid]),/EXTERNAL_BOOKING/)
 await reset();const native={...input({booking_mode:'gorez',default_duration_min:30,booking_slot_minutes:15}),services:[{name:'Native fixed',price:30,duration_min:30}],staff:[{name:'Native specialist'}],hours:[{weekday:1,open_time:'09:00',close_time:'18:00',break_start:null,break_end:null}]};const nid=await submit(native);assert.equal((await rows('select booking_mode from businesses where id=$1',[nid]))[0].booking_mode,'gorez');assert.equal((await rows('select count(*)::int n from working_hours where business_id=$1',[nid]))[0].n,1)
})
