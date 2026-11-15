-- Optional, additive aggregate counters only. No existing business, booking,
-- customer, Auth, notification or security policy is modified.
begin;
create table public.search_daily_metrics (
  metric_day date not null,
  topic text not null check(char_length(topic) between 1 and 80),
  locale text not null check(locale in ('bg','en')),
  event text not null check(event in ('search','selection','profile')),
  outcome text not null check(outcome in ('results','zero','error','service','category','business','all','opened')),
  latency text not null check(latency in ('fast','normal','slow','very_slow','unknown')),
  event_count bigint not null default 1 check(event_count between 1 and 1000000),
  primary key(metric_day,topic,locale,event,outcome,latency),
  check((event='search' and outcome in ('results','zero','error')) or
    (event='selection' and outcome in ('service','category','business','all') and latency='unknown') or
    (event='profile' and outcome='opened' and latency='unknown'))
);
alter table public.search_daily_metrics enable row level security;
revoke all on public.search_daily_metrics from public,anon,authenticated,service_role;

create function public.prune_search_metrics() returns void
language sql security definer set search_path='' as $$
  delete from public.search_daily_metrics where metric_day < (now() at time zone 'UTC')::date-29;
$$;
create function public.record_search_metric(p_event text,p_topic text,p_locale text,p_outcome text,p_latency text)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.prune_search_metrics();
  insert into public.search_daily_metrics(metric_day,topic,locale,event,outcome,latency)
    values((now() at time zone 'UTC')::date,p_topic,p_locale,p_event,p_outcome,p_latency)
  on conflict(metric_day,topic,locale,event,outcome,latency) do update
    set event_count=least(public.search_daily_metrics.event_count+1,1000000);
end $$;
create function public.search_metrics_summary(p_days integer)
returns table(topic text,event text,outcome text,latency text,event_count bigint)
language plpgsql security definer set search_path='' as $$
begin
  if p_days is null or p_days not in (7,30) then raise exception 'INVALID_PERIOD'; end if;
  perform public.prune_search_metrics();
  return query select m.topic,m.event,m.outcome,m.latency,sum(m.event_count)::bigint
    from public.search_daily_metrics m
    where m.metric_day >= (now() at time zone 'UTC')::date-(p_days-1)
    group by m.topic,m.event,m.outcome,m.latency;
end $$;
revoke all on function public.prune_search_metrics(),public.record_search_metric(text,text,text,text,text),public.search_metrics_summary(integer) from public,anon,authenticated;
grant execute on function public.prune_search_metrics(),public.record_search_metric(text,text,text,text,text),public.search_metrics_summary(integer) to service_role;
commit;
