import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a sub-folder of the repository; keep Turbopack scoped to it.
  turbopack: {
    root: path.join(__dirname),
  },
  // The archive editor posts whole JSON documents through Server Actions.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
