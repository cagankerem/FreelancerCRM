import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const envFile = fileURLToPath(new URL("../apps/web/.env.local", import.meta.url));
if (existsSync(envFile)) {
  console.log("apps/web/.env.local already exists; left unchanged.");
  process.exit(0);
}
const cli = fileURLToPath(
  new URL("../apps/web/node_modules/supabase/dist/supabase.js", import.meta.url),
);
const result = spawnSync(process.execPath, [cli, "--workdir", root, "status", "--output", "json"], {
  cwd: root,
  encoding: "utf8",
});
if (result.status !== 0) throw new Error("Start local Supabase before setting up app environment.");
const status = JSON.parse(result.stdout);
if (
  !status.API_URL?.startsWith("http://127.0.0.1:") ||
  !status.PUBLISHABLE_KEY ||
  !status.SERVICE_ROLE_KEY
) {
  throw new Error("Local Supabase URL or required keys are missing.");
}
const lines = [
  `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}`,
  `SUPABASE_SERVICE_ROLE_KEY=${status.SERVICE_ROLE_KEY}`,
  `SHARE_HMAC_KEY_V1=${randomBytes(32).toString("hex")}`,
];
writeFileSync(envFile, `${lines.join("\n")}\n`, { flag: "wx", mode: 0o600 });
console.log("Created ignored apps/web/.env.local for local development.");
