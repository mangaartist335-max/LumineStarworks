import { Clapperboard, Plus } from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductionTable, type AdminProductionRow } from "@/components/admin/production-table";
import { Button } from "@/components/ui/button";
import { loadArchive } from "@/lib/archive/server";
import { PROVENANCE_STATUSES, type Provenance } from "@/lib/archive/types";
import { analyzeBroadcastRun, validateProduction } from "@/lib/archive/validation";

export const metadata = { title: "Productions" };

export default async function AdminProductionsPage({ searchParams }: PageProps<"/admin/productions">) {
  const { provenance } = await searchParams;
  const index = await loadArchive();
  const rows: AdminProductionRow[] = index.tables.productions
    .map((p) => {
      const runs = index.runsFor(p.id);
      const issues = [...validateProduction(p, runs, index.episodesFor(p.id)), ...runs.flatMap((r) => analyzeBroadcastRun(r).issues)].filter((i) => i.level !== "info");
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        format: p.format,
        provenance: p.provenance,
        year: p.premiere_year,
        studio: index.studiosFor(p.id).map((s) => s.studio.name).join(", "),
        issues: issues.length,
        conflicts: index.openConflictCount("production", p.id),
      };
    })
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
  const initial = typeof provenance === "string" && (PROVENANCE_STATUSES as readonly string[]).includes(provenance) ? (provenance as Provenance) : "";

  return (
    <>
      <AdminHeader title="Productions" description="Select Proposed entries to approve them in bulk, or open any production to edit its full record.">
        <Button asChild>
          <Link href="/admin/productions/new">
            <Plus aria-hidden /> Add anime
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/productions/new?format=film">
            <Clapperboard aria-hidden /> Add theatrical film
          </Link>
        </Button>
      </AdminHeader>
      <ProductionTable rows={rows} initialProvenance={initial} />
    </>
  );
}
