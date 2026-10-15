import "server-only";

import type { ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import { ErrorState } from "@/components/ui/error-state";
import { operation, requestId, safeError, type Operation } from "@/lib/server/observability";

export async function renderOperation(name: Operation, render: () => Promise<ReactNode>) {
  try {
    return await operation(name, render);
  } catch (error) {
    unstable_rethrow(error);
    return <ErrorState description={safeError(error).message} requestId={await requestId()} />;
  }
}
