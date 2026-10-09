import "server-only";

import { authOrigin } from "@/lib/shared/schemas/auth-redirect";
import { publicSupabaseSettings } from "@/lib/server/supabase";

export function trustedAuthOrigin() {
  return authOrigin(publicSupabaseSettings().environment, process.env.NEXT_PUBLIC_SITE_URL);
}
