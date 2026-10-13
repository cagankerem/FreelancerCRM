// Trusted main-branch controller. Never run a PR copy of this script with credentials.
import assert from "node:assert/strict";
import { appendFileSync, readFileSync } from "node:fs";
import { approvePullRequest, repository, target } from "./lib/preview-policy.mjs";

export async function github(path) {
  assert.ok(process.env.GH_TOKEN, "GitHub read token required");
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    signal: AbortSignal.timeout(20000),
  });
  assert.ok(response.ok, `GitHub request failed (HTTP ${response.status}); raw response omitted`);
  return response.json();
}

export async function eligible(number, sha) {
  const pr = await github(`/pulls/${number}`);
  const runs = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await github(`/commits/${sha}/check-runs?per_page=100&page=${page}`);
    runs.push(...batch.check_runs);
    if (batch.check_runs.length < 100) break;
    assert.notEqual(page, 10, "Too many check runs; manual review needed");
  }
  approvePullRequest(pr, number, sha, runs);
  return pr;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    assert.equal(process.env.GITHUB_REPOSITORY, repository);
    assert.equal(process.env.GITHUB_REF, "refs/heads/main", "Dispatch trusted main only");
    const operation = process.env.PREVIEW_OPERATION;
    assert.ok(["deploy", "cleanup"].includes(operation));
    let number = process.env.PR_NUMBER;
    if (process.env.GITHUB_EVENT_NAME === "workflow_run") {
      assert.equal(operation, "cleanup");
      const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
      const run = await github(`/actions/runs/${event.workflow_run.id}`);
      assert.equal(run.path, ".github/workflows/preview-cleanup-signal.yml");
      assert.equal(run.event, "pull_request");
      assert.equal(run.conclusion, "success");
      const candidates = await github(`/commits/${run.head_sha}/pulls`);
      const closed = candidates.filter(
        (pr) =>
          pr.state === "closed" &&
          pr.base.ref === "main" &&
          pr.base.repo.full_name === repository &&
          pr.head.repo?.full_name === repository &&
          (pr.head.sha === run.head_sha || pr.merge_commit_sha === run.head_sha),
      );
      assert.equal(
        closed.length,
        1,
        "Cleanup signal must identify exactly one closed same-repository PR",
      );
      number = String(closed[0].number);
    }
    target(number);
    if (operation === "deploy") await eligible(number, process.env.PR_SHA);
    else
      assert.equal(
        (await github(`/pulls/${number}`)).state,
        "closed",
        "Cleanup requires closed PR",
      );
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, `operation=${operation}\nnumber=${number}\n`);
    console.log(`Preview ${operation} preflight passed for PR ${number}.`);
  } catch (error) {
    console.error(
      error instanceof assert.AssertionError
        ? error.message
        : "Preview preflight failed; raw error omitted",
    );
    process.exitCode = 1;
  }
}
