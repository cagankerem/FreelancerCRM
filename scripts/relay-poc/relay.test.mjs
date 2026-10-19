import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import {
  audience,
  emit,
  ephemeralKey,
  importKey,
  localOrigin,
  localReplayStore,
  open,
  seal,
  transportPath,
} from "./protocol.mjs";
import { startGateway } from "./gateway.mjs";

const require = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { Miniflare, Log, LogLevel, convertV4MiniflareOptions } = require("miniflare");
const runtime = [],
  gatewayLogs = [],
  wires = [],
  canaries = [];
const rawKey = ephemeralKey();
canaries.push(rawKey);
const failureSecret = `synthetic-failure-${crypto.randomUUID()}`;
canaries.push(failureSecret);
const key = await importKey(rawKey);
let mf,
  gateway,
  upstream,
  egressAttempts = 0,
  observedLogicalRequests = 0;
class CapturedLog extends Log {
  log(message) {
    runtime.push(String(message));
  }
}
before(async () => {
  try {
    // The installed Miniflare 5 accepts config/workers[], not the old flat API.
    // Use its public adapter, also used by the installed Wrangler.
    mf = new Miniflare(
      convertV4MiniflareOptions({
        host: "127.0.0.1",
        port: 0,
        cf: false,
        telemetry: { enabled: false },
        modulesRoot: fileURLToPath(new URL("./", import.meta.url)),
        modules: ["worker.mjs", "protocol.mjs"].map((name) => ({
          type: "ESModule",
          path: fileURLToPath(new URL(name, import.meta.url)),
        })),
        unsafeRegisterWorker: false,
        compatibilityDate: "2026-10-06",
        log: new CapturedLog(LogLevel.VERBOSE),
        // Workerd stdout/stderr bypasses Log in Miniflare 5. Capture that
        // documented channel too, at full visibility, for the same assertions.
        handleStructuredLogs: (record) => runtime.push(record.message),
        bindings: { RELAY_POC_LOCAL_ONLY: "yes", RELAY_POC_EPHEMERAL_KEY: rawKey },
        outboundService: () => {
          egressAttempts++;
          return new Response("External network disabled.", { status: 403 });
        },
      }),
    );
    upstream = (await mf.ready).origin;
    gateway = await startGateway({
      upstream,
      key,
      failureSecret,
      sink: (line) => gatewayLogs.push(line),
      observeWire: (value) => wires.push(value),
    });
  } catch {
    throw new Error("Local relay/workerd setup failed; raw diagnostics withheld.");
  }
});
after(async () => {
  let gatewayClosed = false,
    workerDisposed = false;
  try {
    if (gateway) {
      await gateway.close();
      gatewayClosed = true;
    }
  } finally {
    if (mf) {
      await mf.dispose();
      workerDisposed = true;
    }
  }
  console.log(
    JSON.stringify({
      localRelayCleanup: { gatewayClosed, workerDisposed },
      fixtureFilesWrittenByHarness: false,
    }),
  );
});
const safeAssert = (condition, message) => assert.ok(condition, message);
const syntheticToken = () => {
  const value = `${crypto.randomUUID()}.${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url")}`;
  canaries.push(value);
  return value;
};
const sendEnvelope = (body) =>
  fetch(new URL(transportPath, upstream), {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

test("AEAD binds metadata and rejects tampering, audience, age and hostile IDs", async () => {
  const secret = `synthetic-unit-${crypto.randomUUID()}`;
  canaries.push(secret);
  const envelope = await seal("public.api", secret, key);
  const opened = await open(envelope, key, localReplayStore());
  safeAssert(
    opened.secret === secret && opened.requestId === envelope.requestId,
    "Authenticated context mismatch; values withheld.",
  );
  for (const mutation of [
    { requestId: "x".repeat(1000) },
    { requestId: "id\nforged" },
    { requestId: crypto.randomUUID() },
    { aud: audience + "-other" },
    { issuedAt: Date.now() - 31000 },
    { issuedAt: Date.now() + 10000 },
    { route: "auth.callback" },
    { box: (envelope.box[0] === "A" ? "B" : "A") + envelope.box.slice(1) },
    { nested: { secret } },
  ]) {
    await assert.rejects(() => open({ ...envelope, ...mutation }, key, localReplayStore()), {
      message: "Local relay rejected.",
    });
  }
  await assert.rejects(() => seal("public.api", { nested: secret }, key), {
    message: "Local relay rejected.",
  });
});
test("replay consumption is atomic locally; capacity fails closed without eviction", async () => {
  const store = localReplayStore(1),
    envelope = await seal("public.api", "unit-only", key);
  const settled = await Promise.allSettled([
    open(envelope, key, store),
    open(envelope, key, store),
  ]);
  safeAssert(
    settled.filter((value) => value.status === "fulfilled").length === 1,
    "Replay accepted more than once.",
  );
  await assert.rejects(
    async () => open(await seal("public.api", "second-unit", key), key, store),
    (error) => error.code === "CAPACITY",
  );
});
test("allowlisted telemetry never serializes hostile event fields; sink failure is harmless", () => {
  const lines = [],
    secret = `synthetic-logger-${crypto.randomUUID()}`;
  canaries.push(secret);
  emit((value) => lines.push(value), secret, secret, secret, { nested: secret }, secret, {
    toJSON: () => secret,
  });
  safeAssert(
    lines.length === 1 && !lines[0].includes(secret),
    "Logger allowlist leaked synthetic input.",
  );
  emit(
    () => {
      throw new Error(secret);
    },
    "gateway",
    "request.started",
    crypto.randomUUID(),
    "public.api",
  );
});
test("gateway cannot become a remote open proxy", () => {
  for (const target of [
    "https://example.invalid/",
    "http://localhost:8000/",
    "http://127.0.0.1:8000/?target=elsewhere",
    "http://user:password@127.0.0.1:8000/",
  ])
    assert.throws(() => localOrigin(target), { message: "Local relay rejected." });
});
test("real gateway to workerd keeps IDs isolated and never forwards a bearer URL", async () => {
  const ids = await Promise.all(
    Array.from({ length: 12 }, async () => {
      const token = syntheticToken(),
        spoof = crypto.randomUUID();
      const response = await fetch(`${gateway.origin}/api/public/proposals/${token}`, {
        headers: { "X-Request-ID": spoof, "x-kapsam-request-id": spoof },
      });
      const body = await response.json(),
        id = response.headers.get("x-request-id");
      safeAssert(
        response.status === 200 && body.requestId === id && id !== spoof,
        "Relay correlation/spoofing failed.",
      );
      safeAssert(
        body.data?.syntheticOnly === true &&
          body.error === null &&
          !JSON.stringify(body).includes(token),
        "Synthetic relay JSON envelope leaked context.",
      );
      safeAssert(
        wires.every((wire) => wire.url === new URL(transportPath, upstream).href),
        "Upstream URL was influenced by external input.",
      );
      return id;
    }),
  );
  safeAssert(new Set(ids).size === 12, "Concurrent request IDs mixed.");
  await new Promise((resolve) => setTimeout(resolve, 200));
  const lines = [...gatewayLogs, ...runtime].flatMap((line) => {
    try {
      return [JSON.parse(line.replace(/^.*?(?=\{"time")/, ""))];
    } catch {
      return [];
    }
  });
  for (const id of ids)
    for (const [stage, event] of [
      ["gateway", "request.started"],
      ["workerd", "request.started"],
      ["workerd", "operation.finished"],
      ["workerd", "request.finished"],
      ["gateway", "request.finished"],
    ])
      safeAssert(
        lines.some((line) => line.requestId === id && line.stage === stage && line.event === event),
        "Matching positive-control event missing; no privacy pass.",
      );
  observedLogicalRequests = ids.length;
});
test("synthetic SSR, Auth query transport, cookie and stream responses survive real hops", async () => {
  const html = await fetch(`${gateway.origin}/p/${syntheticToken()}`),
    id = html.headers.get("x-request-id");
  safeAssert(
    html.status === 200 && (await html.text()).includes(id),
    "Synthetic SSR support ID missing.",
  );
  const code = `synthetic-code-${crypto.randomUUID()}`;
  canaries.push(code);
  const callback = await fetch(`${gateway.origin}/auth/callback?code=${code}`, {
    redirect: "manual",
  });
  safeAssert(
    callback.status === 303 && callback.headers.get("location") === "/__poc/auth-complete",
    "Synthetic callback redirect mismatch.",
  );
  const cookies = await fetch(`${gateway.origin}/__poc/cookies`);
  safeAssert(cookies.headers.getSetCookie().length === 2, "Multiple Set-Cookie headers lost.");
  const stream = await fetch(`${gateway.origin}/__poc/stream`);
  safeAssert((await stream.text()) === "one\ntwo\n", "Streaming response damaged.");
  safeAssert(
    stream.headers.get("cache-control") === "private, no-store",
    "Private cache policy damaged.",
  );
});
test("controlled Error content stays private and response has a safe code and support ID", async () => {
  const response = await fetch(`${gateway.origin}/__poc/failure`),
    body = await response.json();
  safeAssert(
    response.status === 500 &&
      body.data === null &&
      body.error?.code === "INTERNAL_ERROR" &&
      body.requestId === response.headers.get("x-request-id") &&
      !JSON.stringify(body).includes(failureSecret),
    "Safe failure contract failed; raw values withheld.",
  );
});
test("workerd rejects unsigned/replayed/oversized requests without trusting external IDs", async () => {
  const spoof = crypto.randomUUID();
  const unsigned = await fetch(new URL(transportPath, upstream), {
    method: "POST",
    headers: { "X-Request-ID": spoof },
    body: "{}",
  });
  safeAssert(
    unsigned.status === 403 && unsigned.headers.get("x-request-id") !== spoof,
    "Untrusted transport ID accepted.",
  );
  const envelope = await seal("public.api", "synthetic-replay", key);
  safeAssert((await sendEnvelope(envelope)).status === 200, "Replay positive control missing.");
  safeAssert((await sendEnvelope(envelope)).status === 409, "Replay not rejected.");
  safeAssert((await sendEnvelope("x".repeat(20000))).status === 400, "Wire body limit missing.");
});
test("all captured runtime/gateway logs and transport are canary-free with positive events", async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  safeAssert(
    observedLogicalRequests === 12 &&
      runtime.length > 0 &&
      gatewayLogs.length > 0 &&
      wires.length >= 16,
    "No observations; privacy result is inconclusive.",
  );
  const logs = [...runtime, ...gatewayLogs].join("\n"),
    wireText = JSON.stringify(wires);
  for (const secret of canaries) {
    safeAssert(
      !logs.includes(secret),
      "Synthetic sensitive content reached captured logs; value withheld.",
    );
    safeAssert(
      !wireText.includes(secret),
      "Sensitive plaintext reached relay transport; value withheld.",
    );
  }
  safeAssert(egressAttempts === 0, "PoC attempted external egress.");
});
