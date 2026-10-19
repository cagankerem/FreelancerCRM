import { createServer } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { emit, localOrigin, safeFault, seal, transportPath, RelayFault } from "./protocol.mjs";

function classify(url, failureSecret) {
  if (url.pathname === "/auth/callback") {
    if (
      [...url.searchParams.keys()].some((k) => k !== "code") ||
      url.searchParams.getAll("code").length !== 1
    )
      throw new RelayFault("INVALID_INPUT");
    return { route: "auth.callback", secret: url.searchParams.get("code") };
  }
  if (url.search) throw new RelayFault("INVALID_INPUT");
  const match = url.pathname.match(
    /^\/(p|api\/public\/proposals)\/([0-9a-f-]{36}\.[A-Za-z0-9_-]{43})$/,
  );
  if (match) return { route: match[1] === "p" ? "public.page" : "public.api", secret: match[2] };
  const diagnostic = {
    "/__poc/failure": "diagnostic.failure",
    "/__poc/stream": "diagnostic.stream",
    "/__poc/cookies": "diagnostic.cookies",
  };
  if (Object.hasOwn(diagnostic, url.pathname))
    return { route: diagnostic[url.pathname], secret: failureSecret };
  throw new RelayFault("INVALID_INPUT");
}
export async function startGateway({
  upstream,
  key,
  sink,
  observeWire = () => {},
  failureSecret = crypto.randomUUID(),
}) {
  // Absolute target originates only from the harness, never a request/header/query.
  const fixed = new URL(transportPath, localOrigin(upstream));
  const server = createServer(async (incoming, outgoing) => {
    const requestId = crypto.randomUUID();
    const start = performance.now();
    let route = "unknown";
    const abort = new AbortController();
    outgoing.on("close", () => {
      if (!outgoing.writableEnded) abort.abort();
    });
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      if (
        incoming.method !== "GET" ||
        incoming.headers.host !== new URL(origin).host ||
        Number(incoming.headers["content-length"] ?? 0) !== 0 ||
        incoming.headers["transfer-encoding"]
      )
        throw new RelayFault("FORBIDDEN");
      const url = new URL(incoming.url, origin);
      if (url.origin !== origin || incoming.url.length > 4096) throw new RelayFault("FORBIDDEN");
      const context = classify(url, failureSecret);
      route = context.route;
      emit(sink, "gateway", "request.started", requestId, route);
      const body = JSON.stringify(await seal(route, context.secret, key, { requestId }));
      // Test observation hook stays in memory; no write/log of this envelope.
      observeWire({ url: fixed.href, body });
      const upstreamResponse = await fetch(fixed, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        redirect: "manual",
        signal: abort.signal,
      });
      if (upstreamResponse.headers.get("x-request-id") !== requestId)
        throw new RelayFault("INTERNAL_ERROR");
      outgoing.statusCode = upstreamResponse.status;
      for (const name of ["content-type", "cache-control", "referrer-policy", "x-request-id"]) {
        const value = upstreamResponse.headers.get(name);
        if (value) outgoing.setHeader(name, value);
      }
      const location = upstreamResponse.headers.get("location");
      if (location) {
        if (!/^\/__poc\/[a-z-]+$/.test(location)) throw new RelayFault("FORBIDDEN");
        outgoing.setHeader("Location", location);
      }
      const cookies = upstreamResponse.headers.getSetCookie();
      if (cookies.length) outgoing.setHeader("Set-Cookie", cookies);
      emit(
        sink,
        "gateway",
        "request.finished",
        requestId,
        route,
        outgoing.statusCode,
        performance.now() - start,
      );
      if (upstreamResponse.body) await pipeline(Readable.fromWeb(upstreamResponse.body), outgoing);
      else outgoing.end();
    } catch (error) {
      const safe = safeFault(error);
      emit(sink, "gateway", "request.rejected", requestId, route, safe.status);
      if (!outgoing.headersSent) {
        outgoing.writeHead(safe.status, {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "Cache-Control": "private, no-store",
        });
        outgoing.end(
          JSON.stringify({
            data: null,
            error: { code: safe.code, message: safe.message },
            requestId,
          }),
        );
      } else outgoing.destroy();
    }
  });
  server.on("clientError", (_error, socket) => {
    emit(sink, "gateway", "request.rejected", crypto.randomUUID(), "unknown", 400);
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
