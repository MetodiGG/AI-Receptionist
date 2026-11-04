-- OWNER APPROVED 2026-11-04. Target ONLY ilpdtvbymxqgimrboyvh.
-- Console-only atomic wrapper around the three reviewed migrations.
-- No migration history table exists in this project's preflight. Do not replay.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
lock table public.businesses,public.services,public.staff,public.working_hours,public.appointments,public.customers in share row exclusive mode;
do $$begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='businesses' and column_name='booking_mode') then raise exception 'ALREADY_MIGRATED';end if;
 if coalesce((select md5(prosrc) from pg_proc where oid=to_regprocedure('public.platform_business_action(uuid,uuid,text,integer,text,text)')),'')<>'ce04d90c94346d075a1bde5f364392ac' or coalesce((select md5(prosrc) from pg_proc where oid=to_regprocedure('public.submit_business_application(uuid,boolean,jsonb)')),'')<>'95eac14c73f71668e946c0d43dec6784' then raise exception 'LIVE_FUNCTION_CHANGED';end if;
end$$;
create temporary table master_release_before on commit drop as select jsonb_build_object('businesses',(select md5(coalesce(string_agg((to_jsonb(b)-'booking_mode'-'external_booking_url'-'external_booking_consent_at'-'opening_hours')::text,'' order by id),'')) from public.businesses b),'appointments',(select md5(coalesce(string_agg(to_jsonb(a)::text,'' order by id),'')) from public.appointments a),'customers',(select md5(coalesce(string_agg(to_jsonb(c)::text,'' order by id),'')) from public.customers c),'services',(select md5(coalesce(string_agg(to_jsonb(s)::text,'' order by id),'')) from public.services s),'staff',(select md5(coalesce(string_agg(to_jsonb(s)::text,'' order by id),'')) from public.staff s),'hours',(select md5(coalesce(string_agg(to_jsonb(h)::text,'' order by id),'')) from public.working_hours h)) as snapshot;

-- BEGIN reviewed migration 20261104170000_external_booking_modes.sql
-- REVIEW ONLY: not applied to any live database. Additive, no publication/backfill.

alter table public.businesses
 add column booking_mode text not null default 'gorez' check(booking_mode in ('gorez','external')),
 add column external_booking_url text,
 add column external_booking_consent_at timestamptz,
 add column opening_hours jsonb not null default '[]'::jsonb;

create function public.valid_booking_url(v text) returns boolean language plpgsql immutable set search_path='' as $$
declare host text;
begin
 if v is null or length(v)>2048 or v !~ '^https://[a-zA-Z0-9.-]+(/|\?|$)' or v ~ '[[:space:]\\#@]' then return false; end if;
 host:=lower(substring(v from '^https://([^/?]+)'));
 if host !~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$' or host ~ '(^|\.)(localhost|local|internal|test|invalid|example|onion|home|lan|arpa)$' then return false; end if;
 return v !~ '[?&][^=&]*%' and v !~* '[?&](url|redirect|redirect_uri|redirect_url|return_url|next|continue|token|access_token|password)=';
end $$;
create function public.valid_opening_hours(v jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare d jsonb;p jsonb;last_close text;seen integer[]:='{}';w integer;
begin
 if v is null or jsonb_typeof(v) is distinct from 'array' or jsonb_array_length(v)<>7 then return false;end if;
 for d in select value from jsonb_array_elements(v) loop
  if jsonb_typeof(d) is distinct from 'object' or jsonb_typeof(d->'weekday') is distinct from 'number' or coalesce(d->>'weekday','') !~ '^[1-7]$' or jsonb_typeof(d->'periods') is distinct from 'array' then return false;end if;
  w:=(d->>'weekday')::integer;
  if w not between 1 and 7 or w=any(seen) or jsonb_array_length(d->'periods')>2 then return false;end if;
  seen:=array_append(seen,w);last_close:=null;
  for p in select value from jsonb_array_elements(d->'periods') loop
   if coalesce(p->>'open','')!~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(p->>'close','')!~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or p->>'open'>=p->>'close' or (last_close is not null and p->>'open'<last_close) then return false;end if;
   last_close:=p->>'close';
  end loop;
 end loop;
 return true;
exception when others then return false;
end $$;
alter table public.businesses add constraint external_booking_destination_check check(booking_mode<>'external' or (public.valid_booking_url(external_booking_url) and external_booking_consent_at is not null and public.valid_opening_hours(opening_hours)));
alter table public.businesses add constraint public_opening_hours_check check(opening_hours='[]'::jsonb or public.valid_opening_hours(opening_hours));

-- Optional unknown service values ONLY for external businesses. Preserve every
-- existing value and enforce internal-calendar requirements on all SQL paths.
alter table public.services alter column price drop not null,alter column duration_min drop not null;
create function public.internal_booking_ready(bid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.services where business_id=bid and active)
 and not exists(select 1 from public.services where business_id=bid and active and (price is null or duration_min is null or duration_min not between 5 and 1440))
 and exists(select 1 from public.staff s join public.working_hours h on h.staff_id=s.id and h.business_id=s.business_id where s.business_id=bid and s.active)
 and not exists(select 1 from public.staff s where s.business_id=bid and s.active and not exists(select 1 from public.working_hours h where h.staff_id=s.id and h.business_id=bid));
$$;
create function public.guard_service_booking_values() returns trigger language plpgsql set search_path='' as $$
declare mode text;
begin
 select booking_mode into mode from public.businesses where id=new.business_id for share;
 if mode='gorez' and (new.price is null or new.duration_min is null or new.duration_min not between 5 and 1440) then raise exception 'INTERNAL_SERVICE_VALUES_REQUIRED' using errcode='23514';end if;
 return new;
end $$;
create trigger guard_service_booking_values before insert or update on public.services for each row execute function public.guard_service_booking_values();
create function public.protect_booking_mode_fields() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user not in ('postgres','supabase_admin','service_role') and ((tg_op='INSERT' and (new.booking_mode<>'gorez' or new.external_booking_url is not null or new.external_booking_consent_at is not null or new.opening_hours<>'[]'::jsonb)) or (tg_op='UPDATE' and (new.booking_mode is distinct from old.booking_mode or new.external_booking_url is distinct from old.external_booking_url or new.external_booking_consent_at is distinct from old.external_booking_consent_at or new.opening_hours is distinct from old.opening_hours))) then raise exception 'BOOKING_SETTINGS_SERVER_ONLY' using errcode='42501';end if;
 if tg_op='UPDATE' and old.booking_mode='external' and new.booking_mode='gorez' and not public.internal_booking_ready(new.id) then raise exception 'INTERNAL_SETUP_REQUIRED' using errcode='23514';end if;
 return new;
end $$;
create trigger protect_booking_mode_fields before insert or update on public.businesses for each row execute function public.protect_booking_mode_fields();
create function public.save_booking_settings(p_business uuid,p_actor uuid,p_admin boolean,p_revision bigint,p_mode text,p_url text,p_consent boolean,p_hours jsonb,p_acknowledge boolean)
returns void language plpgsql security definer set search_path='' as $$
declare b public.businesses;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_business::text,0));
 select * into b from public.businesses where id=p_business for update;
 if not found then raise exception 'BUSINESS_NOT_FOUND';end if;
 if p_actor is null or (not coalesce(p_admin,false) and b.owner_id<>p_actor) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if b.platform_status='archived' then raise exception 'RESTORE_FIRST';end if;
 if p_revision is null or b.content_revision<>p_revision then raise exception 'CONTENT_CHANGED' using errcode='40001';end if;
 if p_mode is null or p_mode not in ('gorez','external') or not public.valid_opening_hours(p_hours) or (p_mode='external' and (p_consent is distinct from true or not public.valid_booking_url(p_url))) then raise exception 'INVALID_BOOKING_SETTINGS' using errcode='22023';end if;
 if b.booking_mode<>p_mode and exists(select 1 from public.appointments where business_id=b.id and status in ('booked','confirmed') and ends_at>now()) and p_acknowledge is distinct from true then raise exception 'ACKNOWLEDGE_UPCOMING_BOOKINGS';end if;
 update public.businesses set booking_mode=p_mode,external_booking_url=case when p_mode='external' then p_url end,external_booking_consent_at=case when p_mode='external' then now() end,opening_hours=p_hours where id=b.id;
 insert into public.business_content_audit(business_id,actor_id,actor_kind,section,reason) values(b.id,p_actor,case when p_admin then 'admin' else 'owner' end,'booking','Explicit booking mode and informational opening hours save; existing calendar preserved');
end $$;
revoke all on function public.save_booking_settings(uuid,uuid,boolean,bigint,text,text,boolean,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_booking_settings(uuid,uuid,boolean,bigint,text,text,boolean,jsonb,boolean) to service_role;

-- Race guard takes a share lock against concurrent mode switches. Existing
-- appointments remain manageable; no records or schedules are purged.
create function public.guard_external_new_booking() returns trigger language plpgsql security definer set search_path='' as $$
declare mode text;
begin
 select booking_mode into mode from public.businesses where id=new.business_id for share;
 if mode='external' then raise exception 'EXTERNAL_BOOKING' using errcode='23514';end if;
 return new;
end $$;
create trigger a_guard_external_new_booking before insert on public.appointments for each row execute function public.guard_external_new_booking();

-- Keep the original moderation transaction for every existing/internal path.
alter function public.platform_business_action(uuid,uuid,text,integer,text,text) rename to platform_business_action_internal_v1;
revoke all on function public.platform_business_action_internal_v1(uuid,uuid,text,integer,text,text) from public,anon,authenticated,service_role;
create function public.platform_business_action(p_business_id uuid,p_actor_id uuid,p_action text,p_revision integer,p_confirmation text,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.businesses;
begin
 select * into b from public.businesses where id=p_business_id for update;
 if not found then raise exception 'BUSINESS_NOT_FOUND';end if;
 if p_action<>'publish' or b.booking_mode='gorez' then
  return public.platform_business_action_internal_v1(p_business_id,p_actor_id,p_action,p_revision,p_confirmation,p_reason);
 end if;
 if p_actor_id is null or p_revision is null or b.platform_revision<>p_revision then raise exception 'BUSINESS_CHANGED';end if;
 if p_confirmation is distinct from b.slug then raise exception 'CONFIRMATION_MISMATCH';end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then raise exception 'VALIDATION_ERROR';end if;
 if b.platform_status='archived' then raise exception 'RESTORE_FIRST';end if;
 if not public.valid_booking_url(b.external_booking_url) or b.external_booking_consent_at is null or not public.valid_opening_hours(b.opening_hours) or not exists(select 1 from public.services where business_id=b.id and active) then raise exception 'SETUP_REQUIRED';end if;
 insert into public.platform_admin_audit(actor_id,business_id,business_name,business_slug,action,reason,previous_status,next_status) values(p_actor_id,b.id,b.name,b.slug,'publish',p_reason,b.platform_status,'enabled');
 update public.businesses set platform_status='enabled',active=true,platform_revision=platform_revision+1 where id=b.id;
 return jsonb_build_object('id',b.id,'platform_status','enabled');
end $$;
revoke all on function public.platform_business_action(uuid,uuid,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.platform_business_action(uuid,uuid,text,integer,text,text) to service_role;
revoke all on function public.internal_booking_ready(uuid),public.guard_service_booking_values(),public.protect_booking_mode_fields(),public.guard_external_new_booking() from public,anon,authenticated;

-- END 20261104170000_external_booking_modes.sql

-- BEGIN reviewed migration 20261104171000_external_business_applications.sql
-- REVIEW ONLY. Requires 20261104170000; no existing business is modified.

alter function public.submit_business_application(uuid,boolean,jsonb) rename to submit_business_application_internal_v1;
revoke all on function public.submit_business_application_internal_v1(uuid,boolean,jsonb) from public,anon,authenticated,service_role;
create function public.submit_business_application(p_owner uuid,p_requires_activation boolean,p_application jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare b jsonb:=p_application->'business';s jsonb;person jsonb;bid uuid;lid uuid;idx integer:=0;mode text:=coalesce(b->>'booking_mode','gorez');
begin
 if jsonb_typeof(p_application) is distinct from 'object' or jsonb_typeof(b) is distinct from 'object' then raise exception 'INVALID_APPLICATION' using errcode='22023';end if;
 if mode='gorez' then
  lid:=public.submit_business_application_internal_v1(p_owner,p_requires_activation,p_application);
  select business_id into bid from public.partner_leads where id=lid;
 else
  if jsonb_typeof(p_application->'services') is distinct from 'array' or jsonb_typeof(p_application->'staff') is distinct from 'array' or p_application->'hours' is distinct from '[]'::jsonb then raise exception 'INVALID_APPLICATION' using errcode='22023';end if;
  if mode<>'external' or p_owner is null or not exists(select 1 from auth.users where id=p_owner and lower(email)=p_application->>'email') or jsonb_array_length(p_application->'services') not between 1 and 40 or jsonb_array_length(p_application->'staff') not between 0 and 20 or b->>'external_booking_consent' is distinct from 'true' or not public.valid_booking_url(b->>'external_booking_url') or not public.valid_opening_hours(b->'opening_hours') then raise exception 'INVALID_APPLICATION' using errcode='22023';end if;
  insert into public.businesses(owner_id,name,slug,phone,contact_email,address,timezone,industry,city_ekatte,city,neighborhood,default_duration_min,booking_slot_minutes,languages,notification_locale,platform_status,booking_mode,external_booking_url,external_booking_consent_at,opening_hours)
  values(p_owner,b->>'name',b->>'slug',b->>'phone',b->>'contact_email',b->>'address',b->>'timezone',b->>'industry',b->>'city_ekatte',b->>'city',nullif(b->>'neighborhood',''),coalesce((b->>'default_duration_min')::integer,45),coalesce((b->>'booking_slot_minutes')::integer,15),array['bg','en'],p_application->>'locale','pending','external',b->>'external_booking_url',now(),b->'opening_hours') returning id into bid;
  for s in select value from jsonb_array_elements(p_application->'services') loop
   if jsonb_typeof(s) is distinct from 'object' or char_length(coalesce(btrim(s->>'name'),'')) not between 2 and 120 then raise exception 'INVALID_APPLICATION';end if;
   insert into public.services(business_id,name,price,currency,duration_min,sort_order) values(bid,s->>'name',(s->>'price')::numeric,'EUR',(s->>'duration_min')::integer,idx);idx:=idx+1;
  end loop;
  idx:=0;
  for person in select value from jsonb_array_elements(p_application->'staff') loop
   if jsonb_typeof(person) is distinct from 'object' or char_length(coalesce(btrim(person->>'name'),'')) not between 2 and 100 then raise exception 'INVALID_APPLICATION';end if;
   insert into public.staff(id,business_id,name,bio,sort_order) values(coalesce((person->>'id')::uuid,gen_random_uuid()),bid,person->>'name',person->>'bio',idx);idx:=idx+1;
  end loop;
  insert into public.partner_leads(business_name,contact_name,phone,email,category,city,locale,fingerprint,business_id,requires_owner_activation,setup_summary)
  values(b->>'name',coalesce(p_application->'staff'->0->>'name',left(b->>'name',100)),b->>'phone',p_application->>'email',b->>'industry',b->>'city',p_application->>'locale','application:'||bid::text,bid,p_requires_activation,jsonb_build_object('services',p_application->'services','staff',p_application->'staff','booking_mode','external','opening_hours',b->'opening_hours')) returning id into lid;
 end if;
 update public.businesses set website_url=nullif(b->>'website_url',''),public_profile=coalesce(b->'public_profile','{}'::jsonb),booking_terms=nullif(b->>'booking_terms',''),opening_hours=coalesce(b->'opening_hours',opening_hours) where id=bid;
 return lid;
end $$;
revoke all on function public.submit_business_application(uuid,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.submit_business_application(uuid,boolean,jsonb) to service_role;

-- END 20261104171000_external_business_applications.sql

-- BEGIN reviewed migration 20261104172000_verified_booking_referrals.sql
-- REVIEW ONLY. First-party events, not third-party analytics or conversions.

create table public.external_booking_links(
 id uuid primary key default gen_random_uuid(),place_id text not null unique check(char_length(place_id) between 10 and 256 and place_id ~ '^[A-Za-z0-9_-]+$'),
 label text not null check(char_length(label) between 2 and 150),booking_url text not null check(public.valid_booking_url(booking_url)),
 official_url text not null check(public.valid_booking_url(official_url)),evidence text not null check(char_length(evidence) between 10 and 1500),
 verification_status text not null default 'draft' check(verification_status in ('draft','approved','disabled')),
 verified_at timestamptz,verified_by uuid references auth.users(id) on delete set null,last_checked_at timestamptz,disabled_at timestamptz,
 revision bigint not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 -- Removing a reviewer identity must not block account erasure. A missing
 -- reviewer automatically makes this record unusable in approvedExternalLink.
 check(verification_status<>'approved' or verified_at is not null)
);
create table public.external_booking_link_audit(id uuid primary key default gen_random_uuid(),link_id uuid not null references public.external_booking_links(id),actor_id uuid references auth.users(id) on delete set null,action text not null,created_at timestamptz not null default now());
create table public.external_booking_reports(id uuid primary key default gen_random_uuid(),link_id uuid not null references public.external_booking_links(id),reason text not null check(char_length(reason) between 5 and 500),created_at timestamptz not null default now(),resolved_at timestamptz,resolved_by uuid references auth.users(id) on delete set null);
create table public.booking_referral_events(id uuid primary key default gen_random_uuid(),business_id uuid references public.businesses(id) on delete cascade,external_link_id uuid references public.external_booking_links(id) on delete cascade,event_type text not null check(event_type in ('profile_view','outbound_click')),created_at timestamptz not null default now(),check((business_id is null)<>(external_link_id is null)));
create index booking_referral_business_time_idx on public.booking_referral_events(business_id,created_at);
create index booking_referral_link_time_idx on public.booking_referral_events(external_link_id,created_at);
alter table public.external_booking_links enable row level security;
alter table public.external_booking_link_audit enable row level security;
alter table public.external_booking_reports enable row level security;
alter table public.booking_referral_events enable row level security;
revoke all on public.external_booking_links,public.external_booking_link_audit,public.external_booking_reports,public.booking_referral_events from public,anon,authenticated;
grant select,insert,update on public.external_booking_links,public.external_booking_link_audit,public.external_booking_reports to service_role;
grant select,insert,delete on public.booking_referral_events to service_role;
grant select on public.booking_referral_events to authenticated;
create policy owner_referral_read on public.booking_referral_events for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));

create function public.review_external_booking_link(p_actor uuid,p_id uuid,p_revision bigint,p_action text,p_data jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.external_booking_links;target uuid;
begin
 if p_actor is null or p_action is null or p_action not in ('save','approve','disable','resolve') then raise exception 'VALIDATION_ERROR';end if;
 if p_id is not null then select * into r from public.external_booking_links where id=p_id for update;if not found then raise exception 'LINK_NOT_FOUND';end if;if p_revision is null or p_revision<>r.revision then raise exception 'LINK_CHANGED' using errcode='40001';end if;end if;
 if p_action='save' then
  if not public.valid_booking_url(p_data->>'booking_url') or not public.valid_booking_url(p_data->>'official_url') or coalesce(char_length(p_data->>'evidence'),0)<10 then raise exception 'VALIDATION_ERROR';end if;
  if p_id is null then
   insert into public.external_booking_links(place_id,label,booking_url,official_url,evidence) values(p_data->>'place_id',p_data->>'label',p_data->>'booking_url',p_data->>'official_url',p_data->>'evidence') returning id into target;
  else
   if p_data->>'place_id' is distinct from r.place_id then raise exception 'PLACE_ID_IMMUTABLE';end if;
   update public.external_booking_links set label=p_data->>'label',booking_url=p_data->>'booking_url',official_url=p_data->>'official_url',evidence=p_data->>'evidence',verification_status='draft',verified_at=null,verified_by=null,last_checked_at=null,disabled_at=null,revision=revision+1,updated_at=now() where id=p_id;target:=p_id;
  end if;
 else
  if p_id is null or p_data->>'confirmation' is distinct from r.place_id then raise exception 'CONFIRMATION_MISMATCH';end if;
  if p_action='approve' then
   if p_data->>'verifiedBusinessAndBookingFlow' is distinct from 'true' then raise exception 'VERIFICATION_REQUIRED';end if;
   if exists(select 1 from public.business_place_links where place_id=r.place_id) then raise exception 'PARTNER_PLACE_LINK';end if;
   update public.external_booking_links set verification_status='approved',verified_by=p_actor,verified_at=now(),last_checked_at=now(),disabled_at=null,revision=revision+1,updated_at=now() where id=p_id;
  elsif p_action='disable' then update public.external_booking_links set verification_status='disabled',disabled_at=now(),revision=revision+1,updated_at=now() where id=p_id;
  elsif p_action='resolve' then update public.external_booking_reports set resolved_at=now(),resolved_by=p_actor where link_id=p_id and resolved_at is null;update public.external_booking_links set revision=revision+1,updated_at=now() where id=p_id;
  end if;target:=p_id;
 end if;
 insert into public.external_booking_link_audit(link_id,actor_id,action) values(target,p_actor,p_action);
 return target;
end $$;
revoke all on function public.review_external_booking_link(uuid,uuid,bigint,text,jsonb) from public,anon,authenticated;
grant execute on function public.review_external_booking_link(uuid,uuid,bigint,text,jsonb) to service_role;
create function public.business_referral_summary(p_business uuid,p_actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.businesses where id=p_business and owner_id=p_actor) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 return jsonb_build_object('views',(select count(*) from public.booking_referral_events where business_id=p_business and event_type='profile_view' and created_at>=now()-interval '30 days'),'clicks',(select count(*) from public.booking_referral_events where business_id=p_business and event_type='outbound_click' and created_at>=now()-interval '30 days'),'bookings',(select count(*) from public.appointments where business_id=p_business and source in ('web','bot') and status in ('booked','confirmed','done') and created_at>=now()-interval '30 days'));
end $$;
create function public.prune_booking_referrals() returns void language plpgsql security definer set search_path='' as $$begin delete from public.booking_referral_events where created_at<now()-interval '90 days';delete from public.external_booking_reports where resolved_at<now()-interval '90 days';end$$;
revoke all on function public.business_referral_summary(uuid,uuid),public.prune_booking_referrals() from public,anon,authenticated;
grant execute on function public.business_referral_summary(uuid,uuid),public.prune_booking_referrals() to service_role;

-- END 20261104172000_verified_booking_referrals.sql

create temporary table master_release_after on commit drop as select jsonb_build_object('businesses',(select md5(coalesce(string_agg((to_jsonb(b)-'booking_mode'-'external_booking_url'-'external_booking_consent_at'-'opening_hours')::text,'' order by id),'')) from public.businesses b),'appointments',(select md5(coalesce(string_agg(to_jsonb(a)::text,'' order by id),'')) from public.appointments a),'customers',(select md5(coalesce(string_agg(to_jsonb(c)::text,'' order by id),'')) from public.customers c),'services',(select md5(coalesce(string_agg(to_jsonb(s)::text,'' order by id),'')) from public.services s),'staff',(select md5(coalesce(string_agg(to_jsonb(s)::text,'' order by id),'')) from public.staff s),'hours',(select md5(coalesce(string_agg(to_jsonb(h)::text,'' order by id),'')) from public.working_hours h)) as snapshot;
do $$begin
 if (select snapshot from master_release_before) is distinct from (select snapshot from master_release_after) then raise exception 'EXISTING_DATA_CHANGED_ROLLBACK';end if;
 if exists(select 1 from public.businesses where booking_mode<>'gorez') then raise exception 'UNEXPECTED_MODE_ROLLBACK';end if;
 if (select md5(prosrc) from pg_proc where oid=to_regprocedure('public.platform_business_action_internal_v1(uuid,uuid,text,integer,text,text)'))<>'ce04d90c94346d075a1bde5f364392ac' or (select md5(prosrc) from pg_proc where oid=to_regprocedure('public.submit_business_application_internal_v1(uuid,boolean,jsonb)'))<>'95eac14c73f71668e946c0d43dec6784' then raise exception 'ORIGINAL_HELPER_CHANGED_ROLLBACK';end if;
end$$;
notify pgrst,'reload schema';
select 'all_three_applied' as status, (select snapshot from master_release_before)=(select snapshot from master_release_after) as existing_data_unchanged, (select count(*) from public.businesses) as businesses, (select count(*) from public.businesses where booking_mode='gorez') as internal_mode_businesses, (select count(*) from public.appointments) as appointments, (select count(*) from public.customers) as customers, not has_function_privilege('authenticated','public.save_booking_settings(uuid,uuid,boolean,bigint,text,text,boolean,jsonb,boolean)','execute') as client_mode_writes_blocked,not has_function_privilege('anon','public.review_external_booking_link(uuid,uuid,bigint,text,jsonb)','execute') as anonymous_link_writes_blocked;
commit;
