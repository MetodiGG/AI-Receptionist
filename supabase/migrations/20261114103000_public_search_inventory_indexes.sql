-- Additive indexes for the city-scoped public metadata index and rare large
-- menus. These do not change publication rules, RLS, facts or booking data.
begin;

create index if not exists businesses_public_search_city_id_idx
  on public.businesses (city_ekatte, id)
  where active = true and platform_status = 'enabled';

create index if not exists services_public_search_business_id_idx
  on public.services (business_id, id)
  where active = true;

commit;
