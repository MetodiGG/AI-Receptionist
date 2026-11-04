-- REVIEW ONLY. Requires 20261104170000; no existing business is modified.
begin;
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
commit;
