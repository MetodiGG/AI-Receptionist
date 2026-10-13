-- Canonical, repeatable baseline for the AI Receptionist database.
-- Safe to run on the existing project where these objects were created manually.
begin;

create extension if not exists btree_gist;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  phone text,
  address text,
  timezone text not null default 'Europe/Sofia',
  languages text[] not null default '{bg}',
  bot_instructions text,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(8,2) not null check (price >= 0),
  currency text not null default 'EUR',
  duration_min int not null check (duration_min > 0),
  active boolean not null default true
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  active boolean not null default true
);

create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  open_time time not null,
  close_time time not null,
  check (close_time > open_time)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text,
  phone text,
  channel text not null default 'web',
  external_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid not null references public.staff(id),
  service_id uuid not null references public.services(id),
  customer_id uuid not null references public.customers(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked'
    check (status in ('booked', 'confirmed', 'cancelled', 'no_show', 'done')),
  source text not null default 'bot',
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('booked', 'confirmed'))
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  role text not null check (role in ('customer', 'bot')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists services_business_id_idx on public.services (business_id);
create index if not exists staff_business_id_idx on public.staff (business_id);
create index if not exists working_hours_business_id_staff_id_idx on public.working_hours (business_id, staff_id);
create index if not exists customers_business_id_idx on public.customers (business_id);
create index if not exists appointments_business_id_starts_at_idx on public.appointments (business_id, starts_at);
create index if not exists messages_business_id_customer_id_created_at_idx on public.messages (business_id, customer_id, created_at);

create or replace function public.owns_business(bid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.businesses
    where id = bid and owner_id = auth.uid()
  );
$$;

alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.working_hours enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.messages enable row level security;

do $$
declare
  target_table text;
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'businesses'
      and policyname = 'owner manages own business'
  ) then
    create policy "owner manages own business" on public.businesses
      for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;

  foreach target_table in array array[
    'services', 'staff', 'working_hours', 'customers', 'appointments', 'messages'
  ] loop
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

commit;
