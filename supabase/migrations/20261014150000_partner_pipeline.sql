-- Secure pre-pilot partner interest pipeline.
-- Public submissions are accepted only through the server route. Direct
-- browser access remains disabled and the platform admin allowlist controls
-- who can read or update leads.
begin;

create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(business_name) between 2 and 120),
  contact_name text not null check (char_length(contact_name) between 2 and 100),
  phone text not null check (char_length(phone) between 6 and 32),
  email text not null check (char_length(email) between 5 and 180),
  category text not null check (category in ('beauty', 'auto', 'health', 'fitness', 'education', 'consulting', 'home_services', 'pets', 'other')),
  city text not null check (char_length(city) between 2 and 100),
  website_url text,
  status text not null default 'new' check (status in ('new', 'contacted', 'demo_scheduled', 'interested', 'onboarding', 'active', 'declined')),
  notes text,
  locale text not null default 'bg' check (locale in ('bg', 'en')),
  fingerprint text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_leads_status_created_idx
  on public.partner_leads (status, created_at desc);

alter table public.partner_leads enable row level security;

revoke all privileges on table public.partner_leads from public, anon, authenticated;
grant select, insert, update, delete on table public.partner_leads to service_role;

commit;
