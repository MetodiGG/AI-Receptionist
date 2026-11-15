import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('public-search indexes are additive, repeatable and preserve publication data and RLS', async () => {
  const db = new PGlite()
  try {
    await db.exec(`create table public.businesses(id uuid primary key,city_ekatte text,active boolean,platform_status text);
      create table public.services(id uuid primary key,business_id uuid references public.businesses(id),active boolean);
      alter table public.businesses enable row level security;
      alter table public.services enable row level security;
      insert into businesses values('11111111-1111-4111-8111-111111111111','68134',true,'enabled'),('22222222-2222-4222-8222-222222222222','68134',false,'pending');
      insert into services values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111',true);`)
    const before=(await db.query('select * from businesses order by id')).rows
    const sql=await readFile(new URL('../supabase/migrations/20261114103000_public_search_inventory_indexes.sql',import.meta.url),'utf8')
    await db.exec(sql);await db.exec(sql)
    assert.deepEqual((await db.query('select * from businesses order by id')).rows,before)
    assert.equal((await db.query('select count(*)::int n from services')).rows[0].n,1)
    const indexes=(await db.query("select indexname,indexdef from pg_indexes where indexname like '%public_search%' order by indexname")).rows
    assert.equal(indexes.length,2)
    assert.match(indexes[0].indexdef,/city_ekatte, id/)
    assert.match(indexes[0].indexdef,/active = true.*platform_status = 'enabled'/)
    assert.match(indexes[1].indexdef,/business_id, id/)
    assert.match(indexes[1].indexdef,/active = true/)
    assert.ok((await db.query("select relrowsecurity from pg_class where oid in ('public.businesses'::regclass,'public.services'::regclass)")).rows.every(row=>row.relrowsecurity))
  } finally { await db.close() }
})
