import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { evaluateAudit, auditSummary } from "./lib/dependency-audit.mjs";

try {
  const mode = process.argv[2];
  assert.ok(["production", "all"].includes(mode) && process.argv.length === 3);
  const production = mode === "production";
  const args = ["audit", ...(production ? ["--omit=dev", "--audit-level=high"] : []), "--json"];
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    cwd: fileURLToPath(new URL("../apps/web/", import.meta.url)),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  const report = JSON.parse(result.stdout);
  const { blocked } = evaluateAudit(report, result.status, production);
  const summary = auditSummary(report, production);
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  if (blocked) {
    console.error("Production high/critical vulnerability: merge gate failed.");
    process.exitCode = 1;
  }
} catch {
  console.error(
    "Dependency audit could not be verified; failing closed. Raw registry output omitted.",
  );
  process.exitCode = 1;
}
