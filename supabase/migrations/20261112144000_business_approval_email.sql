-- First-publication owner notices. No HTTP calls, credentials, Auth changes,
-- booking-outbox changes or messages to existing business owners.
begin;

-- Make the initial no-backfill boundary atomic with concurrent registrations.
lock table public.businesses in share row exclusive mode;
do $migration$
begin
  if to_regclass('public.business_approval_email_outbox') is null then
    create table public.business_approval_email_outbox (
      id uuid primary key default gen_random_uuid(),
      business_id uuid not null unique references public.businesses(id) on delete cascade,
      owner_id uuid not null,
      recipient text check (recipient is null or (length(recipient) <= 320 and recipient !~ '[[:space:]]')),
      locale text not null default 'bg' check (locale in ('bg','en')),
      status text not null default 'pending' check (status in ('pending','processing','sent','failed','skipped')),
      scheduled_for timestamptz not null default now(),
      attempts smallint not null default 0 check (attempts between 0 and 3),
      claim_token uuid,
      locked_until timestamptz,
      first_attempt_at timestamptz,
      provider_message_id text,
      payload jsonb,
      last_error text,
      created_at timestamptz not null default now(),
      sent_at timestamptz,
      check (status = 'skipped' or recipient is not null),
      check (payload is null or (jsonb_typeof(payload)='object' and octet_length(payload::text) <= 65536))
    );
    alter table public.business_approval_email_outbox enable row level security;
    -- A terminal first-publication ledger, NOT a queue/backfill. No old owner
    -- addresses are copied. Re-publishing old profiles must not send a notice.
    insert into public.business_approval_email_outbox (business_id,owner_id,status,last_error)
      select id,owner_id,'skipped','PREEXISTING_BUSINESS' from public.businesses;
  end if;
end
$migration$;

alter table public.business_approval_email_outbox enable row level security;
revoke all on table public.business_approval_email_outbox from public,anon,authenticated,service_role;
grant select,update on table public.business_approval_email_outbox to service_role;
create index if not exists business_approval_email_pending_idx
  on public.business_approval_email_outbox (scheduled_for,created_at,id)
  where status in ('pending','failed','processing');

create or replace function public.queue_business_approval_email()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient_email text; owner_confirmed timestamptz;
begin
  if not new.active or new.platform_status <> 'enabled' then return new; end if;
  if tg_op='UPDATE' then
    if old.active and old.platform_status='enabled' then return new; end if;
  end if;
  select lower(trim(u.email)),u.email_confirmed_at into recipient_email,owner_confirmed
    from auth.users u where u.id=new.owner_id;
  if recipient_email is null or length(recipient_email)>320 or recipient_email ~ '[[:space:]]'
    or recipient_email !~ '^[^@]+@[^@]+\.[^@]+$' or owner_confirmed is null then
    -- Publication is never undone by an unavailable owner mailbox. Keep a
    -- terminal ledger rather than later notifying a different/replaced owner.
    insert into public.business_approval_email_outbox (business_id,owner_id,status,last_error)
      values (new.id,new.owner_id,'skipped','OWNER_EMAIL_UNAVAILABLE')
      on conflict (business_id) do nothing;
    return new;
  end if;
  insert into public.business_approval_email_outbox (business_id,owner_id,recipient,locale)
    values (new.id,new.owner_id,recipient_email,case when new.notification_locale='en' then 'en' else 'bg' end)
    on conflict (business_id) do nothing;
  return new;
end $$;

drop trigger if exists queue_business_approval_email on public.businesses;
create trigger queue_business_approval_email after insert or update of active,platform_status on public.businesses
  for each row execute function public.queue_business_approval_email();

create or replace function public.claim_business_approval_email(p_business_id uuid default null)
returns setof public.business_approval_email_outbox language plpgsql security definer set search_path='' as $$
begin
  -- Do not retry an ambiguous provider acceptance after its 24h idempotency
  -- window, or leave an expired processing claim looking live indefinitely.
  update public.business_approval_email_outbox set status='skipped',claim_token=null,locked_until=null,
    last_error=case when first_attempt_at <= now()-interval '23 hours' then 'IDEMPOTENCY_WINDOW_EXPIRED' else 'APPROVAL_NOTICE_EXPIRED' end
    where status in ('pending','failed','processing')
      and (created_at <= now()-interval '7 days' or first_attempt_at <= now()-interval '23 hours');
  update public.business_approval_email_outbox set status='failed',claim_token=null,locked_until=null,last_error='RETRY_LIMIT_REACHED'
    where status='processing' and locked_until < now() and attempts>=3;
  -- Keep only the non-replay publication ledger after the operational window.
  update public.business_approval_email_outbox set status='skipped',recipient=null,payload=null,provider_message_id=null,
    claim_token=null,locked_until=null,last_error='PUBLICATION_LEDGER_RETAINED'
    where created_at < now()-interval '90 days' and status in ('sent','failed','skipped')
      and (recipient is not null or payload is not null or provider_message_id is not null);
  return query with candidate as (
    select q.id from public.business_approval_email_outbox q
      where ((q.status in ('pending','failed') and q.scheduled_for<=now()) or (q.status='processing' and q.locked_until<now()))
        and q.attempts<3 and (p_business_id is null or q.business_id=p_business_id)
      order by q.scheduled_for,q.created_at,q.id limit 1 for update skip locked
  ) update public.business_approval_email_outbox q set status='processing',claim_token=gen_random_uuid(),
      locked_until=now()+interval '5 minutes',attempts=q.attempts+1,first_attempt_at=coalesce(q.first_attempt_at,now())
    from candidate where q.id=candidate.id returning q.*;
end $$;

create or replace function public.business_approval_email_current(p_id uuid,p_claim_token uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.business_approval_email_outbox q
      join public.businesses b on b.id=q.business_id
      join auth.users u on u.id=b.owner_id
    where q.id=p_id and q.claim_token=p_claim_token and q.status='processing' and q.locked_until>now()
      and q.first_attempt_at>now()-interval '23 hours' and q.created_at>now()-interval '7 days'
      and b.owner_id=q.owner_id and b.active and b.platform_status='enabled'
      and u.email_confirmed_at is not null and lower(trim(u.email))=q.recipient
  );
$$;

revoke all on function public.queue_business_approval_email(),public.claim_business_approval_email(uuid),public.business_approval_email_current(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.claim_business_approval_email(uuid),public.business_approval_email_current(uuid,uuid) to service_role;

commit;
