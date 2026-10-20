import { Star } from "lucide-react";
import Link from "next/link";
import { formatBroadcastTime, formatDate } from "@/lib/archive/dates";
import { FORMAT_LABEL, WEEKDAY_LABEL } from "@/lib/archive/labels";
import type { ProductionSummary } from "@/lib/archive/queries";
import { formatSeason } from "@/lib/archive/seasons";
import { cn } from "@/lib/utils";
import { PosterArt } from "./poster-art";
import { ProvenanceBadge } from "./provenance-badge";
import { StatusBadge } from "./status-badge";

export function ProductionCard({ production: p, className, showSeason = false }: { production: ProductionSummary; className?: string; showSeason?: boolean }) {
  return (
    <Link
      href={`/anime/${p.slug}`}
      className={cn(
        "group flex flex-col gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div className="relative">
        <PosterArt
          slug={p.slug}
          title={p.title}
          native={p.title_native}
          format={p.format}
          year={p.premiere_year}
          provenance={p.provenance}
          posterUrl={p.poster_url}
          className="transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/10"
        />
        {p.score !== null && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-md bg-black/55 px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-white backdrop-blur-sm">
            <Star aria-hidden className="size-3 fill-star text-star" />
            {p.score.toFixed(2)}
          </span>
        )}
      </div>
      <div className="space-y-1 px-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">{p.title}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {p.studios.map((s) => s.name).join(" · ") || "Studio not yet documented"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {p.provenance !== "proposed" && <ProvenanceBadge provenance={p.provenance} />}
          {showSeason && p.premiere && <span className="text-[0.7rem] text-muted-foreground">{formatSeason(p.premiere)}</span>}
          {!showSeason && <StatusBadge status={p.status} />}
        </div>
      </div>
    </Link>
  );
}

export function ProductionGrid({ productions, showSeason, className }: { productions: ProductionSummary[]; showSeason?: boolean; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6", className)}>
      {productions.map((p) => (
        <ProductionCard key={p.id} production={p} showSeason={showSeason} />
      ))}
    </div>
  );
}

export function broadcastLine(p: ProductionSummary): string | null {
  if (p.format === "film") return p.premiere_date ? `In theatres ${formatDate(p.premiere_date, "short")}` : p.premiere_year ? `Theatrical release, ${p.premiere_year}` : null;
  const parts: string[] = [];
  if (p.weekday !== null) parts.push(`${WEEKDAY_LABEL[p.weekday]}s${p.weekday_derived ? " (derived)" : ""}`);
  const time = formatBroadcastTime(p.local_time, p.time_zone);
  if (time) parts.push(time);
  if (p.network) parts.push(p.network);
  return parts.length ? parts.join(" · ") : null;
}

export function ProductionRow({ production: p, extra }: { production: ProductionSummary; extra?: React.ReactNode }) {
  const broadcast = broadcastLine(p);
  return (
    <Link
      href={`/anime/${p.slug}`}
      className="group flex gap-4 rounded-xl border bg-card/60 p-3 transition-colors outline-none hover:border-primary/40 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="w-16 shrink-0 sm:w-20">
        <PosterArt slug={p.slug} title={p.title} native={p.title_native} format={p.format} posterUrl={p.poster_url} size="sm" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold transition-colors group-hover:text-primary">{p.title}</h3>
            {(p.title_native || p.title_romaji) && (
              <p className="truncate font-jp text-xs text-muted-foreground">
                {p.title_native}
                {p.title_native && p.title_romaji ? " · " : ""}
                {p.title_romaji}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ProvenanceBadge provenance={p.provenance} />
            <StatusBadge status={p.status} />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
          <div>
            <dt className="sr-only">Studio</dt>
            <dd className="truncate">{p.studios.map((s) => s.name).join(", ") || "Studio pending"}</dd>
          </div>
          <div>
            <dt className="sr-only">Format and episodes</dt>
            <dd>
              {FORMAT_LABEL[p.format]}
              {p.episode_count !== null && p.format !== "film" ? ` · ${p.episode_count} ep${p.episode_count === 1 ? "" : "s"}` : ""}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Premiere</dt>
            <dd className="font-mono">{p.premiere_date ? formatDate(p.premiere_date, "short") : p.premiere_year ?? "Date pending"}</dd>
          </div>
          <div>
            <dt className="sr-only">Broadcast</dt>
            <dd className="truncate">{broadcast ?? "Broadcast slot pending"}</dd>
          </div>
        </dl>
        {p.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.genres.slice(0, 4).map((g) => (
              <span key={g} className="rounded bg-muted px-1.5 py-0.5 text-[0.68rem] text-muted-foreground">
                {g}
              </span>
            ))}
          </div>
        )}
        {extra}
      </div>
    </Link>
  );
}
