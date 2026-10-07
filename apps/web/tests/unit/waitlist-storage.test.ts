import { beforeEach, describe, expect, it } from "vitest";

import {
  clearWaitlistSubmissions,
  saveWaitlistSubmission,
  WAITLIST_STORAGE_KEY,
} from "@/lib/client/waitlist-storage";

describe("waitlist storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores only the canonical waitlist fields", () => {
    const result = saveWaitlistSubmission({
      email: "user@example.com",
      persona: "designer",
      marketingConsent: true,
    });

    expect(result).toEqual({ status: "saved" });
    expect(JSON.parse(window.localStorage.getItem(WAITLIST_STORAGE_KEY) ?? "null")).toEqual([
      {
        email: "user@example.com",
        persona: "designer",
        marketingConsent: true,
      },
    ]);
  });

  it("recognizes normalized legacy entries without duplicating them", () => {
    const legacyEntries = JSON.stringify([" USER@Example.COM ", { email: "other@example.com" }]);
    window.localStorage.setItem(WAITLIST_STORAGE_KEY, legacyEntries);

    const result = saveWaitlistSubmission({
      email: "user@example.com",
      persona: undefined,
      marketingConsent: false,
    });

    expect(result).toEqual({ status: "duplicate" });
    expect(window.localStorage.getItem(WAITLIST_STORAGE_KEY)).toBe(legacyEntries);
  });

  it.each(["not-json", JSON.stringify([{ email: 42 }])])(
    "does not overwrite untrusted storage data: %s",
    (untrustedValue) => {
      window.localStorage.setItem(WAITLIST_STORAGE_KEY, untrustedValue);

      const result = saveWaitlistSubmission({
        email: "user@example.com",
        persona: undefined,
        marketingConsent: false,
      });

      expect(result).toEqual({ status: "failure" });
      expect(window.localStorage.getItem(WAITLIST_STORAGE_KEY)).toBe(untrustedValue);
    },
  );

  it("converts storage exceptions into a safe failure result", () => {
    const unavailableStorage = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => {
        throw new Error("quota details must stay private");
      },
    };

    expect(
      saveWaitlistSubmission(
        {
          email: "user@example.com",
          persona: undefined,
          marketingConsent: false,
        },
        unavailableStorage,
      ),
    ).toEqual({ status: "failure" });
  });

  it("clears the versioned waitlist key", () => {
    window.localStorage.setItem(WAITLIST_STORAGE_KEY, "[]");

    expect(clearWaitlistSubmissions()).toEqual({ status: "cleared" });
    expect(window.localStorage.getItem(WAITLIST_STORAGE_KEY)).toBeNull();
  });
});
