import { describe, expect, it } from "vitest";

import { waitlistFormSchema } from "@/lib/shared/schemas/waitlist";

describe("waitlistFormSchema", () => {
  it("normalizes valid form data into the canonical submission shape", () => {
    const result = waitlistFormSchema.parse({
      email: "  USER@Example.COM  ",
      persona: "developer",
      marketingConsent: true,
    });

    expect(result).toEqual({
      email: "user@example.com",
      persona: "developer",
      marketingConsent: true,
    });
  });

  it("turns an empty optional persona into undefined", () => {
    const result = waitlistFormSchema.parse({
      email: "user@example.com",
      persona: "",
      marketingConsent: false,
    });

    expect(result).toEqual({
      email: "user@example.com",
      persona: undefined,
      marketingConsent: false,
    });
  });

  it.each([
    ["", "E-posta adresini gir."],
    ["gecersiz", "Geçerli bir e-posta adresi gir."],
  ])("rejects %j with a stable email error", (email, message) => {
    const result = waitlistFormSchema.safeParse({
      email,
      persona: "",
      marketingConsent: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ["email"], message }),
      );
    }
  });

  it.each([
    {
      input: {
        email: "user@example.com",
        persona: "unknown",
        marketingConsent: false,
      },
      path: "persona",
    },
    {
      input: {
        email: "user@example.com",
        persona: "",
        marketingConsent: "false",
      },
      path: "marketingConsent",
    },
  ])("rejects invalid $path input", ({ input, path }) => {
    const result = waitlistFormSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === path)).toBe(true);
    }
  });
});
