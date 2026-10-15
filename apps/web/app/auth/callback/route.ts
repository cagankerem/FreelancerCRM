import { NextResponse, type NextRequest } from "next/server";
import { userClient } from "@/lib/server/supabase";
import { trustedAuthOrigin } from "@/lib/server/auth-origin";
import { safeAuthNext } from "@/lib/shared/schemas/auth-redirect";
import { operation, requestId, safeError } from "@/lib/server/observability";
import { unstable_rethrow } from "next/navigation";

export async function GET(request: NextRequest) {
  try {
    return await operation("auth.callback", async () => {
      const origin = trustedAuthOrigin();
      if (request.nextUrl.origin !== origin)
        return new NextResponse("Invalid callback origin.", { status: 400 });
      const code = request.nextUrl.searchParams.get("code");
      if (!code) return NextResponse.redirect(new URL("/auth/login?error=invalid", origin));
      const db = await userClient();
      const { error } = await db.auth.exchangeCodeForSession(code);
      return NextResponse.redirect(
        new URL(
          error
            ? "/auth/login?error=invalid"
            : safeAuthNext(request.nextUrl.searchParams.get("next")),
          origin,
        ),
      );
    });
  } catch (error) {
    unstable_rethrow(error);
    const { message, status } = safeError(error);
    const id = await requestId();
    return new Response(`${message} Destek referansı: ${id}`, {
      status,
      headers: { "X-Request-ID": id, "Cache-Control": "private, no-store" },
    });
  }
}
