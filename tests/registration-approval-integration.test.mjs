import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Execute the release's two real migrations together. Everything is in-memory;
// there is no Supabase connection, registration, provider or notification call.
const migrations = await Promise.all([
  '20261112143000_registration_location.sql',
  '20261112144000_business_approval_email.sql',
].map(name => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8')))
const owner = '10000000-0000-4000-8000-000000000001'
const other = '10000000-0000-4000-8000-000000000002'
const legacy = '20000000-0000-4000-8000-000000000001'
const future = '20000000-0000-4000-8000-000000000002'
const direct = '20000000-0000-4000-8000-000000000003'
const invalid = '20000000-0000-4000-8000-000000000004'
const point = { latitude: 42.6650291, longitude: 23.2825296 }
let db, before
const rows = async (sql, args = []) => (await db.query(sql, args)).rows
const queue = id => rows('select * from business_approval_email_outbox where business_id=$1', [id])
async function asRole(role, action) {
  await db.exec(`set role ${role}`)
  try { return await action() } finally { await db.exec('reset role') }
}
const insert = (id, profile, published = false) => db.query(`
  insert into businesses(id,owner_id,name,slug,public_profile,active,platform_status,notification_locale,contact_email)
  values($1,$2,'Offline integration business',$3,$4::jsonb,$5,$6,'en','not-the-owner@example.com') returning id,public_profile`,
[id, owner, `offline-${id}`, JSON.stringify(profile), published, published ? 'enabled' : 'pending'])
const businessSecurity = () => rows(`select c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,
  p.policyname,p.roles,p.cmd,p.qual,p.with_check
  from pg_class c join pg_policies p on p.tablename=c.relname and p.schemaname='public'
  where c.oid='public.businesses'::regclass order by p.policyname`)

test.before(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
    create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    create table businesses(
      id uuid primary key,owner_id uuid not null references auth.users(id),name text,slug text,
      public_profile jsonb default '{}'::jsonb,active boolean,platform_status text,
      notification_locale text,contact_email text);
    alter table businesses enable row level security;
    create policy existing_business_owner on businesses for all to authenticated
      using(owner_id=auth.uid()) with check(owner_id=auth.uid());
    revoke all on businesses from anon,authenticated;
    grant select,insert,update on businesses to authenticated,service_role;
    create table notification_outbox(id integer primary key,status text);
    insert into notification_outbox values(1,'pending');`)
  await db.query('insert into auth.users values($1,$3,now()),($2,$4,now())',
    [owner, other, 'owner@example.com', 'other@example.com'])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner])
  await insert(legacy, { description: { bg: 'Legacy text without a point', en: '' } }, true)
  before = {
    businesses: await rows('select * from businesses order by id'),
    auth: await rows('select * from auth.users order by id'),
    security: await businessSecurity(),
  }
  for (const migration of migrations) await db.exec(migration)
})
test.after(async () => { await db?.close() })

test('both migrations preserve existing business/Auth data, owner RLS and visit notifications', async () => {
  assert.deepEqual(await rows('select * from businesses order by id'), before.businesses)
  assert.deepEqual(await rows('select * from auth.users order by id'), before.auth)
  assert.deepEqual(await businessSecurity(), before.security)
  assert.deepEqual(await rows('select * from notification_outbox'), [{ id: 1, status: 'pending' }])
  const [ledger] = await queue(legacy)
  assert.equal(ledger.status, 'skipped'); assert.equal(ledger.last_error, 'PREEXISTING_BUSINESS')
  assert.equal(ledger.recipient, null); assert.equal(ledger.payload, null)
  await asRole('authenticated', async () => {
    assert.equal((await rows('select id from businesses')).length, 1)
    await assert.rejects(db.query('select * from business_approval_email_outbox'), /permission denied/)
    await assert.rejects(db.query('select * from claim_business_approval_email(null)'), /permission denied/)
  })
})

test('a valid future pending registration and its first publication produce exactly one actual owner notice', async () => {
  const result = await asRole('authenticated', () => insert(future, point))
  assert.deepEqual(result.rows[0].public_profile, point)
  assert.deepEqual(await queue(future), [])
  await asRole('service_role', () => db.query("update businesses set active=true,platform_status='enabled' where id=$1", [future]))
  const [notice] = await queue(future)
  assert.equal(notice.status, 'pending'); assert.equal(notice.business_id, future)
  assert.equal(notice.owner_id, owner); assert.equal(notice.recipient, 'owner@example.com')
  assert.equal(notice.locale, 'en'); assert.equal(notice.attempts, 0)
  await asRole('service_role', () => db.query("update businesses set active=true,platform_status='enabled',name='Updated approved business' where id=$1", [future]))
  assert.equal((await queue(future)).length, 1); assert.equal((await queue(future))[0].id, notice.id)
})

test('the INSERT pin guard rejects pending and published missing-pin businesses atomically before any approval queue', async () => {
  const businessesBefore = await rows('select * from businesses order by id')
  const queueBefore = await rows('select * from business_approval_email_outbox order by business_id')
  for (const role of ['authenticated', 'service_role']) for (const published of [false, true]) {
    for (const profile of [{}, null, { latitude: point.latitude }, { latitude: String(point.latitude), longitude: point.longitude }]) {
      await assert.rejects(asRole(role, () => insert(invalid, profile, published)), /BUSINESS_LOCATION_REQUIRED/)
      assert.deepEqual(await rows('select * from businesses order by id'), businessesBefore)
      assert.deepEqual(await rows('select * from business_approval_email_outbox order by business_id'), queueBefore)
    }
  }
  assert.equal((await rows('select id from businesses where id=$1', [invalid])).length, 0)
  assert.deepEqual(await queue(invalid), [])
})

test('correcting a legacy location and no-op publication never change its terminal skipped ledger', async () => {
  const [ledger] = await queue(legacy)
  await asRole('authenticated', () => db.query('update businesses set public_profile=public_profile||$2::jsonb where id=$1', [legacy, JSON.stringify(point)]))
  const [corrected] = await rows('select public_profile from businesses where id=$1', [legacy])
  assert.deepEqual(corrected.public_profile, { description: { bg: 'Legacy text without a point', en: '' }, ...point })
  await asRole('service_role', () => db.query("update businesses set active=true,platform_status='enabled' where id=$1", [legacy]))
  assert.deepEqual(await queue(legacy), [ledger], 'nontransition publication cannot enqueue a legacy notice')
  await asRole('service_role', () => db.query("update businesses set active=false,platform_status='suspended' where id=$1", [legacy]))
  await asRole('service_role', () => db.query("update businesses set active=true,platform_status='enabled' where id=$1", [legacy]))
  assert.deepEqual(await queue(legacy), [ledger], 'even a later true transition respects the no-backfill ledger')
})

test('a future legacy-direct initially published insert needs a valid point and queues its first publication once', async () => {
  await asRole('authenticated', () => insert(direct, point, true))
  const [notice] = await queue(direct)
  assert.equal(notice.status, 'pending'); assert.equal(notice.recipient, 'owner@example.com')
  assert.equal(notice.business_id, direct); assert.equal(notice.owner_id, owner)
  await asRole('authenticated', () => db.query("update businesses set active=true,platform_status='enabled' where id=$1", [direct]))
  assert.equal((await queue(direct)).length, 1); assert.equal((await queue(direct))[0].id, notice.id)
  await asRole('service_role', async () => {
    const [claimed] = await rows('select * from claim_business_approval_email($1)', [direct])
    assert.equal(claimed.business_id, direct); assert.equal(claimed.status, 'processing')
    assert.equal((await rows('select * from claim_business_approval_email($1)', [direct])).length, 0)
    assert.equal((await rows('select business_approval_email_current($1,$2) valid', [claimed.id, claimed.claim_token]))[0].valid, true)
  })
})
