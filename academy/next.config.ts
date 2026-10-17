import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Academy lives in its own folder inside the BuildBrief repo, so pin
  // Turbopack's root here instead of letting it pick the parent lockfile.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
