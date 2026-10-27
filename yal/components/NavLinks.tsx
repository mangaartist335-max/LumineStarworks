"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/anime", label: "Anime", match: ["/anime", "/character", "/topanime", "/reviews", "/recommendations"] },
  { href: "/manga", label: "Manga", match: ["/manga"] },
  { href: "/community", label: "Community", match: ["/community", "/profile", "/animelist", "/users", "/news", "/stats"] },
  { href: "/forum", label: "Forums", match: ["/forum"] },
  { href: "/industry", label: "Industry", match: ["/industry", "/people", "/company"] },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Main">
      {LINKS.map((l) => {
        const active = l.match.some((m) => path === m || path.startsWith(`${m}/`));
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
