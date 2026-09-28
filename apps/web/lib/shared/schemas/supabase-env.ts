import { z } from "zod";

export const publicSupabaseEnvSchema = z.object({
  url: z.url().refine((value) => {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ||
      (parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname));
  }, "Supabase URL must use HTTPS outside localhost."),
  publishableKey: z.string().trim().min(1).refine((value) => !value.startsWith("replace-with-")),
});

export function parsePublicSupabaseEnv(input: unknown) {
  const result = publicSupabaseEnvSchema.safeParse(input);
  if (!result.success) throw new Error("Supabase public environment is missing or invalid.");
  return result.data;
}
