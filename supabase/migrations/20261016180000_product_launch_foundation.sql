-- Non-destructive: optional application fields, plus isolated opt-in metrics.
-- Existing businesses, appointments, Auth and notification outbox are untouched.
begin;
alter table public.partner_leads alter column contact_name drop not null;
alter table public.partner_leads alter column city drop not null;
-- Existing length checks still apply when a value is provided; NULL is allowed.
create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  event_type text not null check(event_type in ('cta_add_business_click','cta_find_appointment_click','form_start','form_submit','business_signup_success','booking_started','booking_completed')),
  page text not null check(page in ('home','for-businesses','book')),
  locale text not null check(locale in ('bg','en')),
  flow_key uuid not null,
  created_at timestamptz not null default now(),
  unique(flow_key,event_type)
);
create index if not exists product_events_created_idx on public.product_events(created_at);
alter table public.product_events enable row level security;
revoke all privileges on public.product_events from public, anon, authenticated;
grant select, insert, update on public.product_events to service_role;
grant usage, select on sequence public.product_events_id_seq to service_role;
commit;
