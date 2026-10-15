"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav
          className="hidden items-center gap-1 rounded-full bg-surface-muted p-1 ring-1 ring-border md:flex"
          aria-label="Main"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                isActive(pathname, item.href)
                  ? "bg-white text-foreground shadow-[0_2px_8px_-2px_rgba(42,134,194,0.35)]"
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
            className="gradient-fill grid h-10 w-10 place-items-center rounded-full font-display text-xs font-semibold text-white ring-4 ring-white"
          >
            {learner.initials}
          </Link>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-muted text-foreground md:hidden"
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
