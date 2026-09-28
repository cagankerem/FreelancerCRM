-- Entire fixture is rolled back. Not a seed, not demo data, no Auth passwords.
begin;
set local statement_timeout='20s';
create function pg_temp.ok(value boolean, label text) returns text language plpgsql as $$
begin if value is distinct from true then raise exception 'FAIL: %',label; end if; return 'ok - '||label; end $$;
create function pg_temp.fails(query text, expected text, label text) returns text language plpgsql as $$
declare caught text;
begin
  begin execute query; exception when others then get stacked diagnostics caught=returned_sqlstate; end;
  if caught is distinct from expected then raise exception 'FAIL: %, expected %, got %',label,expected,coalesce(caught,'success'); end if;
  return 'ok - '||label;
end $$;
create function pg_temp.safe_error(query text) returns text language plpgsql as $$
declare detail text; code text; message text;
begin
  begin execute query; exception when others then
    get stacked diagnostics detail=pg_exception_detail,code=returned_sqlstate,message=message_text;
  end;
  if code is distinct from '23514' or coalesce(detail,'')<>'' or message is distinct from 'invalid_proposal_data' then
    raise exception 'FAIL: private row detail leaked or wrong failure'; end if;
  return 'ok - invalid published input does not expose private row detail';
end $$;
select gen_random_uuid() as ua,gen_random_uuid() as ub,gen_random_uuid() as ca,gen_random_uuid() as cb \gset
insert into auth.users(id,email) values(:'ua','schema-a@example.invalid'),(:'ub','schema-b@example.invalid');
insert into public.profiles(id,full_name) values(:'ua','Kurgusal Ada'),(:'ub','Kurgusal Bora');
insert into public.subscriptions(user_id,plan_code,status,current_period_end) values(:'ub','pro','active','2099-01-01Z');
select pg_temp.ok((select count(*)=8 and bool_and(relrowsecurity) from pg_class where relnamespace='public'::regnamespace and relkind='r'),'all 8 business tables have RLS');
select pg_temp.ok(not exists(select 1 from pg_proc where pronamespace='public'::regnamespace and prosecdef),'no public security-definer functions');

set local role anon;
select pg_temp.fails('select * from public.profiles','42501','anon cannot read profiles');
select pg_temp.fails('select public.save_proposal(null,null,''{}'')','42501','anon cannot call owner mutation');
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'ua','role','authenticated')::text,true);
set local role authenticated;
select pg_temp.ok((select count(*)=1 from public.profiles),'profile reads are owner-only');
with changed as (update public.profiles set profession='Tasarımcı',default_currency='TRY' where id=:'ua' returning id)
select pg_temp.ok(count(*)=1,'owner can update own profile') from changed;
select pg_temp.fails(format('insert into public.profiles(id) values(%L)',:'ub'),'42501','cannot insert another profile');
with changed as (update public.profiles set full_name='forbidden' where id=:'ub' returning id)
select pg_temp.ok(count(*)=0,'cannot update another profile') from changed;
select pg_temp.fails('update public.profiles set logo_path=''external/path''','42501','logo path is not browser-writable');
select pg_temp.fails('update public.subscriptions set plan_code=''pro''','42501','cannot self-upgrade');
insert into public.clients(id,name,company_name) values(:'ca','Örnek Müşteri','Kurgusal Atölye');
insert into public.clients(name,company_name) values('Örnek Müşteri','Kurgusal Atölye');
select pg_temp.ok((select count(*)=2 from public.clients),'duplicate customer names allowed');
select pg_temp.fails('insert into public.clients(name) values(E'' \t\n'')','23514','whitespace customer name rejected');
select pg_temp.fails('insert into public.clients(name) values(repeat(''x'',201))','23514','customer name N+1 rejected');
insert into public.clients(name) values(repeat('ş',200));
select pg_temp.ok((select count(*)=1 from public.clients where char_length(name)=200),'Turkish N-character name accepted');
select (public.save_proposal(null,null,jsonb_build_object('client_id',:'ca','client_name','Örnek Müşteri','project_name','Kurgusal Tasarım','currency','TRY','tax_mode','excluded'),
  '[{"section_key":"summary","title":"Özet","content":"Kurgusal kapsam","sort_order":0}]',
  '[{"description":"İlk kalem","quantity":"1.500","unit_price":"0.01","sort_order":0},{"description":"İkinci kalem","quantity":"1.500","unit_price":"0.01","sort_order":1}]'))->>'id' as pa \gset
create temp table fixture_proposal(id uuid primary key) on commit drop;
insert into fixture_proposal(id) values(:'pa');
select pg_temp.ok((select total_amount=0.04 from public.proposals where id=:'pa'),'round each line first: 0.02+0.02=0.04');
select pg_temp.ok((select bool_and(line_total=0.02) from public.proposal_items where proposal_id=:'pa'),'generated line totals are exact');
select lock_version as va from public.proposals where id=:'pa' \gset
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{"currency":"GBP"}'')',:'pa',:'va'),'23514','currency allowlist');
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{"user_id":"%s"}'')',:'pa',:'va',:'ub'),'22023','owner injection rejected');
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{}'',null,''[{"description":"x","quantity":"1","unit_price":"-1","sort_order":0}]'')',:'pa',:'va'),'23514','negative price rejected');
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{}'',null,''[{"description":"x","quantity":"0","unit_price":"1","sort_order":0}]'')',:'pa',:'va'),'23514','zero quantity rejected');
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{}'',null,''[{"description":"x","quantity":"1","unit_price":"NaN","sort_order":0}]'')',:'pa',:'va'),'23514','NaN price rejected');
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{}'',null,''[{"description":"x","quantity":"1","unit_price":"0.015","sort_order":0}]'')',:'pa',:'va'),'22023','excess price precision rejected');
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{}'',null,''[{"description":"x","quantity":"1","unit_price":"1000000000000","sort_order":0}]'')',:'pa',:'va'),'22003','price overflow rejected');
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{}'',''[{"section_key":"summary","title":"x","source":"ai","sort_order":0}]'')',:'pa',:'va'),'42501','Free cannot apply AI-tagged source');
select pg_temp.fails(format('select public.save_proposal(%L,-1,''{}'')',:'pa'),'40001','optimistic version required');
select pg_temp.fails('select share_verifier_hash from public.proposals','42501','owner cannot select token hashes');
select pg_temp.fails(format('update public.proposal_items set unit_price=1 where proposal_id=%L',:'pa'),'42501','direct item update denied even on draft');

reset role;
insert into public.clients(id,user_id,name) values(:'cb',:'ub','Diğer Kurgusal Müşteri');
set local role authenticated;
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{"client_id":"%s"}'')',:'pa',:'va',:'cb'),'23503','cross-owner client FK rejected');
select pg_temp.ok((select count(*)=0 from public.clients where id=:'cb'),'other customer invisible');
with changed as (update public.clients set name='forbidden' where id=:'cb' returning id)
select pg_temp.ok(count(*)=0,'cannot update another customer') from changed;
with removed as (delete from public.clients where id=:'cb' returning id)
select pg_temp.ok(count(*)=0,'cannot delete another customer') from removed;
select pg_temp.fails(format('insert into public.clients(user_id,name) values(%L,''forbidden'')',:'ub'),'42501','cannot create another owner customer');
select pg_temp.ok((select total_amount=0.04 from public.proposals where id=:'pa'),'failed saves rollback complete document');
reset role;

-- Actual column-boundary checks, not only helper checks.
do $$
declare f text; n integer; outcome text;
begin
  for f,n in select * from (values ('full_name',200),('profession',120),('brand_name',200),('public_email',254),('public_phone',32),('logo_path',512)) b(f,n) loop
    execute format('update public.profiles set %I=repeat(''ş'',%s)',f,n-1);
    execute format('update public.profiles set %I=repeat(''😀'',%s)',f,n);
    outcome:=pg_temp.fails(format('update public.profiles set %I=repeat(''ş'',%s)',f,n+1),'23514',f||' N+1');
  end loop;
end $$;
select pg_temp.ok(true,'profile field N-1/N/N+1 boundaries, Turkish and emoji');
select pg_temp.fails('update public.profiles set website_url=''javascript:alert(1)''','23514','unsafe website protocol rejected');
select pg_temp.fails('update public.profiles set full_name=U&''e\0301''','23514','non-NFC direct SQL rejected');
select pg_temp.fails('update public.profiles set profession=E''a\rb''','23514','CR direct SQL rejected');
select pg_temp.fails('update public.profiles set default_currency=''XXX''','23514','profile currency allowlist');
select pg_temp.fails('update public.profiles set onboarding_completed_at=now()','23514','incomplete onboarding rejected');
do $$
declare k text; n integer; target uuid:=(select id from fixture_proposal);
begin
  for k,n in select * from (values ('summary',4000),('scope',12000),('deliverables',8000),('exclusions',6000),('timeline',4000),('revision_terms',4000),('payment_plan',4000),('additional_terms',8000)) b(k,n) loop
    insert into public.proposal_sections(proposal_id,section_key,title,content,sort_order) values(target,k,'Test',repeat('ş',n-1),1)
      on conflict(proposal_id,section_key) do update set content=excluded.content;
    update public.proposal_sections set content=repeat('😀',n) where proposal_id=target and section_key=k;
    perform pg_temp.fails(format('update public.proposal_sections set content=repeat(''x'',%s) where proposal_id=%L and section_key=%L',n+1,target,k),'23514',k||' N+1');
  end loop;
end $$;
select pg_temp.ok(true,'all 8 section limits accept N and reject N+1');
do $$
declare f text; n integer; original text; target uuid:=(select id from fixture_proposal);
begin
  foreach f in array array['client_name','client_company','project_name','duration_text'] loop
    execute format('select %I from public.proposals where id=$1',f) into original using target;
    execute format('update public.proposals set %I=repeat(''ş'',199) where id=$1',f) using target;
    execute format('update public.proposals set %I=repeat(''😀'',200) where id=$1',f) using target;
    perform pg_temp.fails(format('update public.proposals set %I=repeat(''x'',201) where id=%L',f,target),'23514',f||' N+1');
    execute format('update public.proposals set %I=$1 where id=$2',f) using original,target;
  end loop;
  for f,n in select * from (values('description',2000),('unit_label',32)) b(f,n) loop
    execute format('update public.proposal_items set %I=repeat(''ş'',%s) where proposal_id=$1',f,n-1) using target;
    execute format('update public.proposal_items set %I=repeat(''😀'',%s) where proposal_id=$1',f,n) using target;
    perform pg_temp.fails(format('update public.proposal_items set %I=repeat(''x'',%s) where proposal_id=%L',f,n+1,target),'23514',f||' N+1');
  end loop;
end $$;
select pg_temp.ok(true,'proposal and item text N-1/N/N+1 boundaries');
select pg_temp.fails('update public.proposal_sections set title=repeat(''x'',121)','23514','section title N+1 rejected');
select pg_temp.fails('update public.proposal_sections set section_key=''unknown''','23514','section allowlist enforced');
select pg_temp.fails('update public.proposals set tax_mode=''unknown''','23514','tax-mode allowlist enforced');
select pg_temp.fails('update public.proposals set revision_limit=-1','23514','negative revision count rejected');
select pg_temp.fails('update public.proposals set counted_view_count=1,first_viewed_at=now(),last_viewed_at=null','23514','partial view aggregate rejected');

select set_config('request.jwt.claims',jsonb_build_object('sub',:'ub','role','authenticated','user_metadata',jsonb_build_object('plan','pro'))::text,true);
set local role authenticated;
select pg_temp.ok((select count(*)=0 from public.proposals),'other user sees no proposals');
select pg_temp.ok((select count(*)=0 from public.proposal_items),'other user sees no items');
select pg_temp.ok((select count(*)=0 from public.proposal_sections),'other user sees no sections');
select pg_temp.fails(format('select public.save_proposal(%L,0,''{}'')',:'pa'),'42501','other user cannot invoke mutation');
select (public.save_proposal(null,null,'{"client_name":"Kurgusal B","project_name":"Pro Çalışması","currency":"USD","tax_mode":"included"}',null,
 '[{"description":"Hizmet","quantity":"2.5","unit_price":"10.10","sort_order":0}]'))->>'id' as pb \gset
select lock_version as vb from public.proposals where id=:'pb' \gset
reset role;
select lock_version as va from public.proposals where id=:'pa' \gset
select gen_random_uuid() as sa,gen_random_uuid() as sb \gset
set local role service_role;
select public.publish_proposal(:'ua',:'pa',:va,:'sa',decode(repeat('11',32),'hex'),1,'2099-01-01Z','locked') as va \gset
select pg_temp.fails(format('select public.publish_proposal(%L,%L,%s,%L,decode(repeat(''22'',32),''hex''),1,''2099-01-01Z'',''live'')',:'ub',:'pb',:'vb',:'sb'),'22023','Pro publication fails closed without configured quota');
select public.publish_proposal(:'ub',:'pb',:vb,:'sb',decode(repeat('22',32),'hex'),1,'2099-01-01Z','live',10) as vb \gset
select pg_temp.ok(public.publish_proposal(:'ua',:'pa',:va,:'sa',decode(repeat('11',32),'hex'),1,'2099-01-01Z','locked')=:va,'publication retry idempotent');
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'ua','role','authenticated','user_metadata',jsonb_build_object('plan','pro'))::text,true);
set local role authenticated;
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{"project_name":"tamper"}'')',:'pa',:'va'),'42501','Free published content locked despite forged metadata');
select pg_temp.fails(format('select public.proposal_action(%L,%s,''live'')',:'pa',:'va'),'42501','Free cannot unlock');
select pg_temp.fails(format('update public.proposal_items set quantity=9 where proposal_id=%L',:'pa'),'42501','Free cannot bypass lock via items');
select pg_temp.fails(format('delete from public.proposal_sections where proposal_id=%L',:'pa'),'42501','Free cannot bypass lock via sections');
select pg_temp.fails(format('select public.record_proposal_response(%L,%s,1,''accepted'',null,''attack'',''test'')',:'pa',:'va'),'42501','owner cannot impersonate customer response');
delete from public.clients where id=:'ca';
select pg_temp.ok((select client_id is null and client_name='Örnek Müşteri' from public.proposals where id=:'pa'),'client deletion preserves proposal snapshot');
reset role;
select pg_temp.fails(format('update public.proposal_items set quantity=9 where proposal_id=%L',:'pa'),'23514','database trigger independently protects locked items');
select pg_temp.fails(format('update public.proposals set decision_status=''accepted'',responded_at=now() where id=%L',:'pa'),'23514','canonical decision requires response record');

select set_config('request.jwt.claims',jsonb_build_object('sub',:'ub','role','authenticated')::text,true);
set local role authenticated;
select (public.save_proposal(:'pb',:vb,E'{"project_name":"Güncel Pro","duration_text":"a\\r\\nb"}'))->>'lock_version' as vb_new \gset
select pg_temp.safe_error(format('select public.save_proposal(%L,%s,''{"currency":"INVALID"}'')',:'pb',:'vb_new'));
select pg_temp.ok((select duration_text=E'a\nb' from public.proposals where id=:'pb'),'owner save normalizes CRLF');
reset role;
set local role service_role;
select pg_temp.fails(format('select public.record_proposal_response(%L,%s,1,''accepted'',null,''stale'',''test'')',:'pb',:'vb'),'40001','old browser content cannot be accepted');
select gen_random_uuid() as ev,gen_random_uuid() as ev2,gen_random_uuid() as bot \gset
select pg_temp.ok(public.record_proposal_view(:'pb',:'ev',1,decode(repeat('aa',32),'hex'),'2026-01-01Z','browser',false),'counted view inserted');
select pg_temp.ok(not public.record_proposal_view(:'pb',:'ev',1),'event retry deduplicated');
select pg_temp.ok(not public.record_proposal_view(:'pb',:'ev2',1,decode(repeat('aa',32),'hex'),'2026-01-01Z','browser',false),'window duplicate suppressed');
select public.record_proposal_view(:'pb',:'bot',1,null,null,'bot',true);
select pg_temp.ok((select counted_view_count=1 and lock_version=:vb_new from public.proposals where id=:'pb'),'bots excluded and views do not stale content version');
select pg_temp.fails(format('select public.record_proposal_response(%L,%s,1,''message'',repeat(''x'',4001),''long'',''test'')',:'pb',:'vb_new'),'23514','message N+1 rejected');
select public.record_proposal_response(:'pb',:vb_new,1,'message',repeat('ş',4000),'message','test');
select public.record_proposal_response(:'pb',:vb_new,1,'accepted',null,'decision','test') as decision \gset
select pg_temp.ok(public.record_proposal_response(:'pb',:vb_new,1,'accepted',null,'decision','test')=:decision,'same decision retry idempotent');
select pg_temp.fails(format('select public.record_proposal_response(%L,%s,1,''rejected'',null,''opposite'',''test'')',:'pb',:'vb_new'),'23514','opposite decision rejected');
select pg_temp.fails(format('select public.record_proposal_response(%L,%s,1,''rejected'',null,''decision'',''test'')',:'pb',:'vb_new'),'23505','idempotency payload mismatch rejected');
reset role;
select pg_temp.ok((select decision_status='accepted' and responded_at is not null from public.proposals where id=:'pb'),'response and canonical status match');
select pg_temp.fails(format('update public.proposals set project_name=''changed'' where id=%L',:'pb'),'23514','answered parent protected even for maintenance SQL');
select pg_temp.fails(format('update public.proposal_items set unit_price=999 where proposal_id=%L',:'pb'),'23514','answered items protected');
select pg_temp.fails(format('delete from public.proposal_responses where id=%s',:'decision'),'23514','decision cannot be deleted in place');
set local role authenticated;
select pg_temp.fails(format('select public.save_proposal(%L,%s,''{"project_name":"changed"}'')',:'pb',:'vb_new'),'42501','Pro cannot edit answered content');
select public.proposal_action(:'pb',:vb_new,'revoke');
reset role;
select pg_temp.ok((select decision_status='accepted' and lifecycle_status='revoked' from public.proposals where id=:'pb'),'revoke preserves decision');

select set_config('request.jwt.claims',jsonb_build_object('sub',:'ua','role','authenticated')::text,true);
set local role authenticated;
select pg_temp.ok((select count(*)=0 from public.proposal_responses),'other responses invisible');
select pg_temp.ok((select count(*)=0 from public.proposal_views),'other views invisible');
select pg_temp.ok((select count(*)=0 from public.subscriptions),'other subscription invisible');
reset role;
-- Explicit account deletion can cascade; ordinary published proposal deletion cannot.
delete from auth.users where id=:'ub';
select pg_temp.ok(not exists(select 1 from public.proposals where id=:'pb'),'account cascade deletes answered proposal');
select pg_temp.ok(not exists(select 1 from public.proposal_responses where proposal_id=:'pb'),'account cascade deletes responses');
rollback;
