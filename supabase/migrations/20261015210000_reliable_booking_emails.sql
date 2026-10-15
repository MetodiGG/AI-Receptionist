-- Durable, tenant-isolated email intents. This migration does not enable email,
-- install a scheduler, store provider credentials or send any HTTP requests.
begin;

alter table public.businesses add column if not exists notification_locale text not null default 'bg'
  check (notification_locale in ('bg', 'en'));
alter table public.appointments
  add column if not exists notification_locale text not null default 'bg' check (notification_locale in ('bg', 'en')),
  add column if not exists notification_revision bigint not null default 1,
  add column if not exists email_notifications_requested boolean not null default false,
  add column if not exists email_reminders_requested boolean not null default false;

alter table public.notification_outbox
  add column if not exists appointment_revision bigint,
  add column if not exists locale text not null default 'bg' check (locale in ('bg', 'en')),
  add column if not exists claim_token uuid,
  add column if not exists locked_until timestamptz,
  add column if not exists first_attempt_at timestamptz,
  add column if not exists provider_message_id text,
  add column if not exists payload jsonb;
alter table public.notification_outbox drop constraint if exists notification_outbox_status_check;
alter table public.notification_outbox add constraint notification_outbox_status_check
  check (status in ('pending', 'processing', 'sent', 'failed', 'skipped'));
alter table public.notification_outbox drop constraint if exists notification_outbox_kind_check;
alter table public.notification_outbox add constraint notification_outbox_kind_check
  check (kind in ('booking_confirmation', 'booking_cancelled', 'booking_rescheduled', 'booking_reminder', 'owner_new_booking'));

-- Do not replay old pilot messages when the deployment flag is later enabled.
update public.notification_outbox set status = 'skipped', last_error = 'LEGACY_PILOT_MESSAGE'
where appointment_revision is null and status in ('pending', 'failed');

create or replace function public.booking_email_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  if row(new.starts_at, new.ends_at, new.staff_id, new.service_id, new.customer_id,
         new.email_notifications_requested, new.email_reminders_requested)
    is distinct from row(old.starts_at, old.ends_at, old.staff_id, old.service_id, old.customer_id,
         old.email_notifications_requested, old.email_reminders_requested)
    or (new.status is distinct from old.status and not (new.status in ('booked', 'confirmed') and old.status in ('booked', 'confirmed'))) then
    new.notification_revision := old.notification_revision + 1;
  else
    new.notification_revision := old.notification_revision;
  end if;
  return new;
end $$;

create or replace function public.queue_booking_emails()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  b public.businesses;
  client_email text;
  message_kind text;
begin
  if tg_op = 'UPDATE' then
    if new.notification_revision = old.notification_revision then return new; end if;
    -- Cancels even an in-flight claim, including failed reminders. A worker
    -- must check the claim token immediately before contacting the provider.
    update public.notification_outbox set status = 'skipped', claim_token = null,
      locked_until = null, last_error = 'BOOKING_CHANGED'
    where appointment_id = new.id and status in ('pending', 'failed', 'processing');
  end if;

  select * into b from public.businesses where id = new.business_id;
  if not new.email_notifications_requested or not b.active or not b.email_notifications_enabled then return new; end if;
  select lower(trim(email)) into client_email from public.customers
    where id = new.customer_id and business_id = new.business_id;

  if new.status = 'cancelled' then
    message_kind := 'booking_cancelled';
  elsif new.status in ('booked', 'confirmed') and new.starts_at > now() then
    message_kind := case when tg_op = 'INSERT' then 'booking_confirmation' else 'booking_rescheduled' end;
  else return new;
  end if;

  if nullif(client_email, '') is not null then
    insert into public.notification_outbox
      (business_id, appointment_id, kind, recipient, subject, html_body, idempotency_key, appointment_revision, locale)
    values (new.business_id, new.id, message_kind, client_email, '', '',
      message_kind || ':' || new.id || ':' || new.notification_revision, new.notification_revision, new.notification_locale)
    on conflict (idempotency_key) do nothing;

    if new.status in ('booked', 'confirmed') and new.email_reminders_requested and new.starts_at - interval '24 hours' > now() then
      insert into public.notification_outbox
        (business_id, appointment_id, kind, recipient, subject, html_body, scheduled_for, idempotency_key, appointment_revision, locale)
      values (new.business_id, new.id, 'booking_reminder', client_email, '', '', new.starts_at - interval '24 hours',
        'reminder:' || new.id || ':' || new.notification_revision, new.notification_revision, new.notification_locale)
      on conflict (idempotency_key) do nothing;
    end if;
  end if;

  if tg_op = 'INSERT' and nullif(trim(b.contact_email), '') is not null then
    insert into public.notification_outbox
      (business_id, appointment_id, kind, recipient, subject, html_body, idempotency_key, appointment_revision, locale)
    values (new.business_id, new.id, 'owner_new_booking', lower(trim(b.contact_email)), '', '',
      'owner-new:' || new.id || ':' || new.notification_revision, new.notification_revision, b.notification_locale)
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists booking_email_revision on public.appointments;
create trigger booking_email_revision before update on public.appointments
  for each row execute function public.booking_email_revision();
drop trigger if exists queue_booking_emails on public.appointments;
create trigger queue_booking_emails after insert or update on public.appointments
  for each row execute function public.queue_booking_emails();

create or replace function public.claim_booking_email(p_appointment_id uuid default null, p_reminders boolean default false)
returns setof public.notification_outbox
language plpgsql security definer set search_path = '' as $$
begin
  update public.notification_outbox set status = 'failed', claim_token = null, locked_until = null,
    last_error = 'RETRY_LIMIT_REACHED'
  where status = 'processing' and locked_until < now() and attempts >= 3;

  return query
  with candidate as (
    select q.id from public.notification_outbox q
    where ((q.status in ('pending', 'failed') and q.scheduled_for <= now())
        or (q.status = 'processing' and q.locked_until < now()))
      and q.attempts < 3 and q.appointment_revision is not null
      and (p_appointment_id is null or q.appointment_id = p_appointment_id)
      and (p_reminders or q.kind <> 'booking_reminder')
    order by q.scheduled_for, q.created_at, q.id
    limit 1 for update skip locked
  )
  update public.notification_outbox q set status = 'processing', claim_token = gen_random_uuid(),
    locked_until = now() + interval '5 minutes', attempts = q.attempts + 1,
    first_attempt_at = coalesce(q.first_attempt_at, now())
  from candidate where q.id = candidate.id returning q.*;
end $$;

revoke all on function public.booking_email_revision() from public, anon, authenticated;
revoke all on function public.queue_booking_emails() from public, anon, authenticated;
revoke all on function public.claim_booking_email(uuid, boolean) from public, anon, authenticated;
grant execute on function public.claim_booking_email(uuid, boolean) to service_role;
-- Existing owner-read RLS and service-only writes on the outbox stay in place.
commit;
