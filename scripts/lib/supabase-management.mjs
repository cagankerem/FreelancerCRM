import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

export const testProjectRef = "pbqgjfzylnhaiadlpvkq";
export const stagingOrigin = "https://freelancercrm-staging.cagankeremergun.workers.dev";

function managementToken() {
  assert.notEqual(process.env.CI, "true", "Remote management is forbidden in quality CI.");
  assert.equal(process.platform, "darwin", "This credential helper requires macOS Keychain.");
  const result = spawnSync(
    "/usr/bin/security",
    ["find-generic-password", "-s", "Supabase CLI", "-a", "supabase", "-w"],
    {
      encoding: "utf8",
      timeout: 20_000,
      killSignal: "SIGKILL",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  assert.equal(
    result.status,
    0,
    "Supabase CLI credential unavailable; authenticate or approve Keychain access. No credential output emitted.",
  );
  let token = result.stdout.trim();
  const prefix = "go-keyring-base64:";
  if (token.startsWith(prefix))
    token = Buffer.from(token.slice(prefix.length), "base64").toString();
  assert.ok(
    /^sbp_(oauth_)?[a-f0-9]{40}$/.test(token),
    "Invalid management credential format; value omitted.",
  );
  return token;
}

export async function testManagement(path, options = {}) {
  assert.ok(
    ["/config/auth", "/api-keys?reveal=true"].includes(path),
    "Unapproved management endpoint.",
  );
  const method = options.method ?? "GET";
  assert.ok(
    method === "GET" || (method === "PATCH" && path === "/config/auth"),
    "Unapproved management operation.",
  );
  if (method === "PATCH") {
    assert.deepEqual(options.body, {
      site_url: stagingOrigin,
      uri_allow_list: `${stagingOrigin}/auth/callback`,
    });
  }
  const response = await fetch(`https://api.supabase.com/v1/projects/${testProjectRef}${path}`, {
    method,
    headers: { Authorization: `Bearer ${managementToken()}`, "Content-Type": "application/json" },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    signal: AbortSignal.timeout(20_000),
  });
  assert.ok(
    response.ok,
    `Test management request failed (HTTP ${response.status}); raw response omitted.`,
  );
  try {
    return await response.json();
  } catch {
    throw new Error("Invalid management response; raw data omitted.");
  }
}

export async function testSecretKey() {
  const keys = await testManagement("/api-keys?reveal=true");
  assert.ok(Array.isArray(keys), "Unexpected API key response; values omitted.");
  const secret = keys.find(
    (key) =>
      key.type === "secret" &&
      typeof key.api_key === "string" &&
      key.api_key.startsWith("sb_secret_"),
  );
  assert.ok(secret, "No usable modern secret key in the approved test project.");
  return secret.api_key;
}
