-- A complete, private business application. No existing record is modified.
begin;
alter table public.partner_leads
  add column if not exists business_id uuid references public.businesses(id) on delete set null,
  add column if not exists requires_owner_activation boolean not null default false,
  add column if not exists setup_summary jsonb;
create unique index if not exists partner_leads_application_business_idx on public.partner_leads(business_id) where business_id is not null;

create or replace function public.submit_business_application(p_owner uuid,p_requires_activation boolean,p_application jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare b jsonb:=p_application->'business'; s jsonb; person jsonb; h jsonb;
  bid uuid; sid uuid; lid uuid;
begin
  if p_owner is null or not exists(select 1 from auth.users where id=p_owner and lower(email)=p_application->>'email')
    or jsonb_array_length(p_application->'services') not between 1 and 40
    or jsonb_array_length(p_application->'staff') not between 1 and 20
    or jsonb_array_length(p_application->'hours') not between 1 and 7 then
    raise exception 'INVALID_APPLICATION' using errcode='22023';
  end if;
  insert into public.businesses(owner_id,name,slug,phone,contact_email,address,timezone,industry,city_ekatte,city,neighborhood,
    default_duration_min,booking_slot_minutes,languages,notification_locale,platform_status)
  values(p_owner,b->>'name',b->>'slug',b->>'phone',b->>'contact_email',b->>'address',b->>'timezone',b->>'industry',
    b->>'city_ekatte',b->>'city',nullif(b->>'neighborhood',''),(b->>'default_duration_min')::integer,
    (b->>'booking_slot_minutes')::integer,array['bg','en'],p_application->>'locale','pending') returning id into bid;
  for s in select value from jsonb_array_elements(p_application->'services') loop
    insert into public.services(business_id,name,price,currency,duration_min)
      values(bid,s->>'name',(s->>'price')::numeric,'EUR',(s->>'duration_min')::integer);
  end loop;
  for person in select value from jsonb_array_elements(p_application->'staff') loop
    insert into public.staff(business_id,name) values(bid,person->>'name') returning id into sid;
    for h in select value from jsonb_array_elements(p_application->'hours') loop
      insert into public.working_hours(business_id,staff_id,weekday,open_time,close_time,break_start,break_end)
      values(bid,sid,(h->>'weekday')::smallint,(h->>'open_time')::time,(h->>'close_time')::time,
        (h->>'break_start')::time,(h->>'break_end')::time);
    end loop;
  end loop;
  insert into public.partner_leads(business_name,contact_name,phone,email,category,city,locale,fingerprint,business_id,requires_owner_activation,setup_summary)
  values(b->>'name',p_application->'staff'->0->>'name',b->>'phone',p_application->>'email',b->>'industry',b->>'city',
    p_application->>'locale','application:'||bid::text,bid,p_requires_activation,
    jsonb_build_object('services',p_application->'services','staff',p_application->'staff','hours',p_application->'hours','address',b->>'address','neighborhood',b->>'neighborhood')) returning id into lid;
  return lid;
end;
$$;
revoke all on function public.submit_business_application(uuid,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.submit_business_application(uuid,boolean,jsonb) to service_role;

-- A final decision publishes/suspends the linked profile in the SAME transaction.
-- Auth activation is a server-only prerequisite; browser roles cannot call this.
create or replace function public.review_business_application(p_lead uuid,p_actor uuid,p_status text,p_expected timestamptz,p_notes text default null,p_edit_notes boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.partner_leads; b public.businesses;
begin
  select * into l from public.partner_leads where id=p_lead for update;
  if not found or l.updated_at<>p_expected then raise exception 'LEAD_CHANGED' using errcode='40001';end if;
  if l.business_id is null or p_status not in ('new','active','declined') or p_actor is null then
    raise exception 'INVALID_APPLICATION_DECISION' using errcode='22023';
  end if;
  select * into b from public.businesses where id=l.business_id for update;
  if not found then raise exception 'BUSINESS_NOT_FOUND' using errcode='P0002';end if;
  if p_status='active' and (b.platform_status<>'enabled' or not b.active) then
    if l.requires_owner_activation and not exists(select 1 from auth.users where id=b.owner_id and email_confirmed_at is not null) then
      raise exception 'OWNER_ACTIVATION_REQUIRED' using errcode='22023';
    end if;
    perform public.platform_business_action(b.id,p_actor,'publish',b.platform_revision,b.slug,'Application approved by platform administrator');
  elsif p_status in ('declined','new') and b.platform_status='enabled' then
    perform public.platform_business_action(b.id,p_actor,'suspend',b.platform_revision,b.slug,'Application returned to review by platform administrator');
  end if;
  update public.partner_leads set status=p_status,notes=case when p_edit_notes then nullif(p_notes,'') else notes end,updated_at=clock_timestamp()
    where id=l.id returning * into l;
  return jsonb_build_object('id',l.id,'status',l.status,'notes',l.notes,'updated_at',l.updated_at);
end;
$$;
revoke all on function public.review_business_application(uuid,uuid,text,timestamptz,text,boolean) from public,anon,authenticated;
grant execute on function public.review_business_application(uuid,uuid,text,timestamptz,text,boolean) to service_role;

-- Publication from the Businesses tab follows the same activation guard and
-- keeps the linked application in sync. Older contact-only leads are untouched.
create or replace function public.sync_business_application_publication()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.platform_status='enabled' and old.platform_status is distinct from new.platform_status then
    if exists(select 1 from public.partner_leads l join auth.users u on u.id=new.owner_id
      where l.business_id=new.id and l.requires_owner_activation and u.email_confirmed_at is null) then
      raise exception 'OWNER_ACTIVATION_REQUIRED' using errcode='22023';
    end if;
    update public.partner_leads set status='active',updated_at=clock_timestamp() where business_id=new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_business_application_publication() from public,anon,authenticated;
drop trigger if exists sync_business_application_publication on public.businesses;
create trigger sync_business_application_publication after update of platform_status on public.businesses
  for each row execute function public.sync_business_application_publication();
commit;
