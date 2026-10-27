import type { Metadata, Viewport } from "next";
import "./desktop.css";
import "./apps.css";
import "./sites.css";

export const metadata: Metadata = {
  title: "Connected Desktop - The Connected Era",
  description: "A working 2012-2013 computer and internet from the Lumine StarWorks Connected Era.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
