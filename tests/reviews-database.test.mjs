import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const migration = await readFile(new URL('../supabase/migrations/20261026120000_business_profiles_reviews.sql', import.meta.url), 'utf8')
const emails = await readFile(new URL('../supabase/migrations/20261015210000_reliable_booking_emails.sql', import.meta.url), 'utf8')
const b='10000000-0000-4000-8000-000000000001', c='20000000-0000-4000-8000-000000000001', a='30000000-0000-4000-8000-000000000001', admin='40000000-0000-4000-8000-000000000001'
let db
const rows = async (sql,args=[]) => (await db.query(sql,args)).rows
async function reset(options={}) {
  await db.exec('reset role; truncate businesses cascade;')
  await db.query("insert into businesses(id,active,platform_status,email_notifications_enabled,contact_email) values($1,true,'enabled',true,'owner@example.com')",[b])
  await db.query("insert into customers(id,business_id,email) values($1,$2,'client@example.com')",[c,b])
  await db.query(`insert into appointments(id,business_id,customer_id,starts_at,ends_at,status,email_notifications_requested,notification_locale) values($1,$2,$3,now()-interval '3 hours',now()-interval '2 hours',$4,$5,'en')`,[a,b,c,options.status||'booked',options.email!==false])
}
const complete = () => db.query("update appointments set status='done' where id=$1",[a])
const invitation = async () => (await rows('select * from review_invitations'))[0]
const body = {rating:4,displayName:'QA Client',comment:'A genuine offline test.',consent:true,details:{quality:5,service:4}}
const submit = async (token,value=body) => (await rows('select submit_booking_review($1,$2::jsonb) id',[token,JSON.stringify(value)]))[0].id

test.before(async()=>{
  db=new PGlite()
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create table businesses(id uuid primary key,active boolean,platform_status text,email_notifications_enabled boolean,contact_email text);
    create table customers(id uuid primary key,business_id uuid references businesses(id) on delete cascade,email text);
    create table services(id uuid primary key);
    create table appointments(id uuid primary key,business_id uuid references businesses(id) on delete cascade,customer_id uuid references customers(id),starts_at timestamptz,ends_at timestamptz,staff_id uuid,service_id uuid,status text);
    create table notification_outbox(id uuid primary key default gen_random_uuid(),business_id uuid references businesses(id) on delete cascade,appointment_id uuid references appointments(id) on delete cascade,kind text not null check(kind in ('booking_confirmation','booking_cancelled','booking_reminder','owner_new_booking')),recipient text not null,subject text not null,html_body text not null,status text not null default 'pending',scheduled_for timestamptz not null default now(),sent_at timestamptz,attempts smallint not null default 0,last_error text,idempotency_key text unique not null,created_at timestamptz not null default now());
    grant select,insert,update,delete on businesses,customers,appointments,notification_outbox to service_role;
    alter table notification_outbox enable row level security;
    create policy fixture_owner_mail on notification_outbox for all to authenticated using(true) with check(true);
    grant select,insert,update,delete on notification_outbox to authenticated;`)
  await db.query('insert into auth.users(id) values($1)',[admin])
  await db.exec(emails);await db.exec(migration)
})
test.after(async()=>{await db?.close()})

test('migration is repeatable, preserves historical visits and does not send/backfill any review requests',async()=>{
  await reset({status:'done'});await db.exec(migration)
  assert.equal((await rows('select * from appointments')).length,1)
  assert.equal((await rows('select * from review_invitations')).length,0)
  assert.equal((await rows("select * from notification_outbox where kind='review_request'")).length,0)
})
test('new completion durably queues one language-preserving review request; repeat completion does not duplicate it',async()=>{
  await reset();await complete();await complete()
  const invite=await invitation(), queue=await rows("select * from notification_outbox where kind='review_request'")
  assert.equal(queue.length,1);assert.equal(queue[0].locale,'en');assert.equal(queue[0].recipient,'client@example.com')
  assert.equal(queue[0].appointment_revision,invite.appointment_revision)
  assert.ok(Date.parse(invite.expires_at)>Date.parse(invite.available_at))
  await db.exec('begin;');await db.query("update appointments set status='cancelled' where id=$1",[a]);await db.exec('rollback;')
  assert.equal((await invitation()).revoked_at,null)
})
test('disabled notifications, opted-out businesses, no-shows and very old visits cannot queue invitations',async()=>{
  for(const mode of ['email','business','disabled','old','no_show']){
    await reset({email:mode!=='email'})
    if(mode==='business')await db.exec('update businesses set review_requests_enabled=false')
    if(mode==='disabled')await db.exec("update businesses set platform_status='suspended'")
    if(mode==='old')await db.exec("update appointments set starts_at=now()-interval '20 days',ends_at=now()-interval '19 days'")
    if(mode==='no_show')await db.exec("update appointments set status='no_show'");else await complete()
    assert.equal((await rows('select * from review_invitations')).length,0,mode)
  }
})
test('early completion cannot mail or accept a review before the appointment has ended and the one-hour delay',async()=>{
  await reset();await db.exec("update appointments set starts_at=now()+interval '1 day',ends_at=now()+interval '1 day 1 hour'");await complete()
  const invite=await invitation()
  await assert.rejects(submit(invite.token),/REVIEW_LINK_UNAVAILABLE/)
  const queued=await rows("select * from notification_outbox where kind='review_request'")
  assert.equal(queued.length,1)
  assert.equal(Date.parse(queued[0].scheduled_for)-Date.parse((await rows('select ends_at from appointments'))[0].ends_at),3600000)
})
test('only the new worker claims review emails; claims are leased and do not overlap',async()=>{
  await reset();await complete()
  assert.equal((await rows('select * from claim_booking_email(null,true)')).length,0)
  const claimed=await rows('select * from claim_visit_email(null,true,true)')
  assert.equal(claimed.length,1);assert.equal(claimed[0].kind,'review_request');assert.ok(claimed[0].claim_token)
  assert.equal((await rows('select * from claim_visit_email(null,true,true)')).length,0)
})
test('review submission is single-use, consent-based and cannot overwrite a prior rating',async()=>{
  await reset();await complete();const invite=await invitation()
  await assert.rejects(submit(invite.token,{...body,consent:false}),/INVALID_REVIEW/)
  await assert.rejects(submit(invite.token,{...body,rating:6}),/check constraint/)
  await assert.rejects(submit(invite.token,{...body,displayName:'x'}),/check constraint/)
  const id=await submit(invite.token)
  await assert.rejects(submit(invite.token,{...body,rating:1}),/REVIEW_ALREADY_SUBMITTED/)
  const review=(await rows('select * from booking_reviews where id=$1',[id]))[0]
  assert.equal(review.rating,4);assert.equal(review.quality,5);assert.equal(review.service_rating,4)
  assert.ok((await invitation()).used_at)
})
test('a verified GoRez rating without a comment increases its own count and average, without importing Google ratings',async()=>{
  await reset();await complete();const invite=await invitation()
  await submit(invite.token,{...body,rating:3,comment:''})
  const result=(await rows('select public_business_reviews($1) result',[b]))[0].result
  assert.equal(result.summary.count,1);assert.equal(Number(result.summary.average),3)
  assert.equal(result.items[0].comment,'');assert.equal(result.items[0].rating,3)
  assert.deepEqual(Object.keys(result.summary).sort(),['atmosphere','average','cleanliness','count','quality','service'])
})
test('cancelled, changed, expired, anonymized and cross-tenant invitations cannot create public reviews',async()=>{
  for(const mode of ['cancelled','changed','expired','anonymized','tenant']){
    await reset();await complete();const invite=await invitation()
    if(mode==='cancelled')await db.exec("update appointments set status='cancelled'")
    if(mode==='changed')await db.exec("update appointments set service_id=gen_random_uuid()")
    if(mode==='expired')await db.exec("update review_invitations set expires_at=now()-interval '1 second'")
    if(mode==='anonymized')await db.exec('update customers set email=null')
    if(mode==='tenant'){
      await db.exec("insert into businesses(id,active,platform_status,email_notifications_enabled) values('10000000-0000-4000-8000-000000000002',true,'enabled',true)")
      await db.exec("update review_invitations set business_id='10000000-0000-4000-8000-000000000002'")
    }
    await assert.rejects(submit(invite.token),/REVIEW_LINK_UNAVAILABLE/)
    assert.equal((await rows('select * from booking_reviews')).length,0)
  }
})
test('public summaries are accurate, hide moderated reviews and never expose tokens, contacts, appointment IDs or moderation reasons',async()=>{
  await reset();await complete();const id=await submit((await invitation()).token)
  const result=(await rows('select public_business_reviews($1) result',[b]))[0].result
  assert.equal(result.summary.count,1);assert.equal(result.summary.average,4);assert.equal(result.summary.quality,5)
  assert.equal(result.items.length,1)
  assert.doesNotMatch(JSON.stringify(result),/appointment_id|invitation|token|client@example|moderation_reason/)
  await db.query("select moderate_booking_review($1,$2,'hidden',0,'Off-topic personal data')",[id,admin])
  assert.equal((await rows('select public_business_reviews($1) result',[b]))[0].result.summary.count,0)
  await assert.rejects(db.query("select moderate_booking_review($1,$2,'published',0,'Stale update')",[id,admin]),/REVIEW_CHANGED/)
  await db.query("select moderate_booking_review($1,$2,'published',1,'Reviewed and restored')",[id,admin])
  assert.equal((await rows('select * from review_moderation_audit')).length,2)
  await db.exec("update businesses set platform_status='archived'")
  assert.equal((await rows('select public_business_reviews($1) result',[b]))[0].result,null)
})
test('client erasure and business deletion remove invitation tokens and public review content',async()=>{
  await reset();await complete();await submit((await invitation()).token)
  await db.exec('update customers set email=null')
  assert.equal((await rows('select * from review_invitations')).length,0);assert.equal((await rows('select * from booking_reviews')).length,0)
  await reset();await complete();await submit((await invitation()).token)
  await db.exec('delete from businesses')
  assert.equal((await rows('select * from review_invitations')).length,0);assert.equal((await rows('select * from booking_reviews')).length,0)
})
test('anonymous users and ordinary authenticated owners cannot read private review tokens or execute service/admin writes',async()=>{
  await reset();await complete()
  const token=(await invitation()).token
  for(const role of ['anon','authenticated']){
    await db.exec(`set role ${role}`)
    for(const sql of ['select * from review_invitations','select * from booking_reviews','select * from review_moderation_audit',`select submit_booking_review('${token}','{}')`]){
      await db.exec(`set role ${role}`);await assert.rejects(db.query(sql),/permission denied/)
    }
    await db.exec(`set role ${role}`);await assert.rejects(db.query('select * from claim_visit_email(null,true,true)'),/permission denied/)
    await db.exec('reset role;')
  }
})
test('even an otherwise authorized business owner cannot read or tamper with the private review link inside queued email payloads',async()=>{
  await reset();await complete()
  const invite=await invitation()
  await db.query("update notification_outbox set payload=jsonb_build_object('text',$1::text) where kind='review_request'",[`https://www.gorez.co/review/${invite.token}`])
  await db.query("insert into notification_outbox(business_id,appointment_id,kind,recipient,subject,html_body,idempotency_key) values($1,$2,'booking_confirmation','client@example.com','','','QA_NORMAL_EMAIL')",[b,a])
  await db.exec('set role authenticated')
  const visible=await rows('select kind,payload from notification_outbox')
  assert.equal(visible.length,1);assert.equal(visible[0].kind,'booking_confirmation');assert.doesNotMatch(JSON.stringify(visible),new RegExp(invite.token))
  assert.equal((await rows("update notification_outbox set status='sent' where kind='review_request' returning id")).length,0)
  await assert.rejects(db.query("insert into notification_outbox(business_id,appointment_id,kind,recipient,subject,html_body,idempotency_key) values($1,$2,'review_request','owner@example.com','','','QA_FORGED_REVIEW_EMAIL')",[b,a]),/row-level security/)
  await db.exec('reset role')
  assert.equal((await rows("select status from notification_outbox where kind='review_request'"))[0].status,'pending')
})
