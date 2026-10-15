import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicSupabaseSettings } from "@/lib/server/supabase";
import { supabaseCookieOptions } from "@/lib/shared/schemas/supabase-env";
import {
  activeRequestId,
  newRequestId,
  log,
  withRequestId,
  safeError,
} from "@/lib/server/observability";
import { unstable_rethrow } from "next/navigation";
import { internalRequestIdHeader } from "@/lib/shared/request-id";

export async function proxy(request: NextRequest) {
  const inherited = activeRequestId();
  const id = inherited ?? newRequestId();
  request.headers.set(internalRequestIdHeader, id);
  request.headers.delete("x-request-id");
  return withRequestId(id, async () => {
    const start = performance.now();
    if (!inherited) log({ event: "request.started", operation: "http", requestId: id });
    let response;
    try {
      response = await refreshSession(request);
    } catch (error) {
      unstable_rethrow(error);
      const mapped = safeError(error);
      log({
        event: "operation.failed",
        operation: "auth.session",
        requestId: id,
        outcome: "failure",
        code: mapped.code,
      });
      response = new NextResponse(`${mapped.message} Destek referansı: ${id}`, {
        status: mapped.status,
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    response.headers.set("X-Request-ID", id);
    log({
      event: "proxy.ready",
      operation: "http",
      requestId: id,
      outcome: response.status >= 500 ? "failure" : response.status >= 400 ? "rejected" : "success",
      status: response.status,
      durationToResponseMs: performance.now() - start,
    });
    return response;
  });
}

async function refreshSession(request: NextRequest) {
  if (!/^\/(app|onboarding|auth)(\/|$)/.test(request.nextUrl.pathname))
    return NextResponse.next({ request: { headers: request.headers } });
  const { url, key: publishableKey, environment } = publicSupabaseSettings();
  let response = NextResponse.next({ request: { headers: request.headers } });
  const db = createServerClient(url, publishableKey, {
    cookieOptions: supabaseCookieOptions(environment),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: request.headers } });
        for (const { name, value, options } of values) response.cookies.set(name, value, options);
      },
    },
  });
  await db.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|og.png|file.svg|globe.svg|window.svg).*)",
  ],
};
