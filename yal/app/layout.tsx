import type { Metadata } from "next";
import "./globals.css";
import { getViewer } from "@/lib/viewer";
import { ArchiveBar } from "@/components/ArchiveBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: { default: "YourAnimeList - Anime and Manga Database and Community", template: "%s - YourAnimeList" },
  description: "Track your anime, discuss episodes and explore the anime database with the YourAnimeList community.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <ArchiveBar asOf={viewer.asOf} mode={viewer.mode} />
        <SiteHeader account={viewer.account} />
        <div id="content">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
