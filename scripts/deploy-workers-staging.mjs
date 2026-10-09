import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { testSecretKey } from "./lib/supabase-management.mjs";

const root = resolve(import.meta.dirname, "..");
const app = join(root, "apps/web");
assert.notEqual(process.env.CI, "true", "Staging deployment is not a PR quality operation.");
const directory = resolve(process.argv[2] ?? "");
assert.ok(
  directory.startsWith(`${join(app, ".workers/staging-")}`),
  "Provide the isolated staging build directory.",
);
const configPath = join(directory, "server/wrangler.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
assert.equal(config.name, "freelancercrm-staging");
assert.equal(config.vars?.NEXT_PUBLIC_APP_ENV, "staging");
assert.equal(config.vars?.NEXT_PUBLIC_SUPABASE_URL, "https://pbqgjfzylnhaiadlpvkq.supabase.co");
assert.equal(
  config.vars?.NEXT_PUBLIC_SITE_URL,
  "https://freelancercrm-staging.cagankeremergun.workers.dev",
);
const localValues = existsSync(join(app, ".env.local"))
  ? Object.fromEntries(
      readFileSync(join(app, ".env.local"), "utf8")
        .split("\n")
        .map((line) => line.split(/=(.*)/s).slice(0, 2)),
    )
  : {};
function inspect(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) inspect(file);
    else {
      assert.notEqual(entry.name, ".dev.vars", "Staging must not embed dev variables.");
      const content = readFileSync(file).toString();
      assert.ok(
        !content.includes("ammrkpwfznlcbdyrqlkn"),
        "Production reference found in staging artifacts.",
      );
      for (const name of [
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_SERVER_KEY_BINDING",
        "SHARE_HMAC_KEY_V1",
      ])
        assert.ok(
          !localValues[name] || !content.includes(localValues[name]),
          "Local server secret found in staging artifacts.",
        );
    }
  }
}
inspect(directory);
assert.ok(
  !process.argv[3] || process.argv[3] === "--from-cli",
  "Unknown deployment credential mode.",
);
let key;
if (process.argv[3] === "--from-cli") key = await testSecretKey();
else {
  assert.ok(
    process.stdin.isTTY && process.stdout.isTTY,
    "Run in your own interactive terminal; never send keys through chat.",
  );
  console.log("Only FreelancerCRM-test will be used. Enter its secret API key (input is hidden).");
  key = await new Promise((resolve, reject) => {
    let input = "";
    const onData = (chunk) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          finish();
          reject(new Error("Cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          resolve(input);
          return;
        }
        if (character === "\u007f") input = input.slice(0, -1);
        else if (character >= " ") input += character;
      }
    };
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("data", onData);
      process.stdin.pause();
      console.log();
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}
assert.ok(
  /^sb_secret_[A-Za-z0-9_-]+$/.test(key),
  "Use the test project's modern secret key; value omitted.",
);
const { createClient } = createRequire(join(app, "package.json"))("@supabase/supabase-js");
const client = createClient(config.vars.NEXT_PUBLIC_SUPABASE_URL, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const checked = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
assert.ok(
  !checked.error,
  "Key does not authenticate to the approved test project; no upload attempted.",
);
const schema = await client.from("profiles").select("id", { head: true, count: "exact" });
assert.ok(!schema.error, "Test migrations must be applied before deployment; no upload attempted.");
// Ensure the OAuth account matches the verified account, without printing credentials.
const auth = JSON.parse(
  execFileSync(join(app, "node_modules/.bin/wrangler"), ["auth", "token", "--json"], {
    encoding: "utf8",
    timeout: 20000,
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const account = "8faeda475c4cbf7ca630e8026c85b859";
const verification = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/workers/subdomain`,
  { headers: { Authorization: `Bearer ${auth.token}` }, signal: AbortSignal.timeout(15000) },
);
const subdomain = await verification.json();
assert.equal(subdomain.result?.subdomain, "cagankeremergun");
const previous = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/freelancercrm-staging/settings`,
  { headers: { Authorization: `Bearer ${auth.token}` }, signal: AbortSignal.timeout(15000) },
);
assert.ok(
  previous.ok || previous.status === 404,
  "Cannot determine whether staging already exists.",
);
const temporary = mkdtempSync(join(tmpdir(), "freelancercrm-staging-secrets-"));
try {
  const secrets = join(temporary, "secrets.json");
  const values = {
    SUPABASE_SERVICE_ROLE_KEY: key,
    SUPABASE_SERVER_KEY_BINDING: `pbqgjfzylnhaiadlpvkq:${createHash("sha256").update(key).digest("hex")}`,
    ...(previous.status === 404 ? { SHARE_HMAC_KEY_V1: randomBytes(32).toString("hex") } : {}),
  };
  writeFileSync(secrets, JSON.stringify(values), { flag: "wx", mode: 0o600 });
  const result = spawnSync(
    join(app, "node_modules/.bin/wrangler"),
    ["deploy", "--config", configPath, "--secrets-file", secrets, "--strict"],
    {
      cwd: app,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: account },
    },
  );
  const redact = (text) =>
    Object.values(values).reduce(
      (output, value) => output.split(value).join("[redacted]"),
      text ?? "",
    );
  console.log(redact(result.stdout));
  if (result.stderr) console.error(redact(result.stderr));
  assert.equal(result.status, 0, "Staging deployment failed.");
} finally {
  rmSync(temporary, { recursive: true });
}
console.log("Staging deployment submitted; HTTPS/Auth acceptance checks still need verification.");
