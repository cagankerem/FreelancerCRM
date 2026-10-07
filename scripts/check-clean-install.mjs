import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const path of [
  "node_modules",
  "package-lock.json",
  "apps/web/node_modules",
  "apps/web/.next",
  "supabase/.temp/project-ref",
]) {
  assert.equal(existsSync(join(root, path)), false, `Clean installation requires absent ${path}.`);
}
for (const directory of [root, join(root, "apps/web")]) {
  const envFiles = readdirSync(directory).filter(
    (file) => /^\.env(?:\.|$)/.test(file) && file !== ".env.example",
  );
  assert.deepEqual(envFiles, [], "Clean CI must not depend on local environment files.");
}
assert.ok(existsSync(join(root, "apps/web/package-lock.json")));
console.log(
  "Clean installation preflight passed: one application lockfile, no dependencies, build output or local env.",
);
