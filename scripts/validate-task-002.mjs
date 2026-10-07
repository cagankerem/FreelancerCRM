import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readdir, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const appDirectory = join(projectDirectory, "apps", "web");
const nextOutputDirectory = join(appDirectory, ".next");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const commandEnvironment = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
};

assert.equal(
  nextOutputDirectory,
  join(projectDirectory, "apps", "web", ".next"),
  "Refusing to clean an unexpected Next.js output directory.",
);

console.log("\n[TASK-002] cleaning generated Next.js output");
await rm(nextOutputDirectory, { force: true, recursive: true });

await runCommand("lint", npmCommand, ["run", "lint"]);
await runCommand("strict type-check", npmCommand, ["run", "typecheck"]);
await runCommand("form, schema, and state unit/integration tests", npmCommand, [
  "run",
  "test:unit",
]);
await runCommand("production build", npmCommand, ["run", "build", "--", "--webpack"]);

const nodeTestFiles = (
  await readdir(join(appDirectory, "tests"), {
    withFileTypes: true,
  })
)
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.mjs"))
  .map((entry) => join(appDirectory, "tests", entry.name))
  .sort();

assert.ok(nodeTestFiles.length > 0, "No existing node:test files were found.");
await runCommand("existing boundary and render tests", process.execPath, [
  "--test",
  "--test-concurrency=1",
  ...nodeTestFiles,
]);

const port = await findAvailablePort();
await runCommand(
  "Chromium full matrix plus Firefox and WebKit critical smoke tests",
  npmCommand,
  ["run", "test:browser"],
  {
    ...commandEnvironment,
    CI: "1",
    PLAYWRIGHT_PORT: String(port),
  },
);

console.log("\nTASK-002 validation passed.");
console.log("Lint, strict types, unit/integration, production build, existing");
console.log("node:test coverage, Chromium full matrix, Firefox/WebKit smoke,");
console.log("keyboard/focus, responsive, motion, and light/dark axe passed.");

async function runCommand(label, executable, arguments_, environment = commandEnvironment) {
  console.log(`\n[TASK-002] ${label}: ${executable} ${arguments_.join(" ")}`);

  const child = spawn(executable, arguments_, {
    cwd: appDirectory,
    env: environment,
    stdio: "inherit",
  });
  const [exitCode, signal] = await once(child, "exit");

  assert.equal(
    exitCode,
    0,
    `${executable} ${arguments_.join(" ")} failed${signal ? ` with ${signal}` : ""}.`,
  );
}

async function findAvailablePort() {
  const server = createServer();
  server.unref();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, HOST, resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const { port } = address;

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return port;
}
