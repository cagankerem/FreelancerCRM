import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Fixed local Docker container; never accepts a remote database URL.
const sql = readFileSync(
  fileURLToPath(new URL("../supabase/tests/schema_contract.sql", import.meta.url)),
  "utf8",
);
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
  {
    input: sql,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  },
);
if (result.error) throw result.error;
const checks = (result.stdout ?? "").split("\n").filter((line) => line.startsWith("ok - "));
for (const check of checks) console.log(check);
if (result.status !== 0) {
  console.error(result.stderr);
  process.exitCode = 1;
} else {
  console.log(`Passed ${checks.length} schema checks; all fixtures rolled back.`);
}
