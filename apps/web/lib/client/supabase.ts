import { createBrowserClient } from "@supabase/ssr";
import { parsePublicSupabaseEnv } from "@/lib/shared/schemas/supabase-env";

export function browserClient() {
  const { url, publishableKey } = parsePublicSupabaseEnv({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return createBrowserClient(url, publishableKey);
}
