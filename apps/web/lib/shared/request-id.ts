// UUID v4 only; 36 characters, below the plan's 64-character limit.
export function isRequestId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)
  );
}

export const requestIdHeader = "x-request-id";
export const internalRequestIdHeader = "x-kapsam-request-id";
