import { z } from "zod";

const waitlistEmailSchema = z
  .string()
  .trim()
  .min(1, { error: "E-posta adresini gir." })
  .max(254, { error: "E-posta adresi en fazla 254 karakter olabilir." })
  .pipe(z.email({ error: "Geçerli bir e-posta adresi gir." }))
  .transform((email) => email.toLowerCase());

const waitlistPersonaSchema = z.enum(["developer", "designer"]);

export const waitlistFormSchema = z.object({
  email: waitlistEmailSchema,
  persona: z
    .union([waitlistPersonaSchema, z.literal("")])
    .optional()
    .transform((persona) => persona || undefined),
  marketingConsent: z.boolean().default(false),
});

export const storedWaitlistEntriesSchema = z.array(
  z.preprocess(
    (entry) => (typeof entry === "string" ? { email: entry } : entry),
    z.object({
      email: waitlistEmailSchema,
      persona: waitlistPersonaSchema.optional(),
      marketingConsent: z.boolean().default(false),
    }),
  ),
);

export type WaitlistSubmission = z.output<typeof waitlistFormSchema>;
