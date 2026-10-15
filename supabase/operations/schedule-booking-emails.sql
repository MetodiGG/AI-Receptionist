-- OPTIONAL operator step, separate from the schema migration. Run only after
-- approval, with live sending still OFF. The operator must privately put the
-- same >=32-character random value in Vercel CRON_SECRET and Supabase Vault
-- under the name gorez_booking_cron_secret. Never paste that value into Git,
-- SQL Editor history, a screenshot or chat.
begin;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.dispatch_booking_emails()
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  cron_secret text;
  request_id bigint;
begin
  select decrypted_secret into cron_secret from vault.decrypted_secrets
    where name = 'gorez_booking_cron_secret';
  if cron_secret is null or length(cron_secret) < 32 then
    raise exception 'Configure the booking scheduler secret in Vault first';
  end if;
  select net.http_post(
    url := 'https://www.gorez.co/api/cron/notifications',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || cron_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) into request_id;
  return request_id;
end $$;
revoke all on function public.dispatch_booking_emails() from public, anon, authenticated, service_role;

-- Named scheduling updates the same job instead of adding another runner.
select cron.schedule('gorez-booking-emails', '*/5 * * * *', 'select public.dispatch_booking_emails();');
commit;
