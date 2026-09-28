import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { parsePublicSupabaseEnv } from "@/lib/shared/schemas/supabase-env";

export function publicSupabaseSettings() {
  const { url, publishableKey } = parsePublicSupabaseEnv({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return { url, key: publishableKey };
}

export async function userClient() {
  const { url, key } = publicSupabaseSettings();
  const store = await cookies();
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
  const { url } = publicSupabaseSettings();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.startsWith("replace-with-")) throw new Error("Supabase server environment is missing or invalid.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
