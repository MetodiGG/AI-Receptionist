import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { buildStagingBootstrap, STAGING_PROJECT_REF } from '../scripts/prepare-staging.mjs'

test('owner sharing keeps public booking links but does not offer a private calendar link', async () => {
  const share = await readFile(new URL('../app/dashboard/share/page.js', import.meta.url), 'utf8')
  assert.doesNotMatch(share, /calendar_feed_token|\/api\/calendar\/|Private calendar address/)
  assert.match(share, /New subscription links are no longer offered here/)
  assert.match(share, /Тук вече не се предлагат нови линкове за абонамент/)
  assert.match(share, /buildPublicBookingUrl\(publicOrigin, business\.slug\)/)
  assert.match(share, /ai-receptionist-widget\.js/)
})

test('a year of GoRez time off blocks new appointments without changing existing bookings or notifications', async (t) => {
  // Use the real booking and notification triggers in memory; no external client or delivery worker.
  const db = new PGlite({ extensions: { btree_gist } })
  t.after(() => db.close())
  const rows = async (query, args = []) => (await db.query(query, args)).rows
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, deleted_at timestamptz);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,service_role;
    grant execute on function auth.uid() to authenticated,service_role;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant all on storage.objects to anon,authenticated;
  `)
  await db.exec((await buildStagingBootstrap(STAGING_PROJECT_REF)).sql)

  const [{ id: owner }] = await rows(`
    insert into auth.users(id,email,email_confirmed_at)
    values(gen_random_uuid(),'owner@example.invalid',now()) returning id
  `)
  const [{ id: business }] = await rows(`
    insert into businesses(owner_id,name,slug,active,platform_status,city_ekatte,city,address,industry,
      email_notifications_enabled,contact_email)
    values($1,'Calendar fixture','calendar-fixture',true,'enabled','68134','София','Test 1','other',
      true,'owner@example.invalid') returning id
  `, [owner])
  const [{ id: staff }] = await rows(`
    insert into staff(business_id,name) values($1,'Fixture staff') returning id
  `, [business])
  const [{ id: service }] = await rows(`
    insert into services(business_id,name,price,currency,duration_min)
    values($1,'Fixture service',25,'EUR',30) returning id
  `, [business])
  const [{ id: customer }] = await rows(`
    insert into customers(business_id,name,phone,email)
    values($1,'Fixture customer','0000000','customer@example.invalid') returning id
  `, [business])
  await db.query(`
    insert into working_hours(business_id,staff_id,weekday,open_time,close_time)
    select $1,$2,n,'09:00','18:00' from generate_series(1,7) n
  `, [business, staff])

  const [{ today }] = await rows("select (now() at time zone 'Europe/Sofia')::date::text as today")
  const book = (day) => db.query(`
    insert into appointments(business_id,staff_id,service_id,customer_id,starts_at,ends_at,status,
      email_notifications_requested,email_reminders_requested)
    select $1,$2,$3,$4,(local_day+time '10:00') at time zone 'Europe/Sofia',
      (local_day+time '10:30') at time zone 'Europe/Sofia','booked',true,true
    from (select $5::date+$6::integer as local_day) fixture
  `, [business, staff, service, customer, today, day])
  const block = (day) => db.query(`
    insert into time_off(business_id,starts_at,ends_at)
    select $1,local_start at time zone 'Europe/Sofia',
      (local_start+interval '1 year') at time zone 'Europe/Sofia'
    from (select ($2::date+$3::integer)::timestamp as local_start) fixture
  `, [business, today, day])
  const appointments = () => rows('select * from appointments where business_id=$1 order by id', [business])
  const notifications = () => rows('select * from notification_outbox where business_id=$1 order by kind,id', [business])

  await book(2)
  const before = await appointments()
  const queueBefore = await notifications()
  assert.equal(before.length, 1)
  assert.deepEqual(queueBefore.map(({ kind }) => kind), [
    'booking_confirmation', 'booking_reminder', 'owner_new_booking',
  ])

  await assert.rejects(block(1), { code: '23P01', message: /SCHEDULE_CONFLICT/ })
  assert.deepEqual(await rows('select id from time_off where business_id=$1', [business]), [])

  await block(3)
  assert.equal((await rows('select id from time_off where business_id=$1', [business])).length, 1)
  await assert.rejects(book(4), { code: '23514', message: /SCHEDULE_UNAVAILABLE/ })

  assert.deepEqual(await appointments(), before)
  assert.deepEqual(await notifications(), queueBefore)
})
