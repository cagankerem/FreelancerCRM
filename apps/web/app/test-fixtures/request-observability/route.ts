import { NextResponse } from "next/server";
import { apiResult } from "@/lib/server/api-result";
import { SafeError, requestId } from "@/lib/server/observability";
import { publicSupabaseSettings } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const id = await requestId();
  if (!["local", "ci"].includes(publicSupabaseSettings().environment))
    return new Response(null, { status: 404 });
  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === "cookies") {
    const response = NextResponse.redirect(new URL("/demo", request.url));
    response.cookies.set("diagnostic-a", "synthetic", { httpOnly: true });
    response.cookies.set("diagnostic-b", "synthetic", { httpOnly: true });
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Request-ID", id);
    return response;
  }
  if (mode === "stream")
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("synthetic-stream"));
          controller.close();
        },
      }),
      { headers: { "X-Request-ID": id, "Cache-Control": "private, no-store" } },
    );
  return apiResult("diagnostic", async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (mode === "success") return { ready: true };
    if (mode === "invalid") throw new SafeError("INVALID_INPUT");
    // Synthetic runtime-only canary supplied by the local harness; never logged.
    throw new Error(request.headers.get("x-diagnostic-canary") ?? "Controlled synthetic failure");
  });
}
