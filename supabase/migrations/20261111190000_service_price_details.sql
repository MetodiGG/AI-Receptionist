-- REVIEW ONLY: do not apply without explicit production migration approval.
-- Requires business_content_and_media and external_business_applications.
-- Additive price qualifications. No existing amount, duration, publication,
-- appointment, customer or calendar rule is changed. No paid service enabled.
begin;
alter table public.services add column price_details jsonb not null default '{}'::jsonb;

create function public.valid_service_price_details(p_price numeric,p_details jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare kind text; maximum numeric;
begin
 if p_details is null or jsonb_typeof(p_details)<>'object' or exists(select 1 from jsonb_object_keys(p_details) k where k not in ('kind','maximum','unit')) then return false;end if;
 if (p_details?'kind' and jsonb_typeof(p_details->'kind')<>'string') or (p_details?'unit' and (jsonb_typeof(p_details->'unit')<>'string' or char_length(p_details->>'unit')>100)) then return false;end if;
 kind:=coalesce(p_details->>'kind','fixed');
 if kind not in ('fixed','from','range') or (kind in ('from','range') and p_price is null) then return false;end if;
 if kind='range' then
  if jsonb_typeof(p_details->'maximum') is distinct from 'number' then return false;end if;
  maximum:=(p_details->>'maximum')::numeric;
  if maximum<p_price or maximum<0 or maximum>999999.99 or maximum<>round(maximum,2) then return false;end if;
 elsif p_details?'maximum' then return false;
 end if;
 return true;
exception when others then return false;
end $$;
revoke all on function public.valid_service_price_details(numeric,jsonb) from public,anon;
grant execute on function public.valid_service_price_details(numeric,jsonb) to authenticated,service_role;
alter table public.services add constraint service_price_details_valid check(public.valid_service_price_details(price,price_details));

-- Preserve the existing full registration/ownership/media/moderation logic.
-- The enrichment remains in its SAME transaction, never a best-effort patch.
alter function public.submit_business_application(uuid,boolean,jsonb) rename to submit_business_application_before_price_details;
revoke all on function public.submit_business_application_before_price_details(uuid,boolean,jsonb) from public,anon,authenticated,service_role;
create function public.submit_business_application(p_owner uuid,p_requires_activation boolean,p_application jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare lid uuid;bid uuid;s jsonb;target uuid;idx integer:=0;count_services integer;
begin
 if jsonb_typeof(p_application->'services') is distinct from 'array' then raise exception 'INVALID_APPLICATION' using errcode='22023';end if;
 for s in select value from jsonb_array_elements(p_application->'services') loop
  if jsonb_typeof(s) is distinct from 'object' or coalesce(s->>'currency','EUR') not in ('EUR','BGN')
   or (s?'description' and jsonb_typeof(s->'description') not in ('string','null')) or char_length(coalesce(s->>'description',''))>2000
   or not public.valid_service_price_details((s->>'price')::numeric,coalesce(s->'price_details','{}'::jsonb)) then raise exception 'INVALID_SERVICE_PRICE' using errcode='22023';end if;
 end loop;
 lid:=public.submit_business_application_before_price_details(p_owner,p_requires_activation,p_application);
 select business_id into bid from public.partner_leads where id=lid;
 if bid is null or not exists(select 1 from public.businesses where id=bid and owner_id=p_owner) then raise exception 'WRONG_BUSINESS';end if;
 select count(*) into count_services from public.services where business_id=bid;
 if count_services<>jsonb_array_length(p_application->'services') or count_services<>(select count(distinct sort_order) from public.services where business_id=bid) then raise exception 'SERVICE_INVENTORY_CHANGED';end if;
 for s in select value from jsonb_array_elements(p_application->'services') loop
  select id into target from public.services where business_id=bid and sort_order=idx and name=s->>'name';
  if target is null then raise exception 'SERVICE_INVENTORY_CHANGED';end if;
  update public.services set currency=coalesce(s->>'currency','EUR'),description=nullif(s->>'description',''),price_details=coalesce(s->'price_details','{}'::jsonb) where id=target and business_id=bid;
  idx:=idx+1;
 end loop;
 return lid;
end $$;
revoke all on function public.submit_business_application(uuid,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.submit_business_application(uuid,boolean,jsonb) to service_role;

-- Keep existing revision, tenancy, scheduling and audit guards. Metadata and
-- amount update together so a valid new range cannot fail against an old max.
create or replace function public.edit_business_content(p_business uuid,p_actor uuid,p_revision bigint,p_section text,p_payload jsonb,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare b public.businesses;r jsonb;target uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_business::text,0));
 select * into b from public.businesses where id=p_business for update;
 if not found then raise exception 'BUSINESS_NOT_FOUND';end if;
 if b.platform_status='archived' then raise exception 'RESTORE_FIRST';end if;
 if p_revision is null or b.content_revision<>p_revision then raise exception 'CONTENT_CHANGED' using errcode='40001';end if;
 if p_actor is null or p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then raise exception 'VALIDATION_ERROR';end if;
 if p_section='business' then
  if p_payload->>'timezone' is distinct from b.timezone and exists(select 1 from public.appointments where business_id=b.id and status in ('booked','confirmed') and ends_at>now()) then raise exception 'TIMEZONE_BOOKINGS';end if;
  update public.businesses set name=p_payload->>'name',slug=p_payload->>'slug',phone=p_payload->>'phone',contact_email=p_payload->>'contact_email',address=p_payload->>'address',city=p_payload->>'city',city_ekatte=p_payload->>'city_ekatte',neighborhood=p_payload->>'neighborhood',timezone=p_payload->>'timezone',industry=p_payload->>'industry',website_url=p_payload->>'website_url',privacy_contact_email=p_payload->>'privacy_contact_email',booking_terms=p_payload->>'booking_terms',default_duration_min=(p_payload->>'default_duration_min')::integer,booking_slot_minutes=(p_payload->>'booking_slot_minutes')::integer,booking_window_days=(p_payload->>'booking_window_days')::integer,minimum_notice_minutes=(p_payload->>'minimum_notice_minutes')::integer,cancellation_notice_hours=(p_payload->>'cancellation_notice_hours')::integer,email_notifications_enabled=(p_payload->>'email_notifications_enabled')::boolean,notification_locale=p_payload->>'notification_locale',review_requests_enabled=(p_payload->>'review_requests_enabled')::boolean,public_profile=p_payload->'public_profile',welcome_message=p_payload->>'welcome_message',bot_instructions=p_payload->>'bot_instructions' where id=b.id;
 elsif p_section in ('services','staff') then
  if jsonb_typeof(p_payload)<>'array' or jsonb_array_length(p_payload)>100 then raise exception 'VALIDATION_ERROR';end if;
  for r in select value from jsonb_array_elements(p_payload) loop
   target:=nullif(r->>'id','')::uuid;
   if p_section='services' then
    if target is not null and not exists(select 1 from public.services where id=target and business_id=b.id) then raise exception 'WRONG_BUSINESS';end if;
    if (r?'currency' and (jsonb_typeof(r->'currency')<>'string' or r->>'currency'!~'^[A-Z]{3}$')) or char_length(coalesce(r->>'description',''))>2000 then raise exception 'INVALID_SERVICE_PRICE';end if;
    if target is null then insert into public.services(business_id,name,price,currency,duration_min,price_details) values(b.id,r->>'name',(r->>'price')::numeric,coalesce(r->>'currency','EUR'),(r->>'duration_min')::integer,coalesce(r->'price_details','{}'::jsonb)) returning id into target;end if;
    update public.services set name=r->>'name',description=r->>'description',category=r->>'category',duration_min=(r->>'duration_min')::integer,price=(r->>'price')::numeric,currency=case when r?'currency' then r->>'currency' else currency end,price_details=case when r?'price_details' then r->'price_details' else price_details end,active=(r->>'active')::boolean,sort_order=(r->>'sort_order')::integer where id=target and business_id=b.id;
   else
    if target is not null and not exists(select 1 from public.staff where id=target and business_id=b.id) then raise exception 'WRONG_BUSINESS';end if;
    if target is null then insert into public.staff(business_id,name) values(b.id,r->>'name') returning id into target;end if;
    update public.staff set name=r->>'name',email=r->>'email',phone=r->>'phone',bio=r->>'bio',active=(r->>'active')::boolean,sort_order=(r->>'sort_order')::integer where id=target and business_id=b.id;
   end if;
  end loop;
 elsif p_section='hours' then
  target:=(p_payload->>'staffId')::uuid;
  if not exists(select 1 from public.staff where id=target and business_id=b.id) then raise exception 'WRONG_BUSINESS';end if;
  if jsonb_typeof(p_payload->'hours')<>'array' or jsonb_array_length(p_payload->'hours')>7 then raise exception 'VALIDATION_ERROR';end if;
  if exists(select 1 from jsonb_to_recordset(p_payload->'hours') as h(weekday smallint,open_time time,close_time time,break_start time,break_end time) where h.weekday is null or h.weekday not between 1 and 7 or h.open_time is null or h.close_time is null or h.close_time<=h.open_time or (h.break_start is null)<>(h.break_end is null) or (h.break_start is not null and (h.break_start<h.open_time or h.break_end>h.close_time or h.break_end<=h.break_start or (h.break_start=h.open_time and h.break_end=h.close_time)))) then raise exception 'VALIDATION_ERROR';end if;
  if (select count(*)<>count(distinct h.weekday) from jsonb_to_recordset(p_payload->'hours') as h(weekday smallint)) then raise exception 'VALIDATION_ERROR';end if;
  if exists(select 1 from public.appointments a where a.business_id=b.id and a.staff_id=target and a.status in ('booked','confirmed') and a.ends_at>now() and not exists(select 1 from jsonb_to_recordset(p_payload->'hours') as h(weekday smallint,open_time time,close_time time,break_start time,break_end time) where h.weekday=extract(isodow from a.starts_at at time zone b.timezone) and (a.starts_at at time zone b.timezone)::date=(a.ends_at at time zone b.timezone)::date and (a.starts_at at time zone b.timezone)::time>=h.open_time and (a.ends_at at time zone b.timezone)::time<=h.close_time and (h.break_start is null or (a.ends_at at time zone b.timezone)::time<=h.break_start or (a.starts_at at time zone b.timezone)::time>=h.break_end))) then raise exception 'SCHEDULE_CONFLICT';end if;
  delete from public.working_hours where business_id=b.id and staff_id=target;
  insert into public.working_hours(business_id,staff_id,weekday,open_time,close_time,break_start,break_end) select b.id,target,h.weekday,h.open_time,h.close_time,h.break_start,h.break_end from jsonb_to_recordset(p_payload->'hours') as h(weekday smallint,open_time time,close_time time,break_start time,break_end time);
 else raise exception 'VALIDATION_ERROR';end if;
 insert into public.business_content_audit(business_id,actor_id,actor_kind,section,reason) values(b.id,p_actor,'admin',p_section,btrim(p_reason));
end $$;
revoke all on function public.edit_business_content(uuid,uuid,bigint,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.edit_business_content(uuid,uuid,bigint,text,jsonb,text) to service_role;
notify pgrst,'reload schema';
commit;
