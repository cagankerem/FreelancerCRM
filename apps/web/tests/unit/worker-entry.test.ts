import { beforeEach, describe, expect, it, vi } from "vitest";
import adapter from "vinext/server/fetch-handler";
import worker from "../../worker-entry.mjs";

vi.mock("vinext/server/fetch-handler", () => ({ default: { fetch: vi.fn() } }));
const context = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };

describe("Workers security boundary", () => {
  beforeEach(() => {
    vi.mocked(adapter.fetch).mockResolvedValue(new Response("ok"));
  });
  it.each(["https://evil.example", "null", null])(
    "rejects foreign/missing origin %s before invoking the adapter",
    async (origin) => {
      const request = new Request("https://test.example/auth/register", {
        method: "POST",
        headers: origin ? { Origin: origin } : {},
      });
      expect((await worker.fetch(request, {}, context)).status).toBe(403);
      expect(adapter.fetch).not.toHaveBeenCalled();
    },
  );
  it("accepts a matching origin without disabling adapter security", async () => {
    const request = new Request("https://test.example/auth/register", {
      method: "POST",
      headers: { Origin: "https://test.example" },
    });
    expect((await worker.fetch(request, {}, context)).status).toBe(200);
    expect(adapter.fetch).toHaveBeenCalledOnce();
  });
  it("adds safe headers to callback redirects without losing session cookies", async () => {
    const headers = new Headers({ Location: "https://test.example/onboarding" });
    headers.append("Set-Cookie", "session=test-only; HttpOnly; Secure; Path=/");
    vi.mocked(adapter.fetch).mockResolvedValue(new Response(null, { status: 307, headers }));
    const response = await worker.fetch(
      new Request("https://test.example/auth/callback"),
      {},
      context,
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("strict-transport-security")).toBe("max-age=31536000");
  });
  it("keeps public proposal referrers private", async () => {
    const response = await worker.fetch(
      new Request("https://test.example/p/synthetic"),
      {},
      context,
    );
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
