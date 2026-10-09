import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { validateWorkflow } from "./lib/ci-policy.mjs";

const directory = new URL("../.github/workflows/", import.meta.url);
const ci = readFileSync(new URL("ci.yml", directory), "utf8");
test("all workflows enforce SHA pins, minimal permissions and mandatory PR gates", () => {
  for (const file of readdirSync(directory).filter((file) => /\.ya?ml$/.test(file))) {
    validateWorkflow(readFileSync(new URL(file, directory), "utf8"), file);
  }
});
for (const [name, mutate] of [
  ["writable token", (s) => s.replace("contents: read", "contents: write")],
  ["floating Action", (s) => s.replace(/actions\/checkout@[a-f0-9]{40}/, "actions/checkout@v4")],
  [
    "persisted credentials",
    (s) => s.replace("persist-credentials: false", "persist-credentials: true"),
  ],
  ["skipped gate", (s) => s.replace("name: quality", "name: quality\n    if: false")],
  ["soft failure", (s) => s.replace("name: quality", "name: quality\n    continue-on-error: true")],
  ["production secret", (s) => s.replace("npm run build", "echo ${{ secrets.PRODUCTION_KEY }}")],
  ["missing format", (s) => s.replace("npm run format:check", "npm run format")],
  ["missing Workers runtime gate", (s) => s.replace("npm run ci:workers", "npm run workers:check")],
  ["missing cleanup", (s) => s.replace("if: always()", "if: success()")],
  [
    "missing install",
    (s) => s.replace("npm ci --prefix apps/web", "npm install --prefix apps/web"),
  ],
  ["malformed YAML", (s) => `${s}\ninvalid: [unterminated`],
]) {
  test(`CI policy rejects ${name}`, () =>
    assert.throws(() => validateWorkflow(mutate(ci), "ci.yml")));
}
test("CI browser recording is off and no production env is injected", () => {
  const config = readFileSync(new URL("../apps/web/playwright.config.ts", import.meta.url), "utf8");
  for (const option of ["screenshot", "trace", "video"])
    assert.match(config, new RegExp(`${option}: process\\.env\\.CI \\? "off"`));
  assert.doesNotMatch(ci, /NEXT_PUBLIC_SUPABASE|SERVICE_ROLE|SHARE_HMAC|DATABASE_URL/);
});
