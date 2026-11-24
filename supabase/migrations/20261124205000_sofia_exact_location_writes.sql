-- Exact Sofia postal matching and durable stale-address protection. No
-- provider requests, geocoding backfill or business/partnership data rewrites.
begin;

alter table public.businesses add column if not exists location_revision bigint not null default 0;
alter table public.registration_address_lookup_cache add column if not exists claim_location_revision bigint;
alter table public.registration_location_sources add column if not exists match_version smallint not null default 1;
alter table public.registration_location_sources add column if not exists location_revision bigint;
alter table public.business_place_links add column if not exists location_revision bigint;

create table if not exists public.business_location_changes (
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_revision bigint not null,
  previous jsonb not null,
  current jsonb not null,
  changed_at timestamptz not null default now(),
  primary key (business_id,location_revision)
);
alter table public.business_location_changes enable row level security;
revoke all on table public.business_location_changes from public,anon,authenticated,service_role;
grant select on table public.business_location_changes to service_role;

-- Version the cache without removing previous evidence and keep the source
-- fingerprint in its original format (the public RLS also binds its revision).
create or replace function public.sofia_registration_lookup_key(p_code text,p_city text,p_quarter text,p_address text)
returns text language sql immutable set search_path='' as $$
  select md5(jsonb_build_array('sofia-exact-postal-v2',p_code,p_city,p_quarter,p_address)::text);
$$;

create or replace function public.claim_registration_address_lookup(p_business uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.businesses; c public.registration_address_lookup_cache;
  g public.registration_address_lookup_gate; k text; token uuid;
  lookup_now timestamptz:=clock_timestamp(); day_utc date;
  venue jsonb; cached boolean:=false;
begin
  select * into b from public.businesses where id=p_business for update;
  if not found then return jsonb_build_object('state','missing'); end if;
  venue:=jsonb_build_object('id',b.id,'city_ekatte',b.city_ekatte,'city',b.city,
    'neighborhood',b.neighborhood,'address',b.address);
  if b.city_ekatte is distinct from '68134' or b.public_profile->>'location_kind' in ('service_area','mobile','online','online_only') then
    return jsonb_build_object('state','review_required','business',venue);
  end if;
  if jsonb_typeof(b.public_profile->'latitude')='number'
    and jsonb_typeof(b.public_profile->'longitude')='number' then
    return jsonb_build_object('state','already_set','business',venue);
  end if;
  if b.platform_status='archived' or length(trim(coalesce(b.address,'')))<2
    or length(trim(coalesce(b.city_ekatte,'')))<>5
    or (b.public_profile is not null and jsonb_typeof(b.public_profile)<>'object') then
    return jsonb_build_object('state','review_required','business',venue);
  end if;
  k:=public.sofia_registration_lookup_key(b.city_ekatte,b.city,b.neighborhood,b.address);
  select * into c from public.registration_address_lookup_cache where address_key=k for update;
  if found then
    if c.claim_token is not null and c.locked_until>lookup_now then
      return jsonb_build_object('state','throttled','business',venue,'address_key',k);
    end if;
    if c.expires_at>lookup_now and c.status in ('no_match','failed') then
      return jsonb_build_object('state','review_required','business',venue,'address_key',k);
    end if;
    cached:=c.status='matched' and c.expires_at>lookup_now;
  end if;
  token:=gen_random_uuid();
  if not cached then
    select * into strict g from public.registration_address_lookup_gate where singleton for update;
    day_utc:=(lookup_now at time zone 'UTC')::date;
    if g.request_day<>day_utc then
      update public.registration_address_lookup_gate set request_day=day_utc,requests=0 where singleton;
      g.requests:=0;
    end if;
    if g.requests>=250 or g.next_allowed_at>lookup_now or g.locked_until>lookup_now then
      return jsonb_build_object('state','throttled','business',venue,'address_key',k);
    end if;
    update public.registration_address_lookup_gate set claim_token=token,
      locked_until=lookup_now+interval '10 seconds',next_allowed_at=lookup_now+interval '15 seconds',
      requests=g.requests+1 where singleton;
  end if;
  insert into public.registration_address_lookup_cache(address_key,status,result,expires_at,
      claim_business_id,claim_token,claim_location_revision,locked_until,updated_at)
    values(k,'processing',null,lookup_now,b.id,token,b.location_revision,lookup_now+interval '10 seconds',lookup_now)
    on conflict(address_key) do update set
      status=case when cached then registration_address_lookup_cache.status else 'processing' end,
      result=case when cached then registration_address_lookup_cache.result else null end,
      expires_at=case when cached then registration_address_lookup_cache.expires_at else lookup_now end,
      claim_business_id=b.id,claim_token=token,claim_location_revision=b.location_revision,
      locked_until=lookup_now+interval '10 seconds',updated_at=lookup_now;
  return jsonb_build_object('state',case when cached then 'cached' else 'claimed' end,
    'business',venue,'address_key',k,'claim_token',token,'match_version',2)
    ||case when cached then jsonb_build_object('result',c.result) else '{}'::jsonb end;
end $$;

create or replace function public.finish_registration_address_lookup(
  p_business uuid,p_address_key text,p_claim_token uuid,p_status text,
  p_result jsonb default null,p_retry_after_seconds integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.businesses; c public.registration_address_lookup_cache;
  lookup_now timestamptz:=clock_timestamp(); lat numeric; lon numeric;
  applied boolean:=false; final_state text;
  verified_time timestamptz; next_location_revision bigint;
begin
  if p_status not in ('matched','no_match','failed') or p_status is null
    or coalesce(p_retry_after_seconds,0) not between 0 and 3600 then
    raise exception 'INVALID_ADDRESS_LOOKUP_RESULT' using errcode='22023';
  end if;
  if p_status='matched' then
    if jsonb_typeof(p_result) is distinct from 'object'
      or p_result-array['latitude','longitude','source_url','licence','attribution']<>'{}'::jsonb
      or jsonb_typeof(p_result->'latitude') is distinct from 'number'
      or jsonb_typeof(p_result->'longitude') is distinct from 'number'
      or coalesce(p_result->>'source_url','') !~ '^https://www[.]openstreetmap[.]org/(node|way|relation)/[1-9][0-9]{0,19}$'
      or coalesce(p_result->>'licence','')<>'ODbL-1.0'
      or coalesce(p_result->>'attribution','')<>'© OpenStreetMap contributors' then
      raise exception 'INVALID_ADDRESS_LOOKUP_RESULT' using errcode='22023';
    end if;
    lat:=(p_result->>'latitude')::numeric; lon:=(p_result->>'longitude')::numeric;
    if lat not between 42.45 and 42.9 or lon not between 23.1 and 23.65 then
      raise exception 'INVALID_ADDRESS_LOOKUP_RESULT' using errcode='22023';
    end if;
  elsif p_result is not null then
    raise exception 'INVALID_ADDRESS_LOOKUP_RESULT' using errcode='22023';
  end if;
  select * into b from public.businesses where id=p_business for update;
  select * into c from public.registration_address_lookup_cache where address_key=p_address_key for update;
  if not found or c.claim_token is distinct from p_claim_token or p_claim_token is null
    or c.claim_business_id is distinct from p_business or c.claim_location_revision is null
    or c.locked_until<=lookup_now then
    return jsonb_build_object('state','stale_claim','applied',false);
  end if;
  if b.id is null or b.city_ekatte is distinct from '68134'
    or b.public_profile->>'location_kind' in ('service_area','mobile','online','online_only')
    or public.sofia_registration_lookup_key(b.city_ekatte,b.city,b.neighborhood,b.address) is distinct from p_address_key
    or b.location_revision is distinct from c.claim_location_revision then
    -- A delayed response for A must not become a fresh cached match for a
    -- later A→B→A edit either. Preserve already verified cached evidence, but
    -- do not promote any output from the stale request.
    update public.registration_address_lookup_cache set
      status=case when c.status='matched' then c.status else 'failed' end,
      expires_at=case when c.status='matched' then c.expires_at else lookup_now end,
      claim_business_id=null,claim_token=null,claim_location_revision=null,locked_until=null,updated_at=lookup_now
      where address_key=p_address_key;
    update public.registration_address_lookup_gate set claim_token=null,locked_until=null,
      next_allowed_at=greatest(next_allowed_at,lookup_now+coalesce(p_retry_after_seconds,0)*interval '1 second')
      where singleton and claim_token=p_claim_token;
    return jsonb_build_object('state',case when b.id is null then 'missing' else 'stale_address' end,'applied',false);
  end if;
  -- Reusing a cache entry is not a fresh provider verification. Keep its
  -- original expiry/source check time rather than extending it indefinitely.
  verified_time:=case when p_status='matched' and c.status='matched' and c.result=p_result
    then c.verified_at when p_status='matched' then lookup_now else null end;
  update public.registration_address_lookup_cache set status=p_status,result=p_result,
    verified_at=verified_time,
    expires_at=case when p_status='matched' and c.status='matched' and c.result=p_result then c.expires_at
      else lookup_now+case when p_status='matched' then interval '30 days'
        when p_status='no_match' then interval '1 day' else interval '5 minutes' end end,
    claim_business_id=null,claim_token=null,claim_location_revision=null,locked_until=null,updated_at=lookup_now
    where address_key=p_address_key;
  update public.registration_address_lookup_gate set claim_token=null,locked_until=null,
    next_allowed_at=greatest(next_allowed_at,lookup_now+coalesce(p_retry_after_seconds,0)*interval '1 second')
    where singleton and claim_token=p_claim_token;
  final_state:=p_status;
  if jsonb_typeof(b.public_profile->'latitude')='number' or jsonb_typeof(b.public_profile->'longitude')='number' then final_state:='already_set';
  elsif p_status='matched' then
    update public.businesses set public_profile=coalesce(public_profile,'{}'::jsonb)
      ||jsonb_build_object('latitude',lat,'longitude',lon) where id=b.id returning location_revision into next_location_revision;
    insert into public.registration_location_sources(business_id,address_key,latitude,longitude,source_url,licence,attribution,checked_at,match_version,location_revision)
      values(b.id,md5(jsonb_build_array(b.city_ekatte,b.neighborhood,b.address)::text),lat,lon,p_result->>'source_url','ODbL-1.0','© OpenStreetMap contributors',coalesce(verified_time,lookup_now),2,next_location_revision)
      on conflict(business_id) do update set address_key=excluded.address_key,latitude=excluded.latitude,longitude=excluded.longitude,
        source_url=excluded.source_url,licence=excluded.licence,attribution=excluded.attribution,checked_at=excluded.checked_at,
        match_version=excluded.match_version,location_revision=excluded.location_revision;
    applied:=true;
  end if;
  return jsonb_build_object('state',final_state,'applied',applied);
end $$;

-- A change of raw address, locality or coordinates invalidates old evidence
-- on every write path, including direct legacy imports and application RPCs.
-- An intentionally different pair can still be stored for manual review;
-- storing it does not certify it as a publicly trusted route.
create or replace function public.invalidate_registration_address_point()
returns trigger language plpgsql security definer set search_path='' as $$
declare moved boolean; pin_changed boolean; lat numeric; lon numeric;
begin
  if tg_op='INSERT' then
    new.location_revision:=0;
    moved:=true;
    pin_changed:=true;
  else
    new.location_revision:=old.location_revision;
    moved:=row(new.city_ekatte,new.city,new.neighborhood,new.address,new.public_profile->>'location_kind')
      is distinct from row(old.city_ekatte,old.city,old.neighborhood,old.address,old.public_profile->>'location_kind');
    pin_changed:=new.public_profile->'latitude' is distinct from old.public_profile->'latitude'
      or new.public_profile->'longitude' is distinct from old.public_profile->'longitude';
  end if;
  if (moved or pin_changed) and jsonb_typeof(new.public_profile)='object' then
    if jsonb_typeof(new.public_profile->'latitude')='number' and jsonb_typeof(new.public_profile->'longitude')='number' then
      lat:=(new.public_profile->>'latitude')::numeric; lon:=(new.public_profile->>'longitude')::numeric;
    end if;
    if new.city_ekatte is distinct from '68134' or (moved and not pin_changed) or lat is null or lon is null
      or new.public_profile->>'location_kind' in ('service_area','mobile','online','online_only')
      or lat not between 42.45 and 42.9 or lon not between 23.1 and 23.65 then
      new.public_profile:=new.public_profile||jsonb_build_object('latitude',null,'longitude',null);
    end if;
  end if;
  if tg_op='UPDATE' and (moved or new.public_profile->'latitude' is distinct from old.public_profile->'latitude'
    or new.public_profile->'longitude' is distinct from old.public_profile->'longitude') then
    new.location_revision:=old.location_revision+1;
    delete from public.registration_location_sources where business_id=old.id;
  end if;
  return new;
end $$;
drop trigger if exists invalidate_registration_address_point on public.businesses;
create trigger invalidate_registration_address_point before insert or update of address,city,city_ekatte,neighborhood,public_profile,location_revision
  on public.businesses for each row execute function public.invalidate_registration_address_point();

create or replace function public.record_business_location_change()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.business_location_changes(business_id,location_revision,previous,current) values
    (new.id,new.location_revision,
      jsonb_build_object('city_ekatte',old.city_ekatte,'city',old.city,'neighborhood',old.neighborhood,'address',old.address,
        'location_kind',old.public_profile->'location_kind',
        'latitude',old.public_profile->'latitude','longitude',old.public_profile->'longitude'),
      jsonb_build_object('city_ekatte',new.city_ekatte,'city',new.city,'neighborhood',new.neighborhood,'address',new.address,
        'location_kind',new.public_profile->'location_kind',
        'latitude',new.public_profile->'latitude','longitude',new.public_profile->'longitude'));
  return null;
end $$;
drop trigger if exists record_business_location_change on public.businesses;
create trigger record_business_location_change after update on public.businesses for each row
  when (old.location_revision is distinct from new.location_revision) execute function public.record_business_location_change();

-- A previously verified provider association can remain as historical admin
-- evidence. It is no longer current once that branch moves; old forms cannot
-- reattach it to the moved branch. This does not change any booking rows.
create or replace function public.save_branch_place_link(p_business uuid,p_actor uuid,p_location_revision bigint,p_place_id text)
returns void language plpgsql security definer set search_path='' as $$
declare b public.businesses;
begin
  if p_actor is null or (p_place_id is not null and p_place_id !~ '^[A-Za-z0-9_-]{5,200}$') then
    raise exception 'INVALID_PLACE_LINK' using errcode='22023';
  end if;
  select * into b from public.businesses where id=p_business for update;
  if not found then raise exception 'BUSINESS_NOT_FOUND' using errcode='P0002'; end if;
  if b.location_revision is distinct from p_location_revision then
    raise exception 'LOCATION_CHANGED' using errcode='40001';
  end if;
  if p_place_id is null then
    delete from public.business_place_links where business_id=b.id;
  elsif b.city_ekatte is distinct from '68134' then
    raise exception 'OUTSIDE_SERVICE_AREA' using errcode='22023';
  elsif b.public_profile->>'location_kind' in ('service_area','mobile','online','online_only') then
    raise exception 'NO_PUBLIC_VISIT_LOCATION' using errcode='22023';
  else
    insert into public.business_place_links(business_id,place_id,verified_by,verified_at,location_revision)
      values(b.id,p_place_id,p_actor,now(),b.location_revision)
      on conflict(business_id) do update set place_id=excluded.place_id,verified_by=excluded.verified_by,
        verified_at=excluded.verified_at,location_revision=excluded.location_revision;
  end if;
end $$;

drop policy if exists published_registration_location_source on public.registration_location_sources;
create policy published_registration_location_source on public.registration_location_sources
  for select to anon,authenticated using (exists (
    select 1 from public.businesses b where b.id=registration_location_sources.business_id
      and b.active and b.platform_status='enabled' and b.city_ekatte='68134'
      and coalesce(b.public_profile->>'location_kind','') not in ('service_area','mobile','online','online_only')
      and registration_location_sources.match_version=2
      and b.location_revision=registration_location_sources.location_revision
      and md5(jsonb_build_array(b.city_ekatte,b.neighborhood,b.address)::text)=registration_location_sources.address_key
      and b.public_profile->'latitude'=to_jsonb(registration_location_sources.latitude)
      and b.public_profile->'longitude'=to_jsonb(registration_location_sources.longitude)
  ));

revoke all on function public.sofia_registration_lookup_key(text,text,text,text),public.record_business_location_change()
  from public,anon,authenticated,service_role;
revoke all on function public.invalidate_registration_address_point() from public,anon,authenticated,service_role;
revoke all on function public.save_branch_place_link(uuid,uuid,bigint,text) from public,anon,authenticated,service_role;
grant execute on function public.save_branch_place_link(uuid,uuid,bigint,text) to service_role;
revoke all on function public.claim_registration_address_lookup(uuid),
  public.finish_registration_address_lookup(uuid,text,uuid,text,jsonb,integer) from public,anon,authenticated,service_role;
grant execute on function public.claim_registration_address_lookup(uuid),
  public.finish_registration_address_lookup(uuid,text,uuid,text,jsonb,integer) to service_role;

commit;
