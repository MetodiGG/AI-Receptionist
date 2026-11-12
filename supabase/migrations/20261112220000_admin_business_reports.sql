-- Read-only, verified-admin reporting is exposed only by the server route.
-- No customer/booking data, existing grants, policies or RLS are changed.
begin;

create index if not exists appointments_business_created_report_idx
  on public.appointments (business_id,created_at,id);

create or replace function public.admin_business_report(
  p_business uuid,p_from timestamptz,p_until timestamptz,p_basis text,
  p_status text,p_view text,p_page integer,p_page_size integer)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
  if p_business is null or p_from is null or p_until is null
    or not isfinite(p_from) or not isfinite(p_until)
    or p_until<=p_from or p_until>p_from+interval '367 days'
    or p_basis is null or p_basis not in ('visit','created')
    or p_status is null or p_status not in ('all','booked','confirmed','done','cancelled','no_show')
    or p_view is null or p_view not in ('bookings','customers')
    or p_page is null or p_page not between 1 and 100000
    or p_page_size is null or p_page_size not between 1 and 50 then
    raise exception 'INVALID_REPORT_QUERY' using errcode='22023';
  end if;
  if not exists(select 1 from public.businesses where id=p_business) then
    raise exception 'BUSINESS_NOT_FOUND' using errcode='P0002';
  end if;

  -- Separate range branches permit both date bases to use their business/date
  -- index. No notes, intake answers, tokens or messages enter the report CTE.
  with base as materialized (
    select a.id,a.customer_id,a.service_id,a.staff_id,a.starts_at,a.ends_at,
      a.created_at,a.status,a.source,a.starts_at as sort_at
    from public.appointments a
    where p_basis='visit' and a.business_id=p_business
      and a.starts_at>=p_from and a.starts_at<p_until
    union all
    select a.id,a.customer_id,a.service_id,a.staff_id,a.starts_at,a.ends_at,
      a.created_at,a.status,a.source,a.created_at as sort_at
    from public.appointments a
    where p_basis='created' and a.business_id=p_business
      and a.created_at>=p_from and a.created_at<p_until
  ), stats as materialized (
    select count(*) as bookings,count(distinct c.id) as customers,
      count(*) filter(where a.status='booked') as booked,
      count(*) filter(where a.status='confirmed') as confirmed,
      count(*) filter(where a.status='done') as done,
      count(*) filter(where a.status='cancelled') as cancelled,
      count(*) filter(where a.status='no_show') as no_show,
      count(*) filter(where p_status='all' or a.status=p_status) as filtered_bookings,
      count(distinct c.id) filter(where p_status='all' or a.status=p_status) as filtered_customers
    from base a left join public.customers c on c.id=a.customer_id and c.business_id=p_business
  ), filtered as materialized (
    select * from base where p_status='all' or status=p_status
  ), customer_groups as materialized (
    select c.id,c.name,c.phone,c.email,count(*) as bookings,
      count(*) filter(where a.status='booked') as booked,
      count(*) filter(where a.status='confirmed') as confirmed,
      count(*) filter(where a.status='done') as done,
      count(*) filter(where a.status='cancelled') as cancelled,
      count(*) filter(where a.status='no_show') as no_show,
      min(a.starts_at) as first_visit_at,max(a.starts_at) as last_visit_at
    from filtered a join public.customers c on c.id=a.customer_id and c.business_id=p_business
    where p_view='customers'
    group by c.id,c.name,c.phone,c.email
  ), page_meta as materialized (
    select case when p_view='bookings' then filtered_bookings else filtered_customers end as total_rows
    from stats
  ), booking_page as (
    select a.* from filtered a cross join page_meta p
    where p_view='bookings' and (p_page-1)::bigint*p_page_size<p.total_rows
    order by a.sort_at desc,a.id desc limit p_page_size offset (p_page-1)::bigint*p_page_size
  ), customer_page as (
    select c.* from customer_groups c cross join page_meta p
    where p_view='customers' and (p_page-1)::bigint*p_page_size<p.total_rows
    order by c.name nulls last,c.id limit p_page_size offset (p_page-1)::bigint*p_page_size
  )
  select jsonb_build_object(
    'summary',jsonb_build_object('bookings',s.bookings,'customers',s.customers,
      'statuses',jsonb_build_object('booked',s.booked,'confirmed',s.confirmed,'done',s.done,'cancelled',s.cancelled,'no_show',s.no_show)),
    'filtered',jsonb_build_object('bookings',s.filtered_bookings,'customers',s.filtered_customers),
    'view',p_view,'page',p_page,'pageSize',p_page_size,'totalRows',p.total_rows,
    'totalPages',ceil(p.total_rows::numeric/p_page_size)::bigint,
    'rows',case when p_view='bookings' then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'startsAt',a.starts_at,'endsAt',a.ends_at,'createdAt',a.created_at,'status',a.status,'source',a.source,
        'customer',case when c.id is null then null else jsonb_build_object('id',c.id,'name',c.name,'phone',c.phone,'email',c.email) end,
        'service',case when v.id is null then null else jsonb_build_object('id',v.id,'name',v.name) end,
        'staff',case when t.id is null then null else jsonb_build_object('id',t.id,'name',t.name) end) order by a.sort_at desc,a.id desc)
      from booking_page a
      left join public.customers c on c.id=a.customer_id and c.business_id=p_business
      left join public.services v on v.id=a.service_id and v.business_id=p_business
      left join public.staff t on t.id=a.staff_id and t.business_id=p_business
    ),'[]'::jsonb) else coalesce((
      select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'phone',c.phone,'email',c.email,'bookings',c.bookings,
        'statuses',jsonb_build_object('booked',c.booked,'confirmed',c.confirmed,'done',c.done,'cancelled',c.cancelled,'no_show',c.no_show),
        'firstVisitAt',c.first_visit_at,'lastVisitAt',c.last_visit_at) order by c.name nulls last,c.id)
      from customer_page c
    ),'[]'::jsonb) end
  ) into result from stats s cross join page_meta p;
  return result;
end $$;

revoke all on function public.admin_business_report(uuid,timestamptz,timestamptz,text,text,text,integer,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.admin_business_report(uuid,timestamptz,timestamptz,text,text,text,integer,integer)
  to service_role;

commit;
