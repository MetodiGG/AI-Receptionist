-- Explicit service defaults, Bulgarian locations and recurring weekly breaks.
-- Additive: existing services, bookings, working hours and addresses are preserved.
begin;

alter table public.businesses
  add column if not exists default_duration_min integer not null default 45 check (default_duration_min between 5 and 1440),
  add column if not exists city_ekatte text check (city_ekatte ~ '^[0-9]{5}$'),
  add column if not exists city text check (char_length(city) between 1 and 100),
  add column if not exists neighborhood text check (char_length(neighborhood) <= 120);

alter table public.working_hours
  add column if not exists break_start time,
  add column if not exists break_end time;

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.working_hours'::regclass and conname = 'working_hours_break_check') then
    alter table public.working_hours add constraint working_hours_break_check check (
      (break_start is null and break_end is null) or
      (break_start is not null and break_end is not null and break_start >= open_time and break_end <= close_time
       and break_end > break_start and (break_start > open_time or break_end < close_time))
    );
  end if;
end $$;

create or replace function public.replace_working_hours(input_business_id uuid, input_staff_id uuid, input_hours jsonb)
returns void language plpgsql set search_path = public as $$
declare
  business_zone text;
begin
  if not public.owns_business(input_business_id) then
    raise exception 'Business access denied' using errcode = '42501';
  end if;
  if not exists (select 1 from public.staff where id = input_staff_id and business_id = input_business_id) then
    raise exception 'Staff member does not belong to this business' using errcode = '23514';
  end if;
  if input_hours is null or jsonb_typeof(input_hours) <> 'array' or jsonb_array_length(input_hours) > 7 then
    raise exception 'Working hours must be an array with up to seven entries' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(input_hours) as h(weekday smallint, open_time time, close_time time, break_start time, break_end time)
    where h.weekday is null or h.weekday not between 1 and 7 or h.open_time is null or h.close_time is null
      or h.close_time <= h.open_time or (h.break_start is null) <> (h.break_end is null)
      or (h.break_start is not null and (h.break_start < h.open_time or h.break_end > h.close_time or h.break_end <= h.break_start
          or (h.break_start = h.open_time and h.break_end = h.close_time)))
  ) then
    raise exception 'Invalid working hours or break' using errcode = '22023';
  end if;
  if (select count(*) <> count(distinct h.weekday) from jsonb_to_recordset(input_hours) as h(weekday smallint)) then
    raise exception 'Each weekday may appear only once' using errcode = '22023';
  end if;

  -- Serialize booking and schedule writes for this tenant. A booking cannot
  -- slip between validation of a closure and saving that closure.
  perform pg_advisory_xact_lock(hashtextextended(input_business_id::text, 0));
  select timezone into business_zone from public.businesses where id = input_business_id;
  if exists (
    select 1 from public.appointments a
    where a.business_id = input_business_id and a.staff_id = input_staff_id
      and a.status in ('booked', 'confirmed') and a.ends_at > now()
      and not exists (
        select 1 from jsonb_to_recordset(input_hours) as h(weekday smallint, open_time time, close_time time, break_start time, break_end time)
        where h.weekday = extract(isodow from a.starts_at at time zone business_zone)
          and (a.starts_at at time zone business_zone)::date = (a.ends_at at time zone business_zone)::date
          and (a.starts_at at time zone business_zone)::time >= h.open_time
          and (a.ends_at at time zone business_zone)::time <= h.close_time
          and (h.break_start is null or (a.ends_at at time zone business_zone)::time <= h.break_start
               or (a.starts_at at time zone business_zone)::time >= h.break_end)
      )
  ) then
    raise exception 'SCHEDULE_CONFLICT: existing bookings overlap the proposed closure' using errcode = '23P01';
  end if;

  delete from public.working_hours where business_id = input_business_id and staff_id = input_staff_id;
  insert into public.working_hours (business_id, staff_id, weekday, open_time, close_time, break_start, break_end)
    select input_business_id, input_staff_id, h.weekday, h.open_time, h.close_time, h.break_start, h.break_end
    from jsonb_to_recordset(input_hours) as h(weekday smallint, open_time time, close_time time, break_start time, break_end time);
end;
$$;
revoke all privileges on function public.replace_working_hours(uuid, uuid, jsonb) from public, anon;
grant execute on function public.replace_working_hours(uuid, uuid, jsonb) to authenticated, service_role;

create or replace function public.enforce_booking_schedule()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  bid uuid;
  business_zone text;
  local_start timestamp;
  local_end timestamp;
  service_minutes integer;
begin
  if tg_op = 'DELETE' then bid := old.business_id; else bid := new.business_id; end if;
  perform pg_advisory_xact_lock(hashtextextended(bid::text, 0));
  if tg_op = 'DELETE' then return old; end if;
  if tg_table_name = 'working_hours' then return new; end if;

  if tg_table_name = 'time_off' then
    if exists (
      select 1 from public.appointments a where a.business_id = new.business_id
        and (new.staff_id is null or a.staff_id = new.staff_id)
        and a.status in ('booked', 'confirmed') and a.starts_at < new.ends_at and a.ends_at > new.starts_at
    ) then
      raise exception 'SCHEDULE_CONFLICT: existing booking overlaps this time off' using errcode = '23P01';
    end if;
    return new;
  end if;

  if new.status not in ('booked', 'confirmed') then return new; end if;
  -- Existing bookings retain their agreed duration. Confirming one or editing
  -- its notes must not silently adopt a later change to service duration.
  if tg_op = 'UPDATE' then
    if old.status in ('booked', 'confirmed') and old.staff_id = new.staff_id and old.service_id = new.service_id
      and old.starts_at = new.starts_at and old.ends_at = new.ends_at then return new; end if;
  end if;
  select timezone into business_zone from public.businesses where id = new.business_id;
  select duration_min into service_minutes from public.services where id = new.service_id and business_id = new.business_id and active;
  if service_minutes is null or new.ends_at < new.starts_at + make_interval(mins => service_minutes) then
    raise exception 'SCHEDULE_UNAVAILABLE: booking is shorter than the selected service' using errcode = '23514';
  end if;
  if not exists (select 1 from public.staff where id = new.staff_id and business_id = new.business_id and active) then
    raise exception 'SCHEDULE_UNAVAILABLE: staff member is not available' using errcode = '23514';
  end if;
  local_start := new.starts_at at time zone business_zone;
  local_end := new.ends_at at time zone business_zone;
  if local_start::date <> local_end::date or not exists (
    select 1 from public.working_hours h where h.business_id = new.business_id and h.staff_id = new.staff_id
      and h.weekday = extract(isodow from local_start) and local_start::time >= h.open_time and local_end::time <= h.close_time
      and (h.break_start is null or local_end::time <= h.break_start or local_start::time >= h.break_end)
  ) or exists (
    select 1 from public.time_off t where t.business_id = new.business_id and (t.staff_id is null or t.staff_id = new.staff_id)
      and new.starts_at < t.ends_at and new.ends_at > t.starts_at
  ) then
    raise exception 'SCHEDULE_UNAVAILABLE: booking overlaps a break, closure or time off' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all privileges on function public.enforce_booking_schedule() from public, anon, authenticated;

drop trigger if exists enforce_booking_schedule on public.appointments;
create trigger enforce_booking_schedule before insert or update on public.appointments for each row execute function public.enforce_booking_schedule();
drop trigger if exists enforce_booking_schedule on public.time_off;
create trigger enforce_booking_schedule before insert or update or delete on public.time_off for each row execute function public.enforce_booking_schedule();
drop trigger if exists enforce_booking_schedule on public.working_hours;
create trigger enforce_booking_schedule before insert or update or delete on public.working_hours for each row execute function public.enforce_booking_schedule();

notify pgrst, 'reload schema';
commit;
