import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  agentRules: false,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Same-origin form POSTs need a concrete Origin for Workers' CSRF checks.
      // Callback and public token routes retain the global no-referrer policy.
      ...["/auth/login", "/auth/register", "/app/:path*", "/onboarding"].map((source) => ({
        source,
        headers: [{ key: "Referrer-Policy", value: "same-origin" }],
      })),
    ];
  },
};

export default nextConfig;
