"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { clientSchema } from "@/lib/shared/schemas/product";

export async function createClient(form: FormData) {
  const input = clientSchema.safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/app/clients?error=invalid");
  const { db } = await requireUser();
  const { error } = await db.from("clients").insert({ name: input.data.name, company_name: input.data.company_name || null });
  if (error) redirect("/app/clients?error=save");
  redirect("/app/clients");
}
