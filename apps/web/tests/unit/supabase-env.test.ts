import { describe, expect, it } from "vitest";
import { parsePublicSupabaseEnv } from "@/lib/shared/schemas/supabase-env";

describe("Supabase public environment", () => {
  it("accepts localhost and secure remote URLs", () => {
    expect(parsePublicSupabaseEnv({ url: "http://127.0.0.1:54321", publishableKey: "sb_publishable_example" }).url)
      .toBe("http://127.0.0.1:54321");
    expect(parsePublicSupabaseEnv({ url: "https://example.supabase.co", publishableKey: "sb_publishable_example" }).url)
      .toBe("https://example.supabase.co");
  });

  it.each([
    { url: undefined, publishableKey: "sb_publishable_example" },
    { url: "http://example.com", publishableKey: "sb_publishable_example" },
    { url: "https://example.supabase.co", publishableKey: "" },
    { url: "https://example.supabase.co", publishableKey: "replace-with-publishable-key" },
  ])("fails closed for invalid values", (input) => {
    expect(() => parsePublicSupabaseEnv(input)).toThrow("Supabase public environment is missing or invalid.");
  });
});
