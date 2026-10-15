import "server-only";

import { operation, requestId, safeError, type Operation } from "@/lib/server/observability";

export async function apiResult<T>(name: Operation, run: () => Promise<T>, headers?: HeadersInit) {
  const id = await requestId();
  const responseHeaders = new Headers(headers);
  responseHeaders.set("X-Request-ID", id);
  responseHeaders.set("Cache-Control", "private, no-store");
  try {
    const data = await operation(name, run);
    return Response.json({ data, error: null, requestId: id }, { headers: responseHeaders });
  } catch (error) {
    // operation has already rethrown framework control flow; do so here as well.
    const { unstable_rethrow } = await import("next/navigation");
    unstable_rethrow(error);
    const { code, message, status } = safeError(error);
    return Response.json(
      { data: null, error: { code, message }, requestId: id },
      { status, headers: responseHeaders },
    );
  }
}
