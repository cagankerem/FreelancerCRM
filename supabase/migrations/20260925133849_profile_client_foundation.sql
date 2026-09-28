-- No fixture data. Supabase owns the auth schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;

create function private.valid_text(value text, maximum integer, required boolean default false)
returns boolean language sql immutable set search_path = '' as $$
  select case when value is null then not required else
    char_length(value) <= maximum and value = normalize(value, NFC)
    and position(chr(13) in value) = 0
    and (not required or value ~ '[^[:space:]]') end
$$;
revoke all on function private.valid_text(text,integer,boolean) from public;
grant execute on function private.valid_text(text,integer,boolean) to authenticated, service_role;

create function private.stamp_record() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id then raise exception 'immutable_identity' using errcode='23514'; end if;
    if to_jsonb(old) ? 'user_id' and to_jsonb(new)->'user_id' is distinct from to_jsonb(old)->'user_id' then
      raise exception 'immutable_owner' using errcode='23514';
    end if;
    new.created_at := old.created_at; new.lock_version := old.lock_version + 1;
  else new.created_at := clock_timestamp(); new.lock_version := 0;
  end if;
  new.updated_at := clock_timestamp(); return new;
end $$;
revoke all on function private.stamp_record() from public, anon, authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (private.valid_text(full_name,200)),
  profession text check (private.valid_text(profession,120)),
  default_currency text check (default_currency in ('TRY','USD','EUR')),
  brand_name text check (private.valid_text(brand_name,200)),
  public_email text check (private.valid_text(public_email,254)),
  public_phone text check (private.valid_text(public_phone,32)),
  website_url text check (private.valid_text(website_url,2048) and (website_url is null or website_url ~ '^https?://[^[:space:]]+$')),
  logo_path text check (private.valid_text(logo_path,512)),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  lock_version bigint not null default 0 check (lock_version >= 0),
  constraint completed_profile check (onboarding_completed_at is null or
    (private.valid_text(full_name,200,true) and private.valid_text(profession,120,true) and default_currency is not null))
);
create trigger profiles_stamp before insert or update on public.profiles for each row execute function private.stamp_record();
alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy profiles_insert on public.profiles for insert to authenticated with check (id=(select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
revoke all on public.profiles from anon, authenticated, service_role;
grant select on public.profiles to authenticated, service_role;
grant insert(id,full_name,profession,default_currency,brand_name,public_email,public_phone,website_url,onboarding_completed_at),
  update(full_name,profession,default_currency,brand_name,public_email,public_phone,website_url,onboarding_completed_at)
  on public.profiles to authenticated;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (private.valid_text(name,200,true)),
  company_name text check (private.valid_text(company_name,200)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  lock_version bigint not null default 0 check (lock_version>=0), unique(id,user_id)
);
create index clients_owner_updated_idx on public.clients(user_id,updated_at desc,id);
create trigger clients_stamp before insert or update on public.clients for each row execute function private.stamp_record();
alter table public.clients enable row level security;
create policy clients_owner on public.clients for all to authenticated
  using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
revoke all on public.clients from anon, authenticated, service_role;
grant select, delete on public.clients to authenticated;
grant select on public.clients to service_role;
grant insert(id,user_id,name,company_name), update(name,company_name) on public.clients to authenticated;
