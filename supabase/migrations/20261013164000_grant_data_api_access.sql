-- Supabase projects created with automatic Data API grants disabled need
-- explicit table privileges in addition to Row Level Security policies.
begin;

grant usage on schema public to authenticated, service_role;

-- The public booking experience must go through a trusted server endpoint.
-- Anonymous browser clients do not receive direct access to tenant data.
revoke all privileges on table
  public.businesses,
  public.services,
  public.staff,
  public.working_hours,
  public.customers,
  public.appointments,
  public.messages
from anon;

grant select, insert, update, delete on table
  public.businesses,
  public.services,
  public.staff,
  public.working_hours,
  public.customers,
  public.appointments,
  public.messages
to authenticated, service_role;

-- Functions are executable by PUBLIC in PostgreSQL unless that privilege is
-- revoked explicitly. Keep the RLS helper available only to trusted roles.
revoke all privileges on function public.owns_business(uuid) from public, anon;
grant execute on function public.owns_business(uuid) to authenticated, service_role;

commit;
