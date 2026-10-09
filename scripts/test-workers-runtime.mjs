import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import { resolve } from "node:path";
import { createServer } from "node:net";

const app = resolve(import.meta.dirname, "../apps/web");
await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", () =>
    reject(new Error("Port 3000 is occupied; refusing to test an unrelated server.")),
  );
  probe.listen(3000, "127.0.0.1", () => probe.close(resolve));
});
const worker = spawn(
  process.execPath,
  [
    "node_modules/wrangler/bin/wrangler.js",
    "dev",
    "--config",
    "dist/server/wrangler.json",
    "--local",
    "--ip",
    "127.0.0.1",
    "--port",
    "3000",
  ],
  {
    cwd: app,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  },
);
// Wrangler output can describe bindings; do not forward it to logs/artifacts.
worker.stdout.resume();
worker.stderr.resume();
try {
  let ready = false;
  for (let n = 0; n < 120; n++) {
    assert.equal(worker.exitCode, null, "Built Workers runtime exited during startup.");
    try {
      const response = await fetch("http://127.0.0.1:3000", { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Runtime still starting. */
    }
    await setTimeout(1000);
  }
  assert.ok(ready, "Built Workers runtime did not become ready.");
  for (const args of [
    ["node_modules/@playwright/test/cli.js", "test", "--config", "playwright.workers.config.ts"],
    ["scripts/smoke-product-local.mjs"],
  ]) {
    const child = spawn(process.execPath, args, { cwd: app, stdio: "inherit" });
    const status = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", resolve);
    });
    assert.equal(status, 0, "Workers browser/product runtime gate failed.");
  }
} finally {
  if (worker.exitCode === null) {
    if (process.platform === "win32") worker.kill("SIGTERM");
    else process.kill(-worker.pid, "SIGTERM");
    await Promise.race([new Promise((resolve) => worker.once("exit", resolve)), setTimeout(5000)]);
    if (worker.exitCode === null && process.platform !== "win32")
      process.kill(-worker.pid, "SIGKILL");
  }
}
