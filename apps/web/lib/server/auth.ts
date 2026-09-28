import "server-only";

import { redirect } from "next/navigation";
import { userClient } from "@/lib/server/supabase";

export async function currentUser() {
  const db = await userClient();
  const { data, error } = await db.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, db };
}

export async function requireUser() {
  const auth = await currentUser();
  if (!auth) redirect("/auth/login");
  return auth;
}
