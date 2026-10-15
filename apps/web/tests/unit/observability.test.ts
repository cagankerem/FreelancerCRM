// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
import {
  activeRequestId,
  newRequestId,
  withRequestId,
  log,
  redact,
  SafeError,
  safeError,
  providerError,
  operation,
} from "@/lib/server/observability";
import { isRequestId } from "@/lib/shared/request-id";
import { redirect, notFound } from "next/navigation";

describe("bounded request observability", () => {
  it("preserves framework redirect and notFound control flow", async () => {
    await withRequestId(newRequestId(), async () => {
      await expect(operation("diagnostic", async () => redirect("/demo"))).rejects.toMatchObject({
        digest: expect.stringMatching(/^NEXT_REDIRECT;/),
      });
      await expect(operation("diagnostic", async () => notFound())).rejects.toMatchObject({
        digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/),
      });
    });
  });
  it("uses server UUIDs and rejects spoofed, long and control-character IDs", () => {
    expect(isRequestId(newRequestId())).toBe(true);
    for (const input of [
      null,
      "forged",
      "a".repeat(1000),
      `${newRequestId()}\n`,
      { nested: newRequestId() },
    ])
      expect(isRequestId(input)).toBe(false);
    expect(() => withRequestId("spoofed", () => null)).toThrow();
  });
  it("drops sensitive/nested/unknown fields before serialization and redacts unsafe values", () => {
    const canary = `synthetic-${newRequestId()}@example.invalid`;
    const lines: string[] = [];
    const input = {
      event: "operation.failed",
      operation: "diagnostic",
      requestId: canary,
      email: canary,
      name: canary,
      ip: canary,
      cookie: canary,
      password: canary,
      token: canary,
      message: canary,
      webhookBody: canary,
      aiContent: canary,
      authorization: canary,
      nested: { body: canary },
      error: new Error(canary),
      durationToResponseMs: Infinity,
    };
    // type-boundary: adversarial unknown data deliberately crosses the typed logger boundary.
    log(input as Parameters<typeof log>[0], (line) => lines.push(line));
    expect(lines.some((line) => line.includes(canary))).toBe(false);
    expect(Object.keys(JSON.parse(lines[0]))).toEqual([
      "time",
      "level",
      "environment",
      "event",
      "operation",
      "requestId",
    ]);
    expect(redact({ token: canary })).toBe("[REDACTED]");
  });
  it("handles hostile getters, circular input and failing sinks without leaking or throwing", () => {
    const input = {
      get event() {
        throw new Error("synthetic private detail");
      },
    };
    const sink = vi.fn();
    // type-boundary: hostile runtime input tests the logger's failure boundary.
    expect(() => log(input as unknown as Parameters<typeof log>[0], sink)).not.toThrow();
    expect(sink).toHaveBeenCalledWith('{"level":"error","event":"logger.failed"}');
    expect(() =>
      log({ event: "request.started", operation: "http", requestId: newRequestId() }, () => {
        throw new Error("sink");
      }),
    ).not.toThrow();
  });
  it("maps arbitrary provider errors to fixed safe code/message", () => {
    expect(safeError(new Error("RLS constraint secret"))).toEqual({
      code: "INTERNAL_ERROR",
      status: 500,
      message: expect.any(String),
    });
    expect(safeError(new SafeError("NOT_FOUND")).status).toBe(404);
    expect(JSON.stringify(safeError({ code: "23505", message: "PII" }))).not.toMatch(/PII|23505/);
    expect(providerError({ code: "42501" }).code).toBe("FORBIDDEN");
    expect(providerError({ code: "23505" }).code).toBe("CONFLICT");
    expect(providerError({ code: "private-detail" }).code).toBe("UNAVAILABLE");
  });
  it("does not serialize coercible objects, cycles or stateful getter substitutions", () => {
    const canary = `synthetic-private-${newRequestId()}`;
    const dangerous = { toString: () => "INTERNAL_ERROR", toJSON: () => canary };
    let reads = 0;
    const input = {
      operation: "diagnostic",
      requestId: newRequestId(),
      code: dangerous,
      get event() {
        return ++reads === 1 ? "operation.failed" : dangerous;
      },
      extra: dangerous,
    };
    const lines: string[] = [];
    // type-boundary: runtime object coercion attempts must not pass the string enum allowlist.
    log(input as unknown as Parameters<typeof log>[0], (line) => lines.push(line));
    expect(reads).toBe(1);
    expect(lines.some((line) => line.includes(canary))).toBe(false);
    expect(JSON.parse(lines[0]).code === undefined).toBe(true);
    const cycle: { self?: unknown } = {};
    cycle.self = cycle;
    // type-boundary: circular unknown objects must fail closed without serialization.
    log(cycle as Parameters<typeof log>[0], (line) => lines.push(line));
    expect(lines.join("")).not.toContain("self");
  });
  it("isolates concurrent requests through asynchronous operations", async () => {
    const ids = Array.from({ length: 20 }, newRequestId);
    await Promise.all(
      ids.map((id) =>
        withRequestId(id, async () => {
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
          expect(activeRequestId()).toBe(id);
          await operation("diagnostic", async () => expect(activeRequestId()).toBe(id));
        }),
      ),
    );
    expect(activeRequestId()).toBeUndefined();
  });
});
