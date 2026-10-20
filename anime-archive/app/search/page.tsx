import { Disc3, Film, Network, Search, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/archive/empty-state";
import { PageHeader } from "@/components/archive/page-header";
import { ProductionGrid } from "@/components/archive/production-card";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OCCUPATION_LABEL } from "@/lib/archive/labels";
import { searchArchive } from "@/lib/archive/queries";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import type { Provenance } from "@/lib/archive/types";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q: raw } = await searchParams;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const index = await loadArchive();
  const results = searchArchive(index, q, archiveToday());
  const total = results.productions.length + results.people.length + results.studios.length + results.franchises.length + results.tracks.length;

  return (
    <>
      <PageHeader eyebrow="Search the archive" title={q ? `Results for “${q}”` : "What are you looking for?"} description={q ? `${total} matching records` : "Search titles in English, Japanese or romaji, plus people, studios, franchises and songs."}>
        <form role="search" className="flex w-full max-w-md gap-2">
          <label htmlFor="search-q" className="sr-only">
            Search
          </label>
          <Input id="search-q" name="q" type="search" defaultValue={q} placeholder="e.g. Sawano, Studio Burst, 星屑" autoFocus />
          <Button type="submit">
            <Search aria-hidden /> Search
          </Button>
        </form>
      </PageHeader>
      <div className="container-page space-y-12 py-10">
        {!q ? (
          <EmptyState icon={Search} title="Start typing to search" description="Try a studio name, a composer, a Japanese title or a song." />
        ) : total === 0 ? (
          <EmptyState icon={Search} title={`Nothing found for “${q}”`} description="Check the spelling, or try a shorter part of the name." />
        ) : (
          <>
            {results.productions.length > 0 && (
              <section aria-labelledby="r-anime">
                <h2 id="r-anime" className="mb-4 text-lg font-bold">
                  Anime <span className="text-muted-foreground">({results.productions.length})</span>
                </h2>
                <ProductionGrid productions={results.productions} showSeason />
              </section>
            )}
            <div className="grid gap-10 lg:grid-cols-2">
              {results.people.length > 0 && (
                <ResultList icon={Users} title="People" items={results.people.map((p) => ({ href: `/staff/${p.slug}`, title: p.name, sub: [p.name_native, p.occupations.map((o) => OCCUPATION_LABEL[o]).join(", ")].filter(Boolean).join(" · "), provenance: p.provenance }))} />
              )}
              {results.studios.length > 0 && (
                <ResultList icon={Film} title="Studios" items={results.studios.map((s) => ({ href: `/studios/${s.slug}`, title: s.name, sub: [s.name_native, s.location].filter(Boolean).join(" · "), provenance: s.provenance }))} />
              )}
              {results.franchises.length > 0 && (
                <ResultList icon={Network} title="Franchises" items={results.franchises.map((f) => ({ href: `/franchises/${f.slug}`, title: f.name, sub: `${f.entries} entries${f.name_native ? ` · ${f.name_native}` : ""}` }))} />
              )}
              {results.tracks.length > 0 && (
                <ResultList icon={Disc3} title="Music" items={results.tracks.map((t) => ({ href: `/music?q=${encodeURIComponent(t.title)}`, title: t.title, sub: t.performers.join(", ") || "Performer not yet documented" }))} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ResultList({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Users;
  title: string;
  items: { href: string; title: string; sub?: string; provenance?: Provenance }[];
}) {
  return (
    <section aria-label={title}>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <Icon aria-hidden className="size-5 text-primary" /> {title} <span className="text-muted-foreground">({items.length})</span>
      </h2>
      <ul className="divide-y rounded-xl border bg-card/50">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/40">
              <span className="min-w-0">
                <span className="block truncate font-medium">{item.title}</span>
                {item.sub && <span className="block truncate font-jp text-xs text-muted-foreground">{item.sub}</span>}
              </span>
              {item.provenance && <ProvenanceBadge provenance={item.provenance} compact />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
