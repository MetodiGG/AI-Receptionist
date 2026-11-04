-- REVIEW ONLY: not applied to any live database. Additive, no publication/backfill.
begin;
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
commit;
