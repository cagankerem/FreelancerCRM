import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { internalRequestIdHeader, isRequestId } from "@/lib/shared/request-id";

// The store holds only request-scoped values; never a mutable active global ID.
const context = new AsyncLocalStorage<{ requestId: string }>();
export const operations = [
  "http",
  "auth.session",
  "auth.callback",
  "auth.login",
  "auth.register",
  "auth.logout",
  "profile.save",
  "client.create",
  "proposal.create",
  "proposal.publish",
  "proposal.public",
  "diagnostic",
  "dashboard.read",
  "profile.read",
  "client.list",
  "proposal.list",
  "proposal.read",
] as const;
export type Operation = (typeof operations)[number];
export const errorCodes = {
  INVALID_INPUT: { status: 400, message: "Bilgileri kontrol edip tekrar deneyin." },
  UNAUTHENTICATED: { status: 401, message: "Devam etmek için giriş yapın." },
  FORBIDDEN: { status: 403, message: "Bu işlem için yetkiniz bulunmuyor." },
  NOT_FOUND: { status: 404, message: "İstenen içerik bulunamadı." },
  CONFLICT: { status: 409, message: "Bilgiler değişti. Sayfayı yenileyip tekrar deneyin." },
  UNAVAILABLE: { status: 503, message: "İşlem şu anda tamamlanamıyor. Lütfen tekrar deneyin." },
  INTERNAL_ERROR: {
    status: 500,
    message: "Bir sorun oluştu. Lütfen tekrar deneyin veya destek referansını paylaşın.",
  },
} as const;
export type ErrorCode = keyof typeof errorCodes;
export class SafeError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(code);
  }
}
export function safeError(error: unknown) {
  try {
    const candidate = error instanceof SafeError ? error.code : undefined;
    const code =
      typeof candidate === "string" && Object.hasOwn(errorCodes, candidate)
        ? candidate
        : "INTERNAL_ERROR";
    return { code, ...errorCodes[code] };
  } catch {
    return { code: "INTERNAL_ERROR" as const, ...errorCodes.INTERNAL_ERROR };
  }
}
export function providerError(error: { code?: string } | null | undefined): SafeError {
  // Only stable, explicitly recognized codes. Never infer a class from free-form text.
  switch (error?.code) {
    case "invalid_credentials":
    case "email_not_confirmed":
      return new SafeError("UNAUTHENTICATED");
    case "42501":
    case "user_banned":
      return new SafeError("FORBIDDEN");
    case "23505":
    case "40001":
      return new SafeError("CONFLICT");
    case "23514":
      return new SafeError("INVALID_INPUT");
    case "PGRST116":
      return new SafeError("NOT_FOUND");
    default:
      return new SafeError("UNAVAILABLE");
  }
}
export function newRequestId() {
  return crypto.randomUUID();
}
export function activeRequestId() {
  return context.getStore()?.requestId;
}
export function withRequestId<T>(requestId: string, run: () => T): T {
  if (!isRequestId(requestId)) throw new SafeError("INTERNAL_ERROR");
  return context.run({ requestId }, run);
}
export async function requestId() {
  const active = activeRequestId();
  if (active) return active;
  // Only the ingress proxy can establish this internal header; it always replaces external input.
  const forwarded = (await headers()).get(internalRequestIdHeader);
  if (!isRequestId(forwarded)) throw new SafeError("INTERNAL_ERROR");
  return forwarded;
}

type LogInput = {
  event:
    | "request.started"
    | "request.finished"
    | "proxy.ready"
    | "operation.finished"
    | "operation.failed"
    | "render.failed";
  operation: Operation;
  requestId: string;
  outcome?: "success" | "rejected" | "failure" | "control_flow";
  durationToResponseMs?: number;
  status?: number;
  code?: ErrorCode;
};
type Sink = (line: string) => void;
const events = [
  "request.started",
  "request.finished",
  "proxy.ready",
  "operation.finished",
  "operation.failed",
  "render.failed",
];
// Defense after allowlisting: no arbitrary text, nested data or Error serialization.
export function redact(value: unknown): string {
  return typeof value === "string" && isRequestId(value) ? value : "[REDACTED]";
}
export function log(input: LogInput, sink: Sink = (line) => console.log(line)) {
  try {
    // Read each allowed field once; a stateful getter must not swap the validated value.
    const {
      event: inputEvent,
      operation: inputOperation,
      requestId: inputId,
      outcome: inputOutcome,
      code: inputCode,
      durationToResponseMs: inputDuration,
      status: inputStatus,
    } = input;
    const event = events.includes(inputEvent) ? inputEvent : "operation.failed";
    const operation = operations.includes(inputOperation) ? inputOperation : "http";
    const environment = ["local", "ci", "preview", "staging", "production"].includes(
      process.env.NEXT_PUBLIC_APP_ENV ?? "",
    )
      ? process.env.NEXT_PUBLIC_APP_ENV
      : "local";
    const outcome = ["success", "rejected", "failure", "control_flow"].includes(inputOutcome ?? "")
      ? inputOutcome
      : undefined;
    const code =
      typeof inputCode === "string" && Object.hasOwn(errorCodes, inputCode) ? inputCode : undefined;
    const durationToResponseMs =
      typeof inputDuration === "number" && Number.isFinite(inputDuration)
        ? Math.round(Math.min(Math.max(inputDuration, 0), 86400000))
        : undefined;
    const status =
      typeof inputStatus === "number" &&
      Number.isInteger(inputStatus) &&
      inputStatus >= 100 &&
      inputStatus <= 599
        ? inputStatus
        : undefined;
    sink(
      JSON.stringify({
        time: new Date().toISOString(),
        level: outcome === "failure" ? "error" : outcome === "rejected" ? "warn" : "info",
        environment,
        event,
        operation,
        requestId: redact(inputId),
        durationToResponseMs,
        outcome,
        status,
        code,
      }),
    );
  } catch {
    // Serialization/getters/sink failures cannot affect the response. Never inspect the original value.
    try {
      sink('{"level":"error","event":"logger.failed"}');
    } catch {
      /* No recursive fallback. */
    }
  }
}

export async function operation<T>(name: Operation, run: () => Promise<T>): Promise<T> {
  const id = await requestId();
  return withRequestId(id, async () => {
    const start = performance.now();
    try {
      const result = await run();
      log({
        event: "operation.finished",
        operation: name,
        requestId: id,
        outcome: "success",
        durationToResponseMs: performance.now() - start,
      });
      return result;
    } catch (error) {
      // Next.js redirect/notFound/dynamic-render control flow must retain framework semantics.
      try {
        unstable_rethrow(error);
      } catch (control) {
        log({
          event: "operation.finished",
          operation: name,
          requestId: id,
          outcome: "control_flow",
          durationToResponseMs: performance.now() - start,
        });
        throw control;
      }
      const mapped = safeError(error);
      log({
        event: "operation.failed",
        operation: name,
        requestId: id,
        outcome: mapped.status < 500 ? "rejected" : "failure",
        code: mapped.code,
        durationToResponseMs: performance.now() - start,
      });
      throw new SafeError(mapped.code);
    }
  });
}
