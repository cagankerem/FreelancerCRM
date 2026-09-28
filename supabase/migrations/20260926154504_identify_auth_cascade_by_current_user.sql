-- Auth connects directly as supabase_auth_admin, so the SET ROLE GUC remains
-- "none". Check the actual invoker and only skip deletion-time totals.
create or replace function private.refresh_proposal_total() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  if current_user='supabase_auth_admin' and tg_op='DELETE' then return null; end if;
  target:=case when tg_op='DELETE' then old.proposal_id else new.proposal_id end;
  update public.proposals set total_amount=(select coalesce(sum(line_total),0) from public.proposal_items where proposal_id=target),
    updated_at=clock_timestamp(),lock_version=lock_version+1 where id=target;
  return null;
end $$;
