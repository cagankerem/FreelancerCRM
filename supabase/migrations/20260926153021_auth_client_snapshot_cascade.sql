-- Deleting an Auth account cascades to clients. The composite client FK sets
-- proposals.client_id to null before the proposal row itself is removed.
-- Allow only that column transition for an owner already removed by Auth.
grant select(id,user_id,client_id), update(client_id) on public.proposals to supabase_auth_admin;
create policy proposals_auth_account_read_for_cascade on public.proposals
  for select to supabase_auth_admin
  using (not exists (select 1 from auth.users where id = user_id));
create policy proposals_auth_account_client_fk on public.proposals
  for update to supabase_auth_admin
  using (not exists (select 1 from auth.users where id = user_id))
  with check (not exists (select 1 from auth.users where id = user_id));
