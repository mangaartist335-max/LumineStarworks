import { Clapperboard, FileInput, GitPullRequestArrow, History, Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/lib/archive/dates";
import { ENTITY_LABEL } from "@/lib/archive/labels";
import { archiveStats } from "@/lib/archive/queries";
import { loadArchive } from "@/lib/archive/server";
import { PROVENANCE_STATUSES } from "@/lib/archive/types";
import { validateArchive } from "@/lib/archive/validation";

export default async function AdminDashboard() {
  const index = await loadArchive();
  const stats = archiveStats(index);
  const issues = validateArchive(index.tables);
  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;
  const recent = [...index.tables.revisions].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 8);
  const proposed = stats.byProvenance.get("proposed") ?? 0;

  return (
    <>
      <AdminHeader title="Archive editor" description="Add and correct productions, register studios and staff, import production documents and review anything that needs a second look.">
        <Button asChild>
          <Link href="/admin/productions/new">
            <Plus aria-hidden /> Add anime
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/productions/new?format=film">
            <Clapperboard aria-hidden /> Add film
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/import">
            <FileInput aria-hidden /> Import JSON
          </Link>
        </Button>
      </AdminHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Productions" value={stats.productions} href="/admin/productions" />
        <StatCard label="Open conflicts" value={stats.openConflicts} href="/admin/conflicts" tone={stats.openConflicts ? "alert" : undefined} icon={GitPullRequestArrow} />
        <StatCard label="Timeline errors" value={errors} sub={`${warnings} warnings`} href="/admin/validation" tone={errors ? "alert" : undefined} icon={ShieldAlert} />
        <StatCard label="Awaiting approval" value={proposed} sub="Proposed sample entries" href="/admin/productions?provenance=proposed" />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_22rem]">
        <section aria-labelledby="recent-revisions" className="rounded-xl border bg-card/50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 id="recent-revisions" className="flex items-center gap-2 font-semibold">
              <History aria-hidden className="size-4 text-primary" /> Recent changes
            </h2>
            <Link href="/admin/revisions" className="text-sm text-muted-foreground hover:text-foreground">
              All revisions
            </Link>
          </div>
          <ul className="divide-y">
            {recent.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{r.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {ENTITY_LABEL[r.entity_type]} · {r.action} · {formatTimestamp(r.created_at)}
                  {r.author ? ` · ${r.author}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="by-status" className="space-y-3 rounded-xl border bg-card/50 p-4">
          <h2 id="by-status" className="font-semibold">
            Productions by status
          </h2>
          <ul className="space-y-2">
            {PROVENANCE_STATUSES.map((p) => (
              <li key={p}>
                <Link href={`/admin/productions?provenance=${p}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-accent/50">
                  <ProvenanceBadge provenance={p} />
                  <span className="font-mono text-sm font-semibold">{stats.byProvenance.get(p) ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {stats.studios} studios · {stats.people} people · {stats.franchises} franchises · {stats.tracks} music tracks
          </p>
        </section>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  sub?: string;
  href: string;
  tone?: "alert";
  icon?: typeof History;
}) {
  return (
    <Link href={href} className="group rounded-xl border bg-card/50 p-4 transition-colors hover:border-primary/40">
      <p className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        {Icon && <Icon aria-hidden className={tone === "alert" ? "size-4 text-destructive" : "size-4"} />}
      </p>
      <p className={`mt-1 font-mono text-3xl font-bold ${tone === "alert" ? "text-destructive" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Link>
  );
}
