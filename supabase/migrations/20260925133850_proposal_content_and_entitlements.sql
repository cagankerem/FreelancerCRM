-- Minimum subscription state: no billing provider, price or Pro quota assumptions.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_code text not null default 'free' check (plan_code in ('free','pro')),
  status text not null default 'free' check (status in ('free','active','trialing','past_due','canceled','expired','incomplete')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  lock_version bigint not null default 0 check (lock_version>=0),
  check (plan_code <> 'pro' or status <> 'active' or current_period_end is not null)
);
create index subscriptions_status_period_idx on public.subscriptions(status,current_period_end);
create trigger subscriptions_stamp before insert or update on public.subscriptions for each row execute function private.stamp_record();
alter table public.subscriptions enable row level security;
create policy subscriptions_read on public.subscriptions for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.subscriptions from anon, authenticated, service_role;
grant select on public.subscriptions to authenticated, service_role;

create function private.is_pro(owner_id uuid) returns boolean language sql volatile set search_path = '' as $$
  select exists(select 1 from public.subscriptions where user_id=owner_id and plan_code='pro'
    and status='active' and current_period_end > clock_timestamp())
$$;

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid,
  client_name text check(private.valid_text(client_name,200)),
  client_company text check(private.valid_text(client_company,200)),
  project_name text check(private.valid_text(project_name,200)),
  start_date date, duration_text text check(private.valid_text(duration_text,200)),
  revision_limit integer check(revision_limit>=0),
  currency text check(currency in ('TRY','USD','EUR')),
  total_amount numeric(14,2) not null default 0 check(total_amount>=0 and total_amount<'Infinity'::numeric),
  tax_mode text check(tax_mode in ('included','excluded')),
  lifecycle_status text not null default 'draft' check(lifecycle_status in ('draft','published','revoked')),
  publication_mode text not null default 'locked' check(publication_mode in ('locked','live')),
  decision_status text not null default 'pending' check(decision_status in ('pending','accepted','rejected')),
  valid_until timestamptz, published_at timestamptz, revoked_at timestamptz, responded_at timestamptz,
  share_selector uuid unique, share_generation bigint not null default 0 check(share_generation>=0),
  share_key_version integer check(share_key_version>0),
  share_verifier_hash bytea check(octet_length(share_verifier_hash)=32),
  first_viewed_at timestamptz, last_viewed_at timestamptz,
  counted_view_count bigint not null default 0 check(counted_view_count>=0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  lock_version bigint not null default 0 check(lock_version>=0),
  foreign key(client_id,user_id) references public.clients(id,user_id) on delete set null (client_id),
  check ((decision_status='pending' and responded_at is null) or (decision_status<>'pending' and responded_at is not null)),
  check ((lifecycle_status='draft' and published_at is null and decision_status='pending' and revoked_at is null and share_selector is null and share_verifier_hash is null)
    or (lifecycle_status='published' and published_at is not null and revoked_at is null and share_selector is not null and share_verifier_hash is not null and share_key_version is not null and share_generation>0)
    or (lifecycle_status='revoked' and published_at is not null and revoked_at is not null and share_selector is null and share_verifier_hash is null)),
  check ((counted_view_count=0 and first_viewed_at is null and last_viewed_at is null)
    or (counted_view_count>0 and first_viewed_at is not null and last_viewed_at is not null and last_viewed_at>=first_viewed_at))
);
create unique index proposals_hash_unique on public.proposals(share_verifier_hash) where share_verifier_hash is not null;
create index proposals_owner_created_idx on public.proposals(user_id,created_at desc,id);
create index proposals_owner_status_idx on public.proposals(user_id,lifecycle_status,decision_status);
create index proposals_client_idx on public.proposals(client_id,user_id);
create index proposals_expiry_idx on public.proposals(valid_until) where lifecycle_status='published';
create index proposals_last_view_idx on public.proposals(last_viewed_at desc) where last_viewed_at is not null;

create table public.proposal_sections (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  section_key text not null check(section_key in ('summary','scope','deliverables','exclusions','timeline','revision_terms','payment_plan','additional_terms')),
  title text not null check(private.valid_text(title,120,true)), content text not null default '',
  sort_order integer not null check(sort_order>=0),
  source text not null default 'manual' check(source in ('manual','ai')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  lock_version bigint not null default 0 check(lock_version>=0), unique(proposal_id,section_key),
  check(private.valid_text(content,case section_key when 'scope' then 12000 when 'deliverables' then 8000
    when 'exclusions' then 6000 when 'additional_terms' then 8000 else 4000 end))
);
create index proposal_sections_order_idx on public.proposal_sections(proposal_id,sort_order,id);

create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  description text not null check(private.valid_text(description,2000,true)),
  quantity numeric(12,3) not null check(quantity>0 and quantity<'Infinity'::numeric),
  unit_label text check(private.valid_text(unit_label,32)),
  unit_price numeric(14,2) not null check(unit_price>=0 and unit_price<'Infinity'::numeric),
  line_total numeric(14,2) generated always as (round(quantity*unit_price,2)) stored,
  sort_order integer not null check(sort_order>=0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  lock_version bigint not null default 0 check(lock_version>=0), unique(proposal_id,sort_order)
);

alter table public.proposals enable row level security;
alter table public.proposal_sections enable row level security;
alter table public.proposal_items enable row level security;
create policy proposals_owner_read on public.proposals for select to authenticated using(user_id=(select auth.uid()));
create policy sections_owner_read on public.proposal_sections for select to authenticated using
  (exists(select 1 from public.proposals p where p.id=proposal_id and p.user_id=(select auth.uid())));
create policy items_owner_read on public.proposal_items for select to authenticated using
  (exists(select 1 from public.proposals p where p.id=proposal_id and p.user_id=(select auth.uid())));
revoke all on public.proposals,public.proposal_sections,public.proposal_items from anon,authenticated,service_role;
grant select on public.proposal_sections,public.proposal_items to authenticated,service_role;
grant select on public.proposals to service_role;
-- Sharing secrets never appear in the owner's regular Data API projection.
grant select(id,user_id,client_id,client_name,client_company,project_name,start_date,duration_text,revision_limit,
 currency,total_amount,tax_mode,lifecycle_status,publication_mode,decision_status,valid_until,published_at,revoked_at,
 responded_at,first_viewed_at,last_viewed_at,counted_view_count,created_at,updated_at,lock_version)
 on public.proposals to authenticated;

create function private.guard_proposal() returns trigger language plpgsql set search_path='' as $$
declare content_changed boolean;
begin
  if tg_op='DELETE' then
    if old.lifecycle_status<>'draft' and exists(select 1 from auth.users where id=old.user_id) then
      raise exception 'revoke_instead_of_delete' using errcode='23514';
    end if;
    return old;
  end if;
  if new.id<>old.id or new.user_id<>old.user_id then raise exception 'immutable_owner' using errcode='23514'; end if;
  content_changed := row(new.client_name,new.client_company,new.project_name,new.start_date,new.duration_text,new.revision_limit,new.currency,new.total_amount,new.tax_mode,new.valid_until)
    is distinct from row(old.client_name,old.client_company,old.project_name,old.start_date,old.duration_text,old.revision_limit,old.currency,old.total_amount,old.tax_mode,old.valid_until);
  if old.decision_status<>'pending' and (content_changed or new.decision_status<>old.decision_status or new.responded_at is distinct from old.responded_at) then
    raise exception 'answered_proposal_is_immutable' using errcode='23514';
  end if;
  if old.lifecycle_status<>'draft' and new.lifecycle_status='draft' then raise exception 'cannot_return_to_draft' using errcode='23514'; end if;
  if content_changed and old.lifecycle_status<>'draft' and not
    (private.is_pro(old.user_id) and old.decision_status='pending' and
      ((old.publication_mode='live' and old.lifecycle_status='published' and (old.valid_until is null or old.valid_until>clock_timestamp()))
       or (new.share_generation>old.share_generation and new.lifecycle_status='published'))) then
    raise exception 'published_content_locked' using errcode='23514';
  end if;
  new.created_at:=old.created_at;
  if content_changed then new.updated_at:=clock_timestamp(); new.lock_version:=old.lock_version+1; end if;
  return new;
end $$;
create trigger proposals_guard before update or delete on public.proposals for each row execute function private.guard_proposal();

create function private.guard_child() returns trigger language plpgsql set search_path='' as $$
declare parent public.proposals; target uuid;
begin
  target:=case when tg_op='DELETE' then old.proposal_id else new.proposal_id end;
  if tg_op='UPDATE' and (new.proposal_id<>old.proposal_id or new.id<>old.id) then raise exception 'immutable_parent' using errcode='23514'; end if;
  select * into parent from public.proposals where id=target for update;
  if not found and tg_op='DELETE' then return old; end if;
  if parent.decision_status<>'pending' then raise exception 'answered_proposal_is_immutable' using errcode='23514'; end if;
  if parent.lifecycle_status<>'draft' and not
    (private.is_pro(parent.user_id) and parent.publication_mode='live' and parent.lifecycle_status='published'
      and (parent.valid_until is null or parent.valid_until>clock_timestamp())) then
    raise exception 'published_content_locked' using errcode='23514';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create function private.refresh_proposal_total() returns trigger language plpgsql set search_path='' as $$
declare target uuid;
begin
  target:=case when tg_op='DELETE' then old.proposal_id else new.proposal_id end;
  update public.proposals set total_amount=(select coalesce(sum(line_total),0) from public.proposal_items where proposal_id=target),
    updated_at=clock_timestamp(),lock_version=lock_version+1 where id=target;
  return null;
end $$;
create function private.bump_section_version() returns trigger language plpgsql set search_path='' as $$
begin
  update public.proposals set lock_version=lock_version+1,updated_at=clock_timestamp()
    where id=case when tg_op='DELETE' then old.proposal_id else new.proposal_id end;
  return null;
end $$;
create trigger a_items_guard before insert or update or delete on public.proposal_items for each row execute function private.guard_child();
create trigger b_items_stamp before insert or update on public.proposal_items for each row execute function private.stamp_record();
create trigger items_total after insert or update or delete on public.proposal_items for each row execute function private.refresh_proposal_total();
create trigger a_sections_guard before insert or update or delete on public.proposal_sections for each row execute function private.guard_child();
create trigger b_sections_stamp before insert or update on public.proposal_sections for each row execute function private.stamp_record();
create trigger sections_version after insert or update or delete on public.proposal_sections for each row execute function private.bump_section_version();
revoke all on all functions in schema private from public,anon,authenticated,service_role;
grant execute on function private.valid_text(text,integer,boolean) to authenticated,service_role;
