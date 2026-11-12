-- LOCAL REVIEW ONLY. Requires external modes/applications and service pricing.
-- Additive mode; no existing business, appointment, schedule or price is changed.
begin;
create function public.valid_booking_phone(v text) returns boolean language sql immutable set search_path='' as $$
 select coalesce(char_length(v)<=32 and v~'^[+()0-9 .-]+$' and regexp_replace(v,'[() .-]','','g')~'^\+?[0-9]{7,15}$',false)
$$;
revoke all on function public.valid_booking_phone(text) from public,anon;
grant execute on function public.valid_booking_phone(text) to authenticated,service_role;
alter table public.businesses drop constraint businesses_booking_mode_check;
alter table public.businesses add constraint businesses_booking_mode_check check(booking_mode in ('gorez','external','phone'));
alter table public.businesses add constraint phone_booking_destination_check check(booking_mode<>'phone' or public.valid_booking_phone(phone));

create or replace function public.protect_booking_mode_fields() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user not in ('postgres','supabase_admin','service_role') and ((tg_op='INSERT' and (new.booking_mode<>'gorez' or new.external_booking_url is not null or new.external_booking_consent_at is not null or new.opening_hours<>'[]'::jsonb)) or (tg_op='UPDATE' and (new.booking_mode is distinct from old.booking_mode or new.external_booking_url is distinct from old.external_booking_url or new.external_booking_consent_at is distinct from old.external_booking_consent_at or new.opening_hours is distinct from old.opening_hours))) then raise exception 'BOOKING_SETTINGS_SERVER_ONLY' using errcode='42501';end if;
 if tg_op='UPDATE' and old.booking_mode in ('external','phone') and new.booking_mode='gorez' and not public.internal_booking_ready(new.id) then raise exception 'INTERNAL_SETUP_REQUIRED' using errcode='23514';end if;
 return new;
end $$;

create or replace function public.save_booking_settings(p_business uuid,p_actor uuid,p_admin boolean,p_revision bigint,p_mode text,p_url text,p_consent boolean,p_hours jsonb,p_acknowledge boolean)
returns void language plpgsql security definer set search_path='' as $$
declare b public.businesses;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_business::text,0));
 select * into b from public.businesses where id=p_business for update;
 if not found then raise exception 'BUSINESS_NOT_FOUND';end if;
 if p_actor is null or (not coalesce(p_admin,false) and b.owner_id<>p_actor) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if b.platform_status='archived' then raise exception 'RESTORE_FIRST';end if;
 if p_revision is null or b.content_revision<>p_revision then raise exception 'CONTENT_CHANGED' using errcode='40001';end if;
 if p_mode is null or p_mode not in ('gorez','external','phone') or not public.valid_opening_hours(p_hours) or (p_mode='external' and (p_consent is distinct from true or not public.valid_booking_url(p_url))) then raise exception 'INVALID_BOOKING_SETTINGS' using errcode='22023';end if;
 if p_mode='phone' and not public.valid_booking_phone(b.phone) then raise exception 'BOOKING_PHONE_REQUIRED' using errcode='22023';end if;
 if b.booking_mode<>p_mode and exists(select 1 from public.appointments where business_id=b.id and status in ('booked','confirmed') and ends_at>now()) and p_acknowledge is distinct from true then raise exception 'ACKNOWLEDGE_UPCOMING_BOOKINGS';end if;
 update public.businesses set booking_mode=p_mode,external_booking_url=case when p_mode='external' then p_url end,external_booking_consent_at=case when p_mode='external' then now() end,opening_hours=p_hours where id=b.id;
 insert into public.business_content_audit(business_id,actor_id,actor_kind,section,reason) values(b.id,p_actor,case when p_admin then 'admin' else 'owner' end,'booking','Explicit booking mode and informational opening hours save; existing calendar preserved');
end $$;

-- Share lock serializes inserts against mode changes. Existing visits remain
-- manageable; this deliberately guards INSERT only, not their later updates.
create or replace function public.guard_external_new_booking() returns trigger language plpgsql security definer set search_path='' as $$
declare mode text;
begin
 select booking_mode into mode from public.businesses where id=new.business_id for share;
 if mode='external' then raise exception 'EXTERNAL_BOOKING' using errcode='23514';end if;
 if mode='phone' then raise exception 'PHONE_BOOKING' using errcode='23514';end if;
 return new;
end $$;

-- Delegate every established native/external moderation path unchanged.
alter function public.platform_business_action(uuid,uuid,text,integer,text,text) rename to platform_business_action_before_phone;
revoke all on function public.platform_business_action_before_phone(uuid,uuid,text,integer,text,text) from public,anon,authenticated,service_role;
create function public.platform_business_action(p_business_id uuid,p_actor_id uuid,p_action text,p_revision integer,p_confirmation text,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.businesses;
begin
 select * into b from public.businesses where id=p_business_id for update;
 if not found then raise exception 'BUSINESS_NOT_FOUND';end if;
 if p_action is distinct from 'publish' or b.booking_mode<>'phone' then return public.platform_business_action_before_phone(p_business_id,p_actor_id,p_action,p_revision,p_confirmation,p_reason);end if;
 if p_actor_id is null or p_revision is null or b.platform_revision<>p_revision then raise exception 'BUSINESS_CHANGED';end if;
 if p_confirmation is distinct from b.slug then raise exception 'CONFIRMATION_MISMATCH';end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then raise exception 'VALIDATION_ERROR';end if;
 if b.platform_status='archived' then raise exception 'RESTORE_FIRST';end if;
 if not public.valid_booking_phone(b.phone) or not exists(select 1 from public.services where business_id=b.id and active) then raise exception 'SETUP_REQUIRED';end if;
 insert into public.platform_admin_audit(actor_id,business_id,business_name,business_slug,action,reason,previous_status,next_status) values(p_actor_id,b.id,b.name,b.slug,'publish',p_reason,b.platform_status,'enabled');
 update public.businesses set platform_status='enabled',active=true,platform_revision=platform_revision+1 where id=b.id;
 return jsonb_build_object('id',b.id,'platform_status','enabled');
end $$;
revoke all on function public.platform_business_action(uuid,uuid,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.platform_business_action(uuid,uuid,text,integer,text,text) to service_role;

alter function public.submit_business_application(uuid,boolean,jsonb) rename to submit_business_application_before_phone;
revoke all on function public.submit_business_application_before_phone(uuid,boolean,jsonb) from public,anon,authenticated,service_role;
create function public.submit_business_application(p_owner uuid,p_requires_activation boolean,p_application jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare b jsonb:=p_application->'business';s jsonb;person jsonb;bid uuid;lid uuid;idx integer:=0;
begin
 if jsonb_typeof(p_application) is distinct from 'object' or jsonb_typeof(b) is distinct from 'object' then raise exception 'INVALID_APPLICATION' using errcode='22023';end if;
 if coalesce(b->>'booking_mode','gorez')<>'phone' then return public.submit_business_application_before_phone(p_owner,p_requires_activation,p_application);end if;
 if p_owner is null or not exists(select 1 from auth.users where id=p_owner and lower(email)=p_application->>'email') or not public.valid_booking_phone(b->>'phone')
  or jsonb_typeof(p_application->'services') is distinct from 'array' or jsonb_typeof(p_application->'staff') is distinct from 'array' or p_application->'hours' is distinct from '[]'::jsonb then raise exception 'INVALID_APPLICATION' using errcode='22023';end if;
 if jsonb_array_length(p_application->'services') not between 1 and 40 or jsonb_array_length(p_application->'staff') not between 0 and 20 or not public.valid_opening_hours(b->'opening_hours') then raise exception 'INVALID_APPLICATION' using errcode='22023';end if;
 insert into public.businesses(owner_id,name,slug,phone,contact_email,address,timezone,industry,city_ekatte,city,neighborhood,default_duration_min,booking_slot_minutes,languages,notification_locale,platform_status,booking_mode,opening_hours,website_url,public_profile,booking_terms)
 values(p_owner,b->>'name',b->>'slug',b->>'phone',b->>'contact_email',b->>'address',b->>'timezone',b->>'industry',b->>'city_ekatte',b->>'city',nullif(b->>'neighborhood',''),coalesce((b->>'default_duration_min')::integer,45),coalesce((b->>'booking_slot_minutes')::integer,15),array['bg','en'],p_application->>'locale','pending','phone',b->'opening_hours',nullif(b->>'website_url',''),coalesce(b->'public_profile','{}'::jsonb),nullif(b->>'booking_terms','')) returning id into bid;
 for s in select value from jsonb_array_elements(p_application->'services') loop
  if jsonb_typeof(s) is distinct from 'object' or char_length(coalesce(btrim(s->>'name'),'')) not between 2 and 120 or coalesce(s->>'currency','EUR') not in ('EUR','BGN')
   or (s?'description' and jsonb_typeof(s->'description') not in ('string','null')) or char_length(coalesce(s->>'description',''))>2000
   or not public.valid_service_price_details((s->>'price')::numeric,coalesce(s->'price_details','{}'::jsonb)) then raise exception 'INVALID_SERVICE_PRICE' using errcode='22023';end if;
  insert into public.services(business_id,name,price,currency,duration_min,description,price_details,sort_order)
  values(bid,s->>'name',(s->>'price')::numeric,coalesce(s->>'currency','EUR'),(s->>'duration_min')::integer,nullif(s->>'description',''),coalesce(s->'price_details','{}'::jsonb),idx);idx:=idx+1;
 end loop;
 idx:=0;
 for person in select value from jsonb_array_elements(p_application->'staff') loop
  if jsonb_typeof(person) is distinct from 'object' or char_length(coalesce(btrim(person->>'name'),'')) not between 2 and 100 or char_length(coalesce(person->>'bio',''))>2000 then raise exception 'INVALID_APPLICATION';end if;
  insert into public.staff(id,business_id,name,bio,sort_order) values(coalesce((person->>'id')::uuid,gen_random_uuid()),bid,person->>'name',person->>'bio',idx);idx:=idx+1;
 end loop;
 insert into public.partner_leads(business_name,contact_name,phone,email,category,city,locale,fingerprint,business_id,requires_owner_activation,setup_summary)
 values(b->>'name',coalesce(p_application->'staff'->0->>'name',left(b->>'name',100)),b->>'phone',p_application->>'email',b->>'industry',b->>'city',p_application->>'locale','application:'||bid::text,bid,p_requires_activation,jsonb_build_object('services',p_application->'services','staff',p_application->'staff','booking_mode','phone','opening_hours',b->'opening_hours','address',b->>'address','neighborhood',b->>'neighborhood')) returning id into lid;
 return lid;
end $$;
revoke all on function public.submit_business_application(uuid,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.submit_business_application(uuid,boolean,jsonb) to service_role;
-- Replacements retain the established privileges; state them explicitly.
revoke all on function public.save_booking_settings(uuid,uuid,boolean,bigint,text,text,boolean,jsonb,boolean),public.protect_booking_mode_fields(),public.guard_external_new_booking() from public,anon,authenticated;
grant execute on function public.save_booking_settings(uuid,uuid,boolean,bigint,text,text,boolean,jsonb,boolean) to service_role;
commit;
