-- New opt-in reviews, only after a newly completed visit. No historical email
-- backfill, no provider calls, no changes to existing customers or bookings.
begin;
alter table public.businesses
  add column if not exists public_profile jsonb not null default '{}'::jsonb
    check (jsonb_typeof(public_profile)='object' and octet_length(public_profile::text)<=20000),
  add column if not exists review_requests_enabled boolean not null default true;
alter table public.services add column if not exists category text check(category is null or char_length(category)<=80);

create table if not exists public.review_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  appointment_revision bigint not null,
  available_at timestamptz not null,
  expires_at timestamptz not null,
  used_at timestamptz, revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.booking_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  invitation_id uuid not null unique references public.review_invitations(id) on delete cascade,
  rating smallint not null check(rating between 1 and 5),
  display_name text not null check(char_length(btrim(display_name)) between 2 and 50),
  comment text not null default '' check(char_length(comment)<=1500),
  quality smallint check(quality between 1 and 5),
  service_rating smallint check(service_rating between 1 and 5),
  cleanliness smallint check(cleanliness between 1 and 5),
  atmosphere smallint check(atmosphere between 1 and 5),
  consent_at timestamptz not null default now(),
  status text not null default 'published' check(status in ('published','hidden')),
  revision integer not null default 0,
  moderation_reason text,
  created_at timestamptz not null default now()
);
create index if not exists booking_reviews_public_idx on public.booking_reviews(business_id,created_at desc,id desc) where status='published';
create table if not exists public.review_moderation_audit (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.booking_reviews(id) on delete set null,
  business_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check(action in ('published','hidden')),
  reason text not null check(char_length(btrim(reason)) between 3 and 500),
  created_at timestamptz not null default now()
);
alter table public.review_invitations enable row level security;
alter table public.booking_reviews enable row level security;
alter table public.review_moderation_audit enable row level security;
revoke all on public.review_invitations,public.booking_reviews,public.review_moderation_audit from public,anon,authenticated;
grant select,insert,update,delete on public.review_invitations,public.booking_reviews to service_role;
grant select,insert on public.review_moderation_audit to service_role;

alter table public.notification_outbox drop constraint if exists notification_outbox_kind_check;
alter table public.notification_outbox add constraint notification_outbox_kind_check check(kind in
  ('booking_confirmation','booking_cancelled','booking_rescheduled','booking_reminder','owner_new_booking','review_request'));
-- Existing owner-readable queue payloads contain private management links.
-- Review payloads contain a one-use client credential: never let an owner read
-- that credential in the queue/export and rate their own business as a client.
drop policy if exists review_email_private on public.notification_outbox;
create policy review_email_private on public.notification_outbox as restrictive for all to authenticated
  using(kind<>'review_request') with check(kind<>'review_request');

create or replace function public.queue_visit_review()
returns trigger language plpgsql security definer set search_path='' as $$
declare b public.businesses; client_email text; invitation public.review_invitations; due timestamptz;
begin
  if new.notification_revision is distinct from old.notification_revision then
    update public.review_invitations set revoked_at=now() where appointment_id=new.id
      and appointment_revision<>new.notification_revision and revoked_at is null;
    if new.status<>'done' then
      update public.booking_reviews set status='hidden',revision=revision+1,moderation_reason='BOOKING_CHANGED'
        where appointment_id=new.id and status='published';
    end if;
  end if;
  if new.status<>'done' or old.status='done' or new.ends_at<now()-interval '7 days'
    or not new.email_notifications_requested then return new; end if;
  select * into b from public.businesses where id=new.business_id;
  if not b.active or b.platform_status<>'enabled' or not b.email_notifications_enabled or not b.review_requests_enabled then return new; end if;
  select lower(btrim(email)) into client_email from public.customers where id=new.customer_id and business_id=new.business_id;
  if nullif(client_email,'') is null or exists(select 1 from public.booking_reviews where appointment_id=new.id) then return new; end if;
  due:=greatest(now(),new.ends_at+interval '1 hour');
  insert into public.review_invitations(business_id,appointment_id,appointment_revision,available_at,expires_at)
    values(new.business_id,new.id,new.notification_revision,due,due+interval '30 days')
    on conflict(appointment_id) do update set token=gen_random_uuid(),appointment_revision=excluded.appointment_revision,
      available_at=excluded.available_at,expires_at=excluded.expires_at,revoked_at=null
      where public.review_invitations.used_at is null
    returning * into invitation;
  if invitation.id is null then return new; end if;
  insert into public.notification_outbox(business_id,appointment_id,kind,recipient,subject,html_body,scheduled_for,idempotency_key,appointment_revision,locale)
    values(new.business_id,new.id,'review_request',client_email,'','',due,
      'review:'||new.id||':'||new.notification_revision,new.notification_revision,new.notification_locale)
    on conflict(idempotency_key) do nothing;
  return new;
end $$;
drop trigger if exists queue_visit_review on public.appointments;
create trigger queue_visit_review after update on public.appointments for each row execute function public.queue_visit_review();

-- New workers can claim review mail. Old workers retain their exact old RPC
-- signature but cannot accidentally claim an unsupported new message kind.
create or replace function public.claim_visit_email(p_appointment_id uuid default null,p_reminders boolean default false,p_reviews boolean default false)
returns setof public.notification_outbox language plpgsql security definer set search_path='' as $$
begin
  update public.notification_outbox set status='failed',claim_token=null,locked_until=null,last_error='RETRY_LIMIT_REACHED'
    where status='processing' and locked_until<now() and attempts>=3;
  return query with candidate as (
    select q.id from public.notification_outbox q where
      ((q.status in ('pending','failed') and q.scheduled_for<=now()) or (q.status='processing' and q.locked_until<now()))
      and q.attempts<3 and q.appointment_revision is not null
      and (p_appointment_id is null or q.appointment_id=p_appointment_id)
      and (p_reminders or q.kind<>'booking_reminder') and (p_reviews or q.kind<>'review_request')
      order by q.scheduled_for,q.created_at,q.id limit 1 for update skip locked
  ) update public.notification_outbox q set status='processing',claim_token=gen_random_uuid(),
    locked_until=now()+interval '5 minutes',attempts=q.attempts+1,first_attempt_at=coalesce(q.first_attempt_at,now())
    from candidate where q.id=candidate.id returning q.*;
end $$;
create or replace function public.claim_booking_email(p_appointment_id uuid default null,p_reminders boolean default false)
returns setof public.notification_outbox language sql security definer set search_path='' as $$
  select * from public.claim_visit_email(p_appointment_id,p_reminders,false);
$$;

create or replace function public.submit_booking_review(p_token uuid,p_body jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare invitation public.review_invitations; a public.appointments; review_id uuid;
begin
  select * into invitation from public.review_invitations where token=p_token for update;
  if not found or invitation.revoked_at is not null or invitation.expires_at<=now() or invitation.available_at>now() then
    raise exception 'REVIEW_LINK_UNAVAILABLE' using errcode='P0002'; end if;
  if invitation.used_at is not null then raise exception 'REVIEW_ALREADY_SUBMITTED' using errcode='23505'; end if;
  select * into a from public.appointments where id=invitation.appointment_id and business_id=invitation.business_id for share;
  if not found or a.status<>'done' or a.ends_at>now() or a.notification_revision<>invitation.appointment_revision
    or not exists(select 1 from public.businesses where id=a.business_id and active and platform_status='enabled')
    or not exists(select 1 from public.customers where id=a.customer_id and business_id=a.business_id and nullif(btrim(email),'') is not null) then
    raise exception 'REVIEW_LINK_UNAVAILABLE' using errcode='P0002'; end if;
  if p_body->>'consent'<>'true' or p_body->>'consent' is null or jsonb_typeof(p_body)<>'object' then
    raise exception 'INVALID_REVIEW' using errcode='22023'; end if;
  insert into public.booking_reviews(business_id,appointment_id,invitation_id,rating,display_name,comment,quality,service_rating,cleanliness,atmosphere)
    values(a.business_id,a.id,invitation.id,(p_body->>'rating')::smallint,btrim(p_body->>'displayName'),coalesce(p_body->>'comment',''),
      (p_body->'details'->>'quality')::smallint,(p_body->'details'->>'service')::smallint,
      (p_body->'details'->>'cleanliness')::smallint,(p_body->'details'->>'atmosphere')::smallint)
    returning id into review_id;
  update public.review_invitations set used_at=now() where id=invitation.id;
  return review_id;
end $$;

create or replace function public.public_business_reviews(p_business_id uuid,p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if not exists(select 1 from public.businesses where id=p_business_id and active and platform_status='enabled') then return null; end if;
  with visible as (
    select r.* from public.booking_reviews r join public.appointments a on a.id=r.appointment_id and a.business_id=r.business_id
      where r.business_id=p_business_id and r.status='published' and a.status='done' and a.ends_at<=now()
  ), page as (
    select id,rating,display_name,comment,created_at from visible
      where p_before is null or (created_at,id)<(p_before,p_before_id)
      order by created_at desc,id desc limit 11
  ) select jsonb_build_object(
    'summary',(select jsonb_build_object('count',count(*),'average',round(avg(rating),1),'quality',round(avg(quality),1),
      'service',round(avg(service_rating),1),'cleanliness',round(avg(cleanliness),1),'atmosphere',round(avg(atmosphere),1)) from visible),
    'items',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,id desc) from page),'[]'::jsonb)
  ) into result;
  return result;
end $$;

create or replace function public.moderate_booking_review(p_id uuid,p_actor uuid,p_status text,p_revision integer,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.booking_reviews;
begin
  if p_actor is null or p_status is null or p_revision is null or p_status not in ('published','hidden') or p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception 'INVALID_REVIEW_ACTION' using errcode='22023'; end if;
  select * into r from public.booking_reviews where id=p_id for update;
  if not found then raise exception 'REVIEW_NOT_FOUND' using errcode='P0002'; end if;
  if r.revision<>p_revision then raise exception 'REVIEW_CHANGED' using errcode='40001'; end if;
  insert into public.review_moderation_audit(review_id,business_id,actor_id,action,reason)
    values(r.id,r.business_id,p_actor,p_status,btrim(p_reason));
  update public.booking_reviews set status=p_status,revision=revision+1,moderation_reason=btrim(p_reason) where id=r.id;
end $$;

create or replace function public.erase_customer_reviews()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if nullif(btrim(new.email),'') is null and old.email is not null then
    delete from public.review_invitations where appointment_id in
      (select id from public.appointments where customer_id=new.id and business_id=new.business_id);
  end if;
  return new;
end $$;
drop trigger if exists erase_customer_reviews on public.customers;
create trigger erase_customer_reviews after update of email on public.customers for each row execute function public.erase_customer_reviews();

revoke all on function public.queue_visit_review(),public.erase_customer_reviews(),public.claim_visit_email(uuid,boolean,boolean),
  public.claim_booking_email(uuid,boolean),public.submit_booking_review(uuid,jsonb),public.public_business_reviews(uuid,timestamptz,uuid),
  public.moderate_booking_review(uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.claim_visit_email(uuid,boolean,boolean),public.claim_booking_email(uuid,boolean),
  public.submit_booking_review(uuid,jsonb),public.public_business_reviews(uuid,timestamptz,uuid),
  public.moderate_booking_review(uuid,uuid,text,integer,text) to service_role;
commit;
