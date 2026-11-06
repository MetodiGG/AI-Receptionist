import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const migration=await readFile(new URL('../supabase/migrations/20261106100000_catalogue_photos.sql',import.meta.url),'utf8')
const id='sofia-local-database-test', actor='20000000-0000-4000-8000-000000000001', photo='10000000-0000-4000-8000-000000000001', other='10000000-0000-4000-8000-000000000002'
let db
const rows=async(sql,args=[])=>(await db.query(sql,args)).rows
const reserve=(media=photo,bytes=1024)=>db.query('select reserve_catalogue_photo($1,$2,$3)',[id,media,bytes])
const change=(revision=0,action='upload',media=photo,image={width:800,height:600,bytes:1024,alt:'Test image',rightsReference:'Owner permission · offline test',consent:true})=>db.query('select change_catalogue_photo($1,$2,$3,$4,$5,$6)',[id,actor,revision,action,media,image])
async function reset(){await db.exec('reset role;truncate catalogue_photos,catalogue_photo_audit,catalogue_photo_cleanup;')}
test.before(async()=>{
  db=new PGlite()
  await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,public boolean);insert into storage.buckets values('business-media',false);create table businesses(id uuid primary key,name text);insert into businesses values(gen_random_uuid(),'Preserve this partner');create table appointments(id uuid primary key);insert into appointments values(gen_random_uuid());")
  await db.exec(migration)
})
test.after(async()=>{await db?.close()})
test('migration is repeatable, uses the existing private bucket, and preserves partner/reservation data',async()=>{
  await reset();await reserve();await change()
  const before=await rows('select * from catalogue_photos')
  await db.exec(migration)
  assert.deepEqual(await rows('select * from catalogue_photos'),before)
  assert.equal((await rows('select * from businesses'))[0].name,'Preserve this partner')
  assert.equal((await rows('select * from appointments')).length,1)
  assert.equal((await rows('select * from storage.buckets')).length,1)
})
test('anonymous and ordinary authenticated users cannot read private notes or execute photo RPCs',async()=>{
  await reset()
  for(const role of ['anon','authenticated']){
    await db.exec(`set role ${role}`)
    for(const table of ['catalogue_photos','catalogue_photo_audit','catalogue_photo_cleanup'])await assert.rejects(db.query(`select * from ${table}`),/permission denied/)
    await assert.rejects(reserve(),/permission denied/);await assert.rejects(change(),/permission denied/)
    await db.exec('reset role')
  }
})
test('upload and replacement are atomic, audited, and queue only the old exact object',async()=>{
  await reset();await db.exec('set role service_role');await reserve();await change()
  assert.equal((await rows('select revision from catalogue_photos'))[0].revision,1)
  assert.equal((await rows('select * from catalogue_photo_cleanup')).length,0)
  await reserve(other);await change(1,'upload',other)
  const current=(await rows('select * from catalogue_photos'))[0]
  assert.equal(current.photo_id,other);assert.equal(current.revision,2)
  const queue=await rows('select * from catalogue_photo_cleanup');assert.equal(queue.length,1);assert.equal(queue[0].object_key,`catalogue/${id}/${photo}.webp`)
  const audit=await rows('select * from catalogue_photo_audit order by created_at,id');assert.equal(audit.length,2);assert.ok(audit.some(row=>row.previous_photo?.photo_id===photo))
  await db.exec('reset role')
})
test('concurrent stale edits cannot overwrite the winning photo and failed uploads stay privately queued',async()=>{
  await reset();await reserve();await reserve(other);await change()
  await assert.rejects(change(0,'upload',other),/CATALOGUE_PHOTO_CHANGED/)
  assert.equal((await rows('select photo_id from catalogue_photos'))[0].photo_id,photo)
  assert.equal((await rows('select object_key from catalogue_photo_cleanup'))[0].object_key,`catalogue/${id}/${other}.webp`)
})
test('removal clears public photo metadata, increments revision, preserves evidence and defers file cleanup',async()=>{
  await reset();await reserve();await change();await change(1,'remove',null,null)
  const current=(await rows('select * from catalogue_photos'))[0]
  assert.equal(current.photo_id,null);assert.equal(current.revision,2);assert.equal(current.rights_reference,null)
  const audit=(await rows("select * from catalogue_photo_audit where action='remove'"))[0]
  assert.equal(audit.previous_photo.photo_id,photo);assert.ok(audit.previous_photo.rights_reference)
  const queue=(await rows('select * from catalogue_photo_cleanup'))[0];assert.ok(new Date(queue.not_before)>new Date())
  await assert.rejects(change(1,'remove',null,null),/CATALOGUE_PHOTO_CHANGED/)
})
test('consent, valid dimensions, permission reference, existing upload reservation and exact namespace are enforced',async()=>{
  await reset();await assert.rejects(change(),/VALIDATION_ERROR/);await reserve()
  for(const patch of [{consent:false},{rightsReference:''},{width:null},{height:null},{width:9999},{bytes:null},{bytes:9999999}]){
    await assert.rejects(change(0,'upload',photo,{width:800,height:600,bytes:1024,alt:'Photo',rightsReference:'Owner permission',consent:true,...patch}))
    assert.equal((await rows('select * from catalogue_photos')).length,0)
  }
  await assert.rejects(db.query("insert into catalogue_photos(catalogue_id,photo_id,updated_by) values($1,$2,$3)",[id,photo,actor]),/catalogue_photo_metadata/)
  await assert.rejects(db.query('select reserve_catalogue_photo($1,$2,1024)',['../foreign',other]),/VALIDATION_ERROR/)
})
test('128 MB capacity includes private pending/orphan objects and rejects further reservations',async()=>{
  await reset()
  await db.exec(`insert into catalogue_photo_cleanup(object_key,byte_size) select 'catalogue/${id}/'||gen_random_uuid()::text||'.webp',1048576 from generate_series(1,128)`)
  await assert.rejects(reserve(),/CATALOGUE_MEDIA_LIMIT/)
  assert.equal((await rows('select count(*) n from catalogue_photo_cleanup'))[0].n,128)
})
test('audit failure rolls back the replacement and its cleanup changes together',async()=>{
  await reset();await reserve();await change();await reserve(other)
  await db.exec("create function reject_catalogue_test_audit() returns trigger language plpgsql as $$begin raise exception 'offline audit failure';end$$;create trigger reject_catalogue_test_audit before insert on catalogue_photo_audit for each row execute function reject_catalogue_test_audit()")
  await assert.rejects(change(1,'upload',other),/offline audit failure/)
  assert.equal((await rows('select photo_id from catalogue_photos'))[0].photo_id,photo)
  assert.equal((await rows('select * from catalogue_photo_audit')).length,1)
  await db.exec('drop trigger reject_catalogue_test_audit on catalogue_photo_audit;drop function reject_catalogue_test_audit()')
})
test('migration refuses a missing or public media bucket rather than opening browser access',async()=>{
  await db.exec("update storage.buckets set public=true where id='business-media'")
  await assert.rejects(db.exec(migration),/PRIVATE_BUSINESS_MEDIA_BUCKET_REQUIRED/)
  await db.exec('rollback;')
  await db.exec("update storage.buckets set public=false where id='business-media'")
})
