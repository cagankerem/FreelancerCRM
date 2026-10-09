import { z } from "zod";

export const stagingOrigin = "https://freelancercrm-staging.cagankeremergun.workers.dev";

export function authOrigin(environment: string, configured?: string) {
  const raw = configured ?? (["local", "ci"].includes(environment) ? "http://localhost:3000" : "");
  const parsed = z.url().safeParse(raw);
  if (!parsed.success) throw new Error("Auth origin is missing or invalid.");
  const url = new URL(parsed.data);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("Auth origin must be an exact origin.");
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (["local", "ci"].includes(environment)) {
    if (!local || url.protocol !== "http:" || url.port !== "3000")
      throw new Error("Local Auth must use loopback port 3000.");
  } else if (["staging", "preview"].includes(environment)) {
    if (url.origin !== stagingOrigin) throw new Error("Unapproved test Auth origin.");
  } else if (environment === "production") {
    if (local || url.protocol !== "https:" || url.origin === stagingOrigin)
      throw new Error("Invalid production Auth origin.");
  } else throw new Error("Invalid Auth environment.");
  return url.origin;
}

// Only explicit application destinations are accepted, never arbitrary URLs.
export function safeAuthNext(value: string | null) {
  return value && ["/app", "/app/clients", "/app/proposals", "/onboarding"].includes(value)
    ? value
    : "/onboarding";
}
