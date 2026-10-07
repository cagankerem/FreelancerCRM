import { spawnSync } from "node:child_process";

// Read-only guard. A non-empty database requires an explicit human decision.
const query = `select 'auth.users',count(*) from auth.users having count(*)>0;
select 'storage.objects',count(*) from storage.objects having count(*)>0;
select 'storage.buckets',count(*) from storage.buckets having count(*)>0;
do $$ declare t record; n bigint; begin
for t in select schemaname,tablename from pg_tables where schemaname in ('public','private') loop
execute format('select count(*) from %I.%I',t.schemaname,t.tablename) into n;
if n>0 then raise exception 'NONEMPTY: %.% contains % rows',t.schemaname,t.tablename,n; end if;
end loop; end $$;`;
const result = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    "supabase_db_FreelancerCRM",
    "psql",
    "-X",
    "-qAt",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    "postgres",
    "-d",
    "postgres",
  ],
  { input: query, encoding: "utf8" },
);
if (result.error) throw result.error;
if (result.status !== 0 || result.stdout.trim()) {
  console.error(
    "Local DB is non-empty or could not be inspected. Do not reset without checking and approval.",
  );
  console.error(result.stdout, result.stderr);
  process.exitCode = 1;
} else console.log("Verified empty: no Auth users, Storage objects/buckets or application rows.");
