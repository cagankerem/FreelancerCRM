import handler from "vinext/server/fetch-handler";
import { newRequestId, withRequestId, log, safeError } from "./lib/server/observability";

const privateFormPath = (path) =>
  ["/auth/login", "/auth/register", "/onboarding", "/app"].includes(path) ||
  path.startsWith("/app/");

const worker = {
  async fetch(request, env, context) {
    const requestId = newRequestId();
    return withRequestId(requestId, async () => {
      const start = performance.now();
      log({ event: "request.started", operation: "http", requestId });
      const url = new URL(request.url);
      let response;
      if (
        !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
        privateFormPath(url.pathname) &&
        request.headers.get("origin") !== url.origin
      ) {
        response = new Response("Forbidden.", { status: 403 });
      } else {
        try {
          response = await handler.fetch(request, env, context);
        } catch (error) {
          const { code, message, status } = safeError(error);
          log({
            event: "operation.failed",
            operation: "http",
            requestId,
            outcome: "failure",
            code,
          });
          response = url.pathname.startsWith("/api/")
            ? Response.json({ data: null, error: { code, message }, requestId }, { status })
            : new Response(`${message} Destek referansı: ${requestId}`, { status });
          response.headers.set("Cache-Control", "private, no-store");
        }
      }
      // Apply on Worker responses, including redirects/errors: static asset _headers
      // and Next config headers alone do not protect dynamic production responses.
      const headers = new Headers(response.headers);
      if (
        !/^\/_next\/(static|image)\//.test(url.pathname) &&
        !/\.(svg|png|jpg|webp|woff2)$/.test(url.pathname)
      )
        headers.set("X-Request-ID", requestId);
      headers.set("Referrer-Policy", privateFormPath(url.pathname) ? "same-origin" : "no-referrer");
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "DENY");
      headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      if (url.protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000");
      if (
        privateFormPath(url.pathname) ||
        url.pathname.startsWith("/auth/") ||
        url.pathname.startsWith("/p/") ||
        url.pathname.startsWith("/api/public/")
      )
        headers.set("Cache-Control", "private, no-store");
      log({
        event: "request.finished",
        operation: "http",
        requestId,
        outcome:
          response.status >= 500 ? "failure" : response.status >= 400 ? "rejected" : "success",
        status: response.status,
        durationToResponseMs: performance.now() - start,
      });
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    });
  },
};

export default worker;
