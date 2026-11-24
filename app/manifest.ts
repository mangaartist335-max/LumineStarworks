import type { MetadataRoute } from "next";

// Makes BuildBrief installable ("Add to Home Screen"): it opens full-screen
// with its own icon, like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BuildBrief",
    short_name: "BuildBrief",
    description: "Turn your idea into a real app.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#08090d",
    theme_color: "#08090d",
    categories: ["productivity", "developer", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
