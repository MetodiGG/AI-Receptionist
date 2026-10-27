-- PREPARED ONLY: owner approval is required before applying this migration.
-- No provider content, prompts, precise locations or customer data are stored.
begin;

create table if not exists public.discovery_usage_buckets (
  environment text not null check (environment in ('development','preview','production')),
  provider text not null check (provider in ('google','ai')),
  period_type text not null check (period_type in ('day','month')),
  period_start date not null,
  request_count integer not null default 0 check (request_count >= 0),
  reserved_microusd bigint not null default 0 check (reserved_microusd >= 0),
  primary key (environment, provider, period_type, period_start)
);
alter table public.discovery_usage_buckets enable row level security;
revoke all on public.discovery_usage_buckets from public, anon, authenticated;
grant select,insert,update,delete on public.discovery_usage_buckets to service_role;

create or replace function public.claim_discovery_budget(
  p_environment text, p_provider text, p_daily_limit integer, p_monthly_limit integer,
  p_daily_cost_limit bigint, p_monthly_cost_limit bigint, p_cost_microusd bigint
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_day date := (now() at time zone 'UTC')::date;
  v_month date := date_trunc('month', now() at time zone 'UTC')::date;
  v_daily public.discovery_usage_buckets%rowtype;
  v_monthly public.discovery_usage_buckets%rowtype;
begin
  if p_environment is null or p_environment not in ('development','preview','production')
    or p_provider is null or p_provider not in ('google','ai')
    or p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 10000
    or p_monthly_limit is null or p_monthly_limit < 1 or p_monthly_limit > 100000
    or p_daily_cost_limit is null or p_daily_cost_limit < 1 or p_daily_cost_limit > 30000000
    or p_monthly_cost_limit is null or p_monthly_cost_limit < 1 or p_monthly_cost_limit > 30000000
    or p_cost_microusd is null or p_cost_microusd < 1 or p_cost_microusd > 1000000 then return false;
  end if;

  -- One transaction-wide lock serializes both counters across all instances.
  perform pg_advisory_xact_lock(hashtextextended('discovery:' || p_environment || ':' || p_provider, 0));
  insert into public.discovery_usage_buckets(environment,provider,period_type,period_start)
    values(p_environment,p_provider,'day',v_day),(p_environment,p_provider,'month',v_month)
    on conflict do nothing;
  select * into v_daily from public.discovery_usage_buckets
    where environment=p_environment and provider=p_provider and period_type='day' and period_start=v_day for update;
  select * into v_monthly from public.discovery_usage_buckets
    where environment=p_environment and provider=p_provider and period_type='month' and period_start=v_month for update;
  if v_daily.request_count >= p_daily_limit or v_monthly.request_count >= p_monthly_limit
    or v_daily.reserved_microusd + p_cost_microusd > p_daily_cost_limit
    or v_monthly.reserved_microusd + p_cost_microusd > p_monthly_cost_limit then return false;
  end if;
  update public.discovery_usage_buckets set request_count=request_count+1, reserved_microusd=reserved_microusd+p_cost_microusd
    where environment=p_environment and provider=p_provider
    and ((period_type='day' and period_start=v_day) or (period_type='month' and period_start=v_month));
  delete from public.discovery_usage_buckets where period_start < v_day - 90;
  return true;
end;
$$;
revoke all on function public.claim_discovery_budget(text,text,integer,integer,bigint,bigint,bigint) from public,anon,authenticated;
grant execute on function public.claim_discovery_budget(text,text,integer,integer,bigint,bigint,bigint) to service_role;

-- A name match is not proof. Only the authenticated platform-admin endpoint can
-- write a reviewed association. Google place IDs have a storage exception.
create table if not exists public.business_place_links (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  place_id text not null unique check (length(place_id) between 5 and 200 and place_id ~ '^[A-Za-z0-9_-]+$'),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz not null default now()
);
alter table public.business_place_links enable row level security;
revoke all on public.business_place_links from public,anon,authenticated;
grant select,insert,update,delete on public.business_place_links to service_role;

commit;
