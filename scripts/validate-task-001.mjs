import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const appDirectory = join(projectDirectory, "apps", "web");
const commandEnvironment = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
};

const verificationCommands = [
  ["clean install", ["ci", "--prefix", "apps/web"]],
  ["lint", ["run", "lint"]],
  ["strict type-check", ["run", "typecheck"]],
  ["production build", ["run", "build"]],
  ["complete test suite and repeat build", ["test"]],
];

for (const [label, arguments_] of verificationCommands) {
  await runCommand(label, arguments_);
}

await smokeTestServer("start");
await smokeTestServer("dev");

console.log("\nTASK-001 validation passed.");
console.log("Clean install, lint, strict types, two production builds, tests,");
console.log("production/development smoke checks, and /demo behavior all passed.");

async function runCommand(label, arguments_) {
  console.log(`\n[TASK-001] ${label}: npm ${arguments_.join(" ")}`);

  const child = spawn("npm", arguments_, {
    cwd: projectDirectory,
    env: commandEnvironment,
    stdio: "inherit",
  });
  const [exitCode, signal] = await once(child, "exit");

  assert.equal(
    exitCode,
    0,
    `npm ${arguments_.join(" ")} failed${signal ? ` with ${signal}` : ""}.`,
  );
}

async function smokeTestServer(script) {
  const port = await findAvailablePort();
  let serverLog = "";

  console.log(`\n[TASK-001] npm run ${script}: checking / and /demo on port ${port}`);
  const child = spawn("npm", ["run", script, "--", "--hostname", HOST, "--port", String(port)], {
    cwd: appDirectory,
    detached: process.platform !== "win32",
    env: commandEnvironment,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const appendLog = (chunk) => {
    const text = chunk.toString();
    serverLog = (serverLog + text).slice(-20_000);
    process.stdout.write(text);
  };
  child.stdout.on("data", appendLog);
  child.stderr.on("data", appendLog);

  try {
    await waitForServer(child, port, () => serverLog);
    await assertHtmlRoute(port, "/", /Hızlı teklif bağlantısı ve tek pencere yönetimi/i);
    await assertHtmlRoute(port, "/demo", /CANLI ÜRÜN TURU/i);
    console.log(`[TASK-001] npm run ${script}: / → 200, /demo → 200`);
  } finally {
    await stopServer(child);
  }
}

async function assertHtmlRoute(port, pathname, expectedContent) {
  const response = await fetch(`http://${HOST}:${port}${pathname}`, {
    headers: { accept: "text/html" },
  });
  const html = await response.text();

  assert.equal(response.status, 200, `${pathname} returned ${response.status}.`);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, expectedContent, `${pathname} lost its expected content contract.`);
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

async function waitForServer(child, port, getServerLog) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js server exited before it became ready.\n${getServerLog()}`);
    }

    try {
      const response = await fetch(`http://${HOST}:${port}/`);
      if (response.status === 200) return;
    } catch {
      // The server may still be binding its port.
    }

    await delay(100);
  }

  throw new Error(`Next.js server did not become ready.\n${getServerLog()}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;

  signalServer(child, "SIGTERM");
  await Promise.race([once(child, "exit"), delay(5_000)]);
  if (child.exitCode !== null) return;

  signalServer(child, "SIGKILL");
  await Promise.race([once(child, "exit"), delay(5_000)]);
}

function signalServer(child, signal) {
  try {
    if (process.platform !== "win32" && child.pid) {
      process.kill(-child.pid, signal);
      return;
    }
  } catch {
    // Fall back to signalling the direct child below.
  }

  child.kill(signal);
}
