import Link from "next/link";
import { ARCHIVE_END_YEAR, ARCHIVE_START_YEAR } from "@/lib/archive/seasons";
import { archiveMode } from "@/lib/env";
import { LogoMark } from "./logo";
import { NAV_LINKS } from "./nav-links";

export function SiteFooter() {
  const mode = archiveMode();
  return (
    <footer className="mt-20 border-t bg-card/30">
      <div className="container-page grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-bold">Lumine StarWorks Anime Industry Archive</span>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            A production history of an independent anime industry, {ARCHIVE_START_YEAR}–{ARCHIVE_END_YEAR}. Every record shows where its facts
            came from, and sample entries stay marked as Proposed until an editor approves them.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            About the archive
          </Link>
        </nav>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Data source:{" "}
            <span className="font-medium text-foreground">{mode === "supabase" ? "Supabase" : "Local development store"}</span>
          </p>
          <p>© {ARCHIVE_END_YEAR} Lumine StarWorks. Built with care for anime history.</p>
        </div>
      </div>
    </footer>
  );
}
