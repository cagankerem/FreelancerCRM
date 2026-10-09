import { z } from "zod";
import { supabaseProjects } from "@/lib/shared/supabase-projects";

const invalid = () => new Error("Supabase environment/project mismatch or invalid key.");
export function supabaseCookieOptions(environment: string) {
  return { secure: !["local", "ci"].includes(environment) };
}
export const publicSupabaseEnvSchema = z.object({
  environment: z.enum(["local", "ci", "preview", "staging", "production"]).optional(),
  url: z.url(),
  publishableKey: z.string().trim().min(1),
});

// Claims are configuration metadata, not signature/authentication verification.
export function legacyKeyClaims(key: string): { role?: string; ref?: string } {
  try {
    const segments = key.split(".");
    if (segments.length !== 3) throw invalid();
    const payload = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims: unknown = JSON.parse(atob(payload));
    return z.object({ role: z.string().optional(), ref: z.string().optional() }).parse(claims);
  } catch {
    throw invalid();
  }
}

export function parsePublicSupabaseEnv(input: unknown) {
  const result = publicSupabaseEnvSchema.safeParse(input);
  if (!result.success) throw invalid();
  const { url, publishableKey } = result.data;
  const parsed = new URL(url);
  const local = ["localhost", "127.0.0.1"].includes(parsed.hostname);
  // Existing ignored local files remain valid; cloud always needs a selector.
  const environment = result.data.environment ?? (local ? "local" : undefined);
  if (
    !environment ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  )
    throw invalid();
  if (environment === "local" || environment === "ci") {
    if (!local || !["http:", "https:"].includes(parsed.protocol)) throw invalid();
    if (publishableKey.startsWith("sb_publishable_")) {
      if (
        publishableKey.length <= "sb_publishable_".length ||
        Object.values(supabaseProjects).some((p) => p.publishableKey === publishableKey)
      )
        throw invalid();
    } else {
      const claims = legacyKeyClaims(publishableKey);
      if (claims.role !== "anon" || (claims.ref && claims.ref !== "supabase-demo")) throw invalid();
    }
    return { url: parsed.origin, publishableKey, environment, projectRef: "local" };
  }
  const project = supabaseProjects[environment === "production" ? "production" : "test"];
  if (!project || parsed.origin !== project.url || publishableKey !== project.publishableKey)
    throw invalid();
  return { url: project.url, publishableKey, environment, projectRef: project.ref };
}
