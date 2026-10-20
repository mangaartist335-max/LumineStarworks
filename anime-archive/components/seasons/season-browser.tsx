"use client";

import { CalendarDays, LayoutGrid, List, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/archive/empty-state";
import { ProductionGrid, ProductionRow } from "@/components/archive/production-card";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatBroadcastTime, formatDate } from "@/lib/archive/dates";
import { FORMAT_LABEL, FORMAT_SHORT, PROVENANCE_LABEL, WEEKDAY_LABEL } from "@/lib/archive/labels";
import type { ProductionSummary } from "@/lib/archive/queries";
import { formatSeason } from "@/lib/archive/seasons";
import type { ProductionFormat, Provenance } from "@/lib/archive/types";
import { cn, plural } from "@/lib/utils";

export type SeasonView = "grid" | "list" | "schedule";
type SortKey = "premiere" | "title" | "score" | "episodes" | "studio";

export interface SeasonBrowserState {
  q: string;
  sort: SortKey;
  format: ProductionFormat | "";
  genre: string;
  provenance: Provenance | "" | "hide-proposed";
  view: SeasonView;
}

const SORTS: { value: SortKey; label: string }[] = [
  { value: "premiere", label: "Premiere" },
  { value: "title", label: "Title" },
  { value: "studio", label: "Studio" },
  { value: "episodes", label: "Episodes" },
  { value: "score", label: "Score" },
];

function sortProductions(list: ProductionSummary[], sort: SortKey): ProductionSummary[] {
  const byDate = (a: ProductionSummary, b: ProductionSummary) => (a.premiere_date ?? "9999").localeCompare(b.premiere_date ?? "9999");
  const sorters: Record<SortKey, (a: ProductionSummary, b: ProductionSummary) => number> = {
    premiere: (a, b) => byDate(a, b) || a.title.localeCompare(b.title),
    title: (a, b) => a.title.localeCompare(b.title),
    studio: (a, b) => (a.studios[0]?.name ?? "~").localeCompare(b.studios[0]?.name ?? "~") || byDate(a, b),
    episodes: (a, b) => (b.episode_count ?? -1) - (a.episode_count ?? -1),
    score: (a, b) => (b.score ?? -1) - (a.score ?? -1),
  };
  return [...list].sort(sorters[sort]);
}

function matches(p: ProductionSummary, state: SeasonBrowserState): boolean {
  const q = state.q.trim().toLowerCase();
  if (q) {
    const haystack = [p.title, p.title_native, p.title_romaji, ...p.studios.map((s) => s.name), p.director, p.network, ...p.genres]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (state.format && p.format !== state.format) return false;
  if (state.genre && !p.genres.includes(state.genre)) return false;
  if (state.provenance === "hide-proposed" && p.provenance === "proposed") return false;
  if (state.provenance && state.provenance !== "hide-proposed" && p.provenance !== state.provenance) return false;
  return true;
}

export function SeasonBrowser({
  premieres,
  continuing,
  initial,
  seasonLabel,
}: {
  premieres: ProductionSummary[];
  continuing: ProductionSummary[];
  initial: SeasonBrowserState;
  seasonLabel: string;
}) {
  const [state, setState] = useState<SeasonBrowserState>(initial);

  const update = (patch: Partial<SeasonBrowserState>) => {
    const next = { ...state, ...patch };
    setState(next);
    // Keep the URL shareable without triggering a navigation.
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.sort !== "premiere") params.set("sort", next.sort);
    if (next.format) params.set("format", next.format);
    if (next.genre) params.set("genre", next.genre);
    if (next.provenance) params.set("provenance", next.provenance);
    if (next.view !== "grid") params.set("view", next.view);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  const all = useMemo(() => [...premieres, ...continuing], [premieres, continuing]);
  const genres = useMemo(() => [...new Set(all.flatMap((p) => p.genres))].sort(), [all]);
  const formats = useMemo(() => [...new Set(all.map((p) => p.format))], [all]);

  const shownPremieres = sortProductions(premieres.filter((p) => matches(p, state)), state.sort);
  const shownContinuing = sortProductions(continuing.filter((p) => matches(p, state)), state.sort);
  const filtersActive = state.q || state.format || state.genre || state.provenance;
  const total = shownPremieres.length + shownContinuing.length;

  return (
    <div className="space-y-8">
      <div className="sticky top-16 z-30 -mx-4 border-y bg-background/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <label htmlFor="season-search" className="sr-only">
              Search this season
            </label>
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="season-search" value={state.q} onChange={(e) => update({ q: e.target.value })} placeholder="Search titles, studios, staff, networks…" className="pl-8" />
          </div>
          <label className="sr-only" htmlFor="season-sort">
            Sort by
          </label>
          <NativeSelect id="season-sort" value={state.sort} onChange={(e) => update({ sort: e.target.value as SortKey })} className="w-40">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </NativeSelect>
          <label className="sr-only" htmlFor="season-format">
            Format
          </label>
          <NativeSelect id="season-format" value={state.format} onChange={(e) => update({ format: e.target.value as ProductionFormat | "" })} className="w-36">
            <option value="">All formats</option>
            {formats.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABEL[f]}
              </option>
            ))}
          </NativeSelect>
          <label className="sr-only" htmlFor="season-genre">
            Genre
          </label>
          <NativeSelect id="season-genre" value={state.genre} onChange={(e) => update({ genre: e.target.value })} className="w-36">
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </NativeSelect>
          <label className="sr-only" htmlFor="season-provenance">
            Provenance
          </label>
          <NativeSelect id="season-provenance" value={state.provenance} onChange={(e) => update({ provenance: e.target.value as SeasonBrowserState["provenance"] })} className="w-44">
            <option value="">All records</option>
            <option value="hide-proposed">Hide proposed samples</option>
            {(["confirmed", "provisional", "proposed", "conflicting"] as Provenance[]).map((p) => (
              <option key={p} value={p}>
                {PROVENANCE_LABEL[p]} only
              </option>
            ))}
          </NativeSelect>
          <ToggleGroup type="single" value={state.view} onValueChange={(v) => v && update({ view: v as SeasonView })} aria-label="View">
            <ToggleGroupItem value="grid" aria-label="Poster grid">
              <LayoutGrid />
              <span className="hidden sm:inline">Grid</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Detailed list">
              <List />
              <span className="hidden sm:inline">List</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="schedule" aria-label="Weekly schedule">
              <CalendarDays />
              <span className="hidden sm:inline">Schedule</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground" aria-live="polite">
          <span>
            Showing {plural(total, "production")}
            {filtersActive ? " matching your filters" : ""}
          </span>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={() => update({ q: "", format: "", genre: "", provenance: "" })}>
              <X aria-hidden /> Clear filters
            </Button>
          )}
        </div>
      </div>

      {state.view === "schedule" ? (
        <WeeklySchedule productions={[...shownPremieres, ...shownContinuing]} continuingIds={new Set(continuing.map((c) => c.id))} />
      ) : (
        <>
          <section aria-labelledby="new-this-season">
            <h2 id="new-this-season" className="mb-4 text-lg font-bold">
              New in {seasonLabel} <span className="font-normal text-muted-foreground">({shownPremieres.length})</span>
            </h2>
            {shownPremieres.length === 0 ? (
              <EmptyState
                title={premieres.length === 0 ? `No premieres recorded for ${seasonLabel} yet` : "Nothing matches these filters"}
                description={
                  premieres.length === 0
                    ? "This season is waiting for its lineup. Editors can add productions from the archive editor or import a production document."
                    : "Try clearing a filter or searching for something else."
                }
              />
            ) : state.view === "grid" ? (
              <ProductionGrid productions={shownPremieres} />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {shownPremieres.map((p) => (
                  <ProductionRow key={p.id} production={p} />
                ))}
              </div>
            )}
          </section>

          {continuing.length > 0 && (
            <section aria-labelledby="continuing">
              <h2 id="continuing" className="mb-1 text-lg font-bold">
                Continuing from earlier seasons <span className="font-normal text-muted-foreground">({shownContinuing.length})</span>
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">Multi-cour productions keep their original premiere season while their broadcast carries on here.</p>
              {state.view === "grid" ? (
                <ProductionGrid productions={shownContinuing} showSeason />
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {shownContinuing.map((p) => (
                    <ProductionRow key={p.id} production={p} extra={p.premiere && <p className="text-xs text-primary">Premiered {formatSeason(p.premiere)}</p>} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function WeeklySchedule({ productions, continuingIds }: { productions: ProductionSummary[]; continuingIds: Set<string> }) {
  const weekly = productions.filter((p) => p.weekday !== null && p.format !== "film");
  const other = productions.filter((p) => p.weekday === null || p.format === "film");
  const timeKey = (p: ProductionSummary) => p.local_time ?? "99:99";

  if (productions.length === 0) {
    return <EmptyState title="Nothing to schedule" description="No productions match the current filters." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {WEEK_ORDER.map((day) => {
          const items = weekly.filter((p) => p.weekday === day).sort((a, b) => timeKey(a).localeCompare(timeKey(b)));
          return (
            <section key={day} aria-label={WEEKDAY_LABEL[day]} className="flex flex-col rounded-xl border bg-card/40">
              <h3 className="border-b px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{WEEKDAY_LABEL[day]}</h3>
              <ul className="flex flex-1 flex-col gap-2 p-2">
                {items.length === 0 && <li className="px-1 py-3 text-center text-xs text-muted-foreground">—</li>}
                {items.map((p) => (
                  <li key={p.id}>
                    <Link href={`/anime/${p.slug}`} className="block rounded-lg border bg-background/60 p-2 transition-colors hover:border-primary/50">
                      <p className="font-mono text-[0.68rem] font-semibold text-primary">{formatBroadcastTime(p.local_time, p.time_zone) ?? "Time pending"}</p>
                      <p className="line-clamp-2 text-xs font-semibold leading-snug">{p.title}</p>
                      <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">{p.network ?? p.studios[0]?.name ?? ""}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.weekday_derived && <span className="text-[0.6rem] text-muted-foreground" title="Weekday derived from the premiere date">derived day</span>}
                        {continuingIds.has(p.id) && <span className="rounded bg-muted px-1 text-[0.6rem] text-muted-foreground">continuing</span>}
                        {p.provenance !== "proposed" && <ProvenanceBadge provenance={p.provenance} className="px-1 py-0 text-[0.55rem]" />}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {other.length > 0 && (
        <section aria-labelledby="unscheduled">
          <h3 id="unscheduled" className="mb-3 text-sm font-bold">
            Films, specials and releases without a weekly slot
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {other.map((p) => (
              <li key={p.id}>
                <Link href={`/anime/${p.slug}`} className={cn("flex items-center justify-between gap-3 rounded-lg border bg-card/50 px-3 py-2 text-sm hover:border-primary/50")}>
                  <span className="truncate font-medium">{p.title}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {FORMAT_SHORT[p.format]} · {p.premiere_date ? formatDate(p.premiere_date, "short") : p.premiere_year ?? "TBA"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs text-muted-foreground">Times are local broadcast times (JST for Japanese television). Late-night slots past midnight use the 25:00-style convention.</p>
    </div>
  );
}
