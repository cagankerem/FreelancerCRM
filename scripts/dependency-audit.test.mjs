import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateAudit, auditSummary } from "./lib/dependency-audit.mjs";

function fixture(severity) {
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: severity ? 1 : 0 };
  if (severity) counts[severity] = 1;
  return {
    auditReportVersion: 2,
    metadata: { vulnerabilities: counts },
    vulnerabilities: severity
      ? { synthetic: { severity, isDirect: true, fixAvailable: true } }
      : {},
  };
}
for (const severity of ["high", "critical"])
  test(`production gate rejects ${severity}`, () =>
    assert.equal(evaluateAudit(fixture(severity), 1, true).blocked, true));
test("production gate accepts clean and moderate-only reports", () => {
  assert.equal(evaluateAudit(fixture(), 0, true).blocked, false);
  assert.equal(evaluateAudit(fixture("moderate"), 0, true).blocked, false);
});
test("full tree findings are reported without blocking", () => {
  const report = fixture("critical");
  assert.equal(evaluateAudit(report, 1, false).blocked, false);
  assert.match(auditSummary(report, false), /synthetic.*critical/);
});
test("audit outages, malformed data and unexpected process errors fail closed", () => {
  assert.throws(() => evaluateAudit({ error: { code: "ENETWORK" } }, 1, true));
  assert.throws(() => evaluateAudit(fixture(), 2, true));
  assert.throws(() => evaluateAudit(fixture(), 1, true));
  assert.throws(() => evaluateAudit({}, 0, false));
});
