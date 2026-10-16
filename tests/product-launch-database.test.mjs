import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
const migration=await readFile(new URL('../supabase/migrations/20261016180000_product_launch_foundation.sql',import.meta.url),'utf8')
const pipeline=await readFile(new URL('../supabase/migrations/20261014150000_partner_pipeline.sql',import.meta.url),'utf8')
let db
test.before(async()=>{
  db=new PGlite()
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;')
  await db.exec(pipeline)
  await db.exec("insert into partner_leads(business_name,contact_name,phone,email,category,city,fingerprint) values('Existing Business','Existing Person','123456789','existing@example.com','auto','София','existing-hash');")
  await db.exec(migration)
})
test.after(async()=>{await db?.close()})
test('optional lead fields migration is repeatable and preserves existing data and checks',async()=>{
  await db.exec(migration)
  const old=(await db.query("select * from partner_leads where fingerprint='existing-hash'")).rows[0]
  assert.equal(old.contact_name,'Existing Person');assert.equal(old.city,'София');assert.equal(old.status,'new')
  await db.exec("insert into partner_leads(business_name,phone,email,category,fingerprint) values('Short Form','123456789','short@example.com','auto','short-hash');")
  const row=(await db.query("select contact_name,city from partner_leads where fingerprint='short-hash'")).rows[0]
  assert.deepEqual(row,{contact_name:null,city:null})
  await assert.rejects(db.exec("update partner_leads set contact_name='x' where fingerprint='short-hash'"),/check constraint/)
  const sql=migration.replace(/--[^\n]*/g,'')
  assert.doesNotMatch(sql,/delete\s+from|truncate|drop\s+(table|column)|alter\s+table\s+(public\.)?(businesses|appointments|notification_outbox)/i)
})
test('product event storage is isolated, deduplicated and inaccessible to public/owner roles',async()=>{
  for(const role of ['anon','authenticated']){
    await db.exec(`set role ${role}`)
    await assert.rejects(db.query('select * from product_events'),/permission denied/)
    await assert.rejects(db.query("insert into product_events(event_type,page,locale,flow_key) values('form_start','home','bg','00000000-0000-4000-8000-000000000001')"),/permission denied/)
    await db.exec('reset role')
  }
  await db.exec("set role service_role;insert into product_events(event_type,page,locale,flow_key) values('form_start','for-businesses','en','00000000-0000-4000-8000-000000000001') on conflict(flow_key,event_type) do nothing;")
  await db.exec("insert into product_events(event_type,page,locale,flow_key) values('form_start','for-businesses','en','00000000-0000-4000-8000-000000000001') on conflict(flow_key,event_type) do nothing;")
  assert.equal((await db.query('select count(*) n from product_events')).rows[0].n,1)
  await assert.rejects(db.query("insert into product_events(event_type,page,locale,flow_key) values('unknown','home','bg',gen_random_uuid())"),/check constraint/)
  await db.exec('reset role')
  const columns=(await db.query("select column_name from information_schema.columns where table_name='product_events'")).rows.map(row=>row.column_name)
  assert.deepEqual(columns.sort(),['id','event_type','page','locale','flow_key','created_at'].sort())
})
