import { createBrowserClient } from "@supabase/ssr";
import { parsePublicSupabaseEnv, supabaseCookieOptions } from "@/lib/shared/schemas/supabase-env";

export function browserClient() {
  const { url, publishableKey, environment } = parsePublicSupabaseEnv({
    environment: process.env.NEXT_PUBLIC_APP_ENV,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return createBrowserClient(url, publishableKey, {
    cookieOptions: supabaseCookieOptions(environment),
  });
}
