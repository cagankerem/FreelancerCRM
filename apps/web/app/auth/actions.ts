"use server";

import { redirect } from "next/navigation";
import { registrationSchema, signInSchema } from "@/lib/shared/schemas/product";
import { userClient } from "@/lib/server/supabase";
import { trustedAuthOrigin } from "@/lib/server/auth-origin";
import { actionOperation, rejectAction } from "@/lib/server/action-operation";
import { providerError } from "@/lib/server/observability";
import { isAuthSessionMissingError } from "@supabase/supabase-js";

export async function login(form: FormData) {
  return actionOperation("auth.login", "/auth/login", async () => {
    const input = signInSchema.safeParse(Object.fromEntries(form));
    if (!input.success)
      return rejectAction("auth.login", "/auth/login?error=invalid", "INVALID_INPUT");
    const db = await userClient();
    const { error } = await db.auth.signInWithPassword(input.data);
    if (error) return rejectAction("auth.login", "/auth/login?error=invalid", "UNAUTHENTICATED");
    redirect("/app");
  });
}

export async function register(form: FormData) {
  return actionOperation("auth.register", "/auth/register", async () => {
    const input = registrationSchema.safeParse(Object.fromEntries(form));
    if (!input.success)
      return rejectAction("auth.register", "/auth/register?error=invalid", "INVALID_INPUT");
    const db = await userClient();
    const { data, error } = await db.auth.signUp({
      ...input.data,
      options: { emailRedirectTo: `${trustedAuthOrigin()}/auth/callback` },
    });
    if (error)
      return rejectAction("auth.register", "/auth/register?error=unavailable", "UNAVAILABLE");
    if (!data.session) redirect("/auth/login?confirmation=sent");
    redirect("/onboarding");
  });
}

export async function logout() {
  return actionOperation("auth.logout", "/auth/login", async () => {
    const db = await userClient();
    const { error } = await db.auth.signOut();
    if (error && !isAuthSessionMissingError(error) && error.code !== "session_not_found")
      throw providerError(error);
    redirect("/auth/login");
  });
}
