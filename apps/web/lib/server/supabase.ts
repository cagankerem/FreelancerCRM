import "server-only";

import { createHash } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { legacyKeyClaims, parsePublicSupabaseEnv } from "@/lib/shared/schemas/supabase-env";

export function publicSupabaseSettings() {
  const settings = parsePublicSupabaseEnv({
    environment: process.env.NEXT_PUBLIC_APP_ENV,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (process.env.CI === "true" && !["local", "ci"].includes(settings.environment))
    throw new Error("CI must use an independent local Supabase.");
  return { ...settings, key: settings.publishableKey };
}

export async function userClient() {
  const store = await cookies();
  // Establish request-time rendering before validating runtime settings.
  const { url, key } = publicSupabaseSettings();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          for (const { name, value, options } of values) store.set(name, value, options);
        } catch {
          // Server Components cannot set cookies; the Next.js proxy refreshes them.
        }
      },
    },
  });
}

export function serviceClient() {
  const { url, projectRef } = publicSupabaseSettings();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.startsWith("replace-with-"))
    throw new Error("Supabase server environment is missing or invalid.");
  if (key.startsWith("sb_secret_")) {
    // Provision this binding independently from the target project's key.
    const binding = `${projectRef}:${createHash("sha256").update(key).digest("hex")}`;
    if (process.env.SUPABASE_SERVER_KEY_BINDING !== binding)
      throw new Error("Supabase server key is not bound to the expected project.");
  } else {
    const claims = legacyKeyClaims(key);
    const correctRef =
      projectRef === "local"
        ? !claims.ref || claims.ref === "supabase-demo"
        : claims.ref === projectRef;
    if (claims.role !== "service_role" || !correctRef)
      throw new Error("Supabase server key/project mismatch.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
