import {
  emit,
  importKey,
  localReplayStore,
  open,
  readWire,
  safeFault,
  transportPath,
  RelayFault,
} from "./protocol.mjs";

const consume = localReplayStore();
const localRelayWorker = {
  async fetch(request, env) {
    // No deploy config/entrypoint in the application. Even accidental remote use fails closed.
    const url = new URL(request.url);
    if (env.RELAY_POC_LOCAL_ONLY !== "yes" || url.hostname !== "127.0.0.1")
      return new Response("Local experiment only.", { status: 404 });
    let requestId = crypto.randomUUID();
    let route = "unknown";
    const start = performance.now();
    let response;
    try {
      if (url.pathname !== transportPath || url.search || request.method !== "POST")
        throw new RelayFault("FORBIDDEN");
      const context = await open(
        await readWire(request),
        await importKey(env.RELAY_POC_EPHEMERAL_KEY),
        consume,
      );
      requestId = context.requestId;
      route = context.route;
      emit(console.log, "workerd", "request.started", requestId, route);
      // Synthetic transport fixtures, deliberately NOT product/Auth/DB handlers.
      if (route === "diagnostic.failure") throw new Error(context.secret);
      if (route === "public.page")
        response = new Response(
          `<!doctype html><html><head><meta name="robots" content="noindex"></head><body>Yerel relay deneyi. Destek referansı: ${requestId}</body></html>`,
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      else if (route === "auth.callback")
        response = new Response(null, {
          status: 303,
          headers: { Location: "/__poc/auth-complete" },
        });
      else if (route === "diagnostic.cookies") {
        const headers = new Headers();
        headers.append("Set-Cookie", "relay_poc_a=one; HttpOnly; SameSite=Lax; Path=/");
        headers.append("Set-Cookie", "relay_poc_b=two; HttpOnly; SameSite=Lax; Path=/");
        response = new Response("Synthetic cookie test.", { headers });
      } else if (route === "diagnostic.stream")
        response = new Response(
          new ReadableStream({
            start(controller) {
              const enc = new TextEncoder();
              controller.enqueue(enc.encode("one\n"));
              setTimeout(() => {
                controller.enqueue(enc.encode("two\n"));
                controller.close();
              }, 20);
            },
          }),
          { headers: { "Content-Type": "text/plain" } },
        );
      else
        response = Response.json({
          data: { syntheticOnly: true, operation: route },
          error: null,
          requestId,
        });
      emit(console.log, "workerd", "operation.finished", requestId, route, response.status);
    } catch (error) {
      const safe = safeFault(error);
      response = Response.json(
        { data: null, error: { code: safe.code, message: safe.message }, requestId },
        { status: safe.status },
      );
      emit(console.log, "workerd", "request.rejected", requestId, route, response.status);
    }
    response.headers.set("X-Request-ID", requestId);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    emit(
      console.log,
      "workerd",
      "request.finished",
      requestId,
      route,
      response.status,
      performance.now() - start,
    );
    return response;
  },
};

export default localRelayWorker;
