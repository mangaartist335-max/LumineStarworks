"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { seg: "", label: "Overview" },
  { seg: "characters", label: "Characters & Staff" },
  { seg: "episodes", label: "Episodes" },
  { seg: "videos", label: "Videos" },
  { seg: "reviews", label: "Reviews" },
  { seg: "recommendations", label: "Recommendations" },
  { seg: "stats", label: "Stats" },
  { seg: "forum", label: "Forum" },
];

export function AnimeTabs({ base }: { base: string }) {
  const path = decodeURIComponent(usePathname());
  const rest = path.startsWith(base) ? path.slice(base.length).replace(/^\//, "").split("/")[0] : "";
  return (
    <nav className="tabs" aria-label="Anime sections">
      {TABS.map((t) => {
        const active = rest === t.seg;
        return (
          <Link key={t.label} href={t.seg ? `${base}/${t.seg}` : base} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
