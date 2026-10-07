"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { newShareToken } from "@/lib/server/share";
import { serviceClient } from "@/lib/server/supabase";

export async function publishProposal(form: FormData) {
  const input = z
    .object({ proposalId: z.uuid(), validDate: z.iso.date() })
    .safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/app/proposals?error=invalid");
  const { id, db } = await requireUser();
  const { data: owned } = await db
    .from("proposals")
    .select("id,lock_version")
    .eq("id", input.data.proposalId)
    .maybeSingle();
  if (!owned) redirect("/app/proposals");
  const expiresAt = new Date(`${input.data.validDate}T23:59:59Z`);
  if (expiresAt.getTime() <= Date.now()) redirect(`/app/proposals/${owned.id}?error=expiry`);
  const service = serviceClient();
  const { data: row } = await service
    .from("proposals")
    .select("share_generation")
    .eq("id", owned.id)
    .eq("user_id", id)
    .single();
  if (!row) redirect("/app/proposals");
  const share = newShareToken(owned.id, row.share_generation + 1);
  const { error } = await service.rpc("publish_proposal", {
    actor: id,
    target: owned.id,
    expected_version: owned.lock_version,
    selector: share.selector,
    verifier_hash: share.verifierHash,
    key_version: 1,
    expires_at: expiresAt.toISOString(),
    mode: "locked",
    pro_active_limit: null,
  });
  if (error) redirect(`/app/proposals/${owned.id}?error=publish`);
  redirect(`/app/proposals/${owned.id}?published=1`);
}
