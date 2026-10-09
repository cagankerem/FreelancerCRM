import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, "..");
const app = join(root, "apps/web");
assert.notEqual(process.env.CI, "true", "PR quality CI must not build against a remote Supabase.");
// Build in a fresh directory: ignored local credentials must never enter staging.
const workspace = mkdtempSync(join(tmpdir(), "freelancercrm-staging-build-"));
const excluded = new Set([
  "node_modules",
  ".next",
  "dist",
  ".workers",
  ".wrangler",
  ".vinext",
  "test-results",
  "playwright-report",
  "coverage",
]);
cpSync(app, workspace, {
  recursive: true,
  filter: (source) =>
    !excluded.has(basename(source)) &&
    !basename(source).startsWith(".env") &&
    !basename(source).startsWith(".dev.vars"),
});
symlinkSync(join(app, "node_modules"), join(workspace, "node_modules"), "dir");
const registry = readFileSync(join(app, "lib/shared/supabase-projects.ts"), "utf8");
const publicKey = registry.match(/test:\s*\{[\s\S]*?publishableKey:\s*"([^"]+)"/)?.[1];
if (!publicKey?.startsWith("sb_publishable_")) throw new Error("Test public key missing.");
const config = JSON.parse(readFileSync(join(app, "wrangler.json"), "utf8"));
config.vars = {
  NEXT_PUBLIC_APP_ENV: "staging",
  NEXT_PUBLIC_SUPABASE_URL: "https://pbqgjfzylnhaiadlpvkq.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey,
  NEXT_PUBLIC_SITE_URL: "https://freelancercrm-staging.cagankeremergun.workers.dev",
};
writeFileSync(join(workspace, "wrangler.json"), `${JSON.stringify(config, null, 2)}\n`);
const env = {
  ...process.env,
  ...config.vars,
  WORKERS_TARGET: "staging",
  NEXT_TELEMETRY_DISABLED: "1",
};
for (const key of Object.keys(env)) {
  if (/^(SUPABASE_|SHARE_)/.test(key)) delete env[key];
}
const result = spawnSync(process.execPath, [join(app, "node_modules/vite/bin/vite.js"), "build"], {
  cwd: workspace,
  env,
  stdio: "inherit",
});
if (result.status !== 0) throw new Error("Isolated staging build failed.");
const output = join(app, ".workers", `staging-${randomUUID()}`);
mkdirSync(join(app, ".workers"), { recursive: true });
cpSync(join(workspace, "dist"), output, { recursive: true });
if (!existsSync(join(output, "server/wrangler.json"))) throw new Error("Worker config missing.");
console.log(`Staging build (no server secrets): ${output}`);
console.log(`Temporary source directory retained for inspection: ${workspace}`);
