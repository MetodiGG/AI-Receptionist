-- Additive only. Apply after owner approval; does not publish businesses,
-- change owner identities, appointments, prices or notification settings.
begin;
alter table public.businesses add column if not exists content_revision bigint not null default 0;
alter table public.businesses add column if not exists media_gallery_managed boolean not null default false;
create unique index if not exists staff_business_identity_idx on public.staff(id,business_id);

create table if not exists public.business_media (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid,
  object_key text not null unique,
  curated_src text,
  width integer not null check(width between 1 and 1600),
  height integer not null check(height between 1 and 1600),
  byte_size integer not null check(byte_size between 1 and 1048576),
  alt_text text not null default '' check(char_length(alt_text)<=180),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key(staff_id,business_id) references public.staff(id,business_id) on delete cascade,
  check(object_key=business_id::text||'/'||id::text||'.webp'),
  -- Only these already-published, operator-supplied assets may bypass Storage.
  -- No client or admin payload accepts an arbitrary source URL.
  check(curated_src is null or (business_id='450c5c2f-db41-476b-a21e-98cf5ee29194'::uuid and staff_id is null and (
    (id='450c5c2f-db41-476b-a21e-98cf5ee29195'::uuid and curated_src='/businesses/vesi-studio/interior-20261026.webp') or
    (id='450c5c2f-db41-476b-a21e-98cf5ee29196'::uuid and curated_src='/businesses/vesi-studio/entrance-20261026.webp')
  )))
);
create index if not exists business_media_business_idx on public.business_media(business_id,sort_order,id);
create unique index if not exists business_media_staff_photo_idx on public.business_media(staff_id) where active and staff_id is not null;
create table if not exists public.business_content_audit (
  id uuid primary key default gen_random_uuid(), business_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_kind text not null check(actor_kind in ('admin','owner','application')),
  section text not null, reason text not null check(char_length(reason) between 3 and 500),
  created_at timestamptz not null default now()
);
create table if not exists public.business_media_cleanup (
  object_key text primary key check(object_key ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'),
  not_before timestamptz not null default now()
);
alter table public.business_media enable row level security;
alter table public.business_content_audit enable row level security;
alter table public.business_media_cleanup enable row level security;
revoke all on public.business_media,public.business_content_audit,public.business_media_cleanup from public,anon,authenticated;
grant select,insert,update,delete on public.business_media to service_role;
grant select,insert on public.business_content_audit to service_role;
grant select,insert,update,delete on public.business_media_cleanup to service_role;

create or replace function public.queue_deleted_business_photo()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.curated_src is not null then return null; end if;
  insert into public.business_media_cleanup(object_key) values(old.object_key)
    on conflict(object_key) do update set not_before=now();
  return null;
end $$;
drop trigger if exists queue_deleted_business_photo on public.business_media;
create trigger queue_deleted_business_photo after delete on public.business_media for each row execute function public.queue_deleted_business_photo();
revoke all on function public.queue_deleted_business_photo() from public,anon,authenticated;

create or replace function public.advance_business_content_revision()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='businesses' then
    if tg_op='INSERT' then new.content_revision:=0;
    else
      new.content_revision:=old.content_revision+1;
      -- Owners cannot suppress curated photos by changing this field directly.
      if current_setting('role',true) not in ('service_role','postgres','none','')
        and new.media_gallery_managed is distinct from old.media_gallery_managed then
        raise exception 'MEDIA_SERVER_ONLY' using errcode='42501';
      end if;
    end if;
    return new;
  end if;
  if tg_op<>'DELETE' then update public.businesses set content_revision=content_revision+1 where id=new.business_id; end if;
  if tg_op='DELETE' or (tg_op='UPDATE' and old.business_id is distinct from new.business_id) then
    update public.businesses set content_revision=content_revision+1 where id=old.business_id;
  end if;
  return null;
end $$;
drop trigger if exists advance_business_content_revision on public.businesses;
create trigger advance_business_content_revision before insert or update on public.businesses for each row execute function public.advance_business_content_revision();
do $$ declare t text; begin foreach t in array array['services','staff','working_hours','staff_services','business_media'] loop
  execute format('drop trigger if exists advance_business_content_revision on public.%I',t);
  execute format('create trigger advance_business_content_revision after insert or update or delete on public.%I for each row execute function public.advance_business_content_revision()',t);
end loop; end $$;

create or replace function public.edit_business_content(p_business uuid,p_actor uuid,p_revision bigint,p_section text,p_payload jsonb,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare b public.businesses; r jsonb; target uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_business::text,0));
  select * into b from public.businesses where id=p_business for update;
  if not found then raise exception 'BUSINESS_NOT_FOUND'; end if;
  if b.platform_status='archived' then raise exception 'RESTORE_FIRST'; end if;
  if p_revision is null or b.content_revision<>p_revision then raise exception 'CONTENT_CHANGED' using errcode='40001'; end if;
  if p_actor is null or p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then raise exception 'VALIDATION_ERROR'; end if;
  if p_section='business' then
    if p_payload->>'timezone' is distinct from b.timezone and exists(select 1 from public.appointments where business_id=b.id and status in ('booked','confirmed') and ends_at>now()) then raise exception 'TIMEZONE_BOOKINGS'; end if;
    update public.businesses set
      name=p_payload->>'name',slug=p_payload->>'slug',phone=p_payload->>'phone',contact_email=p_payload->>'contact_email',
      address=p_payload->>'address',city=p_payload->>'city',city_ekatte=p_payload->>'city_ekatte',neighborhood=p_payload->>'neighborhood',
      timezone=p_payload->>'timezone',industry=p_payload->>'industry',website_url=p_payload->>'website_url',privacy_contact_email=p_payload->>'privacy_contact_email',
      booking_terms=p_payload->>'booking_terms',default_duration_min=(p_payload->>'default_duration_min')::integer,
      booking_slot_minutes=(p_payload->>'booking_slot_minutes')::integer,booking_window_days=(p_payload->>'booking_window_days')::integer,
      minimum_notice_minutes=(p_payload->>'minimum_notice_minutes')::integer,cancellation_notice_hours=(p_payload->>'cancellation_notice_hours')::integer,
      email_notifications_enabled=(p_payload->>'email_notifications_enabled')::boolean,notification_locale=p_payload->>'notification_locale',
      review_requests_enabled=(p_payload->>'review_requests_enabled')::boolean,public_profile=p_payload->'public_profile',
      welcome_message=p_payload->>'welcome_message',bot_instructions=p_payload->>'bot_instructions'
      where id=b.id;
  elsif p_section in ('services','staff') then
    if jsonb_typeof(p_payload)<>'array' or jsonb_array_length(p_payload)>100 then raise exception 'VALIDATION_ERROR'; end if;
    for r in select value from jsonb_array_elements(p_payload) loop
      target:=nullif(r->>'id','')::uuid;
      if p_section='services' then
        if target is not null and not exists(select 1 from public.services where id=target and business_id=b.id) then raise exception 'WRONG_BUSINESS'; end if;
        if target is null then insert into public.services(business_id,name,price,currency,duration_min) values(b.id,r->>'name',(r->>'price')::numeric,'EUR',(r->>'duration_min')::integer) returning id into target; end if;
        update public.services set name=r->>'name',description=r->>'description',category=r->>'category',duration_min=(r->>'duration_min')::integer,
          price=(r->>'price')::numeric,active=(r->>'active')::boolean,sort_order=(r->>'sort_order')::integer where id=target and business_id=b.id;
      else
        if target is not null and not exists(select 1 from public.staff where id=target and business_id=b.id) then raise exception 'WRONG_BUSINESS'; end if;
        if target is null then insert into public.staff(business_id,name) values(b.id,r->>'name') returning id into target; end if;
        update public.staff set name=r->>'name',email=r->>'email',phone=r->>'phone',bio=r->>'bio',active=(r->>'active')::boolean,sort_order=(r->>'sort_order')::integer where id=target and business_id=b.id;
      end if;
    end loop;
  elsif p_section='hours' then
    target:=(p_payload->>'staffId')::uuid;
    if not exists(select 1 from public.staff where id=target and business_id=b.id) then raise exception 'WRONG_BUSINESS'; end if;
    if jsonb_typeof(p_payload->'hours')<>'array' or jsonb_array_length(p_payload->'hours')>7 then raise exception 'VALIDATION_ERROR'; end if;
    if exists(select 1 from jsonb_to_recordset(p_payload->'hours') as h(weekday smallint,open_time time,close_time time,break_start time,break_end time)
      where h.weekday is null or h.weekday not between 1 and 7 or h.open_time is null or h.close_time is null or h.close_time<=h.open_time
      or (h.break_start is null)<>(h.break_end is null) or (h.break_start is not null and (h.break_start<h.open_time or h.break_end>h.close_time or h.break_end<=h.break_start or (h.break_start=h.open_time and h.break_end=h.close_time)))) then raise exception 'VALIDATION_ERROR'; end if;
    if (select count(*)<>count(distinct h.weekday) from jsonb_to_recordset(p_payload->'hours') as h(weekday smallint)) then raise exception 'VALIDATION_ERROR'; end if;
    if exists(select 1 from public.appointments a where a.business_id=b.id and a.staff_id=target and a.status in ('booked','confirmed') and a.ends_at>now()
      and not exists(select 1 from jsonb_to_recordset(p_payload->'hours') as h(weekday smallint,open_time time,close_time time,break_start time,break_end time)
        where h.weekday=extract(isodow from a.starts_at at time zone b.timezone)
        and (a.starts_at at time zone b.timezone)::date=(a.ends_at at time zone b.timezone)::date
        and (a.starts_at at time zone b.timezone)::time>=h.open_time and (a.ends_at at time zone b.timezone)::time<=h.close_time
        and (h.break_start is null or (a.ends_at at time zone b.timezone)::time<=h.break_start or (a.starts_at at time zone b.timezone)::time>=h.break_end))) then raise exception 'SCHEDULE_CONFLICT'; end if;
    delete from public.working_hours where business_id=b.id and staff_id=target;
    insert into public.working_hours(business_id,staff_id,weekday,open_time,close_time,break_start,break_end)
      select b.id,target,h.weekday,h.open_time,h.close_time,h.break_start,h.break_end from jsonb_to_recordset(p_payload->'hours') as h(weekday smallint,open_time time,close_time time,break_start time,break_end time);
  else raise exception 'VALIDATION_ERROR'; end if;
  -- No deletes: staff/service IDs and existing appointment times remain.
  insert into public.business_content_audit(business_id,actor_id,actor_kind,section,reason) values(b.id,p_actor,'admin',p_section,btrim(p_reason));
end $$;

create or replace function public.change_business_media(p_business uuid,p_actor uuid,p_admin boolean,p_revision bigint,p_action text,p_media uuid,p_image jsonb default null,p_application boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare b public.businesses; member uuid; m public.business_media;
begin
  -- Global allocation lock makes storage/database quotas deterministic across
  -- concurrent tenants. The actual file is private until this row commits.
  perform pg_advisory_xact_lock(830301);
  select * into b from public.businesses where id=p_business for update;
  if not found then raise exception 'BUSINESS_NOT_FOUND'; end if;
  if p_actor is null or p_admin is null or (not p_admin and b.owner_id<>p_actor) then raise exception 'WRONG_BUSINESS'; end if;
  if b.platform_status='archived' then raise exception 'RESTORE_FIRST'; end if;
  if p_revision is null or b.content_revision<>p_revision then raise exception 'CONTENT_CHANGED' using errcode='40001'; end if;
  if p_application and (p_admin or b.platform_status<>'pending' or b.created_at<now()-interval '10 minutes') then raise exception 'WRONG_BUSINESS'; end if;
  if p_action='upload' then
    member:=nullif(p_image->>'staffId','')::uuid;
    if member is not null and not exists(select 1 from public.staff where id=member and business_id=b.id) then raise exception 'WRONG_BUSINESS'; end if;
    if (select count(*) from public.business_media where business_id=b.id)>=100
      or (select count(*) from public.business_media where business_id=b.id and curated_src is null and created_at>now()-interval '1 day')>=50
      or (select coalesce(sum(byte_size),0) from public.business_media where business_id=b.id and curated_src is null)+(p_image->>'bytes')::integer>33554432
      or (select coalesce(sum(byte_size),0) from public.business_media where curated_src is null)+(p_image->>'bytes')::integer>536870912
      or (member is null and (select count(*) from public.business_media where business_id=b.id and staff_id is null and active)>=12) then raise exception 'MEDIA_LIMIT'; end if;
    if member is not null then update public.business_media set active=false where business_id=b.id and staff_id=member and active; end if;
    insert into public.business_media(id,business_id,staff_id,object_key,width,height,byte_size,alt_text,sort_order)
      values(p_media,b.id,member,b.id::text||'/'||p_media::text||'.webp',(p_image->>'width')::integer,(p_image->>'height')::integer,(p_image->>'bytes')::integer,
        coalesce(p_image->>'alt',''),(select coalesce(max(sort_order),0)+1 from public.business_media where business_id=b.id));
    if member is null then update public.businesses set media_gallery_managed=true where id=b.id; end if;
  else
    select * into m from public.business_media where id=p_media and business_id=b.id for update;
    if not found then raise exception 'MEDIA_NOT_FOUND'; end if;
    if p_action='hide' then update public.business_media set active=false where id=m.id;
    elsif p_action='restore' then
      if m.staff_id is null and not m.active and (select count(*) from public.business_media where business_id=b.id and staff_id is null and active)>=12 then raise exception 'MEDIA_LIMIT'; end if;
      if m.staff_id is not null then update public.business_media set active=false where business_id=b.id and staff_id=m.staff_id and active; end if;
      update public.business_media set active=true where id=m.id;
    elsif p_action='cover' and m.staff_id is null and m.active then
      update public.business_media set sort_order=(select coalesce(min(sort_order),0)-1 from public.business_media where business_id=b.id) where id=m.id;
    else raise exception 'VALIDATION_ERROR'; end if;
  end if;
  insert into public.business_content_audit(business_id,actor_id,actor_kind,section,reason)
    values(b.id,p_actor,case when p_admin then 'admin' when p_application then 'application' else 'owner' end,'photos',p_action);
end $$;

revoke all on function public.advance_business_content_revision(),public.edit_business_content(uuid,uuid,bigint,text,jsonb,text),
  public.change_business_media(uuid,uuid,boolean,bigint,text,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.edit_business_content(uuid,uuid,bigint,text,jsonb,text),public.change_business_media(uuid,uuid,boolean,bigint,text,uuid,jsonb,boolean) to service_role;

-- Compatible application signature/return value. The server can now assign
-- team UUIDs before submission so optional portraits map by identity, not name.
create or replace function public.submit_business_application(p_owner uuid,p_requires_activation boolean,p_application jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare b jsonb:=p_application->'business'; s jsonb; person jsonb; h jsonb; bid uuid; sid uuid; lid uuid; idx integer:=0;
begin
  if p_owner is null or not exists(select 1 from auth.users where id=p_owner and lower(email)=p_application->>'email')
    or jsonb_array_length(p_application->'services') not between 1 and 40
    or jsonb_array_length(p_application->'staff') not between 1 and 20
    or jsonb_array_length(p_application->'hours') not between 1 and 7 then raise exception 'INVALID_APPLICATION' using errcode='22023'; end if;
  insert into public.businesses(owner_id,name,slug,phone,contact_email,address,timezone,industry,city_ekatte,city,neighborhood,default_duration_min,booking_slot_minutes,languages,notification_locale,platform_status)
  values(p_owner,b->>'name',b->>'slug',b->>'phone',b->>'contact_email',b->>'address',b->>'timezone',b->>'industry',b->>'city_ekatte',b->>'city',nullif(b->>'neighborhood',''),(b->>'default_duration_min')::integer,(b->>'booking_slot_minutes')::integer,array['bg','en'],p_application->>'locale','pending') returning id into bid;
  for s in select value from jsonb_array_elements(p_application->'services') loop
    insert into public.services(business_id,name,price,currency,duration_min,sort_order) values(bid,s->>'name',(s->>'price')::numeric,'EUR',(s->>'duration_min')::integer,idx); idx:=idx+1;
  end loop;
  idx:=0;
  for person in select value from jsonb_array_elements(p_application->'staff') loop
    insert into public.staff(id,business_id,name,sort_order) values(coalesce((person->>'id')::uuid,gen_random_uuid()),bid,person->>'name',idx) returning id into sid; idx:=idx+1;
    for h in select value from jsonb_array_elements(p_application->'hours') loop
      insert into public.working_hours(business_id,staff_id,weekday,open_time,close_time,break_start,break_end) values(bid,sid,(h->>'weekday')::smallint,(h->>'open_time')::time,(h->>'close_time')::time,(h->>'break_start')::time,(h->>'break_end')::time);
    end loop;
  end loop;
  insert into public.partner_leads(business_name,contact_name,phone,email,category,city,locale,fingerprint,business_id,requires_owner_activation,setup_summary)
    values(b->>'name',p_application->'staff'->0->>'name',b->>'phone',p_application->>'email',b->>'industry',b->>'city',p_application->>'locale','application:'||bid::text,bid,p_requires_activation,jsonb_build_object('services',p_application->'services','staff',p_application->'staff','hours',p_application->'hours','address',b->>'address','neighborhood',b->>'neighborhood')) returning id into lid;
  return lid;
end $$;
revoke all on function public.submit_business_application(uuid,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.submit_business_application(uuid,boolean,jsonb) to service_role;

-- Adopt the two existing curated photos without moving/copying their bytes or
-- replacing the business's gallery. Stable IDs allow cover/hide/restore, while
-- the flag makes a repeat migration leave intentional hidden states untouched.
insert into public.business_media(id,business_id,object_key,curated_src,width,height,byte_size,sort_order)
  select p.id,b.id,b.id::text||'/'||p.id::text||'.webp',p.src,1200,1600,p.bytes,p.ordinal
  from public.businesses b cross join (values
    ('450c5c2f-db41-476b-a21e-98cf5ee29195'::uuid,'/businesses/vesi-studio/interior-20261026.webp',174754,0),
    ('450c5c2f-db41-476b-a21e-98cf5ee29196'::uuid,'/businesses/vesi-studio/entrance-20261026.webp',221338,1)
  ) as p(id,src,bytes,ordinal)
  where b.id='450c5c2f-db41-476b-a21e-98cf5ee29194'::uuid and not b.media_gallery_managed
  on conflict(id) do nothing;
update public.businesses set media_gallery_managed=true
  where id='450c5c2f-db41-476b-a21e-98cf5ee29194'::uuid and not media_gallery_managed;

-- Private bucket: no public URL, no browser upload policy. Image delivery goes
-- through a route which rechecks publication or verified owner/admin access.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('business-media','business-media',false,1048576,array['image/webp']) on conflict(id) do nothing;
do $$ begin
  if exists(select 1 from storage.buckets where id='business-media' and public) then raise exception 'BUSINESS_MEDIA_BUCKET_MUST_BE_PRIVATE'; end if;
end $$;
drop policy if exists business_media_server_only on storage.objects;
create policy business_media_server_only on storage.objects as restrictive for all to anon,authenticated
  using(bucket_id<>'business-media') with check(bucket_id<>'business-media');
notify pgrst,'reload schema';
commit;
