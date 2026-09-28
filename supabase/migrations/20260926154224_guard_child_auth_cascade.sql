-- Auth account deletion invokes proposal child FK cascades as
-- supabase_auth_admin. This trigger-only helper needs to inspect the full
-- parent proposal while its function EXECUTE remains revoked from API roles.
-- The function already uses an empty search_path and schema-qualified tables.
alter function private.guard_child() security definer;
