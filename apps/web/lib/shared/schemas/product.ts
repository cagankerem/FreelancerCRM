import { z } from "zod";

const named = (limit: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(limit)
    .transform((value) => value.normalize("NFC"));
export const signInSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});
export const registrationSchema = signInSchema.refine(
  (value) => /[a-zA-Z]/.test(value.password) && /\d/.test(value.password),
);
export const profileSchema = z.object({
  full_name: named(200),
  profession: named(120),
  default_currency: z.enum(["TRY", "USD", "EUR"]),
});
export const clientSchema = z.object({
  name: named(200),
  company_name: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v.normalize("NFC")),
});
export const proposalDraftSchema = z.object({
  client_id: z.uuid(),
  project_name: named(200),
  currency: z.enum(["TRY", "USD", "EUR"]),
  tax_mode: z.enum(["included", "excluded"]),
  description: named(2000),
  quantity: z.string().regex(/^\d{1,9}(?:\.\d{1,3})?$/),
  unit_price: z.string().regex(/^\d{1,12}(?:\.\d{1,2})?$/),
});
