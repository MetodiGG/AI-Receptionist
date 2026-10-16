-- Future profiles need administrator review. Existing visibility is preserved.
begin;
alter table public.businesses drop constraint if exists businesses_platform_status_check;
alter table public.businesses add constraint businesses_platform_status_check
  check (platform_status in ('enabled','pending','suspended','archived'));
alter table public.businesses alter column platform_status set default 'pending';

create or replace function public.protect_platform_business_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('postgres','supabase_admin','service_role') then
    if (tg_op = 'INSERT' and (new.platform_status <> 'pending' or new.platform_revision <> 0))
      or (tg_op = 'UPDATE' and (new.platform_status is distinct from old.platform_status
        or new.platform_revision is distinct from old.platform_revision)) then
      raise exception 'Platform moderation is administrator-only' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.protect_platform_business_fields() from public, anon, authenticated;
commit;
