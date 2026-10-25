import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
let db
const owner='20000000-0000-4000-8000-000000000001',admin='20000000-0000-4000-8000-000000000002'
const read=name=>readFile(new URL(`../supabase/migrations/${name}.sql`,import.meta.url),'utf8')
const rows=async(sql,args=[])=>(await db.query(sql,args)).rows
const input={business:{name:'Offline Salon',slug:'offline-salon',phone:'+359888123456',contact_email:'bookings@example.com',address:'Local 1',timezone:'Europe/Sofia',industry:'beauty',city_ekatte:'68134',city:'София',neighborhood:'Център',default_duration_min:45,booking_slot_minutes:15},email:'owner@example.com',locale:'bg',services:[{name:'Haircut',price:25,duration_min:45}],staff:[{name:'Test Person'}],hours:[{weekday:1,open_time:'09:00',close_time:'18:00',break_start:'12:00',break_end:'13:00'}]}
const submit=async value=>(await rows('select submit_business_application($1,true,$2::jsonb) id',[owner,JSON.stringify(value||input)]))[0].id
const review=(lead,status='active',expected=lead.updated_at)=>db.query('select review_business_application($1,$2,$3,$4,null,false) result',[lead.id,admin,status,expected])
async function reset(){await db.exec('reset role;truncate businesses,partner_leads,platform_admin_audit cascade;');await db.query('update auth.users set email_confirmed_at=null where id=$1',[owner])}
test.before(async()=>{
  db=new PGlite()
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create table businesses(id uuid primary key default gen_random_uuid(),owner_id uuid references auth.users(id),name text,slug text unique,phone text,contact_email text,address text,timezone text,industry text,city_ekatte text,city text,neighborhood text,default_duration_min integer,booking_slot_minutes integer,languages text[],notification_locale text,active boolean default true);
    create table services(id uuid primary key default gen_random_uuid(),business_id uuid references businesses(id) on delete cascade,name text,price numeric check(price>=0),currency text,duration_min integer check(duration_min>0),active boolean default true);
    create table staff(id uuid primary key default gen_random_uuid(),business_id uuid references businesses(id) on delete cascade,name text,active boolean default true);
    create table working_hours(business_id uuid references businesses(id) on delete cascade,staff_id uuid references staff(id) on delete cascade,weekday smallint,open_time time,close_time time,break_start time,break_end time,check(close_time>open_time),unique(staff_id,weekday));
    create table appointments(business_id uuid references businesses(id) on delete cascade,starts_at timestamptz,ends_at timestamptz,staff_id uuid,service_id uuid,status text);
    create table notification_outbox(business_id uuid,status text,last_error text,claim_token uuid,locked_until timestamptz);
    grant select,insert,update,delete on businesses,services,staff,working_hours,appointments,notification_outbox to service_role;
    grant select,insert,update on businesses to authenticated;`)
  await db.query('insert into auth.users(id,email) values($1,$3),($2,$4)',[owner,admin,'owner@example.com','admin@example.com'])
  await db.exec(await read('20261014150000_partner_pipeline'))
  await db.exec(await read('20261016160000_platform_business_controls'))
  await db.exec(await read('20261016180500_business_publication_review'))
  await db.exec(await read('20261025120000_direct_business_applications'))
})
test.after(async()=>{await db?.close()})
test('complete SQL transaction saves private profile, services, team, lunch and linked request without passwords',async()=>{
  await reset();const id=await submit()
  const lead=(await rows('select * from partner_leads where id=$1',[id]))[0],business=(await rows('select * from businesses'))[0]
  assert.equal(business.platform_status,'pending');assert.equal(lead.business_id,business.id);assert.equal(lead.requires_owner_activation,true);assert.equal(lead.status,'new')
  assert.equal((await rows('select duration_min from services'))[0].duration_min,45)
  assert.equal((await rows('select break_start::text from working_hours'))[0].break_start,'12:00:00')
  assert.doesNotMatch(JSON.stringify(lead),/password/)
  await db.exec(await read('20261025120000_direct_business_applications'))
  assert.equal((await rows('select * from businesses')).length,1)
})
test('failed nested insert rolls back everything; another identity/email cannot be attached',async()=>{
  await reset()
  await assert.rejects(submit({...input,services:[{name:'Bad',price:-1,duration_min:45}]}),/check constraint/)
  assert.equal((await rows('select * from businesses')).length,0);assert.equal((await rows('select * from partner_leads')).length,0)
  await assert.rejects(submit({...input,email:'victim@example.com'}),/INVALID_APPLICATION/)
})
test('only service role can submit or review; unactivated business cannot publish or accept bookings',async()=>{
  await reset();const id=await submit(),lead=(await rows('select * from partner_leads where id=$1',[id]))[0]
  await assert.rejects(review(lead),/OWNER_ACTIVATION_REQUIRED/)
  await assert.rejects(db.query("select platform_business_action($1,$2,'publish',0,'offline-salon','Offline test')",[lead.business_id,admin]),/OWNER_ACTIVATION_REQUIRED/)
  await assert.rejects(db.query("insert into appointments(business_id,starts_at,ends_at,status) values($1,now(),now()+interval '1 hour','booked')",[lead.business_id]),/BUSINESS_NOT_BOOKABLE/)
  for(const role of ['anon','authenticated']){
    await db.exec(`set role ${role}`)
    await assert.rejects(submit(),/permission denied/);await assert.rejects(review(lead),/permission denied/)
    await db.exec('reset role')
  }
})
test('admin approval publishes atomically with audit, stale decisions fail and rejection hides the profile',async()=>{
  await reset();const id=await submit(),lead=(await rows('select * from partner_leads where id=$1',[id]))[0]
  await db.query('update auth.users set email_confirmed_at=now() where id=$1',[owner])
  await db.exec('set role service_role');await review(lead);await db.exec('reset role')
  assert.equal((await rows('select platform_status from businesses'))[0].platform_status,'enabled')
  assert.equal((await rows('select status from partner_leads'))[0].status,'active')
  assert.equal((await rows('select action from platform_admin_audit'))[0].action,'publish')
  await assert.rejects(review(lead,'declined'),/LEAD_CHANGED/)
  const latest=(await rows('select * from partner_leads'))[0];await review(latest,'declined')
  assert.equal((await rows('select platform_status from businesses'))[0].platform_status,'suspended')
  assert.equal((await rows('select status from partner_leads'))[0].status,'declined')
  assert.equal((await rows('select * from auth.users')).length,2)
})
test('publication from Businesses tab synchronizes linked applications and does not touch legacy leads',async()=>{
  await reset();const id=await submit(),lead=(await rows('select * from partner_leads where id=$1',[id]))[0]
  await db.query('update auth.users set email_confirmed_at=now() where id=$1',[owner])
  await db.query("select platform_business_action($1,$2,'publish',0,'offline-salon','Offline test')",[lead.business_id,admin])
  assert.equal((await rows('select status from partner_leads'))[0].status,'active')
  assert.equal((await rows('select * from businesses')).length,1)
})
