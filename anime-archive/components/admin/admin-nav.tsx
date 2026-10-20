"use client";

import {
  BookOpenCheck,
  Building2,
  Disc3,
  FileInput,
  FileOutput,
  FileText,
  Film,
  GitPullRequestArrow,
  History,
  LayoutDashboard,
  Network,
  ShieldAlert,
  Tv,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Archive",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/productions", label: "Productions", icon: Tv },
      { href: "/admin/records/franchise", label: "Franchises", icon: Network },
      { href: "/admin/records/studio", label: "Studios", icon: Film },
      { href: "/admin/records/person", label: "People", icon: Users },
      { href: "/admin/records/company", label: "Companies & networks", icon: Building2 },
      { href: "/admin/records/music_track", label: "Music tracks", icon: Disc3 },
      { href: "/admin/records/source_document", label: "Source documents", icon: FileText },
    ],
  },
  {
    label: "Data",
    links: [
      { href: "/admin/import", label: "Import JSON", icon: FileInput },
      { href: "/admin/export", label: "Export", icon: FileOutput },
    ],
  },
  {
    label: "Review",
    links: [
      { href: "/admin/conflicts", label: "Conflicts", icon: GitPullRequestArrow },
      { href: "/admin/validation", label: "Timeline validation", icon: ShieldAlert },
      { href: "/admin/revisions", label: "Revisions", icon: History },
    ],
  },
];

export function AdminNav({ openConflicts }: { openConflicts: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Archive editor" className="space-y-5">
      {GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
          {group.links.map(({ href, label, icon: Icon, ...rest }) => {
            const active = "exact" in rest ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
                  active && "bg-accent font-medium text-accent-foreground",
                )}
              >
                <Icon aria-hidden className="size-4" />
                <span className="flex-1">{label}</span>
                {href === "/admin/conflicts" && openConflicts > 0 && (
                  <span className="rounded-full bg-destructive px-1.5 text-[0.65rem] font-bold text-white">{openConflicts}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
      <Link href="/about" className="flex items-center gap-2 px-3 text-xs text-muted-foreground hover:text-foreground">
        <BookOpenCheck aria-hidden className="size-3.5" /> Editorial rules
      </Link>
    </nav>
  );
}
