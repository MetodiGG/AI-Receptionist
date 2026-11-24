-- Fence older deployed address matchers from the strict postal RPCs. Apply
-- atomically after 20261124205000; do not expose an intermediate state.
-- Function DDL only: no business, lookup, appointment or notification writes.
begin;

do $guard$
declare
  claim_definition text;
  finish_definition text;
  claim_prefix constant text:='CREATE OR REPLACE FUNCTION public.claim_registration_address_lookup(';
  finish_prefix constant text:='CREATE OR REPLACE FUNCTION public.finish_registration_address_lookup(';
begin
  if to_regclass('public.business_location_changes') is null
    or (select count(*) from information_schema.columns where table_schema='public'
      and (table_name,column_name) in (
        ('businesses','location_revision'),
        ('registration_address_lookup_cache','claim_location_revision'),
        ('registration_location_sources','match_version'),
        ('registration_location_sources','location_revision'),
        ('business_place_links','location_revision')
      ))<>5 then
    raise exception 'SOFIA_LOCATION_RPC_PREDECESSOR_REQUIRED';
  end if;
  if exists (select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in (
      'claim_registration_address_lookup_v2','finish_registration_address_lookup_v2'
    )) then
    raise exception 'SOFIA_LOCATION_RPC_ALREADY_ISOLATED';
  end if;
  if (select count(*) from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in (
      'claim_registration_address_lookup','finish_registration_address_lookup'
    ))<>2
    or coalesce((select md5(p.prosrc) from pg_catalog.pg_proc p where
      p.oid=to_regprocedure('public.claim_registration_address_lookup(uuid)')),'')
      <>'c894127e3eb4bd6703a2ebc20d57befa'
    or coalesce((select md5(p.prosrc) from pg_catalog.pg_proc p where
      p.oid=to_regprocedure('public.finish_registration_address_lookup(uuid,text,uuid,text,jsonb,integer)')),'')
      <>'9cba4c6171657cf7cb6ba8a6a33fbfb0'
    or not exists (select 1 from pg_catalog.pg_proc p where
      p.oid=to_regprocedure('public.claim_registration_address_lookup(uuid)')
      and p.prosecdef and not p.proretset and p.prorettype='jsonb'::regtype
      and p.proconfig=array['search_path=""']
      and p.proargnames=array['p_business'] and p.pronargdefaults=0)
    or not exists (select 1 from pg_catalog.pg_proc p where
      p.oid=to_regprocedure('public.finish_registration_address_lookup(uuid,text,uuid,text,jsonb,integer)')
      and p.prosecdef and not p.proretset and p.prorettype='jsonb'::regtype
      and p.proconfig=array['search_path=""']
      and p.proargnames=array['p_business','p_address_key','p_claim_token','p_status','p_result','p_retry_after_seconds']
      and p.pronargdefaults=2) then
    raise exception 'SOFIA_LOCATION_RPC_DEFINITION_CHANGED';
  end if;
  claim_definition:=pg_get_functiondef(to_regprocedure('public.claim_registration_address_lookup(uuid)'));
  finish_definition:=pg_get_functiondef(to_regprocedure('public.finish_registration_address_lookup(uuid,text,uuid,text,jsonb,integer)'));
  if left(claim_definition,length(claim_prefix))<>claim_prefix
    or left(finish_definition,length(finish_prefix))<>finish_prefix then
    raise exception 'SOFIA_LOCATION_RPC_DEFINITION_HEADER_CHANGED';
  end if;
  -- Change only the canonical leading function name. Retain the exact reviewed
  -- body, arguments, defaults, security mode and empty search path.
  execute 'CREATE OR REPLACE FUNCTION public.claim_registration_address_lookup_v2('
    ||substring(claim_definition from length(claim_prefix)+1);
  execute 'CREATE OR REPLACE FUNCTION public.finish_registration_address_lookup_v2('
    ||substring(finish_definition from length(finish_prefix)+1);
end
$guard$;

-- A legacy caller cannot acquire a fresh token, consume the provider budget,
-- read cached evidence or complete a token acquired before/during rollout.
-- Keep the original named arguments/defaults for a harmless old-app response.
-- Replace in place: old prepared/cached calls keep the legacy OID, now a stub.
create or replace function public.claim_registration_address_lookup(p_business uuid)
returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('state','review_required');
$$;

create or replace function public.finish_registration_address_lookup(
  p_business uuid,p_address_key text,p_claim_token uuid,p_status text,
  p_result jsonb default null,p_retry_after_seconds integer default null)
returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('state','stale_claim','applied',false);
$$;

revoke all on function public.claim_registration_address_lookup(uuid),
  public.finish_registration_address_lookup(uuid,text,uuid,text,jsonb,integer),
  public.claim_registration_address_lookup_v2(uuid),
  public.finish_registration_address_lookup_v2(uuid,text,uuid,text,jsonb,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.claim_registration_address_lookup(uuid),
  public.finish_registration_address_lookup(uuid,text,uuid,text,jsonb,integer),
  public.claim_registration_address_lookup_v2(uuid),
  public.finish_registration_address_lookup_v2(uuid,text,uuid,text,jsonb,integer)
  to service_role;

commit;
