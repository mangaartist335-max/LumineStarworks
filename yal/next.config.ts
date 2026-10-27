import path from "node:path";
import type { NextConfig } from "next";
import { embedOrigins } from "./lib/env";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // yal/ lives inside the LumineStarworks repo next to another Next.js app;
  // pin the root so Turbopack does not pick the parent lockfile.
  turbopack: { root: path.join(__dirname) },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Framing is limited to YAL itself and the Connected Desktop.
          { key: "Content-Security-Policy", value: `frame-ancestors 'self' ${embedOrigins().join(" ")}` },
        ],
      },
    ];
  },
};

export default nextConfig;
