-- REVIEW ONLY. First-party events, not third-party analytics or conversions.
begin;
create table public.external_booking_links(
 id uuid primary key default gen_random_uuid(),place_id text not null unique check(char_length(place_id) between 10 and 256 and place_id ~ '^[A-Za-z0-9_-]+$'),
 label text not null check(char_length(label) between 2 and 150),booking_url text not null check(public.valid_booking_url(booking_url)),
 official_url text not null check(public.valid_booking_url(official_url)),evidence text not null check(char_length(evidence) between 10 and 1500),
 verification_status text not null default 'draft' check(verification_status in ('draft','approved','disabled')),
 verified_at timestamptz,verified_by uuid references auth.users(id) on delete set null,last_checked_at timestamptz,disabled_at timestamptz,
 revision bigint not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 -- Removing a reviewer identity must not block account erasure. A missing
 -- reviewer automatically makes this record unusable in approvedExternalLink.
 check(verification_status<>'approved' or verified_at is not null)
);
create table public.external_booking_link_audit(id uuid primary key default gen_random_uuid(),link_id uuid not null references public.external_booking_links(id),actor_id uuid references auth.users(id) on delete set null,action text not null,created_at timestamptz not null default now());
create table public.external_booking_reports(id uuid primary key default gen_random_uuid(),link_id uuid not null references public.external_booking_links(id),reason text not null check(char_length(reason) between 5 and 500),created_at timestamptz not null default now(),resolved_at timestamptz,resolved_by uuid references auth.users(id) on delete set null);
create table public.booking_referral_events(id uuid primary key default gen_random_uuid(),business_id uuid references public.businesses(id) on delete cascade,external_link_id uuid references public.external_booking_links(id) on delete cascade,event_type text not null check(event_type in ('profile_view','outbound_click')),created_at timestamptz not null default now(),check((business_id is null)<>(external_link_id is null)));
create index booking_referral_business_time_idx on public.booking_referral_events(business_id,created_at);
create index booking_referral_link_time_idx on public.booking_referral_events(external_link_id,created_at);
alter table public.external_booking_links enable row level security;
alter table public.external_booking_link_audit enable row level security;
alter table public.external_booking_reports enable row level security;
alter table public.booking_referral_events enable row level security;
revoke all on public.external_booking_links,public.external_booking_link_audit,public.external_booking_reports,public.booking_referral_events from public,anon,authenticated;
grant select,insert,update on public.external_booking_links,public.external_booking_link_audit,public.external_booking_reports to service_role;
grant select,insert,delete on public.booking_referral_events to service_role;
grant select on public.booking_referral_events to authenticated;
create policy owner_referral_read on public.booking_referral_events for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));

create function public.review_external_booking_link(p_actor uuid,p_id uuid,p_revision bigint,p_action text,p_data jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.external_booking_links;target uuid;
begin
 if p_actor is null or p_action is null or p_action not in ('save','approve','disable','resolve') then raise exception 'VALIDATION_ERROR';end if;
 if p_id is not null then select * into r from public.external_booking_links where id=p_id for update;if not found then raise exception 'LINK_NOT_FOUND';end if;if p_revision is null or p_revision<>r.revision then raise exception 'LINK_CHANGED' using errcode='40001';end if;end if;
 if p_action='save' then
  if not public.valid_booking_url(p_data->>'booking_url') or not public.valid_booking_url(p_data->>'official_url') or coalesce(char_length(p_data->>'evidence'),0)<10 then raise exception 'VALIDATION_ERROR';end if;
  if p_id is null then
   insert into public.external_booking_links(place_id,label,booking_url,official_url,evidence) values(p_data->>'place_id',p_data->>'label',p_data->>'booking_url',p_data->>'official_url',p_data->>'evidence') returning id into target;
  else
   if p_data->>'place_id' is distinct from r.place_id then raise exception 'PLACE_ID_IMMUTABLE';end if;
   update public.external_booking_links set label=p_data->>'label',booking_url=p_data->>'booking_url',official_url=p_data->>'official_url',evidence=p_data->>'evidence',verification_status='draft',verified_at=null,verified_by=null,last_checked_at=null,disabled_at=null,revision=revision+1,updated_at=now() where id=p_id;target:=p_id;
  end if;
 else
  if p_id is null or p_data->>'confirmation' is distinct from r.place_id then raise exception 'CONFIRMATION_MISMATCH';end if;
  if p_action='approve' then
   if p_data->>'verifiedBusinessAndBookingFlow' is distinct from 'true' then raise exception 'VERIFICATION_REQUIRED';end if;
   if exists(select 1 from public.business_place_links where place_id=r.place_id) then raise exception 'PARTNER_PLACE_LINK';end if;
   update public.external_booking_links set verification_status='approved',verified_by=p_actor,verified_at=now(),last_checked_at=now(),disabled_at=null,revision=revision+1,updated_at=now() where id=p_id;
  elsif p_action='disable' then update public.external_booking_links set verification_status='disabled',disabled_at=now(),revision=revision+1,updated_at=now() where id=p_id;
  elsif p_action='resolve' then update public.external_booking_reports set resolved_at=now(),resolved_by=p_actor where link_id=p_id and resolved_at is null;update public.external_booking_links set revision=revision+1,updated_at=now() where id=p_id;
  end if;target:=p_id;
 end if;
 insert into public.external_booking_link_audit(link_id,actor_id,action) values(target,p_actor,p_action);
 return target;
end $$;
revoke all on function public.review_external_booking_link(uuid,uuid,bigint,text,jsonb) from public,anon,authenticated;
grant execute on function public.review_external_booking_link(uuid,uuid,bigint,text,jsonb) to service_role;
create function public.business_referral_summary(p_business uuid,p_actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.businesses where id=p_business and owner_id=p_actor) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 return jsonb_build_object('views',(select count(*) from public.booking_referral_events where business_id=p_business and event_type='profile_view' and created_at>=now()-interval '30 days'),'clicks',(select count(*) from public.booking_referral_events where business_id=p_business and event_type='outbound_click' and created_at>=now()-interval '30 days'),'bookings',(select count(*) from public.appointments where business_id=p_business and source in ('web','bot') and status in ('booked','confirmed','done') and created_at>=now()-interval '30 days'));
end $$;
create function public.prune_booking_referrals() returns void language plpgsql security definer set search_path='' as $$begin delete from public.booking_referral_events where created_at<now()-interval '90 days';delete from public.external_booking_reports where resolved_at<now()-interval '90 days';end$$;
revoke all on function public.business_referral_summary(uuid,uuid),public.prune_booking_referrals() from public,anon,authenticated;
grant execute on function public.business_referral_summary(uuid,uuid),public.prune_booking_referrals() to service_role;
commit;
