import { describe, expect, it } from "vitest";
import { authOrigin, safeAuthNext, stagingOrigin } from "@/lib/shared/schemas/auth-redirect";

describe("Auth redirect isolation", () => {
  it("accepts exact local and staging origins", () => {
    expect(authOrigin("local")).toBe("http://localhost:3000");
    expect(authOrigin("ci", "http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
    expect(authOrigin("staging", stagingOrigin)).toBe(stagingOrigin);
  });
  it.each([
    "https://production.example",
    "http://localhost:3000",
    `${stagingOrigin}/auth/callback`,
    `${stagingOrigin}?x=1`,
    "https://evil.example",
  ])("rejects a mismatched test origin %s", (origin) => {
    expect(() => authOrigin("staging", origin)).toThrow();
  });
  it("fails closed when cloud origin is absent", () => {
    expect(() => authOrigin("staging")).toThrow();
    expect(() => authOrigin("production", stagingOrigin)).toThrow();
  });
  it.each([
    "//evil.example",
    "https://evil.example",
    "/\\evil.example",
    "/%2f%2fevil.example",
    "/app/../auth/login",
    "/app?next=https://evil.example",
    null,
  ])("rejects unsafe next %s", (next) => {
    expect(safeAuthNext(next)).toBe("/onboarding");
  });
  it("allows the explicit application destinations", () => {
    expect(safeAuthNext("/app")).toBe("/app");
  });
});
