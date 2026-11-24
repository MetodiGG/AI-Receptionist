import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { applicationRecord } from '../lib/business-application.mjs'
import { businessLocationUpdatePayload } from '../lib/business-content.mjs'

const prior = await readFile(new URL('../supabase/migrations/20261112153000_registration_address_lookup.sql', import.meta.url), 'utf8')
const migration = await readFile(new URL('../supabase/migrations/20261124205000_sofia_exact_location_writes.sql', import.meta.url), 'utf8')
const id = '20000000-0000-4000-8000-000000000001'
const branch = '20000000-0000-4000-8000-000000000002'
const address = 'бул. Сливница 178Е, София'
const point = { latitude: 42.716, longitude: 23.307, source_url: 'https://www.openstreetmap.org/way/98765', licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' }
// Coordinates are synthetic test values and do not verify this real address.
const fixture = async () => {
  const db = new PGlite()
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create table businesses(id uuid primary key,city_ekatte text,city text,neighborhood text,address text,public_profile jsonb,active boolean,platform_status text);
    alter table businesses enable row level security;
    create policy published on businesses for select to anon,authenticated using(active and platform_status='enabled');
    grant select on businesses to anon,authenticated;
    grant all on businesses to service_role;
    create table business_place_links(business_id uuid primary key references businesses(id),place_id text not null unique,verified_by uuid,verified_at timestamptz);
    grant all on business_place_links to service_role;`)
  await db.exec(prior)
  await db.query(`insert into businesses values
    ($1,'68134','София',null,$3,'{"description":{"bg":"Описание"},"latitude":null,"longitude":null}',true,'enabled'),
    ($2,'68134','София',null,'ул. Другата 5','{}',true,'enabled')`, [id, branch, address])
  return db
}
const rows = async (db, sql, args) => (await db.query(sql,args)).rows
const claim = async (db, bid=id) => (await rows(db,'select claim_registration_address_lookup($1) as result',[bid]))[0].result
const finish = async (db,c,result=point,status='matched') => (await rows(db,
  'select finish_registration_address_lookup($1,$2,$3,$4,$5::jsonb,null) as result',
  [c.business.id,c.address_key,c.claim_token,status,result && JSON.stringify(result)]))[0].result
const clearGate = db => db.exec("update registration_address_lookup_gate set next_allowed_at='-infinity',locked_until=null,claim_token=null")
const live = async (db,bid=id) => (await rows(db,'select * from businesses where id=$1',[bid]))[0]

test('fresh strict match uses a versioned cache key; migrations preserve preexisting rows, point, status and RLS', async () => {
  const db=await fixture()
  try {
    const old=await claim(db)
    const original=await live(db)
    await db.exec(migration)
    assert.deepEqual(await live(db),{...original,location_revision:0})
    assert.deepEqual(await finish(db,old),{state:'stale_claim',applied:false})
    await clearGate(db)
    const current=await claim(db)
    assert.equal(current.state,'claimed'); assert.equal(current.match_version,2)
    assert.notEqual(current.address_key,old.address_key)
    assert.equal(current.business.address,address)
    assert.deepEqual(await finish(db,current),{state:'matched',applied:true})
    const updated=await live(db)
    assert.equal(updated.public_profile.latitude,point.latitude)
    assert.equal(updated.location_revision,1)
    assert.equal(updated.platform_status,'enabled')
    assert.equal(updated.public_profile.description.bg,'Описание')
    assert.deepEqual((await rows(db,'select match_version,location_revision from registration_location_sources'))[0],{match_version:2,location_revision:1})
    const before=await rows(db,'select * from business_location_changes')
    await db.exec(migration)
    assert.deepEqual(await live(db),updated)
    assert.deepEqual(await rows(db,'select * from business_location_changes'),before)
    await db.exec('set role anon')
    assert.equal((await rows(db,'select match_version from registration_location_sources')).length,1)
    await assert.rejects(db.query('select * from business_location_changes'),/permission denied/u)
  } finally { await db.close() }
})

test('address/pin updates invalidate evidence and record before/after without changing the business or another branch', async () => {
  const db=await fixture()
  try {
    await db.exec(migration)
    await finish(db,await claim(db))
    const another=await live(db,branch)
    await db.query("update businesses set public_profile=public_profile||'{\"description\":{\"bg\":\"Изменено\"}}'::jsonb where id=$1",[id])
    assert.equal((await live(db)).location_revision,1)
    await db.query("update businesses set address='бул. Сливница 178E, София' where id=$1",[id])
    const updated=await live(db)
    assert.equal(updated.location_revision,2)
    assert.equal(updated.address,'бул. Сливница 178E, София')
    assert.deepEqual(updated.public_profile,{description:{bg:'Изменено'},latitude:null,longitude:null})
    assert.deepEqual(await rows(db,'select * from registration_location_sources'),[])
    const [change]=await rows(db,'select previous,current from business_location_changes where business_id=$1 and location_revision=2',[id])
    assert.equal(change.previous.address,address)
    assert.equal(change.previous.latitude,point.latitude)
    assert.equal(change.current.latitude,null)
    assert.deepEqual(await live(db,branch),another)
  } finally { await db.close() }
})

test('delayed A→B→A results cannot restore a location or seed a fresh cached match', async () => {
  const db=await fixture()
  try {
    await db.exec(migration)
    const pending=await claim(db)
    await db.query("update businesses set address='бул. Сливница 178, София' where id=$1",[id])
    await db.query('update businesses set address=$2 where id=$1',[id,address])
    assert.deepEqual(await finish(db,pending),{state:'stale_address',applied:false})
    assert.equal((await live(db)).public_profile.latitude,null)
    assert.equal((await live(db)).location_revision,2)
    await clearGate(db)
    assert.equal((await claim(db)).state,'claimed')
  } finally { await db.close() }
})

test('a deliberate manual point wins the race; an address edit cannot implicitly carry it over', async () => {
  const db=await fixture()
  try {
    await db.exec(migration)
    const pending=await claim(db)
    await db.query("update businesses set public_profile=public_profile||'{\"latitude\":42.67,\"longitude\":23.29}'::jsonb where id=$1",[id])
    assert.deepEqual(await finish(db,pending),{state:'stale_address',applied:false})
    assert.equal((await live(db)).public_profile.latitude,42.67)
    assert.equal((await rows(db,'select count(*)::int as count from registration_location_sources'))[0].count,0)
    await db.query("update businesses set address='ул. Примерна 7' where id=$1",[id])
    assert.equal((await live(db)).public_profile.latitude,null)
    await db.query("update businesses set city_ekatte='10135',city='Варна',address='ул. Нова 1',public_profile=public_profile||'{\"latitude\":43.2,\"longitude\":27.9}'::jsonb where id=$1",[id])
    assert.equal((await live(db)).public_profile.latitude,null)
    assert.equal((await live(db)).platform_status,'enabled')
    assert.equal((await claim(db)).state,'review_required')
  } finally { await db.close() }
})

test('a place association cannot be reapplied by a stale admin panel after a branch move',async()=>{
  const db=await fixture(), actor='10000000-0000-4000-8000-000000000001'
  const link=(rev,place)=>db.query('select save_branch_place_link($1,$2,$3,$4)',[id,actor,rev,place])
  try {
    await db.exec(migration)
    await db.exec('set role anon')
    await assert.rejects(link(0,'offline_PLACE_A'),/permission denied/u)
    await db.exec('set role service_role')
    await link(0,'offline_PLACE_A')
    await db.query("update businesses set address='бул. Сливница 178Б, София' where id=$1",[id])
    await assert.rejects(link(0,'offline_PLACE_A'),/LOCATION_CHANGED/u)
    assert.deepEqual(await rows(db,'select place_id,location_revision from business_place_links'),[{place_id:'offline_PLACE_A',location_revision:0}])
    await link(1,'offline_PLACE_B')
    assert.deepEqual(await rows(db,'select place_id,location_revision from business_place_links'),[{place_id:'offline_PLACE_B',location_revision:1}])
    assert.equal((await live(db)).platform_status,'enabled')
    await db.query("update businesses set city_ekatte='10135',city='Варна' where id=$1",[id])
    await assert.rejects(link(2,'offline_PLACE_C'),/OUTSIDE_SERVICE_AREA/u)
  } finally { await db.close() }
})

test('switching a premises to mobile invalidates its pin, does not claim a geocode, and preserves approval', async () => {
  const db = await fixture()
  try {
    await db.exec(migration)
    await finish(db, await claim(db))
    await db.query("update businesses set public_profile=public_profile||'{\"location_kind\":\"mobile\"}'::jsonb where id=$1", [id])
    const row = await live(db)
    assert.equal(row.public_profile.latitude, null)
    assert.equal(row.location_revision, 2)
    assert.equal(row.platform_status, 'enabled')
    assert.equal((await claim(db)).state, 'review_required')
    await assert.rejects(db.query('select save_branch_place_link($1,$2,2,$3)', [id, branch, 'offline_PLACE_C']), /NO_PUBLIC_VISIT_LOCATION/u)
  } finally { await db.close() }
})

test('signup into the existing schema retains the exact address and drops a geographically conflicting optional pin', async () => {
  const public_profile={description:{bg:'Sofia fixture'},latitude:42.67,longitude:23.29}
  const form={business:{city_ekatte:'68134',neighborhood:'Център',address,booking_mode:'phone',public_profile:{...public_profile,latitude:43.2,longitude:27.8}},
    locale:'bg', account:{email:'offline@example.test'},staff:[],services:[],schedule:[]}
  const stored=applicationRecord(form).business
  assert.equal(stored.address,address)
  assert.equal(stored.booking_mode,'phone')
  const db=await fixture(), newBusiness='20000000-0000-4000-8000-000000000003'
  try {
    await db.exec(migration)
    // The PR #81 signup record reaches the already deployed insert trigger;
    // verifying that boundary needs no change to booking or signup code.
    await db.query(`insert into businesses(id,city_ekatte,city,neighborhood,address,public_profile,active,platform_status)
      values($1,$2,$3,$4,$5,$6::jsonb,false,'pending')`,
      [newBusiness,stored.city_ekatte,stored.city,stored.neighborhood,stored.address,JSON.stringify(stored.public_profile)])
    const row=await live(db,newBusiness)
    assert.equal(row.address,address)
    assert.deepEqual(row.public_profile,{...public_profile,latitude:null,longitude:null})
    assert.equal(row.platform_status,'pending')
    assert.equal(row.location_revision,0)
  } finally { await db.close() }
})

test('admin content update preserves the exact requested number and cannot transfer a point to another address',()=>{
  const public_profile={description:{bg:'Sofia fixture'},latitude:42.67,longitude:23.29}
  for (const changedAddress of ['бул. Сливница 178, София','бул. Сливница 178E, София','ул. Сливница 178Е, София',
    'бул. Сливница 178Е/1, София','бул. Сливница 178Е-1, София','бул. Сливница 178Е, София, вх. Б']) {
    const current={city_ekatte:'68134',city:'София',neighborhood:'Център',address,public_profile}
    const changed=businessLocationUpdatePayload(current,{...current,address:changedAddress})
    assert.equal(changed.address,changedAddress)
    assert.deepEqual(changed.public_profile,{...public_profile,latitude:null,longitude:null})
  }
})
