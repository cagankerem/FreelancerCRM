import handler from "vinext/server/fetch-handler";

const privateFormPath = (path) =>
  ["/auth/login", "/auth/register", "/onboarding", "/app"].includes(path) ||
  path.startsWith("/app/");

const worker = {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    let response;
    if (
      !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
      privateFormPath(url.pathname) &&
      request.headers.get("origin") !== url.origin
    ) {
      response = new Response("Forbidden.", { status: 403 });
    } else {
      response = await handler.fetch(request, env, context);
    }
    // Apply on Worker responses, including redirects/errors: static asset _headers
    // and Next config headers alone do not protect dynamic production responses.
    const headers = new Headers(response.headers);
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
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export default worker;
