"use server";

import { redirect } from "next/navigation";
import { registrationSchema, signInSchema } from "@/lib/shared/schemas/product";
import { userClient } from "@/lib/server/supabase";

export async function login(form: FormData) {
  const input = signInSchema.safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/auth/login?error=invalid");
  const db = await userClient();
  const { error } = await db.auth.signInWithPassword(input.data);
  if (error) redirect("/auth/login?error=invalid");
  redirect("/app");
}

export async function register(form: FormData) {
  const input = registrationSchema.safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/auth/register?error=invalid");
  const db = await userClient();
  const { error } = await db.auth.signUp(input.data);
  if (error) redirect("/auth/register?error=unavailable");
  redirect("/onboarding");
}

export async function logout() {
  const db = await userClient();
  await db.auth.signOut();
  redirect("/auth/login");
}
