import "server-only";

import { redirect, unstable_rethrow } from "next/navigation";
import {
  log,
  operation,
  requestId,
  type Operation,
  type ErrorCode,
} from "@/lib/server/observability";

export async function rejectAction(name: Operation, path: string, code: ErrorCode): Promise<never> {
  const id = await requestId();
  log({ event: "operation.failed", operation: name, requestId: id, outcome: "rejected", code });
  redirect(`${path}&requestId=${id}`);
}

export async function actionOperation(name: Operation, fallback: string, run: () => Promise<void>) {
  try {
    await operation(name, run);
  } catch (error) {
    unstable_rethrow(error);
    const id = await requestId();
    // Call sites supply a constant local path, never user input.
    redirect(`${fallback}?error=unavailable&requestId=${id}`);
  }
}
