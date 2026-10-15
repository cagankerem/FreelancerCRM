"use client";

import { isRequestId } from "@/lib/shared/request-id";

export function SupportReference({ requestId }: { requestId?: string }) {
  return isRequestId(requestId) ? (
    <p>
      Destek referansı: <code>{requestId}</code>
    </p>
  ) : null;
}
