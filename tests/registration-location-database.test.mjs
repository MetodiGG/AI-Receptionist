import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

let db
const migration = await readFile(new URL('../supabase/migrations/20261112143000_registration_location.sql', import.meta.url), 'utf8')
const point = { latitude: 42.6650291, longitude: 23.2825296 }
const insert = (profile, name = 'Offline new business') => db.query('insert into businesses(name,public_profile) values($1,$2::jsonb) returning id,name,public_profile', [name, JSON.stringify(profile)])
const rows = async (sql, args = []) => (await db.query(sql, args)).rows

test.before(async () => {
  db = new PGlite()
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create table public.businesses(id bigint generated always as identity primary key,name text,public_profile jsonb default '{}'::jsonb,active boolean default true);
    alter table businesses enable row level security;
    create policy existing_owner_policy on businesses for all to authenticated using(true) with check(true);
    grant select,insert,update on businesses to authenticated;
    grant usage,select on sequence businesses_id_seq to authenticated;
    grant all on businesses to service_role;`)
  await insert({}, 'Legacy without a pin')
  await insert({ ...point, description: { bg: 'Existing content', en: '' } }, 'Existing located profile')
})
test.after(async () => { await db?.close() })

test('registration pin migration leaves legacy rows, their RLS and grants byte-identical', async () => {
  const snapshot = async () => ({
    rows: await rows('select * from businesses order by id'),
    rls: await rows("select relrowsecurity,relforcerowsecurity,relacl::text from pg_class where oid='public.businesses'::regclass"),
    policies: await rows("select policyname,roles,cmd,qual,with_check from pg_policies where tablename='businesses' order by policyname"),
  })
  const before = await snapshot()
  await db.exec(migration)
  assert.deepEqual(await snapshot(), before)
})

test('database refuses every missing, partial, string or out-of-range map point', async () => {
  for (const value of [null, {}, [], { latitude: null, longitude: null }, { latitude: 42.66 }, { longitude: 23.28 },
    { latitude: '42.66', longitude: '23.28' }, { latitude: '', longitude: '' },
    { latitude: true, longitude: false }, { latitude: 0, longitude: 0 },
    { latitude: 40.99, longitude: 23.28 }, { latitude: 44.51, longitude: 23.28 },
    { latitude: 42.66, longitude: 21.99 }, { latitude: 42.66, longitude: 29.01 }]) {
    await assert.rejects(insert(value), /BUSINESS_LOCATION_(?:REQUIRED|INVALID)/, JSON.stringify(value))
  }
  assert.equal((await rows('select count(*)::int n from businesses'))[0].n, 2)
})

test('database accepts and preserves actual numeric pin precision without inventing a point', async () => {
  const result = (await insert({ ...point, description: { bg: 'Owner-entered content', en: '' } })).rows[0]
  assert.deepEqual(result.public_profile, { ...point, description: { bg: 'Owner-entered content', en: '' } })
})

test('authenticated direct inserts cannot bypass the registration pin guard', async () => {
  await db.exec('set role authenticated')
  try {
    await assert.rejects(insert({}), /BUSINESS_LOCATION_REQUIRED/)
    const result = await insert(point, 'Offline authenticated business')
    assert.equal(result.rows[0].public_profile.latitude, point.latitude)
  } finally { await db.exec('reset role') }
})

test('legacy profile edits are not retroactively blocked by the INSERT-only guard', async () => {
  await db.query("update businesses set name='Legacy edited safely',public_profile=$1::jsonb where id=1", [JSON.stringify({ description: { bg: 'Updated text', en: '' } })])
  const legacy = (await rows('select name,public_profile from businesses where id=1'))[0]
  assert.equal(legacy.name, 'Legacy edited safely')
  assert.equal(legacy.public_profile.latitude, undefined)
  assert.equal(legacy.public_profile.description.bg, 'Updated text')
})

test('migration is repeatable, creates no data backfill and grants no direct trigger-function access', async () => {
  const before = await rows('select * from businesses order by id')
  await db.exec(migration)
  assert.deepEqual(await rows('select * from businesses order by id'), before)
  const triggers = await rows("select tgname from pg_trigger where tgrelid='businesses'::regclass and not tgisinternal")
  assert.deepEqual(triggers.map(row => row.tgname), ['require_new_business_location'])
  for (const role of ['anon', 'authenticated']) assert.equal((await rows("select has_function_privilege($1,'public.require_new_business_location()','EXECUTE') allowed", [role]))[0].allowed, false)
  await assert.rejects(insert({ latitude: '42.6650291', longitude: point.longitude }), /BUSINESS_LOCATION_REQUIRED/)
})
