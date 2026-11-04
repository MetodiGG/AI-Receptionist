-- READ ONLY. Intended project: ilpdtvbymxqgimrboyvh (verify Console URL).
-- Returns counts/fingerprints, never customer details or credentials.
select jsonb_build_object(
  'businesses', (select jsonb_build_object('count',count(*),'fingerprint',md5(coalesce(string_agg((to_jsonb(b)-'booking_mode'-'external_booking_url'-'external_booking_consent_at'-'opening_hours')::text,'' order by id),''))) from public.businesses b),
  'appointments', (select jsonb_build_object('count',count(*),'fingerprint',md5(coalesce(string_agg(to_jsonb(a)::text,'' order by id),''))) from public.appointments a),
  'customers', (select jsonb_build_object('count',count(*),'fingerprint',md5(coalesce(string_agg(to_jsonb(c)::text,'' order by id),''))) from public.customers c),
  'services', (select count(*) from public.services),
  'staff', (select count(*) from public.staff),
  'working_hours', (select count(*) from public.working_hours),
  'business_statuses', (select jsonb_agg(x) from (select platform_status,count(*) from public.businesses group by platform_status order by platform_status) x),
  'new_columns', (select jsonb_agg(column_name) from information_schema.columns where table_schema='public' and table_name='businesses' and column_name in ('booking_mode','external_booking_url','external_booking_consent_at','opening_hours')),
  'original_functions', (select jsonb_agg(jsonb_build_object('name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'body_hash',md5(p.prosrc))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('submit_business_application','platform_business_action','submit_business_application_internal_v1','platform_business_action_internal_v1')),
  'migration_history_columns', (select jsonb_agg(column_name order by ordinal_position) from information_schema.columns where table_schema='supabase_migrations' and table_name='schema_migrations')
) as master_preflight;
