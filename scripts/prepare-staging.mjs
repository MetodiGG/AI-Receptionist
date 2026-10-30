// Offline artifact builder only. Never connects to Supabase, reads credentials,
// applies SQL, copies data, schedules email or deploys anything.
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

export const STAGING_PROJECT_REF = 'dbvsfxkmljrwjberwodb'
// Not part of the earlier staging approval. Review/test locally; obtain owner
// approval before applying or adding this to the approved bootstrap artifact.
export const PENDING_STAGING_MIGRATIONS = Object.freeze(['20261030100000_business_content_and_media.sql'])
// Explicitly reviewed allowlist: a later migration requires a new review/test.
export const STAGING_MIGRATIONS = Object.freeze([
  '20261013160000_initial_schema.sql',
  '20261013164000_grant_data_api_access.sql',
  '20261013170000_product_foundation.sql',
  '20261013171000_tenant_integrity.sql',
  '20261013180000_prepilot_platform.sql',
  '20261014150000_partner_pipeline.sql',
  '20261015143000_business_schedule_locations.sql',
  '20261015210000_reliable_booking_emails.sql',
  '20261016120000_customer_booking_history.sql',
  '20261016160000_platform_business_controls.sql',
  '20261016180000_product_launch_foundation.sql',
  '20261016180500_business_publication_review.sql',
  '20261025120000_direct_business_applications.sql',
  '20261026120000_business_profiles_reviews.sql',
  '20261026160000_discovery_budgets.sql',
])
const migrationsRoot = new URL('../supabase/migrations/', import.meta.url)
const sha = value => createHash('sha256').update(value).digest('hex')

export async function buildStagingBootstrap(projectRef) {
  if (projectRef !== STAGING_PROJECT_REF) throw new Error('Only the owner-approved staging project is permitted')
  const migrations = await Promise.all(STAGING_MIGRATIONS.map(async name => {
    const original = await readFile(new URL(name, migrationsRoot), 'utf8')
    // Each reviewed file has exactly one outer transaction. Its body will run
    // in a single atomic DO statement; no nested transaction or partial setup.
    if ((original.match(/^begin;\s*$/gm) || []).length !== 1 || (original.match(/^commit;\s*$/gm) || []).length !== 1) throw new Error(`Review transaction boundaries: ${name}`)
    const sql = original.replace(/^begin;\s*$/m, '').replace(/^commit;\s*$/m, '').trim()
    const [, version, label] = /^(\d{14})_(\w+)\.sql$/.exec(name)
    const delimiter = `$gorez_${version}$`
    if (sql.includes(delimiter) || sql.includes('$gorez_bootstrap$')) throw new Error('Unsafe SQL delimiter')
    return { name, version, label, sql, delimiter, sha256: sha(original) }
  }))
  const values = migrations.map(row => `('${row.version}', '${row.label}', ${row.delimiter}\n${row.sql}\n${row.delimiter})`).join(',\n')
  const sql = `-- OWNER-APPROVED STAGING ONLY: ${projectRef} / gorez-staging.
-- Verify this exact project in the Dashboard URL before running.
-- The empty-database guard protects existing projects, including Production.
-- It is NOT a server-side verification of a Supabase project reference.
-- No seed data, secrets, network requests or scheduler configuration.
-- Source files (SHA-256):
${migrations.map(row => `-- ${row.name} ${row.sha256}`).join('\n')}
begin;
set local lock_timeout = '5s';
set local statement_timeout = '90s';
do $gorez_bootstrap$
declare migration record;
begin
  if exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind in ('r','p','v','m','f','S'))
    or exists(select 1 from auth.users) then
    raise exception 'STAGING_BOOTSTRAP_REQUIRES_EMPTY_DATABASE';
  end if;
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    if exists(select 1 from supabase_migrations.schema_migrations) then
      raise exception 'STAGING_BOOTSTRAP_REQUIRES_EMPTY_HISTORY';
    end if;
  end if;
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations(
    version text not null primary key, statements text[], name text
  );
  alter table supabase_migrations.schema_migrations add column if not exists statements text[];
  alter table supabase_migrations.schema_migrations add column if not exists name text;
  revoke all on schema supabase_migrations from public, anon, authenticated;
  revoke all on supabase_migrations.schema_migrations from public, anon, authenticated;
  for migration in select * from (values
${values}
  ) as source(version,name,sql) order by version loop
    execute migration.sql;
    insert into supabase_migrations.schema_migrations(version,name,statements)
      values(migration.version,migration.name,array[migration.sql]);
  end loop;
end $gorez_bootstrap$;
commit;
select 'gorez-staging-bootstrap-v1' as verification,
  (select count(*) from supabase_migrations.schema_migrations) as migrations,
  (select count(*) from pg_catalog.pg_tables where schemaname='public') as public_tables,
  (select count(*) from pg_catalog.pg_tables where schemaname='public' and rowsecurity) as rls_tables,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.businesses) as businesses,
  (select count(*) from public.customers) as customers,
  (select count(*) from public.appointments) as appointments,
  (select count(*) from public.notification_outbox) as queued_email,
  not has_table_privilege('anon','public.discovery_usage_buckets','SELECT') as private_budgets,
  not has_table_privilege('authenticated','public.business_place_links','INSERT') as private_links,
  exists(select 1 from pg_catalog.pg_constraint where conrelid='public.appointments'::regclass and contype='x') as booking_collision_guard;
`
  return { sql, sha256: sha(sql), migrations: migrations.map(({ sql, delimiter, ...row }) => row) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { 'project-ref': { type: 'string' }, output: { type: 'string' } } })
  if (!values.output || !isAbsolute(values.output)) throw new Error('An explicit absolute --output path is required')
  const result = await buildStagingBootstrap(values['project-ref'])
  // Generated, non-secret mechanical artifact. Never overwrite another file.
  await writeFile(values.output, result.sql, { flag: 'wx', mode: 0o600 })
  console.log(JSON.stringify({ target: STAGING_PROJECT_REF, file: values.output, migrations: result.migrations.length, bytes: Buffer.byteLength(result.sql), sha256: result.sha256 }))
}
