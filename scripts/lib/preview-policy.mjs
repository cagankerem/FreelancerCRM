import assert from "node:assert/strict";

export const repository = "cagankerem/FreelancerCRM";
export const account = "8faeda475c4cbf7ca630e8026c85b859";
export const testRef = "pbqgjfzylnhaiadlpvkq";
export const staging = "https://freelancercrm-staging.cagankeremergun.workers.dev";
export const checks = [
  "secret-scan",
  "quality",
  "browser",
  "database",
  "production-audit",
  "workers-runtime",
];

export function assertSecretFreeArtifactText(text) {
  assert.ok(
    !text.includes("ammrkpwfznlcbdyrqlkn"),
    "Production reference in preview artifact; do not upload",
  );
  // The SDK itself contains the type-check prefix. Require an actual key-shaped suffix,
  // never ignore a file/directory or an actual modern key value.
  assert.ok(
    !/sb_secret_[A-Za-z0-9_-]{16,}/.test(text),
    "Server key in preview artifact; do not upload",
  );
}

export function target(number) {
  assert.match(String(number), /^[1-9][0-9]{0,8}$/, "Invalid PR number");
  const name = `freelancercrm-pr-${number}`;
  return { name, origin: `https://${name}.cagankeremergun.workers.dev` };
}

export function approvePullRequest(pr, number, sha, runs) {
  target(number);
  assert.match(sha, /^[a-f0-9]{40}$/, "Exact commit SHA required");
  assert.equal(pr.number, Number(number));
  assert.equal(pr.state, "open", "Deploy only open PRs");
  assert.equal(pr.draft, false, "Draft PR cannot deploy");
  assert.equal(pr.base.ref, "main");
  assert.equal(pr.base.repo.full_name, repository);
  assert.equal(pr.head.repo?.full_name, repository, "Fork code cannot receive test secrets");
  assert.equal(pr.head.sha, sha, "PR changed since approval; dispatch again");
  for (const name of checks) {
    const newest = runs.filter((run) => run.name === name).sort((a, b) => b.id - a.id)[0];
    assert.ok(
      newest &&
        newest.head_sha === sha &&
        newest.app?.id === 15368 &&
        newest.status === "completed" &&
        newest.conclusion === "success",
      `Required check not successful: ${name}`,
    );
  }
}

export function callbackList(current, number, include) {
  const callback = `${target(number).origin}/auth/callback`;
  const values = (current || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  assert.ok(
    values.includes(`${staging}/auth/callback`),
    "Existing staging callback must be preserved",
  );
  assert.ok(
    values.every((value) => !/[*?\[\]]/.test(value)),
    "Wildcard callback already present; review required",
  );
  return [
    ...new Set([...values.filter((value) => value !== callback), ...(include ? [callback] : [])]),
  ].join(",");
}

export function validateArtifactConfig(config, number) {
  const { name, origin } = target(number);
  assert.equal(config.name, name);
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(
    Object.keys(config.vars).sort(),
    [
      "NEXT_PUBLIC_APP_ENV",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
    ].sort(),
  );
  assert.equal(config.vars.NEXT_PUBLIC_APP_ENV, "preview");
  assert.equal(config.vars.NEXT_PUBLIC_SITE_URL, origin);
  assert.equal(config.vars.NEXT_PUBLIC_SUPABASE_URL, `https://${testRef}.supabase.co`);
  assert.match(config.vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/);
  assert.ok(!config.routes?.length && !config.route, "No custom or staging routes allowed");
  assert.ok(
    !config.kv_namespaces?.length &&
      !config.d1_databases?.length &&
      !config.r2_buckets?.length &&
      !config.services?.length,
    "Shared resource bindings forbidden",
  );
}
