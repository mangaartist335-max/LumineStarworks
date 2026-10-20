import { PenLine, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const viewer = await getViewer();
  const editorHref = viewer.signedIn ? "/admin" : "/sign-in";
  const editorLabel = viewer.canEdit ? "Archive editor" : viewer.signedIn ? "Account" : "Editor sign in";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-primary-foreground">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center gap-3">
        <MobileNav editorHref={editorHref} editorLabel={editorLabel} />
        <Logo className="mr-2" />
        <MainNav />
        <div className="ml-auto flex items-center gap-1.5">
          <form action="/search" role="search" className="relative hidden md:block">
            <label htmlFor="site-search" className="sr-only">
              Search the archive
            </label>
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search anime, staff, studios…"
              className="h-9 w-56 rounded-md border border-input bg-background/60 pl-8 pr-3 text-sm outline-none transition-[width,box-shadow] placeholder:text-muted-foreground focus-visible:w-72 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
            />
          </form>
          <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Search">
            <Link href="/search">
              <Search />
            </Link>
          </Button>
          <ThemeToggle />
          <Button asChild variant={viewer.canEdit ? "default" : "outline"} size="sm" className="hidden sm:inline-flex">
            <Link href={editorHref}>
              <PenLine aria-hidden />
              {editorLabel}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
