-- OPERATOR ONLY. No provider calls or secrets. Verify Dashboard target is
-- dbvsfxkmljrwjberwodb (gorez-staging), never Production, before running.
-- Creates only fictional records and a banned, passwordless owner placeholder.
-- Refuses populated databases, repeat runs and Production-like tenants.
begin;
do $$ begin
  if exists(select 1 from public.businesses)
    or exists(select 1 from auth.users)
    or exists(select 1 from public.customers)
    or exists(select 1 from public.appointments)
    or exists(select 1 from public.notification_outbox)
  then raise exception 'REVIEW_TEST_REQUIRES_EMPTY_ISOLATED_STAGING'; end if;
end $$;
insert into auth.users(id,email,banned_until)
 values('73000000-0000-4000-8000-000000000002','review-test-owner@fixture.invalid','infinity');
insert into public.businesses(id,owner_id,name,slug,active,platform_status,industry,city_ekatte,city,address,email_notifications_enabled,review_requests_enabled,contact_email,notification_locale)
 values('73000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000002','[TEST] GoRez Preview Review','test-preview-review-20261030',true,'enabled','other','68134','София','[TEST] Fictional staging fixture',true,true,null,'bg');
insert into public.staff(id,business_id,name)
 values('73000000-0000-4000-8000-000000000003','73000000-0000-4000-8000-000000000001','[TEST] Specialist');
insert into public.services(id,business_id,name,price,currency,duration_min)
 values('73000000-0000-4000-8000-000000000004','73000000-0000-4000-8000-000000000001','[TEST] Тестова услуга',0,'EUR',45);
insert into public.working_hours(business_id,staff_id,weekday,open_time,close_time)
 select '73000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000003',n,'09:00','18:00' from generate_series(1,7) n;
insert into public.customers(id,business_id,name,email,phone)
 values('73000000-0000-4000-8000-000000000005','73000000-0000-4000-8000-000000000001','[TEST] GoRez QA','info@gorez.co','TEST-NO-PHONE');
insert into public.appointments(id,business_id,staff_id,service_id,customer_id,starts_at,ends_at,status,email_notifications_requested,email_reminders_requested,notification_locale,source,notes)
 values('73000000-0000-4000-8000-000000000006','73000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000003','73000000-0000-4000-8000-000000000004','73000000-0000-4000-8000-000000000005',
 (((now() at time zone 'Europe/Sofia')::date-1)+time '10:00') at time zone 'Europe/Sofia',
 (((now() at time zone 'Europe/Sofia')::date-1)+time '10:45') at time zone 'Europe/Sofia',
 'booked',true,false,'bg','manual','[TEST] Approved isolated review-mail test; no real visit.');
-- Real completion trigger; no forged invitation, queue row or elapsed-time claim.
update public.appointments set status='done' where id='73000000-0000-4000-8000-000000000006';
do $$ begin
  if (select count(*) from public.notification_outbox)<>1
    or not exists(select 1 from public.notification_outbox where appointment_id='73000000-0000-4000-8000-000000000006' and kind='review_request' and recipient='info@gorez.co' and status='pending')
    or (select count(*) from public.review_invitations)<>1
  then raise exception 'REVIEW_TEST_QUEUE_NOT_ISOLATED'; end if;
end $$;
commit;
-- Never select the private token or email payload into logs/chat.
select 'isolated-review-test-v1' as fixture,
 (select count(*) from public.appointments where status='done') as completed_test_visits,
 (select count(*) from public.notification_outbox where kind='review_request' and status='pending') as pending_test_review_messages,
 (select count(*) from public.review_invitations where used_at is null) as unused_test_invitations;
