begin;

-- Separate from partner accounts and their media. Service-role routes enforce
-- the verified platform-admin allowlist; browser roles have no table/RPC access.
create table if not exists public.catalogue_photos (
  catalogue_id text primary key check (catalogue_id ~ '^sofia-[a-z0-9-]{3,80}$'),
  revision bigint not null default 0 check (revision >= 0),
  photo_id uuid unique,
  object_key text unique,
  width integer, height integer, byte_size integer, alt_text text,
  rights_basis text, rights_reference text,
  updated_by uuid not null,
  updated_at timestamptz not null default now(),
  constraint catalogue_photo_metadata check (
    (photo_id is null and object_key is null and width is null and height is null and byte_size is null and alt_text is null and rights_basis is null and rights_reference is null)
    or (photo_id is not null and object_key is not null and width is not null and height is not null and byte_size is not null
      and rights_basis is not null and rights_reference is not null
      and object_key = 'catalogue/' || catalogue_id || '/' || photo_id::text || '.webp'
      and width between 1 and 2000 and height between 1 and 2000 and byte_size between 1 and 1048576
      and alt_text is not null and char_length(alt_text) <= 160
      and rights_basis = 'owner_permission' and char_length(btrim(rights_reference)) between 5 and 160)
  )
);
create table if not exists public.catalogue_photo_audit (
  id uuid primary key default gen_random_uuid(), catalogue_id text not null,
  actor_id uuid not null, action text not null check (action in ('upload','remove')),
  previous_photo jsonb, photo_id uuid, created_at timestamptz not null default now()
);
create index if not exists catalogue_photo_audit_entry on public.catalogue_photo_audit(catalogue_id,created_at desc);
create table if not exists public.catalogue_photo_cleanup (
  object_key text primary key check (object_key ~ '^catalogue/sofia-[a-z0-9-]{3,80}/[0-9a-f-]{36}\.webp$'),
  byte_size integer not null check (byte_size between 1 and 1048576),
  not_before timestamptz not null default (now()+interval '1 day')
);
alter table public.catalogue_photos enable row level security;
alter table public.catalogue_photo_audit enable row level security;
alter table public.catalogue_photo_cleanup enable row level security;
revoke all on public.catalogue_photos,public.catalogue_photo_audit,public.catalogue_photo_cleanup from public,anon,authenticated;
grant select,insert,update,delete on public.catalogue_photos,public.catalogue_photo_cleanup to service_role;
grant select,insert on public.catalogue_photo_audit to service_role;

create or replace function public.reserve_catalogue_photo(p_catalogue text,p_photo uuid,p_bytes integer)
returns void language plpgsql security definer set search_path='' as $$
declare used bigint;
begin
  perform pg_advisory_xact_lock(830306);
  if p_catalogue is null or p_catalogue !~ '^sofia-[a-z0-9-]{3,80}$' or p_photo is null or p_bytes is null or p_bytes not between 1 and 1048576 then raise exception 'VALIDATION_ERROR'; end if;
  -- Includes pending uploads and replaced/private objects awaiting cleanup.
  select coalesce((select sum(byte_size) from public.catalogue_photos),0)
    + coalesce((select sum(q.byte_size) from public.catalogue_photo_cleanup q where not exists(select 1 from public.catalogue_photos p where p.object_key=q.object_key)),0) into used;
  if used+p_bytes>134217728 then raise exception 'CATALOGUE_MEDIA_LIMIT'; end if;
  insert into public.catalogue_photo_cleanup(object_key,byte_size)
    values('catalogue/'||p_catalogue||'/'||p_photo::text||'.webp',p_bytes);
end $$;

create or replace function public.change_catalogue_photo(p_catalogue text,p_actor uuid,p_revision bigint,p_action text,p_photo uuid default null,p_image jsonb default null)
returns void language plpgsql security definer set search_path='' as $$
declare old_photo public.catalogue_photos; previous jsonb; target_key text;
begin
  perform pg_advisory_xact_lock(830306);
  if p_catalogue is null or p_catalogue !~ '^sofia-[a-z0-9-]{3,80}$' or p_actor is null or p_revision is null or p_revision<0 then raise exception 'VALIDATION_ERROR'; end if;
  select * into old_photo from public.catalogue_photos where catalogue_id=p_catalogue for update;
  if coalesce(old_photo.revision,0)<>p_revision then raise exception 'CATALOGUE_PHOTO_CHANGED' using errcode='40001'; end if;
  previous:=case when old_photo.photo_id is not null then to_jsonb(old_photo) else null end;
  if p_action='upload' then
    target_key:='catalogue/'||p_catalogue||'/'||p_photo::text||'.webp';
    if p_photo is null or (p_image->>'consent') is distinct from 'true'
      or char_length(btrim(coalesce(p_image->>'rightsReference',''))) not between 5 and 160
      or not exists(select 1 from public.catalogue_photo_cleanup where object_key=target_key and byte_size=(p_image->>'bytes')::integer and not_before>now()) then raise exception 'VALIDATION_ERROR'; end if;
    insert into public.catalogue_photos(catalogue_id,revision,photo_id,object_key,width,height,byte_size,alt_text,rights_basis,rights_reference,updated_by)
      values(p_catalogue,p_revision+1,p_photo,target_key,(p_image->>'width')::integer,(p_image->>'height')::integer,(p_image->>'bytes')::integer,
        coalesce(p_image->>'alt',''),'owner_permission',btrim(p_image->>'rightsReference'),p_actor)
      on conflict(catalogue_id) do update set revision=excluded.revision,photo_id=excluded.photo_id,object_key=excluded.object_key,
        width=excluded.width,height=excluded.height,byte_size=excluded.byte_size,alt_text=excluded.alt_text,
        rights_basis=excluded.rights_basis,rights_reference=excluded.rights_reference,updated_by=excluded.updated_by,updated_at=now();
    delete from public.catalogue_photo_cleanup where object_key=target_key;
  elsif p_action='remove' then
    if old_photo.photo_id is null then raise exception 'CATALOGUE_PHOTO_NOT_FOUND'; end if;
    update public.catalogue_photos set revision=revision+1,photo_id=null,object_key=null,width=null,height=null,byte_size=null,
      alt_text=null,rights_basis=null,rights_reference=null,updated_by=p_actor,updated_at=now() where catalogue_id=p_catalogue;
  else raise exception 'VALIDATION_ERROR'; end if;
  if old_photo.photo_id is not null then
    insert into public.catalogue_photo_cleanup(object_key,byte_size) values(old_photo.object_key,old_photo.byte_size)
      on conflict(object_key) do nothing;
  end if;
  insert into public.catalogue_photo_audit(catalogue_id,actor_id,action,previous_photo,photo_id) values(p_catalogue,p_actor,p_action,previous,p_photo);
end $$;
revoke all on function public.reserve_catalogue_photo(text,uuid,integer),public.change_catalogue_photo(text,uuid,bigint,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_catalogue_photo(text,uuid,integer),public.change_catalogue_photo(text,uuid,bigint,text,uuid,jsonb) to service_role;

-- Reuse the existing private bucket and server-only Storage policy. Do not
-- create public uploads or weaken policies if the existing bucket is absent.
do $$ begin
  if not exists(select 1 from storage.buckets where id='business-media' and not public) then raise exception 'PRIVATE_BUSINESS_MEDIA_BUCKET_REQUIRED'; end if;
end $$;
notify pgrst,'reload schema';
commit;
