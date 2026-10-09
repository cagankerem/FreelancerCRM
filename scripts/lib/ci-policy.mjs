import assert from "node:assert/strict";
import { parseDocument } from "../../apps/web/node_modules/yaml/dist/index.js";

export const requiredChecks = ["secret-scan", "quality", "browser", "database", "production-audit"];

export function validateWorkflow(source, filename) {
  const document = parseDocument(source, { uniqueKeys: true });
  assert.deepEqual(document.errors, [], `${filename}: invalid YAML`);
  const workflow = document.toJS();
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
