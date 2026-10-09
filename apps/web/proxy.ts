import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicSupabaseSettings } from "@/lib/server/supabase";
import { supabaseCookieOptions } from "@/lib/shared/schemas/supabase-env";

export async function proxy(request: NextRequest) {
  const { url, key: publishableKey, environment } = publicSupabaseSettings();
  let response = NextResponse.next({ request });
  const db = createServerClient(url, publishableKey, {
    cookieOptions: supabaseCookieOptions(environment),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) response.cookies.set(name, value, options);
      },
    },
  });
  await db.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/app/:path*", "/onboarding/:path*", "/auth/:path*"] };
