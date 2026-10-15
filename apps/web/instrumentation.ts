import type { Instrumentation } from "next";
import { log, activeRequestId } from "@/lib/server/observability";
import { internalRequestIdHeader, isRequestId } from "@/lib/shared/request-id";

export const onRequestError: Instrumentation.onRequestError = (_error, request) => {
  const id = request.headers[internalRequestIdHeader];
  // Framework error objects, URL, headers and stack are deliberately never serialized.
  log({
    event: "render.failed",
    operation: "http",
    requestId: activeRequestId() ?? (isRequestId(id) ? id : "[REDACTED]"),
    outcome: "failure",
    code: "INTERNAL_ERROR",
  });
};
