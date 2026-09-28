"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { proposalDraftSchema } from "@/lib/shared/schemas/product";

export async function createDraft(form: FormData) {
  const input = proposalDraftSchema.safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/app/proposals/new?error=invalid");
  const { db } = await requireUser();
  const { data: client, error: clientError } = await db.from("clients").select("name,company_name").eq("id", input.data.client_id).single();
  if (clientError || !client) redirect("/app/proposals/new?error=client");
  const { data, error } = await db.rpc("save_proposal", {
    target: null, expected_version: null,
    document: { client_id: input.data.client_id, client_name: client.name, client_company: client.company_name,
      project_name: input.data.project_name, currency: input.data.currency, tax_mode: input.data.tax_mode },
    sections: [],
    items: [{ description: input.data.description, quantity: input.data.quantity, unit_price: input.data.unit_price, sort_order: 0 }],
  });
  if (error || !data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string") {
    redirect("/app/proposals/new?error=save");
  }
  redirect(`/app/proposals/${data.id}`);
}
