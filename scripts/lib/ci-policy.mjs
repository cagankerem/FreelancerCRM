import assert from "node:assert/strict";
import { parseDocument } from "../../apps/web/node_modules/yaml/dist/index.js";

export const requiredChecks = [
  "secret-scan",
  "quality",
  "browser",
  "database",
  "production-audit",
  "workers-runtime",
];

export function validateWorkflow(source, filename) {
  const document = parseDocument(source, { uniqueKeys: true });
  assert.deepEqual(document.errors, [], `${filename}: invalid YAML`);
  const workflow = document.toJS();
  if (filename === "preview-cleanup-signal.yml") {
    assert.deepEqual(Object.keys(workflow).sort(), [
      "jobs",
      "name",
      "on",
      "permissions",
      "run-name",
    ]);
    assert.equal(workflow.name, "Preview cleanup signal");
    assert.equal(
      workflow["run-name"],
      "Closed preview PR #${{ github.event.pull_request.number }}",
    );
    assert.deepEqual(workflow.on, {
      pull_request_target: { branches: ["main"], types: ["closed"] },
    });
    assert.deepEqual(workflow.permissions, { contents: "read" });
    assert.deepEqual(workflow.jobs, {
      signal: {
        "runs-on": "ubuntu-24.04",
        "timeout-minutes": 1,
        steps: [
          { run: "echo 'A PR closed; trusted main controller will verify cleanup eligibility.'" },
        ],
      },
    });
    return workflow;
  }
  if (filename === "workers-preview.yml") {
    assert.doesNotMatch(JSON.stringify(workflow.env), /secrets/);
    assert.doesNotMatch(source, /secrets\s*\[/, "Dynamic secret selectors forbidden");
    assert.deepEqual(
      Object.keys(workflow.on),
      ["workflow_run", "workflow_dispatch"],
      "Preview publication requires manual dispatch",
    );
    assert.deepEqual(workflow.permissions, {
      contents: "read",
      "pull-requests": "read",
      checks: "read",
      actions: "read",
    });
    assert.deepEqual(workflow.on.workflow_run, {
      workflows: ["Preview cleanup signal"],
      types: ["completed"],
    });
    assert.deepEqual(Object.keys(workflow.jobs), ["preflight", "build", "publish"]);
    assert.equal(workflow.jobs.publish.environment, "workers-preview");
    assert.deepEqual(workflow.jobs.publish.needs, ["preflight", "build"]);
    assert.equal(workflow.concurrency["cancel-in-progress"], false);
    assert.equal(workflow.concurrency.group, "workers-preview-management");
    assert.equal(workflow.jobs.build.if, "needs.preflight.outputs.operation == 'deploy'");
    assert.equal(
      workflow.jobs.publish.if,
      "${{ !cancelled() && needs.preflight.result == 'success' && (needs.build.result == 'success' || needs.preflight.outputs.operation == 'cleanup') }}",
    );
    for (const [id, job] of Object.entries(workflow.jobs)) {
      assert.equal(job["runs-on"], "ubuntu-24.04");
      assert.ok(job["timeout-minutes"] > 0 && job["timeout-minutes"] <= 20);
      assert.ok(!job.permissions && !job["continue-on-error"]);
      assert.doesNotMatch(JSON.stringify(job.env ?? {}), /secrets/);
      for (const step of job.steps) {
        assert.ok(!step["continue-on-error"]);
        if (step.uses) {
          assert.match(step.uses, /^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/);
          if (step.uses.startsWith("actions/checkout@")) {
            assert.equal(step.with?.["persist-credentials"], false);
            assert.ok(
              step.with.ref === "main" ||
                (id === "build" && step.with.ref === "${{ inputs.pr_sha }}"),
            );
          }
          if (step.uses.startsWith("actions/upload-artifact@")) {
            assert.equal(id, "build");
            assert.equal(step.with.path, "preview-sealed/preview.enc");
            assert.equal(step.with.name, "preview-sealed");
            assert.equal(step.with["retention-days"], 1);
            assert.equal(step.with["include-hidden-files"], false);
          }
        }
        const secrets = JSON.stringify(step).match(/secrets\.[A-Z_]+/g) ?? [];
        if (secrets.length) {
          assert.equal(id, "publish");
          assert.equal(step.run, "node scripts/publish-workers-preview.mjs preview-sealed");
          assert.deepEqual(secrets.sort(), [
            "secrets.CLOUDFLARE_API_TOKEN",
            "secrets.PREVIEW_ARTIFACT_PRIVATE_KEY",
            "secrets.SUPABASE_TEST_MANAGEMENT_TOKEN",
          ]);
        }
      }
      if (id !== "publish") assert.doesNotMatch(JSON.stringify(job), /secrets\./);
    }
    assert.doesNotMatch(source, /pull_request_target|--force|PRODUCTION|SUPABASE_ACCESS_TOKEN/);
    const buildSteps = workflow.jobs.build.steps;
    const sealIndex = buildSteps.findIndex(
      (step) =>
        step.run === "node control/scripts/seal-preview-build.mjs preview-dist preview-sealed",
    );
    const uploadIndex = buildSteps.findIndex((step) =>
      step.uses?.startsWith("actions/upload-artifact@"),
    );
    assert.ok(
      sealIndex >= 0 && sealIndex < uploadIndex,
      "Build must seal the archive before upload",
    );
    assert.equal(
      (source.match(/secrets\./g) ?? []).length,
      3,
      "No credentials outside protected publish step",
    );
    return workflow;
  }
  assert.ok(
    workflow.on?.pull_request !== undefined || Object.hasOwn(workflow.on ?? {}, "pull_request"),
    "PR trigger required",
  );
  assert.ok(!Object.hasOwn(workflow.on, "pull_request_target"), "Privileged PR trigger forbidden");
  assert.deepEqual(workflow.permissions, { contents: "read" }, "Only contents: read is allowed");
  assert.doesNotMatch(
    source,
    /secrets\s*(?:\.|\[)|upload-artifact|audit fix|--force|--linked|--db-url|SUPABASE_ACCESS_TOKEN/i,
    "Production credentials, remote DB, raw artifacts or automatic fixes forbidden",
  );
  for (const [id, job] of Object.entries(workflow.jobs)) {
    assert.ok(
      !Object.hasOwn(job, "if") && !job["continue-on-error"],
      `${id}: gate cannot be skipped or softened`,
    );
    assert.ok(job["timeout-minutes"] > 0 && job["timeout-minutes"] <= 30);
    if (job.permissions) assert.deepEqual(job.permissions, { contents: "read" });
    for (const step of job.steps) {
      assert.ok(!step["continue-on-error"], `${id}: failing steps must fail the job`);
      if (Object.hasOwn(step, "if"))
        assert.ok(
          step.run === "npm run ci:db:cleanup" && step.if === "always()",
          "Gate steps cannot be conditionally skipped",
        );
      if (step.uses) {
        assert.match(
          step.uses,
          /^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/,
          "Actions require full commit SHA",
        );
        if (step.uses.startsWith("actions/checkout@"))
          assert.equal(step.with?.["persist-credentials"], false);
      }
    }
  }
  if (filename === "ci.yml") {
    assert.deepEqual(workflow.on.pull_request, { branches: ["main"] });
    assert.deepEqual(workflow.on.push, { branches: ["main"] });
    const ids = [
      "quality",
      "browser",
      "database",
      "production-audit",
      "dependency-report",
      "workers-runtime",
    ];
    assert.deepEqual(Object.keys(workflow.jobs).sort(), ids.sort());
    for (const [id, job] of Object.entries(workflow.jobs)) {
      assert.equal(job.name, id, "Stable required check name");
      assert.equal(job["runs-on"], "ubuntu-24.04", "Disposable GitHub-hosted runner required");
      assert.equal(job.needs, undefined, "Independent gates must each run");
      const runs = job.steps.map((step) => step.run).filter(Boolean);
      assert.ok(runs.includes("npm run ci:clean"));
      assert.ok(runs.indexOf("npm run ci:clean") < runs.indexOf("npm ci --prefix apps/web"));
      assert.ok(runs.includes("npm ci --prefix apps/web"), "Lockfile installation required");
      assert.ok(runs.includes("git diff --exit-code -- apps/web/package-lock.json"));
    }
    const runs = (id) => workflow.jobs[id].steps.map((step) => step.run);
    for (const command of [
      "ci:validate",
      "test:ci",
      "format:check",
      "lint",
      "typecheck",
      "test:unit",
      "build",
      "test:integration",
    ]) {
      assert.ok(runs("quality").includes(`npm run ${command}`), `Missing quality gate ${command}`);
    }
    assert.ok(runs("browser").includes("npm run test:browser"));
    assert.ok(runs("browser").includes("npm run test:observability"));
    assert.ok(runs("browser").includes("npm run build"));
    assert.ok(
      runs("browser").some((run) =>
        /playwright install --with-deps chromium firefox webkit/.test(run),
      ),
    );
    assert.equal(
      workflow.jobs.browser.steps.find((step) => step.run === "npm run test:browser").env
        .PLAYWRIGHT_SERVER_MODE,
      "production",
    );
    assert.ok(runs("database").includes("npm run ci:db"));
    assert.equal(
      workflow.jobs.database.steps.find((step) => step.run === "npm run ci:db:cleanup").if,
      "always()",
    );
    assert.ok(runs("production-audit").includes("npm run audit:production"));
    assert.ok(runs("dependency-report").includes("npm run audit:all"));
    assert.ok(runs("workers-runtime").includes("npm run ci:workers"));
    assert.ok(
      runs("workers-runtime").some((run) =>
        /playwright install --with-deps chromium firefox webkit/.test(run),
      ),
    );
    assert.equal(
      workflow.jobs["workers-runtime"].steps.find((step) => step.run === "npm run ci:db:cleanup")
        .if,
      "always()",
    );
  }
  return workflow;
}
