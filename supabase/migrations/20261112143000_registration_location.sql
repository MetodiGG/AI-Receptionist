-- Future businesses need an explicit map point. This is INSERT-only: existing
-- profiles are not rewritten or blocked from editing. Address accuracy remains
-- an owner/admin check; numeric bounds are not an address-geocoding service.
begin;

create or replace function public.require_new_business_location()
returns trigger language plpgsql set search_path='' as $$
begin
  if coalesce(pg_catalog.jsonb_typeof(new.public_profile),'null') <> 'object'
    or coalesce(pg_catalog.jsonb_typeof(new.public_profile->'latitude'),'null') <> 'number'
    or coalesce(pg_catalog.jsonb_typeof(new.public_profile->'longitude'),'null') <> 'number' then
    raise exception 'BUSINESS_LOCATION_REQUIRED' using errcode='22023';
  end if;
  if (new.public_profile->>'latitude')::numeric not between 41 and 44.5
    or (new.public_profile->>'longitude')::numeric not between 22 and 29 then
    raise exception 'BUSINESS_LOCATION_INVALID' using errcode='22023';
  end if;
  return new;
end;
$$;
revoke all on function public.require_new_business_location() from public,anon,authenticated;

drop trigger if exists require_new_business_location on public.businesses;
create trigger require_new_business_location before insert on public.businesses
  for each row execute function public.require_new_business_location();

commit;
