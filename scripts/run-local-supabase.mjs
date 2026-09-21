import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { localDockerEnvironment, networkName } from "./lib/local-docker.mjs";

const commands = {
  reset: ["db", "reset", "--local"],
  types: ["gen", "types", "typescript", "--local", "--schema", "public"],
};
try {
  const [command, ...extra] = process.argv.slice(2);
  assert.ok(Object.hasOwn(commands, command), "Expected reset or types.");
  assert.ok(extra.length === 0 || (extra.length === 1 && extra[0] === "--help"), "Local commands accept only --help.");
  const directory = fileURLToPath(new URL("../", import.meta.url));
  const cli = fileURLToPath(new URL("../apps/web/node_modules/supabase/dist/supabase.js", import.meta.url));
  const result = spawnSync(process.execPath, [cli, "--workdir", directory, "--network-id", networkName, ...commands[command], ...extra], {
    cwd: directory, env: localDockerEnvironment(), stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
