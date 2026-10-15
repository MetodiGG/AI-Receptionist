// Runs actual PostgreSQL (PGlite/WASM), not a regex approximation of migration
// safety. Everything lives in memory; no production connection is possible.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const migration = await readFile(new URL('../supabase/migrations/20261015210000_reliable_booking_emails.sql', import.meta.url), 'utf8')
const business = '10000000-0000-4000-8000-000000000001'
const customer = '20000000-0000-4000-8000-000000000001'
const appointment = '30000000-0000-4000-8000-000000000001'
let db
const rows = async (sql, params = []) => (await db.query(sql, params)).rows
const count = async (where = 'true') => Number((await rows(`select count(*) n from notification_outbox where ${where}`))[0].n)
async function reset({ enabled = true, reminders = true, businessEnabled = true, starts = "now() + interval '3 days'" } = {}) {
  await db.exec('reset role; truncate notification_outbox, appointments, customers, businesses cascade;')
  await db.query('insert into businesses(id,active,email_notifications_enabled,contact_email,notification_locale) values ($1,true,$2,$3,$4)', [business, businessEnabled, 'owner@example.com', 'bg'])
  await db.query('insert into customers(id,business_id,email) values ($1,$2,$3)', [customer, business, 'customer@example.com'])
  await db.query(`insert into appointments(id,business_id,customer_id,starts_at,ends_at,status,email_notifications_requested,email_reminders_requested,notification_locale) values ($1,$2,$3,${starts},${starts} + interval '45 minutes','booked',$4,$5,'en')`, [appointment, business, customer, enabled, reminders])
}

test.before(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table businesses(id uuid primary key, active boolean, email_notifications_enabled boolean, contact_email text);
    create table customers(id uuid primary key,business_id uuid references businesses(id),email text);
    create table appointments(id uuid primary key,business_id uuid references businesses(id),customer_id uuid references customers(id),
      starts_at timestamptz,ends_at timestamptz,staff_id uuid,service_id uuid,status text default 'booked');
    create table notification_outbox(id uuid primary key default gen_random_uuid(),business_id uuid references businesses(id) on delete cascade,
      appointment_id uuid references appointments(id) on delete cascade,kind text not null check(kind in ('booking_confirmation','booking_cancelled','booking_reminder','owner_new_booking')),
      recipient text not null,subject text not null,html_body text not null,status text not null default 'pending' check(status in ('pending','sent','failed','skipped')),
      scheduled_for timestamptz not null default now(),sent_at timestamptz,attempts smallint not null default 0,last_error text,idempotency_key text unique not null,created_at timestamptz not null default now());
    alter table notification_outbox enable row level security;
    create policy tenant_read on notification_outbox for select to authenticated using (business_id::text = current_setting('request.jwt.claim.sub',true));
    grant select on notification_outbox to authenticated;
    grant select,insert,update,delete on notification_outbox to service_role;
  `)
  await db.exec(migration)
})
test.after(async () => { await db?.close() })

test('migration is repeatable and new queue does not activate or replay legacy pilot bookings', async () => {
  await reset({ enabled: false })
  assert.equal(await count(), 0)
  await db.query("insert into notification_outbox(business_id,appointment_id,kind,recipient,subject,html_body,idempotency_key) values ($1,$2,'booking_confirmation','customer@example.com','old','old','legacy')", [business, appointment])
  await db.exec(migration)
  assert.equal(await count("status='skipped' and last_error='LEGACY_PILOT_MESSAGE'"), 1)
  assert.equal((await rows('select * from claim_booking_email(null,true)')).length, 0)
})

test('booking transaction durably queues confirmation, business alert and 24-hour reminder with independent languages', async () => {
  await reset()
  assert.equal(await count(), 3)
  const queue = await rows('select kind,locale,recipient,scheduled_for from notification_outbox order by kind')
  assert.equal(queue.find(r => r.kind === 'booking_confirmation').locale, 'en')
  assert.equal(queue.find(r => r.kind === 'owner_new_booking').locale, 'bg')
  assert.equal(queue.find(r => r.kind === 'owner_new_booking').recipient, 'owner@example.com')
  const delta = await rows("select extract(epoch from (a.starts_at-q.scheduled_for))/3600 hours from notification_outbox q join appointments a on a.id=q.appointment_id where q.kind='booking_reminder'")
  assert.equal(Number(delta[0].hours), 24)
  await db.exec('begin;')
  await db.query("update appointments set starts_at=starts_at+interval '1 hour' where id=$1", [appointment])
  await db.exec('rollback;')
  assert.equal(await count(), 3)
})

test('disabled business and bookings without explicit sending opt-in stay silent', async () => {
  await reset({ businessEnabled: false }); assert.equal(await count(), 0)
  await reset({ enabled: false }); assert.equal(await count(), 0)
  await reset({ reminders: false }); assert.equal(await count("kind='booking_reminder'"), 0)
  await reset({ starts: "now() + interval '2 hours'" }); assert.equal(await count("kind='booking_reminder'"), 0)
})

test('booked to confirmed keeps revision and does not duplicate messages', async () => {
  await reset()
  await db.query("update appointments set status='confirmed' where id=$1", [appointment])
  assert.equal(await count(), 3)
  assert.equal((await rows('select notification_revision from appointments'))[0].notification_revision, 1)
})

test('rescheduling invalidates even failed/in-flight reminders and schedules a fresh revision', async () => {
  await reset()
  const claimed = await rows('select * from claim_booking_email($1,false)', [appointment])
  await db.exec("update notification_outbox set status='failed' where kind='booking_reminder';")
  await db.query("update appointments set starts_at=starts_at+interval '2 days',ends_at=ends_at+interval '2 days' where id=$1", [appointment])
  assert.equal(await count("appointment_revision=1 and status='skipped'"), 3)
  assert.equal(await count("appointment_revision=2 and status='pending' and kind in ('booking_reminder','booking_rescheduled')"), 2)
  assert.equal(await count(`claim_token='${claimed[0].claim_token}'`), 0)
  assert.equal((await rows('select notification_revision from appointments'))[0].notification_revision, 2)
})

test('cancellation queues one cancellation, never a reminder; repeat updates are idempotent', async () => {
  await reset()
  await db.exec("update notification_outbox set status='failed' where kind='booking_reminder';")
  await db.query("update appointments set status='cancelled' where id=$1", [appointment])
  assert.equal(await count("status='pending' and kind='booking_cancelled'"), 1)
  assert.equal(await count("status in ('pending','failed','processing') and kind='booking_reminder'"), 0)
  await db.query("update appointments set status='cancelled' where id=$1", [appointment])
  assert.equal(await count("kind='booking_cancelled'"), 1)
  await reset(); await db.query("update appointments set status='done' where id=$1", [appointment])
  assert.equal(await count("status='pending'"), 0)
})

test('owner calendar updates fire the protected queue trigger without granting direct function access', async () => {
  await reset()
  await db.exec('grant select,update on appointments to authenticated; set role authenticated;')
  await db.query("update public.appointments set status='cancelled' where id=$1", [appointment])
  await assert.rejects(db.query('select public.queue_booking_emails()'), /permission denied/)
  await db.exec('reset role;')
  assert.equal(await count("kind='booking_cancelled' and status='pending'"), 1)
})

test('claims do not overlap, respect due time, increment attempts and reclaim expired leases only', async () => {
  await reset()
  const a = (await rows('select * from claim_booking_email(null,true)'))[0]
  const b = (await rows('select * from claim_booking_email(null,true)'))[0]
  assert.notEqual(a.id, b.id)
  assert.equal(a.attempts, 1); assert.equal(a.status, 'processing')
  assert.equal((await rows('select * from claim_booking_email(null,true)')).length, 0)
  await db.query("update notification_outbox set locked_until=now()-interval '1 second' where id=$1", [a.id])
  const retry = (await rows('select * from claim_booking_email(null,true)'))[0]
  assert.equal(retry.id, a.id); assert.equal(retry.attempts, 2); assert.notEqual(retry.claim_token, a.claim_token)
  await db.query("update notification_outbox set locked_until=now()-interval '1 second',attempts=3 where id=$1", [a.id])
  assert.equal((await rows('select * from claim_booking_email(null,true)')).length, 0)
  assert.equal(await count("last_error='RETRY_LIMIT_REACHED' and status='failed'"), 1)
})

test('only service role can claim; authenticated owners cannot write or read another tenant queue', async () => {
  await reset()
  await db.exec('set role anon;')
  await assert.rejects(db.query('select * from public.claim_booking_email(null,true)'), /permission denied/)
  await assert.rejects(db.query('select * from public.notification_outbox'), /permission denied/)
  await db.exec("reset role; set role authenticated; select set_config('request.jwt.claim.sub','other-business',false);")
  assert.equal((await rows('select * from public.notification_outbox')).length, 0)
  await assert.rejects(db.query('select * from public.claim_booking_email(null,true)'), /permission denied/)
  await assert.rejects(db.query("update public.notification_outbox set recipient='attacker@example.com'"), /permission denied/)
  await db.exec('reset role; set role service_role;')
  assert.equal((await rows('select * from public.claim_booking_email(null,true)')).length, 1)
  await db.exec('reset role;')
})

test('Supabase scheduler SQL keeps credentials in Vault and can only dispatch to the fixed GoRez endpoint', async () => {
  await db.exec(`
    create schema vault; create schema cron; create schema net;
    create table vault.decrypted_secrets(name text, decrypted_secret text);
    create table cron.job(jobid bigint generated always as identity,jobname text unique,schedule text,command text);
    create function cron.schedule(jobname text,schedule text,command text) returns bigint language sql as $$
      insert into cron.job(jobname,schedule,command) values ($1,$2,$3) on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command returning jobid;
    $$;
    create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds int) returns bigint language plpgsql as $$
      begin
        if url <> 'https://www.gorez.co/api/cron/notifications' or timeout_milliseconds <> 30000 or body <> '{}'::jsonb then raise exception 'Wrong destination'; end if;
        if headers->>'Authorization' <> 'Bearer OFFLINE-ONLY-NOT-A-REAL-SECRET-12345678' then raise exception 'Wrong auth'; end if;
        return 123;
      end;
    $$;
  `)
  const sql = (await readFile(new URL('../supabase/operations/schedule-booking-emails.sql', import.meta.url), 'utf8')).replace(/^create extension[^;]+;$/gm, '')
  await db.exec(sql)
  await db.exec(sql)
  const job = (await rows('select * from cron.job'))[0]
  assert.equal((await rows('select * from cron.job')).length, 1)
  assert.equal(job.schedule, '*/5 * * * *')
  assert.equal(job.command, 'select public.dispatch_booking_emails();')
  assert.equal(job.command.includes('Bearer'), false)
  await assert.rejects(db.query('select public.dispatch_booking_emails()'), /Configure.*Vault/)
  await db.exec("insert into vault.decrypted_secrets values ('gorez_booking_cron_secret','OFFLINE-ONLY-NOT-A-REAL-SECRET-12345678');")
  assert.equal((await rows('select public.dispatch_booking_emails() id'))[0].id, 123)
  for (const role of ['anon', 'authenticated', 'service_role']) {
    await db.exec(`set role ${role};`)
    await assert.rejects(db.query('select public.dispatch_booking_emails()'), /permission denied/)
    await db.exec('reset role;')
  }
})
