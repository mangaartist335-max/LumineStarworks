import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/archive/page-header";
import { SeasonBrowser, type SeasonBrowserState } from "@/components/seasons/season-browser";
import { SeasonPicker } from "@/components/seasons/season-picker";
import { SEASON_MONTHS, SEASON_NATIVE } from "@/lib/archive/labels";
import { getSeasonListing } from "@/lib/archive/queries";
import { compareSeasons, formatSeason, isSeasonName, isWithinCalendar, seasonOfDate } from "@/lib/archive/seasons";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import { PRODUCTION_FORMATS, PROVENANCE_STATUSES, type ProductionFormat, type Provenance } from "@/lib/archive/types";

function parseKey(params: { year: string; season: string }) {
  const year = Number(params.year);
  if (!Number.isInteger(year) || !isSeasonName(params.season)) return null;
  const key = { year, season: params.season };
  return isWithinCalendar(key) ? key : null;
}

export async function generateMetadata({ params }: PageProps<"/seasons/[year]/[season]">): Promise<Metadata> {
  const key = parseKey(await params);
  return key ? { title: `${formatSeason(key)} anime`, description: `Anime premiering in ${formatSeason(key)} (${SEASON_MONTHS[key.season]}).` } : {};
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function SeasonPage({ params, searchParams }: PageProps<"/seasons/[year]/[season]">) {
  const key = parseKey(await params);
  if (!key) notFound();
  const query = await searchParams;

  const index = await loadArchive();
  const today = archiveToday();
  const listing = getSeasonListing(index, key, today);
  const current = seasonOfDate(today);

  const view = one(query.view);
  const format = one(query.format);
  const provenance = one(query.provenance);
  const initial: SeasonBrowserState = {
    q: one(query.q),
    sort: (["premiere", "title", "score", "episodes", "studio"].includes(one(query.sort)) ? one(query.sort) : "premiere") as SeasonBrowserState["sort"],
    format: (PRODUCTION_FORMATS as readonly string[]).includes(format) ? (format as ProductionFormat) : "",
    genre: one(query.genre),
    provenance: provenance === "hide-proposed" || (PROVENANCE_STATUSES as readonly string[]).includes(provenance) ? (provenance as Provenance | "hide-proposed") : "",
    view: view === "list" || view === "schedule" ? view : "grid",
  };

  const order = compareSeasons(key, current);
  const relation = order === 0 ? "Current season" : order > 0 ? "Upcoming season" : "Archive season";

  return (
    <>
      <PageHeader
        eyebrow={`${relation} · ${SEASON_MONTHS[key.season]}`}
        title={
          <>
            {formatSeason(key)} <span className="font-jp text-2xl font-semibold text-muted-foreground sm:text-3xl">{`${key.year}年${SEASON_NATIVE[key.season]}`}</span>
          </>
        }
        description={`${listing.premieres.length} premiering · ${listing.continuing.length} continuing from earlier seasons`}
      >
        <SeasonPicker current={key} />
      </PageHeader>
      <div className="container-page py-8">
        <SeasonBrowser premieres={listing.premieres} continuing={listing.continuing} initial={initial} seasonLabel={formatSeason(key)} />
      </div>
    </>
  );
}
