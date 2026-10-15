import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createServer } from "node:net";
import { createRequire } from "node:module";

const root = resolve(import.meta.dirname, "..");
const app = resolve(root, "apps/web");
const require = createRequire(resolve(app, "package.json"));
const { chromium } = require("@playwright/test");
const workers = process.argv.includes("--workers");
const product = process.argv.includes("--product");
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(product ? 3000 : 0, "127.0.0.1", resolve);
});
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const args = workers
  ? [
      "node_modules/wrangler/bin/wrangler.js",
      "dev",
      "--config",
      "dist/server/wrangler.json",
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
    ]
  : ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)];
const server = spawn(process.execPath, args, {
  cwd: app,
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_APP_ENV: "ci",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_unused_local_test",
  },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
let output = "";
// Capture all framework/platform output for canary assertions, not just application JSON.
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (chunk) => {
    output += chunk;
  });
const base = `http://127.0.0.1:${port}`;
const fixture = "/test-fixtures/request-observability";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const canary = `synthetic-${randomUUID()}@example.invalid`;
const ids = [];
let browser;
try {
  let ready = false;
  for (let n = 0; n < 100; n++) {
    assert.equal(server.exitCode, null, "Runtime exited; raw output is not emitted.");
    try {
      if ((await fetch(base, { signal: AbortSignal.timeout(1000) })).ok) {
        ready = true;
        break;
      }
    } catch {
      /* starting */
    }
    await delay(300);
  }
  assert.ok(ready, "Runtime failed to start.");
  const responses = await Promise.all(
    Array.from({ length: 12 }, async (_, index) => {
      const spoof = randomUUID();
      const mode = index % 3 === 0 ? "success" : index % 3 === 1 ? "invalid" : "failure";
      const response = await fetch(`${base}${fixture}?mode=${mode}`, {
        headers: {
          "X-Request-ID": spoof,
          "x-kapsam-request-id": spoof,
          "x-diagnostic-canary": canary,
        },
      });
      const body = await response.json();
      assert.match(body.requestId ?? "", uuid);
      assert.equal(
        body.requestId,
        response.headers.get("x-request-id"),
        "Ingress/operation/response ID differs.",
      );
      assert.notEqual(body.requestId, spoof);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(
        JSON.stringify(body).includes(canary),
        false,
        "Private canary reached response.",
      );
      assert.deepEqual(Object.keys(body).sort(), ["data", "error", "requestId"]);
      assert.equal(response.status, mode === "success" ? 200 : mode === "invalid" ? 400 : 500);
      assert.ok(
        (mode === "success" ? body.error : body.data) === null,
        "Result null-field contract failed.",
      );
      ids.push(body.requestId);
      return body;
    }),
  );
  assert.equal(new Set(ids).size, 12, "Concurrent request contexts mixed.");
  assert.ok(responses.some((x) => x.error?.code === "INTERNAL_ERROR"));
  const cookies = await fetch(`${base}${fixture}?mode=cookies`, { redirect: "manual" });
  assert.equal(cookies.status, 307);
  assert.equal(cookies.headers.getSetCookie().length, 2, "Set-Cookie values were lost.");
  const location = new URL(cookies.headers.get("location"));
  assert.equal(location.pathname, "/demo");
  assert.ok(["localhost", "127.0.0.1"].includes(location.hostname));
  assert.equal(location.port, String(port));
  const stream = await fetch(`${base}${fixture}?mode=stream`);
  assert.equal(await stream.text(), "synthetic-stream");
  assert.match(stream.headers.get("x-request-id") ?? "", uuid);
  const publicResponse = await fetch(`${base}/api/public/proposals/invalid-synthetic`);
  const publicBody = await publicResponse.json();
  assert.equal(publicResponse.status, 404);
  assert.equal(publicBody.error.code, "NOT_FOUND");
  assert.equal(publicBody.requestId, publicResponse.headers.get("x-request-id"));
  const missingPage = await fetch(`${base}/p/invalid-synthetic`);
  // Next.js documents 200 after the shell streams, 404 before it streams:
  // https://nextjs.org/docs/app/api-reference/file-conventions/not-found
  assert.ok([200, 404].includes(missingPage.status), "Framework notFound became a system failure.");
  const missingHtml = await missingPage.text();
  assert.ok(missingHtml.includes("Sayfa bulunamadı"), "notFound boundary was not rendered.");
  assert.match(missingHtml, /name="robots" content="[^"]*noindex/);
  const asset = await fetch(`${base}/favicon.svg`);
  assert.equal(asset.status, 200);
  assert.equal(
    asset.headers.get("x-request-id"),
    null,
    "Static asset acquired a cached request ID.",
  );
  assert.equal((asset.headers.get("cache-control") ?? "").includes("no-store"), false);
  const first = await fetch(base);
  const second = await fetch(base);
  assert.notEqual(first.headers.get("x-request-id"), second.headers.get("x-request-id"));
  assert.equal(
    (await first.text()).includes(first.headers.get("x-request-id")),
    false,
    "Static HTML contains per-request ID.",
  );
  // Real browser Server Action roundtrip: returned support reference matches its POST header.
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${base}/test-fixtures/request-error`);
  await page.locator('input[name="privateCanary"]').evaluate((element, value) => {
    element.value = value;
  }, canary);
  const actionResponse = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().includes("request-error"),
  );
  await page.getByRole("button", { name: "Kontrollü hata" }).click();
  const action = await actionResponse;
  const actionId = action.headers()["x-request-id"];
  assert.equal(
    (await action.text()).includes(canary),
    false,
    "Action response exposed private form/error data.",
  );
  assert.match(actionId ?? "", uuid);
  const alert = page.locator('[data-slot="error-state"]');
  await alert.waitFor();
  assert.ok(
    (await alert.innerText()).includes(actionId),
    "Error screen lost Server Action support ID.",
  );
  ids.push(actionId);
  await page.setExtraHTTPHeaders({ "x-diagnostic-canary": canary });
  const renderFailure = await page.goto(`${base}/test-fixtures/request-error?render=failure`);
  const renderId = renderFailure.headers()["x-request-id"];
  assert.match(renderId ?? "", uuid);
  await alert.waitFor();
  assert.ok(
    (await alert.innerText()).includes(renderId),
    "Rendered failure lost current request ID.",
  );
  assert.equal(
    (await page.content()).includes(canary),
    false,
    "Rendered error leaked private details.",
  );
  ids.push(renderId);
  await browser.close();
  browser = undefined;
  if (product) {
    const child = spawn(process.execPath, ["scripts/smoke-product-local.mjs"], {
      cwd: app,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let childOutput = "";
    child.stdout.on("data", (chunk) => {
      childOutput += chunk;
    });
    child.stderr.on("data", (chunk) => {
      childOutput += chunk;
    });
    const code = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", resolve);
    });
    assert.equal(
      code,
      0,
      "Synthetic local product/auth/refresh/logout regression failed; sensitive subprocess output not emitted.",
    );
    console.log(
      `Local product/auth regression passed (${childOutput.split(/\r?\n/).filter((line) => line.startsWith("ok -")).length} checks, owned synthetic account cleanup).`,
    );
  }
  await delay(200);
  const logs = output.split(/\r?\n/).flatMap((line) => {
    try {
      return [JSON.parse(line.trim())];
    } catch {
      return [];
    }
  });
  for (const id of ids) {
    assert.ok(
      logs.some((x) => x.requestId === id && x.event === "request.started"),
      "Missing ingress correlation log.",
    );
    assert.ok(
      logs.some((x) => x.requestId === id && /^operation\./.test(x.event)),
      "Missing operation correlation log.",
    );
    if (workers)
      assert.ok(
        logs.some((x) => x.requestId === id && x.event === "request.finished"),
        "Worker ingress ID differs from handler.",
      );
  }
  assert.equal(
    output.includes(canary),
    false,
    "Private canary reached framework/platform/application output.",
  );
  if (process.argv.includes("--audit-platform-urls")) {
    const urlCanary = `synthetic-path-${randomUUID()}`;
    const queryCanary = `synthetic-query-${randomUUID()}`;
    await fetch(`${base}/api/public/proposals/${urlCanary}?code=${queryCanary}`);
    await delay(300);
    const pathExposed = output.includes(urlCanary);
    const queryExposed = output.includes(queryCanary);
    console.log(
      "Automatic URL canary audit:",
      JSON.stringify({
        pathExposed,
        queryExposed,
        wranglerOutput: output
          .split(/\r?\n/)
          .some((line) => line.includes(urlCanary) && /wrangler/i.test(line)),
      }),
    );
    assert.equal(
      pathExposed || queryExposed,
      false,
      "Automatic framework/platform URL logging exposed a synthetic path/query canary; application redaction cannot sanitize that logger.",
    );
  }
  console.log(
    `Request observability: ${workers ? "workerd" : "native Next.js"} passed (concurrency, JSON, cookies, redirects, streaming, public 404, static cache, browser Server Action and captured log canaries).`,
  );
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    process.kill(-server.pid, "SIGTERM");
    await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(5000)]);
    if (server.exitCode === null) process.kill(-server.pid, "SIGKILL");
  }
}
