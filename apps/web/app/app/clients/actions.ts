"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { clientSchema } from "@/lib/shared/schemas/product";
import { actionOperation, rejectAction } from "@/lib/server/action-operation";

export async function createClient(form: FormData) {
  return actionOperation("client.create", "/app/clients", async () => {
    const input = clientSchema.safeParse(Object.fromEntries(form));
    if (!input.success)
      return rejectAction("client.create", "/app/clients?error=invalid", "INVALID_INPUT");
    const { db } = await requireUser();
    const { error } = await db
      .from("clients")
      .insert({ name: input.data.name, company_name: input.data.company_name || null });
    if (error) return rejectAction("client.create", "/app/clients?error=save", "UNAVAILABLE");
    redirect("/app/clients");
  });
}
