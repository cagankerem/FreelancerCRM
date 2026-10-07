import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateWorkflow } from "./lib/ci-policy.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = join(root, ".github/workflows");
for (const file of readdirSync(directory).filter((file) => /\.ya?ml$/.test(file)))
  validateWorkflow(readFileSync(join(directory, file), "utf8"), file);
const versions = {
  "linux-x64": ["linux_amd64", "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8"],
  "darwin-arm64": [
    "darwin_arm64",
    "aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f",
  ],
  "darwin-x64": [
    "darwin_amd64",
    "5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644",
  ],
};
const platform = versions[`${process.platform}-${process.arch}`];
assert.ok(platform, "actionlint is pinned for Linux x64 and macOS x64/arm64.");
const temporary = mkdtempSync(join(tmpdir(), "freelancercrm-actionlint-"));
try {
  const response = await fetch(
    `https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_${platform[0]}.tar.gz`,
    { signal: AbortSignal.timeout(60_000) },
  );
  assert.ok(response.ok, "Pinned actionlint download failed");
  const archive = Buffer.from(await response.arrayBuffer());
  assert.equal(
    createHash("sha256").update(archive).digest("hex"),
    platform[1],
    "actionlint checksum mismatch",
  );
  const path = join(temporary, "archive.tar.gz");
  writeFileSync(path, archive);
  const extracted = spawnSync("tar", ["-xzf", path, "-C", temporary, "actionlint"], {
    stdio: "inherit",
  });
  assert.equal(extracted.status, 0);
  const result = spawnSync(join(temporary, "actionlint"), ["-shellcheck=", "-pyflakes="], {
    cwd: root,
    stdio: "inherit",
  });
  assert.equal(result.status, 0, "Workflow syntax/actionlint validation failed");
  console.log("Workflow security policy and actionlint 1.7.12 passed.");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
