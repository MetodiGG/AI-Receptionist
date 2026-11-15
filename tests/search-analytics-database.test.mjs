import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const migration = await readFile(new URL('../supabase/migrations/20261114100000_aggregate_search_metrics.sql', import.meta.url), 'utf8')
let db
test.before(async () => {
  db = new PGlite()
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create table public.businesses(id integer primary key); insert into businesses values(1);')
  await db.exec(migration)
})
test.after(async () => { await db?.close() })
test.beforeEach(async () => { await db.exec('reset role; truncate search_daily_metrics;') })
test('aggregate migration preserves existing data and adds no user, query, coordinate, timestamp or tracking columns', async () => {
  assert.equal((await db.query('select count(*) n from businesses')).rows[0].n, 1)
  const columns = (await db.query("select column_name from information_schema.columns where table_name='search_daily_metrics'")).rows.map(row => row.column_name)
  assert.deepEqual(columns.sort(), ['metric_day', 'topic', 'locale', 'event', 'outcome', 'latency', 'event_count'].sort())
  assert.doesNotMatch(migration, /alter\s+table\s+(?:public\.)?(businesses|appointments|customers|notification_outbox)|drop\s+|truncate\s+/i)
})
test('anonymous and tenant roles cannot read or execute metric operations; service role only uses narrow definer functions', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`)
    await assert.rejects(db.query('select * from search_daily_metrics'), /permission denied/)
    await assert.rejects(db.query("select record_search_metric('search','маникюр','bg','zero','normal')"), /permission denied/)
    await assert.rejects(db.query('select * from search_metrics_summary(7)'), /permission denied/)
    await db.exec('reset role')
  }
  await db.exec('set role service_role')
  await assert.rejects(db.query('select * from search_daily_metrics'), /permission denied/)
  await db.query("select record_search_metric('search','маникюр','bg','zero','normal')")
  assert.equal((await db.query('select * from search_metrics_summary(7)')).rows[0].event_count, 1)
})
test('repeated events increment one atomic daily bucket and invalid dimensions cannot be recorded', async () => {
  await db.exec('set role service_role')
  for (let i = 0; i < 5; i++) await db.query("select record_search_metric('search','маникюр','bg','zero','normal')")
  assert.equal((await db.query('select * from search_metrics_summary(30)')).rows[0].event_count, 5)
  await assert.rejects(db.query("select record_search_metric('profile','маникюр','bg','zero','normal')"), /check constraint/)
  await assert.rejects(db.query('select * from search_metrics_summary(365)'), /INVALID_PERIOD/)
  await db.exec('reset role')
  assert.equal((await db.query('select count(*) n from search_daily_metrics')).rows[0].n, 1)
})
test('30 UTC-day retention is pruned on writes and reports and period reports never return older days', async () => {
  await db.query("insert into search_daily_metrics values((now() at time zone 'UTC')::date-31,'маникюр','bg','search','zero','unknown',9),((now() at time zone 'UTC')::date-8,'подстригване','bg','search','results','normal',6)")
  assert.equal((await db.query('select * from search_metrics_summary(7)')).rows.length, 0)
  assert.equal((await db.query('select count(*) n from search_daily_metrics')).rows[0].n, 1)
  assert.equal((await db.query('select * from search_metrics_summary(30)')).rows[0].event_count, 6)
  await db.query("select record_search_metric('profile','__other__','en','opened','unknown')")
  assert.equal((await db.query('select * from search_metrics_summary(7)')).rows[0].event, 'profile')
})
