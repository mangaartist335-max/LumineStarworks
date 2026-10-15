"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";
import { learner } from "@/lib/learner";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/#paths", label: "Learning paths" },
  { href: "/dashboard", label: "My learning" },
];

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

// True until the page has scrolled most of the way past the home hero.
function useOverHero(enabled: boolean) {
  const [over, setOver] = useState(true);
  useEffect(() => {
    if (!enabled) return;
    const update = () => setOver(window.scrollY < window.innerHeight * 0.75);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled]);
  return enabled && over;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The home page opens on a dark cinematic hero, so the header turns light
  // and see-through while it floats over it.
  const dark = useOverHero(pathname === "/") && !open;

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 border-b transition-colors duration-300",
        dark
          ? "border-transparent bg-[#0b1c33]/30 backdrop-blur-md"
          : "border-white/60 bg-white/75 backdrop-blur-xl"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo tone={dark ? "light" : "dark"} />

        <nav
          className={clsx(
            "hidden items-center gap-1 rounded-full p-1 ring-1 transition-colors md:flex",
            dark ? "bg-white/8 ring-white/15" : "bg-surface-muted ring-border"
          )}
          aria-label="Main"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                isActive(pathname, item.href)
                  ? dark
                    ? "bg-white/15 text-white"
                    : "bg-white text-foreground shadow-[0_2px_8px_-2px_rgba(42,134,194,0.35)]"
                  : dark
                    ? "text-white/70 hover:text-white"
                    : "text-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/courses" className="btn-primary px-4 py-2 text-sm">
            Start learning
          </Link>
          <Link
            href="/dashboard"
            aria-label={`${learner.fullName}'s learning`}
            className={clsx(
              "gradient-fill grid h-10 w-10 place-items-center rounded-full font-display text-xs font-semibold text-white ring-4 transition",
              dark ? "ring-white/15" : "ring-white"
            )}
          >
            {learner.initials}
          </Link>
        </div>

        <button
          type="button"
          className={clsx(
            "grid h-10 w-10 place-items-center rounded-full md:hidden",
            dark ? "bg-white/10 text-white" : "bg-surface-muted text-foreground"
          )}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t bg-white px-4 py-3 md:hidden" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "block rounded-2xl px-4 py-3 text-sm font-medium",
                isActive(pathname, item.href) ? "bg-brand-soft text-brand-dark" : "text-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/courses" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full py-3 text-sm">
            Start learning
          </Link>
        </nav>
      )}
    </header>
  );
}
