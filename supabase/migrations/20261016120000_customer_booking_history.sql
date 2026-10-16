-- Customer access stays behind the authenticated server API. No customer gets
-- direct SELECT access to CRM, messages, private notes or another owner's rows.
begin;
-- Existing users may have been automatically confirmed by the old Auth
-- configuration. A fresh email-link proof is required before history access.
create table if not exists public.customer_email_verifications (
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  verified_at timestamptz not null default now(),
  primary key (user_id,email)
);
alter table public.customer_email_verifications enable row level security;
revoke all on public.customer_email_verifications from anon,authenticated;
grant select,insert,update on public.customer_email_verifications to service_role;
create index if not exists customers_verified_email_lookup_idx
  on public.customers (lower(btrim(email))) where email is not null;

create or replace function public.customer_booking_history(account_id uuid, history_view text, page_number integer default 0)
returns setof jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'ends_at', a.ends_at,
    'status', a.status, 'cancellation_token', a.cancellation_token,
    'business', jsonb_build_object('name',b.name,'slug',b.slug,'phone',b.phone,
      'address',b.address,'city',b.city,'neighborhood',b.neighborhood,'timezone',b.timezone,'active',b.active),
    'service', jsonb_build_object('name',s.name,'price',s.price,'currency',s.currency,'duration_min',s.duration_min),
    'staff', jsonb_build_object('name',st.name)
  )
  from auth.users u
  join public.customer_email_verifications v on v.user_id=u.id and v.email=lower(btrim(u.email))
  join public.customers c on lower(btrim(c.email)) = lower(btrim(u.email))
  join public.appointments a on a.customer_id=c.id and a.business_id=c.business_id
  join public.businesses b on b.id=a.business_id
  join public.services s on s.id=a.service_id and s.business_id=a.business_id
  join public.staff st on st.id=a.staff_id and st.business_id=a.business_id
  where u.id=account_id and u.email_confirmed_at is not null and u.deleted_at is null
    and nullif(btrim(u.email),'') is not null and page_number between 0 and 500
    and (
      (history_view='upcoming' and a.status in ('booked','confirmed') and a.ends_at>=now())
      or (history_view='past' and (a.status in ('cancelled','done','no_show') or a.ends_at<now()))
    )
  order by
    case when history_view='upcoming' then a.starts_at end asc,
    case when history_view='past' then a.starts_at end desc,
    a.id
  limit 21 offset (page_number*20);
$$;
revoke all on function public.customer_booking_history(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.customer_booking_history(uuid,text,integer) to service_role;
commit;
