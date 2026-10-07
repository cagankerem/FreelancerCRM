import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { requiredChecks } from "./lib/ci-policy.mjs";

// Read-only acceptance audit run by an authenticated maintainer, not a CI token.
const repository = "cagankerem/FreelancerCRM";
const runIds = process.argv.slice(2);
assert.ok(
  runIds.length > 0 && runIds.every((id) => /^\d+$/.test(id)),
  "Provide completed GitHub Actions run IDs",
);
function execute(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 40 * 1024 * 1024 });
  assert.ok(
    !result.error && result.status === 0,
    `${command} evidence query failed; raw output omitted`,
  );
  return result.stdout;
}
function api(path) {
  return JSON.parse(execute("gh", ["api", `repos/${repository}/${path}`]));
}
const temporary = mkdtempSync(join(tmpdir(), "freelancercrm-ci-evidence-"));
try {
  const logs = join(temporary, "logs");
  mkdirSync(logs, { mode: 0o700 });
  assert.equal(execute("gitleaks", ["version"]).trim(), "8.30.1");
  for (const id of runIds) {
    const run = api(`actions/runs/${id}`);
    assert.equal(run.status, "completed", "Run must complete before evidence audit");
    const artifacts = api(`actions/runs/${id}/artifacts`);
    assert.equal(
      artifacts.total_count,
      0,
      "Unexpected CI artifact: review exposure before acceptance",
    );
    for (const job of api(`actions/runs/${id}/jobs?per_page=100`).jobs) {
      assert.equal(job.status, "completed");
      const text = execute("gh", [
        "api",
        "--allow-escape-sequences",
        `repos/${repository}/actions/jobs/${job.id}/logs`,
      ]);
      writeFileSync(join(logs, `${job.id}.txt`), text, { mode: 0o600 });
    }
    console.log(
      `Run ${id}: ${run.conclusion}; zero artifacts; job logs collected only in temporary storage.`,
    );
  }
  const report = join(temporary, "scan.json");
  const scan = spawnSync(
    "gitleaks",
    [
      "dir",
      "--no-banner",
      "--log-level=error",
      "--redact=100",
      "--report-format=json",
      `--report-path=${report}`,
      logs,
    ],
    { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  if (scan.status === 1) {
    for (const finding of JSON.parse(readFileSync(report, "utf8")))
      console.error(
        `CI log finding: job log ${String(finding.File).split("/").at(-1)}, line ${finding.StartLine}, rule ${finding.RuleID}. Value omitted.`,
      );
  }
  assert.ok(!scan.error && scan.status === 0, "CI logs failed secret scan");
  const protection = api("branches/main/protection");
  assert.equal(protection.enforce_admins.enabled, true);
  assert.equal(protection.required_status_checks.strict, true);
  for (const name of requiredChecks)
    assert.ok(
      protection.required_status_checks.checks.some(
        (check) => check.context === name && check.app_id === 15368,
      ),
      `Missing GitHub Actions required check ${name}`,
    );
  console.log(
    "CI log secret scan passed; required checks, GitHub Actions source and admin enforcement verified.",
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
