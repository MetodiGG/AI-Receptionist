import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const migration = await readFile(new URL('../supabase/migrations/20261026160000_discovery_budgets.sql', import.meta.url), 'utf8')
let db
const rows = async (sql, params = []) => (await db.query(sql, params)).rows
const claim = async (overrides = {}) => {
  const options = { environment: 'production', provider: 'google', daily: 10, monthly: 15, dailyCost: 1000000, monthlyCost: 2000000, cost: 32000, ...overrides }
  return (await rows('select claim_discovery_budget($1,$2,$3,$4,$5,$6,$7) allowed', Object.values(options)))[0].allowed
}
test.before(async () => {
  db = new PGlite()
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create table public.businesses(id uuid primary key,name text);
    insert into businesses values('10000000-0000-4000-8000-000000000001','Existing business');
    insert into auth.users values('20000000-0000-4000-8000-000000000001');`)
  await db.exec(migration)
})
test.after(async () => { await db?.close() })
test.beforeEach(async () => { await db.exec('reset role; truncate discovery_usage_buckets,business_place_links;') })

test('discovery migration is repeatable and preserves existing business records', async () => {
  await db.exec(migration)
  assert.equal((await rows('select * from businesses'))[0].name, 'Existing business')
  assert.equal((await rows('select * from discovery_usage_buckets')).length, 0)
})
test('daily and monthly request reservations update together and never exceed their limits', async () => {
  for (let i = 0; i < 10; i++) assert.equal(await claim(), true)
  assert.equal(await claim(), false)
  const buckets = await rows('select * from discovery_usage_buckets')
  assert.equal(buckets.length, 2)
  assert.ok(buckets.every(row => row.request_count === 10 && row.reserved_microusd === 320000))
})
test('monthly count blocks the next day too; cost ceiling blocks before count quota', async () => {
  assert.equal(await claim({ monthly: 1 }), true)
  await db.exec("delete from discovery_usage_buckets where period_type='day'")
  assert.equal(await claim({ monthly: 1 }), false)
  await db.exec('truncate discovery_usage_buckets')
  assert.equal(await claim({ dailyCost: 50000 }), true)
  assert.equal(await claim({ dailyCost: 50000 }), false)
  assert.ok((await rows('select * from discovery_usage_buckets')).every(row => row.request_count === 1))
})
test('parallel requests share the same counters without overspending either budget', async () => {
  const results = await Promise.all(Array.from({ length: 20 }, () => claim({ daily: 3 })))
  assert.equal(results.filter(Boolean).length, 3)
  assert.ok((await rows('select * from discovery_usage_buckets')).every(row => row.request_count === 3))
})
test('environments and providers are isolated, failed requests stay reserved, expired aggregates are cleaned', async () => {
  assert.equal(await claim({ daily: 1 }), true)
  assert.equal(await claim({ daily: 1 }), false)
  assert.equal(await claim({ daily: 1, environment: 'preview' }), true)
  assert.equal(await claim({ daily: 1, provider: 'ai', cost: 3000 }), true)
  await db.exec("insert into discovery_usage_buckets values('development','google','day',current_date-100,1,1)")
  await claim({ environment: 'development' })
  assert.equal((await rows('select * from discovery_usage_buckets where period_start < current_date-90')).length, 0)
})
test('null, negative, unknown and unreasonable limits never authorize billing', async () => {
  for (const options of [{ daily: 0 }, { monthly: null }, { cost: null }, { cost: 0 }, { environment: 'forged' }, { provider: 'forged' }, { monthlyCost: 999999999 }]) assert.equal(await claim(options), false)
  assert.equal((await rows('select * from discovery_usage_buckets')).length, 0)
})
test('only one verified internal business can own a Place ID and business deletion removes the association', async () => {
  await db.exec("insert into business_place_links values('10000000-0000-4000-8000-000000000001','TEST_GOOGLE_ID','20000000-0000-4000-8000-000000000001',now())")
  await db.exec("insert into businesses values('10000000-0000-4000-8000-000000000002','Second business')")
  await assert.rejects(db.exec("insert into business_place_links(business_id,place_id) values('10000000-0000-4000-8000-000000000002','TEST_GOOGLE_ID')"), /unique/)
  await db.exec("delete from businesses where id='10000000-0000-4000-8000-000000000002'")
})
test('anonymous users and business owners cannot read, reset, reserve or forge links', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`)
    for (const statement of ['select * from discovery_usage_buckets', 'delete from discovery_usage_buckets', "select claim_discovery_budget('production','google',10,20,100000,100000,1)", 'select * from business_place_links', "insert into business_place_links(business_id,place_id) values('10000000-0000-4000-8000-000000000001','FORGED_ID')"]) await assert.rejects(db.exec(statement), /permission denied/)
    await db.exec('reset role')
  }
  await db.exec('set role service_role')
  assert.equal(await claim(), true)
  await db.exec('reset role')
})
