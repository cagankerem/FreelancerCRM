import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sealPreview } from "./lib/preview-envelope.mjs";

const source = resolve(process.argv[2]);
const output = resolve(process.argv[3]);
assert.ok(
  !process.env.PREVIEW_ARTIFACT_PRIVATE_KEY &&
    !process.env.CLOUDFLARE_API_TOKEN &&
    !process.env.SUPABASE_TEST_MANAGEMENT_TOKEN,
  "Build runner must not receive protected secrets",
);
const temporary = mkdtempSync(join(tmpdir(), "freelancercrm-seal-build-"));
try {
  const archive = join(temporary, "build.tar.gz");
  const result = spawnSync(
    "tar",
    ["-czf", archive, "-C", source, "server", "client", "preview-metadata.json"],
    { stdio: ["ignore", "pipe", "pipe"], timeout: 60000 },
  );
  assert.equal(result.status, 0, "Artifact packaging failed; raw output omitted");
  const payload = readFileSync(archive);
  try {
    const publicKey = readFileSync(
      new URL("./preview-artifact-public.pem", import.meta.url),
      "utf8",
    );
    const encrypted = sealPreview(payload, publicKey);
    mkdirSync(output, { recursive: true, mode: 0o700 });
    writeFileSync(join(output, "preview.enc"), encrypted, { mode: 0o600, flag: "wx" });
  } finally {
    payload.fill(0);
  }
  console.log(
    "Preview build sealed with repository public key; no plaintext server artifact will be uploaded.",
  );
} finally {
  rmSync(temporary, { recursive: true });
}
