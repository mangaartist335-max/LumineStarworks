import Link from "next/link";

const SECTIONS: Record<string, { href: string; label: string }[]> = {
  anime: [
    { href: "/anime", label: "Anime Search" },
    { href: "/topanime", label: "Top Anime" },
    { href: "/anime/season", label: "Seasonal Anime" },
    { href: "/character", label: "Characters" },
    { href: "/reviews", label: "Reviews" },
    { href: "/recommendations", label: "Recommendations" },
  ],
  community: [
    { href: "/community", label: "Community" },
    { href: "/news", label: "News" },
    { href: "/users", label: "Members" },
    { href: "/stats", label: "Statistics" },
    { href: "/forum", label: "Forums" },
  ],
  industry: [
    { href: "/industry", label: "Industry" },
    { href: "/industry?view=studios", label: "Studios & Companies" },
    { href: "/people", label: "People" },
    { href: "/manga", label: "Manga" },
  ],
};

export function SectionNav({ section, active }: { section: keyof typeof SECTIONS; active: string }) {
  return (
    <nav className="section-nav" aria-label="Section">
      {SECTIONS[section].map((s) => (
        <Link key={s.href} href={s.href} className={s.href === active ? "active" : undefined} aria-current={s.href === active ? "page" : undefined}>
          {s.label}
        </Link>
      ))}
    </nav>
  );
}

/** Page heading; `attached` removes the gap so a SectionNav can sit underneath. */
export function PageTitle({ title, subtitle, attached }: { title: string; subtitle?: string; attached?: boolean }) {
  return (
    <div className="page-title" style={{ marginBottom: attached ? 0 : 15 }}>
      <h1>{title}</h1>
      {subtitle && <div className="subtitle">{subtitle}</div>}
    </div>
  );
}
