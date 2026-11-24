-- Run in the authorized GoRez database session. Export the single JSON cell
-- to a private location outside Git. This file performs no write or geocoding.
begin transaction isolation level repeatable read read only;

select jsonb_build_object(
  'schemaVersion', 1,
  'capturedAt', statement_timestamp(),
  'scope', 'all_native_businesses',
  'businesses', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', b.id, 'name', b.name, 'slug', b.slug,
      'source', 'gorez', 'city', b.city, 'city_ekatte', b.city_ekatte,
      'neighborhood', b.neighborhood, 'address', b.address,
      'location_kind', b.public_profile->>'location_kind',
      'active', b.active, 'platform_status', b.platform_status,
      'content_revision', b.content_revision::text,
      'platform_revision', b.platform_revision::text,
      'location_revision', to_jsonb(b)->>'location_revision',
      'application_status', l.status,
      'application_address', l.setup_summary->>'address',
      'coordinates', case
        when b.public_profile->'latitude' is not null or b.public_profile->'longitude' is not null
        then jsonb_build_object('latitude', b.public_profile->'latitude', 'longitude', b.public_profile->'longitude')
        else null end,
      'place_id', p.place_id, 'place_verified_at', p.verified_at,
      'place_location_revision', to_jsonb(p)->>'location_revision',
      'registration_source', case when s.business_id is not null then jsonb_build_object(
        'latitude', s.latitude, 'longitude', s.longitude,
        'source_url', s.source_url, 'checked_at', s.checked_at,
        'licence', s.licence, 'attribution', s.attribution,
        -- Keep this export readable before and after the evidence-version migration.
        'match_version', to_jsonb(s)->'match_version',
        'location_revision_matches', coalesce(to_jsonb(s)->>'location_revision' =
          to_jsonb(b)->>'location_revision', false),
        'address_key_matches', s.address_key = md5(jsonb_build_array(b.city_ekatte, b.neighborhood, b.address)::text),
        'profile_point_matches', b.public_profile->'latitude' = to_jsonb(s.latitude)
                                  and b.public_profile->'longitude' = to_jsonb(s.longitude)
      ) else null end
    ) order by b.id)
    from public.businesses b
    left join public.registration_location_sources s on s.business_id = b.id
    left join public.business_place_links p on p.business_id = b.id
    left join public.partner_leads l on l.business_id = b.id
  ), '[]'::jsonb),
  'contact_only_lead_count', (select count(*) from public.partner_leads where business_id is null)
) as location_inventory;

rollback;
