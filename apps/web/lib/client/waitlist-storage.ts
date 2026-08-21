import {
  storedWaitlistEntriesSchema,
  waitlistFormSchema,
  type WaitlistSubmission,
} from "@/lib/shared/schemas/waitlist";

export const WAITLIST_STORAGE_KEY = "kapsam-alpha-waitlist-v1";

type StoragePort = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export type SaveWaitlistResult =
  | { status: "saved" }
  | { status: "duplicate" }
  | { status: "failure" };

export type ClearWaitlistResult =
  | { status: "cleared" }
  | { status: "failure" };

export function saveWaitlistSubmission(
  submission: WaitlistSubmission,
  storageOverride?: StoragePort,
): SaveWaitlistResult {
  try {
    const storage = storageOverride ?? window.localStorage;
    const validatedSubmission = waitlistFormSchema.safeParse(submission);

    if (!validatedSubmission.success) {
      return { status: "failure" };
    }

    const entriesResult = readWaitlistEntries(storage);
    if (!entriesResult.success) {
      return { status: "failure" };
    }

    const isDuplicate = entriesResult.entries.some(
      (entry) => entry.email === validatedSubmission.data.email,
    );

    if (isDuplicate) {
      return { status: "duplicate" };
    }

    storage.setItem(
      WAITLIST_STORAGE_KEY,
      JSON.stringify([...entriesResult.entries, validatedSubmission.data]),
    );

    return { status: "saved" };
  } catch {
    return { status: "failure" };
  }
}

export function clearWaitlistSubmissions(
  storageOverride?: StoragePort,
): ClearWaitlistResult {
  try {
    const storage = storageOverride ?? window.localStorage;
    storage.removeItem(WAITLIST_STORAGE_KEY);
    return { status: "cleared" };
  } catch {
    return { status: "failure" };
  }
}

function readWaitlistEntries(storage: StoragePort) {
  const serializedEntries = storage.getItem(WAITLIST_STORAGE_KEY);
  if (serializedEntries === null) {
    return { success: true, entries: [] } as const;
  }

  let parsedEntries: unknown;
  try {
    parsedEntries = JSON.parse(serializedEntries);
  } catch {
    return { success: false } as const;
  }

  const entriesResult = storedWaitlistEntriesSchema.safeParse(parsedEntries);
  if (!entriesResult.success) {
    return { success: false } as const;
  }

  return { success: true, entries: entriesResult.data } as const;
}
