import { NextResponse, type NextRequest } from "next/server";
import { userClient } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/auth/login?error=invalid", request.url));
  const db = await userClient();
  const { error } = await db.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? "/auth/login?error=invalid" : "/onboarding", request.url));
}
