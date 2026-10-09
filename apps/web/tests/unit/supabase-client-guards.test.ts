import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { supabaseProjects } from "@/lib/shared/supabase-projects";

vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({})),
  createServerClient: vi.fn(() => ({})),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({})) }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { browserClient } from "@/lib/client/supabase";
import { serviceClient, userClient } from "@/lib/server/supabase";
import { proxy } from "@/proxy";
import type { NextRequest } from "next/server";

afterEach(() => vi.unstubAllEnvs());
const configure = (environment: string, project: "test" | "production") => {
  vi.stubEnv("CI", "false");
  vi.stubEnv("NEXT_PUBLIC_APP_ENV", environment);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseProjects[project].url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", supabaseProjects[project].publishableKey);
};
const jwt = (role: string, ref: string) =>
  `e30.${Buffer.from(JSON.stringify({ role, ref })).toString("base64url")}.unused`;

describe("Supabase client guards run before client creation/network", () => {
  it("rejects staging pointed at production in browser and server", async () => {
    configure("staging", "production");
    expect(() => browserClient()).toThrow();
    await expect(userClient()).rejects.toThrow();
    await expect(proxy({} as NextRequest)).rejects.toThrow();
    expect(() => serviceClient()).toThrow();
    expect(createBrowserClient).not.toHaveBeenCalled();
    expect(createServerClient).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });
  it("rejects cloud in CI even if the selector was changed", async () => {
    configure("staging", "test");
    vi.stubEnv("CI", "true");
    await expect(userClient()).rejects.toThrow("independent local");
    expect(createServerClient).not.toHaveBeenCalled();
  });
  it("rejects a production legacy server key in staging", () => {
    configure("staging", "test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", jwt("service_role", supabaseProjects.production.ref));
    expect(() => serviceClient()).toThrow("key/project mismatch");
    expect(createClient).not.toHaveBeenCalled();
  });
  it("rejects an anon key as a server key", () => {
    configure("staging", "test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", jwt("anon", supabaseProjects.test.ref));
    expect(() => serviceClient()).toThrow();
    expect(createClient).not.toHaveBeenCalled();
  });
  it("rejects an opaque server key without an independently provisioned binding", () => {
    configure("staging", "test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_synthetic-unused");
    vi.stubEnv("SUPABASE_SERVER_KEY_BINDING", "");
    expect(() => serviceClient()).toThrow("not bound");
    expect(createClient).not.toHaveBeenCalled();
  });
  it("accepts a matching opaque server key binding", () => {
    configure("staging", "test");
    const key = "sb_secret_synthetic-unused";
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", key);
    vi.stubEnv(
      "SUPABASE_SERVER_KEY_BINDING",
      `${supabaseProjects.test.ref}:${createHash("sha256").update(key).digest("hex")}`,
    );
    serviceClient();
    expect(createClient).toHaveBeenCalledWith(supabaseProjects.test.url, key, expect.any(Object));
  });
  it("creates public clients for the approved test configuration", async () => {
    configure("preview", "test");
    browserClient();
    await userClient();
    expect(createBrowserClient).toHaveBeenCalledWith(
      supabaseProjects.test.url,
      supabaseProjects.test.publishableKey,
    );
    expect(createServerClient).toHaveBeenCalled();
  });
});
