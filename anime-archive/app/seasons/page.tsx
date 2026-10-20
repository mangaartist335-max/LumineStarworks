import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/archive/page-header";
import { Button } from "@/components/ui/button";
import { SEASON_LABEL, SEASON_MONTHS, SEASON_NATIVE } from "@/lib/archive/labels";
import { getSeasonCalendar } from "@/lib/archive/queries";
import { ARCHIVE_END_YEAR, ARCHIVE_START_YEAR, formatSeason, seasonHref, seasonOfDate } from "@/lib/archive/seasons";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import { SEASONS } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Seasonal calendar",
  description: "Every Japanese broadcast season from 2006 to 2026 — Winter, Spring, Summer and Fall.",
};

function intensity(count: number, max: number): string {
  if (count === 0) return "bg-card/30";
  const ratio = count / Math.max(1, max);
  if (ratio > 0.75) return "bg-primary/30";
  if (ratio > 0.5) return "bg-primary/22";
  if (ratio > 0.25) return "bg-primary/15";
  return "bg-primary/9";
}

export default async function SeasonsPage() {
  const index = await loadArchive();
  const today = archiveToday();
  const current = seasonOfDate(today);
  const calendar = getSeasonCalendar(index);
  const max = Math.max(...calendar.flatMap((y) => y.seasons.map((s) => s.count)));

  return (
    <>
      <PageHeader
        eyebrow="Seasonal broadcasting calendar"
        title={`${ARCHIVE_START_YEAR}–${ARCHIVE_END_YEAR}, season by season`}
        description="Japanese anime premieres in four seasons. Pick any season to see its new productions, broadcast slots and the shows continuing from earlier cours."
      >
        <Button asChild>
          <Link href={seasonHref(current)}>Go to {formatSeason(current)}</Link>
        </Button>
      </PageHeader>

      <div className="container-page py-10">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SEASONS.map((s) => (
            <div key={s} className="rounded-xl border bg-card/50 p-3">
              <p className="font-semibold">
                {SEASON_LABEL[s]} <span className="font-jp text-muted-foreground">{SEASON_NATIVE[s]}</span>
              </p>
              <p className="text-xs text-muted-foreground">{SEASON_MONTHS[s]}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <caption className="sr-only">Number of productions premiering in each season</caption>
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="w-24 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Year
                </th>
                {SEASONS.map((s) => (
                  <th key={s} scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {SEASON_LABEL[s]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendar.map((year) => (
                <tr key={year.year} className="border-t">
                  <th scope="row" className="px-3 py-2 text-left align-top">
                    <Link href={`/anime?year=${year.year}&sort=premiere`} className="font-mono text-base font-bold hover:text-primary">
                      {year.year}
                    </Link>
                    <p className="text-[0.7rem] font-normal text-muted-foreground">{year.total} premieres</p>
                  </th>
                  {year.seasons.map((cell) => {
                    const isCurrent = year.year === current.year && cell.season === current.season;
                    return (
                      <td key={cell.season} className="p-1.5 align-top">
                        <Link
                          href={seasonHref({ year: year.year, season: cell.season })}
                          aria-label={`${SEASON_LABEL[cell.season]} ${year.year}: ${cell.count} premieres`}
                          className={cn(
                            "group flex h-full min-h-20 flex-col gap-1 rounded-lg border border-transparent p-2.5 transition-colors hover:border-primary/50",
                            intensity(cell.count, max),
                            isCurrent && "ring-2 ring-star/70",
                          )}
                        >
                          <span className="flex items-center justify-between">
                            <span className="font-mono text-lg font-bold leading-none">{cell.count || "·"}</span>
                            <span className="flex gap-1">
                              {cell.confirmed > 0 && (
                                <span title={`${cell.confirmed} confirmed`} className="rounded bg-prov-confirmed/20 px-1 text-[0.6rem] font-bold text-prov-confirmed">
                                  ✓{cell.confirmed}
                                </span>
                              )}
                              {cell.continuing > 0 && (
                                <span title={`${cell.continuing} continuing from earlier seasons`} className="rounded bg-muted px-1 text-[0.6rem] font-semibold text-muted-foreground">
                                  +{cell.continuing}
                                </span>
                              )}
                            </span>
                          </span>
                          {cell.highlights.map((title) => (
                            <span key={title} className="truncate text-[0.7rem] text-muted-foreground group-hover:text-foreground">
                              {title}
                            </span>
                          ))}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          ✓ counts confirmed productions; + counts multi-cour shows continuing from an earlier season. The highlighted cell is the current season.
        </p>
      </div>
    </>
  );
}
