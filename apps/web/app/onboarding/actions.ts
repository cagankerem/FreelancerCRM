"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { profileSchema } from "@/lib/shared/schemas/product";

export async function saveProfile(form: FormData) {
  const input = profileSchema.safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/onboarding?error=invalid");
  const { id, db } = await requireUser();
  const { data: existing } = await db.from("profiles").select("id").eq("id", id).maybeSingle();
  const mutation = existing
    ? db.from("profiles").update({ ...input.data, onboarding_completed_at: new Date().toISOString() }).eq("id", id)
    : db.from("profiles").insert({ id, ...input.data, onboarding_completed_at: new Date().toISOString() });
  const { error } = await mutation;
  if (error) redirect("/onboarding?error=save");
  redirect("/app");
}
