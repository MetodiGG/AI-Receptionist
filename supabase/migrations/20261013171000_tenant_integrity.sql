-- Prevent authenticated clients from linking rows that belong to different tenants.
-- RLS protects each row by business_id; these triggers also validate every referenced row.
begin;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'businesses_booking_window_days_check') then
    alter table public.businesses add constraint businesses_booking_window_days_check
      check (booking_window_days between 1 and 365);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_minimum_notice_minutes_check') then
    alter table public.businesses add constraint businesses_minimum_notice_minutes_check
      check (minimum_notice_minutes between 0 and 10080);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_cancellation_notice_hours_check') then
    alter table public.businesses add constraint businesses_cancellation_notice_hours_check
      check (cancellation_notice_hours between 0 and 720);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_booking_slot_minutes_check') then
    alter table public.businesses add constraint businesses_booking_slot_minutes_check
      check (booking_slot_minutes between 5 and 120);
  end if;
end $$;

create unique index if not exists working_hours_staff_weekday_idx
  on public.working_hours (staff_id, weekday);

create or replace function public.enforce_tenant_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'working_hours' then
    if not exists (select 1 from public.staff where id = new.staff_id and business_id = new.business_id) then
      raise exception 'Staff member does not belong to this business' using errcode = '23514';
    end if;
  elsif tg_table_name = 'appointments' then
    if not exists (select 1 from public.staff where id = new.staff_id and business_id = new.business_id)
      or not exists (select 1 from public.services where id = new.service_id and business_id = new.business_id)
      or not exists (select 1 from public.customers where id = new.customer_id and business_id = new.business_id) then
      raise exception 'Appointment references rows from another business' using errcode = '23514';
    end if;
  elsif tg_table_name = 'messages' then
    if not exists (select 1 from public.customers where id = new.customer_id and business_id = new.business_id)
      or (new.conversation_id is not null and not exists (
        select 1 from public.conversations where id = new.conversation_id and business_id = new.business_id
      )) then
      raise exception 'Message references rows from another business' using errcode = '23514';
    end if;
  elsif tg_table_name = 'staff_services' then
    if not exists (select 1 from public.staff where id = new.staff_id and business_id = new.business_id)
      or not exists (select 1 from public.services where id = new.service_id and business_id = new.business_id) then
      raise exception 'Staff-service link references rows from another business' using errcode = '23514';
    end if;
  elsif tg_table_name = 'time_off' then
    if new.staff_id is not null and not exists (
      select 1 from public.staff where id = new.staff_id and business_id = new.business_id
    ) then
      raise exception 'Time off references a staff member from another business' using errcode = '23514';
    end if;
  elsif tg_table_name = 'conversations' then
    if new.customer_id is not null and not exists (
      select 1 from public.customers where id = new.customer_id and business_id = new.business_id
    ) then
      raise exception 'Conversation references a customer from another business' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all privileges on function public.enforce_tenant_integrity() from public, anon, authenticated;

create or replace function public.replace_working_hours(
  input_business_id uuid,
  input_staff_id uuid,
  input_hours jsonb
)
returns void
language plpgsql
set search_path = public
as $$
begin
  if not public.owns_business(input_business_id) then
    raise exception 'Business access denied' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.staff where id = input_staff_id and business_id = input_business_id
  ) then
    raise exception 'Staff member does not belong to this business' using errcode = '23514';
  end if;
  if input_hours is null or jsonb_typeof(input_hours) <> 'array' or jsonb_array_length(input_hours) > 7 then
    raise exception 'Working hours must be an array with up to seven entries' using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(input_hours) as item(weekday smallint, open_time time, close_time time)
    where item.weekday not between 1 and 7 or item.close_time <= item.open_time
  ) then
    raise exception 'Invalid working hours' using errcode = '22023';
  end if;
  if (
    select count(*) <> count(distinct item.weekday)
    from jsonb_to_recordset(input_hours) as item(weekday smallint, open_time time, close_time time)
  ) then
    raise exception 'Each weekday may appear only once' using errcode = '22023';
  end if;

  delete from public.working_hours
  where business_id = input_business_id and staff_id = input_staff_id;

  insert into public.working_hours (business_id, staff_id, weekday, open_time, close_time)
  select input_business_id, input_staff_id, item.weekday, item.open_time, item.close_time
  from jsonb_to_recordset(input_hours) as item(weekday smallint, open_time time, close_time time);
end;
$$;

revoke all privileges on function public.replace_working_hours(uuid, uuid, jsonb) from public, anon;
grant execute on function public.replace_working_hours(uuid, uuid, jsonb) to authenticated, service_role;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'working_hours',
    'appointments',
    'messages',
    'staff_services',
    'time_off',
    'conversations'
  ] loop
    execute format('drop trigger if exists enforce_tenant_integrity on public.%I', target_table);
    execute format(
      'create trigger enforce_tenant_integrity before insert or update on public.%I
       for each row execute function public.enforce_tenant_integrity()',
      target_table
    );
  end loop;
end $$;

commit;
