-- Pre-pilot product layer: industry templates, consent, notifications,
-- analytics and private calendar feeds.
begin;

alter table public.businesses
  add column if not exists industry text not null default 'other',
  add column if not exists contact_email text,
  add column if not exists website_url text,
  add column if not exists privacy_contact_email text,
  add column if not exists booking_terms text,
  add column if not exists email_notifications_enabled boolean not null default true,
  add column if not exists calendar_feed_token uuid not null default gen_random_uuid(),
  add column if not exists embed_enabled boolean not null default true;

create unique index if not exists businesses_calendar_feed_token_idx
  on public.businesses (calendar_feed_token);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'businesses_industry_check') then
    alter table public.businesses add constraint businesses_industry_check
      check (industry in ('beauty', 'auto', 'health', 'fitness', 'education', 'consulting', 'home_services', 'pets', 'other'));
  end if;
end $$;

alter table public.appointments
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text,
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists reminder_sent_at timestamptz;

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  kind text not null check (kind in ('booking_confirmation', 'booking_cancelled', 'booking_reminder', 'owner_new_booking')),
  recipient text not null,
  subject text not null,
  html_body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  attempts smallint not null default 0,
  last_error text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (status, scheduled_for);

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_type text not null check (event_type in ('page_view', 'booking_started', 'booking_created', 'chat_started', 'chat_message', 'booking_cancelled')),
  source text not null default 'web',
  session_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_business_created_idx
  on public.analytics_events (business_id, created_at desc);

alter table public.notification_outbox enable row level security;
alter table public.analytics_events enable row level security;

do $$
declare
  target_table text;
begin
  foreach target_table in array array['notification_outbox', 'analytics_events'] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = target_table and policyname = 'owner reads own rows'
    ) then
      execute format(
        'create policy "owner reads own rows" on public.%I for select using (public.owns_business(business_id))',
        target_table
      );
    end if;
  end loop;
end $$;

revoke all privileges on table
  public.notification_outbox,
  public.analytics_events
from public, anon;

grant select on table
  public.notification_outbox,
  public.analytics_events
to authenticated;

grant select, insert, update, delete on table
  public.notification_outbox,
  public.analytics_events
to service_role;

grant usage, select on all sequences in schema public to service_role;

create or replace function public.anonymize_customer(
  input_business_id uuid,
  input_customer_id uuid
)
returns void
language plpgsql
set search_path = public
as $$
begin
  if not public.owns_business(input_business_id) then
    raise exception 'Business access denied' using errcode = '42501';
  end if;
  if not exists (select 1 from public.customers where id = input_customer_id and business_id = input_business_id) then
    raise exception 'Customer not found' using errcode = 'P0002';
  end if;

  delete from public.messages where business_id = input_business_id and customer_id = input_customer_id;
  update public.conversations set customer_id = null where business_id = input_business_id and customer_id = input_customer_id;
  update public.customers
    set name = 'Изтрит клиент', phone = null, email = null, notes = null, external_id = null, last_seen_at = null
    where id = input_customer_id and business_id = input_business_id;
end;
$$;

revoke all privileges on function public.anonymize_customer(uuid, uuid) from public, anon;
grant execute on function public.anonymize_customer(uuid, uuid) to authenticated, service_role;

commit;
