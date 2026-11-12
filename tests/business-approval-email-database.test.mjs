import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const migration = await readFile(new URL('../supabase/migrations/20261112144000_business_approval_email.sql', import.meta.url), 'utf8')
const owner = '10000000-0000-4000-8000-000000000001', other = '10000000-0000-4000-8000-000000000002'
const existing = '20000000-0000-4000-8000-000000000001', fresh = '20000000-0000-4000-8000-000000000002'
let db
const rows = async (sql, params = []) => (await db.query(sql, params)).rows
const queue = () => rows('select * from business_approval_email_outbox order by created_at,id')
async function reset() {
  await db.exec('reset role; truncate business_approval_email_outbox,businesses cascade;')
  await db.query('update auth.users set email=$2,email_confirmed_at=now() where id=$1', [owner, 'owner@example.com'])
  await db.query("insert into businesses(id,owner_id,name,slug,active,platform_status,notification_locale,contact_email) values($1,$2,'Future salon','future-salon',false,'pending','en','contact@example.com')", [fresh, owner])
}
test.before(async () => {
  db = new PGlite()
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
    create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create table businesses(id uuid primary key,owner_id uuid not null references auth.users(id),name text,slug text,active boolean,platform_status text,notification_locale text,contact_email text);
    create table notification_outbox(id integer primary key,status text);insert into notification_outbox values(1,'pending');
    grant select,insert,update on businesses to service_role;`)
  await db.query('insert into auth.users values($1,$3,now()),($2,$4,now())', [owner, other, 'owner@example.com','other@example.com'])
  await db.query("insert into businesses values($1,$2,'Existing business','existing',true,'enabled','bg','contact@example.com')", [existing, owner])
  await db.exec(migration)
})
test.after(async () => { await db?.close() })

test('initial migration suppresses old businesses without copying mailboxes, changing business/Auth rows or touching visit notifications', async () => {
  const [legacy] = await queue()
  assert.equal(legacy.business_id, existing); assert.equal(legacy.status, 'skipped'); assert.equal(legacy.last_error, 'PREEXISTING_BUSINESS')
  assert.equal(legacy.recipient, null); assert.equal(legacy.payload, null)
  await db.query("update businesses set active=false,platform_status='suspended' where id=$1", [existing])
  await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [existing])
  assert.equal((await queue()).length, 1); assert.equal((await queue())[0].status, 'skipped')
  assert.equal((await rows('select * from claim_business_approval_email(null)')).length, 0)
  assert.deepEqual(await rows('select * from notification_outbox'), [{ id: 1, status: 'pending' }])
})

test('first successful future publication atomically queues one actual Auth owner notice, not contact mailbox', async () => {
  await reset(); assert.equal((await queue()).length, 0)
  await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
  const [notice] = await queue(); assert.equal(notice.business_id, fresh); assert.equal(notice.owner_id, owner)
  assert.equal(notice.recipient, 'owner@example.com'); assert.equal(notice.locale, 'en'); assert.equal(notice.status, 'pending')
  await db.query("update businesses set name='Edited name' where id=$1", [fresh]); assert.equal((await queue()).length, 1)
  await db.query("update businesses set active=false,platform_status='suspended' where id=$1", [fresh])
  await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
  assert.equal((await queue()).length, 1); assert.equal((await queue())[0].id, notice.id)
})

test('publication rollback cannot leave an approval notice; a repeat migration cannot suppress a future pending registration', async () => {
  await reset(); await db.exec('begin;')
  await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
  assert.equal((await queue()).length, 1); await db.exec('rollback;'); assert.equal((await queue()).length, 0)
  await db.exec(migration)
  await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
  assert.equal((await queue())[0].status, 'pending')
})

test('an initially published future insert queues once; unusable/unconfirmed actual owner gets only a silent terminal ledger', async () => {
  await reset(); await db.exec('truncate businesses cascade;')
  await db.query("insert into businesses values($1,$2,'New direct publication','new-direct',true,'enabled','bg','contact@example.com')", [fresh, owner])
  assert.equal((await queue())[0].status, 'pending')
  await reset(); await db.query('update auth.users set email_confirmed_at=null where id=$1', [owner])
  await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
  assert.equal((await queue())[0].status, 'skipped'); assert.equal((await queue())[0].recipient, null)
})

test('outbox and claim/current functions stay inaccessible to both public browser roles', async () => {
  await reset(); await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
  for (const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`)
    for (const sql of ['select * from business_approval_email_outbox', "update business_approval_email_outbox set status='sent'", 'delete from business_approval_email_outbox', 'select * from claim_business_approval_email(null)', 'select business_approval_email_current(gen_random_uuid(),gen_random_uuid())']) await assert.rejects(db.query(sql), /permission denied/)
    await db.exec('reset role')
  }
  assert.equal((await rows("select relrowsecurity from pg_class where oid='public.business_approval_email_outbox'::regclass"))[0].relrowsecurity, true)
  await db.exec('set role service_role')
  await assert.rejects(db.query('insert into business_approval_email_outbox(business_id,owner_id,recipient) values($1,$2,$3)', [fresh, owner, 'attacker@example.com']), /permission denied/)
  await assert.rejects(db.query('delete from business_approval_email_outbox'), /permission denied/)
  assert.equal((await rows('select * from claim_business_approval_email($1)', [fresh])).length, 1)
  await db.exec('reset role')
})

test('claim is single-consumer and stale claim tokens cannot prepare or finish a reclaimed notice', async () => {
  await reset(); await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
  const [first] = await rows('select * from claim_business_approval_email($1)', [fresh])
  assert.equal((await rows('select * from claim_business_approval_email($1)', [fresh])).length, 0)
  assert.equal((await rows('select business_approval_email_current($1,$2) ok', [first.id, first.claim_token]))[0].ok, true)
  await db.query("update business_approval_email_outbox set locked_until=now()-interval '1 minute' where id=$1", [first.id])
  const [second] = await rows('select * from claim_business_approval_email($1)', [fresh]); assert.notEqual(second.claim_token, first.claim_token)
  assert.equal((await rows("update business_approval_email_outbox set status='sent' where id=$1 and claim_token=$2 and status='processing' returning id", [first.id, first.claim_token])).length, 0)
  assert.equal((await rows('select business_approval_email_current($1,$2) ok', [first.id, first.claim_token]))[0].ok, false)
  assert.equal((await rows('select business_approval_email_current($1,$2) ok', [second.id, second.claim_token]))[0].ok, true)
})

test('server revalidation rejects suspension, changed owner/email, unconfirmed owner and terminal acceptance', async () => {
  for (const mutation of ["update businesses set active=false", "update businesses set platform_status='archived'", `update businesses set owner_id='${other}'`, "update auth.users set email='changed@example.com'", 'update auth.users set email_confirmed_at=null', "update business_approval_email_outbox set status='sent'"]) {
    await reset(); await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
    const [claimed] = await rows('select * from claim_business_approval_email($1)', [fresh]); await db.exec(mutation)
    assert.equal((await rows('select business_approval_email_current($1,$2) ok', [claimed.id, claimed.claim_token]))[0].ok, false, mutation)
  }
})

test('expired idempotency windows, old unsent notices and exhausted claims are never retried', async () => {
  for (const mutation of ["first_attempt_at=now()-interval '24 hours'", "created_at=now()-interval '8 days'", "status='processing',attempts=3,locked_until=now()-interval '1 minute'"]) {
    await reset(); await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
    await db.exec(`update business_approval_email_outbox set ${mutation}`)
    assert.equal((await rows('select * from claim_business_approval_email(null)')).length, 0)
    assert.ok(['skipped','failed'].includes((await queue())[0].status))
  }
})

test('operational payload is removed after 90 days but the unique publication ledger prevents replay', async () => {
  await reset(); await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
  await db.exec(`update business_approval_email_outbox set status='sent',created_at=now()-interval '91 days',payload='{"to":["owner@example.com"]}'::jsonb,provider_message_id='old-provider-id'`)
  await rows('select * from claim_business_approval_email(null)')
  const [retained] = await queue(); assert.equal(retained.recipient, null); assert.equal(retained.payload, null); assert.equal(retained.status, 'skipped')
  await db.query("update businesses set active=false,platform_status='suspended' where id=$1", [fresh])
  await db.query("update businesses set active=true,platform_status='enabled' where id=$1", [fresh])
  assert.equal((await queue()).length, 1); assert.equal((await queue())[0].id, retained.id); assert.equal((await queue())[0].status, 'skipped')
})
