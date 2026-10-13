import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { target, testRef, validateArtifactConfig } from "./lib/preview-policy.mjs";

const source = resolve(process.argv[2]);
const output = resolve(process.argv[3]);
const { name, origin } = target(process.env.PR_NUMBER);
for (const key of [
  "CLOUDFLARE_API_TOKEN",
  "SUPABASE_TEST_MANAGEMENT_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
])
  assert.ok(!process.env[key], "Preview build must not receive server credentials");
const temporary = mkdtempSync(join(tmpdir(), "freelancercrm-preview-build-"));
try {
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
  cpSync(join(source, "apps/web"), temporary, {
    recursive: true,
    filter: (path) =>
      !excluded.has(basename(path)) &&
      !basename(path).startsWith(".env") &&
      !basename(path).startsWith(".dev.vars"),
  });
  // Resolve only this reviewed PR's committed lockfile. This runner has no deployment credentials.
  const env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    CI: "true",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  let run = spawnSync("npm", ["ci"], { cwd: temporary, env, stdio: "inherit" });
  assert.equal(run.status, 0, "Preview clean install failed");
  const registry = readFileSync(
    new URL("../apps/web/lib/shared/supabase-projects.ts", import.meta.url),
    "utf8",
  );
  const key = registry.match(/test:\s*\{[\s\S]*?publishableKey:\s*"([^"]+)"/)?.[1];
  assert.match(key ?? "", /^sb_publishable_/);
  const vars = {
    NEXT_PUBLIC_APP_ENV: "preview",
    NEXT_PUBLIC_SUPABASE_URL: `https://${testRef}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    NEXT_PUBLIC_SITE_URL: origin,
  };
  const config = {
    name,
    main: "worker-entry.mjs",
    compatibility_date: "2026-10-06",
    compatibility_flags: ["nodejs_compat"],
    workers_dev: true,
    preview_urls: false,
    assets: { binding: "ASSETS", not_found_handling: "none" },
    vars,
  };
  writeFileSync(join(temporary, "wrangler.json"), JSON.stringify(config));
  run = spawnSync(process.execPath, [join(temporary, "node_modules/vite/bin/vite.js"), "build"], {
    cwd: temporary,
    env: { ...env, ...vars, WORKERS_TARGET: "preview" },
    stdio: "inherit",
  });
  assert.equal(run.status, 0, "Preview Workers build failed");
  const generated = JSON.parse(readFileSync(join(temporary, "dist/server/wrangler.json"), "utf8"));
  validateArtifactConfig(generated, process.env.PR_NUMBER);
  assert.equal(generated.main, "index.js");
  // Reconstruct config: discard build-host paths and any PR-added infrastructure settings.
  writeFileSync(
    join(temporary, "dist/server/wrangler.json"),
    JSON.stringify({
      ...config,
      main: "index.js",
      no_bundle: true,
      rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
      assets: { ...config.assets, directory: "../client" },
    }),
  );
  cpSync(join(temporary, "dist"), output, { recursive: true, errorOnExist: true, force: false });
  function inspect(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      assert.ok(!entry.isSymbolicLink(), "Artifact symlinks forbidden");
      const file = join(path, entry.name);
      if (entry.isDirectory()) inspect(file);
      else
        assert.ok(
          !/ammrkpwfznlcbdyrqlkn|sb_secret_/.test(readFileSync(file, "utf8")),
          "Production reference or server key in preview artifact; do not upload",
        );
    }
  }
  inspect(output);
  writeFileSync(
    join(output, "preview-metadata.json"),
    JSON.stringify({ pr: Number(process.env.PR_NUMBER), sha: process.env.PR_SHA }),
  );
  console.log(`Secret-free preview build completed for ${name}.`);
} finally {
  rmSync(temporary, { recursive: true });
}
