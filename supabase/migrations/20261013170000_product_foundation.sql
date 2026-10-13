-- Product fields required by the booking portal, dashboard and web assistant.
begin;

alter table public.businesses
  add column if not exists active boolean not null default true,
  add column if not exists welcome_message text,
  add column if not exists booking_window_days smallint not null default 60,
  add column if not exists minimum_notice_minutes int not null default 60,
  add column if not exists cancellation_notice_hours int not null default 12,
  add column if not exists booking_slot_minutes smallint not null default 15,
  add column if not exists theme_color text not null default '#173e2a';

alter table public.services
  add column if not exists color text not null default '#b8f36b',
  add column if not exists sort_order int not null default 0;

alter table public.staff
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists sort_order int not null default 0;

alter table public.customers
  add column if not exists email text,
  add column if not exists notes text,
  add column if not exists last_seen_at timestamptz;

alter table public.appointments
  add column if not exists notes text,
  add column if not exists cancellation_token uuid not null default gen_random_uuid(),
  add column if not exists cancelled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists appointments_cancellation_token_idx
  on public.appointments (cancellation_token);

create table if not exists public.staff_services (
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

create table if not exists public.time_off (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  channel text not null default 'web',
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists conversation_id uuid references public.conversations(id) on delete cascade,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists staff_services_business_idx on public.staff_services (business_id);
create index if not exists time_off_staff_starts_idx on public.time_off (staff_id, starts_at);
create index if not exists conversations_business_updated_idx on public.conversations (business_id, updated_at desc);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index if not exists appointments_staff_starts_idx on public.appointments (staff_id, starts_at);

alter table public.staff_services enable row level security;
alter table public.time_off enable row level security;
alter table public.conversations enable row level security;

do $$
declare
  target_table text;
begin
  foreach target_table in array array['staff_services', 'time_off', 'conversations'] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = target_table
        and policyname = 'owner manages own rows'
    ) then
      execute format(
        'create policy "owner manages own rows" on public.%I
           for all using (public.owns_business(business_id))
           with check (public.owns_business(business_id))',
        target_table
      );
    end if;
  end loop;
end $$;

revoke all privileges on table
  public.staff_services,
  public.time_off,
  public.conversations
from anon;

grant select, insert, update, delete on table
  public.staff_services,
  public.time_off,
  public.conversations
to authenticated, service_role;

commit;
