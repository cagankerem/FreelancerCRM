-- Account deletion cascades remove child items and their proposal in the same
-- transaction. Recomputing the total of a proposal being deleted is unnecessary.
-- Auth's database role has no direct DML grant on proposal_items; this branch
-- therefore applies only to its FK cascade. Ordinary writes keep the aggregate.
create or replace function private.refresh_proposal_total() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  if current_setting('role',true)='supabase_auth_admin' then return null; end if;
  target:=case when tg_op='DELETE' then old.proposal_id else new.proposal_id end;
  update public.proposals set total_amount=(select coalesce(sum(line_total),0) from public.proposal_items where proposal_id=target),
    updated_at=clock_timestamp(),lock_version=lock_version+1 where id=target;
  return null;
end $$;
