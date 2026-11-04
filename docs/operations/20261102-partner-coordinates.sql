-- One-off, owner-requested DATA repair. Not a schema migration.
-- Production: ilpdtvbymxqgimrboyvh. Refuse stale edits or any other targets.
-- Sources: Zen's own zenbarber.bg/bg Google Maps place link; the Google Maps
-- address pin for Sofia, Sinanishko Ezero 13 (not a claimed Vesi listing).
begin;
do $repair$
declare changed integer;
begin
  with pins(id, name, address, revision, lat, lon, source) as (values
    ('09f6d770-cdd5-40d2-8e82-d7e2cc9e263a'::uuid, 'Zen Barbershop', 'Ул. Казбек 63', 0::bigint, 42.6650223::numeric, 23.2867119::numeric, 'https://zenbarber.bg/bg (published place pin)'),
    ('450c5c2f-db41-476b-a21e-98cf5ee29194'::uuid, 'ВЕСИ СТУДИО', 'Ул. Синанишко езеро 13, бл 12', 3::bigint, 42.6649597::numeric, 23.2835227::numeric, 'Google Maps public address pin: Sofia, Sinanishko Ezero 13')
  ), updated as (
    update public.businesses b
    set public_profile = coalesce(b.public_profile, '{}'::jsonb)
      || jsonb_build_object('latitude', p.lat, 'longitude', p.lon)
    from pins p
    where b.id = p.id and b.name = p.name and b.address = p.address
      and b.city_ekatte = '68134' and b.active and b.platform_status = 'enabled'
      and b.content_revision = p.revision
      and (b.public_profile is null or jsonb_typeof(b.public_profile) = 'object')
      and b.public_profile->>'latitude' is null and b.public_profile->>'longitude' is null
    returning b.id, p.source
  )
  insert into public.business_content_audit (business_id, actor_id, actor_kind, section, reason)
  select id, null, 'admin', 'business', 'Owner-authorized SQL-console repair of missing map coordinates for Nearby search. Source: ' || source
  from updated;
  get diagnostics changed = row_count;
  if changed <> 2 then
    raise exception 'Expected exactly two unchanged published partners; transaction rolled back (matched %).', changed;
  end if;
end
$repair$;
select id, name, public_profile->>'latitude' as latitude,
  public_profile->>'longitude' as longitude, content_revision
from public.businesses
where id in ('09f6d770-cdd5-40d2-8e82-d7e2cc9e263a', '450c5c2f-db41-476b-a21e-98cf5ee29194')
order by id;
commit;
