"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { SEASON_LABEL } from "@/lib/archive/labels";
import { calendarYears, isWithinCalendar, nextSeason, previousSeason, seasonHref, type SeasonKey } from "@/lib/archive/seasons";
import { SEASONS } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

export function SeasonPicker({ current }: { current: SeasonKey }) {
  const router = useRouter();
  const prev = previousSeason(current);
  const next = nextSeason(current);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="icon" aria-label="Previous season" className={cn(!isWithinCalendar(prev) && "pointer-events-none opacity-40")}>
        <Link href={seasonHref(prev)} aria-disabled={!isWithinCalendar(prev)}>
          <ChevronLeft />
        </Link>
      </Button>
      <label htmlFor="season-year" className="sr-only">
        Year
      </label>
      <NativeSelect
        id="season-year"
        value={current.year}
        onChange={(e) => router.push(seasonHref({ year: Number(e.target.value), season: current.season }))}
        className="w-28"
      >
        {calendarYears().map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </NativeSelect>
      <nav aria-label="Season" className="inline-flex rounded-md border bg-background/60 p-0.5">
        {SEASONS.map((s) => (
          <Link
            key={s}
            href={seasonHref({ year: current.year, season: s })}
            aria-current={s === current.season ? "page" : undefined}
            className={cn(
              "rounded px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              s === current.season && "bg-accent text-accent-foreground",
            )}
          >
            {SEASON_LABEL[s]}
          </Link>
        ))}
      </nav>
      <Button asChild variant="outline" size="icon" aria-label="Next season" className={cn(!isWithinCalendar(next) && "pointer-events-none opacity-40")}>
        <Link href={seasonHref(next)} aria-disabled={!isWithinCalendar(next)}>
          <ChevronRight />
        </Link>
      </Button>
    </div>
  );
}
