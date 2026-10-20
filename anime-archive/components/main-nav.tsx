"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`) || (link.href === "/anime" && pathname.startsWith("/anime"));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
              active && "bg-accent text-accent-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
