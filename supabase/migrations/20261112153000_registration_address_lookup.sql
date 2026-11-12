-- End-user-triggered public business address lookup only. No periodic job,
-- network request, backfill, required signup map point or existing-row rewrite.
begin;

create table if not exists public.registration_address_lookup_cache (
  address_key text primary key check (address_key ~ '^[0-9a-f]{32}$'),
  status text not null check (status in ('processing','matched','no_match','failed')),
  result jsonb,
  expires_at timestamptz not null,
  verified_at timestamptz,
  claim_business_id uuid references public.businesses(id) on delete set null,
  claim_token uuid,
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  check ((status='matched')=(result is not null))
);
create table if not exists public.registration_address_lookup_gate (
  singleton boolean primary key default true check (singleton),
  next_allowed_at timestamptz not null default '-infinity',
  claim_token uuid,
  locked_until timestamptz,
  request_day date not null default (now() at time zone 'UTC')::date,
  requests integer not null default 0 check (requests>=0)
);
insert into public.registration_address_lookup_gate(singleton) values(true)
  on conflict(singleton) do nothing;
create table if not exists public.registration_location_sources (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  address_key text not null check (address_key ~ '^[0-9a-f]{32}$'),
  latitude numeric not null check (latitude between 41 and 44.5),
  longitude numeric not null check (longitude between 22 and 29),
  source_url text not null check (source_url ~ '^https://www[.]openstreetmap[.]org/(node|way|relation)/[1-9][0-9]{0,19}$'),
  licence text not null check (licence='ODbL-1.0'),
  attribution text not null check (attribution='© OpenStreetMap contributors'),
  checked_at timestamptz not null default now()
);
alter table public.registration_address_lookup_cache enable row level security;
alter table public.registration_address_lookup_gate enable row level security;
alter table public.registration_location_sources enable row level security;
revoke all on table public.registration_address_lookup_cache,public.registration_address_lookup_gate,
  public.registration_location_sources from public,anon,authenticated,service_role;
grant select,update on table public.registration_address_lookup_cache,public.registration_address_lookup_gate to service_role;
grant select on table public.registration_location_sources to anon,authenticated,service_role;
drop policy if exists published_registration_location_source on public.registration_location_sources;
create policy published_registration_location_source on public.registration_location_sources
  for select to anon,authenticated using (exists (
    select 1 from public.businesses b where b.id=registration_location_sources.business_id
      and b.active and b.platform_status='enabled'
      and md5(jsonb_build_array(b.city_ekatte,b.neighborhood,b.address)::text)=registration_location_sources.address_key
      and b.public_profile->'latitude'=to_jsonb(registration_location_sources.latitude)
      and b.public_profile->'longitude'=to_jsonb(registration_location_sources.longitude)
  ));

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
  if jsonb_typeof(b.public_profile->'latitude')='number'
    and jsonb_typeof(b.public_profile->'longitude')='number' then
    return jsonb_build_object('state','already_set','business',venue);
  end if;
  if b.platform_status='archived' or length(trim(coalesce(b.address,'')))<2
    or length(trim(coalesce(b.city_ekatte,'')))<>5
    or (b.public_profile is not null and jsonb_typeof(b.public_profile)<>'object') then
    return jsonb_build_object('state','review_required','business',venue);
  end if;
  k:=md5(jsonb_build_array(b.city_ekatte,b.neighborhood,b.address)::text);
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
      claim_business_id,claim_token,locked_until,updated_at)
    values(k,'processing',null,lookup_now,b.id,token,lookup_now+interval '10 seconds',lookup_now)
    on conflict(address_key) do update set
      status=case when cached then registration_address_lookup_cache.status else 'processing' end,
      result=case when cached then registration_address_lookup_cache.result else null end,
      expires_at=case when cached then registration_address_lookup_cache.expires_at else lookup_now end,
      claim_business_id=b.id,claim_token=token,locked_until=lookup_now+interval '10 seconds',updated_at=lookup_now;
  return jsonb_build_object('state',case when cached then 'cached' else 'claimed' end,
    'business',venue,'address_key',k,'claim_token',token)
    ||case when cached then jsonb_build_object('result',c.result) else '{}'::jsonb end;
end $$;

create or replace function public.finish_registration_address_lookup(
  p_business uuid,p_address_key text,p_claim_token uuid,p_status text,
  p_result jsonb default null,p_retry_after_seconds integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.businesses; c public.registration_address_lookup_cache;
  lookup_now timestamptz:=clock_timestamp(); lat numeric; lon numeric;
  applied boolean:=false; final_state text;
  verified_time timestamptz;
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
    if lat not between 41 and 44.5 or lon not between 22 and 29 then
      raise exception 'INVALID_ADDRESS_LOOKUP_RESULT' using errcode='22023';
    end if;
  elsif p_result is not null then
    raise exception 'INVALID_ADDRESS_LOOKUP_RESULT' using errcode='22023';
  end if;
  select * into b from public.businesses where id=p_business for update;
  select * into c from public.registration_address_lookup_cache where address_key=p_address_key for update;
  if not found or c.claim_token is distinct from p_claim_token or p_claim_token is null
    or c.claim_business_id is distinct from p_business or c.locked_until<=lookup_now then
    return jsonb_build_object('state','stale_claim','applied',false);
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
    claim_business_id=null,claim_token=null,locked_until=null,updated_at=lookup_now
    where address_key=p_address_key;
  update public.registration_address_lookup_gate set claim_token=null,locked_until=null,
    next_allowed_at=greatest(next_allowed_at,lookup_now+coalesce(p_retry_after_seconds,0)*interval '1 second')
    where singleton and claim_token=p_claim_token;
  final_state:=p_status;
  if b.id is null then final_state:='missing';
  elsif md5(jsonb_build_array(b.city_ekatte,b.neighborhood,b.address)::text)<>p_address_key then final_state:='stale_address';
  elsif jsonb_typeof(b.public_profile->'latitude')='number' or jsonb_typeof(b.public_profile->'longitude')='number' then final_state:='already_set';
  elsif p_status='matched' then
    update public.businesses set public_profile=coalesce(public_profile,'{}'::jsonb)
      ||jsonb_build_object('latitude',lat,'longitude',lon) where id=b.id;
    insert into public.registration_location_sources(business_id,address_key,latitude,longitude,source_url,licence,attribution,checked_at)
      values(b.id,p_address_key,lat,lon,p_result->>'source_url','ODbL-1.0','© OpenStreetMap contributors',coalesce(verified_time,lookup_now))
      on conflict(business_id) do update set address_key=excluded.address_key,latitude=excluded.latitude,longitude=excluded.longitude,
        source_url=excluded.source_url,licence=excluded.licence,attribution=excluded.attribution,checked_at=excluded.checked_at;
    applied:=true;
  end if;
  return jsonb_build_object('state',final_state,'applied',applied);
end $$;

-- Future address edits cannot silently keep an automatically geocoded point
-- for the former venue. Never change an explicitly corrected/new manual pin.
create or replace function public.invalidate_registration_address_point()
returns trigger language plpgsql security definer set search_path='' as $$
declare source public.registration_location_sources; new_key text;
begin
  select * into source from public.registration_location_sources where business_id=old.id;
  if not found then return new; end if;
  new_key:=md5(jsonb_build_array(new.city_ekatte,new.neighborhood,new.address)::text);
  if new_key is distinct from source.address_key
    or new.public_profile->'latitude' is distinct from to_jsonb(source.latitude)
    or new.public_profile->'longitude' is distinct from to_jsonb(source.longitude) then
    if new_key is distinct from source.address_key
      and old.public_profile->'latitude'=to_jsonb(source.latitude)
      and old.public_profile->'longitude'=to_jsonb(source.longitude)
      and new.public_profile->'latitude'=old.public_profile->'latitude'
      and new.public_profile->'longitude'=old.public_profile->'longitude' then
      new.public_profile:=coalesce(new.public_profile,'{}'::jsonb)
        ||jsonb_build_object('latitude',null,'longitude',null);
    end if;
    delete from public.registration_location_sources where business_id=old.id;
  end if;
  return new;
end $$;
drop trigger if exists invalidate_registration_address_point on public.businesses;
create trigger invalidate_registration_address_point before update of address,city_ekatte,neighborhood,public_profile
  on public.businesses for each row execute function public.invalidate_registration_address_point();

revoke all on function public.claim_registration_address_lookup(uuid),
  public.finish_registration_address_lookup(uuid,text,uuid,text,jsonb,integer),
  public.invalidate_registration_address_point() from public,anon,authenticated,service_role;
grant execute on function public.claim_registration_address_lookup(uuid),
  public.finish_registration_address_lookup(uuid,text,uuid,text,jsonb,integer) to service_role;

commit;
