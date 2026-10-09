import { describe, expect, it } from "vitest";
import { parsePublicSupabaseEnv } from "@/lib/shared/schemas/supabase-env";
import { supabaseProjects } from "@/lib/shared/supabase-projects";

describe("Supabase public environment", () => {
  it("accepts localhost and the explicitly selected production project", () => {
    expect(
      parsePublicSupabaseEnv({
        url: "http://127.0.0.1:54321",
        publishableKey: "sb_publishable_example",
      }).url,
    ).toBe("http://127.0.0.1:54321");
    expect(
      parsePublicSupabaseEnv({
        environment: "production",
        url: supabaseProjects.production.url,
        publishableKey: supabaseProjects.production.publishableKey,
      }).url,
    ).toBe(supabaseProjects.production.url);
  });

  it.each([
    { url: undefined, publishableKey: "sb_publishable_example" },
    { url: "http://example.com", publishableKey: "sb_publishable_example" },
    { url: "https://example.supabase.co", publishableKey: "" },
    { url: "https://example.supabase.co", publishableKey: "replace-with-publishable-key" },
  ])("fails closed for invalid values", (input) => {
    expect(() => parsePublicSupabaseEnv(input)).toThrow(
      "Supabase environment/project mismatch or invalid key.",
    );
  });

  it.each(["preview", "staging"])("maps %s only to the test project", (environment) => {
    expect(
      parsePublicSupabaseEnv({
        environment,
        url: supabaseProjects.test.url,
        publishableKey: supabaseProjects.test.publishableKey,
      }).projectRef,
    ).toBe(supabaseProjects.test.ref);
  });

  it.each([
    ["staging", supabaseProjects.production.url, supabaseProjects.production.publishableKey],
    ["preview", supabaseProjects.production.url, supabaseProjects.test.publishableKey],
    ["production", supabaseProjects.test.url, supabaseProjects.test.publishableKey],
    ["production", supabaseProjects.production.url, supabaseProjects.test.publishableKey],
    ["production", supabaseProjects.production.url, "sb_secret_not-public"],
    ["ci", supabaseProjects.test.url, supabaseProjects.test.publishableKey],
    ["local", supabaseProjects.production.url, supabaseProjects.production.publishableKey],
    [undefined, supabaseProjects.test.url, supabaseProjects.test.publishableKey],
    ["staging", supabaseProjects.test.url + "/auth", supabaseProjects.test.publishableKey],
    ["staging", supabaseProjects.test.url + "?redirect=evil", supabaseProjects.test.publishableKey],
    ["local", "http://localhost:54321", supabaseProjects.test.publishableKey],
    ["invalid", "http://localhost:54321", "sb_publishable_example"],
  ])("rejects mismatched configuration %s / %s", (environment, url, publishableKey) => {
    expect(() => parsePublicSupabaseEnv({ environment, url, publishableKey })).toThrow();
  });

  it.each(["local", "ci"])("accepts loopback for %s", (environment) => {
    expect(
      parsePublicSupabaseEnv({
        environment,
        url: "http://127.0.0.1:54321",
        publishableKey: "sb_publishable_example",
      }).environment,
    ).toBe(environment);
  });
});
