import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import {
  account,
  callbackList,
  repository,
  staging,
  target,
  testRef,
  validateArtifactConfig,
} from "./lib/preview-policy.mjs";
import { eligible, github } from "./preview-control.mjs";

const app = resolve(import.meta.dirname, "../apps/web");
const number = process.env.PR_NUMBER;
const { name, origin } = target(number);
const operation = process.env.PREVIEW_OPERATION;
const cfToken = process.env.CLOUDFLARE_API_TOKEN;
const managementToken = process.env.SUPABASE_TEST_MANAGEMENT_TOKEN;
const owner = `${repository}:pr:${number}`;
const owned = (settings) =>
  settings?.bindings?.some(
    (binding) =>
      binding.name === "PREVIEW_OWNER" && binding.type === "plain_text" && binding.text === owner,
  );
assert.ok(cfToken && managementToken, "Protected environment credentials missing");
assert.equal(process.env.GITHUB_REPOSITORY, repository);
assert.equal(process.env.GITHUB_REF, "refs/heads/main");

async function cf(path, method = "GET") {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`, {
    method,
    headers: { Authorization: `Bearer ${cfToken}` },
    signal: AbortSignal.timeout(20000),
  });
  if (response.status === 404) return null;
  assert.ok(
    response.ok,
    `Cloudflare ${method} failed (HTTP ${response.status}); raw response omitted`,
  );
  const body = await response.json();
  assert.equal(body.success, true, "Cloudflare operation unsuccessful; raw response omitted");
  return body.result;
}
async function supabase(path, body) {
  assert.ok(["/config/auth", "/api-keys?reveal=true"].includes(path));
  const response = await fetch(`https://api.supabase.com/v1/projects/${testRef}${path}`, {
    method: body ? "PATCH" : "GET",
    headers: { Authorization: `Bearer ${managementToken}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  assert.ok(
    response.ok,
    `Test management operation failed (HTTP ${response.status}); raw response omitted`,
  );
  return response.json();
}
async function callback(include) {
  const current = await supabase("/config/auth");
  assert.equal(current.site_url, staging, "Staging Site URL must not change");
  const desired = callbackList(current.uri_allow_list, number, include);
  if (desired !== current.uri_allow_list)
    await supabase("/config/auth", { uri_allow_list: desired });
  const checked = await supabase("/config/auth");
  assert.equal(checked.site_url, staging);
  assert.equal(checked.uri_allow_list, desired, "Callback update verification failed");
}

try {
  assert.equal(
    (await cf("/workers/subdomain"))?.subdomain,
    "cagankeremergun",
    "Unexpected Cloudflare account",
  );
  if (operation === "cleanup") {
    assert.equal(
      (await github(`/pulls/${number}`)).state,
      "closed",
      "Never delete an open PR preview",
    );
    const settings = await cf(`/workers/scripts/${name}/settings`);
    if (settings) {
      assert.ok(owned(settings), "Worker ownership tag missing; refusing deletion");
      await cf(`/workers/scripts/${name}`, "DELETE");
      assert.equal(
        await cf(`/workers/scripts/${name}/settings`),
        null,
        "Worker deletion not verified",
      );
    }
    await callback(false);
    console.log(
      `Removed only closed PR ${number}'s Worker and exact callback; staging and DB unchanged.`,
    );
  } else {
    assert.equal(operation, "deploy");
    await eligible(number, process.env.PR_SHA);
    const directory = resolve(process.argv[2]);
    const metadata = JSON.parse(readFileSync(join(directory, "preview-metadata.json"), "utf8"));
    assert.deepEqual(metadata, { pr: Number(number), sha: process.env.PR_SHA });
    const configPath = join(directory, "server/wrangler.json");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    validateArtifactConfig(config, number);
    assert.equal(config.main, "index.js");
    assert.equal(config.assets.directory, "../client");
    assert.equal(config.no_bundle, true);
    // Only known adapter configuration is allowed; no plugins, build commands or extra bindings.
    assert.deepEqual(
      Object.keys(config).sort(),
      [
        "name",
        "main",
        "compatibility_date",
        "compatibility_flags",
        "workers_dev",
        "preview_urls",
        "assets",
        "vars",
        "no_bundle",
        "rules",
      ].sort(),
    );
    function inspect(path) {
      for (const entry of readdirSync(path, { withFileTypes: true })) {
        assert.ok(!entry.isSymbolicLink(), "Artifact symlinks forbidden");
        const file = join(path, entry.name);
        if (entry.isDirectory()) inspect(file);
        else {
          assert.ok(
            !entry.name.startsWith(".env") && !entry.name.startsWith(".dev.vars"),
            "Credential file in artifact",
          );
          const text = readFileSync(file, "utf8");
          assert.ok(
            !/ammrkpwfznlcbdyrqlkn|sb_secret_/.test(text),
            "Production reference or secret key in artifact",
          );
          assert.ok(
            !text.includes(cfToken) && !text.includes(managementToken),
            "Management credential in artifact",
          );
        }
      }
    }
    inspect(directory);
    const previous = await cf(`/workers/scripts/${name}/settings`);
    if (previous)
      assert.ok(owned(previous), "Existing Worker is not owned by this preview workflow");
    const keys = await supabase("/api-keys?reveal=true");
    const key = keys.find(
      (item) => item.type === "secret" && item.api_key?.startsWith("sb_secret_"),
    )?.api_key;
    assert.ok(key, "Modern test server key missing; values omitted");
    const { createClient } = createRequire(join(app, "package.json"))("@supabase/supabase-js");
    const db = createClient(`https://${testRef}.supabase.co`, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    assert.ok(
      !(await db.auth.admin.listUsers({ page: 1, perPage: 1 })).error,
      "Key is not valid for test project",
    );
    config.vars.PREVIEW_OWNER = owner;
    writeFileSync(configPath, JSON.stringify(config));
    const temporary = mkdtempSync(join(tmpdir(), "freelancercrm-preview-secrets-"));
    try {
      const secretFile = join(temporary, "secrets.json");
      writeFileSync(
        secretFile,
        JSON.stringify({
          SUPABASE_SERVICE_ROLE_KEY: key,
          SUPABASE_SERVER_KEY_BINDING: `${testRef}:${createHash("sha256").update(key).digest("hex")}`,
          ...(!previous ? { SHARE_HMAC_KEY_V1: randomBytes(32).toString("hex") } : {}),
        }),
        { mode: 0o600, flag: "wx" },
      );
      const result = spawnSync(
        join(app, "node_modules/.bin/wrangler"),
        ["deploy", "--config", configPath, "--secrets-file", secretFile, "--strict"],
        {
          cwd: app,
          env: {
            PATH: process.env.PATH,
            HOME: process.env.HOME,
            CI: "true",
            CLOUDFLARE_API_TOKEN: cfToken,
            CLOUDFLARE_ACCOUNT_ID: account,
          },
          encoding: "utf8",
          maxBuffer: 32 * 1024 * 1024,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      assert.equal(result.status, 0, "Preview deployment failed; sensitive CLI output omitted");
    } finally {
      rmSync(temporary, { recursive: true });
    }
    await callback(true);
    const settings = await cf(`/workers/scripts/${name}/settings`);
    assert.ok(owned(settings), "Preview ownership tag not applied");
    console.log(`Published reviewed commit ${process.env.PR_SHA} at ${origin}; staging preserved.`);
    // Trusted main acceptance runner; no screenshot, trace, email or raw token output.
    const result = spawnSync(
      process.execPath,
      [join(import.meta.dirname, "test-staging-workers.mjs")],
      {
        cwd: app,
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          PREVIEW_TEST_ORIGIN: origin,
          SUPABASE_PREVIEW_TEST_KEY: key,
        },
        encoding: "utf8",
        timeout: 240000,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    for (const line of (result.stdout ?? "").split("\n"))
      if (/^(ok - |Cleaned up)/.test(line) && !line.includes(key)) console.log(line);
    assert.equal(result.status, 0, "Preview HTTPS/session acceptance failed; raw output omitted");
  }
} catch (error) {
  console.error(
    error instanceof assert.AssertionError
      ? error.message
      : "Preview operation failed; raw error omitted",
  );
  process.exitCode = 1;
}
