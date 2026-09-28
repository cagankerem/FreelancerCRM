-- Auth owns auth.users and executes its FK cascades as supabase_auth_admin.
-- Permit deletion only after the owning auth.users row has disappeared in the
-- same transaction. This does not expose proposal rows to Auth's regular SQL.
grant delete on public.proposals to supabase_auth_admin;
create policy proposals_auth_account_cascade on public.proposals
  for delete to supabase_auth_admin
  using (not exists (select 1 from auth.users where id = user_id));
