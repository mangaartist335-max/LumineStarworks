import { SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/archive/empty-state";
import { PageHeader } from "@/components/archive/page-header";
import { ProductionGrid } from "@/components/archive/production-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FORMAT_LABEL, PROVENANCE_LABEL, SEASON_LABEL } from "@/lib/archive/labels";
import { allGenres, browseProductions, type BrowseFilters } from "@/lib/archive/queries";
import { calendarYears, isSeasonName } from "@/lib/archive/seasons";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import { PRODUCTION_FORMATS, PROVENANCE_STATUSES, SEASONS, type ProductionFormat, type Provenance } from "@/lib/archive/types";
import { plural } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Browse anime",
  description: "Search and filter every production in the archive by year, decade, season, format, genre, studio and record status.",
};

const SORTS = [
  ["premiere_desc", "Newest first"],
  ["premiere", "Oldest first"],
  ["title", "Title (A–Z)"],
  ["score", "Score"],
  ["episodes", "Episode count"],
] as const;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BrowsePage({ searchParams }: PageProps<"/anime">) {
  const params = await searchParams;
  const index = await loadArchive();
  const today = archiveToday();

  const year = Number(one(params.year)) || undefined;
  const decade = Number(one(params.decade)) || undefined;
  const season = one(params.season);
  const format = one(params.format);
  const provenance = one(params.provenance);
  const sort = one(params.sort);
  const filters: BrowseFilters = {
    q: one(params.q) || undefined,
    year,
    decade,
    season: isSeasonName(season) ? season : undefined,
    format: (PRODUCTION_FORMATS as readonly string[]).includes(format) ? (format as ProductionFormat) : undefined,
    genre: one(params.genre) || undefined,
    studio: one(params.studio) || undefined,
    provenance: (PROVENANCE_STATUSES as readonly string[]).includes(provenance) ? (provenance as Provenance) : undefined,
    sort: SORTS.some(([v]) => v === sort) ? (sort as BrowseFilters["sort"]) : "premiere_desc",
  };
  const results = browseProductions(index, filters, today);
  const genres = allGenres(index);
  const studios = [...index.tables.studios].sort((a, b) => a.name.localeCompare(b.name));
  const active = Object.entries(filters).filter(([k, v]) => k !== "sort" && v !== undefined).length;

  const heading = filters.year ? `Anime from ${filters.year}` : filters.decade ? `Anime from the ${filters.decade}s` : "Browse the archive";

  return (
    <>
      <PageHeader eyebrow="Browse & discover" title={heading} description={`${plural(results.length, "production")} ${active ? "match your filters" : "in the archive"}.`} />
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[16rem_1fr]">
        <aside aria-labelledby="filters-heading">
          <form className="space-y-4 rounded-xl border bg-card/50 p-4 lg:sticky lg:top-20">
            <h2 id="filters-heading" className="flex items-center gap-2 text-sm font-bold">
              <SlidersHorizontal aria-hidden className="size-4" /> Filters
            </h2>
            <Field label="Title" htmlFor="f-q">
              <Input id="f-q" name="q" defaultValue={filters.q} placeholder="English, Japanese or romaji" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year" htmlFor="f-year">
                <NativeSelect id="f-year" name="year" defaultValue={filters.year ?? ""}>
                  <option value="">Any</option>
                  {calendarYears().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Decade" htmlFor="f-decade">
                <NativeSelect id="f-decade" name="decade" defaultValue={filters.decade ?? ""}>
                  <option value="">Any</option>
                  {[2000, 2010, 2020].map((d) => (
                    <option key={d} value={d}>
                      {d}s
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field label="Premiere season" htmlFor="f-season">
              <NativeSelect id="f-season" name="season" defaultValue={filters.season ?? ""}>
                <option value="">Any season</option>
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {SEASON_LABEL[s]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Format" htmlFor="f-format">
              <NativeSelect id="f-format" name="format" defaultValue={filters.format ?? ""}>
                <option value="">Any format</option>
                {PRODUCTION_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABEL[f]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Genre" htmlFor="f-genre">
              <NativeSelect id="f-genre" name="genre" defaultValue={filters.genre ?? ""}>
                <option value="">Any genre</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Studio" htmlFor="f-studio">
              <NativeSelect id="f-studio" name="studio" defaultValue={filters.studio ?? ""}>
                <option value="">Any studio</option>
                {studios.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Record status" htmlFor="f-provenance">
              <NativeSelect id="f-provenance" name="provenance" defaultValue={filters.provenance ?? ""}>
                <option value="">Any status</option>
                {PROVENANCE_STATUSES.map((p) => (
                  <option key={p} value={p}>
                    {PROVENANCE_LABEL[p]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Sort by" htmlFor="f-sort">
              <NativeSelect id="f-sort" name="sort" defaultValue={filters.sort}>
                {SORTS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1">
                Apply
              </Button>
              {active > 0 && (
                <Button asChild variant="ghost">
                  <Link href="/anime">Reset</Link>
                </Button>
              )}
            </div>
          </form>
        </aside>
        <section aria-label="Results">
          {results.length ? (
            <ProductionGrid productions={results} showSeason className="lg:grid-cols-4 xl:grid-cols-5" />
          ) : (
            <EmptyState title="No productions match these filters" description="Try widening the year range or removing a filter.">
              <Button asChild variant="outline" size="sm">
                <Link href="/anime">Clear all filters</Link>
              </Button>
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
