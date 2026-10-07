import "server-only";

import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { serviceClient } from "@/lib/server/supabase";

function signingKey(version: number): Buffer {
  if (version !== 1) throw new Error("Unknown share key version.");
  const hex = process.env.SHARE_HMAC_KEY_V1;
  if (!hex || !/^[0-9a-f]{64}$/i.test(hex)) throw new Error("Share signing key is missing.");
  return Buffer.from(hex, "hex");
}

function verifier(proposalId: string, generation: number, selector: string, version = 1): Buffer {
  return createHmac("sha256", signingKey(version))
    .update(`kapsam-share-v1:${proposalId}:${generation}:${selector}`)
    .digest();
}

export function newShareToken(proposalId: string, generation: number) {
  const selector = randomUUID();
  const bytes = verifier(proposalId, generation, selector);
  return {
    selector,
    token: `${selector}.${bytes.toString("base64url")}`,
    verifierHash: `\\x${createHash("sha256").update(bytes).digest("hex")}`,
  };
}

export async function ownerShareLink(proposalId: string, ownerId: string): Promise<string | null> {
  const db = serviceClient();
  const { data } = await db
    .from("proposals")
    .select("id,user_id,share_selector,share_generation,share_key_version,lifecycle_status")
    .eq("id", proposalId)
    .eq("user_id", ownerId)
    .maybeSingle();
  if (
    !data ||
    data.lifecycle_status !== "published" ||
    !data.share_selector ||
    !data.share_key_version
  )
    return null;
  const bytes = verifier(
    data.id,
    data.share_generation,
    data.share_selector,
    data.share_key_version,
  );
  return `/p/${data.share_selector}.${bytes.toString("base64url")}`;
}

function fixedTimeEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function publicProposal(token: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[A-Za-z0-9_-]{43}$/i.test(
      token,
    )
  )
    return null;
  const [selector, encoded] = token.split(".");
  const supplied = Buffer.from(encoded, "base64url");
  if (supplied.length !== 32 || supplied.toString("base64url") !== encoded) return null;
  const db = serviceClient();
  const { data: row, error } = await db
    .from("proposals")
    .select(
      "id,project_name,client_name,client_company,currency,total_amount,tax_mode,valid_until,lifecycle_status,decision_status,publication_mode,share_selector,share_generation,share_key_version,share_verifier_hash,lock_version",
    )
    .eq("share_selector", selector)
    .maybeSingle();
  if (
    error ||
    !row ||
    row.lifecycle_status !== "published" ||
    !row.share_key_version ||
    (row.valid_until && Date.parse(row.valid_until) <= Date.now())
  )
    return null;
  let expected: Buffer;
  try {
    expected = verifier(row.id, row.share_generation, selector, row.share_key_version);
  } catch {
    return null;
  }
  const stored =
    typeof row.share_verifier_hash === "string" &&
    /^\\x[0-9a-f]{64}$/i.test(row.share_verifier_hash)
      ? Buffer.from(row.share_verifier_hash.slice(2), "hex")
      : Buffer.alloc(32);
  const hash = createHash("sha256").update(supplied).digest();
  if (!fixedTimeEqual(supplied, expected) || !fixedTimeEqual(hash, stored)) return null;

  const [items, sections] = await Promise.all([
    db
      .from("proposal_items")
      .select("description,quantity,unit_label,unit_price,line_total")
      .eq("proposal_id", row.id)
      .order("sort_order"),
    db
      .from("proposal_sections")
      .select("title,content")
      .eq("proposal_id", row.id)
      .order("sort_order"),
  ]);
  if (items.error || sections.error) return null;
  return {
    projectName: row.project_name,
    clientName: row.client_name,
    clientCompany: row.client_company,
    currency: row.currency,
    totalAmount: row.total_amount,
    taxMode: row.tax_mode,
    validUntil: row.valid_until,
    decisionStatus: row.decision_status,
    items: items.data ?? [],
    sections: sections.data ?? [],
  };
}
