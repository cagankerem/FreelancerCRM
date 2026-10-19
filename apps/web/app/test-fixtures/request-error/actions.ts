"use server";

import { unstable_rethrow } from "next/navigation";
import { operation, requestId, safeError } from "@/lib/server/observability";
import { publicSupabaseSettings } from "@/lib/server/supabase";

export async function controlledError(form: FormData) {
  const id = await requestId();
  if (!["local", "ci"].includes(publicSupabaseSettings().environment)) return null;
  try {
    await operation("diagnostic", async () => {
      const privateCanary = form.get("privateCanary");
      throw new Error(
        typeof privateCanary === "string" ? privateCanary : "Controlled synthetic failure",
      );
    });
    return null;
  } catch (error) {
    unstable_rethrow(error);
    const { code, message } = safeError(error);
    return { data: null, error: { code, message }, requestId: id };
  }
}
