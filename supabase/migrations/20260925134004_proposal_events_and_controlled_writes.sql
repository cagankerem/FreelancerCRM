create table public.proposal_responses (
  id bigint generated always as identity primary key,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  response_type text not null check(response_type in ('accepted','rejected','message')),
  message text,
  idempotency_key text not null unique check(private.valid_text(idempotency_key,128,true)),
  request_id text not null check(private.valid_text(request_id,64,true)),
  content_version bigint not null check(content_version>=0),
  share_generation bigint not null check(share_generation>0),
  created_at timestamptz not null default clock_timestamp(),
  check ((response_type='message' and private.valid_text(message,4000,true)) or (response_type<>'message' and message is null))
);
create unique index one_terminal_response on public.proposal_responses(proposal_id) where response_type in ('accepted','rejected');
create index responses_parent_time_idx on public.proposal_responses(proposal_id,created_at desc,id desc);

create table public.proposal_views (
  id bigint generated always as identity primary key,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  viewed_at timestamptz not null default clock_timestamp(), event_id uuid not null unique,
  dedupe_hash bytea check(octet_length(dedupe_hash)=32), dedupe_window_start timestamptz,
  user_agent_class text check(user_agent_class in ('browser','bot','preview','unknown')),
  is_suspected_bot boolean not null default false, is_counted boolean not null default false,
  check ((dedupe_hash is null)=(dedupe_window_start is null)),
  check (not is_suspected_bot or not is_counted)
);
create unique index views_dedupe_idx on public.proposal_views(proposal_id,dedupe_hash,dedupe_window_start) where dedupe_hash is not null;
create index views_parent_time_idx on public.proposal_views(proposal_id,viewed_at desc,id desc);
alter table public.proposal_responses enable row level security;
alter table public.proposal_views enable row level security;
create policy responses_owner_read on public.proposal_responses for select to authenticated using
 (exists(select 1 from public.proposals p where p.id=proposal_id and p.user_id=(select auth.uid())));
create policy views_owner_read on public.proposal_views for select to authenticated using
 (exists(select 1 from public.proposals p where p.id=proposal_id and p.user_id=(select auth.uid())));
revoke all on public.proposal_responses,public.proposal_views from anon,authenticated,service_role;
revoke all on public.proposal_responses_id_seq,public.proposal_views_id_seq from anon,authenticated,service_role;
grant select on public.proposal_responses,public.proposal_views to authenticated,service_role;

create function private.guard_response() returns trigger language plpgsql set search_path='' as $$
declare p public.proposals;
begin
  if tg_op<>'INSERT' then
    if tg_op='DELETE' and not exists(select 1 from public.proposals where id=old.proposal_id) then return old; end if;
    raise exception 'response_is_immutable' using errcode='23514';
  end if;
  select * into strict p from public.proposals where id=new.proposal_id for update;
  if p.lifecycle_status<>'published' or (p.valid_until is not null and p.valid_until<=clock_timestamp()) then
    raise exception 'proposal_unavailable' using errcode='23514'; end if;
  if new.content_version<>p.lock_version or new.share_generation<>p.share_generation then
    raise exception 'stale_content' using errcode='40001'; end if;
  if new.response_type<>'message' and p.decision_status<>'pending' then
    raise exception 'decision_already_recorded' using errcode='23514'; end if;
  return new;
end $$;
create function private.apply_response() returns trigger language plpgsql set search_path='' as $$
begin
  if new.response_type<>'message' then
    update public.proposals set decision_status=new.response_type,responded_at=new.created_at where id=new.proposal_id;
  end if; return null;
end $$;
create trigger responses_guard before insert or update or delete on public.proposal_responses for each row execute function private.guard_response();
create trigger responses_apply after insert on public.proposal_responses for each row execute function private.apply_response();

create function private.check_decision() returns trigger language plpgsql set search_path='' as $$
begin
  if new.decision_status<>'pending' and not exists(select 1 from public.proposal_responses r where
    r.proposal_id=new.id and r.response_type=new.decision_status and r.created_at=new.responded_at) then
    raise exception 'decision_requires_response' using errcode='23514';
  end if; return null;
end $$;
create trigger proposals_decision after insert or update on public.proposals for each row execute function private.check_decision();

-- Helpers have no exposed SECURITY DEFINER endpoint. Public wrappers are INVOKER.
create function private.require_server() returns void language plpgsql set search_path='' as $$
begin
  if current_setting('role',true) is distinct from 'service_role' then
    raise exception 'server_only' using errcode='42501'; end if;
end $$;
create function private.owned_proposal(target uuid) returns public.proposals language plpgsql set search_path='' as $$
declare p public.proposals; actor uuid:=auth.uid();
begin
  if actor is null then raise exception 'authentication_required' using errcode='42501'; end if;
  -- Consistent lock order: user -> proposal -> children (also used by publish).
  perform 1 from auth.users where id=actor for update;
  select * into p from public.proposals where id=target and user_id=actor for update;
  if not found then raise exception 'proposal_not_found' using errcode='42501'; end if;
  return p;
end $$;
create function private.clean_text(value text) returns text language sql immutable set search_path='' as $$
  select normalize(replace(replace(value,E'\r\n',E'\n'),E'\r',E'\n'),NFC)
$$;
create function private.check_keys(value jsonb, allowed text[]) returns void language plpgsql set search_path='' as $$
begin
  if value is null or jsonb_typeof(value)<>'object' or exists(select 1 from jsonb_object_keys(value) k where not k=any(allowed)) then
    raise exception 'invalid_document_fields' using errcode='22023'; end if;
end $$;

create function private.save_proposal(target uuid, expected_version bigint, document jsonb, sections jsonb, items jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.proposals; next_p public.proposals; item jsonb; field text; amount numeric; qty numeric; actor uuid:=auth.uid();
begin
  if actor is null then raise exception 'authentication_required' using errcode='42501'; end if;
  perform 1 from auth.users where id=actor for update;
  if not found then raise exception 'authentication_required' using errcode='42501'; end if;
  if octet_length(coalesce(document::text,'')||coalesce(sections::text,'')||coalesce(items::text,''))>1048576 then
    raise exception 'payload_too_large' using errcode='22023'; end if;
  perform private.check_keys(document,array['client_id','client_name','client_company','project_name','start_date','duration_text','revision_limit','currency','tax_mode','valid_until']);
  if target is null then
    if expected_version is not null then raise exception 'new_proposal_has_no_version' using errcode='22023'; end if;
    insert into public.proposals(user_id) values(actor) returning * into p;
  else
    p:=private.owned_proposal(target);
    if expected_version is distinct from p.lock_version then raise exception 'stale_content' using errcode='40001'; end if;
  end if;
  if p.decision_status<>'pending' or (p.lifecycle_status<>'draft' and not
    (private.is_pro(actor) and p.publication_mode='live' and p.lifecycle_status='published' and (p.valid_until is null or p.valid_until>clock_timestamp()))) then
    raise exception 'content_locked' using errcode='42501'; end if;
  foreach field in array array['client_name','client_company','project_name','duration_text'] loop
    if document ? field and document->field<>'null'::jsonb then
      document:=jsonb_set(document,array[field],to_jsonb(private.clean_text(document->>field)));
    end if;
  end loop;
  next_p:=jsonb_populate_record(p,document);
  update public.proposals set client_id=next_p.client_id,client_name=next_p.client_name,client_company=next_p.client_company,
    project_name=next_p.project_name,start_date=next_p.start_date,duration_text=next_p.duration_text,revision_limit=next_p.revision_limit,
    currency=next_p.currency,tax_mode=next_p.tax_mode,valid_until=next_p.valid_until where id=p.id;
  if sections is not null then
    if jsonb_typeof(sections)<>'array' or jsonb_array_length(sections)>8 then raise exception 'invalid_sections' using errcode='22023'; end if;
    delete from public.proposal_sections where proposal_id=p.id;
    for item in select value from jsonb_array_elements(sections) loop
      perform private.check_keys(item,array['section_key','title','content','sort_order','source']);
      if item->>'source'='ai' and not private.is_pro(actor) then raise exception 'pro_required' using errcode='42501'; end if;
      insert into public.proposal_sections(proposal_id,section_key,title,content,sort_order,source)
        values(p.id,item->>'section_key',private.clean_text(item->>'title'),coalesce(private.clean_text(item->>'content'),''),
        (item->>'sort_order')::integer,coalesce(item->>'source','manual'));
    end loop;
  end if;
  if items is not null then
    if jsonb_typeof(items)<>'array' then raise exception 'invalid_items' using errcode='22023'; end if;
    delete from public.proposal_items where proposal_id=p.id;
    for item in select value from jsonb_array_elements(items) loop
      perform private.check_keys(item,array['description','quantity','unit_label','unit_price','sort_order']);
      amount:=(item->>'unit_price')::numeric; qty:=(item->>'quantity')::numeric;
      if amount is distinct from round(amount,2) or qty is distinct from round(qty,3) then
        raise exception 'excess_decimal_precision' using errcode='22023'; end if;
      insert into public.proposal_items(proposal_id,description,quantity,unit_label,unit_price,sort_order)
        values(p.id,private.clean_text(item->>'description'),qty,private.clean_text(item->>'unit_label'),amount,(item->>'sort_order')::integer);
    end loop;
  end if;
  -- Include client-reference-only changes and empty saves in optimistic concurrency.
  update public.proposals set lock_version=lock_version+1,updated_at=clock_timestamp() where id=p.id returning * into p;
  return jsonb_build_object('id',p.id,'lock_version',p.lock_version,'total_amount',p.total_amount::text);
exception when integrity_constraint_violation or data_exception then
  -- A CHECK error's failing-row DETAIL can otherwise include sharing hashes,
  -- despite column-level SELECT restrictions. Preserve class, not private data.
  raise exception using errcode=sqlstate,message='invalid_proposal_data';
end $$;
create function public.save_proposal(target uuid,expected_version bigint,document jsonb,sections jsonb default null,items jsonb default null)
returns jsonb language sql security invoker set search_path='' as $$
  select private.save_proposal(target,expected_version,document,sections,items)
$$;

create function private.proposal_action(target uuid,expected_version bigint,action text) returns bigint
language plpgsql security definer set search_path='' as $$
declare p public.proposals;
begin
  p:=private.owned_proposal(target);
  if expected_version is distinct from p.lock_version then raise exception 'stale_content' using errcode='40001'; end if;
  if action='delete_draft' then
    if p.lifecycle_status<>'draft' then raise exception 'draft_required' using errcode='42501'; end if;
    delete from public.proposals where id=p.id; return p.lock_version;
  elsif action='revoke' then
    if p.lifecycle_status='revoked' then return p.lock_version; end if;
    if p.lifecycle_status<>'published' then raise exception 'published_required' using errcode='23514'; end if;
    update public.proposals set lifecycle_status='revoked',revoked_at=clock_timestamp(),share_selector=null,
      share_verifier_hash=null,share_key_version=null,share_generation=share_generation+1,lock_version=lock_version+1 where id=p.id;
  elsif action in ('locked','live') then
    if not private.is_pro(p.user_id) or p.decision_status<>'pending' then raise exception 'pro_pending_required' using errcode='42501'; end if;
    update public.proposals set publication_mode=action,lock_version=lock_version+1 where id=p.id;
  else raise exception 'invalid_action' using errcode='22023'; end if;
  return (select lock_version from public.proposals where id=p.id);
end $$;
create function public.proposal_action(target uuid,expected_version bigint,action text) returns bigint
language sql security invoker set search_path='' as $$ select private.proposal_action(target,expected_version,action) $$;

-- Only the trusted server supplies verified actor, token hash and configured Pro ceiling.
-- Null Pro ceiling FAILS CLOSED. Test ceilings are not product defaults.
create function private.publish_proposal(actor uuid,target uuid,expected_version bigint,selector uuid,verifier_hash bytea,key_version integer,
  expires_at timestamptz,mode text,pro_active_limit integer) returns bigint
language plpgsql security definer set search_path='' as $$
declare p public.proposals; pro boolean; ceiling integer; active_count bigint;
begin
  perform private.require_server();
  perform 1 from auth.users where id=actor for update;
  select * into p from public.proposals where id=target and user_id=actor for update;
  if not found then raise exception 'proposal_not_found' using errcode='42501'; end if;
  if p.lifecycle_status='published' and p.share_selector=selector and p.share_verifier_hash=verifier_hash
    and p.share_key_version=key_version and p.valid_until is not distinct from expires_at and p.publication_mode=mode then return p.lock_version; end if;
  if expected_version is distinct from p.lock_version then raise exception 'stale_content' using errcode='40001'; end if;
  if p.decision_status<>'pending' then raise exception 'answered_proposal_is_immutable' using errcode='23514'; end if;
  pro:=private.is_pro(actor);
  if (p.published_at is not null or mode='live') and not pro then raise exception 'pro_required' using errcode='42501'; end if;
  ceiling:=case when pro then pro_active_limit else 3 end;
  if ceiling is null or ceiling<1 then raise exception 'pro_limit_not_configured' using errcode='22023'; end if;
  select count(*) into active_count from public.proposals where user_id=actor and id<>target and lifecycle_status='published'
    and decision_status='pending' and (valid_until is null or valid_until>clock_timestamp());
  if active_count>=ceiling then raise exception 'active_proposal_limit' using errcode='23514'; end if;
  if not private.valid_text(p.client_name,200,true) or not private.valid_text(p.project_name,200,true)
    or p.currency is null or p.tax_mode is null or not exists(select 1 from public.proposal_items where proposal_id=target)
    or (expires_at is not null and expires_at<=clock_timestamp()) then raise exception 'incomplete_or_expired_proposal' using errcode='23514'; end if;
  if selector is null or verifier_hash is null or octet_length(verifier_hash)<>32 or key_version is null or key_version<1 or mode not in ('locked','live') or mode is null then
    raise exception 'invalid_publication' using errcode='22023'; end if;
  if p.share_selector=selector then raise exception 'republish_requires_new_selector' using errcode='23514'; end if;
  update public.proposals set lifecycle_status='published',publication_mode=mode,published_at=clock_timestamp(),revoked_at=null,
    valid_until=expires_at,share_selector=selector,share_verifier_hash=verifier_hash,share_key_version=key_version,
    share_generation=share_generation+1,lock_version=lock_version+1 where id=target;
  return (select lock_version from public.proposals where id=target);
end $$;
create function public.publish_proposal(actor uuid,target uuid,expected_version bigint,selector uuid,verifier_hash bytea,key_version integer,
  expires_at timestamptz,mode text default 'locked',pro_active_limit integer default null) returns bigint
language sql security invoker set search_path='' as $$
  select private.publish_proposal(actor,target,expected_version,selector,verifier_hash,key_version,expires_at,mode,pro_active_limit)
$$;

create function private.record_proposal_response(target uuid,content_version bigint,generation bigint,kind text,message text,idempotency text,request_id text)
returns bigint language plpgsql security definer set search_path='' as $$
declare previous public.proposal_responses; result bigint;
begin
  perform private.require_server();
  perform 1 from public.proposals where id=target for update;
  if not found then raise exception 'proposal_not_found' using errcode='42501'; end if;
  message:=private.clean_text(message);
  select * into previous from public.proposal_responses r where r.idempotency_key=idempotency;
  if found then
    if row(previous.proposal_id,previous.response_type,previous.message,previous.content_version,previous.share_generation)
      is distinct from row(target,kind,message,content_version,generation) then raise exception 'idempotency_conflict' using errcode='23505'; end if;
    return previous.id;
  end if;
  insert into public.proposal_responses(proposal_id,response_type,message,idempotency_key,request_id,content_version,share_generation)
    values(target,kind,message,idempotency,request_id,content_version,generation) returning id into result;
  return result;
end $$;
create function public.record_proposal_response(target uuid,content_version bigint,generation bigint,kind text,message text,idempotency text,request_id text)
returns bigint language sql security invoker set search_path='' as $$
  select private.record_proposal_response(target,content_version,generation,kind,message,idempotency,request_id)
$$;

create function private.record_proposal_view(target uuid,event uuid,generation bigint,dedupe bytea,window_start timestamptz,ua_class text,suspected_bot boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare p public.proposals; result bigint; event_time timestamptz:=clock_timestamp();
begin
  perform private.require_server();
  select * into p from public.proposals where id=target for update;
  if not found or p.lifecycle_status<>'published' or generation is distinct from p.share_generation
    or (p.valid_until is not null and p.valid_until<=clock_timestamp()) then raise exception 'proposal_unavailable' using errcode='23514'; end if;
  if exists(select 1 from public.proposal_views where event_id=event and proposal_id<>target) then raise exception 'event_conflict' using errcode='23505'; end if;
  insert into public.proposal_views(proposal_id,viewed_at,event_id,dedupe_hash,dedupe_window_start,user_agent_class,is_suspected_bot,is_counted)
    values(target,event_time,event,dedupe,window_start,ua_class,suspected_bot,not suspected_bot and coalesce(ua_class,'unknown') not in ('bot','preview'))
    on conflict do nothing returning id into result;
  if result is not null and not suspected_bot and coalesce(ua_class,'unknown') not in ('bot','preview') then
    update public.proposals set first_viewed_at=coalesce(first_viewed_at,event_time),last_viewed_at=event_time,counted_view_count=counted_view_count+1 where id=target;
  end if;
  return result is not null;
end $$;
create function public.record_proposal_view(target uuid,event uuid,generation bigint,dedupe bytea default null,window_start timestamptz default null,
 ua_class text default 'unknown',suspected_bot boolean default false) returns boolean language sql security invoker set search_path='' as $$
  select private.record_proposal_view(target,event,generation,dedupe,window_start,ua_class,suspected_bot)
$$;

revoke all on all functions in schema private from public,anon,authenticated,service_role;
grant execute on function private.valid_text(text,integer,boolean) to authenticated,service_role;
revoke all on function public.save_proposal(uuid,bigint,jsonb,jsonb,jsonb),public.proposal_action(uuid,bigint,text),
 public.publish_proposal(uuid,uuid,bigint,uuid,bytea,integer,timestamptz,text,integer),
 public.record_proposal_response(uuid,bigint,bigint,text,text,text,text),
 public.record_proposal_view(uuid,uuid,bigint,bytea,timestamptz,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.save_proposal(uuid,bigint,jsonb,jsonb,jsonb),private.save_proposal(uuid,bigint,jsonb,jsonb,jsonb),
 public.proposal_action(uuid,bigint,text),private.proposal_action(uuid,bigint,text) to authenticated;
grant execute on function public.publish_proposal(uuid,uuid,bigint,uuid,bytea,integer,timestamptz,text,integer),
 private.publish_proposal(uuid,uuid,bigint,uuid,bytea,integer,timestamptz,text,integer),
 public.record_proposal_response(uuid,bigint,bigint,text,text,text,text),private.record_proposal_response(uuid,bigint,bigint,text,text,text,text),
 public.record_proposal_view(uuid,uuid,bigint,bytea,timestamptz,text,boolean),private.record_proposal_view(uuid,uuid,bigint,bytea,timestamptz,text,boolean)
 to service_role;
