import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { buildStagingBootstrap, STAGING_PROJECT_REF, STAGING_MIGRATIONS, PENDING_STAGING_MIGRATIONS } from '../scripts/prepare-staging.mjs'

let db, artifact
const fixture = `create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema auth to authenticated,service_role; grant execute on function auth.uid() to authenticated,service_role;
  create function public.fixture_auto_rls() returns event_trigger language plpgsql as $$declare cmd record;begin
    for cmd in select * from pg_event_trigger_ddl_commands() loop
      if cmd.command_tag='CREATE TABLE' and cmd.schema_name='public' then execute 'alter table '||cmd.object_identity||' enable row level security';end if;
    end loop;end$$;
  create event trigger fixture_auto_rls on ddl_command_end when tag in ('CREATE TABLE') execute function public.fixture_auto_rls();`
async function fresh() {
  const database = new PGlite({ extensions: { btree_gist } })
  await database.exec(fixture)
  return database
}
test.before(async () => { artifact = await buildStagingBootstrap(STAGING_PROJECT_REF); db = await fresh() })
test.after(async () => { await db?.close() })

test('staging builder allows only the approved project and includes every reviewed migration in order', async () => {
  for (const ref of [undefined, '', 'ilpdtvbymxqgimrboyvh', 'otheremptyprojectabcd', "x';drop table t;--"]) await assert.rejects(buildStagingBootstrap(ref), /owner-approved/)
  const files = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter(name => /^\d{14}_.*\.sql$/.test(name)).sort()
  assert.deepEqual([...STAGING_MIGRATIONS, ...PENDING_STAGING_MIGRATIONS].sort(), files)
  assert.ok(PENDING_STAGING_MIGRATIONS.every(name => !STAGING_MIGRATIONS.includes(name)))
  assert.doesNotMatch(artifact.sql, /change_business_media|business_content_audit/)
  assert.equal(artifact.migrations.length, 15); assert.match(artifact.sha256, /^[a-f0-9]{64}$/)
  assert.doesNotMatch(artifact.sql, /cron\.schedule|net\.http|ilpdtvbymxqgimrboyvh|service_role_key|resend_api_key/i)
})

test('all fifteen original migrations execute atomically on an empty database with automatic RLS', async () => {
  const replies = await db.exec(artifact.sql)
  const row = replies.at(-1).rows[0]
  assert.deepEqual(row, { verification: 'gorez-staging-bootstrap-v1', migrations: 15, public_tables: 22, rls_tables: 22,
    auth_users: 0, businesses: 0, customers: 0, appointments: 0, queued_email: 0,
    private_budgets: true, private_links: true, booking_collision_guard: true })
  const history = (await db.query('select version,name,statements from supabase_migrations.schema_migrations order by version')).rows
  assert.deepEqual(history.map(row => `${row.version}_${row.name}.sql`), [...STAGING_MIGRATIONS])
  assert.ok(history.every(row => row.statements.length === 1 && row.statements[0].length > 100))
})

test('anonymous/customer roles cannot access private discovery data, mutation RPCs or migration history', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`)
    for (const sql of ['select * from discovery_usage_buckets', 'select * from business_place_links', 'select * from supabase_migrations.schema_migrations',
      "select claim_discovery_budget('preview','google',1,1,1,1,1)", "select submit_business_application(null,false,'{}')"])
      await assert.rejects(db.query(sql), /permission denied/)
    await db.exec('reset role')
  }
  assert.equal((await db.query("select has_function_privilege('service_role','public.claim_discovery_budget(text,text,integer,integer,bigint,bigint,bigint)','EXECUTE') ok")).rows[0].ok, true)
})

test('re-running the bootstrap refuses a non-empty schema without modifying its data/history', async () => {
  await assert.rejects(db.exec(artifact.sql), /STAGING_BOOTSTRAP_REQUIRES_EMPTY_DATABASE/)
  await db.exec('rollback')
  assert.equal((await db.query('select count(*)::int n from supabase_migrations.schema_migrations')).rows[0].n, 15)
  assert.equal((await db.query('select count(*)::int n from businesses')).rows[0].n, 0)
})

test('existing tenant tables, Auth identities and migration history stop setup before any schema write', async () => {
  const other = await fresh()
  try {
    await other.exec("create table public.existing_data(id integer); insert into public.existing_data values(7)")
    await assert.rejects(other.exec(artifact.sql), /STAGING_BOOTSTRAP_REQUIRES_EMPTY_DATABASE/); await other.exec('rollback')
    assert.equal((await other.query('select id from existing_data')).rows[0].id, 7)
    assert.equal((await other.query("select to_regclass('supabase_migrations.schema_migrations') name")).rows[0].name, null)
    await other.exec("drop table existing_data; insert into auth.users(id) values(gen_random_uuid())")
    await assert.rejects(other.exec(artifact.sql), /STAGING_BOOTSTRAP_REQUIRES_EMPTY_DATABASE/); await other.exec('rollback')
    assert.equal((await other.query('select count(*)::int n from auth.users')).rows[0].n, 1)
    await other.exec("delete from auth.users; create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key); insert into supabase_migrations.schema_migrations values('old-version')")
    await assert.rejects(other.exec(artifact.sql), /STAGING_BOOTSTRAP_REQUIRES_EMPTY_HISTORY/); await other.exec('rollback')
    assert.equal((await other.query('select version from supabase_migrations.schema_migrations')).rows[0].version, 'old-version')
  } finally { await other.close() }
})

test('an error in the last migration rolls back every earlier table and history entry', async () => {
  const other = await fresh()
  try {
    const broken = artifact.sql.replace("-- A name match is not proof.", "select * from deliberately_missing_staging_table;\n-- A name match is not proof.")
    await assert.rejects(other.exec(broken), /deliberately_missing_staging_table/); await other.exec('rollback')
    assert.equal((await other.query("select count(*)::int n from pg_tables where schemaname='public'")).rows[0].n, 0)
    assert.equal((await other.query("select to_regclass('supabase_migrations.schema_migrations') name")).rows[0].name, null)
  } finally { await other.close() }
})
