"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/archive/empty-state";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { OCCUPATION_LABEL } from "@/lib/archive/labels";
import type { Occupation, Provenance } from "@/lib/archive/types";
import { cn, initials, plural } from "@/lib/utils";

export interface StaffRow {
  slug: string;
  name: string;
  name_native: string | null;
  aliases: string[];
  occupations: Occupation[];
  provenance: Provenance;
  credits: number;
  from: number | null;
  to: number | null;
  highlight: string | null;
}

export function StaffDirectory({ people, initialRole }: { people: StaffRow[]; initialRole: Occupation | "" }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Occupation | "">(initialRole);
  const [sort, setSort] = useState<"credits" | "name" | "era">("credits");
  const [hideProposed, setHideProposed] = useState(false);

  const roles = useMemo(() => [...new Set(people.flatMap((p) => p.occupations))].sort(), [people]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return people
      .filter((p) => !needle || [p.name, p.name_native, ...p.aliases].some((v) => v?.toLowerCase().includes(needle)))
      .filter((p) => !role || p.occupations.includes(role))
      .filter((p) => !hideProposed || p.provenance !== "proposed")
      .sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name) : sort === "era" ? (a.from ?? 9999) - (b.from ?? 9999) : b.credits - a.credits || a.name.localeCompare(b.name),
      );
  }, [people, q, role, sort, hideProposed]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card/50 p-3">
        <div className="relative min-w-52 flex-1">
          <label htmlFor="staff-q" className="sr-only">
            Search people
          </label>
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="staff-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, Japanese name or alias" className="pl-8" />
        </div>
        <label htmlFor="staff-role" className="sr-only">
          Role
        </label>
        <NativeSelect id="staff-role" value={role} onChange={(e) => setRole(e.target.value as Occupation | "")} className="w-44">
          <option value="">Every role</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {OCCUPATION_LABEL[r]}
            </option>
          ))}
        </NativeSelect>
        <label htmlFor="staff-sort" className="sr-only">
          Sort
        </label>
        <NativeSelect id="staff-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-40">
          <option value="credits">Most credits</option>
          <option value="name">Name (A–Z)</option>
          <option value="era">Earliest credit</option>
        </NativeSelect>
        <label className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={hideProposed} onChange={(e) => setHideProposed(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          Hide proposed
        </label>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {plural(shown.length, "person", "people")}
      </p>
      {shown.length === 0 ? (
        <EmptyState title="Nobody matches that search" description="Try another spelling or clear the role filter." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.slug}>
              <Link href={`/staff/${p.slug}`} className="group flex items-center gap-3 rounded-xl border bg-card/50 p-3 transition-colors hover:border-primary/40">
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold",
                    p.provenance === "confirmed" ? "bg-prov-confirmed/15 text-prov-confirmed" : "bg-accent text-accent-foreground",
                  )}
                >
                  {initials(p.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold group-hover:text-primary">{p.name}</span>
                    {p.provenance === "confirmed" && <ProvenanceBadge provenance={p.provenance} compact />}
                  </span>
                  {p.name_native && <span className="block truncate font-jp text-xs text-muted-foreground">{p.name_native}</span>}
                  <span className="block truncate text-xs text-muted-foreground">
                    {p.occupations.map((o) => OCCUPATION_LABEL[o]).join(" · ") || "Role not yet documented"}
                  </span>
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  <span className="block font-mono text-base font-bold text-foreground">{p.credits}</span>
                  {p.from ? (p.from === p.to ? p.from : `${p.from}–${p.to}`) : "credits"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
