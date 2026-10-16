import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'

const migration=await readFile(new URL('../supabase/migrations/20261016160000_platform_business_controls.sql',import.meta.url),'utf8')
const bid='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',owner='20000000-0000-4000-8000-000000000001',admin='20000000-0000-4000-8000-000000000002'
let db
const rows=async(sql,args=[])=>(await db.query(sql,args)).rows
const action=(name,revision,confirmation='example',reason='Offline test only')=>db.query('select platform_business_action($1,$2,$3,$4,$5,$6) result',[bid,admin,name,revision,confirmation,reason])
async function reset(){
  await db.exec('reset role; truncate businesses,platform_admin_audit cascade;')
  await db.query('insert into businesses(id,owner_id,name,slug,active) values($1,$3,$4,$5,true),($2,$3,$6,$7,true)',[bid,other,owner,'Example','example','Other','other'])
  await db.query('insert into services(business_id,active) values($1,true)',[bid])
  await db.query('insert into staff(id,business_id,active) values($1,$1,true)',[bid])
  await db.query('insert into working_hours(business_id,staff_id) values($1,$1)',[bid])
}
test.before(async()=>{
  db=new PGlite()
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create table businesses(id uuid primary key,owner_id uuid references auth.users(id),name text,slug text,active boolean);
    create table services(id uuid primary key default gen_random_uuid(),business_id uuid references businesses(id) on delete cascade,active boolean);
    create table staff(id uuid primary key,business_id uuid references businesses(id) on delete cascade,active boolean);
    create table working_hours(business_id uuid references businesses(id) on delete cascade,staff_id uuid);
    create table customers(id uuid primary key default gen_random_uuid(),business_id uuid references businesses(id) on delete cascade);
    create table appointments(id uuid primary key default gen_random_uuid(),business_id uuid references businesses(id) on delete cascade,starts_at timestamptz,ends_at timestamptz,staff_id uuid,service_id uuid,status text);
    create table notification_outbox(business_id uuid references businesses(id) on delete cascade,status text,last_error text,claim_token uuid,locked_until timestamptz);
    grant select,insert,update,delete on businesses,services,staff,working_hours,appointments,notification_outbox to service_role;
    grant select,insert,update on businesses to authenticated;
  `)
  await db.query('insert into auth.users values($1),($2)',[owner,admin]);await db.exec(migration)
})
test.after(async()=>{await db?.close()})
test('repeatable migration preserves existing profiles and does not publish, archive or delete them',async()=>{
  await reset();await db.exec(migration)
  assert.equal((await rows('select * from businesses')).length,2)
  assert.ok((await rows('select * from businesses')).every(b=>b.platform_status==='enabled'&&b.platform_revision===0&&b.active))
  assert.equal((await rows('select * from platform_admin_audit')).length,0)
})
test('ordinary owners cannot alter moderation fields or execute administrator RPCs',async()=>{
  await reset();await db.exec('set role authenticated;')
  await assert.rejects(db.query("update businesses set platform_status='archived' where id=$1",[bid]),/administrator-only/)
  await assert.rejects(db.query('update businesses set platform_revision=9 where id=$1',[bid]),/administrator-only/)
  await assert.rejects(action('suspend',0),/permission denied/)
  await assert.rejects(db.query('select * from platform_admin_audit'),/permission denied/)
  await db.query("update businesses set name='Allowed owner edit' where id=$1",[bid])
  await db.exec('reset role;set role anon;');await assert.rejects(action('suspend',0),/permission denied/);await db.exec('reset role;')
})
test('suspend/publish are audited; stale versions and wrong targets cannot mutate the business',async()=>{
  await reset();await db.exec('set role service_role;');await action('suspend',0)
  assert.equal((await rows('select platform_status from businesses where id=$1',[bid]))[0].platform_status,'suspended')
  await assert.rejects(action('publish',0),/BUSINESS_CHANGED/)
  await assert.rejects(action('publish',1,'other'),/CONFIRMATION_MISMATCH/)
  await action('publish',1)
  assert.equal((await rows('select platform_revision from businesses where id=$1',[bid]))[0].platform_revision,2)
  assert.equal((await rows('select * from platform_admin_audit')).length,2)
  assert.equal((await rows('select platform_revision from businesses where id=$1',[other]))[0].platform_revision,0)
  await db.exec('reset role;')
})
test('incomplete setup cannot be published',async()=>{
  await reset();await action('suspend',0);await db.query('delete from working_hours where business_id=$1',[bid])
  await assert.rejects(action('publish',1),/SETUP_REQUIRED/)
  assert.equal((await rows('select * from platform_admin_audit')).length,1)
})
test('archive stops pending and in-flight emails, restore stays suspended and never replays mail',async()=>{
  await reset();await db.query("insert into notification_outbox values($1,'processing',null,gen_random_uuid(),now()+interval '1 minute')",[bid])
  await action('archive',0)
  const queue=(await rows('select * from notification_outbox'))[0]
  assert.equal(queue.status,'skipped');assert.equal(queue.last_error,'BUSINESS_ARCHIVED');assert.equal(queue.claim_token,null)
  await assert.rejects(action('publish',1),/RESTORE_FIRST/)
  await action('restore',1)
  assert.equal((await rows('select platform_status from businesses where id=$1',[bid]))[0].platform_status,'suspended')
  assert.equal((await rows('select status from notification_outbox'))[0].status,'skipped')
})
test('hidden businesses cannot accept direct bookings, but existing visits can be cancelled',async()=>{
  await reset()
  await db.query("insert into appointments(business_id,starts_at,ends_at,status) values($1,now()+interval '2 days',now()+interval '2 days 1 hour','booked')",[bid])
  await action('suspend',0)
  await assert.rejects(db.query("insert into appointments(business_id,starts_at,ends_at,status) values($1,now(),now()+interval '1 hour','booked')",[bid]),/BUSINESS_NOT_BOOKABLE/)
  await db.query("update appointments set status='confirmed' where business_id=$1",[bid])
  await assert.rejects(db.query("update appointments set starts_at=starts_at+interval '1 day' where business_id=$1",[bid]),/BUSINESS_NOT_BOOKABLE/)
  await db.query("update appointments set status='cancelled' where business_id=$1",[bid])
})
test('permanent deletion is blocked by upcoming visits and preserves other businesses and Auth accounts',async()=>{
  await reset();await assert.rejects(action('delete',0),/ARCHIVE_FIRST/)
  await db.query("insert into appointments(business_id,starts_at,ends_at,status) values($1,now()+interval '2 days',now()+interval '2 days 1 hour','booked')",[bid])
  await db.query('insert into customers(business_id) values($1),($2)',[bid,other]);await action('archive',0)
  await assert.rejects(action('delete',1),/UPCOMING_BOOKINGS/)
  await db.query("update appointments set status='cancelled' where business_id=$1",[bid]);await action('delete',1)
  assert.equal((await rows('select * from businesses')).length,1)
  assert.equal((await rows('select * from customers')).length,1)
  assert.equal((await rows('select * from appointments')).length,0)
  assert.equal((await rows('select * from auth.users')).length,2)
  assert.equal((await rows("select * from platform_admin_audit where action='delete'"))[0].business_slug,'example')
})
test('audit insertion failure rolls back both state changes and deletion',async()=>{
  await reset();await action('archive',0)
  await db.exec("create function block_test_audit() returns trigger language plpgsql as $$begin raise exception 'test audit failure';end;$$;create trigger block_test_audit before insert on platform_admin_audit for each row execute function block_test_audit();")
  await assert.rejects(action('delete',1),/test audit failure/)
  assert.equal((await rows('select * from businesses where id=$1',[bid])).length,1)
  await db.exec('drop trigger block_test_audit on platform_admin_audit;drop function block_test_audit();')
})
test('future profiles require review without changing existing visibility; owners cannot bypass approval',async()=>{
  await reset()
  const review=await readFile(new URL('../supabase/migrations/20261016180500_business_publication_review.sql',import.meta.url),'utf8')
  const before=await rows('select id,active,platform_status,platform_revision from businesses order by id')
  await db.exec(review);await db.exec(review)
  assert.deepEqual(await rows('select id,active,platform_status,platform_revision from businesses order by id'),before)
  const pending='10000000-0000-4000-8000-000000000003'
  await db.exec('set role authenticated')
  await db.query("insert into businesses(id,owner_id,name,slug,active) values($1,$2,'Review Profile','review-profile',true)",[pending,owner])
  assert.equal((await rows('select platform_status from businesses where id=$1',[pending]))[0].platform_status,'pending')
  await assert.rejects(db.query("update businesses set platform_status='enabled' where id=$1",[pending]),/administrator-only/)
  await assert.rejects(db.exec("insert into businesses(id,name,slug,active,platform_status) values(gen_random_uuid(),'Forged','forged',true,'enabled')"),/administrator-only/)
  await assert.rejects(db.exec("insert into businesses(id,name,slug,active,platform_revision) values(gen_random_uuid(),'Forged','forged',true,9)"),/administrator-only/)
  await db.query('update businesses set active=false where id=$1',[pending]);await db.query('update businesses set active=true where id=$1',[pending])
  await db.exec('reset role')
  await assert.rejects(db.query("insert into appointments(business_id,starts_at,ends_at,status) values($1,now(),now()+interval '1 hour','booked')",[pending]),/BUSINESS_NOT_BOOKABLE/)
  const publish=()=>db.query('select platform_business_action($1,$2,$3,0,$4,$5)',[pending,admin,'publish','review-profile','Offline review test'])
  await assert.rejects(publish(),/SETUP_REQUIRED/)
  await db.query('insert into services(business_id,active) values($1,true)',[pending])
  await db.query('insert into staff(id,business_id,active) values($1,$1,true)',[pending])
  await db.query('insert into working_hours(business_id,staff_id) values($1,$1)',[pending])
  await db.exec('set role service_role');await publish();await db.exec('reset role')
  assert.equal((await rows('select platform_status from businesses where id=$1',[pending]))[0].platform_status,'enabled')
  assert.equal((await rows('select previous_status,next_status from platform_admin_audit where business_id=$1',[pending]))[0].previous_status,'pending')
  await db.query("insert into appointments(business_id,starts_at,ends_at,status) values($1,now(),now()+interval '1 hour','booked'),($2,now(),now()+interval '1 hour','booked')",[pending,bid])
  assert.equal((await rows('select * from appointments')).length,2)
})
