-- Platform moderation is separate from the owner's publication preference.
-- Existing businesses keep their current visibility. No records are deleted.
begin;

alter table public.businesses
  add column if not exists platform_status text not null default 'enabled'
    check (platform_status in ('enabled', 'suspended', 'archived')),
  add column if not exists platform_revision integer not null default 0;

create table if not exists public.platform_admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  business_id uuid not null,
  business_name text not null,
  business_slug text not null,
  action text not null check (action in ('publish','suspend','archive','restore','delete')),
  reason text not null,
  previous_status text not null,
  next_status text not null,
  created_at timestamptz not null default now()
);
create index if not exists platform_admin_audit_created_idx on public.platform_admin_audit(created_at desc);
alter table public.platform_admin_audit enable row level security;
revoke all on public.platform_admin_audit from public, anon, authenticated;
grant select, insert on public.platform_admin_audit to service_role;

-- Invoker security is intentional: a business owner may not undo moderation
-- through their ordinary authenticated Data API access.
create or replace function public.protect_platform_business_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('postgres','supabase_admin','service_role') then
    if (tg_op = 'INSERT' and (new.platform_status <> 'enabled' or new.platform_revision <> 0))
      or (tg_op = 'UPDATE' and (new.platform_status is distinct from old.platform_status
        or new.platform_revision is distinct from old.platform_revision)) then
      raise exception 'Platform moderation is administrator-only' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.protect_platform_business_fields() from public, anon, authenticated;
drop trigger if exists protect_platform_business_fields on public.businesses;
create trigger protect_platform_business_fields before insert or update on public.businesses
  for each row execute function public.protect_platform_business_fields();

-- Final race guard, also covering direct owner booking inserts. Existing visits
-- may still be completed/cancelled; a hidden business cannot accept new ones.
create or replace function public.enforce_platform_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare b public.businesses;
begin
  if new.status in ('booked','confirmed') and
    (tg_op = 'INSERT' or new.business_id is distinct from old.business_id
      or new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at
      or new.staff_id is distinct from old.staff_id or new.service_id is distinct from old.service_id
      or old.status not in ('booked','confirmed')) then
    select * into b from public.businesses where id = new.business_id for share;
    if not found or not b.active or b.platform_status <> 'enabled' then
      raise exception 'BUSINESS_NOT_BOOKABLE' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_platform_booking_status() from public, anon, authenticated;
drop trigger if exists enforce_platform_booking_status on public.appointments;
create trigger enforce_platform_booking_status before insert or update on public.appointments
  for each row execute function public.enforce_platform_booking_status();

-- One transaction: state, deletion and audit either all commit or all roll back.
-- HTTP authorization is checked against Supabase Auth + the server allowlist.
create or replace function public.platform_business_action(
  p_business_id uuid, p_actor_id uuid, p_action text, p_revision integer,
  p_confirmation text, p_reason text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b public.businesses; next_state text; next_active boolean; upcoming integer;
begin
  if p_actor_id is null or p_action not in ('publish','suspend','archive','restore','delete')
    or p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception 'INVALID_ADMIN_ACTION' using errcode = '22023';
  end if;
  select * into b from public.businesses where id = p_business_id for update;
  if not found then raise exception 'BUSINESS_NOT_FOUND' using errcode = 'P0002'; end if;
  if p_revision is null or b.platform_revision <> p_revision then
    raise exception 'BUSINESS_CHANGED' using errcode = '40001';
  end if;
  if p_confirmation is distinct from b.slug then
    raise exception 'CONFIRMATION_MISMATCH' using errcode = '22023';
  end if;
  next_state := b.platform_status; next_active := b.active;
  if p_action = 'publish' then
    if b.platform_status = 'archived' then raise exception 'RESTORE_FIRST' using errcode = '22023'; end if;
    if not exists (select 1 from public.services where business_id=b.id and active)
      or not exists (select 1 from public.staff where business_id=b.id and active)
      or not exists (select 1 from public.working_hours h join public.staff s on s.id=h.staff_id
        where h.business_id=b.id and s.business_id=b.id and s.active) then
      raise exception 'SETUP_REQUIRED' using errcode = '22023';
    end if;
    next_state := 'enabled'; next_active := true;
  elsif p_action = 'suspend' then
    if b.platform_status = 'archived' then raise exception 'RESTORE_FIRST' using errcode = '22023'; end if;
    next_state := 'suspended';
  elsif p_action = 'archive' then
    if b.platform_status = 'archived' then raise exception 'BUSINESS_CHANGED' using errcode = '40001'; end if;
    next_state := 'archived';
    update public.notification_outbox set status='skipped', last_error='BUSINESS_ARCHIVED',
      claim_token=null, locked_until=null
      where business_id=b.id and status in ('pending','failed','processing');
  elsif p_action = 'restore' then
    if b.platform_status <> 'archived' then raise exception 'BUSINESS_CHANGED' using errcode = '40001'; end if;
    -- Restoration must never silently republish a deleted business.
    next_state := 'suspended';
  elsif p_action = 'delete' then
    if b.platform_status <> 'archived' then raise exception 'ARCHIVE_FIRST' using errcode = '22023'; end if;
    select count(*) into upcoming from public.appointments where business_id=b.id
      and status in ('booked','confirmed') and ends_at > now();
    if upcoming > 0 then raise exception 'UPCOMING_BOOKINGS' using errcode = '23514'; end if;
    next_state := 'deleted';
  end if;
  insert into public.platform_admin_audit(actor_id,business_id,business_name,business_slug,action,reason,previous_status,next_status)
    values(p_actor_id,b.id,b.name,b.slug,p_action,btrim(p_reason),
      case when b.platform_status='enabled' and not b.active then 'unpublished' else b.platform_status end,next_state);
  if p_action='delete' then
    -- Only this business and its FK dependants, NEVER the owner's Auth identity.
    delete from public.businesses where id=b.id;
    return jsonb_build_object('deleted',true,'id',b.id);
  end if;
  update public.businesses set platform_status=next_state, active=next_active,
    platform_revision=platform_revision+1 where id=b.id;
  return jsonb_build_object('id',b.id,'platform_status',next_state,'active',next_active,'platform_revision',b.platform_revision+1);
end;
$$;
revoke all on function public.platform_business_action(uuid,uuid,text,integer,text,text) from public, anon, authenticated;
grant execute on function public.platform_business_action(uuid,uuid,text,integer,text,text) to service_role;
commit;
