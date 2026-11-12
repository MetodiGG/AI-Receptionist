import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const migration = await readFile(new URL('../supabase/migrations/20261112220000_admin_business_reports.sql', import.meta.url), 'utf8')
const business = '10000000-0000-4000-8000-000000000001', other = '10000000-0000-4000-8000-000000000002', external = '10000000-0000-4000-8000-000000000003'
const owner = '90000000-0000-4000-8000-000000000001'
const customer = n => `20000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const appointment = n => `30000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const service = '40000000-0000-4000-8000-000000000001', otherService = '40000000-0000-4000-8000-000000000002'
const staff = '50000000-0000-4000-8000-000000000001', otherStaff = '50000000-0000-4000-8000-000000000002'
// The Sofia autumn DST day is 25 hours; [from,until) is authoritative UTC.
const from = '2026-10-25T00:00:00+03:00', until = '2026-10-26T00:00:00+02:00'
let db, before
const rows = async (sql,args=[]) => (await db.query(sql,args)).rows
async function report(patch={}) {
  const p = { business, from, until, basis:'visit', status:'all', view:'bookings', page:1, pageSize:25, ...patch }
  return (await rows('select public.admin_business_report($1,$2,$3,$4,$5,$6,$7,$8) as result',[p.business,p.from,p.until,p.basis,p.status,p.view,p.page,p.pageSize]))[0].result
}
async function asRole(role, action) { await db.exec(`set role ${role}`); try { return await action() } finally { await db.exec('reset role') } }
async function transaction(action) { await db.exec('begin'); try { return await action() } finally { await db.exec('rollback') } }
async function insertBooking(n, patch={}) {
  const p = { id:appointment(n), business, customer:customer(1), service, staff, startsAt:'2026-10-25T15:00:00Z', createdAt:'2026-10-25T08:00:00Z', status:'booked', source:'web', ...patch }
  await db.query(`insert into appointments(id,business_id,customer_id,service_id,staff_id,starts_at,ends_at,created_at,status,source,notes,cancellation_token,intake_answers)
    values($1,$2,$3,$4,$5,$6,$6::timestamptz+interval '30 minutes',$7,$8,$9,'PRIVATE_BOOKING_NOTE','PRIVATE_CANCELLATION_TOKEN','{"private":"PRIVATE_INTAKE"}')`,[p.id,p.business,p.customer,p.service,p.staff,p.startsAt,p.createdAt,p.status,p.source])
}
const coreData = async () => Object.fromEntries(await Promise.all(['businesses','customers','appointments','services','staff','notification_outbox'].map(async table=>[table,await rows(`select * from ${table} order by id`)])))
const security = () => rows(`select c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,
  p.policyname,p.roles,p.cmd,p.qual,p.with_check from pg_class c left join pg_policies p on p.tablename=c.relname and p.schemaname='public'
  where c.oid in ('businesses'::regclass,'customers'::regclass,'appointments'::regclass,'services'::regclass,'staff'::regclass)
  order by c.relname,p.policyname`)

test.before(async () => {
  db = new PGlite()
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
    create schema auth;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;
    create table businesses(id uuid primary key,owner_id uuid,name text,timezone text,booking_mode text,active boolean,platform_status text);
    create table customers(id uuid primary key,business_id uuid,name text,phone text,email text,notes text,created_at timestamptz default now());
    create table services(id uuid primary key,business_id uuid,name text,active boolean,price numeric);
    create table staff(id uuid primary key,business_id uuid,name text,active boolean,email text,bio text);
    create table appointments(id uuid primary key,business_id uuid,customer_id uuid,service_id uuid,staff_id uuid,starts_at timestamptz not null,ends_at timestamptz not null,created_at timestamptz not null,
      status text check(status in ('booked','confirmed','done','cancelled','no_show')),source text,notes text,cancellation_token text,intake_answers jsonb);
    create index appointments_business_id_starts_at_idx on appointments(business_id,starts_at);
    create table notification_outbox(id int,status text);insert into notification_outbox values(1,'pending');`)
  for (const table of ['businesses','customers','appointments','services','staff']) {
    await db.exec(`alter table ${table} enable row level security;revoke all on ${table} from anon,authenticated;grant select on ${table} to authenticated,service_role;`)
    const condition = table === 'businesses' ? 'owner_id=auth.uid()' : `exists(select 1 from businesses b where b.id=${table}.business_id and b.owner_id=auth.uid())`
    await db.exec(`create policy existing_owner on ${table} for select to authenticated using(${condition})`)
  }
  for (const [id,name,mode] of [[business,'Offline report salon','native'],[other,'Unrelated private business','native'],[external,'External calendar business','external']]) await db.query("insert into businesses values($1,$2,$3,'Europe/Sofia',$4,true,'enabled')",[id,owner,name,mode])
  for (const [n,name,phone,email] of [[1,'Ана QA','+359000000001','same@example.invalid'],[2,'Борис QA','+359000000002','second@example.invalid'],[3,'Изтрит клиент',null,null],[4,'Ана QA','+359000000001','same@example.invalid'],[5,'Без резервации',null,null]]) await db.query("insert into customers(id,business_id,name,phone,email,notes) values($1,$2,$3,$4,$5,'PRIVATE_CUSTOMER_NOTE')",[customer(n),business,name,phone,email])
  await db.query("insert into customers(id,business_id,name,phone,email,notes) values($1,$2,'OTHER_PRIVATE_CUSTOMER','OTHER_PRIVATE_PHONE','OTHER_PRIVATE_EMAIL','PRIVATE_CUSTOMER_NOTE')",[customer(9),other])
  await db.query("insert into services values($1,$3,'Historical service',false,25),($2,$4,'OTHER_PRIVATE_SERVICE',true,200)",[service,otherService,business,other])
  await db.query("insert into staff values($1,$3,'Historical specialist',false,'PRIVATE_STAFF_EMAIL','PRIVATE_STAFF_BIO'),($2,$4,'OTHER_PRIVATE_STAFF',true,'PRIVATE_STAFF_EMAIL','PRIVATE_STAFF_BIO')",[staff,otherStaff,business,other])
  const fixtures = [
    [1,1,'2026-10-24T21:00:00Z','2026-10-20T10:00:00Z','booked','web'],
    [2,1,'2026-10-25T00:30:00Z','2026-10-25T08:00:00Z','confirmed','web'],
    [3,2,'2026-10-25T01:30:00Z','2026-10-25T08:00:00Z','done','bot'],
    [4,2,'2026-10-25T06:00:00Z','2026-10-25T09:00:00Z','cancelled','web'],
    [5,3,'2026-10-25T10:00:00Z','2026-10-25T10:00:00Z','no_show','manual'],
    [6,4,'2026-10-25T21:59:59.999Z','2026-10-25T11:00:00Z','booked','manual'],
    [7,1,'2026-10-24T20:59:59.999Z','2026-10-25T11:00:00Z','done','web'],
    [8,1,'2026-10-25T22:00:00Z','2026-10-25T12:00:00Z','booked','web'],
  ]
  for (const [n,c,startsAt,createdAt,status,source] of fixtures) await insertBooking(n,{customer:customer(c),startsAt,createdAt,status,source})
  await insertBooking(9,{business:other,customer:customer(9),service:otherService,staff:otherStaff})
  before={data:await coreData(),security:await security()}
  await db.exec(migration)
})
test.after(async () => { await db?.close() })

test('report migration is additive and repeatable; existing rows, RLS, grants, policies and notification data stay unchanged', async () => {
  assert.deepEqual(await coreData(),before.data);assert.deepEqual(await security(),before.security)
  await db.exec(migration)
  assert.deepEqual(await coreData(),before.data);assert.deepEqual(await security(),before.security)
  assert.ok((await rows("select indexname from pg_indexes where indexname='appointments_business_created_report_idx'")).length)
})

test('only the service role can execute the stable invoker report; public and authenticated business owners cannot', async () => {
  for (const role of ['anon','authenticated']) await asRole(role,async () => {
    await assert.rejects(report(),/permission denied for function admin_business_report/)
  })
  const meta=(await rows("select prosecdef,provolatile,proconfig from pg_proc where oid='public.admin_business_report(uuid,timestamptz,timestamptz,text,text,text,integer,integer)'::regprocedure"))[0]
  assert.equal(meta.prosecdef,false);assert.equal(meta.provolatile,'s');assert.ok(meta.proconfig.includes('search_path=""'))
  const result=await asRole('service_role',()=>report())
  assert.equal(result.summary.bookings,6)
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await asRole('authenticated',async () => { assert.ok((await rows('select id from businesses')).length);await assert.rejects(report({business:other}),/permission denied/) })
})

test('visit period includes its first instant and excludes the next midnight across the Sofia 25-hour DST day', async () => {
  const result=await report()
  assert.deepEqual(result.summary,{bookings:6,customers:4,statuses:{booked:2,confirmed:1,done:1,cancelled:1,no_show:1}})
  assert.deepEqual(result.filtered,{bookings:6,customers:4})
  assert.deepEqual(result.rows.map(row=>row.id),[6,5,4,3,2,1].map(appointment))
  assert.equal(result.totalRows,6);assert.equal(result.totalPages,1)
  assert.equal(new Date(result.rows[0].startsAt).toISOString(),'2026-10-25T21:59:59.999Z')
})

test('spring DST day is 23 hours, with correct boundaries and no duplicated/missing clock-hour assumptions', async () => transaction(async () => {
  await insertBooking(11,{startsAt:'2027-03-27T22:00:00Z'})
  await insertBooking(12,{startsAt:'2027-03-28T20:59:59.999Z'})
  await insertBooking(13,{startsAt:'2027-03-28T21:00:00Z'})
  const result=await report({from:'2027-03-28T00:00:00+02:00',until:'2027-03-29T00:00:00+03:00'})
  assert.equal(result.summary.bookings,2);assert.deepEqual(result.rows.map(row=>row.id),[appointment(12),appointment(11)])
}))

test('creation-date basis is independent from visit-date basis and has stable created-at/ID ordering', async () => {
  const result=await report({basis:'created'})
  assert.equal(result.summary.bookings,7)
  assert.ok(!result.rows.some(row=>row.id===appointment(1)))
  assert.deepEqual(result.rows.slice(0,3).map(row=>row.id),[8,7,6].map(appointment))
  assert.ok(result.rows.some(row=>row.id===appointment(8)),'a later visit can have been created during the selected period')
})

test('all actual statuses and sources including manual/cancelled visits count; list filters do not change period-wide summary', async () => {
  const all=await report()
  assert.ok(all.rows.some(row=>row.source==='manual'))
  for (const status of ['booked','confirmed','done','cancelled','no_show']) {
    const result=await report({status})
    assert.deepEqual(result.summary,all.summary)
    assert.equal(result.filtered.bookings,result.rows.length)
    assert.equal(result.totalRows,result.filtered.bookings)
    assert.ok(result.rows.length>0&&result.rows.every(row=>row.status===status))
  }
  assert.deepEqual((await report({status:'cancelled'})).filtered,{bookings:1,customers:1})
})

test('customer rows are only distinct matching business records with appointments, not all stored customers or deduplicated contact guesses', async () => {
  const result=await report({view:'customers'})
  assert.equal(result.totalRows,4);assert.equal(result.summary.customers,4)
  assert.deepEqual(result.rows.map(row=>row.id),[1,4,2,3].map(customer))
  assert.ok(!result.rows.some(row=>row.id===customer(5)))
  assert.equal(result.rows.filter(row=>row.email==='same@example.invalid').length,2,'do not merge separate customer records by contacts')
  assert.equal(result.rows.find(row=>row.id===customer(1)).bookings,2)
  assert.equal(result.rows.find(row=>row.id===customer(2)).statuses.cancelled,1)
  const filtered=await report({view:'customers',status:'done'})
  assert.equal(filtered.rows.length,1);assert.equal(filtered.rows[0].id,customer(2));assert.equal(filtered.rows[0].bookings,1)
})

test('historical inactive services/staff and erased current customer records remain truthful without leaking private fields', async () => {
  const result=await report(), erased=result.rows.find(row=>row.customer.id===customer(3))
  assert.equal(erased.customer.name,'Изтрит клиент');assert.equal(erased.customer.phone,null);assert.equal(erased.customer.email,null)
  assert.equal(result.rows[0].service.name,'Historical service');assert.equal(result.rows[0].staff.name,'Historical specialist')
  assert.doesNotMatch(JSON.stringify(result),/PRIVATE_|cancellation_token|intake|notes|price|bio/)
  assert.deepEqual(Object.keys(result.rows[0]).sort(),['id','startsAt','endsAt','createdAt','status','source','customer','service','staff'].sort())
  assert.deepEqual(Object.keys(result.rows[0].customer).sort(),['id','name','phone','email'].sort())
})

test('business scope applies to every relation even for a deliberately corrupt legacy foreign link', async () => transaction(async () => {
  await insertBooking(20,{customer:customer(9),service:otherService,staff:otherStaff})
  const result=await report(), corrupt=result.rows.find(row=>row.id===appointment(20))
  assert.equal(result.summary.bookings,7);assert.equal(result.summary.customers,4)
  assert.equal(corrupt.customer,null)
  assert.equal(corrupt.service,null);assert.equal(corrupt.staff,null)
  assert.doesNotMatch(JSON.stringify(result),/OTHER_PRIVATE_/)
  assert.equal((await report({view:'customers'})).rows.length,4)
  assert.equal((await report({business:other})).rows[0].customer.name,'OTHER_PRIVATE_CUSTOMER')
}))

test('bounded pagination is stable, exact and empty beyond the final page for bookings and customers', async () => {
  const first=await report({pageSize:2}), second=await report({pageSize:2,page:2}), third=await report({pageSize:2,page:3})
  assert.equal(first.totalPages,3);assert.deepEqual([...first.rows,...second.rows,...third.rows].map(row=>row.id),(await report()).rows.map(row=>row.id))
  assert.equal(new Set([...first.rows,...second.rows,...third.rows].map(row=>row.id)).size,6)
  const outside=await report({page:100000,pageSize:50});assert.deepEqual(outside.rows,[]);assert.equal(outside.totalRows,6)
  const customers1=await report({view:'customers',pageSize:2}), customers2=await report({view:'customers',pageSize:2,page:2})
  assert.equal(customers1.totalPages,2);assert.deepEqual([...customers1.rows,...customers2.rows].map(row=>row.id),(await report({view:'customers'})).rows.map(row=>row.id))
  assert.deepEqual((await report({view:'customers',page:100000})).rows,[])
})

test('empty periods and external booking businesses have zero actual GoRez rows, not inferred bookings or clients', async () => {
  for (const patch of [{business:external},{from:'2025-01-01T00:00:00Z',until:'2025-01-02T00:00:00Z'}]) for (const view of ['customers','bookings']) {
    const result=await report({...patch,view})
    assert.deepEqual(result.summary,{bookings:0,customers:0,statuses:{booked:0,confirmed:0,done:0,cancelled:0,no_show:0}})
    assert.deepEqual(result.filtered,{bookings:0,customers:0});assert.deepEqual(result.rows,[])
    assert.equal(result.totalRows,0);assert.equal(result.totalPages,0);assert.equal(result.page,1)
  }
})

test('switching to external or phone booking does not hide actual historical GoRez reservations', async () => transaction(async () => {
  const expected = await report()
  for (const mode of ['external', 'phone']) {
    await db.query('update businesses set booking_mode=$1 where id=$2',[mode,business])
    assert.deepEqual(await report(),expected)
    assert.equal((await report({view:'customers'})).totalRows,4)
  }
}))

test('invalid query parameters, unbounded ranges and SQL-looking identifiers fail before report execution', async () => {
  for (const patch of [
    {business:null},{from:null},{until:null},{from:'infinity'},{until:'infinity'},{from:until},{until:from},
    {from:'2025-01-01T00:00:00Z',until:'2027-01-01T00:00:00Z'},
    {basis:null},{basis:'starts_at);drop table customers;--'},{status:null},{status:"all' OR true--"},{view:null},{view:'tables'},
    {page:null},{page:0},{page:-1},{page:100001},{pageSize:null},{pageSize:0},{pageSize:51},
  ]) await assert.rejects(report(patch),/INVALID_REPORT_QUERY/)
  await assert.rejects(report({business:'10000000-0000-4000-8000-999999999999'}),/BUSINESS_NOT_FOUND/)
  assert.equal((await rows('select count(*)::int as n from customers'))[0].n,6)
})

test('running both report views and filters never changes stored customers, reservations, RLS or notifications', async () => {
  for (const view of ['bookings','customers']) for (const status of ['all','done','cancelled']) await report({view,status})
  assert.deepEqual(await coreData(),before.data);assert.deepEqual(await security(),before.security)
})
