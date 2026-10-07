import assert from "node:assert/strict";

export function evaluateAudit(report, status, production) {
  assert.ok([0, 1].includes(status), "Audit process did not complete");
  assert.ok(
    !report.error && report.auditReportVersion === 2,
    "Registry audit unavailable or invalid",
  );
  const counts = report.metadata?.vulnerabilities;
  assert.ok(
    counts && report.vulnerabilities && typeof report.vulnerabilities === "object",
    "Audit report missing data",
  );
  for (const severity of ["info", "low", "moderate", "high", "critical", "total"])
    assert.ok(
      Number.isInteger(counts[severity]) && counts[severity] >= 0,
      "Invalid vulnerability counts",
    );
  const high = Object.values(report.vulnerabilities).filter((item) =>
    ["high", "critical"].includes(item.severity),
  );
  const blocked = production && (counts.high > 0 || counts.critical > 0 || high.length > 0);
  if (status === 1 && counts.total === 0)
    throw new Error("Audit failed without reported vulnerabilities");
  return { counts, blocked };
}

export function auditSummary(report, production) {
  const safe = (value) =>
    String(value)
      .replace(/[^a-zA-Z0-9@/_.-]/g, "?")
      .slice(0, 150);
  const counts = report.metadata.vulnerabilities;
  const lines = [
    `### ${production ? "Production dependency gate" : "Full dependency audit (informational)"}`,
    "",
    `Total: ${counts.total}; critical: ${counts.critical}; high: ${counts.high}; moderate: ${counts.moderate}; low: ${counts.low}.`,
    "",
    "| Package | Severity | Direct | Fix available |",
    "| --- | --- | --- | --- |",
  ];
  for (const [name, item] of Object.entries(report.vulnerabilities).sort())
    lines.push(
      `| ${safe(name)} | ${safe(item.severity)} | ${Boolean(item.isDirect)} | ${Boolean(item.fixAvailable)} |`,
    );
  return `${lines.join("\n")}\n`;
}
