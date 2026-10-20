import { Network } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/archive/page-header";
import { PosterArt } from "@/components/archive/poster-art";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { FORMAT_SHORT } from "@/lib/archive/labels";
import { summarizeFranchises } from "@/lib/archive/queries";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import { plural } from "@/lib/utils";

export const metadata: Metadata = { title: "Franchises", description: "Every franchise timeline — TV seasons, sequels, films, OVAs and specials." };

export default async function FranchisesPage() {
  const index = await loadArchive();
  const franchises = summarizeFranchises(index, archiveToday());
  return (
    <>
      <PageHeader eyebrow="Franchise timelines" title="Series, sequels & films" description={`${plural(franchises.length, "franchise")} with every season, film, OVA and special in order.`} />
      <div className="container-page py-10">
        <ul className="grid gap-4 md:grid-cols-2">
          {franchises.map((f) => {
            const entries = index.franchiseEntries(index.franchisesBySlug.get(f.slug)!.id);
            return (
              <li key={f.slug}>
                <Link href={`/franchises/${f.slug}`} className="group flex h-full flex-col gap-4 rounded-xl border bg-card/50 p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary">
                        <Network aria-hidden className="size-5 text-primary" /> {f.name}
                      </h2>
                      {f.name_native && <p className="font-jp text-sm text-muted-foreground">{f.name_native}</p>}
                    </div>
                    <ProvenanceBadge provenance={f.provenance} />
                  </div>
                  {f.description && <p className="text-sm text-muted-foreground">{f.description}</p>}
                  <ol className="flex gap-2 overflow-hidden">
                    {entries.slice(0, 6).map((e) => (
                      <li key={e.id} className="w-16 shrink-0">
                        <PosterArt slug={e.slug} title="" format={e.format} glyph={e.season_number ? String(e.season_number) : undefined} size="sm" className="rounded-md" />
                      </li>
                    ))}
                  </ol>
                  <p className="mt-auto text-xs text-muted-foreground">
                    {plural(f.entries, "entry", "entries")}
                    {f.first_year && ` · ${f.first_year === f.last_year ? f.first_year : `${f.first_year}–${f.last_year}`}`}
                    {` · ${f.formats.map((x) => FORMAT_SHORT[x]).join(", ")}`}
                    {f.studios.length > 0 && ` · ${f.studios.join(", ")}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
