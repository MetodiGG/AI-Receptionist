import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const readMigration = name => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8')
const prior = await readMigration('20261112153000_registration_address_lookup.sql')
const strict = await readMigration('20261124205000_sofia_exact_location_writes.sql')
const isolation = await readMigration('20261125001500_sofia_location_rpc_isolation.sql')
const body = sql => {
  assert.equal((sql.match(/^begin;\s*$/gm) || []).length, 1)
  assert.equal((sql.match(/^commit;\s*$/gm) || []).length, 1)
  return sql.replace(/^begin;\s*$/m, '').replace(/^commit;\s*$/m, '')
}
const combinedBody = `${body(strict)}\n${body(isolation)}`
const id = '20000000-0000-4000-8000-000000000001'
const second = '20000000-0000-4000-8000-000000000002'
const missing = '20000000-0000-4000-8000-000000000003'
const point = { latitude: 42.716, longitude: 23.307, source_url: 'https://www.openstreetmap.org/way/98765', licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' }
// Synthetic fixture coordinates do not establish a real address or entrance.
const fixture = async () => {
  const db = new PGlite()
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create table public.businesses(id uuid primary key,city_ekatte text,city text,neighborhood text,address text,public_profile jsonb,active boolean,platform_status text);
    alter table public.businesses enable row level security;
    create policy published on public.businesses for select to anon,authenticated using(active and platform_status='enabled');
    grant select on public.businesses to anon,authenticated;
    grant all on public.businesses to service_role;
    create table public.business_place_links(business_id uuid primary key references public.businesses(id),place_id text not null unique,verified_by uuid,verified_at timestamptz);
    grant all on public.business_place_links to service_role;
    create table public.appointments(id uuid primary key,business_id uuid references public.businesses(id),starts_at timestamptz,ends_at timestamptz,status text,source text,notes text);
    alter table public.appointments enable row level security;
    revoke all on public.appointments from public,anon,authenticated,service_role;
    create table public.notification_outbox(id integer primary key,appointment_id uuid references public.appointments(id),payload jsonb);
    revoke all on public.notification_outbox from public,anon,authenticated,service_role;`)
  await db.exec(prior)
  await db.query(`insert into public.businesses values
    ($1,'68134','София',null,'бул. Сливница 178Е, София','{"description":{"bg":"Fixture only"}}',true,'enabled'),
    ($2,'68134','София',null,'бул. Сливница 178Е, София','{}',true,'enabled')`, [id, second])
  await db.query(`insert into public.appointments values
    ('30000000-0000-4000-8000-000000000001',$1,'2026-11-25T10:00:00Z','2026-11-25T10:45:00Z','booked','native','Synthetic private note'),
    ('30000000-0000-4000-8000-000000000002',$2,'2026-10-25T01:30:00Z','2026-10-25T02:00:00Z','cancelled','manual',null)`, [id, second])
  await db.exec(`insert into public.notification_outbox values(1,'30000000-0000-4000-8000-000000000001','{"fixture":true}')`)
  return db
}
const rows = async (db, sql, args) => (await db.query(sql, args)).rows
const apply = db => db.exec(`begin isolation level repeatable read;${combinedBody}\ncommit;`)
const claim = async (db, business = id, version = '') => (await rows(db,
  `select public.claim_registration_address_lookup${version}($1) as result`, [business]))[0].result
const finish = async (db, lease, version = '', status = 'matched', result = point) => (await rows(db,
  `select public.finish_registration_address_lookup${version}($1,$2,$3,$4,$5::jsonb,null) as result`,
  [lease.business.id, lease.address_key, lease.claim_token, status, result && JSON.stringify(result)]))[0].result
const clearGate = db => db.exec("update public.registration_address_lookup_gate set next_allowed_at='-infinity',locked_until=null,claim_token=null")
const snapshot = async db => ({
  businesses: await rows(db, "select to_jsonb(b)-'location_revision' as row from public.businesses b order by id"),
  appointments: await rows(db, 'select * from public.appointments order by id'),
  notifications: await rows(db, 'select * from public.notification_outbox order by id'),
  cache: await rows(db, "select to_jsonb(c)-'claim_location_revision' as row from public.registration_address_lookup_cache c order by address_key"),
  gate: await rows(db, 'select * from public.registration_address_lookup_gate order by singleton'),
  sources: await rows(db, "select to_jsonb(s)-'match_version'-'location_revision' as row from public.registration_location_sources s order by business_id"),
  links: await rows(db, "select to_jsonb(p)-'location_revision' as row from public.business_place_links p order by business_id"),
})
const functions = db => rows(db, `select p.oid,p.proname,p.prosrc,p.prosecdef,p.proconfig,p.proargnames,p.pronargdefaults,
  p.prorettype::regtype::text as returns,p.provolatile
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('claim_registration_address_lookup','finish_registration_address_lookup',
    'claim_registration_address_lookup_v2','finish_registration_address_lookup_v2') order by p.proname`)

test('original reviewed migration is unchanged; combined bodies preserve all existing rows and strict function contracts', async () => {
  assert.equal(createHash('sha256').update(strict).digest('hex'), 'dfc0d70f7fc2c1ba7284da1a5f283d21d7eead4e604b792db76d4293ad81747d')
  const db = await fixture()
  try {
    await db.exec(strict)
    const before = await snapshot(db), original = await functions(db)
    await db.exec(isolation)
    assert.deepEqual(await snapshot(db), before)
    const after = await functions(db)
    for (const previous of original) {
      const legacy = after.find(row => row.proname === previous.proname)
      const versioned = after.find(row => row.proname === `${previous.proname}_v2`)
      assert.equal(legacy.oid, previous.oid, 'legacy prepared/cached calls retain a now-harmless OID')
      assert.notEqual(versioned.oid, previous.oid)
      for (const field of ['prosrc', 'prosecdef', 'proconfig', 'proargnames', 'pronargdefaults', 'returns', 'provolatile']) assert.deepEqual(versioned[field], previous[field], field)
      assert.equal(legacy.prosecdef, false)
      assert.equal(legacy.provolatile, 's')
      assert.deepEqual(legacy.proconfig, ['search_path=""'])
    }
    assert.equal((await rows(db, 'select count(*)::integer as count from public.business_location_changes'))[0].count, 0)
  } finally { await db.close() }
})

test('both migration bodies commit atomically and a later failure rolls back schema, functions and all fixture rows', async () => {
  const db = await fixture()
  try {
    const before = await snapshot(db), original = await functions(db)
    await assert.rejects(db.exec(`begin isolation level repeatable read;${combinedBody}\nselect 1/0;commit;`), /division by zero/u)
    await db.exec('rollback')
    assert.deepEqual(await snapshot(db), before)
    assert.deepEqual(await functions(db), original)
    assert.equal((await rows(db, "select to_regclass('public.business_location_changes') as relation"))[0].relation, null)
    await apply(db)
    assert.deepEqual(await snapshot(db), before)
    assert.equal((await functions(db)).length, 4)
  } finally { await db.close() }
})

test('legacy calls cannot claim, finish, alter caches, release a v2 lease or consume the shared provider budget', async () => {
  const db = await fixture()
  try {
    const oldLease = await claim(db)
    await apply(db)
    let before = await snapshot(db)
    for (const business of [id, second, missing, null]) assert.deepEqual(await claim(db, business), { state: 'review_required' })
    assert.deepEqual(await finish(db, oldLease), { state: 'stale_claim', applied: false })
    assert.deepEqual(await finish(db, oldLease, '', 'invalid', { untrusted: true }), { state: 'stale_claim', applied: false })
    assert.deepEqual(await snapshot(db), before)
    assert.deepEqual(await finish(db, oldLease, '_v2'), { state: 'stale_claim', applied: false })
    assert.deepEqual(await snapshot(db), before)
    await clearGate(db)
    await db.exec('set role service_role')
    const strictLease = await claim(db, id, '_v2')
    assert.equal(strictLease.state, 'claimed')
    assert.equal(strictLease.match_version, 2)
    await db.exec('reset role')
    before = await snapshot(db)
    assert.deepEqual(await finish(db, strictLease), { state: 'stale_claim', applied: false })
    assert.deepEqual(await snapshot(db), before)
    await db.exec('set role service_role')
    assert.deepEqual(await finish(db, strictLease, '_v2'), { state: 'matched', applied: true })
    await db.exec('reset role')
    assert.deepEqual((await snapshot(db)).appointments, before.appointments)
    assert.deepEqual((await snapshot(db)).notifications, before.notifications)
    assert.deepEqual(await rows(db, 'select match_version,location_revision from public.registration_location_sources'), [{ match_version: 2, location_revision: 1 }])
  } finally { await db.close() }
})

test('old matched cache evidence stays intact but is never reused as strict v2 evidence', async () => {
  const db = await fixture()
  try {
    const oldLease = await claim(db)
    assert.deepEqual(await finish(db, oldLease), { state: 'matched', applied: true })
    const before = await snapshot(db)
    await apply(db)
    assert.deepEqual(await snapshot(db), before)
    assert.deepEqual(await claim(db, second), { state: 'review_required' })
    assert.deepEqual(await snapshot(db), before)
    await clearGate(db)
    const strictLease = await claim(db, second, '_v2')
    assert.equal(strictLease.state, 'claimed')
    assert.notEqual(strictLease.address_key, oldLease.address_key)
    assert.equal(strictLease.result, undefined)
    assert.deepEqual(await finish(db, strictLease, '_v2'), { state: 'matched', applied: true })
    assert.deepEqual(await rows(db, 'select business_id,match_version,location_revision from public.registration_location_sources order by business_id'), [
      { business_id: id, match_version: 1, location_revision: null },
      { business_id: second, match_version: 2, location_revision: 1 },
    ])
    assert.deepEqual((await snapshot(db)).appointments, before.appointments)
    await db.exec('set role anon')
    assert.deepEqual(await rows(db, 'select business_id from public.registration_location_sources'), [{ business_id: second }])
  } finally { await db.close() }
})

test('strict cache reuse survives isolation while legacy finish cannot complete an existing strict lease', async () => {
  const db = await fixture()
  try {
    await db.exec(strict)
    const lease = await claim(db)
    const before = await snapshot(db)
    await db.exec(isolation)
    assert.deepEqual(await snapshot(db), before)
    assert.deepEqual(await finish(db, lease), { state: 'stale_claim', applied: false })
    assert.deepEqual(await snapshot(db), before)
    assert.deepEqual(await finish(db, lease, '_v2'), { state: 'matched', applied: true })
    const cached = await claim(db, second, '_v2')
    assert.equal(cached.state, 'cached')
    assert.deepEqual(cached.result, point)
    assert.deepEqual(await finish(db, cached, '_v2'), { state: 'matched', applied: true })
    assert.deepEqual((await snapshot(db)).appointments, before.appointments)
    assert.deepEqual((await snapshot(db)).notifications, before.notifications)
  } finally { await db.close() }
})

test('all four RPCs deny anon/authenticated/PUBLIC execution and retain explicit service-role-only grants', async () => {
  const db = await fixture()
  try {
    await apply(db)
    const lease = { business: { id }, address_key: 'a'.repeat(32), claim_token: missing }
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`)
      for (const version of ['', '_v2']) {
        await assert.rejects(claim(db, id, version), /permission denied/u)
        await assert.rejects(finish(db, lease, version), /permission denied/u)
      }
      await db.exec('reset role')
    }
    assert.deepEqual(await rows(db, `select p.proname,has_function_privilege('service_role',p.oid,'EXECUTE') as service,
      has_function_privilege('anon',p.oid,'EXECUTE') as anon,has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated,
      exists(select 1 from aclexplode(p.proacl) a where a.grantee=0 and a.privilege_type='EXECUTE') as public
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
      and p.proname in ('claim_registration_address_lookup','finish_registration_address_lookup',
        'claim_registration_address_lookup_v2','finish_registration_address_lookup_v2') order by p.proname`),
    (await functions(db)).map(({ proname }) => ({ proname, service: true, anon: false, authenticated: false, public: false })))
    await db.exec('set role service_role')
    assert.deepEqual(await claim(db), { state: 'review_required' })
    assert.deepEqual(await finish(db, lease), { state: 'stale_claim', applied: false })
  } finally { await db.close() }
})

test('pre-existing PREPAREd legacy calls keep their original OIDs and execute only harmless stubs after isolation', async () => {
  const db = await fixture()
  try {
    await db.exec(strict)
    const beforeFunctions = await functions(db)
    await db.exec(`prepare legacy_claim(uuid) as select public.claim_registration_address_lookup($1) as result;
      prepare legacy_finish(uuid,text,uuid,text,jsonb,integer) as select public.finish_registration_address_lookup($1,$2,$3,$4,$5,$6) as result;`)
    const lease = (await rows(db, `execute legacy_claim('${id}')`))[0].result
    assert.equal(lease.state, 'claimed')
    await db.exec(isolation)
    const before = await snapshot(db)
    await db.exec('set role service_role')
    assert.deepEqual((await rows(db, `execute legacy_claim('${second}')`))[0].result, { state: 'review_required' })
    assert.deepEqual((await rows(db, `execute legacy_finish('${id}','${lease.address_key}','${lease.claim_token}','matched',null,null)`))[0].result, { state: 'stale_claim', applied: false })
    await db.exec('reset role')
    assert.deepEqual(await snapshot(db), before)
    for (const original of beforeFunctions) assert.equal((await functions(db)).find(row => row.proname === original.proname).oid, original.oid)
  } finally { await db.close() }
})

test('missing predecessor, altered definition, overloads and unsafe replay fail closed without persistent changes', async () => {
  const cases = [
    { setup: async () => {}, expected: /SOFIA_LOCATION_RPC_PREDECESSOR_REQUIRED/u },
    { setup: db => db.exec(`${body(strict)}\ncreate or replace function public.claim_registration_address_lookup(p_business uuid) returns jsonb language sql as $$select '{}'::jsonb$$;`), expected: /SOFIA_LOCATION_RPC_DEFINITION_CHANGED/u },
    { setup: db => db.exec(`${body(strict)}\nalter function public.claim_registration_address_lookup(uuid) security invoker;`), expected: /SOFIA_LOCATION_RPC_DEFINITION_CHANGED/u },
    { setup: db => db.exec(`${body(strict)}\ncreate function public.claim_registration_address_lookup(p_business text) returns jsonb language sql as $$select '{}'::jsonb$$;`), expected: /SOFIA_LOCATION_RPC_DEFINITION_CHANGED/u },
    { setup: apply, expected: /SOFIA_LOCATION_RPC_ALREADY_ISOLATED/u },
    { setup: apply, attempt: apply, expected: /SOFIA_LOCATION_RPC_ALREADY_ISOLATED/u },
  ]
  for (const { setup, attempt = db => db.exec(isolation), expected } of cases) {
    const db = await fixture()
    try {
      await setup(db)
      const before = await snapshot(db), original = await functions(db)
      await assert.rejects(attempt(db), expected)
      await db.exec('rollback')
      assert.deepEqual(await snapshot(db), before)
      assert.deepEqual(await functions(db), original)
    } finally { await db.close() }
  }
})
