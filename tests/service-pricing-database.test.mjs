import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { buildStagingBootstrap, STAGING_PROJECT_REF } from '../scripts/prepare-staging.mjs'
import { emptyOpeningHours } from '../lib/booking-mode.mjs'

const owner='20000000-0000-4000-8000-000000000001',admin='20000000-0000-4000-8000-000000000002'
const migration = '20261111190000_service_price_details.sql'
const read = name => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8')
let db, legacyBefore
const rows = async (sql,args=[]) => (await db.query(sql,args)).rows
const input = (services, external=false) => ({ business: { name:'Offline pricing application',slug:'offline-pricing',phone:'+359888123456',contact_email:'owner@example.com',address:'Local only 1',timezone:'Europe/Sofia',industry:'beauty',city_ekatte:'68134',city:'София',neighborhood:'',default_duration_min:45,booking_slot_minutes:15,...(external?{booking_mode:'external',external_booking_url:'https://booking.example.com/appointments',external_booking_consent:true,opening_hours:emptyOpeningHours()}: {}) },email:'owner@example.com',locale:'bg',services,staff:external?[]:[{name:'Offline specialist'}],hours:external?[]:[{weekday:1,open_time:'09:00',close_time:'18:00',break_start:null,break_end:null}] })
const submit = async value => { const lid=(await rows('select submit_business_application($1,false,$2::jsonb) id',[owner,JSON.stringify(value)]))[0].id;return (await rows('select business_id from partner_leads where id=$1',[lid]))[0].business_id }
const reset = () => db.exec('reset role;truncate businesses,partner_leads,business_content_audit,platform_admin_audit cascade')
const revision = async bid => Number((await rows('select content_revision from businesses where id=$1',[bid]))[0].content_revision)
const edit = async (bid,payload,rev) => db.query("select edit_business_content($1,$2,$3,'services',$4::jsonb,'Offline price details test')",[bid,admin,rev??await revision(bid),JSON.stringify(payload)])
test.before(async()=>{
 db=new PGlite({extensions:{btree_gist}})
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;`)
 await db.exec((await buildStagingBootstrap(STAGING_PROJECT_REF)).sql)
 for(const name of ['20261030100000_business_content_and_media.sql','20261104170000_external_booking_modes.sql','20261104171000_external_business_applications.sql'])await db.exec(await read(name))
 await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'owner@example.com',now()),($2,'admin@example.com',now())",[owner,admin])
 const old=await submit(input([{name:'Old fixed service',price:25,duration_min:45}]))
 legacyBefore=await rows('select b.id,b.name,b.platform_status,b.content_revision,s.price,s.currency,s.duration_min from businesses b join services s on s.business_id=b.id where b.id=$1',[old])
 await db.exec(await read(migration))
})
test.after(async()=>{await db?.close()})

test('additive migration leaves existing prices, durations, publication and revisions intact',async()=>{
 assert.deepEqual(await rows('select b.id,b.name,b.platform_status,b.content_revision,s.price,s.currency,s.duration_min from businesses b join services s on s.business_id=b.id'),legacyBefore)
 assert.deepEqual((await rows('select price_details from services'))[0].price_details,{})
})
test('old registration inputs remain fixed EUR with unchanged moderation and real schedule',async()=>{
 await reset();const bid=await submit(input([{name:'Old fixed service',price:25,duration_min:45}]))
 const service=(await rows('select * from services where business_id=$1',[bid]))[0]
 assert.equal(Number(service.price),25);assert.equal(service.currency,'EUR');assert.equal(service.duration_min,45);assert.deepEqual(service.price_details,{})
 assert.equal((await rows('select platform_status from businesses where id=$1',[bid]))[0].platform_status,'pending')
 assert.equal((await rows('select count(*)::int n from working_hours where business_id=$1',[bid]))[0].n,1)
})
test('native application atomically preserves from/range, per-procedure fees, BGN and conditional descriptions without converting',async()=>{
 await reset();const fees=[{name:'Range in BGN',price:40,currency:'BGN',duration_min:30,description:'Материалите се плащат отделно.',price_details:{kind:'range',maximum:80,unit:'процедура'}},{name:'From EUR',price:20.45,currency:'EUR',duration_min:45,description:'Само при онлайн записване.',price_details:{kind:'from'}}]
 const bid=await submit(input(fees));const saved=await rows('select name,price,currency,duration_min,description,price_details from services where business_id=$1 order by sort_order',[bid])
 assert.deepEqual(saved.map(row=>({...row,price:Number(row.price)})),fees)
 const summary=(await rows('select setup_summary from partner_leads where business_id=$1',[bid]))[0].setup_summary
 assert.deepEqual(summary.services,fees)
})
test('external application keeps genuinely missing amounts/durations unknown, never zero or invented schedules',async()=>{
 await reset();const bid=await submit(input([{name:'Unknown external service',price:null,duration_min:null,currency:'EUR',description:'Уточняване при заявка.',price_details:{}}],true))
 const service=(await rows('select * from services where business_id=$1',[bid]))[0]
 assert.equal(service.price,null);assert.equal(service.duration_min,null);assert.equal(service.description,'Уточняване при заявка.')
 assert.equal((await rows('select count(*)::int n from working_hours where business_id=$1',[bid]))[0].n,0)
})
test('invalid metadata or inventory ambiguity rolls the entire application back',async()=>{
 await reset()
 for(const price_details of [{kind:'range',maximum:10},{kind:'range'},{kind:'from',maximum:80},{kind:'fixed',unit:'x'.repeat(101)}])await assert.rejects(submit(input([{name:'Bad service',price:20,duration_min:30,price_details}])),/INVALID_SERVICE_PRICE/)
 assert.equal((await rows('select count(*)::int n from businesses'))[0].n,0)
 await db.exec("create function pricing_scramble_inventory() returns trigger language plpgsql as $$begin new.sort_order:=0;return new;end$$;create trigger pricing_scramble_inventory before insert on services for each row execute function pricing_scramble_inventory()")
 try{await assert.rejects(submit(input([{name:'First service',price:20,duration_min:30},{name:'Second service',price:30,duration_min:30}])),/SERVICE_INVENTORY_CHANGED/)}finally{await db.exec('drop trigger pricing_scramble_inventory on services;drop function pricing_scramble_inventory()')}
 assert.equal((await rows('select count(*)::int n from businesses'))[0].n,0);assert.equal((await rows('select count(*)::int n from partner_leads'))[0].n,0)
})
test('service edits update range/base amount together, preserve omitted metadata for cached clients and retain audit/revision guards',async()=>{
 await reset();const bid=await submit(input([{name:'Original range',price:20,currency:'BGN',duration_min:30,description:'Per procedure',price_details:{kind:'range',maximum:40,unit:'процедура'}}]))
 const service=(await rows('select * from services where business_id=$1',[bid]))[0],before=await revision(bid)
 const next={id:service.id,name:'Updated range',price:10,currency:'BGN',duration_min:30,description:'Conditions kept',category:'beauty',active:true,sort_order:0,price_details:{kind:'range',maximum:15,unit:'процедура'}}
 await edit(bid,[next],before)
 let saved=(await rows('select * from services where id=$1',[service.id]))[0]
 assert.equal(Number(saved.price),10);assert.deepEqual(saved.price_details,next.price_details);assert.equal(saved.currency,'BGN')
 await assert.rejects(edit(bid,[next],before),/CONTENT_CHANGED/)
 const cached={...next,name:'Cached name edit'};delete cached.price_details;delete cached.currency
 await edit(bid,[cached]);saved=(await rows('select * from services where id=$1',[service.id]))[0]
 assert.deepEqual(saved.price_details,next.price_details);assert.equal(saved.currency,'BGN')
 assert.equal((await rows('select count(*)::int n from business_content_audit'))[0].n,2)
})
test('price metadata constraint enforces direct owner writes; RPCs retain permission and cross-tenant safeguards',async()=>{
 await reset();const bid=await submit(input([{name:'Local service',price:20,duration_min:30}]))
 const service=(await rows('select * from services where business_id=$1',[bid]))[0]
 await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
 await assert.rejects(db.query('update services set price_details=$2::jsonb where id=$1',[service.id,JSON.stringify({kind:'range',maximum:10})]),/service_price_details_valid/)
 await db.exec('reset role')
 for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(submit(input([{name:'No access',price:20,duration_min:30}])),/permission denied/);await assert.rejects(edit(bid,[]),/permission denied/);await db.exec('reset role')}
 await db.exec('set role anon');await assert.rejects(db.query("select valid_service_price_details(20,'{}'::jsonb)"),/permission denied/);await db.exec('reset role')
 await db.exec('set role service_role');await assert.rejects(db.query('select submit_business_application_before_price_details($1,false,$2::jsonb)',[owner,JSON.stringify(input([{name:'Private legacy function',price:20,duration_min:30}]))]),/permission denied/);await db.exec('reset role')
 await assert.rejects(edit(bid,[{id:'40000000-0000-4000-8000-000000000099',name:'Foreign',price:20,duration_min:30,description:'',category:'',active:true,sort_order:0}]),/WRONG_BUSINESS/)
 assert.equal((await rows('select name from services where id=$1',[service.id]))[0].name,'Local service')
})
