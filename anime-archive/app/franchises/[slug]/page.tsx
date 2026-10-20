import { ArrowRightLeft, Clapperboard, Languages, Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/anime/info-list";
import { PageHeader } from "@/components/archive/page-header";
import { PosterArt } from "@/components/archive/poster-art";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { StatusBadge } from "@/components/archive/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateRange } from "@/lib/archive/dates";
import { FORMAT_LABEL, RELATION_LABEL } from "@/lib/archive/labels";
import { getFranchiseTimeline } from "@/lib/archive/queries";
import { formatSeason, seasonHref } from "@/lib/archive/seasons";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import { plural } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/franchises/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const franchise = (await loadArchive()).franchisesBySlug.get(slug);
  return { title: franchise ? `${franchise.name} timeline` : "Franchise not found" };
}

export default async function FranchisePage({ params }: PageProps<"/franchises/[slug]">) {
  const { slug } = await params;
  const index = await loadArchive();
  const detail = getFranchiseTimeline(index, slug, archiveToday());
  if (!detail) notFound();
  const { franchise, timeline } = detail;

  return (
    <>
      <PageHeader
        eyebrow="Franchise timeline"
        title={franchise.name}
        description={
          <>
            {franchise.name_native && <span className="mr-2 font-jp">{franchise.name_native}</span>}
            {plural(timeline.length, "entry", "entries")}
            {detail.span && ` · ${detail.span.from === detail.span.to ? detail.span.from : `${detail.span.from}–${detail.span.to}`}`}
          </>
        }
      >
        <ProvenanceBadge provenance={franchise.provenance} />
      </PageHeader>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_18rem]">
        <ol className="relative space-y-6 border-l-2 border-dashed border-border pl-8" aria-label={`${franchise.name} in release order`}>
          {timeline.map(({ summary, studioChange, director, music, dub }, i) => (
            <li key={summary.id} className="relative">
              <span aria-hidden className="absolute -left-[2.6rem] top-5 grid size-6 place-items-center rounded-full border-2 border-primary bg-background font-mono text-[0.65rem] font-bold text-primary">
                {i + 1}
              </span>
              {studioChange && (
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-star/40 bg-star/10 px-3 py-1 text-xs font-medium text-star">
                  <ArrowRightLeft aria-hidden className="size-3.5" /> Studio change: {studioChange.from} → {studioChange.to}
                </p>
              )}
              <Link href={`/anime/${summary.slug}`} className="group grid gap-4 rounded-xl border bg-card/50 p-4 transition-colors hover:border-primary/40 sm:grid-cols-[6.5rem_1fr]">
                <PosterArt slug={summary.slug} title={summary.title} native={summary.title_native} format={summary.format} glyph={summary.season_number ? String(summary.season_number) : undefined} size="sm" />
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{FORMAT_LABEL[summary.format]}</Badge>
                    {summary.season_number && <Badge variant="outline">Season {summary.season_number}</Badge>}
                    <StatusBadge status={summary.status} />
                    <ProvenanceBadge provenance={summary.provenance} />
                  </div>
                  <h2 className="text-lg font-semibold group-hover:text-primary">{summary.title}</h2>
                  <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Aired</dt>
                      <dd className="font-mono text-xs leading-5">
                        {summary.premiere_date ? formatDateRange(summary.premiere_date, summary.finale_date) : (summary.premiere_year ?? "Date pending")}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Season</dt>
                      <dd>{summary.premiere ? formatSeason(summary.premiere) : "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Studio</dt>
                      <dd>{summary.studios.map((s) => s.name).join(", ") || "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Episodes</dt>
                      <dd>{summary.episode_count ?? "—"}</dd>
                    </div>
                    {director.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Director</dt>
                        <dd>{director.map((d) => d.name).join(", ")}</dd>
                      </div>
                    )}
                    {music.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Music</dt>
                        <dd>{music.map((m) => m.name).join(", ")}</dd>
                      </div>
                    )}
                  </dl>
                  {dub && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Languages aria-hidden className="size-3.5" /> English dub from {formatDate(dub.start_date, "short")}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
        <aside className="space-y-8">
          {franchise.description && (
            <Panel title="About">
              <p className="text-sm leading-relaxed text-muted-foreground">{franchise.description}</p>
            </Panel>
          )}
          <Panel title="Seasons on the calendar">
            <ul className="space-y-1.5 text-sm">
              {timeline
                .filter((t) => t.summary.premiere)
                .map((t) => (
                  <li key={t.summary.id}>
                    <Link href={seasonHref(t.summary.premiere!)} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                      <Clapperboard aria-hidden className="size-3.5" /> {formatSeason(t.summary.premiere!)}
                    </Link>
                  </li>
                ))}
            </ul>
          </Panel>
          {detail.linked.length > 0 && (
            <Panel title="Linked outside the franchise">
              <ul className="space-y-2 text-sm">
                {detail.linked.map((l) => (
                  <li key={l.summary.id}>
                    <Link href={`/anime/${l.summary.slug}`} className="flex items-center gap-2 hover:text-primary">
                      <Link2 aria-hidden className="size-3.5" /> {RELATION_LABEL[l.relation]}: {l.summary.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
